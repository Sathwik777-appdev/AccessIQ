#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { scanUrl, ScanOptions } from './scan';
import { SiteType } from '@accessiq/types';

const program = new Command();

program
  .name('accessiq-scan')
  .description('AccessIQ Accessibility Scanner CLI')
  .version('1.0.0');

program
  .option('--url <url>', 'URL to scan')
  .option(
    '--target <type>',
    'Site type (central-govt, state-govt, psu, municipal, international-benchmark, demo-page)',
    'central-govt',
  )
  .option('--wcag <version>', 'WCAG version (2.1 or 2.2)', '2.2')
  .option('--level <level>', 'Conformance target (A or AA)', 'AA')
  .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
  .action(async (opts) => {
    const url = opts.url;
    if (!url) {
      console.error(chalk.red('Error: --url is required'));
      console.error('Usage: npm run scan -- --url=https://example.gov.in --target=central-govt');
      process.exit(1);
    }

    console.log(chalk.blue.bold('\n🔍 AccessIQ Accessibility Scanner'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.white(`  URL:      ${url}`));
    console.log(chalk.white(`  Target:   ${opts.target}`));
    console.log(chalk.white(`  WCAG:     ${opts.wcag} Level ${opts.level}`));
    console.log(chalk.white(`  Timeout:  ${opts.timeout}ms`));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.yellow('\n⏳ Scanning... this may take 15-30 seconds.\n'));

    const scanOptions: ScanOptions = {
      wcagVersion: opts.wcag as '2.1' | '2.2',
      conformanceTarget: opts.level as 'A' | 'AA',
      timeout: parseInt(opts.timeout, 10),
    };

    const startTime = Date.now();
    const result = await scanUrl(url, scanOptions);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (result.error) {
      console.error(chalk.red(`\n❌ Scan failed: ${result.error}`));
      process.exit(1);
    }

    // Summary
    console.log(chalk.green.bold(`✅ Scan completed in ${duration}s\n`));

    // Severity breakdown table
    const severityTable = new Table({
      head: [
        chalk.white.bold('Severity'),
        chalk.white.bold('Count'),
        chalk.white.bold('Bar'),
      ],
      colWidths: [15, 10, 35],
    });

    const maxCount = Math.max(
      result.violationsBySeverity.critical,
      result.violationsBySeverity.serious,
      result.violationsBySeverity.moderate,
      result.violationsBySeverity.minor,
      1,
    );

    const makeBar = (count: number, color: (s: string) => string) => {
      const width = Math.round((count / maxCount) * 25);
      return color('█'.repeat(width)) + ' ' + count;
    };

    severityTable.push(
      [
        chalk.red('Critical'),
        result.violationsBySeverity.critical,
        makeBar(result.violationsBySeverity.critical, chalk.red),
      ],
      [
        chalk.hex('#ea580c')('Serious'),
        result.violationsBySeverity.serious,
        makeBar(result.violationsBySeverity.serious, chalk.hex('#ea580c')),
      ],
      [
        chalk.yellow('Moderate'),
        result.violationsBySeverity.moderate,
        makeBar(result.violationsBySeverity.moderate, chalk.yellow),
      ],
      [
        chalk.blue('Minor'),
        result.violationsBySeverity.minor,
        makeBar(result.violationsBySeverity.minor, chalk.blue),
      ],
    );

    console.log(chalk.bold('📊 Violation Summary'));
    console.log(
      chalk.white(
        `   Total violations: ${chalk.bold(String(result.totalViolations))}`,
      ),
    );
    console.log();
    console.log(severityTable.toString());

    // Top 5 most common issues
    if (result.violations.length > 0) {
      console.log(chalk.bold('\n🔝 Top Issues (by affected elements)'));

      const sortedViolations = [...result.violations]
        .sort((a, b) => b.nodeCount - a.nodeCount)
        .slice(0, 5);

      const issueTable = new Table({
        head: [
          chalk.white.bold('#'),
          chalk.white.bold('Rule'),
          chalk.white.bold('WCAG'),
          chalk.white.bold('Severity'),
          chalk.white.bold('Elements'),
          chalk.white.bold('Description'),
        ],
        colWidths: [4, 22, 8, 12, 10, 40],
        wordWrap: true,
      });

      sortedViolations.forEach((v, i) => {
        const severityColor =
          v.severity === 'critical'
            ? chalk.red
            : v.severity === 'serious'
              ? chalk.hex('#ea580c')
              : v.severity === 'moderate'
                ? chalk.yellow
                : chalk.blue;

        issueTable.push([
          i + 1,
          v.ruleId,
          v.wcagCriterion,
          severityColor(v.severity),
          v.nodeCount,
          v.description.substring(0, 80),
        ]);
      });

      console.log(issueTable.toString());
    }

    // Principle breakdown
    const principles = result.violations.reduce(
      (acc, v) => {
        acc[v.principle] = (acc[v.principle] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    if (Object.keys(principles).length > 0) {
      console.log(chalk.bold('\n📐 By WCAG Principle'));
      for (const [principle, count] of Object.entries(principles)) {
        console.log(`   ${principle}: ${count} violations`);
      }
    }

    console.log(chalk.gray('\n━'.repeat(50)));
    console.log(
      chalk.gray(
        '⚠️  Automated scanning catches ~30-40% of real issues.',
      ),
    );
    console.log(
      chalk.gray(
        '   Manual testing with screen readers is still required for full conformance.',
      ),
    );
    console.log();
  });

program.parse();
