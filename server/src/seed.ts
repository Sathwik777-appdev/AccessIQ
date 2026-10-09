import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { scanUrl } from '@accessiq/scanner';
import { Violation } from '@accessiq/types';

const prisma = new PrismaClient();

interface TargetEntry {
  url: string;
  siteName: string;
  siteType: string;
  country: string;
}

async function seed() {
  console.log('🌱 Starting Production Seeder for AccessIQ...\n');

  // 1. Load official government portals from scanner/data/targets.json
  const targetsFilePath = path.resolve(__dirname, '../../scanner/data/targets.json');
  let officialTargets: TargetEntry[] = [];

  if (fs.existsSync(targetsFilePath)) {
    try {
      officialTargets = JSON.parse(fs.readFileSync(targetsFilePath, 'utf-8'));
      console.log(`Loaded ${officialTargets.length} official target definitions from targets.json`);
    } catch (e) {
      console.warn('Could not parse targets.json, using fallback targets list');
    }
  }

  // 2. Add local demo pages for before/after remediation showcase
  const beforeFilePath = path.resolve(__dirname, '../../demo-pages/before.html');
  const afterFilePath = path.resolve(__dirname, '../../demo-pages/after.html');

  const demoTargets: TargetEntry[] = [
    {
      url: `file://${beforeFilePath}`,
      siteName: 'Utility Portal (Before Remediation)',
      siteType: 'demo-page',
      country: 'India',
    },
    {
      url: `file://${afterFilePath}`,
      siteName: 'Utility Portal (After Remediation)',
      siteType: 'demo-page',
      country: 'India',
    },
  ];

  const allTargetsToSeed = [...demoTargets, ...officialTargets];

  // 3. Register targets in SQLite
  console.log('\nRegistering scan targets in database...');
  for (const item of allTargetsToSeed) {
    let target = await prisma.scanTarget.findFirst({
      where: {
        OR: [{ url: item.url }, { siteName: item.siteName }],
      },
    });

    if (!target) {
      target = await prisma.scanTarget.create({
        data: {
          url: item.url,
          siteName: item.siteName,
          siteType: item.siteType,
          country: item.country || 'India',
        },
      });
      console.log(`  + Created target: "${item.siteName}" (${item.siteType})`);
    } else {
      // Ensure URL is up to date
      if (target.url !== item.url) {
        await prisma.scanTarget.update({
          where: { id: target.id },
          data: { url: item.url },
        });
      }
      console.log(`  ✓ Target exists: "${item.siteName}"`);
    }

    // 4. For demo pages, execute genuine axe-core scans if no scans exist
    if (item.siteType === 'demo-page') {
      const scanCount = await prisma.scanResult.count({
        where: { scanTargetId: target.id },
      });

      if (scanCount === 0) {
        console.log(`    🔍 Performing authentic Playwright + axe-core scan on "${item.siteName}"...`);
        try {
          const scanOutput = await scanUrl(item.url, {
            wcagVersion: '2.2',
            conformanceTarget: 'AA',
            timeout: 30000,
          });

          const scanResult = await prisma.scanResult.create({
            data: {
              scanTargetId: target.id,
              url: item.url,
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
            await prisma.violation.createMany({
              data: scanOutput.violations.map((v: Violation) => ({
                scanResultId: scanResult.id,
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

          console.log(`    ✅ Real scan complete: ${scanOutput.totalViolations} violations recorded in DB (${scanOutput.scanDurationMs}ms)`);
        } catch (scanErr) {
          console.error(`    ⚠️ Failed to scan ${item.siteName}:`, scanErr);
        }
      }
    }
  }

  console.log('\n🎉 Production seeding complete. Zero mock data. Ready for live audits!');
}

seed()
  .catch((err) => {
    console.error('Fatal seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
