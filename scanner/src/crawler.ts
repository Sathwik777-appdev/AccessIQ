import { Browser, chromium } from 'playwright';
import { CrawlPageSummary, DomainCrawlReport } from '@accessiq/types';
import { scanUrl } from './scan';

export async function crawlAndAuditDomain(
  rootUrl: string,
  options: { maxPages?: number; maxDepth?: number; timeout?: number } = {}
): Promise<DomainCrawlReport> {
  const maxPages = options.maxPages || 5;
  const timeout = options.timeout || 25000;

  const parsedRoot = new URL(rootUrl);
  const rootOrigin = parsedRoot.origin;
  const rootHost = parsedRoot.hostname;

  const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];
  const visited = new Set<string>();
  const pageSummaries: CrawlPageSummary[] = [];
  const recurringRuleCounts = new Map<string, { description: string; pageCount: number; nodeCount: number }>();

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });

    while (queue.length > 0 && pageSummaries.length < maxPages) {
      const current = queue.shift()!;
      // Normalize URL (strip trailing slash, remove hash)
      const cleanUrl = current.url.split('#')[0].replace(/\/+$/, '');

      if (visited.has(cleanUrl)) continue;
      visited.add(cleanUrl);

      try {
        // Run scan on this subpage
        const result = await scanUrl(cleanUrl, {
          wcagVersion: '2.2',
          conformanceTarget: 'AA',
          timeout,
          browser,
        });

        // Compute pass rate
        const passRate = Math.max(0, Math.round(((50 - result.totalViolations) / 50) * 100));

        // Track recurring rules
        result.violations.forEach((v) => {
          const existing = recurringRuleCounts.get(v.ruleId) || {
            description: v.description,
            pageCount: 0,
            nodeCount: 0,
          };
          existing.pageCount += 1;
          existing.nodeCount += v.nodeCount || 1;
          recurringRuleCounts.set(v.ruleId, existing);
        });

        // Derive subpage title
        let subpageTitle = cleanUrl === rootUrl ? 'Home / Portal Root' : new URL(cleanUrl).pathname;
        if (subpageTitle.length > 35) subpageTitle = subpageTitle.slice(0, 32) + '...';

        pageSummaries.push({
          url: cleanUrl,
          title: subpageTitle,
          depth: current.depth,
          totalViolations: result.totalViolations,
          criticalCount: result.violationsBySeverity.critical,
          seriousCount: result.violationsBySeverity.serious,
          moderateCount: result.violationsBySeverity.moderate,
          minorCount: result.violationsBySeverity.minor,
          passRate,
          scanDurationMs: result.scanDurationMs,
        });

        // If we haven't reached maxPages, extract links from this page
        if (pageSummaries.length < maxPages) {
          const page = await browser.newPage();
          try {
            await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            const extractedLinks = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('a[href]'))
                .map((a) => (a as HTMLAnchorElement).href)
                .filter(Boolean);
            });

            for (const rawHref of extractedLinks) {
              try {
                const linkUrl = new URL(rawHref, rootOrigin);
                // Same host, http/https only
                if (linkUrl.hostname === rootHost && (linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:')) {
                  const normalized = linkUrl.href.split('#')[0].replace(/\/+$/, '');
                  // Filter out media/static file links
                  if (!/\.(pdf|jpg|jpeg|png|gif|zip|rar|docx?|xlsx?|mp4|svg)$/i.test(normalized)) {
                    if (!visited.has(normalized) && !queue.some((q) => q.url === normalized)) {
                      queue.push({ url: normalized, depth: current.depth + 1 });
                    }
                  }
                }
              } catch {
                // Ignore malformed hrefs
              }
            }
          } catch {
            // Non-critical if link extraction fails
          } finally {
            await page.close().catch(() => {});
          }
        }
      } catch (err) {
        console.warn(`Could not crawl subpage: ${cleanUrl}`, err);
      }
    }

    const totalDomainViolations = pageSummaries.reduce((sum, p) => sum + p.totalViolations, 0);
    const criticalTotal = pageSummaries.reduce((sum, p) => sum + p.criticalCount, 0);
    const seriousTotal = pageSummaries.reduce((sum, p) => sum + p.seriousCount, 0);
    const averagePassRate = pageSummaries.length > 0
      ? Math.round(pageSummaries.reduce((sum, p) => sum + p.passRate, 0) / pageSummaries.length)
      : 0;

    const topRecurringViolations = Array.from(recurringRuleCounts.entries())
      .map(([ruleId, data]) => ({
        ruleId,
        description: data.description,
        affectedPagesCount: data.pageCount,
        totalElements: data.nodeCount,
      }))
      .sort((a, b) => b.totalElements - a.totalElements)
      .slice(0, 6);

    return {
      rootUrl,
      domain: rootHost,
      totalPagesScanned: pageSummaries.length,
      averagePassRate,
      totalDomainViolations,
      criticalTotal,
      seriousTotal,
      pages: pageSummaries,
      topRecurringViolations,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
