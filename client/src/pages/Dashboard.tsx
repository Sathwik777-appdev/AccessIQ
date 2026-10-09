import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LabelList,
} from 'recharts';
import {
  Layout,
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  MousePointerClick,
  BookOpen,
  ShieldCheck,
  LucideIcon,
  Clock,
} from 'lucide-react';
import { api, DashboardSummary, BenchmarkData } from '../services/api';
import { SummaryCard } from '../components/SummaryCard';
import { BenchmarkWidget } from '../components/BenchmarkWidget';
import { ComplianceGlobe3D } from '../components/three/ComplianceGlobe3D';
import { useLanguage } from '../context/LanguageContext';

const PILLAR_META: Record<
  string,
  {
    name: string;
    letter: string;
    icon: LucideIcon;
    gradientId: string;
    colors: [string, string, string];
    color: string;
    bgLight: string;
    borderLight: string;
    badgeBg: string;
    criteria: string;
    description: string;
  }
> = {
  Perceivable: {
    name: 'Perceivable',
    letter: 'P',
    icon: Eye,
    gradientId: 'gradient-Perceivable',
    colors: ['#38bdf8', '#2563eb', '#1e40af'],
    color: '#2563eb',
    bgLight: 'bg-blue-500/10',
    borderLight: 'border-blue-500/30',
    badgeBg: 'bg-blue-600 text-white',
    criteria: 'Contrast, Alt text, Captions',
    description: 'Information and UI components must be presentable to users in ways they can perceive.',
  },
  Operable: {
    name: 'Operable',
    letter: 'O',
    icon: MousePointerClick,
    gradientId: 'gradient-Operable',
    colors: ['#34d399', '#059669', '#065f46'],
    color: '#059669',
    bgLight: 'bg-emerald-500/10',
    borderLight: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-600 text-white',
    criteria: 'Keyboard nav, Focus, Timing',
    description: 'UI components and navigation must be operable without mouse dependence or traps.',
  },
  Understandable: {
    name: 'Understandable',
    letter: 'U',
    icon: BookOpen,
    gradientId: 'gradient-Understandable',
    colors: ['#fbbf24', '#d97706', '#92400e'],
    color: '#d97706',
    bgLight: 'bg-amber-500/10',
    borderLight: 'border-amber-500/30',
    badgeBg: 'bg-amber-600 text-white',
    criteria: 'Form labels, Language, Errors',
    description: 'Information and the operation of user interface must be understandable.',
  },
  Robust: {
    name: 'Robust',
    letter: 'R',
    icon: ShieldCheck,
    gradientId: 'gradient-Robust',
    colors: ['#c084fc', '#7c3aed', '#5b21b6'],
    color: '#7c3aed',
    bgLight: 'bg-purple-500/10',
    borderLight: 'border-purple-500/30',
    badgeBg: 'bg-purple-600 text-white',
    criteria: 'HTML syntax, ARIA specs',
    description: 'Content must be robust enough that it can be interpreted reliably by assistive technologies.',
  },
};

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'bar' | 'donut'>('bar');
  const [activePrinciple, setActivePrinciple] = useState<string | null>(null);
  const [leaderboardFilter, setLeaderboardFilter] = useState<string>('all');

  const filteredRankings = useMemo(() => {
    if (!data?.siteRankings) return [];
    if (leaderboardFilter === 'all') return data.siteRankings;
    return data.siteRankings.filter((s) => s.siteType === leaderboardFilter);
  }, [data?.siteRankings, leaderboardFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, benchmarkData] = await Promise.all([
          api.fetchDashboardSummary(),
          api.fetchBenchmark()
        ]);
        setData(summaryData);
        setBenchmark(benchmarkData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-80 glass-card rounded-2xl bg-white/40"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass-card rounded-2xl bg-white/40"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 glass-card rounded-2xl bg-white/40"></div>
          <div className="h-80 glass-card rounded-2xl bg-white/40"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="glass-card p-6 rounded-2xl border-rose-300 bg-rose-50/70 text-rose-800 flex items-start gap-4">
          <AlertTriangle className="text-rose-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-base font-bold text-rose-900">Dashboard Unavailable</h3>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.totalSites === 0 || data.sitesScanned === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-[70vh] flex flex-col items-center justify-center">
        <div className="glass-card p-10 rounded-3xl text-center max-w-lg shadow-2xl relative overflow-hidden">
          <div className="ambient-glow w-48 h-48 bg-primary-400 -top-10 -left-10 opacity-30"></div>
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-600 flex items-center justify-center mx-auto mb-6">
            <Activity size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">No Audits Recorded Yet</h2>
          <p className="text-slate-600 text-sm mb-8 leading-relaxed">
            Welcome to AccessIQ! Get started by scanning your first public portal or checking the remediation demo.
          </p>
          <Link
            to="/sites"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-lg shadow-primary-500/25 transition-all"
          >
            <span>Explore Monitored Sites</span>
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  const totalPrincipleViolations = data.violationsByPrinciple?.reduce((sum, p) => sum + p.value, 0) || 0;

  const PrincipleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const meta = PILLAR_META[item.name];
      const pct = totalPrincipleViolations > 0 ? Math.round((item.value / totalPrincipleViolations) * 100) : 0;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 text-white p-3.5 rounded-xl shadow-2xl min-w-[220px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: meta?.color || item.color }}
            />
            <span className="font-bold text-sm text-slate-100">{item.name}</span>
            <span className="ml-auto font-mono text-[11px] font-bold text-slate-400">{pct}% share</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-2xl font-black text-white">{item.value}</span>
            <span className="text-xs text-slate-400 font-medium">violations detected</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            {meta?.criteria || 'WCAG Foundation Criterion'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* 3D Three.js Interactive Compliance Globe Hero */}
      <ComplianceGlobe3D
        monitoredCount={data.totalSites}
        activeAuditsCount={data.sitesScanned}
        averagePassRate={data.overallPassRate}
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <SummaryCard
          title={t('monitoredPortals')}
          value={data.totalSites}
          subtitle={t('monitoredPortalsSub')}
          icon={Layout}
          color="blue"
        />
        <SummaryCard
          title={t('avgViolations')}
          value={data.avgViolationsPerSite.toFixed(1)}
          icon={AlertTriangle}
          color={data.avgViolationsPerSite < 15 ? 'green' : 'red'}
          trend={data.trendDirection === 'improving' ? 'down' : 'up'}
          trendValue={data.trendDirection === 'improving' ? t('improving') : t('attentionNeeded')}
        />
        <SummaryCard
          title={t('nationalPassRate')}
          value={`${data.overallPassRate}%`}
          subtitle={t('passRateSub')}
          icon={CheckCircle}
          color="green"
          trend={data.overallPassRate >= 80 ? 'up' : 'stable'}
          trendValue={data.overallPassRate >= 80 ? 'Exemplary' : 'Moderate'}
        />
        <SummaryCard
          title={t('auditsCompleted')}
          value={`${data.sitesScanned} / ${data.totalSites}`}
          subtitle={t('auditsCompletedSub')}
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Charts & Benchmarks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Violations by WCAG Principle */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          {/* Ambient background glow */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{t('violationsByPrinciple')}</h2>
                  <p className="text-xs text-slate-500">{t('principleSub')}</p>
                </div>
              </div>

              {/* View Switcher Controls */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setChartView('bar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    chartView === 'bar'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Show Bar Chart"
                  aria-pressed={chartView === 'bar'}
                >
                  <BarChart3 size={13} />
                  <span>{t('bars')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('donut')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    chartView === 'donut'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Show Distribution Ring"
                  aria-pressed={chartView === 'donut'}
                >
                  <PieChartIcon size={13} />
                  <span>{t('donut')}</span>
                </button>
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-64 relative">
              {chartView === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.violationsByPrinciple}
                    margin={{ top: 22, right: 12, left: -20, bottom: 4 }}
                    onMouseLeave={() => setActivePrinciple(null)}
                  >
                    <defs>
                      {Object.values(PILLAR_META).map((p) => (
                        <linearGradient key={p.gradientId} id={p.gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={p.colors[0]} stopOpacity={1} />
                          <stop offset="55%" stopColor={p.colors[1]} stopOpacity={1} />
                          <stop offset="100%" stopColor={p.colors[2]} stopOpacity={1} />
                        </linearGradient>
                      ))}
                      <filter id="bar-shadow" x="-10%" y="-10%" width="120%" height="130%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.1" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.8} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      content={<PrincipleTooltip />}
                      cursor={{ fill: 'rgba(241, 245, 249, 0.55)', radius: 8 }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[10, 10, 2, 2]}
                      maxBarSize={56}
                      filter="url(#bar-shadow)"
                    >
                      {data.violationsByPrinciple.map((entry, index) => {
                        const meta = PILLAR_META[entry.name];
                        const isMuted = activePrinciple && activePrinciple !== entry.name;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#${meta?.gradientId || 'gradient-Perceivable'})`}
                            opacity={isMuted ? 0.35 : 1}
                            cursor="pointer"
                            onMouseEnter={() => setActivePrinciple(entry.name)}
                          />
                        );
                      })}
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#1e293b"
                        fontSize={12}
                        fontWeight={700}
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart onMouseLeave={() => setActivePrinciple(null)}>
                    <RechartsTooltip content={<PrincipleTooltip />} />
                    <Pie
                      data={data.violationsByPrinciple}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      cornerRadius={6}
                    >
                      {data.violationsByPrinciple.map((entry, index) => {
                        const meta = PILLAR_META[entry.name];
                        const isMuted = activePrinciple && activePrinciple !== entry.name;
                        return (
                          <Cell
                            key={`slice-${index}`}
                            fill={meta?.color || entry.color}
                            opacity={isMuted ? 0.35 : 1}
                            stroke="#ffffff"
                            strokeWidth={2}
                            cursor="pointer"
                            onMouseEnter={() => setActivePrinciple(entry.name)}
                          />
                        );
                      })}
                    </Pie>
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-900 font-black text-2xl"
                    >
                      {totalPrincipleViolations}
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-500 font-bold text-[10px] tracking-wider uppercase"
                    >
                      Total Issues
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 4 POUR Pillar Interactive Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-200/70">
            {data.violationsByPrinciple.map((principle) => {
              const meta = PILLAR_META[principle.name] || PILLAR_META.Perceivable;
              const isSelected = activePrinciple === principle.name;
              const pct = totalPrincipleViolations > 0 ? Math.round((principle.value / totalPrincipleViolations) * 100) : 0;

              return (
                <button
                  key={principle.name}
                  type="button"
                  onMouseEnter={() => setActivePrinciple(principle.name)}
                  onMouseLeave={() => setActivePrinciple(null)}
                  onClick={() => setActivePrinciple(isSelected ? null : principle.name)}
                  aria-label={`${principle.name}: ${principle.value} violations (${pct}%)`}
                  aria-pressed={isSelected}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 flex flex-col justify-between ${
                    isSelected
                      ? `${meta.bgLight} ${meta.borderLight} ring-2 ring-primary-500/50 shadow-sm`
                      : 'bg-white/60 border-slate-200/80 hover:bg-white/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${meta.badgeBg} flex-shrink-0`}>
                      {meta.letter}
                    </span>
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {principle.name}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-slate-900">{principle.value}</span>
                        <span className="text-[10px] text-slate-500 font-medium">issues</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {meta.criteria}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Benchmark Widget */}
        {benchmark && (
          <BenchmarkWidget
            yourAverage={benchmark.yourAverage}
            govAverage={benchmark.govAverage}
            overallAverage={benchmark.overallAverage}
            pctLowContrastText={benchmark.pctLowContrastText}
            pctMissingAltText={benchmark.pctMissingAltText}
            pctEmptyLinks={benchmark.pctEmptyLinks}
            pctMissingFormLabels={benchmark.pctMissingFormLabels}
          />
        )}
      </div>

      {/* Top Portal Rankings / Status Card */}
      {data.siteRankings && data.siteRankings.length > 0 && (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Compliance Leaderboard</h2>
              <p className="text-xs text-slate-500">Government portals ranked by accessibility health</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200">
              {[
                { id: 'all', label: 'All Portals' },
                { id: 'central-govt', label: 'Central Govt' },
                { id: 'state-govt', label: 'State Govt' },
                { id: 'municipal', label: 'Municipal' },
                { id: 'psu', label: 'PSU' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeaderboardFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    leaderboardFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Link
              to="/sites"
              className="inline-flex items-center text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
            >
              View All ({data.totalSites}) <ArrowRight size={13} className="ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRankings.slice(0, 6).map((site, i) => (
              <Link
                key={site.scanTargetId}
                to={`/sites/${site.scanTargetId}`}
                className="p-3.5 rounded-xl bg-white/60 hover:bg-white/90 border border-slate-200/80 hover:border-primary-400/80 shadow-sm transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 group-hover:bg-primary-500 group-hover:text-white transition-colors flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                        {site.siteName}
                      </span>
                      {site.siteType && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                          {site.siteType.replace('-govt', '')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{site.url.replace(/^https?:\/\//, '')}</div>
                    {site.lastScannedAt && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        <span>{new Date(site.lastScannedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className={`text-xs font-black ${site.totalViolations === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {site.totalViolations} issues
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">{site.passRate}% pass</div>
                  {(site.criticalCount ?? 0) > 0 && (
                    <span className="text-[9px] font-bold px-1 rounded bg-rose-100 text-rose-700 mt-0.5 inline-block">
                      {site.criticalCount} crit
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
