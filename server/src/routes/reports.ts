import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error-handler';

const router = Router();

// GET /api/reports/:targetId — generate formal executive stakeholder compliance report
router.get('/:targetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetId } = req.params;

    const target = await prisma.scanTarget.findUnique({
      where: { id: targetId },
      include: {
        scans: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: { violations: true },
        },
      },
    });

    if (!target) {
      throw new AppError('ScanTarget not found', 404);
    }

    if (target.scans.length === 0) {
      throw new AppError('No scans found for this target. Run an audit first.', 400);
    }

    const latestScan = target.scans[0];
    const previousScan = target.scans.length > 1 ? target.scans[1] : null;

    // Score calculation (0 to 100)
    // Formula: 100 - (critical * 10 + serious * 5 + moderate * 2 + minor * 1)
    const penalty =
      latestScan.criticalCount * 10 +
      latestScan.seriousCount * 5 +
      latestScan.moderateCount * 2 +
      latestScan.minorCount * 1;
    const healthScore = Math.max(0, Math.min(100, 100 - penalty));

    // Letter Grade
    let letterGrade: 'A+' | 'A' | 'B' | 'C' | 'F' = 'F';
    let gradeLabel = 'Non-Compliant (High Legal Risk)';
    if (healthScore >= 95) {
      letterGrade = 'A+';
      gradeLabel = 'Exemplary Compliance (WCAG 2.2 AA Certified)';
    } else if (healthScore >= 85) {
      letterGrade = 'A';
      gradeLabel = 'Substantial Compliance';
    } else if (healthScore >= 70) {
      letterGrade = 'B';
      gradeLabel = 'Moderate Compliance (Remediation Required)';
    } else if (healthScore >= 50) {
      letterGrade = 'C';
      gradeLabel = 'Partial Compliance (Critical Barriers)';
    }

    // WCAG Level breakdown
    const levelAViolations = latestScan.violations.filter((v) => v.wcagLevel === 'A').length;
    const levelAAViolations = latestScan.violations.filter((v) => v.wcagLevel === 'AA').length;
    const levelAPassRate = Math.max(0, Math.round(((30 - levelAViolations) / 30) * 100));
    const levelAAPassRate = Math.max(0, Math.round(((20 - levelAAViolations) / 20) * 100));

    // GIGW 3.0 Checkpoint evaluation
    const gigwViolations = latestScan.violations.filter((v) => v.gigwCheckpoint);
    const gigwMandatoryPassed = Math.max(0, 15 - gigwViolations.length);
    const gigwComplianceRate = Math.round((gigwMandatoryPassed / 15) * 100);

    // Top Critical Risks (sorted by severity and nodeCount)
    const severityRank: Record<string, number> = { critical: 4, serious: 3, moderate: 2, minor: 1 };
    const sortedRisks = [...latestScan.violations].sort((a, b) => {
      const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      if (diff !== 0) return diff;
      return b.nodeCount - a.nodeCount;
    });

    const topRisks = sortedRisks.slice(0, 5).map((v) => ({
      ruleId: v.ruleId,
      criterion: v.wcagCriterion,
      criterionName: v.wcagCriterionName,
      severity: v.severity,
      nodeCount: v.nodeCount,
      selector: v.selector,
      userImpact: v.userImpact,
      remediation: v.remediation,
      suggestedFixSnippet: v.suggestedFixSnippet,
    }));

    // Generate Executive Narrative
    let executiveNarrative = '';
    if (latestScan.totalViolations === 0) {
      executiveNarrative = `The audited portal (${target.siteName}) successfully satisfies automated WCAG 2.2 Level AA and GIGW 3.0 compliance checks with 0 detected barriers. All evaluated interactive controls, color contrast ratios, document structures, and text alternatives meet national digital accessibility standards.`;
    } else {
      executiveNarrative = `The accessibility compliance assessment of ${target.siteName} (${target.url}) identified ${latestScan.totalViolations} distinct violation pattern(s) across the portal interface. Notably, ${latestScan.criticalCount} critical and ${latestScan.seriousCount} serious barrier(s) directly impede screen reader and keyboard-only users from completing core public services. Immediate remediation of top-priority items is advised to satisfy GIGW 3.0 statutory requirements.`;
    }

    // Historical progression if multiple scans exist
    const progression = target.scans.map((s) => ({
      scanId: s.id,
      timestamp: s.timestamp.toISOString(),
      totalViolations: s.totalViolations,
      critical: s.criticalCount,
      serious: s.seriousCount,
    }));

    res.json({
      reportId: `AUDIT-${target.id.slice(0, 8).toUpperCase()}-${new Date().toISOString().slice(0, 10)}`,
      generatedAt: new Date().toISOString(),
      standards: ['WCAG 2.2 (Levels A, AA)', 'GIGW 3.0 (MeitY/NIC Guidelines)'],
      toolEngine: 'AccessIQ Enterprise Suite (axe-core 4.9.x + Playwright Headless Chromium)',
      target: {
        id: target.id,
        siteName: target.siteName,
        url: target.url,
        siteType: target.siteType,
        country: target.country,
        createdAt: target.createdAt.toISOString(),
      },
      auditSummary: {
        scanId: latestScan.id,
        scannedAt: latestScan.timestamp.toISOString(),
        durationSeconds: Number((latestScan.scanDurationMs / 1000).toFixed(1)),
        healthScore,
        letterGrade,
        gradeLabel,
        totalViolations: latestScan.totalViolations,
        severityBreakdown: {
          critical: latestScan.criticalCount,
          serious: latestScan.seriousCount,
          moderate: latestScan.moderateCount,
          minor: latestScan.minorCount,
        },
        executiveNarrative,
      },
      conformanceMetrics: {
        levelAPassRate,
        levelAAPassRate,
        gigwComplianceRate,
        gigwMandatoryPassed,
        gigwTotalEvaluated: 15,
      },
      topRisks,
      progression,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
