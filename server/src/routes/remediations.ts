import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/remediations
 *
 * Aggregates violations across ALL portals (latest scan per portal only),
 * groups by ruleId, and returns a prioritised fix list with:
 * - affected portal count & names
 * - total node count across all portals
 * - severity, WCAG criterion, principle
 * - remediation guidance + suggested fix snippet
 * - fix effort estimate
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get latest scan per target
    const targets = await prisma.scanTarget.findMany({
      include: {
        scans: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });

    const latestScanIds = targets
      .filter((t) => t.scans.length > 0)
      .map((t) => t.scans[0].id);

    if (latestScanIds.length === 0) {
      return res.json({ remediations: [], totalRules: 0, totalAffectedNodes: 0 });
    }

    // Fetch all violations from latest scans with their parent scan + target info
    const violations = await prisma.violation.findMany({
      where: { scanResultId: { in: latestScanIds } },
      include: {
        scanResult: {
          select: {
            scanTargetId: true,
            scanTarget: { select: { siteName: true, url: true } },
          },
        },
      },
    });

    // Group by ruleId
    const ruleMap = new Map<
      string,
      {
        ruleId: string;
        wcagCriterion: string;
        wcagCriterionName: string;
        principle: string;
        severity: string;
        description: string;
        helpUrl: string;
        remediation: string | null;
        suggestedFixSnippet: string | null;
        userImpact: string | null;
        effort: string | null;
        wcagLevel: string | null;
        totalNodeCount: number;
        affectedPortals: Map<string, { siteName: string; url: string; nodeCount: number }>;
      }
    >();

    for (const v of violations) {
      const existing = ruleMap.get(v.ruleId);
      const portalId = v.scanResult.scanTargetId;
      const portalInfo = {
        siteName: v.scanResult.scanTarget.siteName,
        url: v.scanResult.scanTarget.url,
        nodeCount: v.nodeCount,
      };

      if (existing) {
        existing.totalNodeCount += v.nodeCount;
        const existingPortal = existing.affectedPortals.get(portalId);
        if (existingPortal) {
          existingPortal.nodeCount += v.nodeCount;
        } else {
          existing.affectedPortals.set(portalId, portalInfo);
        }
      } else {
        const portals = new Map<string, { siteName: string; url: string; nodeCount: number }>();
        portals.set(portalId, portalInfo);
        ruleMap.set(v.ruleId, {
          ruleId: v.ruleId,
          wcagCriterion: v.wcagCriterion,
          wcagCriterionName: v.wcagCriterionName,
          principle: v.principle,
          severity: v.severity,
          description: v.description,
          helpUrl: v.helpUrl,
          remediation: v.remediation,
          suggestedFixSnippet: v.suggestedFixSnippet,
          userImpact: v.userImpact,
          effort: v.effort,
          wcagLevel: v.wcagLevel,
          totalNodeCount: v.nodeCount,
          affectedPortals: portals,
        });
      }
    }

    // Sort by priority: severity rank × affected portals × node count
    const severityRank: Record<string, number> = { critical: 4, serious: 3, moderate: 2, minor: 1 };

    const remediations = [...ruleMap.values()]
      .map((r) => ({
        ruleId: r.ruleId,
        wcagCriterion: r.wcagCriterion,
        wcagCriterionName: r.wcagCriterionName,
        principle: r.principle,
        severity: r.severity,
        description: r.description,
        helpUrl: r.helpUrl,
        remediation: r.remediation,
        suggestedFixSnippet: r.suggestedFixSnippet,
        userImpact: r.userImpact,
        effort: r.effort,
        wcagLevel: r.wcagLevel,
        totalNodeCount: r.totalNodeCount,
        affectedPortalCount: r.affectedPortals.size,
        affectedPortals: [...r.affectedPortals.values()],
        // Priority score for sorting (higher = fix first)
        priorityScore:
          (severityRank[r.severity] || 1) * r.affectedPortals.size * Math.log2(r.totalNodeCount + 1),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const totalAffectedNodes = remediations.reduce((sum, r) => sum + r.totalNodeCount, 0);

    res.json({
      remediations,
      totalRules: remediations.length,
      totalAffectedNodes,
      totalPortalsScanned: latestScanIds.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
