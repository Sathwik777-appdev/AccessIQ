import React from 'react';
import { Target, AlertTriangle, Palette, Image as ImageIcon, FormInput, Link2, Sparkles, Award } from 'lucide-react';

interface BenchmarkWidgetProps {
  yourAverage: number;
  govAverage?: number;
  overallAverage?: number;
  pctLowContrastText?: number;
  pctMissingAltText?: number;
  pctEmptyLinks?: number;
  pctMissingFormLabels?: number;
}

export const BenchmarkWidget: React.FC<BenchmarkWidgetProps> = ({
  yourAverage,
  govAverage = 37.2,
  overallAverage = 51.0,
  pctLowContrastText = 79.1,
  pctMissingAltText = 55.5,
  pctEmptyLinks = 15.8,
  pctMissingFormLabels = 43.8,
}) => {
  const maxVal = Math.max(yourAverage, govAverage, overallAverage, 60);
  const getWidth = (val: number) => `${Math.min((val / maxVal) * 100, 100)}%`;
  
  const isGood = yourAverage < govAverage;
  const diffFromGov = Math.abs(govAverage - yourAverage);
  const pctDifference = Math.round((diffFromGov / govAverage) * 100);

  // Common failure categories from WebAIM Million 2024
  const failureDrivers = [
    {
      label: 'Low Contrast Text',
      pct: pctLowContrastText,
      icon: Palette,
      color: 'text-amber-700',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Missing Alt Text',
      pct: pctMissingAltText,
      icon: ImageIcon,
      color: 'text-blue-700',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Missing Form Labels',
      pct: pctMissingFormLabels,
      icon: FormInput,
      color: 'text-purple-700',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Empty Links',
      pct: pctEmptyLinks,
      icon: Link2,
      color: 'text-rose-700',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
      {/* Ambient background decoration */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-primary-400/10 to-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Target size={16} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Accessibility Benchmark</h2>
              <p className="text-xs text-slate-500">Comparative standing against WebAIM global standards</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1">
            <Award size={12} className="text-amber-600" /> WebAIM 2024
          </span>
        </div>

        {/* Executive Highlight Banner */}
        <div
          className={`p-3.5 rounded-xl mb-5 border transition-all ${
            isGood
              ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-emerald-200/80 shadow-sm'
              : 'bg-gradient-to-r from-rose-50/90 via-amber-50/70 to-rose-50/90 border-rose-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isGood ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                }`}
              >
                {isGood ? <Sparkles size={14} /> : <AlertTriangle size={14} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {isGood ? (
                    <span>
                      <strong className="text-emerald-700">{pctDifference}% Cleaner</strong> than Gov't Benchmark
                    </span>
                  ) : (
                    <span>
                      <strong className="text-rose-700">Action Needed:</strong> Exceeds Gov't Average
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {isGood
                    ? `${diffFromGov.toFixed(1)} fewer violations per portal than national government baseline`
                    : `${diffFromGov.toFixed(1)} violations above WebAIM average of ${govAverage.toFixed(1)}`}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                isGood
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                  : 'bg-rose-100 text-rose-800 border border-rose-300/80'
              }`}
            >
              {isGood ? 'Exemplary' : 'Needs Review'}
            </span>
          </div>
        </div>

        {/* 3 Comparative Meter Bars */}
        <div className="space-y-4">
          {/* Your Portals */}
          <div className="p-3 rounded-xl bg-white/70 border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Your Monitored Portals</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Fleet
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-emerald-700">{yourAverage.toFixed(1)}</span>
                <span className="text-[10px] font-semibold text-slate-600">issues / site</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 border border-slate-200/60 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-700 shadow-sm relative ${
                  isGood
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500'
                }`}
                style={{ width: getWidth(yourAverage) }}
              >
                <div className="absolute right-0.5 top-0 bottom-0 w-1.5 bg-white/90 rounded-full shadow-xs" />
              </div>
            </div>
          </div>

          {/* WebAIM Gov't Average */}
          <div className="p-3 rounded-xl bg-white/50 border border-slate-200/60 shadow-xs">
            <div className="flex justify-between items-center text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">WebAIM Gov't Average</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  National Benchmark
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-800">{govAverage.toFixed(1)}</span>
                <span className="text-[10px] font-medium text-slate-600">issues / site</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 opacity-85"
                style={{ width: getWidth(govAverage) }}
              />
            </div>
          </div>

          {/* WebAIM Million Overall Average */}
          <div className="p-3 rounded-xl bg-white/40 border border-slate-200/50 shadow-xs">
            <div className="flex justify-between items-center text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">WebAIM Million (All Sectors)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Global Baseline
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-700">{overallAverage.toFixed(1)}</span>
                <span className="text-[10px] font-medium text-slate-600">issues / site</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/40">
              <div
                className="bg-gradient-to-r from-slate-400 to-slate-500 h-full rounded-full transition-all duration-700 opacity-75"
                style={{ width: getWidth(overallAverage) }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* WebAIM Million Failure Intelligence Micro-Grid */}
      <div className="mt-5 pt-4 border-t border-slate-200/70">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            WebAIM Top Failure Factors
          </span>
          <span className="text-[10px] text-slate-600 font-medium">Prevalence across 1M home pages</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {failureDrivers.map((driver) => {
            const IconComponent = driver.icon;
            return (
              <div
                key={driver.label}
                className="p-2 rounded-lg bg-white/60 border border-slate-200/70 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-5 h-5 rounded-md ${driver.bg} ${driver.color} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent size={11} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{driver.label}</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-900 flex-shrink-0 font-mono">
                  {driver.pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
