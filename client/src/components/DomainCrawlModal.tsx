import React, { useState } from 'react';
import { Network, Globe, RefreshCw, X } from 'lucide-react';
import { DomainCrawlReport, api } from '../services/api';
import { useToast } from './Toast';

interface DomainCrawlModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootUrl: string;
}

export const DomainCrawlModal: React.FC<DomainCrawlModalProps> = ({ isOpen, onClose, rootUrl }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maxPages, setMaxPages] = useState<number>(5);
  const [report, setReport] = useState<DomainCrawlReport | null>(null);

  if (!isOpen) return null;

  const handleStartCrawl = async () => {
    try {
      setLoading(true);
      showToast(`Initiating deep domain crawler across internal links (max ${maxPages} pages)...`, 'info');
      const res = await api.runDomainCrawl(rootUrl, maxPages);
      setReport(res);
      showToast(`Domain crawl complete! Analyzed ${res.totalPagesScanned} subpages.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Domain crawler failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="crawl-modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" onClick={() => !loading && onClose()}></div>

        <div className="relative inline-block align-bottom glass-panel rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full p-6 sm:p-8 border border-white/80">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Network className="h-6 w-6" />
              </div>
              <div>
                <h3 id="crawl-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Multi-Page Domain Spider Audit
                </h3>
                <p className="text-xs font-mono text-slate-500 truncate max-w-md">{rootUrl}</p>
              </div>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {!report && !loading ? (
            <div className="py-8 space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs leading-relaxed">
                <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  <Globe size={15} className="text-emerald-700" />
                  Site-Wide Accessibility Verification
                </h4>
                Real government portals contain vital citizen subpages (e.g. applications, grievances, fee payments). The domain spider discovers and scans internal links, creating a comprehensive institutional health audit.
              </div>

              <div className="flex items-center gap-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pages to Crawl:
                </label>
                <div className="flex gap-2">
                  {[3, 5, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxPages(num)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        maxPages === num
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {num} Pages
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartCrawl}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/25 flex items-center gap-2"
                >
                  <Network size={16} />
                  <span>Launch Domain Audit</span>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto"></div>
              <h4 className="text-base font-black text-slate-900">Crawling Portal Subpages...</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Discovering internal same-origin routes, loading DOMs in Playwright, and running full WCAG 2.2 evaluations on each subpage.
              </p>
            </div>
          ) : report ? (
            <div className="space-y-6 mt-5">
              {/* Domain Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Avg Pass Rate</span>
                  <span className="text-2xl font-black text-emerald-950">{report.averagePassRate}%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pages Audited</span>
                  <span className="text-2xl font-black text-slate-900">{report.totalPagesScanned}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Total Violations</span>
                  <span className="text-2xl font-black text-red-900">{report.totalDomainViolations}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200">
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">Critical / Serious</span>
                  <span className="text-2xl font-black text-orange-950">{report.criticalTotal + report.seriousTotal}</span>
                </div>
              </div>

              {/* Subpages Breakdown Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Audited Portal Routes
                </span>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-3.5 py-2.5 text-left">Route / Title</th>
                        <th className="px-3 py-2.5 text-center">Depth</th>
                        <th className="px-3 py-2.5 text-center">Pass Rate</th>
                        <th className="px-3 py-2.5 text-center">Violations</th>
                        <th className="px-3 py-2.5 text-center">Critical</th>
                        <th className="px-3 py-2.5 text-right">Audit Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {report.pages.map((page, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3.5 py-2.5 max-w-xs truncate font-medium text-slate-900">
                            <span className="block font-bold truncate">{page.title}</span>
                            <span className="text-[10px] font-mono text-slate-400 truncate block">{page.url}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-600">L{page.depth}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              page.passRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {page.passRate}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-800">{page.totalViolations}</td>
                          <td className="px-3 py-2.5 text-center font-extrabold text-red-600">{page.criticalCount}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-500">{(page.scanDurationMs / 1000).toFixed(1)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recurring Violations Across Domain */}
              {report.topRecurringViolations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Top Recurring Domain Barriers
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {report.topRecurringViolations.map((rule, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-slate-900">{rule.ruleId}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                            {rule.affectedPagesCount} pages affected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleStartCrawl}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Re-run Domain Crawl
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
