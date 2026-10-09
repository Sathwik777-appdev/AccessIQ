// Site type classification
export type SiteType =
  | 'central-govt'
  | 'state-govt'
  | 'psu'
  | 'municipal'
  | 'international-benchmark'
  | 'demo-page';

// Scanning tool identifier
export type ScanTool = 'axe-core' | 'pa11y' | 'lighthouse';

// WCAG version
export type WcagVersion = '2.1' | '2.2';

// Conformance target level
export type ConformanceTarget = 'A' | 'AA' | 'AAA';

// Violation severity levels (maps from axe-core 'impact' field)
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

// WCAG Principles
export type WcagPrinciple = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';

// Scan job status
export type ScanJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * A website target to be scanned for accessibility compliance.
 */
export interface ScanTarget {
  id: string;
  url: string;
  siteName: string;
  siteType: SiteType;
  country: string;
  createdAt: string; // ISO 8601
}

/**
 * Severity breakdown counts.
 */
export interface ViolationsBySeverity {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

/**
 * Result of a single accessibility scan run against one URL.
 */
export interface ScanResult {
  id: string;
  scanTargetId: string;
  timestamp: string; // ISO 8601
  url: string;
  tool: ScanTool;
  wcagVersion: WcagVersion;
  conformanceTarget: ConformanceTarget;
  totalViolations: number;
  violationsBySeverity: ViolationsBySeverity;
  violations: Violation[];
  lighthouseScore?: number | null;
  scanDurationMs: number;
  error?: string | null;
}

/**
 * A single accessibility violation found during a scan.
 */
export interface Violation {
  id: string;
  scanResultId: string;
  ruleId: string; // axe-core rule ID (e.g., 'color-contrast')
  wcagCriterion: string; // e.g., '1.4.3'
  wcagCriterionName: string; // e.g., 'Contrast (Minimum)'
  gigwCheckpoint?: string | null; // GIGW 3.0 checkpoint number
  principle: WcagPrinciple;
  severity: Severity;
  description: string;
  helpUrl: string;
  selector: string; // CSS selector of the failing element
  htmlSnippet: string;
  nodeCount: number; // how many elements on the page have this issue
  remediation?: string | null; // Step-by-step guidance to fix
  suggestedFixSnippet?: string | null; // Recommended accessible code pattern
  userImpact?: string | null; // Explanation of how users with disabilities are impacted
  effort?: 'Quick Fix (<15m)' | 'Moderate (30m-1h)' | 'Architectural (2h+)' | null;
  wcagLevel?: 'A' | 'AA' | 'AAA' | null;
}

/**
 * A scan job that runs in the background.
 */
export interface ScanJob {
  jobId: string;
  scanTargetId: string;
  status: ScanJobStatus;
  scanResultId?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

/**
 * Summary of a scan target with its latest scan data.
 */
export interface ScanTargetWithSummary extends ScanTarget {
  lastScannedAt?: string | null;
  lastScanTotalViolations?: number | null;
  lastScanViolationsBySeverity?: ViolationsBySeverity | null;
  lastScanPassRate?: number | null;
}
