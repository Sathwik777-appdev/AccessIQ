import { chromium, Browser, Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { v4 as uuidv4 } from 'uuid';
import { ScanResult, Violation, WcagVersion, ConformanceTarget } from '@accessiq/types';
import { mapAxeViolation, getWcagTagsForTarget } from './rule-mapper';

export interface ScanOptions {
  wcagVersion?: WcagVersion;
  conformanceTarget?: ConformanceTarget;
  timeout?: number;
  waitForSelector?: string;
  browser?: Browser;
}

export function validateScanUrl(url: string): void {
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol;
  const hostname = parsedUrl.hostname;

  if (protocol === 'file:') {
    if (process.env.ALLOW_FILE_URLS !== 'true') {
      throw new Error('file:// URLs are not allowed');
    }
    return;
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error('Only http and https protocols are allowed');
  }

  if (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    /^127\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    throw new Error('Localhost and loopback addresses are not allowed');
  }

  if (
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  ) {
    throw new Error('Private IP ranges are not allowed');
  }

  if (/^169\.254\.\d+\.\d+$/.test(hostname)) {
    throw new Error('Link-local addresses are not allowed');
  }
}

/**
 * Scans a URL for accessibility violations using Playwright + axe-core.
 *
 * Launches a headless Chromium browser, navigates to the URL, waits for
 * network idle, then runs axe-core with the specified WCAG tags.
 *
 * Returns a fully-formed ScanResult object. On error, returns a partial
 * result with an error flag rather than crashing.
 */
export async function scanUrl(url: string, options: ScanOptions = {}): Promise<ScanResult> {
  const {
    wcagVersion = '2.2',
    conformanceTarget = 'AA',
    timeout = 30000,
    browser: providedBrowser,
  } = options;

  const scanId = uuidv4();
  const startTime = Date.now();
  let browser: Browser | null = providedBrowser || null;

  try {
    validateScanUrl(url);

    if (!browser) {
      // Launch headless Chromium
      browser = await chromium.launch({
        headless: true,
      });
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 AccessIQ-Scanner/1.0',
    });

    const page: Page = await context.newPage();

    // Navigate to the URL with timeout
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // Optional: wait for a specific selector
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
    }

    // Small delay for any late-loading JS
    await page.waitForLoadState('networkidle').catch(() => {});

    // Get WCAG tags based on version and conformance target
    const wcagTags = getWcagTagsForTarget(wcagVersion, conformanceTarget);

    // Run axe-core accessibility analysis
    const axeResults = await Promise.race([
      new AxeBuilder({ page })
        .withTags(wcagTags)
        .analyze(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Axe-core analysis timed out')), 60000)
      ),
    ]);

    // Map axe-core violations to our schema
    const violations: Violation[] = axeResults.violations.flatMap((axeViolation) =>
      mapAxeViolation(axeViolation as any, scanId),
    );

    // Calculate severity breakdown
    const violationsBySeverity = {
      critical: violations.filter((v) => v.severity === 'critical').length,
      serious: violations.filter((v) => v.severity === 'serious').length,
      moderate: violations.filter((v) => v.severity === 'moderate').length,
      minor: violations.filter((v) => v.severity === 'minor').length,
    };

    const scanDurationMs = Date.now() - startTime;

    const result: ScanResult = {
      id: scanId,
      scanTargetId: '', // Set by the caller
      timestamp: new Date().toISOString(),
      url,
      tool: 'axe-core',
      wcagVersion,
      conformanceTarget,
      totalViolations: violations.length,
      violationsBySeverity,
      violations,
      lighthouseScore: null,
      scanDurationMs,
      error: null,
    };

    return result;
  } catch (error) {
    const scanDurationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Return a partial result with error flag rather than crashing
    return {
      id: scanId,
      scanTargetId: '',
      timestamp: new Date().toISOString(),
      url,
      tool: 'axe-core',
      wcagVersion,
      conformanceTarget,
      totalViolations: 0,
      violationsBySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      violations: [],
      lighthouseScore: null,
      scanDurationMs,
      error: `Scan failed: ${errorMessage}`,
    };
  } finally {
    if (browser && !providedBrowser) {
      await browser.close();
    }
  }
}
