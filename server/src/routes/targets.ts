import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/error-handler';

const router = Router();

import { publicUrlSchema } from '../lib/url-validator';

const createTargetSchema = z.object({
  url: publicUrlSchema,
  siteName: z.string().min(1),
  siteType: z.enum([
    'central-govt',
    'state-govt',
    'psu',
    'municipal',
    'international-benchmark',
    'demo-page',
  ]),
  country: z.string().optional().default('India'),
});

// GET /api/targets — list all targets with latest scan summary
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const targets = await prisma.scanTarget.findMany({
      take: limit,
      skip: offset,
      include: {
        scans: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const formattedTargets = targets.map((target) => {
      const latestScan = target.scans[0];
      return {
        id: target.id,
        url: target.url,
        siteName: target.siteName,
        siteType: target.siteType,
        country: target.country,
        createdAt: target.createdAt.toISOString(),
        lastScannedAt: latestScan ? latestScan.timestamp.toISOString() : null,
        lastScanId: latestScan ? latestScan.id : null,
        lastScanTotalViolations: latestScan ? latestScan.totalViolations : null,
        lastScanViolationsBySeverity: latestScan
          ? {
              critical: latestScan.criticalCount,
              serious: latestScan.seriousCount,
              moderate: latestScan.moderateCount,
              minor: latestScan.minorCount,
            }
          : null,
        lastScanPassRate: latestScan
          ? Math.max(0, Math.round(((50 - latestScan.totalViolations) / 50) * 100))
          : null,
      };
    });

    res.json(formattedTargets);
  } catch (error) {
    next(error);
  }
});

// GET /api/targets/:id — get target details with complete chronological scan history
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const target = await prisma.scanTarget.findUnique({
      where: { id },
      include: {
        scans: {
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            timestamp: true,
            totalViolations: true,
            criticalCount: true,
            seriousCount: true,
            moderateCount: true,
            minorCount: true,
            scanDurationMs: true,
            tool: true,
            wcagVersion: true,
            conformanceTarget: true,
            error: true,
          },
        },
      },
    });

    if (!target) {
      throw new AppError('ScanTarget not found', 404);
    }

    const latestScan = target.scans.length > 0 ? target.scans[target.scans.length - 1] : null;

    res.json({
      id: target.id,
      url: target.url,
      siteName: target.siteName,
      siteType: target.siteType,
      country: target.country,
      createdAt: target.createdAt.toISOString(),
      lastScannedAt: latestScan ? latestScan.timestamp.toISOString() : null,
      lastScanId: latestScan ? latestScan.id : null,
      lastScanTotalViolations: latestScan ? latestScan.totalViolations : null,
      lastScanViolationsBySeverity: latestScan
        ? {
            critical: latestScan.criticalCount,
            serious: latestScan.seriousCount,
            moderate: latestScan.moderateCount,
            minor: latestScan.minorCount,
          }
        : null,
      lastScanPassRate: latestScan
        ? Math.max(0, Math.round(((50 - latestScan.totalViolations) / 50) * 100))
        : null,
      scans: target.scans.map((s) => ({
        id: s.id,
        timestamp: s.timestamp.toISOString(),
        totalViolations: s.totalViolations,
        criticalCount: s.criticalCount,
        seriousCount: s.seriousCount,
        moderateCount: s.moderateCount,
        minorCount: s.minorCount,
        scanDurationMs: s.scanDurationMs,
        passRate: Math.max(0, Math.round(((50 - s.totalViolations) / 50) * 100)),
        tool: s.tool,
        wcagVersion: s.wcagVersion,
        conformanceTarget: s.conformanceTarget,
        error: s.error,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/targets — add a new site to track
router.post('/', validate(createTargetSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, siteName, siteType, country } = req.body;

    const target = await prisma.scanTarget.create({
      data: {
        url,
        siteName,
        siteType,
        country: country || 'India',
      },
    });

    res.status(201).json({
      id: target.id,
      url: target.url,
      siteName: target.siteName,
      siteType: target.siteType,
      country: target.country,
      createdAt: target.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
