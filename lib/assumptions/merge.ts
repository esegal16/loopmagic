import { ExtractedAssumptions, FinalAssumptions, PropertyData } from '../types';

const DEFAULTS: Omit<FinalAssumptions, 'monthly_rent_per_unit' | 'sources'> = {
  closing_costs_pct: 0.02,
  ltv: 0.65,
  interest_rate: 0.055,
  amortization_years: 30,
  io_period_years: 2,
  exit_cap_rate: 0.055,
  sale_costs_pct: 0.02,
  hold_period_years: 5,
  year1_occupancy: 0.85,
  stabilized_occupancy: 0.95,
  rent_growth: 0.03,
  other_revenue_pct: 0.10,
  other_revenue_growth: 0.025,
  opex_pct: 0.40,
  opex_growth: 0.025,
  management_fee_pct: 0.04,
  capex_pct: 0.05,
  capex_growth: 0.02,
};

export function mergeAssumptions(
  extracted: ExtractedAssumptions,
  property: PropertyData
): FinalAssumptions {
  // Derive rent using hierarchy from arch doc
  const monthly_rent = deriveMonthlyRent(extracted, property);

  return {
    ...DEFAULTS,
    monthly_rent_per_unit: monthly_rent,
    year1_occupancy: extracted.occupancy_current ?? DEFAULTS.year1_occupancy,
    stabilized_occupancy: extracted.occupancy_stabilized ?? DEFAULTS.stabilized_occupancy,
    opex_pct: extracted.opex_pct ?? DEFAULTS.opex_pct,
    management_fee_pct: extracted.management_fee_pct ?? DEFAULTS.management_fee_pct,
    other_revenue_pct: extracted.other_revenue_pct ?? DEFAULTS.other_revenue_pct,
    rent_growth: extracted.rent_growth ?? DEFAULTS.rent_growth,
    sources: buildSourcesMap(extracted),
  };
}

function deriveMonthlyRent(extracted: ExtractedAssumptions, property: PropertyData): number {
  // 1. Extracted from description
  if (extracted.monthly_rent_per_unit) return extracted.monthly_rent_per_unit;

  // 2. Back-calculate from gross income
  if (property.grossIncome && property.units) {
    return property.grossIncome / property.units / 12;
  }

  // 3. Back-calculate from cap rate
  if (property.capRate && property.price && property.units) {
    const capRate = parseFloat(property.capRate.replace('%', '')) / 100;
    const impliedNOI = property.price * capRate;
    const impliedEGI = impliedNOI / (1 - 0.40); // assume 40% opex
    return impliedEGI / property.units / 12;
  }

  // 4. Fallback: Use 1% monthly rent rule (market-based estimate)
  // Assumes monthly rent ≈ 1% of purchase price per unit
  // Example: $380K/unit → ~$3,800/month
  if (property.price && property.units) {
    const pricePerUnit = property.price / property.units;
    return pricePerUnit * 0.01; // 1% rule
  }

  // 5. No data available - throw error
  throw new Error('Cannot derive monthly rent. Insufficient property data (missing price or units).');
}

function buildSourcesMap(extracted: ExtractedAssumptions): Record<string, 'extracted' | 'default'> {
  return {
    monthly_rent_per_unit: extracted.monthly_rent_per_unit !== null ? 'extracted' : 'default',
    year1_occupancy: extracted.occupancy_current !== null ? 'extracted' : 'default',
    stabilized_occupancy: extracted.occupancy_stabilized !== null ? 'extracted' : 'default',
    opex_pct: extracted.opex_pct !== null ? 'extracted' : 'default',
    management_fee_pct: extracted.management_fee_pct !== null ? 'extracted' : 'default',
    other_revenue_pct: extracted.other_revenue_pct !== null ? 'extracted' : 'default',
    rent_growth: extracted.rent_growth !== null ? 'extracted' : 'default',
  };
}
