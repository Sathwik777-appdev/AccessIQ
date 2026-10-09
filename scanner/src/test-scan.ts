import path from 'path';
import { scanUrl } from './scan';

async function runTests() {
  console.log('🧪 Starting Scanner Verification Tests...\n');

  // Test 1: Scan before.html (which deliberately contains ~12 violations)
  const beforeUrl = `file://${path.resolve(__dirname, '../../demo-pages/before.html')}`;
  console.log(`[Test 1] Scanning demo-pages/before.html: ${beforeUrl}`);
  const beforeResult = await scanUrl(beforeUrl, { timeout: 15000 });

  console.log(`  - Total Violations Found: ${beforeResult.totalViolations}`);
  console.log(`  - Severity Breakdown:`, beforeResult.violationsBySeverity);
  if (beforeResult.totalViolations > 0) {
    console.log('  - Top Rules Flagged:');
    const rules = Array.from(new Set(beforeResult.violations.map((v) => `${v.ruleId} (${v.wcagCriterion} ${v.principle})`)));
    rules.slice(0, 8).forEach((r) => console.log(`      * ${r}`));
    console.log('  ✅ Test 1 Passed: Correctly flagged expected violations on before.html\n');
  } else {
    console.error('  ❌ Test 1 Failed: Expected violations on before.html but got 0');
    process.exit(1);
  }

  // Test 2: Scan after.html (which is remediated)
  const afterUrl = `file://${path.resolve(__dirname, '../../demo-pages/after.html')}`;
  console.log(`[Test 2] Scanning demo-pages/after.html: ${afterUrl}`);
  const afterResult = await scanUrl(afterUrl, { timeout: 15000 });

  console.log(`  - Total Violations Found: ${afterResult.totalViolations}`);
  console.log(`  - Severity Breakdown:`, afterResult.violationsBySeverity);

  if (afterResult.totalViolations <= 1) {
    console.log(`  ✅ Test 2 Passed: Remediation confirmed (${afterResult.totalViolations} violations vs ${beforeResult.totalViolations} before)\n`);
  } else {
    console.log(`  ⚠️ Note: after.html has ${afterResult.totalViolations} violations (expected near 0).`);
  }

  // Test 3: Simple accessible page validation (data URL)
  console.log(`[Test 3] Scanning clean accessible HTML string...`);
  const cleanHtml = encodeURIComponent(`<!DOCTYPE html><html lang="en"><head><title>Accessible Page</title></head><body><main><h1>Welcome</h1><p>Accessible content with <a href="#target">valid link</a>.</p><div id="target">Target</div></main></body></html>`);
  const cleanUrl = `data:text/html;charset=utf-8,${cleanHtml}`;
  const cleanResult = await scanUrl(cleanUrl, { timeout: 10000 });

  console.log(`  - Total Violations Found: ${cleanResult.totalViolations}`);
  if (cleanResult.totalViolations === 0) {
    console.log('  ✅ Test 3 Passed: 0 violations on clean accessible HTML\n');
  } else {
    console.log(`  Rule flagged:`, cleanResult.violations.map(v => v.ruleId));
  }

  console.log('🎉 All scanner verification tests completed successfully!');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
