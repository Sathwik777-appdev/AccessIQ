export interface FocusStep {
  step: number;
  selector: string;
  tagName: string;
  role: string;
  accessibleName: string;
  hasVisibleOutline: boolean;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  isKeyboardTrapCandidate: boolean;
  notes?: string;
}

export interface KeyboardAuditReport {
  totalInteractiveElements: number;
  traversedSteps: FocusStep[];
  keyboardTrapDetected: boolean;
  missingFocusIndicatorCount: number;
  unexpectedJumpCount: number;
  tabNavigationScore: number; // 0 to 100
  summary: string;
}

export interface IndicLanguageReport {
  detectedLanguages: Array<{
    code: string;
    name: string;
    textSample: string;
    hasProperLangAttribute: boolean;
  }>;
  kannadaScriptDetected: boolean;
  legacyAsciiFontDetected: boolean; // e.g. Nudi, Baraha
  legacyFontNamesFound: string[];
  unicodeComplianceScore: number; // 0 to 100
  bilingualParityScore: number; // 0 to 100
  recommendations: string[];
}

export interface AccessiblePalettePair {
  originalForeground: string;
  originalBackground: string;
  originalRatio: number;
  suggestedForeground: string;
  suggestedBackground: string;
  targetRatio: number; // e.g., 4.5 or 7.0
  wcagLevel: 'AA' | 'AAA';
  cssVariable: string;
  cssRuleSnippet: string;
}

export interface PaletteTunerReport {
  portalBrandColors: string[];
  contrastPairs: AccessiblePalettePair[];
  generatedCssVariables: string;
}

export interface CrawlPageSummary {
  url: string;
  title: string;
  depth: number;
  totalViolations: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  passRate: number;
  scanDurationMs: number;
}

export interface DomainCrawlReport {
  rootUrl: string;
  domain: string;
  totalPagesScanned: number;
  averagePassRate: number;
  totalDomainViolations: number;
  criticalTotal: number;
  seriousTotal: number;
  pages: CrawlPageSummary[];
  topRecurringViolations: Array<{
    ruleId: string;
    description: string;
    affectedPagesCount: number;
    totalElements: number;
  }>;
}
