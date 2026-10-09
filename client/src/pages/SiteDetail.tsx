import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Printer, ArrowLeft, Loader2, AlertCircle, Layers, FileText, Shield, Award, Play, AlertTriangle, Keyboard, Palette, Network, Languages } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { api, ScanResultDetail, ScanTargetDetail, KeyboardAuditReport } from '../services/api';
import { ViolationCard } from '../components/ViolationCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { AuditCrystal3D } from '../components/three/AuditCrystal3D';
import { GigwMatrixModal } from '../components/GigwMatrixModal';
import { VerificationBadgeModal } from '../components/VerificationBadgeModal';
import { KeyboardFocusVisualizerModal } from '../components/KeyboardFocusVisualizerModal';
import { PaletteTunerModal } from '../components/PaletteTunerModal';
import { DomainCrawlModal } from '../components/DomainCrawlModal';
import { IndicLanguageModal } from '../components/IndicLanguageModal';
import { useToast } from '../components/Toast';

export const SiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultDetail | null>(null);
  const [targetDetail, setTargetDetail] = useState<ScanTargetDetail | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [principleFilter, setPrincipleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [gigwModalOpen, setGigwModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);

  // Advanced Audit Suite States
  const [keyboardModalOpen, setKeyboardModalOpen] = useState(false);
  const [keyboardReport, setKeyboardReport] = useState<KeyboardAuditReport | null>(null);
  const [keyboardLoading, setKeyboardLoading] = useState(false);
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [crawlModalOpen, setCrawlModalOpen] = useState(false);
  const [indicModalOpen, setIndicModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const target = await api.fetchTarget(id!);
      setTargetDetail(target);
      setTargetName(target.siteName);
      setTargetUrl(target.url);

      if (target.lastScanId) {
        const detail = await api.fetchScanResult(target.lastScanId);
        setScanResult(detail);
      } else {
        setScanResult(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const handleTriggerScan = async () => {
    if (!id || isScanning) return;
    try {
      setIsScanning(true);
      showToast('Launching headless Playwright Chromium scan on target...', 'info');
      const { jobId } = await api.triggerScan(id);

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.pollScanStatus(jobId);
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setIsScanning(false);
            showToast('Audit complete! Results updated with fresh scan.', 'success');
            await fetchDetail();
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsScanning(false);
            showToast(status.error || 'Audit scan failed. Check engine connectivity.', 'error');
            await fetchDetail();
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setIsScanning(false);
          showToast(pollErr.message || 'Error checking audit status', 'error');
        }
      }, 2000);
    } catch (err: any) {
      setIsScanning(false);
      showToast(err.message || 'Failed to trigger audit scan', 'error');
    }
  };

  const handleOpenKeyboardAudit = async () => {
    setKeyboardModalOpen(true);
    if (!keyboardReport && targetUrl) {
      try {
        setKeyboardLoading(true);
        const rep = await api.runKeyboardAudit(targetUrl);
        setKeyboardReport(rep);
      } catch (err: any) {
        showToast(err.message || 'Keyboard trace failed', 'error');
      } finally {
        setKeyboardLoading(false);
      }
    }
  };

  const handleRefreshKeyboard = async () => {
    if (!targetUrl) return;
    try {
      setKeyboardLoading(true);
      const rep = await api.runKeyboardAudit(targetUrl);
      setKeyboardReport(rep);
      showToast('Keyboard focus traversal refreshed!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Keyboard trace failed', 'error');
    } finally {
      setKeyboardLoading(false);
    }
  };

  const filteredViolations = useMemo(() => {
    return (
      scanResult?.violations.filter((v) => {
        const matchesSev = severityFilter ? v.severity === severityFilter : true;
        const matchesPrinciple = principleFilter ? v.principle === principleFilter : true;
        const matchesSearch =
          v.ruleId.toLowerCase().includes(searchFilter.toLowerCase()) ||
          v.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (v.wcagCriterion && v.wcagCriterion.includes(searchFilter));
        return matchesSev && matchesPrinciple && matchesSearch;
      }) || []
    );
  }, [scanResult, severityFilter, principleFilter, searchFilter]);

  const handleExportCsv = () => {
    if (!scanResult) return;
    const headers = ['Rule ID', 'Severity', 'Principle', 'WCAG Criterion', 'GIGW Checkpoint', 'Affected Elements', 'Selector', 'Description'];
    const rows = scanResult.violations.map((v) => [
      v.ruleId,
      v.severity,
      v.principle || '',
      v.wcagCriterion,
      v.gigwCheckpoint || '',
      v.nodeCount || 1,
      `"${(v.selector || '').replace(/"/g, '""')}"`,
      `"${(v.description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessiq-audit-${scanResult.siteName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary-600 w-8 h-8 mb-2" />
        <p className="text-sm text-gray-500">Loading audit details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Group by principle
  const principles = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
  const violationsByPrinciple = principles.map((p) => ({
    principle: p,
    violations: filteredViolations.filter((v) => (v.principle || 'Robust') === p),
  }));

  const isFailedScan = Boolean(scanResult?.error && scanResult?.totalViolations === 0);
  const passRate = scanResult && !isFailedScan
    ? Math.max(0, Math.round(((50 - scanResult.totalViolations) / 50) * 100))
    : 0;

  const letterGrade: 'A+' | 'A' | 'B' | 'C' | 'F' | 'N/A' =
    isFailedScan ? 'N/A' :
    passRate >= 95 ? 'A+' :
    passRate >= 85 ? 'A' :
    passRate >= 70 ? 'B' :
    passRate >= 50 ? 'C' : 'F';

  // Historical trend data from authentic scans
  const trendData = (targetDetail?.scans || []).map((s, idx) => {
    const scanDate = new Date(s.timestamp);
    const dateLabel = scanDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    return {
      scan: (targetDetail?.scans.length || 0) <= 1 ? `Audit #1 (${dateLabel})` : `${dateLabel} (#${idx + 1})`,
      violations: s.totalViolations,
      passRate: s.passRate,
      date: scanDate.toLocaleDateString(),
      time: scanDate.toLocaleTimeString(),
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link to="/sites" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800">
        <ArrowLeft size={16} className="mr-1" /> Back to Sites
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          {scanResult && !isFailedScan && (
            <div className="hidden sm:block flex-shrink-0">
              <AuditCrystal3D grade={letterGrade === 'N/A' ? 'F' : letterGrade} healthScore={passRate} size={92} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{targetName || 'Site Detail'}</h1>
              {scanResult && (
                <span className={`sm:hidden text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isFailedScan ? 'bg-amber-100 text-amber-800' : 'bg-primary-100 text-primary-800'
                }`}>
                  {isFailedScan ? 'Scan Incomplete' : `Grade ${letterGrade}`}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-600 truncate max-w-lg">{targetUrl}</p>
            {scanResult && (
              <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-2">
                <span>Last audited: {new Date(scanResult.timestamp).toLocaleString()}</span>
                <span>•</span>
                <span>Duration: {(scanResult.scanDurationMs / 1000).toFixed(1)}s</span>
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2.5 items-center">
          <button
            type="button"
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Auditing...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2 fill-current" /> {scanResult ? 'Re-run Audit' : 'Scan Now'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setGigwModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 border border-indigo-200 shadow-sm text-sm font-semibold rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
            disabled={!scanResult}
          >
            <Shield size={16} className="mr-2 text-indigo-600" /> GIGW 3.0 Matrix
          </button>
          <button
            type="button"
            onClick={() => setBadgeModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 border border-emerald-200 shadow-sm text-sm font-semibold rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-500 transition-colors"
            disabled={!scanResult}
          >
            <Award size={16} className="mr-2 text-emerald-600" /> Verified Seal
          </button>
          <Link
            to={`/sites/${id}/report`}
            className="inline-flex items-center px-3.5 py-2 border border-primary-300 shadow-sm text-sm font-semibold rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <FileText size={16} className="mr-2 text-primary-600" /> Executive Report
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
            disabled={!scanResult}
          >
            <Printer size={16} className="mr-2 text-gray-500" /> Print
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center px-3.5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 focus:ring-2 focus:ring-slate-500"
            disabled={!scanResult}
          >
            <Download size={16} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* GovTech Advanced Compliance Suite Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-100/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              GovTech Advanced Compliance Suite
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GIGW 3.0 / WCAG 2.2
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Interactive physical keyboard tab tracer, multi-page domain spider, contrast palette tuner, and Indic script health.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenKeyboardAudit}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-[1.02]"
          >
            <Keyboard size={14} className="text-indigo-400" />
            <span>Keyboard Tracer</span>
          </button>

          <button
            type="button"
            onClick={() => setCrawlModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-[1.02]"
          >
            <Network size={14} className="text-emerald-400" />
            <span>Domain Spider</span>
          </button>

          <button
            type="button"
            onClick={() => setPaletteModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-[1.02]"
          >
            <Palette size={14} className="text-amber-400" />
            <span>Palette Tuner</span>
          </button>

          <button
            type="button"
            onClick={() => setIndicModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-[1.02]"
          >
            <Languages size={14} className="text-red-400" />
            <span>Indic & Kannada</span>
          </button>
        </div>
      </div>

      {/* Engine Diagnostic Error Banner */}
      {scanResult?.error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-amber-900 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-950">Audit Engine Diagnostics Notice</h4>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                Engine Warning
              </span>
            </div>
            <p className="text-xs font-mono text-amber-900 mt-1 whitespace-pre-wrap break-all bg-amber-100/60 p-2.5 rounded-xl border border-amber-300/40">
              {scanResult.error}
            </p>
            {isFailedScan && (
              <p className="text-xs text-amber-800 mt-2 font-medium">
                Zero violations are recorded because the automated Playwright/axe-core engine encountered an execution error before DOM evaluation could complete. Click <strong>"Re-run Audit"</strong> above to retry.
              </p>
            )}
          </div>
        </div>
      )}

      {!scanResult ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No Scans Recorded</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto mb-6">
            This target has not been audited yet. Launch a headless Chromium audit to evaluate WCAG 2.2 and GIGW 3.0 compliance.
          </p>
          <button
            type="button"
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-md text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Auditing...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2 fill-current" /> Run First Audit
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Stats & Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 glass-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Violation Breakdown</h3>
              <div className="flex items-baseline mb-6 pb-4 border-b border-slate-100">
                {isFailedScan ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg font-black text-amber-800">Scan Incomplete</span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20">
                      Engine Interrupted
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-4xl font-black text-slate-900">{scanResult.totalViolations}</span>
                    <span className="ml-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">violations</span>
                    <span className="ml-auto text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                      {passRate}% Pass Rate
                    </span>
                  </>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <SeverityBadge severity="critical" />
                  <span className="font-extrabold text-red-700">{scanResult.violationsBySeverity.critical}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <SeverityBadge severity="serious" />
                  <span className="font-extrabold text-orange-700">{scanResult.violationsBySeverity.serious}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <SeverityBadge severity="moderate" />
                  <span className="font-extrabold text-amber-700">{scanResult.violationsBySeverity.moderate}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <SeverityBadge severity="minor" />
                  <span className="font-extrabold text-blue-700">{scanResult.violationsBySeverity.minor}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Compliance Trend Over Time</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {trendData.length > 1
                      ? `Tracking ${trendData.length} recorded compliance audits`
                      : 'Initial baseline audit recorded'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Violations</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Pass Rate %</span>
                  </div>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 12, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <filter id="trend-glow-red" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ef4444" floodOpacity="0.2" />
                      </filter>
                      <filter id="trend-glow-green" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#10b981" floodOpacity="0.2" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.8} />
                    <XAxis dataKey="scan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 text-white p-3 rounded-xl shadow-xl text-xs">
                              <div className="font-bold text-slate-200 mb-1.5 pb-1 border-b border-slate-800">
                                {label}
                              </div>
                              <div className="space-y-1">
                                {payload.map((entry: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      {entry.name}:
                                    </span>
                                    <span className="font-bold font-mono text-white">
                                      {entry.value}
                                      {entry.dataKey === 'passRate' ? '%' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="violations"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#ffffff', stroke: '#ef4444', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
                      name="Violations"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="passRate"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                      name="Pass Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Filters & Explorer */}
          <div className="glass-card rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Violation Explorer</h3>
                <p className="text-xs text-slate-600">Showing {filteredViolations.length} of {scanResult.violations.length} automated rule findings</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Filter by rule, description, or WCAG..."
                  className="glass-input px-3.5 py-1.5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  aria-label="Filter violations by keyword"
                />
                <select
                  className="glass-input px-3 py-1.5 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-primary-500 text-slate-700 font-medium"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  aria-label="Filter by severity"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="serious">Serious</option>
                  <option value="moderate">Moderate</option>
                  <option value="minor">Minor</option>
                </select>
                <select
                  className="glass-input px-3 py-1.5 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-primary-500 text-slate-700 font-medium"
                  value={principleFilter}
                  onChange={(e) => setPrincipleFilter(e.target.value)}
                  aria-label="Filter by WCAG principle"
                >
                  <option value="">All Principles</option>
                  <option value="Perceivable">Perceivable</option>
                  <option value="Operable">Operable</option>
                  <option value="Understandable">Understandable</option>
                  <option value="Robust">Robust</option>
                </select>
              </div>
            </div>

            {/* Grouped by Principle */}
            <div className="space-y-6">
              {violationsByPrinciple.map((group) => {
                if (group.violations.length === 0) return null;
                return (
                  <div key={group.principle} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-4 w-4 text-primary-600" />
                      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                        {group.principle} ({group.violations.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {group.violations.map((v) => (
                        <ViolationCard key={v.id} violation={v} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredViolations.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  {scanResult.violations.length === 0
                    ? '🎉 Outstanding! Zero accessibility violations were detected for this site.'
                    : 'No violations match your current filters.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {scanResult && (
        <>
          <GigwMatrixModal
            isOpen={gigwModalOpen}
            onClose={() => setGigwModalOpen(false)}
            siteName={targetName}
            url={targetUrl}
            passRate={passRate}
            totalViolations={scanResult.totalViolations}
          />
          <VerificationBadgeModal
            isOpen={badgeModalOpen}
            onClose={() => setBadgeModalOpen(false)}
            siteName={targetName}
            url={targetUrl}
            passRate={passRate}
          />
        </>
      )}

      {/* Advanced GovTech Compliance Modals */}
      <KeyboardFocusVisualizerModal
        isOpen={keyboardModalOpen}
        onClose={() => setKeyboardModalOpen(false)}
        report={keyboardReport}
        loading={keyboardLoading}
        onRefresh={handleRefreshKeyboard}
        targetUrl={targetUrl}
      />

      <DomainCrawlModal
        isOpen={crawlModalOpen}
        onClose={() => setCrawlModalOpen(false)}
        rootUrl={targetUrl}
      />

      <PaletteTunerModal
        isOpen={paletteModalOpen}
        onClose={() => setPaletteModalOpen(false)}
      />

      <IndicLanguageModal
        isOpen={indicModalOpen}
        onClose={() => setIndicModalOpen(false)}
        targetUrl={targetUrl}
      />
    </div>
  );
};

export default SiteDetail;
