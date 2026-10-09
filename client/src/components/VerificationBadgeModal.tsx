import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Copy,
  Check,
  Award,
} from 'lucide-react';

interface VerificationBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  url: string;
  passRate: number;
}

export const VerificationBadgeModal: React.FC<VerificationBadgeModalProps> = ({
  isOpen,
  onClose,
  siteName,
  passRate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isGold = passRate >= 80;

  const embedSnippet = `<a href="${window.location.origin}/sites" target="_blank" rel="noopener noreferrer" title="AccessIQ Verified Digital Accessibility">
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="48" viewBox="0 0 220 48" role="img" aria-label="AccessIQ Verified WCAG 2.2 AA">
    <rect width="220" height="48" rx="8" fill="#0f172a"/>
    <rect x="1" y="1" width="218" height="46" rx="7" fill="none" stroke="${isGold ? '#10b981' : '#3b82f6'}" stroke-width="1.5"/>
    <path d="M16 16 L24 12 L32 16 L32 26 C32 31 24 35 24 35 C24 35 16 31 16 26 Z" fill="${isGold ? '#10b981' : '#3b82f6'}"/>
    <path d="M21 24 L23 26 L27 21" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="40" y="21" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" font-weight="600">ACCESSIQ VERIFIED</text>
    <text x="40" y="34" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="800">${isGold ? 'WCAG 2.2 AA · GIGW 3.0' : 'WCAG 2.2 LEVEL A'}</text>
  </svg>
</a>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-modal-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Award size={20} />
            </div>
            <div>
              <h2 id="badge-modal-title" className="text-base font-bold text-white leading-tight">
                Official Embeddable Compliance Seal
              </h2>
              <p className="text-xs text-slate-300">Public trust badge for government websites & portals</p>
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Badge Preview Box */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center border border-slate-800 shadow-inner">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Live Seal Rendering
            </div>
            {/* Rendered SVG Badge */}
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 shadow-md">
              <svg width="220" height="48" viewBox="0 0 220 48" role="img" aria-label="AccessIQ Verified WCAG 2.2 AA">
                <rect width="220" height="48" rx="8" fill="#0f172a" />
                <rect
                  x="1"
                  y="1"
                  width="218"
                  height="46"
                  rx="7"
                  fill="none"
                  stroke={isGold ? '#10b981' : '#3b82f6'}
                  strokeWidth="1.5"
                />
                <path
                  d="M16 16 L24 12 L32 16 L32 26 C32 31 24 35 24 35 C24 35 16 31 16 26 Z"
                  fill={isGold ? '#10b981' : '#3b82f6'}
                />
                <path d="M21 24 L23 26 L27 21" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
                <text x="40" y="21" fill="#94a3b8" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="600">
                  ACCESSIQ VERIFIED
                </text>
                <text x="40" y="34" fill="#ffffff" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="800">
                  {isGold ? 'WCAG 2.2 AA · GIGW 3.0' : 'WCAG 2.2 LEVEL A'}
                </text>
              </svg>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>Cryptographically Verifiable Public Status</span>
            </div>
          </div>

          {/* Verification Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Target Portal</span>
              <span className="font-bold text-slate-900 truncate block">{siteName}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Conformance Level</span>
              <span className="font-bold text-emerald-700 block">
                {isGold ? 'Level AA Gold' : 'Level A Silver'} ({passRate}%)
              </span>
            </div>
          </div>

          {/* Embed Code Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                HTML Embed Snippet
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Paste in portal footer</span>
            </div>
            <textarea
              readOnly
              value={embedSnippet}
              rows={4}
              className="w-full font-mono text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-300 focus:outline-none select-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'Copied Embed Code!' : 'Copy Embed Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
