import { Browser, Page, chromium } from 'playwright';
import { FocusStep, KeyboardAuditReport } from '@accessiq/types';

export async function traceKeyboardFocus(
  url: string,
  options: { maxSteps?: number; timeout?: number; browser?: Browser } = {}
): Promise<KeyboardAuditReport> {
  const maxSteps = options.maxSteps || 30;
  const timeout = options.timeout || 25000;
  let ownBrowser: Browser | null = null;
  const browser = options.browser || (ownBrowser = await chromium.launch({ headless: true }));

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AccessIQ-KeyboardAuditor/1.0',
    });

    const page: Page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Collect interactive elements count
    const interactiveCount = await page.evaluate(() => {
      return document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])').length;
    });

    const focusSteps: FocusStep[] = [];
    const seenElements = new Map<string, number>();
    let trapDetected = false;
    let missingOutlineCount = 0;
    let unexpectedJumpCount = 0;
    let prevBox: { x: number; y: number } | null = null;

    for (let i = 1; i <= maxSteps; i++) {
      await page.keyboard.press('Tab');
      // Brief pause to allow focus styles/animations
      await page.waitForTimeout(100);

      const activeInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) {
          return null;
        }

        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const hasOutline = (
          (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
          (style.boxShadow !== 'none' && style.boxShadow.length > 5) ||
          (style.borderWidth !== '0px' && style.borderStyle !== 'none')
        );

        // Build a unique CSS selector path
        let selector = el.tagName.toLowerCase();
        if (el.id) {
          selector += `#${el.id}`;
        } else if (el.className && typeof el.className === 'string') {
          const firstClass = el.className.trim().split(/\s+/)[0];
          if (firstClass) selector += `.${firstClass}`;
        }

        const accessibleName = el.getAttribute('aria-label') ||
          (el as HTMLElement).innerText?.slice(0, 40)?.trim() ||
          el.getAttribute('placeholder') ||
          el.getAttribute('title') ||
          '';

        return {
          selector,
          tagName: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || el.tagName.toLowerCase(),
          accessibleName,
          hasVisibleOutline: hasOutline,
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      });

      if (!activeInfo) {
        // Tab reached end of DOM or blurred
        if (focusSteps.length > 0 && i > 3) break;
        continue;
      }

      // Track occurrences to detect keyboard traps
      const count = (seenElements.get(activeInfo.selector) || 0) + 1;
      seenElements.set(activeInfo.selector, count);

      let isTrap = false;
      if (count >= 3 && focusSteps.length > 3) {
        isTrap = true;
        trapDetected = true;
      }

      if (!activeInfo.hasVisibleOutline) {
        missingOutlineCount++;
      }

      // Check erratic visual coordinate jump (reading order mismatch)
      if (prevBox && activeInfo.boundingBox) {
        const dy = activeInfo.boundingBox.y - prevBox.y;
        if (dy < -200) {
          // Focus jumped way up unexpectedly
          unexpectedJumpCount++;
        }
      }
      prevBox = activeInfo.boundingBox;

      focusSteps.push({
        step: i,
        selector: activeInfo.selector,
        tagName: activeInfo.tagName,
        role: activeInfo.role,
        accessibleName: activeInfo.accessibleName,
        hasVisibleOutline: activeInfo.hasVisibleOutline,
        boundingBox: activeInfo.boundingBox,
        isKeyboardTrapCandidate: isTrap,
        notes: isTrap ? 'Element was refocused 3+ times in a tight loop (Potential Trap)' : undefined,
      });

      if (isTrap) {
        // Stop scanning to simulate user getting stuck
        break;
      }
    }

    // Calculate tab navigation score (0 - 100)
    let score = 100;
    if (trapDetected) score -= 40;
    score -= Math.min(30, missingOutlineCount * 5);
    score -= Math.min(20, unexpectedJumpCount * 4);
    score = Math.max(10, Math.min(100, score));

    return {
      totalInteractiveElements: interactiveCount,
      traversedSteps: focusSteps,
      keyboardTrapDetected: trapDetected,
      missingFocusIndicatorCount: missingOutlineCount,
      unexpectedJumpCount,
      tabNavigationScore: score,
      summary: trapDetected
        ? 'Critical: Keyboard trap detected. Focus gets locked and cannot exit element.'
        : missingOutlineCount > 0
        ? `Warning: ${missingOutlineCount} elements lack visible focus indicators (WCAG 2.4.7 failure).`
        : 'All tested elements provide keyboard navigation with perceptible focus indicators.',
    };
  } finally {
    if (ownBrowser) {
      await ownBrowser.close();
    }
  }
}
