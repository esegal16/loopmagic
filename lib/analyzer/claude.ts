/**
 * Claude AI Analyzer
 * Generates comprehensive deal underwriting analysis for real estate properties
 */

import Anthropic from '@anthropic-ai/sdk';
import { PropertyData, AnalysisResult, AnalysisError } from '../types';

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 2000;
const TEMPERATURE = 0.3;

/**
 * Analyze a property using Claude AI
 * @param property - PropertyData from LoopNet scraper
 * @returns AnalysisResult with comprehensive deal analysis
 */
export async function analyzeProperty(property: PropertyData): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnalysisError('ANTHROPIC_API_KEY not found in environment variables');
  }

  console.log(`🤖 Analyzing property: ${property.propertyName}`);
  console.log(`   Using model: ${CLAUDE_MODEL}`);

  const client = new Anthropic({ apiKey });

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(property);

  try {
    const startTime = Date.now();

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Analysis complete (${duration}ms)`);
    console.log(`   Input tokens: ${message.usage.input_tokens}`);
    console.log(`   Output tokens: ${message.usage.output_tokens}`);
    console.log(`   Total tokens: ${message.usage.input_tokens + message.usage.output_tokens}`);

    // Extract the response text
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      throw new AnalysisError('Claude returned empty response');
    }

    // Parse the structured response
    const analysisResult = parseAnalysisResponse(responseText, message);

    console.log(`✅ Parsed analysis:`);
    console.log(`   Recommendation: ${analysisResult.recommendation}`);
    console.log(`   Confidence: ${analysisResult.confidenceLevel}`);
    console.log(`   Key takeaways: ${analysisResult.keyTakeaways.length}`);

    return analysisResult;

  } catch (error: any) {
    if (error instanceof AnalysisError) {
      throw error;
    }

    // Handle Anthropic API errors
    if (error.status) {
      throw new AnalysisError(
        `Claude API error (${error.status}): ${error.message}`,
        { status: error.status, type: error.type }
      );
    }

    throw new AnalysisError(`Analysis failed: ${error.message}`, {
      originalError: error.message
    });
  }
}

/**
 * Build comprehensive analysis prompt for Claude
 */
function buildAnalysisPrompt(property: PropertyData): string {
  // Format property details for analysis
  const details = formatPropertyDetails(property);

  return `You are an experienced commercial real estate underwriter. Analyze this property listing and provide a comprehensive deal underwriting analysis.

# PROPERTY DETAILS

${details}

# YOUR TASK

Provide a thorough investment analysis with the following structure:

## 1. EXECUTIVE SUMMARY
A 2-3 sentence high-level overview of the opportunity and your recommendation.

## 2. RECOMMENDATION
Choose one: "Strong Buy", "Buy", "Hold", "Pass", or "Avoid"

## 3. CONFIDENCE LEVEL
Choose one: "High", "Medium", or "Low"
Explain what factors contribute to this confidence level.

## 4. FINANCIAL ANALYSIS
Analyze the deal's financial metrics:
- Assess the asking price relative to market (is it fair, overpriced, underpriced?)
- Price per unit analysis (if applicable)
- Price per square foot analysis
- Estimated return metrics (if enough data is available)
- Cash flow potential
${property.capRate ? `- Cap rate analysis: ${property.capRate}` : '- Note: Cap rate not provided by seller'}

## 5. MARKET INSIGHTS
Evaluate the property's market position:
- Location quality (use Walk Score: ${property.walkScore || 'N/A'})
- Neighborhood characteristics (${property.address.city}, ${property.address.state})
- Market trends for ${property.propertyType} properties
- Competitive positioning
- Growth potential

## 6. RISK ASSESSMENT
Identify key risks and concerns:
- Major red flags or concerns
- Market risks
- Property-specific risks
- Mitigation strategies

## 7. VALUE-ADD OPPORTUNITIES
List specific opportunities to increase property value or income:
${property.occupancy !== '100%' ? '- Note: Current occupancy is ' + property.occupancy : '- Property is fully occupied'}
${property.yearRenovated ? `- Recently renovated in ${property.yearRenovated}` : property.yearBuilt ? `- Built in ${property.yearBuilt}, consider renovation potential` : ''}

## 8. KEY TAKEAWAYS
Provide 5-7 bullet points summarizing the most important insights.

# OUTPUT FORMAT

Use clear markdown formatting. Be specific and data-driven. If certain information is missing, note it and provide analysis based on available data. Be honest about limitations in the analysis.

Focus on actionable insights that would help an investor make a decision.`;
}

/**
 * Format property details for the prompt
 */
function formatPropertyDetails(property: PropertyData): string {
  const sections = [];

  // Basic Information
  sections.push(`**Property Name:** ${property.propertyName}`);
  sections.push(`**Address:** ${property.address.fullAddress}`);
  sections.push(`**Property Type:** ${property.propertyType}${property.propertySubtype ? ` (${property.propertySubtype})` : ''}`);
  sections.push(`**LoopNet URL:** ${property.url}`);

  // Pricing
  sections.push(`\n**Asking Price:** ${property.priceFormatted}`);
  if (property.pricePerUnit) {
    sections.push(`**Price Per Unit:** $${property.pricePerUnit.toLocaleString()}`);
  }
  if (property.pricePerSF) {
    sections.push(`**Price Per SF:** $${property.pricePerSF.toFixed(2)}`);
  }

  // Property Characteristics
  sections.push(`\n**Building Size:** ${property.buildingSizeFormatted}`);
  if (property.lotSize) {
    sections.push(`**Lot Size:** ${property.lotSize}`);
  }
  if (property.units) {
    sections.push(`**Number of Units:** ${property.units}`);
  }
  if (property.numberOfStories) {
    sections.push(`**Stories:** ${property.numberOfStories}`);
  }

  // Building Details
  if (property.yearBuilt) {
    sections.push(`\n**Year Built:** ${property.yearBuilt}`);
  }
  if (property.yearRenovated) {
    sections.push(`**Year Renovated:** ${property.yearRenovated}`);
  }
  if (property.buildingClass) {
    sections.push(`**Building Class:** ${property.buildingClass}`);
  }
  if (property.occupancy) {
    sections.push(`**Occupancy:** ${property.occupancy}`);
  }
  if (property.zoning) {
    sections.push(`**Zoning:** ${property.zoning}`);
  }

  // Financial Metrics
  if (property.capRate || property.noi) {
    sections.push('');
    if (property.capRate) {
      sections.push(`**Cap Rate:** ${property.capRate}`);
    }
    if (property.noi) {
      sections.push(`**NOI:** $${property.noi.toLocaleString()}`);
    }
  }

  // Location & Amenities
  if (property.walkScore) {
    sections.push(`\n**Walk Score:** ${property.walkScore}/100`);
  }
  if (property.parkingRatio) {
    sections.push(`**Parking Ratio:** ${property.parkingRatio}`);
  }

  // Amenities
  if (property.amenities && property.amenities.length > 0) {
    sections.push(`\n**Amenities:** ${property.amenities.join(', ')}`);
  }

  // Description
  if (property.description) {
    sections.push(`\n**Marketing Description:**\n${property.description}`);
  }

  // Broker Info
  if (property.brokers && property.brokers.length > 0) {
    const brokersList = property.brokers
      .map(b => `${b.name}${b.company ? ` (${b.company})` : ''}`)
      .join(', ');
    sections.push(`\n**Listed By:** ${brokersList}`);
  }

  return sections.join('\n');
}

/**
 * Parse Claude's response into AnalysisResult structure
 */
function parseAnalysisResponse(
  responseText: string,
  message: Anthropic.Message
): AnalysisResult {
  // Extract key sections using regex and parsing

  // Extract recommendation
  const recommendationMatch = responseText.match(/(?:recommendation|choose one):\s*["']?(Strong Buy|Buy|Hold|Pass|Avoid)["']?/i);
  const recommendation = (recommendationMatch?.[1] as AnalysisResult['recommendation']) || 'Hold';

  // Extract confidence level
  const confidenceMatch = responseText.match(/(?:confidence level|confidence):\s*["']?(High|Medium|Low)["']?/i);
  const confidenceLevel = (confidenceMatch?.[1] as AnalysisResult['confidenceLevel']) || 'Medium';

  // Extract executive summary (first few sentences after "EXECUTIVE SUMMARY")
  const summaryMatch = responseText.match(/(?:EXECUTIVE SUMMARY|1\.\s*EXECUTIVE SUMMARY)[:\n]+(.+?)(?=\n#|##|\n\n[A-Z])/s);
  const summary = summaryMatch?.[1]?.trim() || 'Analysis completed.';

  // Extract key takeaways (bullet points in that section)
  const takeawaysMatch = responseText.match(/(?:KEY TAKEAWAYS|8\.\s*KEY TAKEAWAYS)[:\n]+([\s\S]+?)(?=\n#|$)/i);
  const keyTakeaways = extractBulletPoints(takeawaysMatch?.[1] || '');

  // Extract value-add opportunities
  const valueAddMatch = responseText.match(/(?:VALUE-ADD OPPORTUNITIES|7\.\s*VALUE-ADD OPPORTUNITIES)[:\n]+([\s\S]+?)(?=\n#|##|\n\n[A-Z])/i);
  const valueAddOpportunities = extractBulletPoints(valueAddMatch?.[1] || '');

  // Extract major risks/concerns
  const risksMatch = responseText.match(/(?:RISK ASSESSMENT|6\.\s*RISK ASSESSMENT)[:\n]+([\s\S]+?)(?=\n#|##|\n\n[A-Z])/i);
  const risksText = risksMatch?.[1] || '';
  const majorConcerns = extractBulletPoints(risksText);

  // Build structured result
  const result: AnalysisResult = {
    summary: summary.substring(0, 500), // Limit length
    recommendation,
    confidenceLevel,

    financialMetrics: {
      estimatedROI: extractMetric(responseText, 'ROI'),
      cashOnCashReturn: extractMetric(responseText, 'Cash on Cash|Cash-on-Cash'),
      debtServiceCoverageRatio: extractMetric(responseText, 'DSCR|Debt Service Coverage'),
      capRateAnalysis: extractSection(responseText, 'Cap Rate Analysis|Cap rate analysis'),
      comparableMarketAnalysis: extractSection(responseText, 'Comparable|Market Analysis'),
    },

    marketInsights: {
      locationQuality: extractSection(responseText, 'Location|Location quality') || 'See detailed analysis',
      marketTrends: extractSection(responseText, 'Market trends|Trends') || 'See detailed analysis',
      competitivePosition: extractSection(responseText, 'Competitive|Positioning') || 'See detailed analysis',
      growthPotential: extractSection(responseText, 'Growth|Growth potential') || 'See detailed analysis',
    },

    risks: {
      summary: risksText.substring(0, 500),
      majorConcerns: majorConcerns.length > 0 ? majorConcerns : ['See detailed analysis'],
      mitigationStrategies: extractBulletPoints(extractSection(responseText, 'Mitigation') || ''),
    },

    valueAddOpportunities: valueAddOpportunities.length > 0
      ? valueAddOpportunities
      : ['See detailed analysis'],

    keyTakeaways: keyTakeaways.length > 0
      ? keyTakeaways
      : ['Analysis complete. Review full report for details.'],

    detailedAnalysis: responseText,

    analysisDate: new Date().toISOString(),
    modelUsed: CLAUDE_MODEL,
    tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
  };

  return result;
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  if (!text) return [];

  const lines = text.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match various bullet formats: -, *, •, numbers
    if (trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
      const content = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
      if (content.length > 0) {
        bullets.push(content);
      }
    }
  }

  return bullets.slice(0, 10); // Limit to 10 bullets
}

/**
 * Extract a specific metric from text
 */
function extractMetric(text: string, metricPattern: string): string | undefined {
  const regex = new RegExp(`(?:${metricPattern})[:\\s]+([\\d.]+%?)`, 'i');
  const match = text.match(regex);
  return match?.[1];
}

/**
 * Extract a section of text
 */
function extractSection(text: string, sectionPattern: string): string | undefined {
  const regex = new RegExp(`(?:${sectionPattern})[:\\s]+(.+?)(?=\\n[-*•]|\\n\\n|$)`, 'is');
  const match = text.match(regex);
  return match?.[1]?.trim();
}
