import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/error-handler';
import { scanUrl, traceKeyboardFocus, crawlAndAuditDomain, tunePaletteForContrast, validateIndicAndKannadaCompliance } from '@accessiq/scanner';
import { Violation } from '@accessiq/types';

const router = Router();

const createScanSchema = z.object({
  scanTargetId: z.string().min(1),
});

// POST /api/scans — trigger a new scan (background job)
router.post('/', validate(createScanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanTargetId } = req.body;

    const target = await prisma.scanTarget.findUnique({
      where: { id: scanTargetId },
    });

    if (!target) {
      throw new AppError('ScanTarget not found', 404);
    }

    // Create a scan job
    const job = await prisma.scanJob.create({
      data: {
        scanTargetId: target.id,
        status: 'pending',
      },
    });

    // Start background scan (don't await — return immediately)
    (async () => {
      try {
        await prisma.scanJob.update({
          where: { jobId: job.jobId },
          data: { status: 'running' },
        });

        const scanOutput = await scanUrl(target.url, {
          wcagVersion: '2.2',
          conformanceTarget: 'AA',
          timeout: 30000,
        });

        if (scanOutput.error && scanOutput.totalViolations === 0) {
          throw new Error(scanOutput.error);
        }

        // Save scan result and violations in a transaction
        const scanResult = await prisma.$transaction(async (tx) => {
          const result = await tx.scanResult.create({
            data: {
              scanTargetId: target.id,
              url: target.url,
              tool: scanOutput.tool,
              wcagVersion: scanOutput.wcagVersion,
              conformanceTarget: scanOutput.conformanceTarget,
              totalViolations: scanOutput.totalViolations,
              criticalCount: scanOutput.violationsBySeverity.critical,
              seriousCount: scanOutput.violationsBySeverity.serious,
              moderateCount: scanOutput.violationsBySeverity.moderate,
              minorCount: scanOutput.violationsBySeverity.minor,
              scanDurationMs: scanOutput.scanDurationMs,
              error: scanOutput.error,
            },
          });

          if (scanOutput.violations.length > 0) {
            await tx.violation.createMany({
              data: scanOutput.violations.map((v: Violation) => ({
                scanResultId: result.id,
                ruleId: v.ruleId,
                wcagCriterion: v.wcagCriterion,
                wcagCriterionName: v.wcagCriterionName,
                gigwCheckpoint: v.gigwCheckpoint || null,
                principle: v.principle,
                severity: v.severity,
                description: v.description,
                helpUrl: v.helpUrl,
                selector: v.selector,
                htmlSnippet: v.htmlSnippet,
                nodeCount: v.nodeCount,
                remediation: v.remediation || null,
                suggestedFixSnippet: v.suggestedFixSnippet || null,
                userImpact: v.userImpact || null,
                effort: v.effort || null,
                wcagLevel: v.wcagLevel || 'AA',
              })),
            });
          }
          return result;
        });

        // Mark job complete
        await prisma.scanJob.update({
          where: { jobId: job.jobId },
          data: {
            status: 'completed',
            scanResultId: scanResult.id,
            completedAt: new Date(),
          },
        });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Scanner error:', errorMsg);
        try {
          await prisma.scanJob.update({
            where: { jobId: job.jobId },
            data: {
              status: 'failed',
              error: errorMsg,
              completedAt: new Date(),
            },
          });
        } catch (dbError) {
          console.error('Failed to update scan job status to failed:', dbError);
        }
      }
    })();

    res.status(202).json({ jobId: job.jobId, status: 'pending' });
  } catch (error) {
    next(error);
  }
});

import { publicUrlSchema } from '../lib/url-validator';

const quickScanSchema = z.object({
  url: publicUrlSchema,
  siteName: z.string().optional(),
});

// POST /api/scans/quick — run an on-demand audit directly and return result
router.post('/quick', validate(quickScanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, siteName } = req.body;

    let target = await prisma.scanTarget.findFirst({
      where: { url },
    });

    if (!target) {
      let derivedName = siteName;
      if (!derivedName) {
        try {
          const parsed = new URL(url);
          derivedName = parsed.hostname.replace(/^www\./, '');
        } catch {
          derivedName = 'Web Target';
        }
      }

      target = await prisma.scanTarget.create({
        data: {
          url,
          siteName: derivedName,
          siteType: 'central-govt',
          country: 'India',
        },
      });
    }

    const scanOutput = await scanUrl(target.url, {
      wcagVersion: '2.2',
      conformanceTarget: 'AA',
      timeout: 15000,
    });

    const scanResult = await prisma.$transaction(async (tx) => {
      const result = await tx.scanResult.create({
        data: {
          scanTargetId: target.id!,
          url: target!.url,
          tool: scanOutput.tool,
          wcagVersion: scanOutput.wcagVersion,
          conformanceTarget: scanOutput.conformanceTarget,
          totalViolations: scanOutput.totalViolations,
          criticalCount: scanOutput.violationsBySeverity.critical,
          seriousCount: scanOutput.violationsBySeverity.serious,
          moderateCount: scanOutput.violationsBySeverity.moderate,
          minorCount: scanOutput.violationsBySeverity.minor,
          scanDurationMs: scanOutput.scanDurationMs,
          error: scanOutput.error,
        },
      });

      if (scanOutput.violations.length > 0) {
        await tx.violation.createMany({
          data: scanOutput.violations.map((v: Violation) => ({
            scanResultId: result.id,
            ruleId: v.ruleId,
            wcagCriterion: v.wcagCriterion,
            wcagCriterionName: v.wcagCriterionName,
            gigwCheckpoint: v.gigwCheckpoint || null,
            principle: v.principle,
            severity: v.severity,
            description: v.description,
            helpUrl: v.helpUrl,
            selector: v.selector,
            htmlSnippet: v.htmlSnippet,
            nodeCount: v.nodeCount,
            remediation: v.remediation || null,
            suggestedFixSnippet: v.suggestedFixSnippet || null,
            userImpact: v.userImpact || null,
            effort: v.effort || null,
            wcagLevel: v.wcagLevel || 'AA',
          })),
        });
      }
      return result;
    });

    res.json({
      scanResultId: scanResult.id,
      targetId: target.id,
      siteName: target.siteName,
      totalViolations: scanResult.totalViolations,
      violationsBySeverity: scanOutput.violationsBySeverity,
      scanDurationMs: scanResult.scanDurationMs,
      error: scanResult.error || null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/scans/keyboard — physically trace Tab focus and detect focus traps
router.post('/keyboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, maxSteps } = req.body;
    if (!url) throw new AppError('URL is required', 400);
    const report = await traceKeyboardFocus(url, { maxSteps: maxSteps || 30 });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// POST /api/scans/crawl — multi-page domain spider audit
router.post('/crawl', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, maxPages } = req.body;
    if (!url) throw new AppError('URL is required', 400);
    const report = await crawlAndAuditDomain(url, { maxPages: Math.min(maxPages || 5, 8) });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// POST /api/scans/palette — mathematical contrast tuner & CSS generator
router.post('/palette', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pairs } = req.body;
    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new AppError('Color pairs array is required', 400);
    }
    const report = tunePaletteForContrast(pairs);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// POST /api/scans/indic — GIGW 3.0 Kannada and Indic script compliance check
router.post('/indic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url) throw new AppError('URL is required', 400);
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const report = await validateIndicAndKannadaCompliance(page);
      res.json(report);
    } finally {
      await browser.close();
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/scans/:id/status — check scan job status
router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.scanJob.findUnique({
      where: { jobId: req.params.id },
    });

    if (!job) {
      throw new AppError('ScanJob not found', 404);
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      scanResultId: job.scanResultId,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/scans/:id — full scan result with violations
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.scanResult.findUnique({
      where: { id: req.params.id },
      include: { violations: true, scanTarget: true },
    });

    if (!result) {
      throw new AppError('ScanResult not found', 404);
    }

    res.json({
      id: result.id,
      scanTargetId: result.scanTargetId,
      siteName: result.scanTarget.siteName,
      timestamp: result.timestamp.toISOString(),
      url: result.url,
      tool: result.tool,
      wcagVersion: result.wcagVersion,
      conformanceTarget: result.conformanceTarget,
      totalViolations: result.totalViolations,
      violationsBySeverity: {
        critical: result.criticalCount,
        serious: result.seriousCount,
        moderate: result.moderateCount,
        minor: result.minorCount,
      },
      violations: result.violations,
      lighthouseScore: result.lighthouseScore,
      scanDurationMs: result.scanDurationMs,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/scans/:id/compare/:otherId — comparison between two scans
router.get('/:id/compare/:otherId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, otherId } = req.params;

    const [beforeScan, afterScan] = await Promise.all([
      prisma.scanResult.findUnique({ where: { id }, include: { violations: true } }),
      prisma.scanResult.findUnique({ where: { id: otherId }, include: { violations: true } }),
    ]);

    if (!beforeScan || !afterScan) {
      throw new AppError('One or both ScanResults not found', 404);
    }

    // Build rule sets for comparison
    const beforeRules = new Map(beforeScan.violations.map((v) => [v.ruleId, v]));
    const afterRules = new Map(afterScan.violations.map((v) => [v.ruleId, v]));

    const fixedRules = [...beforeRules.entries()]
      .filter(([ruleId]) => !afterRules.has(ruleId))
      .map(([, v]) => ({
        ruleId: v.ruleId,
        wcagCriterion: v.wcagCriterion,
        wcagCriterionName: v.wcagCriterionName,
        severity: v.severity,
        nodeCountBefore: v.nodeCount,
      }));

    const introducedRules = [...afterRules.entries()]
      .filter(([ruleId]) => !beforeRules.has(ruleId))
      .map(([, v]) => ({
        ruleId: v.ruleId,
        wcagCriterion: v.wcagCriterion,
        wcagCriterionName: v.wcagCriterionName,
        severity: v.severity,
        nodeCountAfter: v.nodeCount,
      }));

    const remainingRules = [...beforeRules.entries()]
      .filter(([ruleId]) => afterRules.has(ruleId))
      .map(([ruleId, v]) => ({
        ruleId: v.ruleId,
        wcagCriterion: v.wcagCriterion,
        wcagCriterionName: v.wcagCriterionName,
        severity: v.severity,
        nodeCountBefore: v.nodeCount,
        nodeCountAfter: afterRules.get(ruleId)!.nodeCount,
      }));

    // Calculate pass rates (simple: fewer violations = higher rate)
    const totalRulesChecked = 50; // approximate number of rules axe-core checks
    const passRateBefore = Math.max(0, Math.round(((totalRulesChecked - beforeScan.totalViolations) / totalRulesChecked) * 100));
    const passRateAfter = Math.max(0, Math.round(((totalRulesChecked - afterScan.totalViolations) / totalRulesChecked) * 100));

    res.json({
      beforeScanId: beforeScan.id,
      afterScanId: afterScan.id,
      beforeUrl: beforeScan.url,
      afterUrl: afterScan.url,
      beforeTimestamp: beforeScan.timestamp.toISOString(),
      afterTimestamp: afterScan.timestamp.toISOString(),
      violationsFixed: fixedRules.length,
      violationsIntroduced: introducedRules.length,
      violationsRemaining: remainingRules.length,
      totalBefore: beforeScan.totalViolations,
      totalAfter: afterScan.totalViolations,
      wcagPassRateBefore: passRateBefore,
      wcagPassRateAfter: passRateAfter,
      lighthouseScoreBefore: beforeScan.lighthouseScore,
      lighthouseScoreAfter: afterScan.lighthouseScore,
      severityBefore: {
        critical: beforeScan.criticalCount,
        serious: beforeScan.seriousCount,
        moderate: beforeScan.moderateCount,
        minor: beforeScan.minorCount,
      },
      severityAfter: {
        critical: afterScan.criticalCount,
        serious: afterScan.seriousCount,
        moderate: afterScan.moderateCount,
        minor: afterScan.minorCount,
      },
      fixedRules,
      remainingRules,
      introducedRules,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
