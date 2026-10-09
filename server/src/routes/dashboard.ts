import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/dashboard/summary — aggregate stats across all tracked sites
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const targets = await prisma.scanTarget.findMany({
      include: {
        scans: {
          orderBy: { timestamp: 'desc' },
          take: 2,
        },
      },
    });

    const totalSites = targets.length;
    let totalViolations = 0;
    let sitesWithScans = 0;
    const principleCount = { Perceivable: 0, Operable: 0, Understandable: 0, Robust: 0 };
    let betterCount = 0;
    let worseCount = 0;
    let trendPctSum = 0;

    const siteRankings: Array<{
      scanTargetId: string;
      siteName: string;
      siteType: string;
      url: string;
      totalViolations: number;
      passRate: number;
      lastScannedAt: string;
      criticalCount: number;
      seriousCount: number;
    }> = [];

    for (const target of targets) {
      const scans = target.scans;
      if (scans.length > 0) {
        sitesWithScans++;
        const latest = scans[0];
        totalViolations += latest.totalViolations;
        const passRate = Math.max(0, Math.round(((50 - latest.totalViolations) / 50) * 100));

        siteRankings.push({
          scanTargetId: target.id,
          siteName: target.siteName,
          siteType: target.siteType,
          url: target.url,
          totalViolations: latest.totalViolations,
          passRate,
          lastScannedAt: latest.timestamp.toISOString(),
          criticalCount: latest.criticalCount,
          seriousCount: latest.seriousCount,
        });

        // Trend: compare latest to previous
        if (scans.length > 1) {
          const previous = scans[1];
          if (latest.totalViolations < previous.totalViolations) {
            betterCount++;
            trendPctSum += ((previous.totalViolations - latest.totalViolations) / previous.totalViolations) * 100;
          } else if (latest.totalViolations > previous.totalViolations) {
            worseCount++;
            trendPctSum -= ((latest.totalViolations - previous.totalViolations) / previous.totalViolations) * 100;
          }
        }
      }
    }

    // Get violations by principle from latest scans
    if (sitesWithScans > 0) {
      const latestScanIds = targets
        .filter((t) => t.scans.length > 0)
        .map((t) => t.scans[0].id);

      const violations = await prisma.violation.findMany({
        where: { scanResultId: { in: latestScanIds } },
        select: { principle: true },
      });

      for (const v of violations) {
        const principle = v.principle as keyof typeof principleCount;
        if (principle in principleCount) {
          principleCount[principle]++;
        }
      }
    }

    // Sort rankings: best (least violations) first
    siteRankings.sort((a, b) => a.totalViolations - b.totalViolations);

    const avgViolations = sitesWithScans > 0 ? Math.round(totalViolations / sitesWithScans) : 0;
    const avgPassRate = siteRankings.length > 0
      ? Math.round(siteRankings.reduce((sum, s) => sum + s.passRate, 0) / siteRankings.length)
      : 0;

    const trendDirection: 'improving' | 'declining' | 'stable' =
      betterCount > worseCount ? 'improving' : worseCount > betterCount ? 'declining' : 'stable';

    const trendPercentage = sitesWithScans > 0 ? Math.round(trendPctSum / sitesWithScans) : 0;

    res.json({
      totalSites,
      avgViolationsPerSite: avgViolations,
      overallPassRate: avgPassRate,
      trendDirection,
      trendPercentage,
      violationsByPrinciple: principleCount,
      siteRankings,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/benchmark — WebAIM Million comparison
router.get('/benchmark', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Static WebAIM Million benchmark data (2024)
    const webAimBenchmark = {
      source: 'WebAIM Million - Annual Accessibility Analysis',
      year: 2024,
      avgErrorsPerPage: 51,
      govtAvgErrorsPerPage: 37.2,
      pctLowContrastText: 79.1,
      pctMissingAltText: 55.5,
      pctEmptyLinks: 15.8,
      pctMissingFormLabels: 43.8,
      pctEmptyButtons: 26.9,
      pctMissingDocLanguage: 17.1,
    };

    // Compute our own averages from the DB
    const latestScans = await prisma.scanResult.findMany({
      distinct: ['scanTargetId'],
      orderBy: { timestamp: 'desc' },
    });

    const sitesCount = latestScans.length;
    let ourAvgErrors = 0;

    if (sitesCount > 0) {
      const sumErrors = latestScans.reduce((acc, s) => acc + s.totalViolations, 0);
      ourAvgErrors = Math.round((sumErrors / sitesCount) * 10) / 10;
    }

    res.json({
      webAimBenchmark,
      ourMetrics: {
        avgErrorsPerPage: ourAvgErrors,
        sitesScanned: sitesCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
