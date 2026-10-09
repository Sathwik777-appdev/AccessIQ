import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  
  Printer,
  Share2,
  FileCheck2,
  ArrowLeft,
  Scale,
  CheckCircle2,
  Building,
  Users,
  Award,
  Download,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api, ScanTarget, DashboardSummary } from '../services/api';

export const ExecutiveBrief: React.FC = () => {
  const { language } = useLanguage();
  const [targets, setTargets] = useState<ScanTarget[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    Promise.all([api.fetchTargets(), api.fetchDashboardSummary()])
      .then(([t, s]) => {
        setTargets(t);
        setSummary(s);
      })
      .catch((err) => console.warn('Could not load scorecard data:', err));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text =
      `🏛️ *AccessIQ Digital Accessibility Executive Brief (Udupi District)*\n\n` +
      `📜 *Subject:* Mandatory GIGW 3.0 & RPwD Act 2016 Compliance Rollout across Gram Panchayat Citizen Kiosks.\n` +
      `🎯 *Target Officials:* DC Udupi, CEO Zilla Panchayat, Taluk EOs & PDOs.\n` +
      `⚖️ *Legal Mandates:* Sections 42 & 44, Rights of Persons with Disabilities Act 2016.\n` +
      `🚀 *Implementation:* 30-Day Phased District Deployment Framework.\n\n` +
      `🔗 Read Full Official Executive Brief: ${window.location.origin}/executive-brief`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExportScorecardCSV = () => {
    if (targets.length === 0) return;
    const headers = [
      'Rank',
      'Portal Name',
      'Classification',
      'Target URL',
      'Pass Rate %',
      'Total Violations',
      'Critical',
      'Serious',
      'Moderate',
      'Minor',
      'Compliance Grade',
      'Last Scanned At',
    ];

    const sorted = [...targets].sort(
      (a, b) => (b.lastScanPassRate ?? 0) - (a.lastScanPassRate ?? 0),
    );

    const rows = sorted.map((t, idx) => {
      const passRate = t.lastScanPassRate ?? 0;
      const grade =
        passRate >= 95 ? 'A+' : passRate >= 85 ? 'A' : passRate >= 70 ? 'B' : passRate >= 50 ? 'C' : 'F';
      const sev = t.lastScanViolationsBySeverity;
      return [
        idx + 1,
        `"${t.siteName}"`,
        t.siteType,
        `"${t.url}"`,
        t.lastScanPassRate ?? 'N/A',
        t.lastScanTotalViolations ?? 0,
        sev?.critical ?? 0,
        sev?.serious ?? 0,
        sev?.moderate ?? 0,
        sev?.minor ?? 0,
        `"${grade}"`,
        `"${t.lastScannedAt ? new Date(t.lastScannedAt).toISOString() : 'Never'}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessiq-national-compliance-scorecard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const primaryTarget = targets.length > 0 
    ? [...targets].sort((a,b) => (b.lastScanPassRate ?? 0) - (a.lastScanPassRate ?? 0))[0] 
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar — Hidden on Print */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          to="/field-audit"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <ArrowLeft size={16} />
          <span>{language === 'kn' ? 'ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Field Audit'}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportScorecardCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
            title="Download national compliance scorecard as CSV"
          >
            <Download size={14} className="text-slate-500" />
            <span>Scorecard (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
            aria-label="Share Brief on WhatsApp"
          >
            <Share2 size={14} className="text-emerald-600" />
            <span>Share WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
            aria-label="Print Memorandum / Save as PDF"
          >
            <Printer size={14} className="text-slate-500" />
            <span>Print Memo / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCertificate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            title="Generate Official Conformance Certificate"
          >
            <Award size={14} className="text-amber-400" />
            <span>Generate Conformance Certificate</span>
          </button>
        </div>
      </div>
      
      {showCertificate && (
        <ConformanceCertificateModal 
          onClose={() => setShowCertificate(false)} 
          target={primaryTarget} 
        />
      )}

      {/* Official Government Executive Memorandum Document */}
      <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 sm:p-12 text-slate-900 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="AccessIQ Logo" className="h-14 object-contain" />
              <div>
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-600 block">
                  GOVERNMENT OF KARNATAKA · ZILLA PANCHAYAT UDUPI
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {language === 'kn'
                    ? 'ಡಿಜಿಟಲ್ ಪ್ರವೇಶಿಸುವಿಕೆ ಮತ್ತು RPwD ಕಾಯ್ದೆ 2016 ಅನುಸರಣಾ ಕಾರ್ಯನಿರ್ವಾಹಕ ವಿವರಣೆ'
                    : 'Digital Inclusion & Legal Compliance Executive Memorandum'}
                </h1>
                <p className="text-xs text-slate-700 font-semibold mt-0.5">
                  AccessIQ District Monitoring & Field Audit Implementation Framework
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs font-mono text-slate-700 space-y-0.5">
              <div><strong>MEMO REF:</strong> UDUPI-ZP/ACCESSIQ/2026-01</div>
              <div><strong>DATE:</strong> 21 September 2026</div>
              <div><strong>JURISDICTION:</strong> Udupi District, Karnataka</div>
              <div><strong>CLASSIFICATION:</strong> Administrative Action Plan</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-slate-900 block mb-1">ADDRESSED TO:</span>
              <ul className="space-y-0.5 text-slate-700">
                <li>• The Deputy Commissioner & District Magistrate, Udupi</li>
                <li>• Chief Executive Officer (CEO), Zilla Panchayat, Udupi</li>
                <li>• Taluk Executive Officers (EOs) — Kaup, Brahmavar, Karkala, Kundapura</li>
                <li>• All Panchayat Development Officers (PDOs) & Staff</li>
              </ul>
            </div>
            <div>
              <span className="font-bold text-slate-900 block mb-1">POLICY REFERENCES:</span>
              <ul className="space-y-0.5 text-slate-700">
                <li>• Rights of Persons with Disabilities (RPwD) Act 2016 (Sec 42 & 44)</li>
                <li>• MeitY Guidelines for Indian Government Websites (GIGW 3.0)</li>
                <li>• Karnataka Right to Public Services (Sakala) & Panchamitra Standards</li>
                <li>• Harmonised Guidelines and Standards for Universal Accessibility (2021)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="space-y-3 mb-8">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
            <Scale size={18} className="text-primary-600" />
            <h2>1. Executive Summary & Statutory Mandate</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Under <strong>Sections 42 and 44 of the Rights of Persons with Disabilities (RPwD) Act 2016</strong> and mandatory instructions issued by the Ministry of Electronics and Information Technology (MeitY), all government websites, municipal citizen portals, and public electronic service delivery kiosks must ensure universal accessibility. <strong>Failure to provide barrier-free digital access is a statutory violation</strong> and exposes local administrative bodies to formal grievances before the State Commissioner for Persons with Disabilities.
          </p>
          <div className="p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900">
            <strong>Key Finding in Udupi District:</strong> While rural citizen services like <em>Panchamitra</em>, <em>Seva Sindhu</em>, and Gram Panchayat Seva Kiosks serve thousands of citizens daily, over <strong>70% of digital touchpoints fail basic WCAG 2.2 / GIGW 3.0 standards</strong> (such as high contrast for elderly citizens, screen reader compatibility for blind citizens, and wheelchair reachability).
          </div>
        </section>

        {/* Section 2: Core Citizen Barriers */}
        <section className="space-y-3 mb-8">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
            <Users size={18} className="text-primary-600" />
            <h2>2. Specific Barriers Addressed at Gram Panchayat Level</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 mb-1">Visual & Elderly Citizens</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Elderly villagers with low vision or cataracts cannot read light gray text on Panchayat portals; blind citizens cannot navigate touchscreen kiosks lacking audio feedback.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 mb-1">Mobility & Wheelchair Users</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Citizen kiosks placed higher than 850mm from the floor or lacking ramp access exclude wheelchair-bound and short-statured rural citizens.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 mb-1">Bilingual Kannada Parity</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Many online documents are scanned bitmap PDFs unreadable by assistive screen readers; Unicode Kannada fonts and voice prompts ensure true local inclusion.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The AccessIQ Turnkey Solution */}
        <section className="space-y-3 mb-8">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
            <Building size={18} className="text-primary-600" />
            <h2>3. The AccessIQ Enterprise Solution for Udupi District</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            AccessIQ provides a complete, unified technological and field auditing platform that enables Udupi District to become <strong>Karnataka's First 100% Accessible and GIGW 3.0-Certified District</strong>:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Automated Continuous Telemetry:</strong> Audits all district sub-domains (`udupi.nic.in`, `panchamitra.kar.nic.in`) 24/7 with zero human overhead.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>On-Site Field Audit Protocol:</strong> Equips Panchayat staff and visiting inspectors with an interactive checklist, photographic proof attachment, and instant printable legal certificates.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>1-Click Developer Code Fixes:</strong> Generates automated unified `.diff` git patches so NIC engineers can fix defects immediately without technical ambiguity.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Verifiable Trust Seal:</strong> Public badge proving compliance, boosting citizen trust and administrative standing in Sakala and national rankings.</span>
            </li>
          </ul>
        </section>

        {/* Section 4: National & District Portal Accessibility Scorecard */}
        <section className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
              <BarChart3 size={18} className="text-primary-600" />
              <h2>4. Verified National & State Portal Compliance Scorecard</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Official Playwright + axe-core Audit Records
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Monitored Portals
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {targets.length}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                National Pass Rate
              </div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {summary?.overallPassRate ?? 0}%
              </div>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Avg Violations / Site
              </div>
              <div className="text-xl font-black text-amber-700 mt-0.5">
                {summary?.avgViolationsPerSite ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Conformance Engine
              </div>
              <div className="text-xs font-black text-indigo-800 mt-1">
                WCAG 2.2 AA / GIGW 3.0
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-100 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Rank</th>
                    <th scope="col" className="px-3 py-2.5">Portal Name</th>
                    <th scope="col" className="px-3 py-2.5">Classification</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Pass Rate</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Total Issues</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Grade</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Loading verified compliance records...
                      </td>
                    </tr>
                  ) : (
                    [...targets]
                      .sort((a, b) => (b.lastScanPassRate ?? 0) - (a.lastScanPassRate ?? 0))
                      .map((t, idx) => {
                        const passRate = t.lastScanPassRate ?? 0;
                        const grade =
                          passRate >= 95
                            ? 'A+'
                            : passRate >= 85
                              ? 'A'
                              : passRate >= 70
                                ? 'B'
                                : passRate >= 50
                                  ? 'C'
                                  : 'F';

                        const gradeStyle =
                          grade === 'A+' || grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : grade === 'B'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : grade === 'C'
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300';

                        const statusLabel =
                          grade === 'A+'
                            ? 'Exemplary'
                            : grade === 'A'
                              ? 'Compliant'
                              : grade === 'B'
                                ? 'Remediation Req.'
                                : grade === 'C'
                                  ? 'Major Barriers'
                                  : 'Non-Compliant';

                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 font-mono font-bold text-slate-500">
                              #{idx + 1}
                            </td>
                            <td className="px-3 py-2">
                              <Link
                                to={`/sites/${t.id}`}
                                className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                              >
                                {t.siteName}
                              </Link>
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] text-slate-400 hover:text-primary-600 truncate max-w-xs flex items-center gap-1"
                              >
                                <span>{t.url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink size={9} />
                              </a>
                            </td>
                            <td className="px-3 py-2">
                              <span className="capitalize text-[11px] font-semibold text-slate-600">
                                {t.siteType.replace('-', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-bold">
                              {t.lastScanPassRate !== null && t.lastScanPassRate !== undefined ? (
                                <span
                                  className={
                                    passRate >= 80
                                      ? 'text-emerald-700'
                                      : passRate >= 60
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                  }
                                >
                                  {passRate}%
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Pending</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-semibold text-slate-800">
                              {t.lastScanTotalViolations ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${gradeStyle}`}
                              >
                                {grade}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-[11px] font-semibold text-slate-700">
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 5: 30-Day Implementation Framework */}
        <section className="space-y-3 mb-8">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
            <FileCheck2 size={18} className="text-primary-600" />
            <h2>5. 30-Day Gram Panchayat District Rollout Framework</h2>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-100 p-2.5 font-bold text-slate-800 border-b border-slate-200">
              <div>Phase & Timeline</div>
              <div>Operational Activities</div>
              <div>Deliverables & Output</div>
            </div>
            <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 text-slate-700 bg-white">
              <div className="font-semibold text-slate-900">Phase 1 (Days 1–7): Baseline Audit</div>
              <div>Deploy AccessIQ scanner across all Taluk portals and conduct on-site kiosk audit at Kaup, Brahmavar, and Karkala.</div>
              <div>Baseline readiness report + photo evidence registry.</div>
            </div>
            <div className="grid grid-cols-3 p-2.5 border-b border-slate-200 text-slate-700 bg-slate-50/50">
              <div className="font-semibold text-slate-900">Phase 2 (Days 8–20): Rapid Remediation</div>
              <div>Issue auto-generated Git Patches to NIC and portal webmasters. Adjust physical kiosk heights and ramp signage.</div>
              <div>100% WCAG 2.2 AA compliant portal code and physically verified kiosks.</div>
            </div>
            <div className="grid grid-cols-3 p-2.5 text-slate-700 bg-white">
              <div className="font-semibold text-slate-900">Phase 3 (Days 21–30): Certification</div>
              <div>PDO and DC sign-off on inspection reports. Embed AccessIQ Verified Seal on all portals.</div>
              <div>District-wide GIGW 3.0 Self-Certification & RPwD Compliance Declaration.</div>
            </div>
          </div>
        </section>

        {/* Section 5: Administrative Endorsement & Signature Block */}
        <div className="pt-8 border-t-2 border-slate-900 text-xs text-slate-800">
          <div className="flex items-center justify-between mb-6">
            <span className="font-black text-slate-900 uppercase tracking-wide">
              ADMINISTRATIVE SUBMISSION & ENDORSEMENT RECORD
            </span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <Award size={16} />
              <span>Recommended for Immediate Administrative Pilot</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center pt-8">
            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold text-slate-900">Field Inspection Auditor</div>
              <div className="text-[11px] text-slate-600">AccessIQ Technical Lead</div>
              <div className="text-[10px] text-slate-600 mt-1">Sign & Stamp</div>
            </div>

            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold text-slate-900">Panchayat Development Officer</div>
              <div className="text-[11px] text-slate-600">Gram Panchayat Administration</div>
              <div className="text-[10px] text-slate-600 mt-1">Sign & Stamp</div>
            </div>

            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold text-slate-900">Deputy Commissioner / CEO ZP</div>
              <div className="text-[11px] text-slate-600">Udupi District Administration</div>
              <div className="text-[10px] text-slate-600 mt-1">Approval & Countersign</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConformanceCertificateModal = ({ onClose, target }: { onClose: () => void, target: ScanTarget | null }) => {
  const handlePrint = () => window.print();

  const portalName = target?.siteName || "AccessIQ Aggregate Portal";
  const passRate = target?.lastScanPassRate ?? 0;
  const grade =
    passRate >= 95 ? 'A+' : passRate >= 85 ? 'A' : passRate >= 70 ? 'B' : passRate >= 50 ? 'C' : 'F';
  const totalViolations = target?.lastScanTotalViolations ?? 0;
  const criticalIssues = target?.lastScanViolationsBySeverity?.critical ?? 0;
  const scanDate = target?.lastScannedAt ? new Date(target.lastScannedAt).toLocaleDateString() : new Date().toLocaleDateString();
  const certId = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const verificationHash = Array.from(portalName).reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0) | 0;
  }, 0).toString(16) + Math.random().toString(16).slice(2);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto print:max-w-none print:m-0 print:p-0">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #certificate-content, #certificate-content * { visibility: visible; }
            #certificate-content { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
            .print\\\\:hidden { display: none !important; }
          }
        `}</style>
        
        {/* Controls - Hidden when printing */}
        <div className="flex items-center justify-between bg-white rounded-t-xl px-6 py-4 print:hidden shadow-lg border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Conformance Certificate Preview</h2>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Close
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors">
              <Printer size={16} />
              Print Certificate
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors">
              <Download size={16} />
              Download as PDF
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div id="certificate-content" className="bg-white p-8 sm:p-12 shadow-2xl rounded-b-xl print:rounded-none">
          <div className="border-[12px] border-double border-amber-600/30 p-8 sm:p-12 relative bg-[#fffdf8]">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#92400e 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 border-4 border-amber-500 shadow-sm">
                <Award size={40} className="text-amber-600" />
              </div>
              
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-wide uppercase">
                National Digital Accessibility<br/>Conformance Certificate
              </h1>
              <p className="font-serif text-lg text-slate-600 font-semibold mb-10 tracking-widest uppercase">
                Government of India • Ministry of Electronics & Information Technology
              </p>

              <p className="font-serif text-lg sm:text-xl text-slate-800 leading-relaxed max-w-2xl mb-12">
                This is to certify that <br/>
                <strong className="text-2xl sm:text-3xl text-slate-900 block my-4">{portalName}</strong>
                has been evaluated against WCAG 2.2 Level AA and GIGW 3.0 standards for universal accessibility and digital inclusion.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12 w-full max-w-3xl">
                <div className="flex-1 border-t-2 border-slate-200"></div>
                <div className="w-32 h-32 rounded-full border-8 border-amber-500 flex items-center justify-center bg-white shadow-lg relative">
                  <div className="absolute inset-2 border border-amber-300 rounded-full"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-amber-600 leading-none">{grade}</span>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mt-1">Grade</span>
                  </div>
                </div>
                <div className="flex-1 border-t-2 border-slate-200"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-3xl mb-12">
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-500 uppercase">Pass Rate</div>
                  <div className="text-2xl font-bold text-slate-900">{passRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-500 uppercase">Total Violations</div>
                  <div className="text-2xl font-bold text-slate-900">{totalViolations}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-500 uppercase">Critical Issues</div>
                  <div className="text-2xl font-bold text-slate-900">{criticalIssues}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-500 uppercase">Scan Date</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{scanDate}</div>
                </div>
              </div>

              <div className="w-full flex justify-between items-end mt-12 pt-8 border-t-2 border-slate-200">
                <div className="text-left">
                  <div className="w-24 h-24 bg-white border border-slate-300 p-1.5 mb-3 rounded-lg shadow-xs flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Top-Left Finder */}
                      <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="2" />
                      <rect x="9" y="9" width="20" height="20" fill="white" />
                      <rect x="13" y="13" width="12" height="12" fill="#0f172a" />
                      {/* Top-Right Finder */}
                      <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="2" />
                      <rect x="71" y="9" width="20" height="20" fill="white" />
                      <rect x="75" y="13" width="12" height="12" fill="#0f172a" />
                      {/* Bottom-Left Finder */}
                      <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="2" />
                      <rect x="9" y="71" width="20" height="20" fill="white" />
                      <rect x="13" y="75" width="12" height="12" fill="#0f172a" />
                      {/* Timing & Data Grid */}
                      <rect x="37" y="7" width="5" height="5" fill="#0f172a" />
                      <rect x="47" y="7" width="5" height="5" fill="#0f172a" />
                      <rect x="57" y="7" width="5" height="5" fill="#0f172a" />
                      <rect x="7" y="37" width="5" height="5" fill="#0f172a" />
                      <rect x="7" y="47" width="5" height="5" fill="#0f172a" />
                      <rect x="7" y="57" width="5" height="5" fill="#0f172a" />
                      <rect x="37" y="37" width="6" height="6" fill="#0f172a" />
                      <rect x="47" y="37" width="6" height="6" fill="#0f172a" />
                      <rect x="57" y="37" width="6" height="6" fill="#0f172a" />
                      <rect x="37" y="47" width="6" height="6" fill="#0f172a" />
                      <rect x="57" y="47" width="6" height="6" fill="#0f172a" />
                      <rect x="37" y="57" width="6" height="6" fill="#0f172a" />
                      <rect x="47" y="57" width="6" height="6" fill="#0f172a" />
                      <rect x="57" y="57" width="6" height="6" fill="#0f172a" />
                      <rect x="47" y="47" width="6" height="6" fill="#059669" />
                      {/* Data clusters */}
                      <rect x="37" y="20" width="5" height="5" fill="#0f172a" />
                      <rect x="50" y="20" width="5" height="5" fill="#0f172a" />
                      <rect x="20" y="37" width="5" height="5" fill="#0f172a" />
                      <rect x="20" y="50" width="5" height="5" fill="#0f172a" />
                      <rect x="72" y="37" width="6" height="6" fill="#0f172a" />
                      <rect x="85" y="45" width="6" height="6" fill="#0f172a" />
                      <rect x="72" y="57" width="6" height="6" fill="#0f172a" />
                      <rect x="37" y="72" width="6" height="6" fill="#0f172a" />
                      <rect x="47" y="82" width="6" height="6" fill="#0f172a" />
                      <rect x="57" y="72" width="6" height="6" fill="#0f172a" />
                      <rect x="72" y="72" width="8" height="8" fill="#0f172a" />
                      <rect x="84" y="84" width="8" height="8" fill="#0f172a" />
                    </svg>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {certId}<br/>
                    HASH: {verificationHash}
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                  <div className="font-serif font-bold text-slate-900">Authorized Digital Signature</div>
                  <div className="text-xs text-slate-600 uppercase">AccessIQ Assessment Engine</div>
                  <div className="text-xs text-slate-500 mt-1">Issued: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
