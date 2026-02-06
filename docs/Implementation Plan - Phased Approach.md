---
parent: "[[Deal Underwriting Microapp - PRD]]"
type: planning
status: active
created: 2026-02-05
---

# Deal Microapp - Phased Implementation Plan

## Philosophy

Build and validate the core value proposition (LoopNet scraping + AI analysis) before adding auth, personalization, and payment complexity. Each phase should be independently testable and valuable.

---

## Phase 0: Core Analysis Tool (MVP)

**Goal:** Prove the scraping + analysis pipeline works and delivers value.

**Timeline:** 1-2 weeks

### Scope

**What's In:**
- LoopNet scraper (Playwright/Puppeteer)
- Generic Claude analysis (property summary, risk flags, opportunities, quick take)
- Excel file generation (3 tabs: Property Details, Analysis, Photos)
- Simple web UI:
  - Landing page with URL input
  - Loading state (30-60 sec)
  - Download button
  - Error handling (invalid URL, scraping failed)
- Deployed publicly (Vercel/Railway + simple backend)
- No auth, no rate limiting, no user accounts

**What's Out:**
- User authentication
- Investment criteria collection
- Personalized analysis
- Analysis history/dashboard
- Payment/freemium gating
- Settings pages

### Technical Stack

**Frontend:**
- React (Vite) or Next.js
- Single page: URL input → loading → download
- Hosted on Vercel

**Backend:**
- Node.js/Python (FastAPI or Express)
- LoopNet scraper (Playwright for dynamic content)
- Claude API integration
- Excel generation (exceljs or openpyxl)
- Temporary file storage (local or S3 with 24hr expiry)
- Hosted on Railway or similar

**No Database Required** (stateless)

### Data Flow

```
User pastes URL
    ↓
Frontend validates URL format
    ↓
Backend receives URL
    ↓
Scrape LoopNet listing
    ↓
Extract: address, price, cap rate, NOI, units, sqft, photos, description
    ↓
Send to Claude API (generic analysis prompt)
    ↓
Generate Excel file (3 tabs)
    ↓
Store temp file (24hr auto-delete)
    ↓
Return download URL to frontend
    ↓
User downloads Excel
```

### Claude Prompt (Generic, No Personalization)

```
You are a real estate acquisitions analyst. Review this property listing and provide:

1. **Property Summary** (2-3 sentences): What is this asset and where is it positioned in the market?

2. **Risk Flags** (bullet list): Identify any red flags or concerns from the listing:
   - Deferred maintenance indicators
   - Market timing issues
   - Pricing concerns
   - Occupancy/tenant issues
   - Location challenges

3. **Opportunity Signals** (bullet list): Identify any positive indicators:
   - Below-market pricing
   - Value-add potential
   - Strong market fundamentals
   - Competitive advantages

4. **Quick Take** (1 sentence): Pass, Consider, or Deep Dive — with brief reasoning.

Property Data:
[Insert scraped data]
```

### Excel Output Structure

**Tab 1: Property Details**
| Field | Value |
|-------|-------|
| Address | [scraped] |
| Price | [scraped] |
| Cap Rate | [scraped] |
| NOI | [scraped] |
| Units | [scraped] |
| SF | [scraped] |
| Price/Unit | [calculated] |
| Price/SF | [calculated] |
| Property Type | [scraped] |
| Year Built | [scraped] |
| Listing URL | [original URL] |

**Tab 2: Analysis**
- Property Summary (text)
- Risk Flags (bulleted)
- Opportunity Signals (bulleted)
- Quick Take (text)
- Generated on: [timestamp]

**Tab 3: Photos** (embedded images from listing)

### Success Criteria (MVP)

- Successfully scrape 90%+ of LoopNet listings (various property types)
- Analysis output is useful and actionable (validated with 5-10 test users)
- End-to-end flow completes in <60 seconds
- No crashes or errors on valid URLs
- 10+ people use it and give feedback

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LoopNet blocks scraping | Use rotating proxies, respect rate limits, check ToS |
| Inconsistent listing formats | Build robust parser with fallbacks, handle missing fields gracefully |
| Claude API costs too high | Set response token limits, cache common analyses |
| Excel generation fails | Validate data before generation, add error handling |

---

## Phase 1: Personalization Layer

**Goal:** Add auth, criteria collection, and personalized analysis.

**Timeline:** 2-3 weeks (after Phase 0 validation)

### Scope

**What's Added:**
- Magic link authentication
- Investment criteria onboarding form
- User database (users, criteria, analyses)
- Personalized Claude analysis (compares deal vs criteria)
- Excel output updated with Criteria Match tab
- Dashboard showing analysis history
- Settings page to edit criteria

**What's Still Out:**
- Payment/freemium (Phase 2)
- Batch processing
- Custom templates
- Team accounts

### Technical Changes

**New Infrastructure:**
- PostgreSQL database (users, investment_criteria, analyses, magic_links)
- Email service (SendGrid/Postmark for magic links)
- Session management (JWT or similar)
- File storage (S3 for persistent Excel files)

**Updated Frontend:**
- Multi-page React app:
  - Homepage (signup/login)
  - Onboarding (criteria form)
  - Dashboard (URL input + analysis history)
  - Settings (edit criteria)
- Protected routes (require auth)

**Updated Backend:**
- User CRUD endpoints
- Magic link generation/validation
- Criteria storage and retrieval
- Analysis history queries
- Persistent file storage (link analyses to users)

### Personalized Claude Prompt

```
You are a real estate acquisitions analyst reviewing a deal for a specific investor. Compare this property listing against the investor's criteria and provide personalized analysis.

**Investor's Investment Criteria:**
- Property Types: [user's property types]
- Target Geography: [user's target markets/MSAs]
- Price Range: $[min] - $[max]
- Cap Rate Minimum: [user's cap rate threshold]%
- Investment Strategy: [core/value-add/opportunistic]

**Property Data:**
[Insert scraped data]

---

**Provide the following analysis:**

1. **Criteria Match Summary** (2-3 sentences):
   - Does this deal fit the investor's criteria?
   - Highlight specific matches and mismatches.
   - Give overall fit assessment (Strong Fit / Partial Fit / Poor Fit).

2. **Property Summary** (2-3 sentences):
   - What is this asset and where is it positioned in the market?
   - Contextualize to the investor's target geography if applicable.

3. **Risk Flags** (bullet list):
   - Prioritized by investor's strategy (core/value-add/opportunistic)
   - Call out criteria mismatches (e.g., "Cap rate below your 6.5% threshold")

4. **Opportunity Signals** (bullet list):
   - Aligned with investor's strategy and thesis
   - Highlight exceptional criteria matches

5. **Quick Take** (1-2 sentences):
   - Pass, Consider, or Deep Dive — with reasoning tied to investor criteria.
```

### Updated Excel Structure

**Tab 1: Criteria Match** (NEW)
| Your Criteria | This Deal | Match? |
|---------------|-----------|--------|
| Property Types | [property type] | ✓ / ✗ |
| Geography | [location] | ✓ / ✗ |
| Price Range | [price] | ✓ / ✗ |
| Cap Rate Min | [cap rate] | ✓ / ✗ |
| Strategy | [fit assessment] | ✓ / ✗ |

**Tab 2-4:** Same as Phase 0 (Property Details, Analysis, Photos)

### Success Criteria (Phase 1)

- 50+ users complete criteria setup
- 100+ personalized analyses generated
- Users update criteria at least once (validates engagement)
- Personalized analysis rated better than generic (user feedback)

---

## Phase 2: Monetization

**Goal:** Add freemium gating and payment.

**Timeline:** 1 week (after Phase 1 validation)

### Scope

**What's Added:**
- Freemium: 5 free analyses, then paywall
- Stripe integration for per-analysis purchases
- Usage tracking and gating logic
- Payment UI (modal + checkout)

### Success Criteria (Phase 2)

- 20+ users hit the paywall
- 5+ users convert to paid (25% conversion)
- $500+ in revenue (proof of willingness to pay)

---

## Implementation Order

### Week 1-2: Phase 0 MVP
- [ ] LoopNet scraper (test with 20 URLs)
- [ ] Claude integration (validate analysis quality)
- [ ] Excel generation (3 tabs)
- [ ] Simple web UI (React + backend)
- [ ] Deploy publicly
- [ ] Test with 10 people, gather feedback

**Decision Point:** Is the analysis useful? Do people want personalization?

### Week 3-5: Phase 1 Personalization
- [ ] Database schema + migrations
- [ ] Magic link auth
- [ ] Criteria onboarding flow
- [ ] Personalized Claude prompt
- [ ] Dashboard + history UI
- [ ] Settings page
- [ ] Deploy and test

**Decision Point:** Do users engage with criteria? Is personalized analysis better?

### Week 6: Phase 2 Monetization
- [ ] Stripe integration
- [ ] Freemium gating logic
- [ ] Payment UI
- [ ] Deploy and test

**Decision Point:** Will users pay? What's the right price?

---

## Key Decisions Deferred to Phase Boundaries

**After Phase 0 (before building Phase 1):**
- Do we proceed with personalization, or pivot?
- What criteria fields matter most (based on user feedback)?
- Should we add team accounts or other features?

**After Phase 1 (before building Phase 2):**
- What's the right pricing ($10? $15? $20? monthly sub)?
- Should we offer bulk pricing or just per-analysis?
- Do we need enterprise features (SSO, team billing)?

---

## Resources

- [[Deal Underwriting Microapp - PRD]] - Full PRD with personalization
- [[Microapp - User Flow]] - Original user flow diagram
- [[AI CRE Service 2026]] - Parent project
