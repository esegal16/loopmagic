/**
 * Excel Evaluator for LoopMagic Deal Analysis
 * Uses HyperFormula to evaluate Excel template formulas server-side,
 * replacing the cached-value approach in excel-reader.ts.
 *
 * Key challenges solved:
 * - ExcelJS shared formulas: resolved by shifting master formula column references
 * - OFFSET with dynamic width: replaced with concrete cell ranges
 * - IRR not in HyperFormula: computed via Newton-Raphson from evaluated cash flows
 */

import { HyperFormula } from 'hyperformula';
import ExcelJS from 'exceljs';
import { ExcelMetrics } from './excel-reader';

export type { ExcelMetrics };

const CELL_MAP = {
  irr: { unlevered: 'E50', levered: 'F50' },
  equityMultiple: { unlevered: 'E51', levered: 'F51' },
  profit: { unlevered: 'E52', levered: 'F52' },
  purchasePrice: 'B11',
  closingCostsPct: 'B12',
  totalAcquisitionCost: 'B13',
  goingInCapRate: 'B14',
  pricePerUnit: 'B15',
  pricePerSF: 'B16',
  loanAmount: 'B20',
  equityRequired: 'B24',
  exitCapRate: 'B27',
  holdPeriodYears: 'B29',
  year1: {
    effectiveGrossIncome: 'F10',
    totalOperatingExpenses: 'F19',
    noi: 'F23',
    noiMargin: 'F24',
    yieldOnCost: 'F25',
    capexReserves: 'F28',
    totalDebtService: 'F33',
    dscr: 'F34',
    unleveredCashFlow: 'F44',
    leveredCashFlow: 'F45',
  },
};

function parseCellAddress(address: string): { col: number; row: number } {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid cell address: ${address}`);
  let col = 0;
  for (const ch of match[1]) {
    col = col * 26 + (ch.charCodeAt(0) - 64);
  }
  return { col: col - 1, row: parseInt(match[2], 10) - 1 };
}

function colToLetter(col: number): string {
  // 1-based col index to letter (1=A, 2=B, etc.)
  let result = '';
  let c = col;
  while (c > 0) {
    c--;
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26);
  }
  return result;
}

/**
 * Shift non-absolute column references in a formula by `colDelta` columns.
 * E.g., shifting "F23-F28" by +1 → "G23-G28", but "$E$44" stays "$E$44".
 */
function shiftFormulaColumns(formula: string, colDelta: number): string {
  // Match cell references: optional $, column letters, optional $, row digits
  return formula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/g, (match, colAbs, colLetters, rowAbs, rowNum) => {
    if (colAbs === '$') {
      // Absolute column — don't shift
      return match;
    }
    // Convert column letters to number, shift, convert back
    let colNum = 0;
    for (const ch of colLetters) {
      colNum = colNum * 26 + (ch.charCodeAt(0) - 64);
    }
    const newCol = colNum + colDelta;
    if (newCol < 1) return match; // Guard
    return colToLetter(newCol) + rowAbs + rowNum;
  });
}

/**
 * Parse a shared formula ref like "G44:O44" to get the master column and range.
 */
function parseRef(ref: string): { startCol: number; startRow: number; endCol: number; endRow: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return null;
  const sc = parseCellAddress(match[1] + match[2]);
  const ec = parseCellAddress(match[3] + match[4]);
  return { startCol: sc.col, startRow: sc.row, endCol: ec.col, endRow: ec.row };
}

interface SharedFormulaInfo {
  masterFormula: string;
  masterCol: number; // 0-based
  masterRow: number; // 0-based
  range: { startCol: number; startRow: number; endCol: number; endRow: number };
}

/**
 * Build a 2D array for HyperFormula from an ExcelJS worksheet.
 * Resolves shared formulas and handles IRR/OFFSET cells specially.
 */
function buildHyperFormulaSheet(
  sheet: ExcelJS.Worksheet,
  holdPeriodYears: number
): (string | number | boolean | null)[][] {
  const maxRow = sheet.rowCount;
  let maxCol = 0;
  sheet.eachRow((row) => {
    if (row.cellCount > maxCol) maxCol = row.cellCount;
  });
  maxCol = Math.max(maxCol, 15);

  // First pass: collect shared formula masters
  const sharedFormulaMasters = new Map<string, SharedFormulaInfo>();

  sheet.eachRow((row, rowNum) => {
    row.eachCell((cell, colNum) => {
      const value = cell.value;
      if (typeof value === 'object' && value !== null && 'shareType' in value) {
        const v = value as { formula: string; ref: string; shareType: string };
        if (v.shareType === 'shared' && v.formula && v.ref) {
          const addr = colToLetter(colNum) + rowNum;
          const range = parseRef(v.ref);
          if (range) {
            sharedFormulaMasters.set(addr, {
              masterFormula: v.formula,
              masterCol: colNum - 1, // 0-based
              masterRow: rowNum - 1, // 0-based
              range,
            });
          }
        }
      }
    });
  });

  // Build 2D array
  const data: (string | number | boolean | null)[][] = [];

  for (let r = 1; r <= maxRow; r++) {
    const rowData: (string | number | boolean | null)[] = [];
    const row = sheet.getRow(r);

    for (let c = 1; c <= maxCol; c++) {
      const cell = row.getCell(c);
      const value = cell.value;

      if (value === null || value === undefined) {
        rowData.push(null);
        continue;
      }

      if (typeof value === 'object' && value !== null && ('formula' in value || 'sharedFormula' in value)) {
        const v = value as {
          formula?: string;
          sharedFormula?: string;
          result?: unknown;
          shareType?: string;
          ref?: string;
        };

        if (v.formula) {
          // Check for IRR formulas — skip, we compute manually
          if (v.formula.includes('IRR(')) {
            rowData.push(null);
          }
          // Check for OFFSET with dynamic width ($B$29) — replace with concrete range
          else if (v.formula.includes('OFFSET(') && v.formula.includes('$B$29')) {
            const replaced = resolveOffsetFormula(v.formula, holdPeriodYears, r, c);
            rowData.push(replaced ? `=${replaced}` : null);
          } else {
            rowData.push(`=${v.formula}`);
          }
        } else if (v.sharedFormula) {
          // Resolve shared formula from master
          const master = sharedFormulaMasters.get(v.sharedFormula);
          if (master) {
            const colDelta = (c - 1) - master.masterCol;
            const shifted = shiftFormulaColumns(master.masterFormula, colDelta);

            if (shifted.includes('IRR(')) {
              rowData.push(null);
            } else if (shifted.includes('OFFSET(') && shifted.includes('$B$29')) {
              const replaced = resolveOffsetFormula(shifted, holdPeriodYears, r, c);
              rowData.push(replaced ? `=${replaced}` : null);
            } else {
              rowData.push(`=${shifted}`);
            }
          } else {
            rowData.push(null);
          }
        } else {
          rowData.push(null);
        }
        continue;
      }

      if (typeof value === 'number') {
        rowData.push(value);
      } else if (typeof value === 'boolean') {
        rowData.push(value);
      } else if (typeof value === 'string') {
        rowData.push(value);
      } else if (value instanceof Date) {
        const epoch = new Date(1899, 11, 30).getTime();
        rowData.push((value.getTime() - epoch) / 86400000);
      } else {
        rowData.push(null);
      }
    }

    data.push(rowData);
  }

  return data;
}

/**
 * Replace OFFSET-based formulas with concrete cell ranges.
 *
 * Patterns in the template:
 * - SUM(OFFSET($F$44,0,0,1,$B$29))    → SUM(F44:K44) for hold=6
 * - SUM(OFFSET($F$45,0,0,1,$B$29))    → SUM(F45:K45)
 * - SUM(OFFSET(E44,0,0,1,$B$29+1))    → SUM(E44:L44) for hold=7
 * - SUM(OFFSET($F$44,0,0,1,$B$29))/-$E$44  → SUM(F44:K44)/-$E$44
 */
function resolveOffsetFormula(
  formula: string,
  holdPeriodYears: number,
  _row: number,
  _col: number
): string | null {
  // Replace OFFSET(...) calls with concrete ranges
  return formula.replace(
    /OFFSET\((\$?)([A-Z]+)(\$?)(\d+),\s*0,\s*0,\s*1,\s*\$B\$29(\+1)?\)/g,
    (_match, _colAbs, colLetters, _rowAbs, rowNum, plusOne) => {
      const width = plusOne ? holdPeriodYears + 1 : holdPeriodYears;
      // Starting column number (1-based)
      let startColNum = 0;
      for (const ch of colLetters) {
        startColNum = startColNum * 26 + (ch.charCodeAt(0) - 64);
      }
      const endColNum = startColNum + width - 1;
      const endColLetter = colToLetter(endColNum);
      return `${colLetters}${rowNum}:${endColLetter}${rowNum}`;
    }
  );
}

/**
 * Newton-Raphson IRR calculation.
 */
function calculateIRR(cashFlows: number[], guess: number = 0.1, maxIter: number = 100, tol: number = 1e-7): number | null {
  const hasPositive = cashFlows.some((v) => v > 0);
  const hasNegative = cashFlows.some((v) => v < 0);
  if (!hasPositive || !hasNegative) return null;

  let rate = guess;

  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    if (Math.abs(dnpv) < 1e-15) return null;
    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
    if (rate < -1 || rate > 10) return null;
  }

  return null;
}

/**
 * Evaluates the Excel template's formulas using HyperFormula and returns computed metrics.
 * This replaces readExcelMetrics() which only reads stale cached values.
 */
export async function evaluateExcelMetrics(buffer: Buffer | ArrayBuffer): Promise<ExcelMetrics> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Excel workbook has no sheets');
  }

  // Read hold period from the raw cell value (it's a plain number, not a formula)
  const holdPeriodCell = sheet.getCell('B29');
  const holdPeriodYears = typeof holdPeriodCell.value === 'number' ? holdPeriodCell.value : 5;

  // Build and evaluate with HyperFormula
  const sheetData = buildHyperFormulaSheet(sheet, holdPeriodYears);

  const hf = HyperFormula.buildFromSheets(
    { 'Acquisition Model': sheetData },
    { licenseKey: 'gpl-v3' }
  );

  const sheetId = hf.getSheetId(hf.getSheetName(0)!)!;

  const getNum = (address: string): number | null => {
    const { col, row } = parseCellAddress(address);
    const value = hf.getCellValue({ sheet: sheetId, col, row });
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[,$%]/g, ''));
      if (!isNaN(parsed) && isFinite(parsed)) return parsed;
    }
    return null;
  };

  // Compute IRR manually from cash flow rows
  // Row 44 = unlevered CF, Row 45 = levered CF
  // Column E (0-based: 4) = Year 0, F = Year 1, etc.
  const unleveredCFs: number[] = [];
  const leveredCFs: number[] = [];

  for (let year = 0; year <= holdPeriodYears; year++) {
    const col = 4 + year;
    const uVal = hf.getCellValue({ sheet: sheetId, col, row: 43 });
    const lVal = hf.getCellValue({ sheet: sheetId, col, row: 44 });
    unleveredCFs.push(typeof uVal === 'number' ? uVal : 0);
    leveredCFs.push(typeof lVal === 'number' ? lVal : 0);
  }

  const unleveredIRR = calculateIRR(unleveredCFs);
  const leveredIRR = calculateIRR(leveredCFs);

  // Average annual cash flows (years 1..N, excluding year 0)
  let totalUnleveredCF = 0;
  let totalLeveredCF = 0;
  let validYears = 0;

  for (let year = 1; year <= holdPeriodYears; year++) {
    const col = String.fromCharCode(69 + year); // F, G, H, ...
    const unlevered = getNum(`${col}44`);
    const levered = getNum(`${col}45`);
    if (unlevered !== null) totalUnleveredCF += unlevered;
    if (levered !== null) {
      totalLeveredCF += levered;
      validYears++;
    }
  }

  const avgUnleveredCF = validYears > 0 ? totalUnleveredCF / holdPeriodYears : null;
  const avgLeveredCF = validYears > 0 ? totalLeveredCF / validYears : null;

  // Cash-on-Cash yield
  const year1LeveredCF = getNum(CELL_MAP.year1.leveredCashFlow);
  const equityRequired = getNum(CELL_MAP.equityRequired);
  const cashOnCash =
    year1LeveredCF !== null && equityRequired !== null && equityRequired !== 0
      ? year1LeveredCF / equityRequired
      : null;

  // Exit column for net sale proceeds
  const exitColumnIndex = 5 + holdPeriodYears;
  const exitColumn = String.fromCharCode(64 + exitColumnIndex);
  const netSaleProceedsCell = `${exitColumn}40`;

  hf.destroy();

  return {
    irr: {
      unlevered: unleveredIRR,
      levered: leveredIRR,
    },
    equityMultiple: {
      unlevered: getNum(CELL_MAP.equityMultiple.unlevered),
      levered: getNum(CELL_MAP.equityMultiple.levered),
    },
    profit: {
      unlevered: getNum(CELL_MAP.profit.unlevered),
      levered: getNum(CELL_MAP.profit.levered),
    },
    year1: {
      effectiveGrossIncome: getNum(CELL_MAP.year1.effectiveGrossIncome),
      totalOperatingExpenses: getNum(CELL_MAP.year1.totalOperatingExpenses),
      noi: getNum(CELL_MAP.year1.noi),
      noiMargin: getNum(CELL_MAP.year1.noiMargin),
      yieldOnCost: getNum(CELL_MAP.year1.yieldOnCost),
      capexReserves: getNum(CELL_MAP.year1.capexReserves),
      totalDebtService: getNum(CELL_MAP.year1.totalDebtService),
      dscr: getNum(CELL_MAP.year1.dscr),
      unleveredCashFlow: getNum(CELL_MAP.year1.unleveredCashFlow),
      leveredCashFlow: year1LeveredCF,
    },
    acquisition: {
      purchasePrice: getNum(CELL_MAP.purchasePrice),
      closingCostsPct: getNum(CELL_MAP.closingCostsPct),
      totalAcquisitionCost: getNum(CELL_MAP.totalAcquisitionCost),
      goingInCapRate: getNum(CELL_MAP.goingInCapRate),
      pricePerUnit: getNum(CELL_MAP.pricePerUnit),
      pricePerSF: getNum(CELL_MAP.pricePerSF),
      loanAmount: getNum(CELL_MAP.loanAmount),
      equityRequired: equityRequired,
    },
    exit: {
      exitCapRate: getNum(CELL_MAP.exitCapRate),
      holdPeriodYears: holdPeriodYears,
      netSaleProceeds: getNum(netSaleProceedsCell),
    },
    cashOnCash: cashOnCash,
    averageAnnualCashFlow: {
      unlevered: avgUnleveredCF,
      levered: avgLeveredCF,
    },
  };
}
