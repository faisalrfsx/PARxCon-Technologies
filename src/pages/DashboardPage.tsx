import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  CalendarClock,
  RotateCw,
  FolderGit2,
  AlertCircle,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { api } from '../services/api.js';
import { DashboardSummary } from '../types/index.js';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const data = await api.dashboard.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();

    const handleUpdate = () => fetchSummary();
    window.addEventListener('ops_record_updated', handleUpdate);
    return () => window.removeEventListener('ops_record_updated', handleUpdate);
  }, []);

  const handleCompleteFollowup = async (id: string) => {
    try {
      await api.followups.update(id, {
        status: 'COMPLETED',
        outcome: 'Completed via Dashboard quick action',
      });
      fetchSummary();
    } catch (err) {
      console.error('Failed to complete follow-up:', err);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading PARxCON Ops Command Center...</span>
        </div>
      </div>
    );
  }

  const { metrics } = summary;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              PARxCON OPS
            </h1>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Live Command
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline, collections, today's operational follow-ups, and renewals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/reports')}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Analytics & Reports
          </button>
          <button
            onClick={() => onNavigate('/ai-assistant')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Bot className="w-4 h-4" />
            <span>AI Ops Command</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Specification 19) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Revenue This Month"
          value={`₹${metrics.revenueThisMonth.toLocaleString()}`}
          subtitle={`All-time won: ₹${metrics.wonRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
          highlight
          onClick={() => onNavigate('/payments')}
        />
        <StatCard
          title="Active Pipeline"
          value={`₹${metrics.pipelineValue.toLocaleString()}`}
          subtitle={`Weighted: ₹${Math.round(metrics.weightedPipeline).toLocaleString()}`}
          icon={TrendingUp}
          color="indigo"
          onClick={() => onNavigate('/deals')}
        />
        <StatCard
          title="Outstanding Payments"
          value={`₹${metrics.pendingPayments.toLocaleString()}`}
          subtitle={`Overdue: ₹${metrics.overduePayments.toLocaleString()}`}
          icon={Receipt}
          color="rose"
          highlight={metrics.overduePayments > 0}
          onClick={() => onNavigate('/payments')}
        />
        <StatCard
          title="Active Deals"
          value={metrics.activeOpportunities}
          subtitle={`Total leads: ${metrics.totalLeads} | Projects: ${metrics.activeProjects}`}
          icon={FolderGit2}
          color="blue"
          onClick={() => onNavigate('/deals')}
        />
      </div>

      {/* Middle Grid: Today's Follow-ups & Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TODAY'S & OVERDUE FOLLOW-UPS (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Today's Follow-ups
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {summary.todayFollowups.length} scheduled for today • {summary.overdueFollowups.length} overdue
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/followups')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Overdue Warning if any */}
            {summary.overdueFollowups.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{summary.overdueFollowups.length} Overdue Follow-up(s) Require Attention:</span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {summary.overdueFollowups.slice(0, 2).map((of) => (
                    <div
                      key={of.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-100 dark:border-rose-900/40"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {of.clientName || of.leadName}
                        </span>
                        <span className="text-slate-400 ml-2">({of.followupType}): {of.notes}</span>
                      </div>
                      <button
                        onClick={() => handleCompleteFollowup(of.id)}
                        className="px-2 py-1 rounded bg-rose-600 text-white font-medium text-[10px] hover:bg-rose-700 shrink-0 ml-2"
                      >
                        Mark Done
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Today items */}
            <div className="space-y-2.5">
              {summary.todayFollowups.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p>All follow-ups for today are up to date.</p>
                </div>
              ) : (
                summary.todayFollowups.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-950/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                        {f.followupType === 'CALL' ? (
                          <Phone className="w-4 h-4" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {f.clientName || f.leadName}
                          </span>
                          <StatusBadge status={f.followupType} type="task" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {f.notes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCompleteFollowup(f.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Next review cycle in 30 mins</span>
            <button
              onClick={() => onNavigate('/followups')}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              + Schedule Follow-up
            </button>
          </div>
        </div>

        {/* PIPELINE BREAKDOWN (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Pipeline By Stage
            </h2>
            <button
              onClick={() => onNavigate('/deals')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Pipeline View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { key: 'DISCOVERY', label: 'Discovery', color: 'bg-sky-500' },
              { key: 'PROPOSAL', label: 'Proposal', color: 'bg-indigo-500' },
              { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-purple-500' },
              { key: 'VERBAL_CONFIRMATION', label: 'Verbal Confirmation', color: 'bg-teal-500' },
              { key: 'WON', label: 'Won Deals', color: 'bg-emerald-500' },
            ].map((stg) => {
              const data = summary.pipelineByStage[stg.key] || { count: 0, value: 0 };
              const percent = metrics.pipelineValue > 0 ? (data.value / metrics.pipelineValue) * 100 : 0;

              return (
                <div key={stg.key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {stg.label} ({data.count})
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{data.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stg.color}`}
                      style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <div className="flex justify-between items-center text-indigo-900 dark:text-indigo-200">
              <span className="font-semibold">Weighted Pipeline (Value × Prob):</span>
              <span className="font-black text-sm text-indigo-700 dark:text-indigo-400">
                ₹{Math.round(metrics.weightedPipeline).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Outstanding Debtors, Upcoming Renewals & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PAYMENTS & OUTSTANDING (4 Columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Outstanding Collections
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/payments')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All Invoices
            </button>
          </div>

          <div className="space-y-3">
            {summary.outstandingDebtors.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No outstanding collections.</p>
            ) : (
              summary.outstandingDebtors.map((d) => (
                <div
                  key={d.clientId}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.clientName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Paid: ₹{d.paid.toLocaleString()} of ₹{d.invoiced.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                      ₹{d.pending.toLocaleString()}
                    </span>
                    {d.overdue > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* UPCOMING RENEWALS (4 Columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Upcoming Renewals
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/renewals')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {summary.upcomingRenewalsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No renewals due in next 30 days.</p>
            ) : (
              summary.upcomingRenewalsList.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {r.service}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.provider}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                        r.daysRemaining <= 7
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {r.daysRemaining <= 0 ? 'Today' : `${r.daysRemaining} days`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ₹{r.cost.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY & AI LOGS (4 Columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Operations Audit
            </h2>
            <button
              onClick={() => onNavigate('/settings')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Full Log
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {summary.recentActivity.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    {log.action === 'AI_ACTION' && <Sparkles className="w-3 h-3 text-indigo-500" />}
                    {log.userName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
