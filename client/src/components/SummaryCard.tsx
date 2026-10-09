import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gray';
}

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  green: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  red: 'bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
  purple: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
  yellow: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  gray: 'bg-slate-500/10 text-slate-600 border border-slate-500/20 shadow-[0_0_15px_rgba(100,116,139,0.15)]',
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  color = 'blue',
}) => {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${colorMap[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center text-xs">
          {trend && (
            <span
              className={`flex items-center mr-2 font-bold px-2 py-0.5 rounded-full ${
                trend === 'up'
                  ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-300'
                  : trend === 'down'
                  ? 'bg-rose-100/80 text-rose-700 border border-rose-300'
                  : 'bg-slate-100/80 text-slate-700 border border-slate-300'
              }`}
            >
              {trend === 'up' && <TrendingUp size={13} className="mr-1" />}
              {trend === 'down' && <TrendingDown size={13} className="mr-1" />}
              {trend === 'stable' && <Minus size={13} className="mr-1" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
