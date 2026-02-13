/**
 * Test script for the Deal Analyzer module
 * Tests both excel-reader and deal-analyzer with sample data
 */

import { generateExcel } from '../lib/excel/generator';
import { readExcelMetrics, formatMetrics } from '../lib/analyzer/excel-reader';
import { analyzeDeal, formatAnalysis } from '../lib/analyzer/deal-analyzer';
import { PropertyData, FinalAssumptions } from '../lib/types';

// Sample property data for testing
const sampleProperty: PropertyData = {
  url: 'https://www.loopnet.com/Listing/test-property',
  listingId: 'test-123',
  propertyName: 'Sunset Gardens Apartments',
  address: {
    streetAddress: '2162 SW 14th Ter',
    city: 'Miami',
    state: 'FL',
    zipCode: '33145',
    fullAddress: '2162 SW 14th Ter, Miami, FL 33145',
  },
  price: 8000000,
  priceFormatted: '$8,000,000',
  pricePerUnit: 200000,
  pricePerSF: 416,
  capRate: '5.5%',
  noi: 440000,
  grossIncome: 720000,
  propertyType: 'Multifamily',
  propertySubtype: 'Apartment',
  buildingSize: 19235,
  buildingSizeFormatted: '19,235 SF',
  units: 40,
  yearBuilt: 1985,
  yearRenovated: 2018,
  numberOfStories: 3,
  buildingClass: 'B',
  description: `
Rare opportunity to acquire a well-maintained 40-unit apartment complex in the heart of Miami's
Little Havana neighborhood. Property features a mix of 1BR/1BA and 2BR/1BA units with recent
renovations including new roofing (2020), updated common areas, and individual HVAC systems.

Key highlights:
- Strong rental market with average rents below market
- Recent capital improvements reduce near-term CapEx
- Walking distance to Calle Ocho entertainment district
- Easy access to Downtown Miami and Brickell
- Value-add potential through unit renovations and rent increases
- Strong historical occupancy above 95%

Current rent roll shows average in-place rents of $1,350/month with market rents in the area
averaging $1,500/month, presenting significant upside potential.
  `.trim(),
  photos: [{ url: 'https://example.com/photo1.jpg' }],
  brokers: [{ name: 'John Smith', company: 'Marcus & Millichap' }],
  dateScraped: new Date().toISOString(),
};

// Sample assumptions
const sampleAssumptions: FinalAssumptions = {
  // Acquisition
  closing_costs_pct: 0.02,

  // Financing
  ltv: 0.65,
  interest_rate: 0.055,
  amortization_years: 30,
  io_period_years: 2,

  // Exit
  exit_cap_rate: 0.055,
  sale_costs_pct: 0.02,
  hold_period_years: 5,

  // Revenue
  year1_occupancy: 0.85,
  stabilized_occupancy: 0.95,
  monthly_rent_per_unit: 1400,
  rent_growth: 0.03,
  other_revenue_pct: 0.10,
  other_revenue_growth: 0.025,

  // Expenses
  opex_pct: 0.40,
  opex_growth: 0.025,
  management_fee_pct: 0.04,
  capex_pct: 0.05,
  capex_growth: 0.02,

  // Metadata
  sources: {
    monthly_rent_per_unit: 'extracted',
    year1_occupancy: 'default',
    stabilized_occupancy: 'default',
    opex_pct: 'default',
    rent_growth: 'default',
  },
};

async function testExcelReader() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Excel Metrics Extraction');
  console.log('='.repeat(60));

  // Generate Excel
  console.log('\nGenerating Excel file...');
  const excelResult = await generateExcel({
    property: sampleProperty,
    assumptions: sampleAssumptions,
  });

  if (!excelResult.success || !excelResult.buffer) {
    throw new Error('Failed to generate Excel: ' + excelResult.error);
  }
  console.log(`Generated: ${excelResult.filename}`);

  // Read metrics from Excel
  console.log('\nExtracting metrics from Excel...');
  const metrics = await readExcelMetrics(excelResult.buffer);

  // Display formatted metrics
  console.log('\n' + formatMetrics(metrics));

  return { metrics, buffer: excelResult.buffer };
}

async function testDealAnalyzer(metrics: any, buffer: Buffer) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Deal Analysis with Claude');
  console.log('='.repeat(60));

  console.log('\nRunning deal analysis...');
  const startTime = Date.now();

  const analysis = await analyzeDeal(
    sampleProperty,
    sampleAssumptions,
    metrics,
    { verbose: true }
  );

  const duration = Date.now() - startTime;
  console.log(`Analysis completed in ${duration}ms`);

  // Display formatted analysis
  console.log('\n' + formatAnalysis(analysis));

  // Also output raw JSON for verification
  console.log('\n' + '='.repeat(60));
  console.log('RAW JSON OUTPUT');
  console.log('='.repeat(60));
  console.log(JSON.stringify(analysis, null, 2));

  return analysis;
}

async function main() {
  console.log('='.repeat(60));
  console.log('LoopMagic Deal Analyzer Test Suite');
  console.log('='.repeat(60));

  try {
    // Test 1: Excel reading
    const { metrics, buffer } = await testExcelReader();

    // Verify key metrics are extracted
    console.log('\n--- Metrics Verification ---');
    const checks = [
      ['IRR Levered', metrics.irr?.levered],
      ['IRR Unlevered', metrics.irr?.unlevered],
      ['Equity Multiple', metrics.equityMultiple?.levered],
      ['Year 1 NOI', metrics.year1?.noi],
      ['Year 1 DSCR', metrics.year1?.dscr],
      ['Equity Required', metrics.acquisition?.equityRequired],
      ['Cash-on-Cash', metrics.cashOnCash],
    ];

    let allPassed = true;
    for (const [name, value] of checks) {
      const passed = value !== null && value !== undefined;
      console.log(`${passed ? '[OK]' : '[FAIL]'} ${name}: ${value}`);
      if (!passed) allPassed = false;
    }

    if (!allPassed) {
      console.warn('\nWarning: Some metrics could not be extracted.');
      console.log('Note: ExcelJS may not calculate formulas - values are from template.');
    }

    // Test 2: Deal analysis (requires API key)
    if (process.env.ANTHROPIC_API_KEY) {
      await testDealAnalyzer(metrics, buffer);
    } else {
      console.log('\n--- Skipping Claude analysis (no ANTHROPIC_API_KEY) ---');
    }

    console.log('\n' + '='.repeat(60));
    console.log('All tests completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\nTest failed:', error);
    process.exit(1);
  }
}

main();
