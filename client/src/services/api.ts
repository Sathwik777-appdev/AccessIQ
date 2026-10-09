import { ViolationData } from '../components/ViolationCard';
import type { KeyboardAuditReport, DomainCrawlReport, PaletteTunerReport, IndicLanguageReport } from '@accessiq/types';
export type { KeyboardAuditReport, DomainCrawlReport, PaletteTunerReport, IndicLanguageReport };

export interface ScanTarget {
  id: string;
  url: string;
  siteName: string;
  siteType: string;
  country: string;
  createdAt: string;
  lastScannedAt?: string | null;
  lastScanId?: string | null;
  lastScanTotalViolations?: number | null;
  lastScanViolationsBySeverity?: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  } | null;
  lastScanPassRate?: number | null;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  totalViolations: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  scanDurationMs: number;
  passRate: number;
  tool: string;
  wcagVersion: string;
  conformanceTarget: string;
  error?: string | null;
}

export interface ScanTargetDetail extends ScanTarget {
  scans: ScanHistoryItem[];
}

export interface ScanResultDetail {
  id: string;
  scanTargetId: string;
  siteName: string;
  timestamp: string;
  url: string;
  tool: string;
  wcagVersion: string;
  conformanceTarget: string;
  totalViolations: number;
  violationsBySeverity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  violations: ViolationData[];
  lighthouseScore: number | null;
  scanDurationMs: number;
  error: string | null;
}

export interface DashboardSummary {
  totalSites: number;
  avgViolationsPerSite: number;
  overallPassRate: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  sitesScanned: number;
  violationsByPrinciple: {
    name: string;
    value: number;
    color: string;
  }[];
  siteRankings: Array<{
    scanTargetId: string;
    siteName: string;
    siteType?: string;
    url: string;
    totalViolations: number;
    passRate: number;
    lastScannedAt?: string;
    criticalCount?: number;
    seriousCount?: number;
  }>;
}

export interface BenchmarkData {
  yourAverage: number;
  govAverage: number;
  overallAverage: number;
  pctLowContrastText?: number;
  pctMissingAltText?: number;
  pctEmptyLinks?: number;
  pctMissingFormLabels?: number;
}

export interface ComparisonResult {
  beforeScanId: string;
  afterScanId: string;
  beforeUrl: string;
  afterUrl: string;
  beforeTimestamp: string;
  afterTimestamp: string;
  violationsFixed: number;
  violationsIntroduced: number;
  violationsRemaining: number;
  totalBefore: number;
  totalAfter: number;
  wcagPassRateBefore: number;
  wcagPassRateAfter: number;
  lighthouseScoreBefore?: number | null;
  lighthouseScoreAfter?: number | null;
  severityBefore: { critical: number; serious: number; moderate: number; minor: number };
  severityAfter: { critical: number; serious: number; moderate: number; minor: number };
  fixedRules: Array<{
    ruleId: string;
    wcagCriterion: string;
    wcagCriterionName: string;
    severity: string;
    nodeCountBefore: number;
  }>;
  remainingRules: Array<{
    ruleId: string;
    wcagCriterion: string;
    wcagCriterionName: string;
    severity: string;
    nodeCountBefore: number;
    nodeCountAfter: number;
  }>;
  introducedRules: Array<{
    ruleId: string;
    wcagCriterion: string;
    wcagCriterionName: string;
    severity: string;
    nodeCountAfter: number;
  }>;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://accessiqserver-production.up.railway.app/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let message = 'An error occurred';
    try {
      const err = await res.json();
      message = err.error || message;
    } catch (err: unknown) {
      if (err instanceof Error) {
        // ignore or handle
      }
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  fetchTargets: () => fetchJSON<ScanTarget[]>('/targets'),

  fetchTarget: (id: string) => fetchJSON<ScanTargetDetail>(`/targets/${id}`),

  createTarget: (data: { url: string; siteName: string; siteType: string; country?: string }) =>
    fetchJSON<ScanTarget>('/targets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  triggerScan: (scanTargetId: string) =>
    fetchJSON<{ jobId: string; status: string }>('/scans', {
      method: 'POST',
      body: JSON.stringify({ scanTargetId }),
    }),

  pollScanStatus: (jobId: string) =>
    fetchJSON<{ jobId: string; status: string; scanResultId?: string; error?: string }>(
      `/scans/${jobId}/status`,
    ),

  fetchScanResult: (scanId: string) => fetchJSON<ScanResultDetail>(`/scans/${scanId}`),

  fetchComparison: (beforeId: string, afterId: string) =>
    fetchJSON<ComparisonResult>(`/scans/${beforeId}/compare/${afterId}`),

  fetchDashboardSummary: async (): Promise<DashboardSummary> => {
    const raw = await fetchJSON<any>('/dashboard/summary');
    const principleColors: Record<string, string> = {
      Perceivable: '#2563eb', // Blue
      Operable: '#059669', // Emerald
      Understandable: '#d97706', // Amber
      Robust: '#7c3aed', // Purple
    };
    const violationsByPrinciple = Object.entries(raw.violationsByPrinciple || {}).map(
      ([key, val]) => ({
        name: key,
        value: Number(val) || 0,
        color: principleColors[key] || '#6b7280',
      }),
    );
    return {
      totalSites: raw.totalSites || 0,
      avgViolationsPerSite: raw.avgViolationsPerSite || 0,
      overallPassRate: raw.overallPassRate || 0,
      trendDirection: raw.trendDirection || 'stable',
      trendPercentage: raw.trendPercentage || 0,
      sitesScanned: raw.siteRankings?.length || 0,
      violationsByPrinciple,
      siteRankings: raw.siteRankings || [],
    };
  },

  fetchBenchmark: async (): Promise<BenchmarkData> => {
    const raw = await fetchJSON<any>('/dashboard/benchmark');
    return {
      yourAverage: raw.ourMetrics?.avgErrorsPerPage || 0,
      govAverage: raw.webAimBenchmark?.govtAvgErrorsPerPage || 37.2,
      overallAverage: raw.webAimBenchmark?.avgErrorsPerPage || 51.0,
      pctLowContrastText: raw.webAimBenchmark?.pctLowContrastText,
      pctMissingAltText: raw.webAimBenchmark?.pctMissingAltText,
      pctEmptyLinks: raw.webAimBenchmark?.pctEmptyLinks,
      pctMissingFormLabels: raw.webAimBenchmark?.pctMissingFormLabels,
    };
  },

  quickScan: (url: string, siteName?: string) =>
    fetchJSON<{
      scanResultId: string;
      targetId: string;
      siteName: string;
      totalViolations: number;
      violationsBySeverity: { critical: number; serious: number; moderate: number; minor: number };
      scanDurationMs: number;
      error?: string | null;
    }>('/scans/quick', {
      method: 'POST',
      body: JSON.stringify({ url, siteName }),
    }),

  fetchReport: (targetId: string) => fetchJSON<ExecutiveReportData>(`/reports/${targetId}`),

  fetchRemediations: () => fetchJSON<RemediationsResponse>('/remediations'),

  saveFieldAudit: (data: CreateFieldAuditPayload) =>
    fetchJSON<FieldAuditReportFull>('/field-audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fetchFieldAudits: () => fetchJSON<FieldAuditReportSummary[]>('/field-audits'),

  fetchFieldAudit: (id: string) => fetchJSON<FieldAuditReportFull>(`/field-audits/${id}`),

  deleteFieldAudit: (id: string) =>
    fetchJSON<{ message: string }>(`/field-audits/${id}`, { method: 'DELETE' }),

  runKeyboardAudit: (url: string, maxSteps?: number) =>
    fetchJSON<KeyboardAuditReport>('/scans/keyboard', {
      method: 'POST',
      body: JSON.stringify({ url, maxSteps }),
    }),

  runDomainCrawl: (url: string, maxPages?: number) =>
    fetchJSON<DomainCrawlReport>('/scans/crawl', {
      method: 'POST',
      body: JSON.stringify({ url, maxPages }),
    }),

  tunePalette: (pairs: Array<{ fg: string; bg: string; label?: string }>) =>
    fetchJSON<PaletteTunerReport>('/scans/palette', {
      method: 'POST',
      body: JSON.stringify({ pairs }),
    }),

  checkIndicCompliance: (url: string) =>
    fetchJSON<IndicLanguageReport>('/scans/indic', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};

export interface RemediationItem {
  ruleId: string;
  wcagCriterion: string;
  wcagCriterionName: string;
  principle: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  helpUrl: string;
  remediation: string | null;
  htmlSnippet: string | null;
  suggestedFixSnippet: string | null;
  userImpact: string | null;
  effort: string | null;
  wcagLevel: string | null;
  totalNodeCount: number;
  affectedPortalCount: number;
  affectedPortals: Array<{ siteName: string; url: string; nodeCount: number }>;
  priorityScore: number;
}

export interface RemediationsResponse {
  remediations: RemediationItem[];
  totalRules: number;
  totalAffectedNodes: number;
  totalPortalsScanned: number;
}

export interface CreateFieldAuditPayload {
  officeName: string;
  location: string;
  inspectorName: string;
  findings: Array<{
    checklistItemId: string;
    passed: boolean;
    notes?: string;
  }>;
  photos?: Array<{
    caption: string;
    category: string;
    dataUrl: string;
  }>;
  totalScore: number;
  maxScore: number;
}

export interface FieldAuditReportSummary {
  id: string;
  officeName: string;
  location: string;
  inspectorName: string;
  totalScore: number;
  maxScore: number;
  scorePercent: number;
  createdAt: string;
  _count: { findings: number; photos: number };
}

export interface FieldAuditReportFull {
  id: string;
  officeName: string;
  location: string;
  inspectorName: string;
  totalScore: number;
  maxScore: number;
  scorePercent: number;
  createdAt: string;
  findings: Array<{
    id: string;
    checklistItemId: string;
    passed: boolean;
    notes: string | null;
  }>;
  photos: Array<{
    id: string;
    caption: string;
    category: string;
    dataUrl: string;
  }>;
}

export interface ExecutiveReportData {
  reportId: string;
  generatedAt: string;
  standards: string[];
  toolEngine: string;
  target: {
    id: string;
    siteName: string;
    url: string;
    siteType: string;
    country: string;
    createdAt: string;
  };
  auditSummary: {
    scanId: string;
    scannedAt: string;
    durationSeconds: number;
    healthScore: number;
    letterGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
    gradeLabel: string;
    totalViolations: number;
    severityBreakdown: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    };
    executiveNarrative: string;
  };
  conformanceMetrics: {
    levelAPassRate: number;
    levelAAPassRate: number;
    gigwComplianceRate: number;
    gigwMandatoryPassed: number;
    gigwTotalEvaluated: number;
  };
  topRisks: Array<{
    ruleId: string;
    criterion: string;
    criterionName: string;
    severity: string;
    nodeCount: number;
    selector: string;
    userImpact?: string;
    remediation?: string;
    suggestedFixSnippet?: string;
  }>;
  progression: Array<{
    scanId: string;
    timestamp: string;
    totalViolations: number;
    critical: number;
    serious: number;
  }>;
}
