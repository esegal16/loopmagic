# CLAUDE.md - LoopMagic Development Guide

## Project Overview

**LoopMagic** is a deal underwriting microapp that scrapes LoopNet listings and generates AI-powered analysis in Excel format.

**Current Phase:** Phase 0 (MVP) - Core analysis tool without personalization/auth
- See: `Deal Underwriting Microapp - PRD.md` (full vision)
- See: `Implementation Plan - Phased Approach.md` (phased rollout)

## Development Philosophy

- **Ship fast, validate early:** Build Phase 0 MVP in 1-2 weeks, test with real users before adding complexity
- **No premature optimization:** Don't build auth, payment, or personalization until core value prop is validated
- **Bias toward simple:** Prefer battle-tested libraries over custom implementations
- **Quality over speed on core features:** Scraping and analysis must be reliable (90%+ success rate)

## Technical Stack (Phase 0 MVP)

### Confirmed Choices
- **Language:** TypeScript (full-stack, type safety, single ecosystem)
- **Frontend + Backend:** Next.js (unified deploy, API routes built-in)
- **Scraping:** Playwright for Node (industry standard, excellent docs)
- **Excel Generation:** ExcelJS (robust, widely used)
- **AI:** Anthropic SDK for TypeScript
- **Hosting:** Vercel (handles frontend + API routes in single deploy)

### Storage (Phase 0)
- **Temporary files:** Vercel Blob Storage or S3 with 24-hour auto-delete policy
- **No database yet** (stateless until Phase 1)

### Why This Stack
- **Single language:** TypeScript across frontend + backend = less context switching
- **Type safety:** Share types between frontend, API routes, and scraping logic
- **Industry standard:** More resources, better ecosystem, easier to hire/get help
- **Simple deployment:** Vercel handles everything (no separate backend deploy)
- **Easy to scale:** Can extract API routes to separate Express/Fastify service later if needed

## Code Conventions

### File Structure
```
loopmagic/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts      # POST /api/analyze endpoint
│   │   ├── page.tsx              # Landing page (URL input)
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── scraper/
│   │   │   └── loopnet.ts        # LoopNet scraping logic
│   │   ├── analyzer/
│   │   │   └── claude.ts         # Claude API integration
│   │   ├── excel/
│   │   │   └── generator.ts     # Excel generation
│   │   └── types.ts              # Shared TypeScript types
│   └── components/
│       ├── UrlInput.tsx
│       ├── LoadingState.tsx
│       └── DownloadButton.tsx
├── public/
├── docs/
│   ├── Deal Underwriting Microapp - PRD.md
│   └── Implementation Plan - Phased Approach.md
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

### Naming Conventions
- **TypeScript/React:** camelCase for functions/variables, PascalCase for components/types
- **Files:** Descriptive names (e.g., `loopnet.ts`, not `scraper.ts`)
- **API routes:** Follow Next.js convention (`/api/analyze/route.ts` → POST /api/analyze)

### Error Handling
- **Scraping errors:** Graceful degradation (missing fields shouldn't crash, return partial data)
- **API errors:** Retry logic with exponential backoff for Claude API
- **User-facing errors:** Clear, actionable messages ("Could not fetch property data. Check URL or try again.")

### Testing Strategy (Phase 0)
- **Integration tests:** Test scraper with 20+ real LoopNet URLs (various property types)
- **Manual testing:** Claude analysis quality (read output, verify it's useful)
- **Load testing:** Can handle 10 concurrent requests without timing out
- **No unit tests yet** (too early, focus on end-to-end validation)
- **Testing framework:** Playwright Test (built-in) or Vitest if needed later, but manual testing is sufficient for Phase 0

## Key Technical Decisions

### Scraping Approach
- **Use Playwright in headless mode** (faster, no UI overhead)
- **Respect rate limits:** 1 request per 2 seconds to avoid bans
- **Handle missing data:** All fields except address/URL should be optional
- **Screenshot on error:** Capture page state for debugging failed scrapes

### Claude API Usage
- **SDK:** @anthropic-ai/sdk (TypeScript)
- **Model:** claude-sonnet-4-5-20250929 (latest Sonnet 4.5, balance of quality and cost)
- **Max tokens:** 2000 for response (analysis should be concise)
- **Temperature:** 0.3 (more deterministic, less creative variation)
- **Caching:** Don't cache analyses (each property is unique)

### Excel Output
- **Format:** .xlsx (not .xls, better compatibility)
- **Structure:** 2 tabs:
  - **"Proforma"**: Full 5-year financial model with formulas (revenue, expenses, NOI, cash flows, returns)
  - **"Analysis"**: Claude's AI commentary and recommendations
- **Auto-population:** Scraped data (address, price, units, SF, cap rate) pre-fills blue cells
- **User inputs:** Yellow cells for financing terms, exit assumptions, revenue/expense drivers
- **Formulas:** Excel calculates projections, NOI, cash flows, returns (IRR, equity multiple)
- **Styling:** Professional CRE proforma formatting (color-coded cells, bold headers, borders)
- **File naming:** `{address}-analysis-{timestamp}.xlsx` (e.g., "123-Main-St-Phoenix-analysis-2026-02-05.xlsx")
- **No photos in Phase 0** (deferred to later phase)

## What to Build First (Phase 0 Priority Order)

1. **LoopNet scraper** (`src/lib/scraper/loopnet.ts`)
   - Most critical, hardest to get right
   - Test with 20 URLs before moving on
   - Handle edge cases (missing data, different listing formats)
   - Return typed object with property data

2. **Claude integration** (`src/lib/analyzer/claude.ts`)
   - Validate analysis quality
   - Use generic prompt (no personalization yet)
   - Test with 5-10 scraped listings
   - Iterate on prompt until output is useful

3. **Excel generation** (`lib/excel/generator.ts`)
   - Professional 5-year financial proforma
   - 2 tabs: Proforma (financial model), Analysis (AI commentary)
   - Auto-populate from scraped data, user fills financing/assumptions
   - Excel formulas for projections and returns
   - Return buffer for download

4. **API route** (`src/app/api/analyze/route.ts`)
   - Glue it together
   - POST /api/analyze with `loopnetUrl` in body
   - Call scraper → Claude → Excel generator
   - Return file download or error

5. **Simple frontend** (`src/app/page.tsx` + components)
   - Last, lowest risk
   - URL input field
   - Loading state (30-60 sec with progress indicator)
   - Download button when complete

## Guardrails (Don't Do Without Asking)

- **Don't add features from Phase 1/2** (auth, criteria, payment, history) until Phase 0 is validated
- **Don't optimize prematurely** (e.g., caching, queue systems) - handle 1 request at a time for now
- **Don't build custom scrapers for other sites** (Crexi, CoStar) - stay focused on LoopNet
- **Don't design database schema yet** - we're stateless until Phase 1
- **Don't add batch processing** (multiple URLs at once) - one URL at a time for Phase 0
- **Don't extract API to separate backend** - keep it as Next.js API routes until Phase 0 is validated
- **Don't add complex TypeScript generics** - keep types simple and readable

## Decision Framework

When facing technical choices, optimize for:
1. **Speed to validation** - Can we test this with real users sooner?
2. **Reliability** - Will this work 90%+ of the time?
3. **Simplicity** - Fewer moving parts = fewer failure modes
4. **Cost** - Keep Claude API costs under $0.50 per analysis

## Open Questions (To Resolve During Phase 0)

- [ ] Can ExcelJS embed images as reliably as openpyxl? (test before building Excel module)
- [ ] What's the average Claude API cost per analysis? (track first 20 requests)
- [ ] What % of LoopNet URLs scrape successfully? (test with diverse property types)
- [ ] How long does end-to-end take? (target <60 sec, measure reality)
- [ ] Do users find the generic analysis useful? (feedback from 10 testers)
- [ ] Should we add email delivery or is download sufficient?

## Success Criteria (Phase 0)

Before moving to Phase 1, we need:
- [ ] 90%+ successful scrapes (test with 50+ URLs)
- [ ] Analysis rated "useful" by 8/10 test users
- [ ] <60 second end-to-end time (95th percentile)
- [ ] No crashes on valid LoopNet URLs
- [ ] Clear demand signal (10+ people use it, ask for more features)

## Resources

- [LoopNet](https://www.loopnet.com) - Target site for scraping
- [Playwright for Node.js](https://playwright.dev) - Scraping framework
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Claude API client
- [ExcelJS](https://github.com/exceljs/exceljs) - Excel generation
- [Next.js Docs](https://nextjs.org/docs) - Full-stack framework
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Backend endpoints
