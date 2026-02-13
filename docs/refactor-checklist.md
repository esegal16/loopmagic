# LoopMagic v2 Refactor Checklist
**Date:** 02/12/2026

## Overview
Refactor codebase from v1 (AI analysis approach) to v2 (proforma calculator approach) as defined in `arch braindump.md` and `backend.md`.

---

## Files to DELETE

| File | Reason |
|------|--------|
| `lib/analyzer/claude.ts` | AI analysis is Phase 2, not needed for v2 |

---

## Files to REWRITE

### `lib/types.ts`

**Remove:**
- `AnalysisResult` interface (entire thing, lines 96-139)
- `AnalysisError` class (lines 232-237)
- `ExcelGenerationOptions.analysis` field (line 197)

**Add:**
```typescript
// Data Cleaner Output
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

// Final merged assumptions (extracted + defaults)
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

// Updated API response
export interface AnalyzeResponse {
  success: boolean;
  data?: {
    analysisId: string;
    property: PropertyData;
    assumptions: FinalAssumptions;
    downloadUrl: string;
  };
  error?: { code: string; message: string; };
  metadata: { processingTimeMs: number; };
}
```

---

### `lib/cleaner/data-cleaner.ts`

**Current:** Extracts NOI, gross income, market rent, opex, expense ratio, occupancy → returns enriched `PropertyData`

**Change to:**
- Expand extraction to include: `rent_growth`, `management_fee_pct`, `other_revenue_pct`
- Add confidence flags per field
- Change return type from `PropertyData` to `ExtractedAssumptions`
- Update Claude prompt to extract all fields from arch doc schema

---

### `lib/excel/generator.ts`

**Current:** 1,076 lines, generates proforma + analysis tabs, hardcodes all formulas

**Change to:**
- Template-based approach (clone `/templates/LoopMagic Template.xlsx`)
- Populate cells B4-B47 with property data + assumptions
- Formulas already exist in template, just fill values
- Target: ~200 lines

**Cell mapping:**
| Cell | Field | Source |
|------|-------|--------|
| B4 | Address | property.address.fullAddress |
| B5 | City | property.address.city + state |
| B6 | Property Type | property.propertyType |
| B7 | Units | property.units |
| B8 | Rentable SF | property.buildingSize |
| B11 | Purchase Price | property.price |
| B14 | Going-in Cap Rate | property.capRate (parsed) |
| B12 | Closing Costs % | assumptions.closing_costs_pct |
| B19 | LTV | assumptions.ltv |
| B21 | Interest Rate | assumptions.interest_rate |
| B22 | Amortization | assumptions.amortization_years |
| B23 | IO Period | assumptions.io_period_years |
| B27 | Exit Cap Rate | assumptions.exit_cap_rate |
| B28 | Sale Costs % | assumptions.sale_costs_pct |
| B29 | Hold Period | assumptions.hold_period_years |
| B32 | Year 1 Occupancy | assumptions.year1_occupancy |
| B33 | Stabilized Occupancy | assumptions.stabilized_occupancy |
| B34 | Monthly Rent / Unit | assumptions.monthly_rent_per_unit |
| B35 | Annual Rent Growth | assumptions.rent_growth |
| B36 | Other Revenue % | assumptions.other_revenue_pct |
| B38 | Other Revenue Growth | assumptions.other_revenue_growth |
| B41 | OpEx % | assumptions.opex_pct |
| B43 | OpEx Growth | assumptions.opex_growth |
| B44 | Management Fee % | assumptions.management_fee_pct |
| B45 | CapEx % | assumptions.capex_pct |
| B47 | CapEx Growth | assumptions.capex_growth |

---

## Files to CREATE

### `lib/assumptions/merge.ts`
```typescript
import { ExtractedAssumptions, FinalAssumptions, PropertyData } from '../types';

const DEFAULTS: Omit<FinalAssumptions, 'monthly_rent_per_unit' | 'exit_cap_rate' | 'sources'> = {
  closing_costs_pct: 0.02,
  ltv: 0.65,
  interest_rate: 0.055,
  amortization_years: 30,
  io_period_years: 2,
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

  // Exit cap = going-in cap (default)
  const goingInCap = property.capRate
    ? parseFloat(property.capRate.replace('%', '')) / 100
    : 0.05;

  return {
    ...DEFAULTS,
    monthly_rent_per_unit: monthly_rent,
    exit_cap_rate: goingInCap,
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

  // 4. Flag error - require manual input
  throw new Error('Cannot derive monthly rent. Manual input required.');
}
```

---

### `lib/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

### `lib/supabase/storage.ts`
```typescript
import { supabase } from './client';

export async function uploadExcel(
  analysisId: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const path = `${analysisId}/${filename}`;

  const { error } = await supabase.storage
    .from('excel-files')
    .upload(path, buffer, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  if (error) throw error;

  const { data } = supabase.storage.from('excel-files').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveAnalysis(record: {
  loopnet_url: string;
  address: string;
  city: string;
  property_type: string;
  units: number;
  rentable_sf: number;
  purchase_price: number;
  extracted_assumptions: object;
  final_assumptions: object;
  excel_file_path: string;
  scrape_duration_ms: number;
  cleaner_duration_ms: number;
  total_duration_ms: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('analyses')
    .insert(record)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
```

---

### `templates/LoopMagic Template.xlsx`
Copy from `/Users/etyensegal/Downloads/LoopMagic Template.xlsx`

---

## Summary Table

| File | Action |
|------|--------|
| `lib/analyzer/claude.ts` | DELETE |
| `lib/types.ts` | REWRITE |
| `lib/cleaner/data-cleaner.ts` | UPDATE |
| `lib/assumptions/merge.ts` | CREATE |
| `lib/excel/generator.ts` | REWRITE |
| `lib/supabase/client.ts` | CREATE |
| `lib/supabase/storage.ts` | CREATE |
| `templates/LoopMagic Template.xlsx` | ADD |

---

## Verification

1. **Unit test assumptions merge:**
   - Test rent derivation hierarchy (extracted → gross income → cap rate → error)
   - Test defaults apply when extracted is null

2. **Integration test:**
   - Scrape real LoopNet URL
   - Run through cleaner → merge → excel generator
   - Open generated Excel, verify formulas calculate correctly

3. **Supabase test:**
   - Upload file to storage
   - Save analysis record
   - Retrieve via public URL
