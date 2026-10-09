import React, { useState } from 'react';
import { Keyboard, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, X, Crosshair } from 'lucide-react';
import { KeyboardAuditReport } from '../services/api';

interface KeyboardFocusVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: KeyboardAuditReport | null;
  loading: boolean;
  onRefresh: () => void;
  targetUrl: string;
}

export const KeyboardFocusVisualizerModal: React.FC<KeyboardFocusVisualizerModalProps> = ({
  isOpen,
  onClose,
  report,
  loading,
  onRefresh,
  targetUrl,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = report?.traversedSteps[currentStepIndex];
  const totalSteps = report?.traversedSteps.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="keyboard-modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block align-bottom glass-panel rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full p-6 sm:p-8 border border-white/80">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                <Keyboard className="h-6 w-6" />
              </div>
              <div>
                <h3 id="keyboard-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Interactive Keyboard Traversal Tracer
                </h3>
                <p className="text-xs font-mono text-slate-500 truncate max-w-md">{targetUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Re-run physical keyboard trace"
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
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto"></div>
              <h4 className="text-base font-bold text-slate-900">Physically Tabbing Through Portal DOM...</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Playwright is pressing the Tab key sequentially, inspecting computed outline styles, bounding coordinates, and testing for focus traps.
              </p>
            </div>
          ) : !report || report.traversedSteps.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No interactive focus steps captured.</p>
              <button
                type="button"
                onClick={onRefresh}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Run Keyboard Trace
              </button>
            </div>
          ) : (
            <div className="space-y-6 mt-5">
              {/* Score and Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/70">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Tab Score</span>
                  <span className="text-2xl font-black text-indigo-950">{report.tabNavigationScore}/100</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Steps</span>
                  <span className="text-2xl font-black text-slate-900">{report.traversedSteps.length}</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${
                  report.missingFocusIndicatorCount > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Missing Outlines</span>
                  <span className="text-2xl font-black">{report.missingFocusIndicatorCount}</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${
                  report.keyboardTrapDetected
                    ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Keyboard Traps</span>
                  <span className="text-2xl font-black">{report.keyboardTrapDetected ? 'TRAP DETECTED' : 'None'}</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                report.keyboardTrapDetected
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : report.missingFocusIndicatorCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {report.keyboardTrapDetected ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                ) : report.missingFocusIndicatorCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <span className="font-bold block text-sm mb-0.5">
                    {report.keyboardTrapDetected ? 'WCAG 2.1.2 Trap Warning' : 'Navigation Verdict'}
                  </span>
                  {report.summary}
                </div>
              </div>

              {/* Interactive Step Explorer Player */}
              {currentStep && (
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold">
                        Tab #{currentStep.step} of {totalSteps}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {currentStep.tagName} &bull; {currentStep.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentStepIndex === 0}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1"
                      >
                        <ArrowLeft size={13} /> Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                        disabled={currentStepIndex === totalSteps - 1}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white disabled:opacity-30 flex items-center gap-1"
                      >
                        Next <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Accessible Name / Text
                      </span>
                      <p className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 truncate">
                        {currentStep.accessibleName || <span className="italic text-slate-400">No text / Empty label</span>}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        DOM Selector
                      </span>
                      <p className="font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 truncate">
                        {currentStep.selector}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      currentStep.hasVisibleOutline
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentStep.hasVisibleOutline ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {currentStep.hasVisibleOutline ? 'Perceptible Focus Ring' : 'Missing Visible Focus Outline (WCAG 2.4.7)'}
                    </span>

                    {currentStep.boundingBox && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px]">
                        <Crosshair size={12} />
                        X: {currentStep.boundingBox.x}, Y: {currentStep.boundingBox.y} ({currentStep.boundingBox.width}x{currentStep.boundingBox.height}px)
                      </span>
                    )}

                    {currentStep.isKeyboardTrapCandidate && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold animate-pulse">
                        <ShieldAlert size={13} /> Potential Keyboard Trap
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
