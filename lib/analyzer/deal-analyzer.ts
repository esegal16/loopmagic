/**
 * Deal Analyzer for LoopMagic
 * Claude-powered investment analysis that generates detailed deal memos
 */

import Anthropic from '@anthropic-ai/sdk';
import { PropertyData, FinalAssumptions } from '../types';
import { ExcelMetrics } from './excel-reader';

// ============================================================================
// Types
// ============================================================================

export interface DealAnalysis {
  // I. Executive Summary
  executiveSummary: string;

  // II. Investment Thesis
  investmentThesis: string;

  // III. Market & Submarket
  marketAndSubmarket: string;

  // IV. Financial Analysis
  financialAnalysis: {
    narrative: string;
    metrics: {
      metric: string;
      value: string;
      assessment: 'strong' | 'moderate' | 'weak';
      commentary: string;
    }[];
  };

  // V. Value-Add & Upside
  valueAddAndUpside: string;

  // VI. Risk Matrix
  riskMatrix: {
    risk: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];

  // VII. Recommendation
  recommendation: {
    verdict: 'pursue' | 'watch' | 'pass';
    reasoning: string;
    keyConditions: string[];
    dueDiligenceItems: string[];
  };

  // Metadata
  generatedAt: string;
  modelUsed: string;
}

export interface AnalyzerOptions {
  verbose?: boolean;
}

// ============================================================================
// Claude Client
// ============================================================================

const anthropic = new Anthropic();

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Analyzes a deal using Claude to generate investment recommendations
 */
export async function analyzeDeal(
  property: PropertyData,
  assumptions: FinalAssumptions,
  excelMetrics: ExcelMetrics,
  options: AnalyzerOptions = {}
): Promise<DealAnalysis> {
  const { verbose = false } = options;

  if (verbose) {
    console.log('Starting deal analysis with Claude...');
  }

  const prompt = buildAnalysisPrompt(property, assumptions, excelMetrics);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response
  const analysis = parseAnalysisResponse(textContent.text);

  return {
    ...analysis,
    generatedAt: new Date().toISOString(),
    modelUsed: 'claude-sonnet-4-5-20250929',
  };
}

// ============================================================================
// Prompt Builder
// ============================================================================

function buildAnalysisPrompt(
  property: PropertyData,
  assumptions: FinalAssumptions,
  metrics: ExcelMetrics
): string {
  const formatCurrency = (val: number | null): string => {
    if (val === null) return 'N/A';
    return val >= 1000000
      ? `$${(val / 1000000).toFixed(2)}M`
      : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatPct = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatMultiple = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${val.toFixed(2)}x`;
  };

  return `You are an expert commercial real estate investment analyst. Analyze the following multifamily property investment opportunity and provide a comprehensive investment memo.

## PROPERTY INFORMATION

**Address:** ${property.address.fullAddress}
**Property Type:** ${property.propertyType}${property.propertySubtype ? ` - ${property.propertySubtype}` : ''}
**Units:** ${property.units || 'N/A'}
**Building Size:** ${property.buildingSizeFormatted}
**Year Built:** ${property.yearBuilt || 'Unknown'}${property.yearRenovated ? ` (Renovated: ${property.yearRenovated})` : ''}
**Building Class:** ${property.buildingClass || 'Unknown'}

**Listing Description:**
${property.description.substring(0, 1500)}${property.description.length > 1500 ? '...' : ''}

## ACQUISITION DETAILS

**Purchase Price:** ${formatCurrency(metrics.acquisition.purchasePrice)}
**Price Per Unit:** ${formatCurrency(metrics.acquisition.pricePerUnit)}
**Price Per SF:** ${formatCurrency(metrics.acquisition.pricePerSF)}
**Total Acquisition Cost:** ${formatCurrency(metrics.acquisition.totalAcquisitionCost)}
**Going-in Cap Rate:** ${formatPct(metrics.acquisition.goingInCapRate)}

## FINANCING STRUCTURE

**Loan-to-Value:** ${formatPct(assumptions.ltv)}
**Loan Amount:** ${formatCurrency(metrics.acquisition.loanAmount)}
**Interest Rate:** ${formatPct(assumptions.interest_rate)}
**Amortization:** ${assumptions.amortization_years} years
**IO Period:** ${assumptions.io_period_years} years
**Equity Required:** ${formatCurrency(metrics.acquisition.equityRequired)}

## UNDERWRITING ASSUMPTIONS

**Revenue:**
- Year 1 Occupancy: ${formatPct(assumptions.year1_occupancy)}
- Stabilized Occupancy: ${formatPct(assumptions.stabilized_occupancy)}
- Monthly Rent Per Unit: ${formatCurrency(assumptions.monthly_rent_per_unit)}
- Annual Rent Growth: ${formatPct(assumptions.rent_growth)}
- Other Revenue: ${formatPct(assumptions.other_revenue_pct)} of rent

**Expenses:**
- Operating Expenses: ${formatPct(assumptions.opex_pct)} of EGI
- Management Fee: ${formatPct(assumptions.management_fee_pct)} of EGI
- CapEx Reserves: ${formatPct(assumptions.capex_pct)} of rent
- Expense Growth: ${formatPct(assumptions.opex_growth)} annually

**Exit:**
- Hold Period: ${assumptions.hold_period_years} years
- Exit Cap Rate: ${formatPct(assumptions.exit_cap_rate)}
- Sale Costs: ${formatPct(assumptions.sale_costs_pct)}

## PROJECTED RETURNS

**IRR (Levered):** ${formatPct(metrics.irr.levered)}
**IRR (Unlevered):** ${formatPct(metrics.irr.unlevered)}
**Equity Multiple:** ${formatMultiple(metrics.equityMultiple.levered)}
**Cash-on-Cash (Year 1):** ${formatPct(metrics.cashOnCash)}
**Total Profit:** ${formatCurrency(metrics.profit.levered)}

## YEAR 1 OPERATIONS

**Effective Gross Income:** ${formatCurrency(metrics.year1.effectiveGrossIncome)}
**Net Operating Income:** ${formatCurrency(metrics.year1.noi)}
**NOI Margin:** ${formatPct(metrics.year1.noiMargin)}
**Debt Service Coverage Ratio:** ${metrics.year1.dscr?.toFixed(2) || 'N/A'}
**Year 1 Cash Flow (Levered):** ${formatCurrency(metrics.year1.leveredCashFlow)}

## EXIT ANALYSIS

**Exit Cap Rate:** ${formatPct(metrics.exit.exitCapRate)}
**Net Sale Proceeds:** ${formatCurrency(metrics.exit.netSaleProceeds)}

---

Provide your analysis as a JSON object following this 7-section investment committee memo format:

{
  "executiveSummary": "One paragraph. State the opportunity, headline returns, and your initial recommendation. End with: 'Based on the financial profile, this deal is a [PURSUE/WATCH/PASS].' followed by a one-sentence justification.",

  "investmentThesis": "What is the core bet? Why does this deal create or destroy value? Frame it the way you'd pitch to an investment committee in 60 seconds. Be specific to THIS property — not generic.",

  "marketAndSubmarket": "Analyze macro and micro dynamics for this specific location. Demand drivers, supply pipeline risk, employment/population trends, rent growth trajectory. Reference the city, submarket, and neighborhood.",

  "financialAnalysis": {
    "narrative": "Build the return story. How does entry cap compare to the seller's claim? What does the proforma cap look like post-stabilization? Where is the return coming from — cash flow, appreciation, or both?",
    "metrics": [
      {
        "metric": "e.g. 'Levered IRR'",
        "value": "e.g. '18.5%'",
        "assessment": "strong|moderate|weak",
        "commentary": "Why this is strong/moderate/weak for this property type and market"
      }
    ]
  },

  "valueAddAndUpside": "Model the business plan. What does rent growth, occupancy improvement, or expense reduction look like? What is the realistic delta between in-place NOI and stabilized NOI? How long does lease-up or renovation take? Be conservative.",

  "riskMatrix": [
    {
      "risk": "Specific risk description",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "mitigation": "Your proposed mitigation"
    }
  ],

  "recommendation": {
    "verdict": "pursue|watch|pass",
    "reasoning": "2-3 sentences explaining the recommendation",
    "keyConditions": ["3 conditions that must be true for this deal to work"],
    "dueDiligenceItems": ["5 critical due diligence items to verify before moving forward"]
  }
}

## EVALUATION CRITERIA

Use these benchmarks when assessing the deal:

**Returns Benchmarks (Multifamily):**
- Target Levered IRR: 15-20% (strong), 12-15% (moderate), <12% (weak)
- Target Cash-on-Cash (Y1): >8% (strong), 5-8% (moderate), <5% (weak)
- Target Equity Multiple: >2.0x (strong), 1.5-2.0x (moderate), <1.5x (weak)

**Operating Metrics:**
- DSCR: >1.30 (strong), 1.15-1.30 (moderate), <1.15 (concerning)
- Going-in Cap Rate: Market-dependent, but compare to exit cap rate spread
- NOI Margin: >55% (strong), 45-55% (typical), <45% (expense concerns)

**Risk Factors to Consider:**
- Cap rate compression/expansion risk
- Interest rate sensitivity
- Renovation/value-add execution risk
- Market supply/demand dynamics
- Property age and condition
- Management intensity

VERDICT DEFINITIONS:
- PURSUE: The deal meets return thresholds and risks are manageable. Worth moving to LOI.
- WATCH: Returns are borderline or data is insufficient. Monitor for price reduction or new information.
- PASS: Returns are inadequate, risks too high, or fundamentals are broken.

Include exactly 5 entries in riskMatrix, 3 entries in keyConditions, and 5 entries in dueDiligenceItems.
Include at minimum these metrics in financialAnalysis.metrics: Entry Cap Rate, Pro Forma Cap Rate, Levered IRR, Equity Multiple, DSCR.

IMPORTANT: Respond ONLY with a valid, complete JSON object. No additional text before or after the JSON. Ensure all strings are properly escaped and the JSON is syntactically correct.`;
}

// ============================================================================
// Response Parser
// ============================================================================

function parseAnalysisResponse(text: string): Omit<DealAnalysis, 'generatedAt' | 'modelUsed'> {
  // Try to extract JSON from the response
  let jsonStr = text.trim();

  // Handle markdown code blocks
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  // Find JSON object boundaries
  const startIdx = jsonStr.indexOf('{');
  const endIdx = jsonStr.lastIndexOf('}');

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Could not find JSON object in Claude response');
  }

  jsonStr = jsonStr.slice(startIdx, endIdx + 1);

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.executiveSummary) {
      throw new Error('Missing executiveSummary in analysis');
    }
    if (!parsed.recommendation?.verdict) {
      throw new Error('Missing recommendation verdict in analysis');
    }

    // Ensure new IC memo fields have defaults
    parsed.investmentThesis = parsed.investmentThesis || '';
    parsed.marketAndSubmarket = parsed.marketAndSubmarket || '';
    parsed.financialAnalysis = parsed.financialAnalysis || { narrative: '', metrics: [] };
    parsed.financialAnalysis.metrics = parsed.financialAnalysis.metrics || [];
    parsed.valueAddAndUpside = parsed.valueAddAndUpside || '';
    parsed.riskMatrix = parsed.riskMatrix || [];
    parsed.recommendation.keyConditions = parsed.recommendation.keyConditions || [];
    parsed.recommendation.dueDiligenceItems = parsed.recommendation.dueDiligenceItems || [];

    return parsed;
  } catch (error) {
    console.error('Failed to parse Claude response:', text.substring(0, 500));
    throw new Error(`Failed to parse analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a DealAnalysis for display
 */
export function formatAnalysis(analysis: DealAnalysis): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('INVESTMENT COMMITTEE MEMO');
  lines.push(`Generated: ${new Date(analysis.generatedAt).toLocaleString()}`);
  lines.push('='.repeat(60));

  lines.push('\n## I. EXECUTIVE SUMMARY\n');
  lines.push(analysis.executiveSummary);

  lines.push('\n## II. INVESTMENT THESIS\n');
  lines.push(analysis.investmentThesis);

  lines.push('\n## III. MARKET & SUBMARKET\n');
  lines.push(analysis.marketAndSubmarket);

  lines.push('\n## IV. FINANCIAL ANALYSIS\n');
  lines.push(analysis.financialAnalysis.narrative);
  if (analysis.financialAnalysis.metrics.length > 0) {
    lines.push('');
    analysis.financialAnalysis.metrics.forEach((m) => {
      const badge = m.assessment === 'strong' ? '[+]' : m.assessment === 'weak' ? '[-]' : '[~]';
      lines.push(`${badge} ${m.metric}: ${m.value}`);
      lines.push(`   ${m.commentary}`);
    });
  }

  lines.push('\n## V. VALUE-ADD & UPSIDE\n');
  lines.push(analysis.valueAddAndUpside);

  lines.push('\n## VI. RISK MATRIX\n');
  analysis.riskMatrix.forEach((r) => {
    lines.push(`[P:${r.probability.toUpperCase()}] [I:${r.impact.toUpperCase()}] ${r.risk}`);
    lines.push(`   Mitigation: ${r.mitigation}`);
  });

  lines.push('\n## VII. RECOMMENDATION\n');
  const verdict = analysis.recommendation.verdict.toUpperCase();
  lines.push(`[${verdict}] ${verdict}`);
  lines.push(analysis.recommendation.reasoning);

  if (analysis.recommendation.keyConditions.length > 0) {
    lines.push('\nKey Conditions:');
    analysis.recommendation.keyConditions.forEach((c) => lines.push(`  - ${c}`));
  }

  if (analysis.recommendation.dueDiligenceItems.length > 0) {
    lines.push('\nDue Diligence Items:');
    analysis.recommendation.dueDiligenceItems.forEach((d) => lines.push(`  - ${d}`));
  }

  return lines.join('\n');
}
