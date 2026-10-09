import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  Wrench,
  Users,
  CheckCircle2,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import { sanitizeUrl } from '../lib/sanitize-url';

export interface ViolationData {
  id: string;
  ruleId: string;
  description: string;
  help?: string;
  helpUrl: string;
  severity: string;
  selector: string;
  htmlSnippet: string;
  nodeCount: number;
  wcagCriterion: string;
  wcagCriterionName?: string;
  gigwCheckpoint?: string | null;
  principle?: string;
  remediation?: string | null;
  suggestedFixSnippet?: string | null;
  userImpact?: string | null;
  effort?: string | null;
  wcagLevel?: string | null;
}

interface ViolationCardProps {
  violation: ViolationData;
}

export const ViolationCard: React.FC<ViolationCardProps> = ({ violation }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'fix' | 'impact' | 'element'>('fix');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mb-3.5 transition-all">
      {/* Header Button */}
      <button
        type="button"
        className="w-full px-5 py-3.5 flex items-center justify-between bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center space-x-3.5 flex-grow pr-4 overflow-hidden">
          <div className="flex-shrink-0 w-6 flex justify-center text-gray-400">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <div className="flex-shrink-0">
            <SeverityBadge severity={violation.severity} />
          </div>
          <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 flex-shrink-0">
            {violation.ruleId}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">
            {violation.wcagCriterionName || violation.description}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {violation.effort && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              <Clock size={12} /> {violation.effort}
            </span>
          )}
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
            <Code2 size={14} />
            {violation.nodeCount || 1} node{(violation.nodeCount || 1) !== 1 ? 's' : ''}
          </div>
        </div>
      </button>

      {/* Expanded Accordion Panel */}
      {expanded && (
        <div className="border-t border-gray-200 bg-slate-50/60 p-5 space-y-4">
          {/* Rule Description & Standards Meta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">{violation.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {violation.wcagCriterion && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    WCAG {violation.wcagCriterion} (Level {violation.wcagLevel || 'AA'})
                  </span>
                )}
                {violation.gigwCheckpoint && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    GIGW 3.0 Checkpoint {violation.gigwCheckpoint}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  {violation.principle || 'Accessibility'}
                </span>
              </div>
            </div>

            <a
              href={sanitizeUrl(violation.helpUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors flex-shrink-0"
            >
              W3C / Deque Docs <ExternalLink size={12} />
            </a>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4" aria-label="Violation details tabs">
              <button
                type="button"
                onClick={() => setActiveTab('fix')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'fix'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench size={14} /> How to Remediate
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('impact')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'impact'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={14} /> Disability Impact
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('element')}
                className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'element'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 size={14} /> Failing Code
              </button>
            </nav>
          </div>

          {/* Tab 1: How to Fix */}
          {activeTab === 'fix' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" /> Remediation Recommendation
              </h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                {violation.remediation || `Ensure elements satisfy WCAG ${violation.wcagCriterion} specifications.`}
              </p>

              {violation.suggestedFixSnippet && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                    <span className="font-bold text-slate-700">Standardized Accessible Code Fix:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const diffContent = `--- a/index.html\n+++ b/index.html\n@@ -1,3 +1,3 @@\n-${violation.htmlSnippet || '<!-- Failing node -->'}\n+${violation.suggestedFixSnippet}\n`;
                          const blob = new Blob([diffContent], { type: 'text/x-diff;charset=utf-8;' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `accessiq-patch-${violation.ruleId}.diff`;
                          a.click();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded transition-colors"
                        title="Download standard unified diff for git apply"
                      >
                        <Code2 size={12} /> Download Git Patch (.diff)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(violation.suggestedFixSnippet!)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded transition-colors"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
                    <code>{violation.suggestedFixSnippet}</code>
                  </pre>
                  <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Engineering Rationale:</span> This replacement resolves accessibility barrier by providing compliant semantics and labeling according to <strong>GIGW Checkpoint {violation.gigwCheckpoint || '2.1'}</strong> and <strong>WCAG {violation.wcagCriterion}</strong>.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Disability Impact */}
          {activeTab === 'impact' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users size={15} className="text-primary-600" /> Real-World User Impact
              </h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                {violation.userImpact ||
                  'Citizens with visual, motor, or cognitive impairments may face critical blockers when attempting to navigate or complete forms on this government service.'}
              </p>
            </div>
          )}

          {/* Tab 3: Failing Element */}
          {activeTab === 'element' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Target CSS Selector:
                </span>
                <code className="text-xs text-rose-700 font-mono bg-rose-50 border border-rose-200 px-2 py-1 rounded block break-all">
                  {violation.selector || 'unknown'}
                </code>
              </div>

              {violation.htmlSnippet && (
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Failing HTML DOM Node:
                  </span>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    <code>{violation.htmlSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
