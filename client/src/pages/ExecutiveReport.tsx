import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Award,
  Download,
} from 'lucide-react';
import { api, ExecutiveReportData } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { AuditCrystal3D } from '../components/three/AuditCrystal3D';
import { sanitizeUrl } from '../lib/sanitize-url';

export const ExecutiveReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ExecutiveReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.fetchReport(id);
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate executive report');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary-600 w-10 h-10 mb-3" />
        <p className="text-base font-medium text-gray-700">Synthesizing Executive Compliance Audit...</p>
        <p className="text-xs text-gray-400 mt-1">Evaluating WCAG 2.2 and GIGW 3.0 statutory metrics</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Unable to Generate Report</h3>
            <p className="text-sm mt-1">{error || 'Target scan data not found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { auditSummary, conformanceMetrics, target, topRisks } = report;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'B':
        return 'bg-amber-500 text-white border-amber-600';
      case 'C':
        return 'bg-orange-500 text-white border-orange-600';
      default:
        return 'bg-rose-600 text-white border-rose-700';
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    const headers = [
      'Report ID',
      'Target Name',
      'Target URL',
      'Health Score',
      'Grade',
      'Total Violations',
      'Critical',
      'Serious',
      'Moderate',
      'Minor',
      'Rule ID',
      'WCAG Criterion',
      'Criterion Name',
      'Severity',
      'Affected Elements',
      'DOM Selector',
      'Remediation Advice',
    ];

    const rows = report.topRisks.map((risk) => [
      `"${report.reportId}"`,
      `"${report.target.siteName}"`,
      `"${report.target.url}"`,
      report.auditSummary.healthScore,
      `"${report.auditSummary.letterGrade}"`,
      report.auditSummary.totalViolations,
      report.auditSummary.severityBreakdown.critical,
      report.auditSummary.severityBreakdown.serious,
      report.auditSummary.severityBreakdown.moderate,
      report.auditSummary.severityBreakdown.minor,
      `"${risk.ruleId}"`,
      `"${risk.criterion}"`,
      `"${risk.criterionName.replace(/"/g, '""')}"`,
      risk.severity,
      risk.nodeCount,
      `"${risk.selector.replace(/"/g, '""')}"`,
      `"${(risk.remediation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessiq-executive-report-${report.target.siteName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 print:p-0 print:max-w-none">
      {/* Navigation & Print Actions (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden border-b pb-4">
        <Link
          to={`/sites/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800"
        >
          <ArrowLeft size={16} /> Back to Site Audit
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-xs transition-colors"
            title="Download executive assessment data as CSV"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Printer size={16} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Formal Audit Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-primary-700 text-white rounded-xl">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary-700">
                Official Compliance Assessment
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Executive Accessibility Audit
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Report Reference: {report.reportId}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right text-xs text-slate-600 space-y-0.5">
            <p>
              <span className="font-semibold text-slate-700">Audited Date:</span>{' '}
              {new Date(auditSummary.scannedAt).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Engine:</span> {report.toolEngine}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Standards:</span> {report.standards.join(' • ')}
            </p>
          </div>
        </div>

        {/* Portal Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-slate-200 text-sm">
          <div>
            <span className="text-xs font-bold uppercase text-slate-600 block mb-1">Target Portal</span>
            <span className="font-bold text-slate-900 text-base">{target.siteName}</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-600 block mb-1">Portal URL</span>
            <a
              href={sanitizeUrl(target.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 font-mono text-xs hover:underline inline-flex items-center gap-1"
            >
              {target.url} <ExternalLink size={10} />
            </a>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-600 block mb-1">Entity Classification</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-800 uppercase">
              {target.siteType} ({target.country})
            </span>
          </div>
        </div>

        {/* Executive Letter Grade & Score Banner with 3D Holographic Crystal */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200">
          <div className="flex items-center gap-5">
            {/* 3D Interactive Audit Crystal (Screen only) */}
            <div className="hidden sm:block print:hidden flex-shrink-0">
              <AuditCrystal3D
                grade={auditSummary.letterGrade}
                healthScore={auditSummary.healthScore}
                size={105}
              />
            </div>

            {/* Static Badge (Visible in Print & Fallback) */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-md border-2 flex-shrink-0 sm:hidden print:flex ${getGradeColor(
                auditSummary.letterGrade,
              )}`}
            >
              <span>{auditSummary.letterGrade}</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">Grade</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {auditSummary.healthScore} / 100
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Compliance Health Score
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mt-0.5">{auditSummary.gradeLabel}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md">
                Automated evaluation against WCAG 2.2 Level AA success criteria and GIGW 3.0 statutory clauses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
              <span className="text-2xl font-extrabold text-red-700 block">
                {auditSummary.severityBreakdown.critical}
              </span>
              <span className="text-[11px] font-bold text-red-800 uppercase">Critical</span>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
              <span className="text-2xl font-extrabold text-orange-700 block">
                {auditSummary.severityBreakdown.serious}
              </span>
              <span className="text-[11px] font-bold text-orange-800 uppercase">Serious</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="text-2xl font-extrabold text-amber-700 block">
                {auditSummary.severityBreakdown.moderate}
              </span>
              <span className="text-[11px] font-bold text-amber-800 uppercase">Moderate</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <span className="text-2xl font-extrabold text-blue-700 block">
                {auditSummary.severityBreakdown.minor}
              </span>
              <span className="text-[11px] font-bold text-blue-800 uppercase">Minor</span>
            </div>
          </div>
        </div>

        {/* Executive Narrative */}
        <div className="py-6 border-b border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary-600" /> Executive Findings Statement
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-4 rounded-xl border border-slate-200">
            {auditSummary.executiveNarrative}
          </p>
        </div>

        {/* Conformance Metrics Grid */}
        <div className="py-6 border-b border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-600" /> Standards Conformance Scorecard
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Level A */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-600 uppercase">WCAG 2.2 Level A</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {conformanceMetrics.levelAPassRate}%
                </span>
                <span className="text-xs text-slate-600">pass rate</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${conformanceMetrics.levelAPassRate}%` }}
                ></div>
              </div>
            </div>

            {/* Level AA */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-600 uppercase">WCAG 2.2 Level AA</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {conformanceMetrics.levelAAPassRate}%
                </span>
                <span className="text-xs text-slate-600">pass rate</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${conformanceMetrics.levelAAPassRate}%` }}
                ></div>
              </div>
            </div>

            {/* GIGW 3.0 */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-600 uppercase">GIGW 3.0 Mandatory</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {conformanceMetrics.gigwComplianceRate}%
                </span>
                <span className="text-xs text-slate-600">
                  ({conformanceMetrics.gigwMandatoryPassed}/{conformanceMetrics.gigwTotalEvaluated} checks)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${conformanceMetrics.gigwComplianceRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Remediation Roadmap */}
        <div className="pt-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> High-Priority Compliance Risks ({topRisks.length})
          </h2>

          <div className="space-y-3">
            {topRisks.length === 0 ? (
              <div className="p-6 text-center text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                Zero high-priority risks detected. Portal satisfies baseline compliance checks.
              </div>
            ) : (
              topRisks.map((risk, index) => (
                <div
                  key={risk.ruleId}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">{risk.ruleId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        WCAG {risk.criterion}
                      </span>
                    </div>
                    <SeverityBadge severity={risk.severity} />
                  </div>

                  <p className="text-xs text-slate-700 font-medium">{risk.criterionName}</p>

                  {risk.userImpact && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-bold text-slate-700">Barrier:</span> {risk.userImpact}
                    </p>
                  )}

                  {risk.remediation && (
                    <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-200">
                      <span className="font-bold">Recommended Action:</span> {risk.remediation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legal Disclaimer & Audit Stamp */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1">
          <p>
            This automated compliance audit is executed under AccessIQ Enterprise Testing protocols.
          </p>
          <p>
            Automated scanning assesses approximately 30-40% of WCAG success criteria. Comprehensive compliance certification requires complementary manual screen reader (NVDA/JAWS) and keyboard-only testing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReport;
