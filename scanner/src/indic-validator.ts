import { Page } from 'playwright';
import { IndicLanguageReport } from '@accessiq/types';

export async function validateIndicAndKannadaCompliance(page: Page): Promise<IndicLanguageReport> {
  return await page.evaluate(() => {
    const textContent = document.body.innerText || '';
    
    // Regex for Kannada Unicode range: 0x0C80 - 0x0CFF
    const kannadaRegex = /[\u0C80-\u0CFF]/;
    const hasKannadaUnicode = kannadaRegex.test(textContent);

    // Regex for Devanagari (Hindi/Sanskrit): 0x0900 - 0x097F
    const hindiRegex = /[\u0900-\u097F]/;
    const hasHindiUnicode = hindiRegex.test(textContent);

    // Check for legacy non-Unicode fonts that break screen readers
    const legacyFonts = [
      'nudi',
      'baraha',
      'kasturi',
      'shree',
      'akruti',
      'srilipi',
      'kailash',
      'chanakya',
      'krutidev',
    ];

    const detectedLegacyFonts = new Set<string>();
    const allElements = document.querySelectorAll('*');

    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const font = (style.fontFamily || '').toLowerCase();
      legacyFonts.forEach((lf) => {
        if (font.includes(lf)) {
          detectedLegacyFonts.add(lf);
        }
      });
    });

    // Check lang attributes
    const rootLang = document.documentElement.getAttribute('lang') || '';
    const hasRootLang = rootLang.trim().length > 0;

    const kannadaElementsWithLang = document.querySelectorAll('[lang="kn"], [lang="kn-IN"]').length;

    // Detect language toggle
    const langToggleCandidate = Array.from(document.querySelectorAll('a, button')).some((el) => {
      const txt = (el as HTMLElement).innerText || '';
      return (
        txt.includes('ಕನ್ನಡ') ||
        txt.includes('Kannada') ||
        txt.includes('English') ||
        txt.includes('हिंदी') ||
        txt.includes('Language')
      );
    });

    const detectedLanguages: Array<{
      code: string;
      name: string;
      textSample: string;
      hasProperLangAttribute: boolean;
    }> = [];

    if (hasKannadaUnicode) {
      const sampleMatch = textContent.match(/[\u0C80-\u0CFF\s]{10,60}/);
      detectedLanguages.push({
        code: 'kn',
        name: 'Kannada (ಕನ್ನಡ)',
        textSample: sampleMatch ? sampleMatch[0].trim() : 'ಕನ್ನಡ ಪಠ್ಯ ಕಂಡುಬಂದಿದೆ',
        hasProperLangAttribute: rootLang.startsWith('kn') || kannadaElementsWithLang > 0,
      });
    }

    if (hasHindiUnicode) {
      const sampleMatch = textContent.match(/[\u0900-\u097F\s]{10,60}/);
      detectedLanguages.push({
        code: 'hi',
        name: 'Hindi (हिंदी)',
        textSample: sampleMatch ? sampleMatch[0].trim() : 'हिंदी सामग्री मौजूद है',
        hasProperLangAttribute: rootLang.startsWith('hi'),
      });
    }

    // Default English if Latin script present
    if (/[a-zA-Z]{5,}/.test(textContent)) {
      detectedLanguages.push({
        code: 'en',
        name: 'English',
        textSample: textContent.slice(0, 50).trim(),
        hasProperLangAttribute: rootLang.startsWith('en') || (!rootLang && hasRootLang),
      });
    }

    // Recommendations
    const recs: string[] = [];
    let unicodeScore = 100;
    let parityScore = 100;

    if (detectedLegacyFonts.size > 0) {
      unicodeScore -= 50;
      recs.push(
        `Critical: Detected legacy non-Unicode fonts (${Array.from(detectedLegacyFonts).join(', ')}). These fonts render as gibberish on screen readers. Convert immediately to Unicode UTF-8 fonts.`
      );
    } else {
      recs.push('Passed: Modern Unicode font standards are respected across all regional scripts.');
    }

    if (hasKannadaUnicode && kannadaElementsWithLang === 0 && !rootLang.startsWith('kn')) {
      parityScore -= 30;
      recs.push('Add lang="kn" to containers with Kannada text so screen readers activate the correct Kannada speech synthesizer.');
    }

    if (!langToggleCandidate) {
      parityScore -= 25;
      recs.push('GIGW 3.0 Checkpoint 4.1: Ensure a persistent bilingual language toggle (English ↔ ಕನ್ನಡ) is accessible in the portal header.');
    }

    if (!hasRootLang) {
      unicodeScore -= 20;
      recs.push('GIGW 3.0 Mandate: Root <html> element is missing a primary lang attribute.');
    }

    return {
      detectedLanguages,
      kannadaScriptDetected: hasKannadaUnicode,
      legacyAsciiFontDetected: detectedLegacyFonts.size > 0,
      legacyFontNamesFound: Array.from(detectedLegacyFonts),
      unicodeComplianceScore: Math.max(0, Math.min(100, unicodeScore)),
      bilingualParityScore: Math.max(0, Math.min(100, parityScore)),
      recommendations: recs,
    };
  });
}
