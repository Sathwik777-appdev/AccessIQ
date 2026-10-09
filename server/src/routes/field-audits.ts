import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/error-handler';

const router = Router();

const createAuditSchema = z.object({
  officeName: z.string().min(1),
  location: z.string().min(1),
  inspectorName: z.string().min(1),
  findings: z.array(
    z.object({
      checklistItemId: z.string().min(1),
      passed: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
  photos: z
    .array(
      z.object({
        caption: z.string(),
        category: z.string(),
        dataUrl: z.string(),
      }),
    )
    .optional(),
  totalScore: z.number(),
  maxScore: z.number(),
});

/**
 * POST /api/field-audits — Save a completed field audit report
 */
router.post('/', validate(createAuditSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { officeName, location, inspectorName, findings, photos, totalScore, maxScore } = req.body;

    const report = await prisma.fieldAuditReport.create({
      data: {
        officeName,
        location,
        inspectorName,
        totalScore,
        maxScore,
        scorePercent: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        findings: {
          create: findings.map(
            (f: { checklistItemId: string; passed: boolean; notes?: string }) => ({
              checklistItemId: f.checklistItemId,
              passed: f.passed,
              notes: f.notes || null,
            }),
          ),
        },
        photos: photos
          ? {
              create: photos.map(
                (p: { caption: string; category: string; dataUrl: string }) => ({
                  caption: p.caption,
                  category: p.category,
                  dataUrl: p.dataUrl,
                }),
              ),
            }
          : undefined,
      },
      include: { findings: true, photos: true },
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/field-audits — List all saved field audit reports (summary only)
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.fieldAuditReport.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        officeName: true,
        location: true,
        inspectorName: true,
        totalScore: true,
        maxScore: true,
        scorePercent: true,
        createdAt: true,
        _count: { select: { findings: true, photos: true } },
      },
    });

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/field-audits/:id — Get a full field audit report with findings and photos
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.fieldAuditReport.findUnique({
      where: { id: req.params.id },
      include: { findings: true, photos: true },
    });

    if (!report) {
      throw new AppError('Field audit report not found', 404);
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/field-audits/:id — Delete a field audit report
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.fieldAuditReport.findUnique({
      where: { id: req.params.id },
    });

    if (!report) {
      throw new AppError('Field audit report not found', 404);
    }

    await prisma.fieldAuditReport.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Field audit report deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
