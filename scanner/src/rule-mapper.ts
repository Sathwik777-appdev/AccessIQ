import { v4 as uuidv4 } from 'uuid';
import {
  Violation,
  WcagPrinciple,
  Severity,
  WcagVersion,
  ConformanceTarget,
  WCAG_RULE_MAP,
} from '@accessiq/types';

/**
 * Raw axe-core violation result shape (partial, only what we need).
 */
interface AxeViolationResult {
  id: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  description: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

interface AxeNode {
  target: string | string[] | string[][];
  html: string;
  failureSummary?: string;
}

/**
 * Maps axe-core impact level to our severity enum.
 * axe-core uses: critical, serious, moderate, minor — same as ours.
 */
function mapImpactToSeverity(impact?: string | null): Severity {
  switch (impact) {
    case 'critical':
      return 'critical';
    case 'serious':
      return 'serious';
    case 'moderate':
      return 'moderate';
    case 'minor':
      return 'minor';
    default:
      return 'moderate'; // Default to moderate if impact is missing or null
  }
}

/**
 * Extracts the primary WCAG criterion number from axe-core tags.
 * Tags look like: ['wcag2a', 'wcag111', 'cat.text-alternatives']
 * We want to extract '1.1.1' from 'wcag111'.
 */
function extractWcagCriterionFromTags(tags: string[]): string {
  for (const tag of tags) {
    // Match patterns like wcag111, wcag143, wcag2411
    const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
  }
  return 'unknown';
}

/**
 * Determines the WCAG principle from a criterion number.
 * 1.x.x = Perceivable, 2.x.x = Operable, 3.x.x = Understandable, 4.x.x = Robust
 */
function getPrincipleFromCriterion(criterion: string): WcagPrinciple {
  const principleNum = criterion.charAt(0);
  switch (principleNum) {
    case '1':
      return 'Perceivable';
    case '2':
      return 'Operable';
    case '3':
      return 'Understandable';
    case '4':
      return 'Robust';
    default:
      return 'Robust';
  }
}

/**
 * Looks up a rule ID in our WCAG mapping table and returns enriched info.
 */
function lookupRuleMapping(ruleId: string) {
  return WCAG_RULE_MAP.find((m: { ruleId: string }) => m.ruleId === ruleId);
}

/**
 * Maps a single axe-core violation to one or more of our Violation objects.
 * Each axe violation may affect multiple nodes, so we create one Violation
 * per unique rule rather than per node, and count affected nodes.
 */
export function mapAxeViolation(
  axeViolation: AxeViolationResult,
  scanResultId: string,
): Violation[] {
  const mapping = lookupRuleMapping(axeViolation.id);

  const wcagCriterion = mapping
    ? mapping.wcagCriteria[0]
    : extractWcagCriterionFromTags(axeViolation.tags);

  const wcagCriterionName = mapping?.wcagCriterionName || axeViolation.description;

  const principle = mapping?.principle || getPrincipleFromCriterion(wcagCriterion);

  const gigwCheckpoint = mapping?.gigwCheckpoint || null;

  // Get the first node's selector and HTML for display, count all nodes
  const firstNode = axeViolation.nodes[0];
  const selector = Array.isArray(firstNode?.target)
    ? firstNode.target.flat(Infinity).join(' > ')
    : typeof firstNode?.target === 'string'
      ? firstNode.target
      : 'unknown';
  const htmlSnippet = firstNode?.html || '';
  const nodeCount = axeViolation.nodes.length;

  const violation: Violation = {
    id: uuidv4(),
    scanResultId,
    ruleId: axeViolation.id,
    wcagCriterion,
    wcagCriterionName,
    gigwCheckpoint,
    principle,
    severity: mapImpactToSeverity(axeViolation.impact),
    description: axeViolation.description,
    helpUrl: axeViolation.helpUrl,
    selector,
    htmlSnippet: htmlSnippet.substring(0, 500), // Truncate long snippets
    nodeCount,
    remediation: mapping?.remediation || `Ensure ${axeViolation.id} follows WCAG ${wcagCriterion} specifications.`,
    suggestedFixSnippet: mapping?.suggestedFixSnippet || null,
    userImpact: mapping?.userImpact || 'Users with disabilities may experience barriers accessing this component.',
    effort: mapping?.effort || 'Quick Fix (<15m)',
    wcagLevel: mapping?.wcagLevel || 'AA',
  };

  return [violation];
}

/**
 * Maps all raw axe-core violations to our Violation schema.
 */
export function mapAxeResults(
  axeViolations: AxeViolationResult[],
  scanResultId: string,
): Violation[] {
  return axeViolations.flatMap((v) => mapAxeViolation(v, scanResultId));
}

/**
 * Returns the appropriate axe-core WCAG tags based on version and conformance target.
 */
export function getWcagTagsForTarget(
  wcagVersion: WcagVersion = '2.2',
  conformanceTarget: ConformanceTarget = 'AA',
): string[] {
  const tags: string[] = [];

  // Always include Level A
  tags.push('wcag2a');

  // Include Level AA if target is AA or AAA
  if (conformanceTarget === 'AA' || conformanceTarget === 'AAA') {
    tags.push('wcag2aa');
  }

  // Include WCAG 2.1 specific tags
  if (wcagVersion === '2.1' || wcagVersion === '2.2') {
    tags.push('wcag21a', 'wcag21aa');
  }

  // Include WCAG 2.2 specific tags
  if (wcagVersion === '2.2') {
    tags.push('wcag22aa');
  }

  // Always include best practices
  tags.push('best-practice');

  return tags;
}
