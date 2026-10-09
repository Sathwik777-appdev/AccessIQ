#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import { scanUrl } from './scan';
import { ScanTarget, SiteType } from '@accessiq/types';
import { chromium, Browser } from 'playwright';

interface TargetEntry {
  url: string;
  siteName: string;
  siteType: SiteType;
  country: string;
}

const parsedDelay = parseInt(process.env.SCANNER_DELAY_MS || '2000', 10);
const DELAY_MS = Number.isFinite(parsedDelay) ? parsedDelay : 2000;

async function batchScan() {
  console.log(chalk.blue.bold('\n🔄 AccessIQ Batch Scanner'));
  console.log(chalk.gray('━'.repeat(50)));

  // Load target list
  const targetsPath = path.resolve(__dirname, '../data/targets.json');
  if (!fs.existsSync(targetsPath)) {
    console.error(chalk.red(`Target list not found: ${targetsPath}`));
    process.exit(1);
  }

  const targets: TargetEntry[] = JSON.parse(fs.readFileSync(targetsPath, 'utf-8'));
  console.log(chalk.white(`  Targets loaded: ${targets.length} sites`));
  console.log(chalk.white(`  Delay between scans: ${DELAY_MS}ms`));
  console.log(chalk.gray('━'.repeat(50)));

  // Initialize Prisma
  const prisma = new PrismaClient();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      console.log(
        chalk.yellow(`\n[${i + 1}/${targets.length}] Scanning: ${target.siteName}`),
      );
      console.log(chalk.gray(`  URL: ${target.url}`));

      // Upsert the ScanTarget in the database
      const scanTarget = await prisma.scanTarget.upsert({
        where: { url: target.url },
        update: {},
        create: {
          url: target.url,
          siteName: target.siteName,
          siteType: target.siteType,
          country: target.country,
        },
      });

      // Run the scan
      const startTime = Date.now();
      const result = await scanUrl(target.url, {
        wcagVersion: '2.2',
        conformanceTarget: 'AA',
        timeout: 30000,
        browser,
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (result.error) {
        console.log(chalk.red(`  ❌ Failed (${duration}s): ${result.error}`));
        failCount++;
      } else {
        console.log(
          chalk.green(
            `  ✅ Complete (${duration}s): ${result.totalViolations} violations found`,
          ),
        );
        console.log(
          chalk.gray(
            `     Critical: ${result.violationsBySeverity.critical}, Serious: ${result.violationsBySeverity.serious}, Moderate: ${result.violationsBySeverity.moderate}, Minor: ${result.violationsBySeverity.minor}`,
          ),
        );
        successCount++;
      }

      // Save scan result to database
      const savedScan = await prisma.scanResult.create({
        data: {
          scanTargetId: scanTarget.id,
          url: target.url,
          tool: result.tool,
          wcagVersion: result.wcagVersion,
          conformanceTarget: result.conformanceTarget,
          totalViolations: result.totalViolations,
          criticalCount: result.violationsBySeverity.critical,
          seriousCount: result.violationsBySeverity.serious,
          moderateCount: result.violationsBySeverity.moderate,
          minorCount: result.violationsBySeverity.minor,
          scanDurationMs: result.scanDurationMs,
          error: result.error,
        },
      });

      // Save violations
      if (result.violations.length > 0) {
        await prisma.violation.createMany({
          data: result.violations.map((v) => ({
            scanResultId: savedScan.id,
            ruleId: v.ruleId,
            wcagCriterion: v.wcagCriterion,
            wcagCriterionName: v.wcagCriterionName,
            gigwCheckpoint: v.gigwCheckpoint,
            principle: v.principle,
            severity: v.severity,
            description: v.description,
            helpUrl: v.helpUrl,
            selector: v.selector,
            htmlSnippet: v.htmlSnippet,
            nodeCount: v.nodeCount,
          })),
        });
      }

      // Polite crawling: wait between requests
      if (i < targets.length - 1) {
        console.log(chalk.gray(`  Waiting ${DELAY_MS}ms before next scan...`));
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    // Summary
    console.log(chalk.gray('\n' + '━'.repeat(50)));
    console.log(chalk.blue.bold('📊 Batch Scan Summary'));
    console.log(chalk.green(`  ✅ Successful: ${successCount}`));
    console.log(chalk.red(`  ❌ Failed: ${failCount}`));
    console.log(chalk.white(`  📁 Total: ${targets.length}`));
    console.log(chalk.gray('━'.repeat(50)));
  } catch (error) {
    console.error(chalk.red(`\nBatch scan error: ${error}`));
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
    await prisma.$disconnect();
  }
}

batchScan();
