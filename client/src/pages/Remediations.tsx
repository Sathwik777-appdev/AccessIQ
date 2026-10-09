// @ts-nocheck

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Download,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { api, RemediationItem, RemediationsResponse } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { useLanguage } from '../context/LanguageContext';

function BeforeAfterDiff({ 
   
  brokenHtml, 
  fixedHtml, 
  onCopy, 
  onDownload,
  copied 
}: { 
  ruleId: string; 
  brokenHtml: string; 
  fixedHtml: string; 
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const unifiedLines = [
    ...brokenHtml.split('\n').map(line => ({ type: 'del', text: line })),
    ...fixedHtml.split('\n').map(line => ({ type: 'add', text: line })),
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Diff Viewer */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-wide flex items-center gap-2">
              <code className="text-indigo-400 font-mono text-xs">Code Diff</code>
            </span>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button 
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Split View
              </button>
              <button 
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'unified' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Unified View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-900 text-xs font-semibold text-indigo-200 border border-indigo-700 transition-colors"
            >
              <Download size={14} />
              <span>Download .diff</span>
            </button>
          </div>
        </div>

        {viewMode === 'split' ? (
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="flex-1 bg-rose-50/30">
              <div className="px-4 py-2 border-b border-rose-100 bg-rose-50 flex justify-between items-center text-xs font-bold text-rose-800">
                <span>BEFORE (Inaccessible)</span>
              </div>
              <pre className="p-4 text-xs font-mono text-rose-900 overflow-x-auto whitespace-pre-wrap break-words">
                {brokenHtml}
              </pre>
            </div>
            <div className="flex-1 bg-emerald-50/30">
              <div className="px-4 py-2 border-b border-emerald-100 bg-emerald-50 flex justify-between items-center text-xs font-bold text-emerald-800">
                <span>AFTER (WCAG 2.2 Compliant)</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-900 overflow-x-auto whitespace-pre-wrap break-words">
                {fixedHtml}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed">
              {unifiedLines.map((line, i) => (
                <div 
                  key={i} 
                  className={`px-2 py-0.5 rounded ${line.type === 'del' ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'}`}
                >
                  <span className="opacity-50 select-none mr-2">{line.type === 'del' ? '-' : '+'}</span>
                  {line.text}
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>

      {/* Visual Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-rose-200 bg-white/50 backdrop-blur overflow-hidden shadow-sm p-4">
          <div className="text-xs font-bold text-rose-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} /> Broken Widget
          </div>
          <div 
            className="p-4 rounded-xl bg-white border border-rose-100 shadow-inner"
            dangerouslySetInnerHTML={{ __html: brokenHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') }}
          />
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/50 backdrop-blur overflow-hidden shadow-sm p-4">
          <div className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Fixed Widget
          </div>
          <div 
            className="p-4 rounded-xl bg-white border border-emerald-100 shadow-inner"
            dangerouslySetInnerHTML={{ __html: fixedHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Remediations() {
  const { language } = useLanguage();
  const [data, setData] = useState<RemediationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>('all');
  const [selectedEffort, setSelectedEffort] = useState<string>('all');

  // Accordion open/close state for portals list per rule
  const [expandedPortals, setExpandedPortals] = useState<Record<string, boolean>>({});
  // Copy state per rule
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  useEffect(() => {
    loadRemediations();
  }, []);

  const loadRemediations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.fetchRemediations();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load remediations data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (ruleId: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedRuleId(ruleId);
    setTimeout(() => setCopiedRuleId(null), 2000);
  };

  const handleDownloadPatch = (r: RemediationItem) => {
    const diff = `--- a/portal-template.html\n+++ b/portal-template.html\n@@ -1,3 +1,3 @@\n-<!-- Accessibility Barrier: ${r.ruleId} (${r.wcagCriterion}) -->\n+<!-- Fixed WCAG 2.2 Compliant Code -->\n+${r.suggestedFixSnippet || '/* Consult W3C WCAG technique for ' + r.ruleId + ' */'}\n`;
    const blob = new Blob([diff], { type: 'text/x-diff;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessiq-fix-${r.ruleId}.diff`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!data || data.remediations.length === 0) return;

    const headers = [
      'Priority Rank',
      'Rule ID',
      'WCAG Criterion',
      'Criterion Name',
      'Severity',
      'Principle',
      'Effort',
      'Affected Portals Count',
      'Total Affected Elements',
      'Affected Portals',
      'Remediation Advice',
    ];

    const rows = filteredRemediations.map((r, idx) => [
      idx + 1,
      `"${r.ruleId}"`,
      `"${r.wcagCriterion}"`,
      `"${r.wcagCriterionName.replace(/"/g, '""')}"`,
      r.severity,
      r.principle,
      `"${r.effort || 'Moderate'}"`,
      r.affectedPortalCount,
      r.totalNodeCount,
      `"${r.affectedPortals.map((p) => p.siteName).join(', ')}"`,
      `"${(r.remediation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessiq-remediation-action-plan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRemediations = useMemo(() => {
    if (!data) return [];
    return data.remediations.filter((r) => {
      const matchesSearch =
        r.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.wcagCriterion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.wcagCriterionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.affectedPortals.some((p) => p.siteName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeverity = selectedSeverity === 'all' || r.severity === selectedSeverity;
      const matchesPrinciple = selectedPrinciple === 'all' || r.principle === selectedPrinciple;
      const matchesEffort =
        selectedEffort === 'all' ||
        (selectedEffort === 'quick' && (r.effort?.includes('<15m') || r.effort?.includes('Quick'))) ||
        (selectedEffort === 'moderate' && (r.effort?.includes('Moderate') || r.effort?.includes('1-2h'))) ||
        (selectedEffort === 'complex' && (r.effort?.includes('Complex') || r.effort?.includes('Half-day')));

      return matchesSearch && matchesSeverity && matchesPrinciple && matchesEffort;
    });
  }, [data, searchTerm, selectedSeverity, selectedPrinciple, selectedEffort]);

  // Statistics
  const quickFixCount = useMemo(() => {
    if (!data) return 0;
    return data.remediations.filter(
      (r) => r.effort?.includes('<15m') || r.effort?.includes('Quick'),
    ).length;
  }, [data]);

  const criticalRulesCount = useMemo(() => {
    if (!data) return 0;
    return data.remediations.filter((r) => r.severity === 'critical' || r.severity === 'serious')
      .length;
  }, [data]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-4">
          <AlertTriangle className="text-rose-500 mt-0.5 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-lg">Unable to Load Remediation Engine</h3>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadRemediations}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <Wrench size={13} />
            <span>Deterministic Engineering Fix Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'kn' ? 'ಅನುಸರಣಾ ಪರಿಹಾರ ಕ್ರಿಯಾ ಯೋಜನೆ' : 'Remediation Action Center'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'kn'
              ? 'ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳಲ್ಲಿನ ವೈಫಲ್ಯಗಳನ್ನು ಸರಿಪಡಿಸಲು ಕೋಡ್ ಪರಿಹಾರಗಳು ಮತ್ತು ಪ್ರಾಮುಖ್ಯತೆಯ ಶ್ರೇಣಿ'
              : 'Prioritized technical blueprints, copyable code fixes, and git patch diffs across monitored portals.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredRemediations.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            title="Export filtered remediation tasks as CSV"
          >
            <Download size={16} />
            <span>Export Action Plan (CSV)</span>
          </button>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span>Compare Before / After</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-200 bg-white/70">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Unique Barrier Rules
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {data?.totalRules || 0}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Across {data?.totalPortalsScanned || 0} scanned portals</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-rose-200 bg-rose-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <ShieldAlert size={14} /> High Legal Risk
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
            {criticalRulesCount}
          </div>
          <div className="text-xs text-rose-600 mt-0.5">Critical & serious barrier rules</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <Zap size={14} /> Quick Fixes Available
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {quickFixCount}
          </div>
          <div className="text-xs text-emerald-600 mt-0.5">Resolvable in under 15 minutes</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Total Barrier Nodes
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
            {data?.totalAffectedNodes.toLocaleString() || 0}
          </div>
          <div className="text-xs text-indigo-600 mt-0.5">Affected HTML elements in production</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white/80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by rule ID (e.g. color-contrast, image-alt), criterion, or portal..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="serious">Serious</option>
              <option value="moderate">Moderate</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          {/* Principle Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedPrinciple}
              onChange={(e) => setSelectedPrinciple(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All POUR Pillars</option>
              <option value="Perceivable">Perceivable</option>
              <option value="Operable">Operable</option>
              <option value="Understandable">Understandable</option>
              <option value="Robust">Robust</option>
            </select>
          </div>

          {/* Effort Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedEffort}
              onChange={(e) => setSelectedEffort(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Effort Levels</option>
              <option value="quick">Quick Fix (&lt;15m)</option>
              <option value="moderate">Moderate (1-2h)</option>
              <option value="complex">Complex (Half-day+)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredRemediations.length}</strong> of{' '}
            {data?.totalRules || 0} remediation rules
          </span>
          {(searchTerm ||
            selectedSeverity !== 'all' ||
            selectedPrinciple !== 'all' ||
            selectedEffort !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSeverity('all');
                setSelectedPrinciple('all');
                setSelectedEffort('all');
              }}
              className="font-bold text-primary-600 hover:text-primary-800"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Remediations List */}
      <div className="space-y-4">
        {filteredRemediations.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-slate-200 bg-white/60">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Matching Remediation Rules Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search query or filters above.
            </p>
          </div>
        ) : (
          filteredRemediations.map((rule, idx) => {
            const isPortalsOpen = !!expandedPortals[rule.ruleId];

            return (
              <div
                key={rule.ruleId}
                className="glass-card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
              >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                          #{idx + 1}
                        </span>
                        <SeverityBadge severity={rule.severity} />
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          WCAG {rule.wcagCriterion} ({rule.wcagLevel || 'AA'})
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {rule.principle}
                        </span>
                        {rule.effort && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Clock size={11} /> {rule.effort}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {rule.wcagCriterionName}
                        <span className="text-xs font-mono font-normal text-slate-400 ml-2">
                          ({rule.ruleId})
                        </span>
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">{rule.description}</p>
                    </div>

                    {/* Quick Stats on Right */}
                    <div className="flex sm:flex-col lg:items-end justify-between sm:justify-start gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <div className="text-xs font-medium text-slate-500">Affected Portals</div>
                        <div className="text-lg font-black text-slate-900">
                          {rule.affectedPortalCount}{' '}
                          <span className="text-xs font-semibold text-slate-500">
                            ({rule.totalNodeCount} elements)
                          </span>
                        </div>
                      </div>

                      <a
                        href={rule.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-800"
                      >
                        <span>W3C Reference</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Impact Notice */}
                  {rule.userImpact && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Citizen Impact:</strong> {rule.userImpact}
                      </div>
                    </div>
                  )}
                </div>

                {/* Body: Remediation Guidance & Code Fix */}
                <div className="p-5 sm:p-6 bg-slate-50/50 space-y-4">
                  {/* Remediation Advice */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Engineering Action Item
                    </h4>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {rule.remediation ||
                        `Inspect and configure HTML elements to meet WCAG ${rule.wcagCriterion} conformance.`}
                    </p>
                  </div>

                  {/* Standardized Code Fix Box or Diff Viewer */}
                  {rule.htmlSnippet && rule.suggestedFixSnippet ? (
                    <BeforeAfterDiff 
                      ruleId={rule.ruleId}
                      brokenHtml={rule.htmlSnippet}
                      fixedHtml={rule.suggestedFixSnippet}
                      onCopy={() => handleCopyCode(rule.ruleId, rule.suggestedFixSnippet!)}
                      onDownload={() => handleDownloadPatch(rule)}
                      copied={copiedRuleId === rule.ruleId}
                    />
                  ) : rule.suggestedFixSnippet ? (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs mt-4">
                      <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wide flex items-center gap-2">
                          <code className="text-emerald-400 font-mono text-[11px]">
                            Standardized Accessible Fix
                          </code>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(rule.ruleId, rule.suggestedFixSnippet!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                            title="Copy accessible code to clipboard"
                          >
                            {copiedRuleId === rule.ruleId ? (
                              <>
                                <Check size={12} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Fix</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPatch(rule)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-900/80 hover:bg-indigo-900 text-xs font-semibold text-indigo-200 border border-indigo-700 transition-colors"
                            title="Download standard unified git diff"
                          >
                            <Download size={12} />
                            <span>Download .diff</span>
                          </button>
                        </div>
                      </div>

                      <pre className="p-4 text-xs font-mono text-slate-800 bg-slate-50 overflow-x-auto leading-relaxed border-t border-slate-200">
                        {rule.suggestedFixSnippet}
                      </pre>
                    </div>
                  ) : null}

                  {/* Affected Portals Toggle */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPortals((prev) => ({
                          ...prev,
                          [rule.ruleId]: !prev[rule.ruleId],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 focus:outline-none"
                    >
                      {isPortalsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>
                        {isPortalsOpen ? 'Hide' : 'View'} {rule.affectedPortalCount} Affected{' '}
                        {rule.affectedPortalCount === 1 ? 'Portal' : 'Portals'} ({rule.totalNodeCount}{' '}
                        elements)
                      </span>
                    </button>

                    {isPortalsOpen && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 animate-fadeIn">
                        {rule.affectedPortals.map((portal) => (
                          <div
                            key={portal.url}
                            className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                          >
                            <div className="truncate mr-2">
                              <div className="font-bold text-slate-800 truncate">
                                {portal.siteName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {portal.url.replace(/^https?:\/\//, '')}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] flex-shrink-0">
                              {portal.nodeCount} {portal.nodeCount === 1 ? 'node' : 'nodes'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
