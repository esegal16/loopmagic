/**
 * Excel Reader for LoopMagic Deal Analysis
 * Extracts calculated metrics from generated Excel proforma
 */

import ExcelJS from 'exceljs';

// ============================================================================
// Types
// ============================================================================

export interface ExcelMetrics {
  // Returns Summary
  irr: {
    unlevered: number | null;
    levered: number | null;
  };
  equityMultiple: {
    unlevered: number | null;
    levered: number | null;
  };
  profit: {
    unlevered: number | null;
    levered: number | null;
  };

  // Year 1 Operating Metrics
  year1: {
    effectiveGrossIncome: number | null;
    totalOperatingExpenses: number | null;
    noi: number | null;
    noiMargin: number | null;
    yieldOnCost: number | null;
    capexReserves: number | null;
    totalDebtService: number | null;
    dscr: number | null;
    unleveredCashFlow: number | null;
    leveredCashFlow: number | null;
  };

  // Acquisition Metrics
  acquisition: {
    purchasePrice: number | null;
    closingCostsPct: number | null;
    totalAcquisitionCost: number | null;
    goingInCapRate: number | null;
    pricePerUnit: number | null;
    pricePerSF: number | null;
    loanAmount: number | null;
    equityRequired: number | null;
  };

  // Exit Metrics (at hold period end)
  exit: {
    exitCapRate: number | null;
    holdPeriodYears: number | null;
    netSaleProceeds: number | null;
  };

  // Cash-on-Cash Yield (Year 1 Levered CF / Equity)
  cashOnCash: number | null;

  // Average Annual Cash Flow
  averageAnnualCashFlow: {
    unlevered: number | null;
    levered: number | null;
  };
}

// ============================================================================
// Cell Mappings (based on LoopMagic 2.xlsx template)
// ============================================================================

const CELL_MAP = {
  // Returns Summary (rows 50-52)
  irr: { unlevered: 'E50', levered: 'F50' },
  equityMultiple: { unlevered: 'E51', levered: 'F51' },
  profit: { unlevered: 'E52', levered: 'F52' },

  // Acquisition (rows 11-24)
  purchasePrice: 'B11',
  closingCostsPct: 'B12',
  totalAcquisitionCost: 'B13',
  goingInCapRate: 'B14',
  pricePerUnit: 'B15',
  pricePerSF: 'B16',
  loanAmount: 'B20',
  equityRequired: 'B24',

  // Exit (rows 27-29)
  exitCapRate: 'B27',
  holdPeriodYears: 'B29',

  // Year 1 Operating (column F, row numbers)
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

  // Net Sale Proceeds at exit (depends on hold period, columns F-J for years 1-5)
  // Will be calculated dynamically based on hold period
};

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Reads an Excel buffer and extracts calculated metrics
 * @param buffer - The Excel file buffer (from generateExcel)
 * @returns ExcelMetrics with all calculated values
 */
export async function readExcelMetrics(buffer: Buffer | ArrayBuffer): Promise<ExcelMetrics> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Excel workbook has no sheets');
  }

  // Helper to get numeric value from cell
  const getNum = (address: string): number | null => {
    const cell = sheet.getCell(address);
    const value = cell.value;

    // Handle formula results
    if (typeof value === 'object' && value !== null) {
      if ('result' in value) {
        const result = value.result;
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return result;
        }
        return null;
      }
    }

    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[,$%]/g, ''));
      if (!isNaN(parsed) && isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  };

  // Get hold period to find the right column for exit metrics
  const holdPeriodYears = getNum(CELL_MAP.holdPeriodYears) || 5;

  // Exit column is F for year 1, G for year 2, etc.
  // So for hold period of 5, exit column is J (column index 10)
  const exitColumnIndex = 5 + holdPeriodYears; // F=6, G=7, H=8, I=9, J=10
  const exitColumn = String.fromCharCode(64 + exitColumnIndex); // Convert to letter

  // Net Sale Proceeds cell (row 40 based on template)
  const netSaleProceedsCell = `${exitColumn}40`;

  // Calculate average annual cash flows
  let totalUnleveredCF = 0;
  let totalLeveredCF = 0;
  let validYears = 0;

  for (let year = 1; year <= holdPeriodYears; year++) {
    const col = String.fromCharCode(69 + year); // F=70, so 69+1=F, etc.
    const unlevered = getNum(`${col}44`);
    const levered = getNum(`${col}45`);

    if (unlevered !== null) {
      totalUnleveredCF += unlevered;
    }
    if (levered !== null && typeof levered === 'number') {
      totalLeveredCF += levered;
      validYears++;
    }
  }

  const avgUnleveredCF = validYears > 0 ? totalUnleveredCF / holdPeriodYears : null;
  const avgLeveredCF = validYears > 0 ? totalLeveredCF / validYears : null;

  // Calculate Cash-on-Cash yield (Year 1 Levered CF / Equity Required)
  const year1LeveredCF = getNum(CELL_MAP.year1.leveredCashFlow);
  const equityRequired = getNum(CELL_MAP.equityRequired);
  const cashOnCash =
    year1LeveredCF !== null && equityRequired !== null && equityRequired !== 0
      ? year1LeveredCF / equityRequired
      : null;

  return {
    irr: {
      unlevered: getNum(CELL_MAP.irr.unlevered),
      levered: getNum(CELL_MAP.irr.levered),
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

/**
 * Formats metrics for display or logging
 */
export function formatMetrics(metrics: ExcelMetrics): string {
  const fmt = (val: number | null, type: 'pct' | 'currency' | 'multiple' | 'num' = 'num'): string => {
    if (val === null) return 'N/A';
    switch (type) {
      case 'pct':
        return `${(val * 100).toFixed(2)}%`;
      case 'currency':
        return val >= 1000000
          ? `$${(val / 1000000).toFixed(2)}M`
          : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      case 'multiple':
        return `${val.toFixed(2)}x`;
      default:
        return val.toFixed(2);
    }
  };

  return `
=== RETURNS SUMMARY ===
IRR (Levered):        ${fmt(metrics.irr.levered, 'pct')}
IRR (Unlevered):      ${fmt(metrics.irr.unlevered, 'pct')}
Equity Multiple:      ${fmt(metrics.equityMultiple.levered, 'multiple')}
Cash-on-Cash (Y1):    ${fmt(metrics.cashOnCash, 'pct')}
Profit (Levered):     ${fmt(metrics.profit.levered, 'currency')}

=== ACQUISITION ===
Purchase Price:       ${fmt(metrics.acquisition.purchasePrice, 'currency')}
Total Acquisition:    ${fmt(metrics.acquisition.totalAcquisitionCost, 'currency')}
Going-in Cap Rate:    ${fmt(metrics.acquisition.goingInCapRate, 'pct')}
Equity Required:      ${fmt(metrics.acquisition.equityRequired, 'currency')}
Loan Amount:          ${fmt(metrics.acquisition.loanAmount, 'currency')}

=== YEAR 1 OPERATIONS ===
NOI:                  ${fmt(metrics.year1.noi, 'currency')}
NOI Margin:           ${fmt(metrics.year1.noiMargin, 'pct')}
DSCR:                 ${fmt(metrics.year1.dscr, 'num')}
Levered Cash Flow:    ${fmt(metrics.year1.leveredCashFlow, 'currency')}

=== EXIT (Year ${metrics.exit.holdPeriodYears}) ===
Exit Cap Rate:        ${fmt(metrics.exit.exitCapRate, 'pct')}
Net Sale Proceeds:    ${fmt(metrics.exit.netSaleProceeds, 'currency')}
`.trim();
}
