import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon,
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{title}</p>
        {icon && <div className="p-2 rounded-lg bg-stone-50 text-stone-700">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-stone-900">{value}</p>
        {change && (
          <span
            className={`text-xs font-medium flex items-center ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-stone-500">{subtitle}</p>}
    </div>
  );
};

