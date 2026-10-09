# Audit Methodology

## Overview

AccessIQ conducts automated accessibility audits of government websites using industry-standard tools and established web accessibility standards. This document describes the methodology, tools, scoring rubric, and limitations of the automated audit process.

## Standards Used

### WCAG 2.2 (Web Content Accessibility Guidelines)

- **Version**: 2.2 (W3C Recommendation, October 2023)
- **Conformance Level**: AA (the level required by most government accessibility policies)
- **Principles Assessed**:
  1. **Perceivable** — Information must be presentable to users in ways they can perceive
  2. **Operable** — User interface components must be operable
  3. **Understandable** — Information and operation of the UI must be understandable
  4. **Robust** — Content must be robust enough to be interpreted by a wide variety of user agents

### GIGW 3.0 (Guidelines for Indian Government Websites)

- **Version**: 3.0 (published by NIC/MeitY)
- **Focus**: Accessibility checkpoints specific to Indian government web presence
- **Mapping**: Where GIGW 3.0 checkpoints correspond to WCAG 2.2 success criteria, both references are provided

## Tools

### Primary Scanner: axe-core (via @axe-core/playwright)

- **Version**: 4.9.x
- **Engine**: Deque Systems axe-core — the most widely used open-source accessibility testing engine
- **Integration**: Run via Playwright headless Chromium for realistic browser rendering
- **Rule Set**: WCAG 2.0 A, WCAG 2.0 AA, WCAG 2.1 AA, WCAG 2.2 AA, and best-practice rules
- **Why axe-core**: Industry standard, low false-positive rate (~10%), actively maintained, used by Google, Microsoft, and the US Government's Section 508 compliance tooling

### Browser Environment

- **Engine**: Chromium (via Playwright)
- **Viewport**: 1280×720 (desktop)
- **User Agent**: Custom AccessIQ identifier
- **Wait Strategy**: Network idle + 1s additional delay for late-loading JavaScript

## Audit Process

### Per-Site Scan Procedure

1. **Navigation**: Playwright navigates to the target URL and waits for network idle
2. **Analysis**: axe-core is injected and runs the full rule set against the rendered DOM
3. **Mapping**: Each axe-core violation is mapped to:
   - WCAG 2.2 success criterion (e.g., 1.4.3)
   - WCAG principle (Perceivable/Operable/Understandable/Robust)
   - Severity level (critical/serious/moderate/minor)
   - GIGW 3.0 checkpoint (where applicable)
4. **Storage**: Results are persisted to SQLite for trend analysis
5. **Error Handling**: If a site is down, blocked, or times out, a partial result with an error flag is recorded rather than discarding the attempt

### Pages Scanned Per Site

- **Homepage only** for the initial automated audit
- Future iterations may crawl additional pages (e.g., contact, services, forms)

### Batch Scanning

- Sequential scanning with a **2-second delay** between sites (polite crawling)
- Respects site availability — graceful handling of timeouts and errors
- All results saved atomically per scan

## Severity Scoring Rubric

Severity levels are derived directly from axe-core's `impact` field:

| Severity | axe-core Impact | Description | Example |
|----------|----------------|-------------|---------|
| **Critical** | critical | Users are completely blocked from accessing content | Images without any alt text, keyboard traps |
| **Serious** | serious | Users face significant difficulty accessing content | Form inputs without labels, low-contrast text below 3:1 |
| **Moderate** | moderate | Users experience some difficulty | Heading hierarchy skips, missing skip navigation |
| **Minor** | minor | Users experience minor inconvenience | Redundant ARIA roles, suboptimal tab order |

### Pass Rate Calculation

```
Pass Rate = (1 - (totalViolations / expectedChecks)) × 100
```

Where `expectedChecks` is the total number of axe-core rules that were evaluated (both passing and failing). This provides a percentage score where 100% means zero violations detected.

## WCAG-GIGW Mapping

The mapping between WCAG 2.2 success criteria and GIGW 3.0 checkpoints is maintained in the codebase at `types/src/wcag-mapping.ts`. Key correspondences include:

| WCAG 2.2 SC | WCAG Name | GIGW 3.0 Checkpoint |
|-------------|-----------|-------------------|
| 1.1.1 | Non-text Content | 2.1 — Text alternatives |
| 1.2.2 | Captions (Prerecorded) | 2.2 — Multimedia captions |
| 1.4.3 | Contrast (Minimum) | 2.4 — Color contrast |
| 2.1.2 | No Keyboard Trap | 3.2 — Keyboard accessibility |
| 2.4.1 | Bypass Blocks | 3.3 — Skip navigation |
| 2.4.2 | Page Titled | 3.5 — Descriptive titles |
| 2.4.4 | Link Purpose | 3.6 — Descriptive link text |
| 2.4.7 | Focus Visible | 3.7 — Focus indicators |
| 3.1.1 | Language of Page | 4.1 — Language specification |
| 3.3.2 | Labels or Instructions | 4.2 — Form labels |
| 4.1.2 | Name, Role, Value | 5.1 — Accessible names |

## Known Limitations

> **⚠️ Critical Caveat**: Automated accessibility testing has inherent limitations. The results presented by AccessIQ should be interpreted with full awareness of these constraints.

### What Automated Scanning CAN Detect (~30-40% of issues)

- Missing alt text on images
- Low color contrast ratios
- Missing form labels
- Empty links and buttons
- Missing document language
- Heading hierarchy issues
- Keyboard traps (in some cases)
- Missing ARIA attributes
- Duplicate IDs

### What Automated Scanning CANNOT Detect (~60-70% of issues)

- **Quality of alt text** — automation can check if alt text exists but not if it's meaningful
- **Logical reading order** — requires human judgment
- **Keyboard operability** — partial detection only; complex interactions need manual testing
- **Screen reader compatibility** — requires actual screen reader testing (NVDA, JAWS, VoiceOver)
- **Cognitive accessibility** — plain language, logical navigation, consistent UI patterns
- **Color-only information** — beyond contrast ratios, using color as the sole indicator
- **Timing and motion** — animations, auto-updating content, session timeouts
- **Touch target adequacy** — mobile-specific issues
- **Meaningful content structure** — proper use of landmarks, regions, and semantic grouping

### Recommended Complementary Testing

1. **Screen reader testing**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)
2. **Keyboard-only navigation**: Tab through entire page, test all interactive elements
3. **Manual color contrast verification**: Use browser DevTools or WCAG contrast checker
4. **Content review**: Check alt text quality, heading meaningfulness, link clarity
5. **User testing**: Include users with disabilities in usability testing

## Benchmark Data

Comparison benchmarks are sourced from the **WebAIM Million** study (2024), which annually analyzes the accessibility of the top 1,000,000 home pages on the web:

| Metric | WebAIM Overall | WebAIM Government | Source |
|--------|---------------|-------------------|--------|
| Avg errors/page | 51.0 | 37.2 | WebAIM Million 2024 |
| Low contrast text | 79.1% of pages | — | WebAIM Million 2024 |
| Missing alt text | 55.5% of pages | — | WebAIM Million 2024 |
| Empty links | 15.8% of pages | — | WebAIM Million 2024 |
| Missing form labels | 43.8% of pages | — | WebAIM Million 2024 |
| Empty buttons | 26.9% of pages | — | WebAIM Million 2024 |
| Missing doc language | 17.1% of pages | — | WebAIM Million 2024 |

These benchmarks provide context for interpreting our scan results — they represent the current state of web accessibility across the broader internet, not an acceptable target.
