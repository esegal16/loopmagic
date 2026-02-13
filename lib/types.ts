/**
 * Core TypeScript types for LoopMagic Deal Underwriting
 * Based on LoopNet's JSON-LD structured data (schema.org RealEstateListing)
 */

// ============================================================================
// Property Data (Scraped from LoopNet)
// ============================================================================

export interface PropertyData {
  // Core identification
  url: string;
  listingId: string;
  propertyName: string;
  address: Address;

  // Financial data
  price: number;
  priceFormatted: string; // e.g., "$8,000,000"
  pricePerUnit?: number;
  pricePerSF?: number;
  capRate?: string; // e.g., "5.5%"
  noi?: number; // Net Operating Income
  grossIncome?: number;
  marketRent?: number; // Market rent per unit per month
  operatingExpenses?: number;
  expenseRatio?: number; // e.g., 0.38 = 38% expense ratio
  occupancyRate?: number; // e.g., 1.0 = 100% occupied

  // Property details
  propertyType: string; // e.g., "Multifamily", "Office", "Retail"
  propertySubtype?: string; // e.g., "Apartment", "Medical Office"
  buildingSize: number; // in square feet
  buildingSizeFormatted: string; // e.g., "19,235 SF"
  lotSize?: string; // e.g., "0.55 AC"
  units?: number; // Number of units (for multifamily)

  // Building characteristics
  yearBuilt?: number;
  yearRenovated?: number;
  numberOfStories?: number;
  buildingClass?: string; // e.g., "A", "B", "C"
  occupancy?: string; // e.g., "100%"
  zoning?: string;

  // Amenities and features
  amenities?: string[];
  parkingRatio?: string;

  // Additional metrics
  walkScore?: number;

  // Marketing
  description: string;
  photos: Photo[];

  // Broker information
  brokers: Broker[];

  // Metadata
  dateModified?: string; // ISO date
  dateScraped: string; // ISO date

  // Raw data for debugging
  rawJSON?: any;
}

export interface Address {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string; // Formatted: "2162 SW 14th Ter, Miami, FL 33145"
  country?: string;
}

export interface Photo {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface Broker {
  name: string;
  company?: string;
  photo?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// Data Cleaner Output (Extracted from LoopNet)
// ============================================================================

export interface ExtractedAssumptions {
  monthly_rent_per_unit: number | null;
  occupancy_current: number | null;
  occupancy_stabilized: number | null;
  opex_pct: number | null;
  management_fee_pct: number | null;
  other_revenue_pct: number | null;
  rent_growth: number | null;
  stated_noi: number | null;  // for comparison only
  stated_cap_rate: number | null;
  confidence: {
    monthly_rent: 'high' | 'medium' | 'low' | null;
    occupancy: 'high' | 'medium' | 'low' | null;
    opex: 'high' | 'medium' | 'low' | null;
  };
}

// ============================================================================
// Final Merged Assumptions (Extracted + Defaults)
// ============================================================================

export interface FinalAssumptions {
  // Acquisition
  closing_costs_pct: number;  // 0.02

  // Financing
  ltv: number;                // 0.65
  interest_rate: number;      // 0.055
  amortization_years: number; // 30
  io_period_years: number;    // 2

  // Exit
  exit_cap_rate: number;      // = going_in_cap
  sale_costs_pct: number;     // 0.02
  hold_period_years: number;  // 5

  // Revenue
  year1_occupancy: number;    // 0.85
  stabilized_occupancy: number; // 0.95
  monthly_rent_per_unit: number;
  rent_growth: number;        // 0.03
  other_revenue_pct: number;  // 0.10
  other_revenue_growth: number; // 0.025

  // Expenses
  opex_pct: number;           // 0.40
  opex_growth: number;        // 0.025
  management_fee_pct: number; // 0.04
  capex_pct: number;          // 0.05
  capex_growth: number;       // 0.02

  // Metadata
  sources: Record<string, 'extracted' | 'default'>;
}

// ============================================================================
// Deal Analysis Types (from Analyzer Module)
// ============================================================================

export interface DealAnalysis {
  executiveSummary: string;

  keyMetrics: {
    metric: string;
    value: string;
    assessment: 'strong' | 'moderate' | 'weak';
    commentary: string;
  }[];

  risks: {
    category: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    mitigation?: string;
  }[];

  strengths: string[];
  weaknesses: string[];

  marketContext: {
    capRateComparison: string;
    returnsBenchmark: string;
    marketTrends: string;
  };

  recommendation: {
    verdict: 'buy' | 'pass' | 'negotiate';
    reasoning: string;
    keyConditions?: string[];
    suggestedPrice?: number;
    suggestedPriceReasoning?: string;
  };

  generatedAt: string;
  modelUsed: string;
}

export interface ExcelMetrics {
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
  exit: {
    exitCapRate: number | null;
    holdPeriodYears: number | null;
    netSaleProceeds: number | null;
  };
  cashOnCash: number | null;
  averageAnnualCashFlow: {
    unlevered: number | null;
    levered: number | null;
  };
}

export interface AnalysisResult {
  property: PropertyData;
  assumptions: FinalAssumptions;
  excelMetrics: ExcelMetrics;
  dealAnalysis: DealAnalysis;
  excelBuffer: Buffer;
  filename: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AnalyzeRequest {
  loopnetUrl: string;
  assumptionOverrides?: Partial<FinalAssumptions>;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: {
    analysisId: string;
    property: PropertyData;
    assumptions: FinalAssumptions;
    excelMetrics: ExcelMetrics;
    dealAnalysis: DealAnalysis;
    downloadUrl: string;
  };
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    processingTimeMs: number;
  };
}

// ============================================================================
// Scraping Types
// ============================================================================

export interface ScrapingResult {
  success: boolean;
  html?: string;
  error?: string;
  creditsUsed?: number;
  metadata?: {
    scrapedAt: string;
    responseTimeMs: number;
  };
}

// ============================================================================
// Excel Generation Types
// ============================================================================

export interface ExcelGenerationOptions {
  property: PropertyData;
  assumptions: FinalAssumptions;
  includePhotos?: boolean; // Default: true, limit to 5
  includeCharts?: boolean; // Default: false (Phase 1 feature)
}

export interface ExcelGenerationResult {
  success: boolean;
  buffer?: Buffer;
  filename: string;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class LoopMagicError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'LoopMagicError';
  }
}

export class ScrapingError extends LoopMagicError {
  constructor(message: string, details?: any) {
    super(message, 'SCRAPING_ERROR', 500, details);
    this.name = 'ScrapingError';
  }
}

export class ExcelGenerationError extends LoopMagicError {
  constructor(message: string, details?: any) {
    super(message, 'EXCEL_ERROR', 500, details);
    this.name = 'ExcelGenerationError';
  }
}
