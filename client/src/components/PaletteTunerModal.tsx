import React, { useState } from 'react';
import { Palette, Check, Copy, Sparkles, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { PaletteTunerReport, api } from '../services/api';
import { useToast } from './Toast';

interface PaletteTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPairs?: Array<{ fg: string; bg: string; label?: string }>;
}

export const PaletteTunerModal: React.FC<PaletteTunerModalProps> = ({ isOpen, onClose, initialPairs }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<PaletteTunerReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Default pairs if none passed from target scan
  const defaultPairs = initialPairs && initialPairs.length > 0 ? initialPairs : [
    { fg: '#888888', bg: '#FFFFFF', label: 'secondary-text' },
    { fg: '#3B82F6', bg: '#EFF6FF', label: 'primary-button' },
    { fg: '#EAB308', bg: '#FFFFFF', label: 'warning-callout' },
    { fg: '#64748B', bg: '#F1F5F9', label: 'subtle-metadata' },
  ];

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.tunePalette(defaultPairs)
        .then((res) => setReport(res))
        .catch((err) => showToast(err.message || 'Failed to tune palette', 'error'))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCss = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.generatedCssVariables);
    setCopied(true);
    showToast('Accessible CSS Variables copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="palette-modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block align-bottom glass-panel rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full p-6 sm:p-8 border border-white/80">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-md">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <h3 id="palette-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Instant Accessible Palette Tuner
                </h3>
                <p className="text-xs text-slate-500 font-medium">Mathematical WCAG 2.2 Relative Luminance Auto-Corrector</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-slate-800">Calculating Minimal Luminance Shift...</p>
            </div>
          ) : !report ? (
            <div className="py-12 text-center text-slate-500 text-sm">Failed to generate palette tuning.</div>
          ) : (
            <div className="space-y-6 mt-5">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Color Contrast Auto-Remediations (WCAG Level AA 4.5:1)
                </span>

                <div className="space-y-2.5">
                  {report.contrastPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border border-slate-200 shadow-inner"
                          style={{ backgroundColor: pair.originalBackground, color: pair.originalForeground }}
                          title={`Original ratio: ${pair.originalRatio}:1`}
                        >
                          Aa
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-800 block">{pair.cssVariable}</span>
                          <span className="text-[11px] text-rose-600 font-semibold">
                            Failing: {pair.originalRatio}:1 ({pair.originalForeground})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <ArrowRight size={15} className="text-slate-400 hidden sm:block" />

                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border border-emerald-300 shadow-sm"
                            style={{ backgroundColor: pair.suggestedBackground, color: pair.suggestedForeground }}
                            title="Remediated compliant preview"
                          >
                            Aa
                          </div>
                          <div>
                            <span className="text-xs font-mono font-extrabold text-emerald-800 block">
                              {pair.suggestedForeground}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <ShieldCheck size={12} /> Passes 4.5:1 AA
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated CSS Variables Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Drop-in CSS Variables Patch
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCss}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-800"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Stylesheet'}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                  {report.generatedCssVariables}
                </pre>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCopyCss}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-amber-500/25 flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  <span>Copy Accessible CSS Patch</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
