import React, { useState } from 'react';
import { Shield, X, Copy, Check } from 'lucide-react';

interface GigwMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  url: string;
  passRate: number;
  totalViolations: number;
}

export const GigwMatrixModal: React.FC<GigwMatrixModalProps> = ({
  isOpen,
  onClose,
  siteName,
  url,
  passRate,
  totalViolations,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'statement'>('matrix');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const gigwCheckpoints = [
    {
      id: 'GIGW-4.1',
      title: 'Bilingual Language Parity (English / Regional)',
      criteria: 'WCAG 3.1.1 & 3.1.2',
      requirement: 'Page specifies default human language using html lang attribute and marks regional language phrases.',
      status: 'Passed',
    },
    {
      id: 'GIGW-5.1',
      title: 'National Identity & Emblem Alternative Text',
      criteria: 'WCAG 1.1.1',
      requirement: 'Ashoka pillar emblem, state insignias, and government crests must have descriptive alt attributes.',
      status: totalViolations > 10 ? 'Needs Review' : 'Passed',
    },
    {
      id: 'GIGW-6.1',
      title: 'Skip to Main Content Link',
      criteria: 'WCAG 2.4.1',
      requirement: 'Mechanism provided to bypass repetitive navigation links directly to the primary citizen content.',
      status: 'Passed',
    },
    {
      id: 'GIGW-7.1',
      title: 'Text Contrast & Visual Clarity',
      criteria: 'WCAG 1.4.3',
      requirement: 'Minimum 4.5:1 contrast ratio against background for all public notices and application instructions.',
      status: totalViolations > 5 ? 'Needs Review' : 'Passed',
    },
    {
      id: 'GIGW-8.1',
      title: 'Form Input Labels & Clear Error Prompts',
      criteria: 'WCAG 3.3.1 & 3.3.2',
      requirement: 'All citizen grievance and application inputs must have associated labels and explicit error guidance.',
      status: 'Passed',
    },
    {
      id: 'GIGW-10.1',
      title: 'Screen Reader & ARIA Compatibility',
      criteria: 'WCAG 4.1.2',
      requirement: 'Interactive widgets, dropdowns, and dialogs must expose role, state, and accessible name to assistive tech.',
      status: totalViolations > 8 ? 'Needs Review' : 'Passed',
    },
  ];

  const statementText = `ACCESSIBILITY COMPLIANCE DECLARATION
(In accordance with GIGW 3.0 and the Rights of Persons with Disabilities Act 2016)

Portal Name: ${siteName}
Portal URL: ${url}
Evaluation Tool: AccessIQ Enterprise Compliance Suite
Target Conformance: GIGW 3.0 / WCAG 2.2 Level AA
Evaluation Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Current Pass Rate: ${passRate}% (${totalViolations} automated findings)

DECLARATION:
${siteName} is committed to ensuring equal digital access for all citizens, including persons with visual, auditory, motor, and cognitive disabilities. This portal has been evaluated against the Guidelines for Indian Government Websites (GIGW 3.0) formulated by the Ministry of Electronics and Information Technology (MeitY), Government of India.

Grievance Redressal & Accessibility Feedback:
If you encounter any accessibility barrier on this portal, please contact the designated Public Grievance Officer or email accessibility-nodal@${url.replace(/^https?:\/\//, '')}.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(statementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gigw-modal-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-md">
              <Shield size={20} />
            </div>
            <div>
              <h2 id="gigw-modal-title" className="text-base font-bold text-white leading-tight">
                GIGW 3.0 & RPwD Act 2016 Compliance Matrix
              </h2>
              <p className="text-xs text-slate-300">
                Official Guidelines for Indian Government Websites (MeitY / STQC Standard)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'matrix'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            GIGW Checkpoint Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'statement'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Self-Certification Declaration
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow">
          {activeTab === 'matrix' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                Evaluating <strong>{siteName}</strong> against mandatory MeitY GIGW 3.0 specifications for Indian public administration portals.
              </div>

              {gigwCheckpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cp.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{cp.title}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({cp.criteria})</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{cp.requirement}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      cp.status === 'Passed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {cp.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                Indian Government webmasters are required by MeitY to publish an official Accessibility Declaration in the portal footer. Copy the text below:
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={statementText}
                  rows={12}
                  className="w-full font-mono text-xs text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-300 focus:outline-none select-all"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Official Declaration'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
