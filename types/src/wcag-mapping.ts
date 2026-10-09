/**
 * Mapping entry from an axe-core rule to WCAG 2.2 success criteria
 * and (where applicable) GIGW 3.0 checkpoint, along with rich remediation guidance.
 */
export interface WcagRuleMapping {
  ruleId: string;
  wcagCriteria: string[];      // WCAG 2.2 SC numbers
  wcagCriterionName: string;   // Primary SC name
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  wcagLevel?: 'A' | 'AA' | 'AAA';
  gigwCheckpoint?: string;     // GIGW 3.0 checkpoint
  gigwDescription?: string;    // GIGW checkpoint description
  effort?: 'Quick Fix (<15m)' | 'Moderate (30m-1h)' | 'Architectural (2h+)';
  remediation?: string;        // Step-by-step guidance
  suggestedFixSnippet?: string;// Recommended accessible code snippet
  userImpact?: string;         // Plain-English description of user impact
}

/**
 * Comprehensive reference knowledge base mapping axe-core rule IDs
 * to WCAG 2.2 Level A/AA criteria, GIGW 3.0 compliance checkpoints,
 * disability user impact statements, and code remediation snippets.
 */
export const WCAG_RULE_MAP: WcagRuleMapping[] = [
  // === PERCEIVABLE ===
  {
    ruleId: 'image-alt',
    wcagCriteria: ['1.1.1'],
    wcagCriterionName: 'Non-text Content',
    principle: 'Perceivable',
    wcagLevel: 'A',
    gigwCheckpoint: '2.1',
    gigwDescription: 'Provide text alternatives for non-text content',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen reader users cannot understand the purpose or content of the image, hearing only raw filenames or nothing at all.',
    remediation: 'Add a concise, descriptive alt attribute that conveys the message or purpose of the image. For decorative images, use alt="".',
    suggestedFixSnippet: '<img src="/emblem.png" alt="National Emblem of India" />\n<!-- Or if purely decorative: -->\n<img src="/bg-pattern.png" alt="" role="presentation" />',
  },
  {
    ruleId: 'input-image-alt',
    wcagCriteria: ['1.1.1'],
    wcagCriterionName: 'Non-text Content',
    principle: 'Perceivable',
    wcagLevel: 'A',
    gigwCheckpoint: '2.1',
    gigwDescription: 'Provide text alternatives for non-text content',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Non-sighted users will not know what clicking this graphical button accomplishes.',
    remediation: 'Provide an alt attribute describing the action triggered by the graphical input.',
    suggestedFixSnippet: '<input type="image" src="/submit.png" alt="Submit Grievance Application" />',
  },
  {
    ruleId: 'area-alt',
    wcagCriteria: ['1.1.1'],
    wcagCriterionName: 'Non-text Content',
    principle: 'Perceivable',
    wcagLevel: 'A',
    gigwCheckpoint: '2.1',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Image map areas cannot be navigated by assistive tech without text alternatives.',
    remediation: 'Add meaningful alt attributes to every <area> element within an image map.',
    suggestedFixSnippet: '<area shape="rect" coords="0,0,100,50" href="/contact" alt="Contact Ministry Helpline" />',
  },
  {
    ruleId: 'object-alt',
    wcagCriteria: ['1.1.1'],
    wcagCriterionName: 'Non-text Content',
    principle: 'Perceivable',
    wcagLevel: 'A',
    gigwCheckpoint: '2.1',
    effort: 'Moderate (30m-1h)',
    userImpact: 'Embedded objects without text alternatives are completely invisible to screen readers.',
    remediation: 'Provide descriptive fallback text inside the <object> element or aria-label.',
    suggestedFixSnippet: '<object data="report.pdf" type="application/pdf">\n  <p>Your browser cannot display PDFs. <a href="report.pdf">Download Annual Report (PDF)</a>.</p>\n</object>',
  },
  {
    ruleId: 'svg-img-alt',
    wcagCriteria: ['1.1.1'],
    wcagCriterionName: 'Non-text Content',
    principle: 'Perceivable',
    wcagLevel: 'A',
    gigwCheckpoint: '2.1',
    effort: 'Quick Fix (<15m)',
    userImpact: 'SVG graphics carrying visual information are announced as blank elements or skipped.',
    remediation: 'Add <title> tag inside the <svg> and reference it with aria-labelledby, or use aria-label.',
    suggestedFixSnippet: '<svg role="img" aria-labelledby="svgTitle">\n  <title id="svgTitle">Aadhaar Verification Success</title>\n  <path ... />\n</svg>',
  },
  {
    ruleId: 'role-img-alt',
    wcagCriteria: ['1.1.1'],
    wcagCriterionName: 'Non-text Content',
    principle: 'Perceivable',
    wcagLevel: 'A',
    gigwCheckpoint: '2.1',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Elements with role="img" lack accessible labels, hiding graphical content.',
    remediation: 'Add aria-label or aria-labelledby to any element assigned role="img".',
    suggestedFixSnippet: '<span role="img" aria-label="Flag of India">&#x1F1EE;&#x1F1F3;</span>',
  },
  {
    ruleId: 'color-contrast',
    wcagCriteria: ['1.4.3'],
    wcagCriterionName: 'Contrast (Minimum)',
    principle: 'Perceivable',
    wcagLevel: 'AA',
    gigwCheckpoint: '2.4',
    gigwDescription: 'Ensure sufficient color contrast',
    effort: 'Moderate (30m-1h)',
    userImpact: 'Low-vision users, elderly citizens, and people viewing screens in bright sunlight cannot read this text.',
    remediation: 'Adjust font color or background color to achieve at least 4.5:1 contrast for normal text and 3:1 for large text (18pt+ or 14pt bold).',
    suggestedFixSnippet: '/* Replace low-contrast gray (#888888 on #FFFFFF = 3.5:1) with accessible tone */\n.portal-text {\n  color: #1e293b; /* 12.6:1 contrast against white */\n}',
  },
  {
    ruleId: 'color-contrast-enhanced',
    wcagCriteria: ['1.4.6'],
    wcagCriterionName: 'Contrast (Enhanced)',
    principle: 'Perceivable',
    wcagLevel: 'AAA',
    gigwCheckpoint: '2.4',
    effort: 'Moderate (30m-1h)',
    userImpact: 'Severely visually impaired users require 7:1 contrast for effortless readability.',
    remediation: 'Boost contrast ratio to 7:1 or higher for normal text.',
    suggestedFixSnippet: '.high-contrast-text {\n  color: #0f172a; /* Slate-900 delivers > 14:1 contrast */\n}',
  },
  {
    ruleId: 'meta-viewport',
    wcagCriteria: ['1.4.4'],
    wcagCriterionName: 'Resize Text',
    principle: 'Perceivable',
    wcagLevel: 'AA',
    gigwCheckpoint: '2.5',
    gigwDescription: 'Ensure content is resizable',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Users who need zoom magnification are locked out from enlarging page content on mobile devices.',
    remediation: 'Remove user-scalable="no" and maximum-scale=1.0 from the meta viewport tag.',
    suggestedFixSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  },
  {
    ruleId: 'meta-viewport-large',
    wcagCriteria: ['1.4.4'],
    wcagCriterionName: 'Resize Text',
    principle: 'Perceivable',
    wcagLevel: 'AA',
    gigwCheckpoint: '2.5',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Zoom limits below 500% prevent low-vision users from scaling text to a comfortable size.',
    remediation: 'Ensure maximum-scale allows at least 5x magnification or omit the attribute entirely.',
    suggestedFixSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  },

  // === OPERABLE ===
  {
    ruleId: 'keyboard',
    wcagCriteria: ['2.1.1'],
    wcagCriterionName: 'Keyboard',
    principle: 'Operable',
    wcagLevel: 'A',
    effort: 'Moderate (30m-1h)',
    userImpact: 'Citizens with physical tremors, mobility impairments, or blindness cannot interact with the control without a mouse.',
    remediation: 'Use native interactive elements (<button>, <a>) instead of div/span with onclick, or add tabindex="0" and keydown event handlers (Enter/Space).',
    suggestedFixSnippet: '<!-- Replace <div onclick="submit()"> with: -->\n<button type="button" onClick={submit}>\n  Submit Application\n</button>',
  },
  {
    ruleId: 'no-trap-focus',
    wcagCriteria: ['2.1.2'],
    wcagCriterionName: 'No Keyboard Trap',
    principle: 'Operable',
    wcagLevel: 'A',
    gigwCheckpoint: '3.2',
    gigwDescription: 'Ensure no keyboard traps exist',
    effort: 'Moderate (30m-1h)',
    userImpact: 'Keyboard users get permanently trapped inside a modal or component, forcing them to reload the entire portal.',
    remediation: 'Ensure interactive modals allow Escape key dismissal and do not trap focus without an escape path.',
    suggestedFixSnippet: 'modal.addEventListener("keydown", (e) => {\n  if (e.key === "Escape") {\n    closeModal();\n    triggerButton.focus(); // Return focus to origin\n  }\n});',
  },
  {
    ruleId: 'tabindex',
    wcagCriteria: ['2.1.1'],
    wcagCriterionName: 'Keyboard',
    principle: 'Operable',
    wcagLevel: 'A',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Positive tabindex values (>0) distort natural document reading order, making navigation erratic.',
    remediation: 'Change positive tabindex values to 0 (to make focusable) or -1 (for programmatic focus). Rely on DOM order.',
    suggestedFixSnippet: '<!-- Replace tabindex="4" with: -->\n<div tabindex="0">Interactive Card</div>',
  },
  {
    ruleId: 'bypass',
    wcagCriteria: ['2.4.1'],
    wcagCriterionName: 'Bypass Blocks',
    principle: 'Operable',
    wcagLevel: 'A',
    gigwCheckpoint: '3.3',
    gigwDescription: 'Provide skip navigation links',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Keyboard users must press Tab dozens of times through repetitive headers on every page before reaching content.',
    remediation: 'Add a prominent skip-to-main-content link as the very first focusable element on the page.',
    suggestedFixSnippet: '<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:p-3 focus:bg-blue-700 focus:text-white focus:rounded">\n  Skip to main content\n</a>\n<main id="main-content" tabIndex="-1">...</main>',
  },
  {
    ruleId: 'page-has-heading-one',
    wcagCriteria: ['2.4.1', '2.4.6'],
    wcagCriterionName: 'Headings and Labels',
    principle: 'Operable',
    wcagLevel: 'A',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen reader users browse pages by heading levels to locate main topics; missing h1 denies them primary orientation.',
    remediation: 'Ensure the page has exactly one top-level <h1> that clearly states the title or purpose of the page.',
    suggestedFixSnippet: '<main id="main-content">\n  <h1>Citizen Grievance Redressal Portal</h1>\n</main>',
  },
  {
    ruleId: 'heading-order',
    wcagCriteria: ['2.4.6'],
    wcagCriterionName: 'Headings and Labels',
    principle: 'Operable',
    wcagLevel: 'AA',
    gigwCheckpoint: '3.4',
    gigwDescription: 'Use proper heading hierarchy',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Skipping heading levels (e.g. h1 directly to h3) confuses screen reader users about page hierarchy and content relationships.',
    remediation: 'Nest headings sequentially without skipping levels (h1 -> h2 -> h3). Use CSS for visual styling, not heading tags.',
    suggestedFixSnippet: '<h1>Main Portal Title</h1>\n  <h2>Section: Service Catalogue</h2>\n    <h3>Sub-service: Passport Renewal</h3>',
  },
  {
    ruleId: 'empty-heading',
    wcagCriteria: ['2.4.6'],
    wcagCriterionName: 'Headings and Labels',
    principle: 'Operable',
    wcagLevel: 'AA',
    gigwCheckpoint: '3.4',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen reader users hear "Heading Level 2" followed by silence, wasting navigation time.',
    remediation: 'Remove empty heading tags or provide meaningful text content.',
    suggestedFixSnippet: '<!-- Replace <h2></h2> with meaningful text or remove: -->\n<h2>Payment Methods</h2>',
  },
  {
    ruleId: 'document-title',
    wcagCriteria: ['2.4.2'],
    wcagCriterionName: 'Page Titled',
    principle: 'Operable',
    wcagLevel: 'A',
    gigwCheckpoint: '3.5',
    gigwDescription: 'Provide descriptive page titles',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Page titles are the first item announced by screen readers when loading tabs. Missing titles disorient users.',
    remediation: 'Add a unique, descriptive <title> tag inside the <head> element.',
    suggestedFixSnippet: '<head>\n  <title>Pay Electricity Bill | Digital India Portal</title>\n</head>',
  },
  {
    ruleId: 'link-name',
    wcagCriteria: ['2.4.4'],
    wcagCriterionName: 'Link Purpose (In Context)',
    principle: 'Operable',
    wcagLevel: 'A',
    gigwCheckpoint: '3.6',
    gigwDescription: 'Provide descriptive link text',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen readers generate link lists where empty or generic links ("Click Here", icon-only) are completely unidentifiable.',
    remediation: 'Provide discernible text within links, or add aria-label to icon-only links.',
    suggestedFixSnippet: '<a href="/download-form" aria-label="Download Income Certificate Form (PDF)">\n  <DownloadIcon aria-hidden="true" />\n  <span>Download Form</span>\n</a>',
  },
  {
    ruleId: 'focus-visible',
    wcagCriteria: ['2.4.7'],
    wcagCriterionName: 'Focus Visible',
    principle: 'Operable',
    wcagLevel: 'AA',
    gigwCheckpoint: '3.7',
    gigwDescription: 'Ensure visible focus indicators',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Keyboard-only navigators have zero visual feedback on which link, button, or input currently has focus.',
    remediation: 'Never use outline: none without providing an accessible alternative. Use :focus-visible with clear 2px+ high-contrast outlines.',
    suggestedFixSnippet: 'button:focus-visible, a:focus-visible, input:focus-visible {\n  outline: 3px solid #1a56db;\n  outline-offset: 2px;\n}',
  },
  {
    ruleId: 'target-size',
    wcagCriteria: ['2.5.8'],
    wcagCriterionName: 'Target Size (Minimum)',
    principle: 'Operable',
    wcagLevel: 'AA',
    effort: 'Quick Fix (<15m)',
    userImpact: 'People with hand tremors or using touchscreen mobile devices accidentally tap incorrect buttons.',
    remediation: 'Ensure touch targets have an interactive area of at least 24x24 CSS pixels, preferably 44x44 CSS pixels.',
    suggestedFixSnippet: '.action-btn {\n  min-height: 44px;\n  min-width: 44px;\n  padding: 8px 16px;\n}',
  },

  // === UNDERSTANDABLE ===
  {
    ruleId: 'html-has-lang',
    wcagCriteria: ['3.1.1'],
    wcagCriterionName: 'Language of Page',
    principle: 'Understandable',
    wcagLevel: 'A',
    gigwCheckpoint: '4.1',
    gigwDescription: 'Specify the language of the page',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Speech synthesizers default to the user OS voice, mispronouncing words with the wrong phonetic accent.',
    remediation: 'Specify the primary language code on the root <html> tag.',
    suggestedFixSnippet: '<html lang="en"> <!-- or lang="hi" for Hindi -->',
  },
  {
    ruleId: 'html-lang-valid',
    wcagCriteria: ['3.1.1'],
    wcagCriterionName: 'Language of Page',
    principle: 'Understandable',
    wcagLevel: 'A',
    gigwCheckpoint: '4.1',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Invalid BCP 47 language codes fail to trigger correct speech synthesis dictionaries.',
    remediation: 'Use valid two or three letter ISO language codes (e.g. "en", "hi", "ta", "bn").',
    suggestedFixSnippet: '<html lang="en-IN">',
  },
  {
    ruleId: 'label',
    wcagCriteria: ['1.3.1', '3.3.2'],
    wcagCriterionName: 'Labels or Instructions',
    principle: 'Understandable',
    wcagLevel: 'A',
    gigwCheckpoint: '4.2',
    gigwDescription: 'Provide labels for form controls',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen reader users entering text fields have no idea what data is requested (name, password, amount).',
    remediation: 'Explicitly associate an HTML <label for="fieldId"> with every form input, or use aria-label.',
    suggestedFixSnippet: '<label for="consumerId" class="block font-medium">Consumer Account Number</label>\n<input id="consumerId" name="consumerId" type="text" required />',
  },
  {
    ruleId: 'select-name',
    wcagCriteria: ['3.3.2', '4.1.2'],
    wcagCriterionName: 'Labels or Instructions',
    principle: 'Understandable',
    wcagLevel: 'A',
    gigwCheckpoint: '4.2',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Dropdown select menus without accessible names leave users guessing the options context.',
    remediation: 'Associate a <label> with the <select> element or provide an aria-label.',
    suggestedFixSnippet: '<label for="stateSelect">Select Jurisdiction</label>\n<select id="stateSelect" name="state">...</select>',
  },
  {
    ruleId: 'autocomplete-valid',
    wcagCriteria: ['1.3.5'],
    wcagCriterionName: 'Identify Input Purpose',
    principle: 'Understandable',
    wcagLevel: 'AA',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Citizens with cognitive disabilities rely on browser autofill to avoid arduous typing and errors.',
    remediation: 'Provide valid autocomplete tokens (e.g. name, email, tel, address-line1).',
    suggestedFixSnippet: '<input id="email" type="email" autocomplete="email" />',
  },

  // === ROBUST ===
  {
    ruleId: 'button-name',
    wcagCriteria: ['4.1.2'],
    wcagCriterionName: 'Name, Role, Value',
    principle: 'Robust',
    wcagLevel: 'A',
    gigwCheckpoint: '5.1',
    gigwDescription: 'Ensure all interactive elements have accessible names',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen reader users hear "Button" with zero explanation of what happens if pressed.',
    remediation: 'Provide visible text inside the button or use aria-label for icon buttons.',
    suggestedFixSnippet: '<button type="submit" aria-label="Search Portal Database">\n  <SearchIcon aria-hidden="true" />\n  <span class="sr-only">Search</span>\n</button>',
  },
  {
    ruleId: 'aria-allowed-attr',
    wcagCriteria: ['4.1.2'],
    wcagCriterionName: 'Name, Role, Value',
    principle: 'Robust',
    wcagLevel: 'A',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Invalid ARIA attributes can break assistive technology parsing or produce nonsensical announcements.',
    remediation: 'Only use ARIA attributes permitted for the elements role according to W3C ARIA specifications.',
    suggestedFixSnippet: '<!-- Use aria-expanded on button, not on static text -->\n<button aria-expanded="false" aria-controls="menuId">Menu</button>',
  },
  {
    ruleId: 'aria-hidden-focus',
    wcagCriteria: ['4.1.2'],
    wcagCriterionName: 'Name, Role, Value',
    principle: 'Robust',
    wcagLevel: 'A',
    effort: 'Moderate (30m-1h)',
    userImpact: 'Keyboard focus enters elements hidden from screen readers, causing mysterious "ghost" focus stops.',
    remediation: 'Never place focusable elements inside containers marked with aria-hidden="true". Use tabindex="-1" or inert.',
    suggestedFixSnippet: '<div aria-hidden="true">\n  <!-- Interactive elements must be disabled or excluded from tab order -->\n  <button tabIndex="-1" disabled>Background Action</button>\n</div>',
  },
  {
    ruleId: 'duplicate-id',
    wcagCriteria: ['4.1.1'],
    wcagCriterionName: 'Parsing',
    principle: 'Robust',
    wcagLevel: 'A',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Labels, descriptions, and ARIA relationships mapped via ID link to the wrong element.',
    remediation: 'Ensure all id attributes on the page are strictly unique.',
    suggestedFixSnippet: '<input id="mobile_primary" name="mobile_primary" />\n<input id="mobile_alternate" name="mobile_alternate" />',
  },
  {
    ruleId: 'landmark-one-main',
    wcagCriteria: ['1.3.1'],
    wcagCriterionName: 'Info and Relationships',
    principle: 'Perceivable',
    wcagLevel: 'A',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Screen reader users cannot quickly jump past headers and sidebars to the main content landmark.',
    remediation: 'Wrap primary page content in a single <main> element.',
    suggestedFixSnippet: '<header>...</header>\n<main id="main-content">\n  <h1>Page Content</h1>\n</main>\n<footer>...</footer>',
  },
  {
    ruleId: 'region',
    wcagCriteria: ['1.3.1'],
    wcagCriterionName: 'Info and Relationships',
    principle: 'Perceivable',
    wcagLevel: 'A',
    effort: 'Quick Fix (<15m)',
    userImpact: 'Content outside landmarks is difficult to discover for blind users jumping across structural sections.',
    remediation: 'Ensure all page content resides within appropriate landmark containers (<header>, <nav>, <main>, <aside>, <footer>).',
    suggestedFixSnippet: '<header role="banner">...</header>\n<nav aria-label="Main">...</nav>\n<main>...</main>\n<footer role="contentinfo">...</footer>',
  },
];

/**
 * Benchmark comparisons from WebAIM Million 2024 analysis.
 */
export interface WebAIMBenchmark {
  source: string;
  year: number;
  avgErrorsPerPage: number;
  govtAvgErrorsPerPage: number;
  pctLowContrastText: number;
  pctMissingAltText: number;
  pctEmptyLinks: number;
  pctMissingFormLabels: number;
  pctEmptyButtons: number;
  pctMissingDocLanguage: number;
}

export const WEBAIM_BENCHMARK: WebAIMBenchmark = {
  source: 'WebAIM Million - Annual Accessibility Analysis',
  year: 2024,
  avgErrorsPerPage: 51.0,
  govtAvgErrorsPerPage: 37.2,
  pctLowContrastText: 79.1,
  pctMissingAltText: 55.5,
  pctEmptyLinks: 15.8,
  pctMissingFormLabels: 43.8,
  pctEmptyButtons: 26.9,
  pctMissingDocLanguage: 17.1,
};

/**
 * Comprehensive executive summary statistics.
 */
export interface DashboardSummary {
  totalSites: number;
  avgViolationsPerSite: number;
  overallPassRate: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  violationsByPrinciple: {
    Perceivable: number;
    Operable: number;
    Understandable: number;
    Robust: number;
  };
  siteRankings: Array<{
    scanTargetId: string;
    siteName: string;
    url: string;
    totalViolations: number;
    passRate: number;
  }>;
}
