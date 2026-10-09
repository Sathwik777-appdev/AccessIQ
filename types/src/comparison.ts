import { ViolationsBySeverity } from './scan';

/**
 * Result of comparing two scan runs (before/after).
 */
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
  wcagPassRateBefore: number; // 0-100
  wcagPassRateAfter: number;  // 0-100
  lighthouseScoreBefore?: number | null;
  lighthouseScoreAfter?: number | null;
  severityBefore: ViolationsBySeverity;
  severityAfter: ViolationsBySeverity;
  fixedRules: FixedRule[];
  remainingRules: RemainingRule[];
  introducedRules: IntroducedRule[];
}

export interface FixedRule {
  ruleId: string;
  wcagCriterion: string;
  wcagCriterionName: string;
  severity: string;
  nodeCountBefore: number;
}

export interface RemainingRule {
  ruleId: string;
  wcagCriterion: string;
  wcagCriterionName: string;
  severity: string;
  nodeCountBefore: number;
  nodeCountAfter: number;
}

export interface IntroducedRule {
  ruleId: string;
  wcagCriterion: string;
  wcagCriterionName: string;
  severity: string;
  nodeCountAfter: number;
}
