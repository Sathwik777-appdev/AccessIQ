import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'kn';

interface Translations {
  // Navigation
  navDashboard: string;
  navSites: string;
  navRemediations: string;
  navCompare: string;
  navFieldAudit: string;
  navExecutiveBrief: string;
  quickAudit: string;
  enterprise: string;
  tagline: string;
  shareWhatsApp: string;
  attachPhoto: string;
  photoEvidence: string;

  // Dashboard KPIs
  monitoredPortals: string;
  monitoredPortalsSub: string;
  avgViolations: string;
  improving: string;
  attentionNeeded: string;
  nationalPassRate: string;
  passRateSub: string;
  auditsCompleted: string;
  auditsCompletedSub: string;

  // POUR Principles
  violationsByPrinciple: string;
  principleSub: string;
  bars: string;
  donut: string;
  totalIssues: string;
  perceivable: string;
  operable: string;
  understandable: string;
  robust: string;

  // Benchmark Card
  benchmarkTitle: string;
  benchmarkSub: string;
  cleanerThanGov: string;
  fewerViolations: string;
  yourPortals: string;
  govAverage: string;
  globalAverage: string;
  topFailureFactors: string;

  // Leaderboard
  leaderboardTitle: string;
  leaderboardSub: string;
  viewAllPortals: string;
  issues: string;
  pass: string;

  // Simulator & Actions
  visionSimulator: string;
  fieldInspection: string;
  verifiedSeal: string;
  gigwCompliance: string;
  copy: string;
  copied: string;
  downloadDiff: string;
}

const translations: Record<Language, Translations> = {
  en: {
    navDashboard: 'Dashboard',
    navSites: 'Portals',
    navRemediations: 'Remediations',
    navCompare: 'Compare',
    navFieldAudit: 'Field Audit',
    navExecutiveBrief: 'National Brief',
    quickAudit: 'Quick Audit',
    enterprise: 'Enterprise',
    tagline: 'Government Digital Accessibility & Compliance',
    shareWhatsApp: 'Share on WhatsApp',
    attachPhoto: 'Attach Inspection Photo',
    photoEvidence: 'Photographic Evidence',

    monitoredPortals: 'Monitored Portals',
    monitoredPortalsSub: 'Government portals & benchmarks',
    avgViolations: 'Avg Violations / Site',
    improving: 'Improving',
    attentionNeeded: 'Attention Needed',
    nationalPassRate: 'National Pass Rate',
    passRateSub: 'Weighted Level AA conformance',
    auditsCompleted: 'Audits Completed',
    auditsCompletedSub: 'Fully verified with axe-core',

    violationsByPrinciple: 'Violations by WCAG Principle',
    principleSub: 'Distribution across POUR foundational pillars',
    bars: 'Bars',
    donut: 'Donut',
    totalIssues: 'Total Issues',
    perceivable: 'Perceivable',
    operable: 'Operable',
    understandable: 'Understandable',
    robust: 'Robust',

    benchmarkTitle: 'Accessibility Benchmark',
    benchmarkSub: 'Comparative standing against WebAIM global standards',
    cleanerThanGov: 'Cleaner than Gov\'t Benchmark',
    fewerViolations: 'fewer violations per portal than national government baseline',
    yourPortals: 'Your Monitored Portals',
    govAverage: 'WebAIM Gov\'t Average',
    globalAverage: 'WebAIM Million (All Sectors)',
    topFailureFactors: 'WebAIM Top Failure Factors',

    leaderboardTitle: 'Compliance Leaderboard',
    leaderboardSub: 'Government portals ranked by accessibility health',
    viewAllPortals: 'View All Portals',
    issues: 'issues',
    pass: 'pass',

    visionSimulator: 'Citizen Vision Simulator',
    fieldInspection: 'Gram Panchayat Field Audit',
    verifiedSeal: 'AccessIQ Verified Seal',
    gigwCompliance: 'GIGW 3.0 & RPwD Act Compliance',
    copy: 'Copy',
    copied: 'Copied!',
    downloadDiff: 'Download Git Patch (.diff)',
  },
  kn: {
    navDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navSites: 'ಪೋರ್ಟಲ್‌ಗಳು',
    navRemediations: 'ಪರಿಹಾರಗಳು',
    navCompare: 'ಹೋಲಿಕೆ',
    navFieldAudit: 'ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆ',
    navExecutiveBrief: 'ರಾಷ್ಟ್ರೀಯ ವರದಿ',
    quickAudit: 'ತ್ವರಿತ ಪರಿಶೀಲನೆ',
    enterprise: 'ಸರ್ಕಾರಿ ಆವೃತ್ತಿ',
    tagline: 'ಸರ್ಕಾರಿ ಡಿಜಿಟಲ್ ಪ್ರವೇಶಿಸುವಿಕೆ ಮತ್ತು ಅನುಸರಣಾ ವೇದಿಕೆ',
    shareWhatsApp: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ',
    attachPhoto: 'ಪರಿಶೀಲನಾ ಫೋಟೋ ಲಗತ್ತಿಸಿ',
    photoEvidence: 'ಫೋಟೋ ಪುರಾವೆಗಳು',

    monitoredPortals: 'ವೀಕ್ಷಿಸಿದ ಪೋರ್ಟಲ್‌ಗಳು',
    monitoredPortalsSub: 'ಸರ್ಕಾರಿ ಜಾಲತಾಣಗಳು ಮತ್ತು ಮಾನದಂಡಗಳು',
    avgViolations: 'ಸರಾಸರಿ ಉಲ್ಲಂಘನೆಗಳು / ತಾಣ',
    improving: 'ಸುಧಾರಿಸುತ್ತಿದೆ',
    attentionNeeded: 'ಗಮನ ಅಗತ್ಯವಿದೆ',
    nationalPassRate: 'ರಾಷ್ಟ್ರೀಯ ಉತ್ತೀರ್ಣ ದರ',
    passRateSub: 'ಲೆವೆಲ್ AA ಅನುಸರಣಾ ಮಾನದಂಡ',
    auditsCompleted: 'ಪೂರ್ಣಗೊಂಡ ಲೆಕ್ಕಪರಿಶೋಧನೆಗಳು',
    auditsCompletedSub: 'axe-core ನಿಂದ ಸಂಪೂರ್ಣ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',

    violationsByPrinciple: 'WCAG ತತ್ವಗಳ ಪ್ರಕಾರ ಉಲ್ಲಂಘನೆಗಳು',
    principleSub: 'POUR ಮೂಲಭೂತ ಸ್ತಂಭಗಳಾದ್ಯಂತ ಹಂಚಿಕೆ',
    bars: 'ರೇಖಾಚಿತ್ರ',
    donut: 'ವರ್ತುಲ',
    totalIssues: 'ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು',
    perceivable: 'ಗ್ರಹಿಸಬಹುದಾದ',
    operable: 'ಕಾರ್ಯಸಾಧ್ಯ',
    understandable: 'ಅರ್ಥವಾಗುವಂತಹ',
    robust: 'ದೃಢವಾದ',

    benchmarkTitle: 'ಪ್ರವೇಶಿಸುವಿಕೆ ಮಾನದಂಡ',
    benchmarkSub: 'WebAIM ಜಾಗತಿಕ ಮಾನದಂಡಗಳೊಂದಿಗೆ ಹೋಲಿಕೆ',
    cleanerThanGov: 'ಸರ್ಕಾರಿ ಮಾನದಂಡಕ್ಕಿಂತ ಉತ್ತಮ',
    fewerViolations: 'ರಾಷ್ಟ್ರೀಯ ಸರ್ಕಾರಿ ಮಾನದಂಡಕ್ಕಿಂತ ಕಡಿಮೆ ಉಲ್ಲಂಘನೆಗಳು',
    yourPortals: 'ನಿಮ್ಮ ಪೋರ್ಟಲ್‌ಗಳು',
    govAverage: 'ಸರ್ಕಾರಿ ಸರಾಸರಿ (WebAIM)',
    globalAverage: 'ಜಾಗತಿಕ ಸರಾಸರಿ (ಎಲ್ಲಾ ವಲಯಗಳು)',
    topFailureFactors: 'ಪ್ರಮುಖ ಸಾಮಾನ್ಯ ನ್ಯೂನತೆಗಳು',

    leaderboardTitle: 'ಅನುಸರಣೆ ಲೀಡರ್‌ಬೋರ್ಡ್',
    leaderboardSub: 'ಆರೋಗ್ಯದ ಆಧಾರದ ಮೇಲೆ ಶ್ರೇಣೀಕರಿಸಲಾದ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳು',
    viewAllPortals: 'ಎಲ್ಲಾ ಪೋರ್ಟಲ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    issues: 'ಸಮಸ್ಯೆಗಳು',
    pass: 'ಉತ್ತೀರ್ಣ',

    visionSimulator: 'ನಾಗರಿಕ ದೃಷ್ಟಿ ಸಿಮ್ಯುಲೇಟರ್',
    fieldInspection: 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆ',
    verifiedSeal: 'AccessIQ ಪ್ರಮಾಣೀಕೃತ ಮೊಹರು',
    gigwCompliance: 'GIGW 3.0 ಮತ್ತು RPwD ಕಾಯ್ದೆ ಅನುಸರಣೆ',
    copy: 'ನಕಲಿಸಿ',
    copied: 'ನಕಲಿಸಲಾಗಿದೆ!',
    downloadDiff: 'Git ಪ್ಯಾಚ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.diff)',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('accessiq_lang') as Language;
    return saved === 'kn' ? 'kn' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('accessiq_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
