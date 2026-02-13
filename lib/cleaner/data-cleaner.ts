import Anthropic from '@anthropic-ai/sdk';
import { PropertyData, ExtractedAssumptions } from '../types';

export async function cleanPropertyData(property: PropertyData): Promise<ExtractedAssumptions> {
  console.log('\n🧹 Extracting assumptions with Claude...');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables');
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildExtractionPrompt(property);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.1, // Low temperature for factual extraction
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Parse extracted assumptions
  const extracted = parseExtractedAssumptions(responseText);

  console.log('✅ Assumption extraction complete:');
  if (extracted.monthly_rent_per_unit) console.log(`   Monthly Rent/Unit: $${extracted.monthly_rent_per_unit}`);
  if (extracted.occupancy_current !== null) console.log(`   Current Occupancy: ${(extracted.occupancy_current * 100).toFixed(0)}%`);
  if (extracted.occupancy_stabilized !== null) console.log(`   Stabilized Occupancy: ${(extracted.occupancy_stabilized * 100).toFixed(0)}%`);
  if (extracted.opex_pct !== null) console.log(`   OpEx %: ${(extracted.opex_pct * 100).toFixed(1)}%`);
  if (extracted.management_fee_pct !== null) console.log(`   Mgmt Fee %: ${(extracted.management_fee_pct * 100).toFixed(1)}%`);
  if (extracted.other_revenue_pct !== null) console.log(`   Other Revenue %: ${(extracted.other_revenue_pct * 100).toFixed(1)}%`);
  if (extracted.rent_growth !== null) console.log(`   Rent Growth: ${(extracted.rent_growth * 100).toFixed(1)}%`);
  if (extracted.stated_noi !== null) console.log(`   Stated NOI: $${extracted.stated_noi.toLocaleString()}`);

  return extracted;
}

function buildExtractionPrompt(property: PropertyData): string {
  return `You are a data extraction specialist for commercial real estate deal underwriting. Your job is to extract financial assumptions from property listings.

# PROPERTY DETAILS

**Address:** ${property.address.fullAddress}
**Property Type:** ${property.propertyType}
**Price:** ${property.priceFormatted}
**Cap Rate:** ${property.capRate || 'Not provided'}
**Units:** ${property.units || 'N/A'}
**Size:** ${property.buildingSizeFormatted}

**Description:**
${property.description}

# YOUR TASK

Extract ALL financial assumptions that are explicitly stated in the description. Do NOT calculate or estimate - only extract what is clearly stated.

Look for:

1. **Monthly Rent per Unit**:
   - "$X per unit per month"
   - "$X/month average rent"
   - "rents average $X"
   - "market rent of $X"

2. **Current Occupancy**:
   - "X% occupied"
   - "currently X% leased"
   - "X% physical occupancy"

3. **Stabilized Occupancy**:
   - "stabilized at X%"
   - "projected X% occupancy"

4. **Operating Expense Ratio (OpEx %)**:
   - "X% expense ratio"
   - "X% operating expenses"
   - "OpEx of X%"

5. **Management Fee %**:
   - "X% management fee"
   - "property management at X%"

6. **Other Revenue %**:
   - "X% other income"
   - "ancillary revenue of X%"
   - "parking/laundry at X%"

7. **Annual Rent Growth**:
   - "X% annual rent increase"
   - "X% rent growth"
   - "rents growing at X%"

8. **Stated NOI** (for comparison):
   - "$X in NOI"
   - "$X NOI"
   - "NOI of $X"

9. **Stated Cap Rate** (for comparison):
   - Already in property.capRate if available

# CONFIDENCE LEVELS

For each extracted field, assess confidence:
- **high**: Explicitly stated with clear numbers
- **medium**: Implied or calculated from other stated metrics
- **low**: Vague or ambiguous reference

# OUTPUT FORMAT

Return ONLY a JSON object with the extracted values. Use null for any metric not found.

{
  "monthly_rent_per_unit": 2200,
  "occupancy_current": 0.85,
  "occupancy_stabilized": 0.95,
  "opex_pct": 0.40,
  "management_fee_pct": 0.04,
  "other_revenue_pct": 0.10,
  "rent_growth": 0.03,
  "stated_noi": 400000,
  "stated_cap_rate": 0.055,
  "confidence": {
    "monthly_rent": "high",
    "occupancy": "medium",
    "opex": "low"
  }
}

If no financial data is found, return:
{
  "monthly_rent_per_unit": null,
  "occupancy_current": null,
  "occupancy_stabilized": null,
  "opex_pct": null,
  "management_fee_pct": null,
  "other_revenue_pct": null,
  "rent_growth": null,
  "stated_noi": null,
  "stated_cap_rate": null,
  "confidence": {
    "monthly_rent": null,
    "occupancy": null,
    "opex": null
  }
}

JSON:`;
}

function parseExtractedAssumptions(responseText: string): ExtractedAssumptions {
  try {
    // Extract JSON from response (might have extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️  No JSON found in Claude response');
      return createEmptyAssumptions();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('📊 Extracted fields:', Object.keys(parsed).filter(k => parsed[k] != null && k !== 'confidence'));

    return {
      monthly_rent_per_unit: parsed.monthly_rent_per_unit ?? null,
      occupancy_current: parsed.occupancy_current ?? null,
      occupancy_stabilized: parsed.occupancy_stabilized ?? null,
      opex_pct: parsed.opex_pct ?? null,
      management_fee_pct: parsed.management_fee_pct ?? null,
      other_revenue_pct: parsed.other_revenue_pct ?? null,
      rent_growth: parsed.rent_growth ?? null,
      stated_noi: parsed.stated_noi ?? null,
      stated_cap_rate: parsed.stated_cap_rate ?? null,
      confidence: {
        monthly_rent: parsed.confidence?.monthly_rent ?? null,
        occupancy: parsed.confidence?.occupancy ?? null,
        opex: parsed.confidence?.opex ?? null,
      },
    };
  } catch (e) {
    console.error('❌ Failed to parse extracted assumptions:', e);
    return createEmptyAssumptions();
  }
}

function createEmptyAssumptions(): ExtractedAssumptions {
  return {
    monthly_rent_per_unit: null,
    occupancy_current: null,
    occupancy_stabilized: null,
    opex_pct: null,
    management_fee_pct: null,
    other_revenue_pct: null,
    rent_growth: null,
    stated_noi: null,
    stated_cap_rate: null,
    confidence: {
      monthly_rent: null,
      occupancy: null,
      opex: null,
    },
  };
}
