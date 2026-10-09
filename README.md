# AccessIQ — Government Website Accessibility Compliance Platform

[![Accessibility Check](https://img.shields.io/badge/WCAG_2.2_AA-Compliant-green?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ii8+PHBhdGggZD0ibTkgMTIgMiAyIDQtNCIvPjwvc3ZnPg==)](docs/methodology.md)

A full-stack platform that **scans public-service websites** for **WCAG 2.2 / GIGW 3.0** accessibility violations, **tracks them over time**, and **demonstrates before/after remediation** on controlled demo pages.

## Why This Exists

Accessibility isn't optional — it's a legal requirement for government websites in India (under GIGW 3.0 guidelines) and globally (WCAG 2.2). Yet automated audits of Indian government portals consistently reveal widespread violations: missing alt text, low contrast, keyboard traps, and more.

**AccessIQ** bridges the gap between one-time audits and sustainable compliance by providing:

- 🔍 **Automated scanning** of any public URL using industry-standard axe-core
- 📊 **Dashboard tracking** of violations across multiple government sites
- 📈 **Trend analysis** showing compliance improvements over time
- 🔄 **Before/after proof** with controlled demo pages showing remediation impact
- 📋 **WCAG 2.2 + GIGW 3.0 mapping** for every detected violation
- 📏 **Benchmarking** against WebAIM Million public data

> **⚠️ Important Limitation:** Automated scanning catches approximately **30–40% of real accessibility issues**. Full WCAG 2.2 conformance requires manual testing with screen readers (NVDA, JAWS, VoiceOver), keyboard-only navigation, and cognitive accessibility review. This tool is a complement to — not a replacement for — manual auditing.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        AccessIQ Platform                         │
├──────────────┬──────────────┬─────────────────┬─────────────────┤
│   /client    │   /server    │    /scanner      │   /types        │
│  React+Vite  │  Express API │  Playwright +    │  Shared TS      │
│  Tailwind    │  Prisma/     │  axe-core        │  interfaces     │
│  Recharts    │  SQLite      │                  │                 │
├──────────────┴──────────────┴─────────────────┴─────────────────┤
│                        /demo-pages                               │
│            before.html (violations) → after.html (fixed)         │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts | Dashboard, violation explorer, comparison views |
| **Backend** | Express, TypeScript, Prisma, SQLite | REST API, scan job management, data storage |
| **Scanner** | Playwright, @axe-core/playwright | Headless browser accessibility scanning |
| **Types** | TypeScript interfaces | Shared data contracts across all packages |
| **Demo Pages** | Static HTML | Controlled before/after remediation proof |

## Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+

### Setup

```bash
# Clone the repository
git clone <repo-url> && cd AccessIQ

# Install all workspace dependencies
npm install

# Set up the database
cp .env.example .env
cd server && npx prisma generate && npx prisma db push && cd ..

# Start development servers (in separate terminals)
npm run dev:server    # API on http://localhost:3001
npm run dev:client    # Frontend on http://localhost:5173
```

### Verify Setup

```bash
# Health check
curl http://localhost:3001/api/health
# Expected: { "status": "ok", "timestamp": "...", "version": "1.0.0" }

# Demo pages
open http://localhost:3001/demo/before.html
open http://localhost:3001/demo/after.html
```

### Run a Scan

```bash
# Single site scan
npm run scan -w scanner -- --url=https://india.gov.in --target=central-govt

# Batch scan all tracked sites
npm run scan:batch -w scanner
```

## Adding a New Site to Track

1. **Via API:**
   ```bash
   curl -X POST http://localhost:3001/api/targets \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.gov.in", "siteName": "Example Portal", "siteType": "central-govt"}'
   ```

2. **Via batch config:** Add an entry to `scanner/data/targets.json`

3. **Via dashboard:** Click "Add Site" on the Sites page

## WCAG / GIGW Mapping

Every violation detected by the scanner is mapped to:

- **WCAG 2.2 Success Criterion** (e.g., 1.4.3 "Contrast (Minimum)")
- **WCAG Principle** (Perceivable / Operable / Understandable / Robust)
- **GIGW 3.0 Checkpoint** (where a clear mapping exists)

The mapping table is maintained in `types/src/wcag-mapping.ts` and covers the ~50 most commonly detected axe-core rules.

## Project Structure

```
AccessIQ/
├── client/              # React frontend (Vite + Tailwind)
├── server/              # Express API + Prisma/SQLite
├── scanner/             # Playwright + axe-core engine
├── types/               # Shared TypeScript interfaces
├── demo-pages/          # Before/after remediation HTML
├── docs/                # Methodology + findings
├── data/                # SQLite database (gitignored)
└── .github/workflows/   # CI accessibility checks
```

## Accessibility Dogfooding 🐕

This dashboard is built with **accessibility-first principles** — it practices what it preaches:

- ✅ Proper color contrast ratios (4.5:1+ for all text)
- ✅ Keyboard navigability with visible focus indicators
- ✅ Semantic HTML structure (proper headings, landmarks, lists)
- ✅ ARIA attributes only where native HTML semantics are insufficient
- ✅ Skip-to-main-content link
- ✅ Responsive design that works with browser zoom up to 200%

We run our own scanner against the dashboard UI as part of the final verification step (see Phase 9 in the development process).

## Documentation

- [Audit Methodology](docs/methodology.md) — Tools, WCAG version, severity rubric, GIGW mapping
- [Audit Findings](docs/findings.md) — Results across 10+ government websites
- [API Reference](docs/api.http) — All API endpoints with examples

## License

MIT
