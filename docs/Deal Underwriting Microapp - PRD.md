---
parent: "[[AI CRE Service 2026]]"
type: product
status: planning
created: 2026-02-02
---

# Deal Underwriting Microapp - PRD

> **Note:** This PRD describes the full vision with personalization. For phased implementation starting with core MVP, see [[Implementation Plan - Phased Approach]].

## Purpose

Get personalized deal analysis from LoopNet URLs in under 60 seconds. No manual data entry, no generic screening—just analysis tailored to your investment criteria.

**Target user:** Acquisitions analysts and small fund operators who screen 20+ deals per week and need to quickly decide which ones merit deeper diligence based on their specific investment thesis.

**Core value prop:** Turn a 15-minute data aggregation + manual screening task into a 1-minute personalized automated workflow.

---

## Problem Statement

Acquisitions teams waste hours per week on data entry:
1. Copy property details from LoopNet listing
2. Paste into underwriting template
3. Calculate basic metrics (cap rate, price/unit, NOI)
4. Format for review/discussion
5. Repeat for every deal in pipeline

This is pure grunt work. No analysis, no judgment—just moving numbers between systems. It's also error-prone (typos, wrong cells, stale data).

The result: Good deals get overlooked because the team doesn't have bandwidth to properly screen everything.

---

## Solution (V1)

**Input:** User investment criteria (one-time setup) + LoopNet URL
**Output:** Personalized Excel file with property data + tailored analysis against user's criteria

### What It Does

1. **Onboard:** User signs up and defines investment criteria:
   - Property types (multifamily, office, retail, industrial)
   - Target geography (markets/MSAs/regions)
   - Financial thresholds (price range, cap rate, IRR targets)
   - Investment strategy (core, value-add, opportunistic)

2. **Fetch:** Scrape LoopNet listing (address, price, cap rate, NOI, units, sqft, photos, description)

3. **Analyze:** Run Claude analysis comparing property against user's specific criteria:
   - Criteria match assessment (what fits, what doesn't)
   - Market positioning summary (contextualized to user's target markets)
   - Risk flags (prioritized based on user's strategy)
   - Opportunity signals (aligned with user's investment thesis)
   - Quick take recommendation (pass, consider, deep dive) with criteria-based reasoning

4. **Format:** Output structured Excel file with:
   - Criteria match summary at top
   - Property details tab
   - Personalized analysis tab
   - Photos embedded
   - Ready for team review

5. **Track:** Save analysis to user's account dashboard for future reference

### What It Doesn't Do (V1)

- No rent roll analysis (requires upload, v2)
- No custom underwriting models (fixed template only)
- No integration with CRM/deal tracking tools
- No batch processing (one URL at a time)
- No automated comps pull (uses only listing data)
- No deal comparison/scoring across multiple properties

---

## User Flow

### First-Time User
1. User lands on homepage: "Get personalized deal analysis in 60 seconds"
2. User clicks "Sign Up" → enters email
3. User receives magic link → clicks to authenticate
4. User completes onboarding form (investment criteria):
   - Property types
   - Target geography
   - Financial thresholds (price range, cap rate, IRR targets)
   - Investment strategy
5. User lands on dashboard: "Paste LoopNet URL to analyze a deal"

### Returning User
1. User clicks magic link from email or visits dashboard (if session active)
2. User pastes LoopNet URL, clicks "Analyze Deal"
3. Loading state (30-60 seconds): "Fetching property data and running personalized analysis..."
4. Results page shows:
   - Criteria match summary (in-browser)
   - Download button: "Download [Address].xlsx"
5. User downloads Excel file, sees formatted property details + personalized analysis
6. Analysis is saved to dashboard history
7. User reviews and decides next steps (pass, flag for review, deep dive)
8. User can analyze another deal or view past analyses

### Account Management
- User can access Settings to update investment criteria
- Dashboard shows all past analyses with quick filters (by property type, date, criteria match)
- After 5 free analyses, user hits paywall and must add payment method

---

## Personalization Architecture

### How Criteria Flows Through the System

1. **Criteria Collection (Signup):**
   - User completes onboarding form with investment criteria
   - Stored in `Investment_Criteria` table linked to user account
   - Validated on backend (e.g., min < max for price range)

2. **Criteria Injection (Analysis):**
   - When user submits LoopNet URL, backend fetches their criteria from database
   - Criteria is injected into Claude prompt alongside scraped property data
   - Claude generates personalized analysis comparing property against criteria

3. **Criteria Display (Output):**
   - Excel file shows criteria match table (Tab 1)
   - Analysis text explicitly references criteria matches/mismatches
   - In-browser summary shows quick criteria fit assessment before download

4. **Criteria Updates (Settings):**
   - User can edit criteria anytime via Settings page
   - Changes apply to all future analyses
   - Past analyses are NOT retroactively updated (they reflect criteria at time of analysis)

### Example Flow

**User's Criteria:**
- Property Types: Multifamily
- Target Geography: Phoenix, Tucson
- Price Range: $5M - $20M
- Cap Rate Min: 6.5%
- Strategy: Value-add

**Property Scraped from LoopNet:**
- Type: Multifamily (120 units)
- Location: Phoenix, AZ
- Price: $18M
- Cap Rate: 5.8%
- Description: "Deferred maintenance, 78% occupied, rents below market"

**Claude's Personalized Analysis:**
- **Criteria Match:** "Partial Fit — Meets property type and geography, within price range. However, cap rate at 5.8% is below your 6.5% threshold."
- **Property Summary:** "120-unit multifamily in Phoenix (your top target market) with clear value-add opportunity through deferred maintenance resolution and rent growth."
- **Risk Flags:** "Cap rate below your threshold suggests aggressive pricing relative to current income. Verify proforma assumptions..."
- **Quick Take:** "Consider — Strong geographic and strategic fit (value-add in target market), but requires underwriting to justify below-threshold cap rate."

---

## Technical Requirements

### Frontend
- React web app with routing (homepage, signup, dashboard, settings)
- **Auth flow:**
  - Email input for magic link
  - Magic link authentication (no password)
- **Onboarding:** Investment criteria form with validation
- **Dashboard:**
  - URL input field with LoopNet validation
  - Analysis history table (filterable by property type, date, criteria match)
  - Loading indicator during analysis
  - In-browser criteria match summary + download button
- **Settings page:** Editable investment criteria form
- **Paywall:** Modal after 5th analysis with payment form
- Error handling (invalid URL, scraping failed, API timeout, payment failures)

### Backend
- **Auth system:**
  - Magic link generation and validation
  - Session management (JWT or similar)
  - Email delivery service (SendGrid/Postmark)
- **User management:**
  - User CRUD operations
  - Investment criteria storage per user
  - Analysis count tracking for freemium limits
- **Core analysis pipeline:**
  - LoopNet scraper (Playwright/Puppeteer or API if available)
  - Claude API integration with user criteria injection
  - Excel file generation (openpyxl or similar)
- **Storage:**
  - User database (users, criteria, analyses)
  - File storage (S3 or similar) for Excel files
  - Analysis metadata (URL, address, date, criteria match score)
- **Payment integration:**
  - Stripe for per-analysis purchases
  - Usage tracking and gating
- **Rate limiting:** Prevent abuse (per-user and global)

### Database Schema

**Users table:**
- `id` (primary key)
- `email` (unique)
- `created_at`
- `last_login`
- `analysis_count` (for freemium gating)
- `has_paid` (boolean)

**Investment_Criteria table:**
- `user_id` (foreign key)
- `property_types` (array: multifamily, office, retail, industrial)
- `target_geographies` (array of markets/MSAs)
- `price_range_min` (decimal)
- `price_range_max` (decimal)
- `cap_rate_min` (decimal)
- `irr_target` (decimal, optional)
- `investment_strategy` (enum: core, value-add, opportunistic)
- `updated_at`

**Analyses table:**
- `id` (primary key)
- `user_id` (foreign key)
- `loopnet_url` (text)
- `property_address` (text)
- `property_type` (text)
- `price` (decimal)
- `cap_rate` (decimal, nullable)
- `criteria_match_score` (integer 0-100, optional)
- `excel_file_url` (text)
- `analysis_summary` (json: stores Claude output)
- `created_at`

**Magic_Links table:**
- `token` (primary key)
- `email` (indexed)
- `expires_at`
- `used` (boolean)

### Property Data Schema (Scraped from LoopNet)
**Required fields:**
- Property address
- Price
- Cap rate (if listed)
- NOI (if listed)
- Units / sqft
- Property type
- Listing description
- Photos (up to 5)

**Optional fields:**
- Year built
- Occupancy
- Parking
- Zoning
- Listing agent contact

### Analysis Prompt (Claude)

```
You are a real estate acquisitions analyst reviewing a deal for a specific investor. Compare this property listing against the investor's criteria and provide personalized analysis.

**Investor's Investment Criteria:**
- Property Types: [user's property types]
- Target Geography: [user's target markets/MSAs]
- Price Range: $[min] - $[max]
- Cap Rate Minimum: [user's cap rate threshold]%
- IRR Target: [user's IRR target]% (if provided)
- Investment Strategy: [core/value-add/opportunistic]

**Property Data:**
[Insert scraped data]

---

**Provide the following analysis:**

1. **Criteria Match Summary** (2-3 sentences):
   - Does this deal fit the investor's criteria?
   - Highlight specific matches (property type, geography, pricing, cap rate) and mismatches.
   - Give an overall fit assessment (Strong Fit / Partial Fit / Poor Fit).

2. **Property Summary** (2-3 sentences):
   - What is this asset and where is it positioned in the market?
   - Contextualize to the investor's target geography if applicable.

3. **Risk Flags** (bullet list):
   - Identify red flags prioritized by the investor's strategy:
     - For core: Focus on stability risks (occupancy, tenant credit, market saturation)
     - For value-add: Focus on execution risks (deferred maintenance, lease-up difficulty)
     - For opportunistic: Focus on market timing and structural issues
   - Call out any criteria mismatches (e.g., "Cap rate at 5.2% is below your 6.5% threshold")

4. **Opportunity Signals** (bullet list):
   - Identify positives aligned with the investor's strategy:
     - For core: Cash flow stability, strong tenant base
     - For value-add: Below-market rents, upside potential
     - For opportunistic: Distressed pricing, repositioning angle
   - Highlight any exceptional criteria matches (e.g., "In your top-priority Phoenix market")

5. **Quick Take** (1-2 sentences):
   - Pass, Consider, or Deep Dive — with explicit reasoning tied to investor criteria.
   - Example: "Deep Dive — meets 4 of 5 criteria and offers value-add upside in target market."
```

### Excel Output Structure

**Tab 1: Criteria Match**
| Your Criteria | This Deal | Match? |
|---------------|-----------|--------|
| Property Types: [user's types] | [property type] | ✓ / ✗ |
| Target Geography: [user's markets] | [property location] | ✓ / ✗ |
| Price Range: $[min]-$[max] | $[price] | ✓ / ✗ |
| Cap Rate Min: [user's min]% | [cap rate]% | ✓ / ✗ |
| Investment Strategy: [user's strategy] | [fit assessment] | ✓ / ✗ |

**Overall Fit:** Strong Fit / Partial Fit / Poor Fit

**Tab 2: Property Details**
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

**Tab 3: Personalized Analysis**
- Criteria Match Summary (text)
- Property Summary (text, contextualized to user's markets)
- Risk Flags (bulleted, prioritized by user's strategy)
- Opportunity Signals (bulleted, aligned with user's thesis)
- Quick Take (text with criteria-based reasoning)
- Generated on: [timestamp]
- Analyzed for: [user email]

**Tab 4: Photos** (embedded images from listing)

---

## Success Metrics

**Usage:**
- 100+ signups in first 30 days
- 50+ users complete criteria setup (50% conversion from signup)
- 200+ total analyses run (average 4 per active user)
- 20+ users hit the 5-analysis paywall
- 5+ users convert to paid (25% conversion at paywall)

**Quality:**
- 90%+ successful scrapes (no errors)
- Users report personalized analysis is "useful" or better
- Average time from URL submit to download: <60 seconds
- 70%+ users update their criteria at least once (indicates engagement with personalization)

**Business:**
- 10+ users express interest in managed ops service after using tool
- Tool becomes conversation starter for outbound sales
- $500+ in revenue from per-analysis purchases (proof of willingness to pay)

---

## Out of Scope (V1)

- Batch processing (multiple URLs at once)
- Deal comparison/scoring across multiple properties
- Custom underwriting templates (user uploads their Excel format)
- Integration with Argus/Excel models
- Automated comps/market data pull from external APIs
- Rent roll upload and analysis
- PDF export (Excel only for V1)
- Team accounts / multi-user workspaces
- API access for programmatic analysis
- Mobile app (web-only for V1)

---

## Future Versions

**V2: Rent Roll Analysis**
- Upload rent roll CSV/PDF
- Unit-level analysis
- Lease expiration risk
- Below-market rent identification
- Tenant credit analysis

**V3: Automation Exposure Scoring** (Stackpoint thesis)
- Scrape tenant business types from listing
- Estimate job automation risk by industry
- Flag high-exposure assets
- Differentiated analysis not available elsewhere

**V4: Custom Underwriting Models**
- User uploads their Excel template
- Tool populates it with scraped data
- Returns their format, not generic template

**V5: Integration Layer**
- Connect to Salesforce/HubSpot for deal tracking
- Auto-log analyzed deals
- Trigger follow-up workflows

---

## Open Questions

- **Pricing amount:** What's the per-analysis price after 5 free? $10? $15? $20?
  - Need to validate willingness to pay with early users
  - Consider monthly subscription option ($50/mo for unlimited?)
- **LoopNet scraping legality:** Check ToS, may need to pivot to user-uploaded PDFs or official API
- **Data retention:** Keep anonymized analyses for future model training? Privacy implications?
- **Criteria match scoring:** Should we calculate a numeric score (0-100) or just qualitative assessment (Strong/Partial/Poor)?
- **Branding:** Standalone product name or position as demo of larger managed ops service?
- **Email cadence:** How often to email users (onboarding, analysis complete, approaching paywall, etc.)?
- **Geography input:** Free-text or dropdown of major MSAs? How granular (city, MSA, state, region)?

---

## Launch Plan

1. **Build (3-4 weeks):**
   - **Week 1: Auth + User Management**
     - Magic link auth system (2-3 days)
     - User database schema (1 day)
     - Email delivery integration (1 day)
     - Basic dashboard UI (2-3 days)

   - **Week 2: Criteria + Core Analysis**
     - Investment criteria form + validation (2 days)
     - Settings page for criteria editing (1 day)
     - LoopNet scraper (2-3 days)
     - Claude integration with criteria injection (2 days)

   - **Week 3: Output + History**
     - Excel generation with personalized tabs (2-3 days)
     - Analysis history UI (filterable table) (2 days)
     - File storage (S3 or similar) (1 day)

   - **Week 4: Payment + Polish**
     - Stripe integration for per-analysis purchases (2 days)
     - Freemium gating logic (5 free, then paywall) (1 day)
     - Error handling across all flows (2 days)
     - UI polish and responsive design (1-2 days)

2. **Test (1 week):**
   - End-to-end user flow testing (signup → criteria → analysis → payment)
   - Process 20 real LoopNet listings with different criteria profiles
   - Verify personalized analysis quality (does it actually match criteria?)
   - Test edge cases (missing data, bad URLs, payment failures)
   - Load testing (concurrent users, rate limiting)

3. **Soft Launch (Week 6):**
   - Share with 10-15 warm network contacts
   - Gather feedback on:
     - Onboarding friction (do people complete criteria?)
     - Analysis personalization quality
     - Willingness to pay at paywall
   - Iterate on criteria form and Claude prompt
   - A/B test pricing ($10 vs $15 per analysis)

4. **Public Launch (Week 7-8):**
   - Post to CRE Twitter/LinkedIn with demo video
   - Share on relevant forums/groups (Bigger Pockets, CRE subreddit)
   - Paid ads targeting acquisitions analysts (LinkedIn/Google)
   - Outbound outreach using tool as lead magnet
   - Track conversion funnel: signup → criteria → analysis → paywall → paid

---

## Key Resources

- [[Stackpoint Keynote]] - AI framework (retrieve, predict, generate, act)
- [[AI CRE Service 2026]] - Parent project
- [[AI CRE Service - Pitch & Plan]] - Full service positioning
