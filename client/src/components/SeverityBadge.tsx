import React from 'react';

type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

interface SeverityBadgeProps {
  severity: Severity | string;
  count?: number;
}

const severityConfig: Record<Severity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  serious: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  minor: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, count }) => {
  const normSeverity = severity.toLowerCase() as Severity;
  const config = severityConfig[normSeverity] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      title={severity}
    >
      <span className="capitalize">{severity}</span>
      {count !== undefined && (
        <span className="ml-1.5 pl-1.5 border-l border-current opacity-80">
          {count}
        </span>
      )}
    </span>
  );
};
