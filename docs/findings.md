# Audit Findings — Government Website Accessibility Compliance

## Overview

This document summarizes the accessibility audit results across 12 government and public-sector websites scanned using the AccessIQ platform. Scans were conducted using axe-core against WCAG 2.2 Level AA conformance criteria.

> **Note**: These findings are from automated testing only. As noted in the [methodology](methodology.md), automated scanning detects approximately 30-40% of real accessibility issues. Manual testing would likely reveal additional barriers.

## Sites Audited

| # | Site | Type | Country | URL |
|---|------|------|---------|-----|
| 1 | National Portal of India | Central Government | India | india.gov.in |
| 2 | Digital India | Central Government | India | digitalindia.gov.in |
| 3 | MyGov India | Central Government | India | mygov.in |
| 4 | Government e-Procurement | Central Government | India | eprocure.gov.in |
| 5 | Income Tax India | Central Government | India | incometaxindia.gov.in |
| 6 | IRCTC | PSU | India | irctc.co.in |
| 7 | UIDAI (Aadhaar) | Central Government | India | uidai.gov.in |
| 8 | Passport Seva | Central Government | India | passportindia.gov.in |
| 9 | MCD Online | Municipal | India | mcdonline.nic.in |
| 10 | BBMP Bengaluru | Municipal | India | bbmp.gov.in |
| 11 | GOV.UK | International Benchmark | UK | gov.uk |
| 12 | USA.gov | International Benchmark | US | usa.gov |

## Summary Statistics

> **Populate after running batch scans**: Run `npm run scan:batch -w scanner` to generate actual data for this section.

| Metric | Indian Govt Avg | International Avg | WebAIM Govt Avg |
|--------|----------------|-------------------|-----------------|
| Total violations/page | _pending_ | _pending_ | 37.2 |
| Critical violations | _pending_ | _pending_ | — |
| Serious violations | _pending_ | _pending_ | — |
| WCAG AA pass rate | _pending_ | _pending_ | — |

## Violations by WCAG Principle

| Principle | Indian Govt | International | Description |
|-----------|-------------|---------------|-------------|
| Perceivable | _pending_ | _pending_ | Content must be presentable to all users |
| Operable | _pending_ | _pending_ | UI must be keyboard-navigable and usable |
| Understandable | _pending_ | _pending_ | Content must be readable and predictable |
| Robust | _pending_ | _pending_ | Content must work with assistive technologies |

## Most Common Violations Across All Sites

> To be populated after batch scanning is complete.

| # | Rule | WCAG SC | GIGW CP | Occurrences | Avg Elements |
|---|------|---------|---------|-------------|--------------|
| 1 | _pending_ | — | — | — | — |
| 2 | _pending_ | — | — | — | — |
| 3 | _pending_ | — | — | — | — |

## Key Findings

### 1. _Pending: Most common issue category_
_Description of the most widespread accessibility barrier found across sites._

### 2. _Pending: Second most common issue category_
_Description._

### 3. _Pending: Third most common issue category_
_Description._

## Indian Government vs. International Benchmarks

_Analysis comparing Indian government site accessibility to GOV.UK and USA.gov will be added after scanning._

## Before/After Remediation Proof

The AccessIQ platform includes a controlled demonstration using a realistic mock government portal:

- **Before** (`/demo/before.html`): Contains 12 deliberate WCAG violations commonly found in government sites
- **After** (`/demo/after.html`): Same page with all violations remediated per WCAG 2.2 AA

This demonstrates that the violations are fixable — the remediated page achieves near-100% automated compliance while maintaining identical visual design and functionality.

## Recommendations

1. **Immediate priorities**: Address critical and serious violations first (missing alt text, low contrast, missing form labels)
2. **Quick wins**: Add `lang` attribute, page titles, skip navigation links — minimal effort, high impact
3. **Structural improvements**: Fix heading hierarchies, add proper ARIA landmarks
4. **Ongoing monitoring**: Use AccessIQ's scanning capabilities for continuous compliance tracking
5. **Manual testing**: Supplement automated scans with screen reader testing and keyboard-only navigation
6. **Training**: Invest in accessibility training for web development teams

## Data Freshness

- **Scan date**: _pending_
- **WCAG version**: 2.2
- **Conformance target**: AA
- **Scanner**: axe-core via Playwright
