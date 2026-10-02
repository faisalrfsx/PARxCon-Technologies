import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'lead' | 'deal' | 'task' | 'priority' | 'payment' | 'client' | 'general';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general' }) => {
  const getColors = () => {
    const s = (status || '').toUpperCase();

    // Priorities
    if (s === 'URGENT') return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
    if (s === 'HIGH') return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
    if (s === 'MEDIUM') return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
    if (s === 'LOW') return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

    // Deals & Leads Won / Success
    if (s === 'WON' || s === 'PAID' || s === 'COMPLETED' || s === 'ACTIVE') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
    }

    // High Intent / Close
    if (s === 'VERBAL_CONFIRMATION' || s === 'PARTIALLY_PAID') {
      return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900';
    }

    // In Progress / Negotiation / Proposal
    if (s === 'NEGOTIATION' || s === 'PROPOSAL' || s === 'IN_PROGRESS' || s === 'QUALIFIED') {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900';
    }

    // Contacted / Discovery / Pending
    if (s === 'CONTACTED' || s === 'DISCOVERY' || s === 'REQUIREMENT' || s === 'PENDING' || s === 'SCHEDULED' || s === 'NEW' || s === 'PROSPECT') {
      return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900';
    }

    // Lost / Overdue / Cancelled
    if (s === 'LOST' || s === 'OVERDUE' || s === 'CANCELLED' || s === 'INACTIVE' || s === 'FORMER_CLIENT') {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
    }

    // On Hold / Rescheduled
    if (s === 'ON_HOLD' || s === 'RESCHEDULED') {
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900';
    }

    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColors()}`}
    >
      {formatText(status)}
    </span>
  );
};
