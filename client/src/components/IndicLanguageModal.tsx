import React, { useState, useEffect } from 'react';
import { Languages, CheckCircle2, AlertTriangle, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { IndicLanguageReport, api } from '../services/api';
import { useToast } from './Toast';

interface IndicLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
}

export const IndicLanguageModal: React.FC<IndicLanguageModalProps> = ({ isOpen, onClose, targetUrl }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IndicLanguageReport | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.checkIndicCompliance(targetUrl);
      setReport(res);
    } catch (err: any) {
      showToast(err.message || 'Indic language audit failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="indic-modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block align-bottom glass-panel rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full p-6 sm:p-8 border border-white/80">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-md">
                <Languages className="h-6 w-6" />
              </div>
              <div>
                <h3 id="indic-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  GIGW 3.0 Indic & Kannada Accessibility Health
                </h3>
                <p className="text-xs text-slate-500 font-medium">Unicode Integrity, Legacy Font Detection, & Bilingual Parity</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Re-run check"
              >
                <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-slate-800">Inspecting Regional Unicode Scripts & Font Families...</p>
            </div>
          ) : !report ? (
            <div className="py-12 text-center text-slate-500 text-sm">No Indic language report available.</div>
          ) : (
            <div className="space-y-6 mt-5">
              {/* Score Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Unicode Compliance
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-amber-950">{report.unicodeComplianceScore}%</span>
                    <span className="text-xs font-semibold text-amber-800">
                      {report.legacyAsciiFontDetected ? '⚠️ Legacy Fonts' : '✓ Modern Unicode'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                  <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                    Bilingual Parity
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-red-950">{report.bilingualParityScore}%</span>
                    <span className="text-xs font-semibold text-red-800">
                      GIGW 3.0 Mandate
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Languages */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Detected Linguistic Scripts
                </span>
                <div className="space-y-2">
                  {report.detectedLanguages.map((lang, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 font-bold flex items-center justify-center text-slate-700 font-mono">
                          {lang.code.toUpperCase()}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{lang.name}</span>
                          <span className="text-[11px] text-slate-500 italic truncate max-w-xs block">
                            "{lang.textSample}"
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 ${
                        lang.hasProperLangAttribute
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lang.hasProperLangAttribute ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        {lang.hasProperLangAttribute ? 'Proper lang Tag' : 'Missing lang Tag'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  GovTech GIGW 3.0 Directives
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <ShieldCheck size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
