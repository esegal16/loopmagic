/**
 * Excel Generator for LoopMagic Deal Underwriting - V2
 * Template-based approach: Clones template and populates cells B4-B47
 * with property data and assumptions. Formulas already exist in template.
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import { PropertyData, FinalAssumptions, ExcelGenerationOptions, ExcelGenerationResult, ExcelGenerationError } from '../types';

// Path to template (relative to project root)
const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'LoopMagic 2.xlsx');

// ============================================================================
// Main Export Function
// ============================================================================

export async function generateExcel(options: ExcelGenerationOptions): Promise<ExcelGenerationResult> {
  try {
    const { property, assumptions } = options;

    // Load template workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    // Get the proforma sheet (should be first sheet)
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new Error('Template workbook has no sheets');
    }

    // Populate property data (B4-B10)
    populatePropertyData(sheet, property);

    // Populate acquisition assumptions (B11-B14)
    populateAcquisitionAssumptions(sheet, property, assumptions);

    // Populate financing assumptions (B19-B23)
    populateFinancingAssumptions(sheet, assumptions);

    // Populate exit assumptions (B27-B29)
    populateExitAssumptions(sheet, assumptions);

    // Populate revenue assumptions (B32-B38)
    populateRevenueAssumptions(sheet, assumptions);

    // Populate expense assumptions (B41-B47)
    populateExpenseAssumptions(sheet, assumptions);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const addressSlug = property.address.fullAddress
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const filename = `${addressSlug}-${timestamp}.xlsx`;

    // Recalculate on load to preserve named ranges and formula integrity
    workbook.calcProperties.fullCalcOnLoad = true;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      success: true,
      buffer: Buffer.from(buffer),
      filename,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error generating Excel file';
    throw new ExcelGenerationError(message, error);
  }
}

// ============================================================================
// Population Functions
// ============================================================================

function populatePropertyData(sheet: ExcelJS.Worksheet, property: PropertyData): void {
  // B4: Address
  setCellValue(sheet, 'B4', property.address.fullAddress);

  // B5: City
  const cityState = `${property.address.city}, ${property.address.state}`;
  setCellValue(sheet, 'B5', cityState);

  // B6: Property Type
  setCellValue(sheet, 'B6', property.propertyType);

  // B7: Units
  setCellValue(sheet, 'B7', property.units ?? 0);

  // B8: Rentable SF
  setCellValue(sheet, 'B8', property.buildingSize);
}

function populateAcquisitionAssumptions(
  sheet: ExcelJS.Worksheet,
  property: PropertyData,
  assumptions: FinalAssumptions
): void {
  // B11: Purchase Price
  setCellValue(sheet, 'B11', Math.round(property.price));

  // B12: Closing Costs %
  setCellValue(sheet, 'B12', assumptions.closing_costs_pct);

  // B14: Going-in Cap Rate - FORMULA using Year 0 NOI (F23)
  setCellFormula(sheet, 'B14', '=F23/B11');
}

function populateFinancingAssumptions(sheet: ExcelJS.Worksheet, assumptions: FinalAssumptions): void {
  // B19: LTV
  setCellValue(sheet, 'B19', assumptions.ltv);

  // B21: Interest Rate
  setCellValue(sheet, 'B21', assumptions.interest_rate);

  // B22: Amortization (years)
  setCellValue(sheet, 'B22', assumptions.amortization_years);

  // B23: IO Period (years)
  setCellValue(sheet, 'B23', assumptions.io_period_years);
}

function populateExitAssumptions(sheet: ExcelJS.Worksheet, assumptions: FinalAssumptions): void {
  // B27: Exit Cap Rate
  setCellValue(sheet, 'B27', assumptions.exit_cap_rate);

  // B28: Sale Costs %
  setCellValue(sheet, 'B28', assumptions.sale_costs_pct);

  // B29: Hold Period (years)
  setCellValue(sheet, 'B29', assumptions.hold_period_years);
}

function populateRevenueAssumptions(sheet: ExcelJS.Worksheet, assumptions: FinalAssumptions): void {
  // B32: Year 1 Occupancy
  setCellValue(sheet, 'B32', assumptions.year1_occupancy);

  // B33: Stabilized Occupancy
  setCellValue(sheet, 'B33', assumptions.stabilized_occupancy);

  // B34: Monthly Rent per Unit
  setCellValue(sheet, 'B34', assumptions.monthly_rent_per_unit);

  // B35: Annual Rent Growth
  setCellValue(sheet, 'B35', assumptions.rent_growth);

  // B36: Other Revenue %
  setCellValue(sheet, 'B36', assumptions.other_revenue_pct);

  // B38: Other Revenue Growth
  setCellValue(sheet, 'B38', assumptions.other_revenue_growth);
}

function populateExpenseAssumptions(sheet: ExcelJS.Worksheet, assumptions: FinalAssumptions): void {
  // B41: OpEx %
  setCellValue(sheet, 'B41', assumptions.opex_pct);

  // B43: OpEx Growth
  setCellValue(sheet, 'B43', assumptions.opex_growth);

  // B44: Management Fee %
  setCellValue(sheet, 'B44', assumptions.management_fee_pct);

  // B45: CapEx %
  setCellValue(sheet, 'B45', assumptions.capex_pct);

  // B47: CapEx Growth
  setCellValue(sheet, 'B47', assumptions.capex_growth);
}

// ============================================================================
// Helper Functions
// ============================================================================

function setCellValue(sheet: ExcelJS.Worksheet, address: string, value: string | number): void {
  const cell = sheet.getCell(address);
  cell.value = value;
}

function setCellFormula(sheet: ExcelJS.Worksheet, address: string, formula: string): void {
  const cell = sheet.getCell(address);
  cell.value = { formula: formula.startsWith('=') ? formula.slice(1) : formula };
}
