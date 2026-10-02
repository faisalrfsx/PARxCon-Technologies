import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight,
  color = 'indigo',
  onClick,
}) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl bg-white dark:bg-slate-900 border ${
        highlight
          ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      } transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-400 ml-1.5">vs last month</span>
        </div>
      )}
    </div>
  );
};
