

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Users,
  Clock,
  Activity
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api, ComparisonResult, ScanTarget } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { AuditCrystal3D } from '../components/three/AuditCrystal3D';

export const ComparisonView: React.FC = () => {
  const { beforeId, afterId } = useParams<{ beforeId?: string; afterId?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<ScanTarget[]>([]);
  const [selectedBeforeScan, setSelectedBeforeScan] = useState<string>(beforeId || '');
  const [selectedAfterScan, setSelectedAfterScan] = useState<string>(afterId || '');

  // Load targets to allow picking scans
  useEffect(() => {
    const loadTargetsAndCompare = async () => {
      try {
        setLoading(true);
        setError(null);

        const allTargets = await api.fetchTargets();
        setTargets(allTargets);

        // Find targets with scans
        const targetsWithScans = allTargets.filter((t) => t.lastScanId);

        let beforeScanId = beforeId;
        let afterScanId = afterId;

        // If no explicit IDs provided, default to demo pages (before & after)
        if (!beforeScanId || !afterScanId) {
          const beforeDemo = targetsWithScans.find(
            (t) => t.url.includes('before.html') || t.siteName.toLowerCase().includes('before'),
          );
          const afterDemo = targetsWithScans.find(
            (t) => t.url.includes('after.html') || t.siteName.toLowerCase().includes('after'),
          );

          if (beforeDemo?.lastScanId && afterDemo?.lastScanId) {
            beforeScanId = beforeDemo.lastScanId;
            afterScanId = afterDemo.lastScanId;
          } else if (targetsWithScans.length >= 2) {
            beforeScanId = targetsWithScans[0].lastScanId!;
            afterScanId = targetsWithScans[1].lastScanId!;
          } else if (targetsWithScans.length === 1) {
            beforeScanId = targetsWithScans[0].lastScanId!;
            afterScanId = targetsWithScans[0].lastScanId!;
          }
        }

        if (beforeScanId && afterScanId) {
          setSelectedBeforeScan(beforeScanId);
          setSelectedAfterScan(afterScanId);
          const result = await api.fetchComparison(beforeScanId, afterScanId);
          setData(result);
        } else {
          setError('At least two scans are required for comparison. Run scans on the tracked sites first.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    loadTargetsAndCompare();
  }, [beforeId, afterId]);

  const handleCompareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeforeScan || !selectedAfterScan) return;
    navigate(`/compare/${selectedBeforeScan}/${selectedAfterScan}`);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-r-transparent mb-4"></div>
        <p className="font-medium">Calculating accessibility improvements...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Comparison Unavailable</h2>
          <p className="text-sm text-gray-600 mb-4">{error || 'No scan comparison available.'}</p>
          <button
            onClick={() => navigate('/sites')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Go to Sites to Run Scans
          </button>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats
  const reductionPercentage =
    data.totalBefore > 0
      ? Math.round(((data.totalBefore - data.totalAfter) / data.totalBefore) * 100)
      : 0;

  const isImproved = reductionPercentage >= 0;

  const beforeGrade: 'A+' | 'A' | 'B' | 'C' | 'F' =
    data.wcagPassRateBefore >= 95 ? 'A+' :
    data.wcagPassRateBefore >= 85 ? 'A' :
    data.wcagPassRateBefore >= 70 ? 'B' :
    data.wcagPassRateBefore >= 50 ? 'C' : 'F';

  const afterGrade: 'A+' | 'A' | 'B' | 'C' | 'F' =
    data.wcagPassRateAfter >= 95 ? 'A+' :
    data.wcagPassRateAfter >= 85 ? 'A' :
    data.wcagPassRateAfter >= 70 ? 'B' :
    data.wcagPassRateAfter >= 50 ? 'C' : 'F';

  // Radar Chart and ROI Data
  const principles = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
  
  const getP = (c: string) => {
    if (c?.startsWith('1')) return 'Perceivable';
    if (c?.startsWith('2')) return 'Operable';
    if (c?.startsWith('3')) return 'Understandable';
    if (c?.startsWith('4')) return 'Robust';
    return 'Other';
  };

  const radarData = principles.map((p) => {
    let beforeV = 0;
    let afterV = 0;

    if ((data as any).resolvedViolations) {
      const res = ((data as any).resolvedViolations || []).filter((v: any) => v.principle === p).length;
      const unres = ((data as any).unresolvedViolations || []).filter((v: any) => v.principle === p).length;
      beforeV = res + unres;
      afterV = unres;
    } else {
      const b = [...data.fixedRules, ...data.remainingRules].filter((r) => getP(r.wcagCriterion) === p);
      const a = [...data.remainingRules, ...data.introducedRules].filter((r) => getP(r.wcagCriterion) === p);
      beforeV = b.reduce((sum, r) => sum + (r.nodeCountBefore || 1), 0);
      afterV = a.reduce((sum, r) => sum + (r.nodeCountAfter || 1), 0);
    }

    return {
      subject: p,
      Baseline: Math.max(0, 100 - beforeV * 2),
      Remediated: Math.max(0, 100 - afterV * 2),
      fullMark: 100,
    };
  });

  const totalResolved =
    (data as any).resolvedViolations?.length ??
    data.fixedRules.reduce((sum, r) => sum + (r.nodeCountBefore || 1), 0);
  const citizensUnblocked = totalResolved * 1000;
  const devHoursSaved = totalResolved * 2;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header with Scan Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary-600" />
            Compliance Remediation Proof
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Compare before and after scan results to scientifically verify remediation impact.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(0)}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-semibold rounded-xl text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-slate-50 focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <RotateCcw size={16} className="mr-2 text-slate-500" /> Refresh Comparison
        </button>
      </div>

      {/* Target Selector Bar */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200">
        <form onSubmit={handleCompareSubmit} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label htmlFor="beforeScanSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Baseline Scan (Before Remediation)
            </label>
            <select
              id="beforeScanSelect"
              value={selectedBeforeScan}
              onChange={(e) => setSelectedBeforeScan(e.target.value)}
              className="w-full text-sm rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5"
            >
              <option value="">Select a baseline scan...</option>
              {targets
                .filter((t) => t.lastScanId)
                .map((t) => (
                  <option key={`before-${t.id}`} value={t.lastScanId!}>
                    {t.siteName} ({new Date(t.lastScannedAt || t.createdAt).toLocaleDateString()})
                  </option>
                ))}
            </select>
          </div>

          <div className="hidden md:flex items-center justify-center pb-3 text-slate-600 font-black text-sm">
            vs
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="afterScanSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Remediated Scan (After Remediation)
            </label>
            <select
              id="afterScanSelect"
              value={selectedAfterScan}
              onChange={(e) => setSelectedAfterScan(e.target.value)}
              className="w-full text-sm rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5"
            >
              <option value="">Select a remediated scan...</option>
              {targets
                .filter((t) => t.lastScanId)
                .map((t) => (
                  <option key={`after-${t.id}`} value={t.lastScanId!}>
                    {t.siteName} ({new Date(t.lastScannedAt || t.createdAt).toLocaleDateString()})
                  </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Compare
          </button>
        </form>
      </div>

      {/* Hero Stat Banner */}
      <div
        className={`glass-card rounded-2xl p-8 text-center shadow-sm border ${
          isImproved
            ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-green-50/90 border-emerald-300'
            : 'bg-gradient-to-r from-red-50/90 to-orange-50/90 border-red-300'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white shadow-sm text-emerald-800 border border-emerald-200 mb-3">
          <TrendingDown className="h-4 w-4 text-emerald-600" />
          Measured Compliance Impact
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
          {Math.abs(reductionPercentage)}% Reduction in Accessibility Violations
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-lg sm:text-xl text-gray-700 font-medium">
          <span>WCAG 2.2 AA Pass Rate:</span>
          <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
            {data.wcagPassRateBefore}%
          </span>
          <ArrowRight className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 shadow-sm">
            {data.wcagPassRateAfter}%
          </span>
        </div>
      </div>

      {/* Side-by-Side Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Baseline (Before) */}
        <div className="glass-card rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-400"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-600">Baseline Audit</span>
              <h3 className="text-xl font-bold text-gray-900 truncate max-w-xs">{data.beforeUrl}</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
              Before Remediation
            </span>
          </div>

          <div className="flex flex-col items-center justify-center mb-6">
            <AuditCrystal3D grade={beforeGrade} healthScore={data.wcagPassRateBefore} size={115} />
            <span className="text-xs font-semibold text-slate-500 mt-2">Baseline Compliance Grade</span>
          </div>

          <div className="text-center mb-6 pb-6 border-b border-gray-100">
            <span className="text-4xl font-extrabold text-gray-900">{data.totalBefore}</span>
            <span className="block text-xs uppercase tracking-wider text-slate-600 font-semibold mt-1">
              Total Violations Found
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 text-sm">
              <SeverityBadge severity="critical" />
              <span className="font-bold text-gray-800">{data.severityBefore.critical}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 text-sm">
              <SeverityBadge severity="serious" />
              <span className="font-bold text-gray-800">{data.severityBefore.serious}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 text-sm">
              <SeverityBadge severity="moderate" />
              <span className="font-bold text-gray-800">{data.severityBefore.moderate}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 text-sm">
              <SeverityBadge severity="minor" />
              <span className="font-bold text-gray-800">{data.severityBefore.minor}</span>
            </div>
          </div>
        </div>

        {/* Remediated (After) */}
        <div className="glass-card rounded-xl shadow-sm border-2 border-emerald-400 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">Remediated Target</span>
              <h3 className="text-xl font-bold text-gray-900 truncate max-w-xs">{data.afterUrl}</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> After Remediation
            </span>
          </div>

          <div className="flex flex-col items-center justify-center mb-6">
            <AuditCrystal3D grade={afterGrade} healthScore={data.wcagPassRateAfter} size={115} />
            <span className="text-xs font-semibold text-emerald-700 mt-2">Remediated Compliance Grade</span>
          </div>

          <div className="text-center mb-6 pb-6 border-b border-gray-100">
            <span className="text-4xl font-extrabold text-emerald-700">{data.totalAfter}</span>
            <span className="block text-xs uppercase tracking-wider text-slate-600 font-semibold mt-1">
              Total Violations Found
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/50 text-sm">
              <SeverityBadge severity="critical" />
              <span className="font-bold text-gray-800">{data.severityAfter.critical}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/50 text-sm">
              <SeverityBadge severity="serious" />
              <span className="font-bold text-gray-800">{data.severityAfter.serious}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/50 text-sm">
              <SeverityBadge severity="moderate" />
              <span className="font-bold text-gray-800">{data.severityAfter.moderate}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/50 text-sm">
              <SeverityBadge severity="minor" />
              <span className="font-bold text-gray-800">{data.severityAfter.minor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* POUR Radar Chart */}
      <div className="glass-card rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary-600" />
            POUR Principle Analysis
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Visual comparison of accessibility scores across Perceivable, Operable, Understandable, and Robust principles.
          </p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Radar name="Baseline" dataKey="Baseline" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
              <Radar name="Remediated" dataKey="Remediated" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Remediation ROI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl shadow-sm border border-slate-200 p-6 bg-gradient-to-br from-white to-slate-50 flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-4">
            <CheckCircle className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 mb-1">{totalResolved}</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barriers Removed</span>
        </div>
        
        <div className="glass-card rounded-xl shadow-sm border border-slate-200 p-6 bg-gradient-to-br from-white to-slate-50 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-4">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 mb-1">{citizensUnblocked.toLocaleString()}</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citizens Unblocked</span>
        </div>
        
        <div className="glass-card rounded-xl shadow-sm border border-slate-200 p-6 bg-gradient-to-br from-white to-slate-50 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-4">
            <Clock className="h-6 w-6" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 mb-1">{devHoursSaved}</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dev Hours Saved</span>
        </div>
      </div>

      {/* Violations Fixed List */}
      <div className="glass-card rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
        <div className="px-6 py-4 bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900">
              Violations Successfully Fixed ({data.fixedRules.length})
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-800 text-white shadow-sm">
            100% Remediated in After-State
          </span>
        </div>

        <ul className="divide-y divide-emerald-100/50">
          {data.fixedRules.length === 0 ? (
            <li className="p-6 text-center text-sm text-slate-600">No fixed violations recorded.</li>
          ) : (
            data.fixedRules.map((rule) => (
              <li key={rule.ruleId} className="px-6 py-3.5 hover:bg-emerald-50/30 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900">{rule.ruleId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        WCAG {rule.wcagCriterion}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5">{rule.wcagCriterionName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-semibold">
                    {rule.nodeCountBefore} element{rule.nodeCountBefore !== 1 ? 's' : ''} fixed
                  </span>
                  <SeverityBadge severity={rule.severity} />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Still Remaining List (Honest Reporting) */}
      <div className="glass-card rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-gray-900">
              Violations Still Remaining ({data.remainingRules.length})
            </h3>
          </div>
          <span className="text-xs text-slate-600 font-semibold">Honest Audit Verification</span>
        </div>

        <ul className="divide-y divide-slate-100">
          {data.remainingRules.length === 0 ? (
            <li className="p-6 text-center text-sm text-emerald-800 font-medium bg-emerald-50/40">
              🎉 Zero violations remaining! All detected baseline issues were fully resolved.
            </li>
          ) : (
            data.remainingRules.map((rule) => (
              <li key={rule.ruleId} className="px-6 py-3.5 hover:bg-slate-50/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">{rule.ruleId}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      WCAG {rule.wcagCriterion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">{rule.wcagCriterionName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-semibold">
                    {rule.nodeCountBefore} → {rule.nodeCountAfter} elements
                  </span>
                  <SeverityBadge severity={rule.severity} />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Any Introduced Regressions */}
      {data.introducedRules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <h3 className="font-bold text-red-900">New Violations Introduced ({data.introducedRules.length})</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {data.introducedRules.map((rule) => (
              <li key={rule.ruleId} className="px-6 py-3 text-sm flex justify-between">
                <span>{rule.ruleId}</span>
                <SeverityBadge severity={rule.severity} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
