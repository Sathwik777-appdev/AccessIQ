import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, Sparkles, Loader2, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface QuickAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: 'National Portal of India', url: 'https://india.gov.in' },
  { label: 'Digital India', url: 'https://digitalindia.gov.in' },
  { label: 'MyGov India', url: 'https://www.mygov.in' },
  { label: 'W3C Accessibility Demo', url: 'https://www.w3.org/WAI/demos/bad/' },
];

export const QuickAuditModal: React.FC<QuickAuditModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (loading) {
      const startTime = Date.now();
      timer = setInterval(() => {
        setElapsedSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQuickAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      setLoading(true);

      const res = await api.quickScan(url, siteName);

      if (res.error) {
        showToast(`Audit finished with notice: ${res.error}`, 'warning');
      } else {
        showToast(
          `Scan complete: ${res.totalViolations} violations found (${(res.scanDurationMs / 1000).toFixed(1)}s)`,
          res.totalViolations === 0 ? 'success' : 'info'
        );
      }
      onClose();
      navigate(`/sites/${res.targetId}`);
    } catch (err: any) {
      showToast(err.message || 'Audit failed. Check URL accessibility.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="quick-audit-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
          onClick={() => !loading && onClose()}
        ></div>

        <div className="relative inline-block align-bottom glass-panel rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full p-6 sm:p-8 border border-white/80">
          {/* Ambient Glows */}
          <div className="ambient-glow w-48 h-48 bg-primary-400 -top-10 -left-10 opacity-30"></div>
          <div className="ambient-glow w-48 h-48 bg-emerald-400 -bottom-10 -right-10 opacity-20"></div>

          {/* Animated Scanning Laser Line during audit */}
          {loading && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              <div className="animate-scan-laser h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute w-full shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
            </div>
          )}

          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-md border border-white/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 id="quick-audit-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Instant Accessibility Audit
                </h3>
                <p className="text-xs text-slate-500 font-medium">Headless Chromium scan against WCAG 2.2 Level AA & GIGW 3.0</p>
              </div>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {!loading ? (
            <form onSubmit={handleQuickAudit} className="relative z-10 space-y-4 mt-5">
              <div>
                <label htmlFor="audit-url" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Portal URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Globe size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="url"
                    id="audit-url"
                    required
                    placeholder="https://services.gov.in"
                    className="glass-input block w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 text-slate-900"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="audit-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Portal Title / Agency (Optional)
                </label>
                <input
                  type="text"
                  id="audit-name"
                  placeholder="e.g. National Services Portal"
                  className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 text-slate-900"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              {/* Quick Presets */}
              <div className="pt-1">
                <span className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Demo & Benchmark Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setUrl(preset.url);
                        setSiteName(preset.label);
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white border border-slate-200 text-slate-700 hover:text-primary-700 hover:border-primary-300 font-semibold shadow-sm transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <Shield size={13} className="text-primary-500" /> Powered by Playwright + axe-core
                </span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white/60 hover:bg-white border border-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-primary-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <span>Launch Audit</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="relative z-10 py-8 text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 mx-auto animate-pulse">
                  <Globe className="h-8 w-8" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-1">Auditing Digital Portal</h4>
                <p className="text-xs font-mono text-slate-500 truncate max-w-sm mx-auto px-4 py-1 rounded-full bg-slate-100 border border-slate-200">{url}</p>
              </div>

              {/* Live Telemetry Display */}
              <div className="max-w-md mx-auto text-center space-y-3.5 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white/90 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-primary-600 font-mono text-sm font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span>Scanning Duration: {elapsedSeconds}s</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Headless Playwright Chromium is navigating to the portal, awaiting DOM network idle, and executing 50+ WCAG 2.2 / GIGW 3.0 rules via axe-core.
                </p>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div className="bg-gradient-to-r from-primary-500 via-indigo-500 to-emerald-500 h-full rounded-full animate-pulse w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
