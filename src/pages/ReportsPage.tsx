import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Calendar,
  AlertTriangle,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'payments' | 'activity' | 'weekly'>('weekly');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [paymentReport, setPaymentReport] = useState<any>(null);
  const [activityReport, setActivityReport] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Briefing modal states
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [briefingTitle, setBriefingTitle] = useState('');

  const fetchReports = async () => {
    try {
      const [sales, pay, act, week] = await Promise.all([
        api.reports.getSales(),
        api.reports.getPayments(),
        api.reports.getActivity(),
        api.reports.getWeekly(),
      ]);
      setSalesReport(sales);
      setPaymentReport(pay);
      setActivityReport(act);
      setWeeklyReport(week);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleTriggerMorningBriefing = async () => {
    try {
      const data = await api.reports.getMorningBriefing();
      setBriefingData(data);
      setBriefingTitle('Morning Operations Briefing (Scheduled Automation)');
      setBriefingModalOpen(true);
    } catch (err) {
      console.error('Failed to trigger morning briefing:', err);
    }
  };

  const handleTriggerEveningSummary = async () => {
    try {
      const data = await api.reports.getEveningSummary();
      setBriefingData(data);
      setBriefingTitle('Evening Sales Activity Summary (Scheduled Automation)');
      setBriefingModalOpen(true);
    } catch (err) {
      console.error('Failed to trigger evening summary:', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Compiling database analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Operations & Analytical Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real queries derived strictly from actual database transactions — zero fabricated numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerMorningBriefing}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Run Morning Briefing</span>
          </button>
          <button
            onClick={handleTriggerEveningSummary}
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Moon className="w-4 h-4 text-indigo-500" />
            <span>Run Evening Summary</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'weekly', label: 'Weekly Analytical Summary' },
          { id: 'sales', label: 'Sales & Conversion Report' },
          { id: 'payments', label: 'Financial Collections Report' },
          { id: 'activity', label: 'Team Activity Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: WEEKLY ANALYTICAL REPORT (Specification 17 & 32) */}
      {activeTab === 'weekly' && weeklyReport && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Weekly Sales Report (Strict Database Derive)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated dynamically from deals closed, collections recorded, and follow-ups logged over the trailing 7 days.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-mono font-bold">
                Automated Engine
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">New Leads</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
                  {weeklyReport.newLeads}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Qualified: {weeklyReport.qualified}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Proposals & Neg.</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
                  {weeklyReport.proposals + weeklyReport.negotiations}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Proposals: {weeklyReport.proposals} • Neg: {weeklyReport.negotiations}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
                  Won Revenue (Trailing 7d)
                </span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 block mt-1">
                  ₹{weeklyReport.wonRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600/80 mt-1 block">
                  {weeklyReport.won} deal(s) won
                </span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold uppercase">
                  Current Active Pipeline
                </span>
                <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 block mt-1">
                  ₹{weeklyReport.currentPipeline.toLocaleString()}
                </span>
                <span className="text-[10px] text-indigo-600/80 mt-1 block">
                  Weighted: ₹{Math.round(weeklyReport.weightedPipeline).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Follow-up completions */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Follow-ups Completed This Week: {weeklyReport.followupsCompleted}
                  </span>
                  <span className="text-[11px] text-slate-400">Logged client touchpoints</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Follow-ups Overdue: {weeklyReport.followupsOverdue}
                  </span>
                  <span className="text-[11px] text-rose-500 font-medium">Require immediate outreach</span>
                </div>
              </div>
            </div>

            {/* Stale Opportunities Flag (Specification 32) */}
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Attention Required: {weeklyReport.staleOpportunitiesCount} Opportunities with No Activity for &gt; 7 Days</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                These open deals risk going cold without active follow-ups or proposal revisions.
              </p>

              <div className="space-y-2">
                {weeklyReport.staleOpportunities.map((so: any) => (
                  <div
                    key={so.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{so.dealName}</span>
                      <span className="text-slate-400 ml-2">({so.client})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">₹{so.dealValue.toLocaleString()}</span>
                      <StatusBadge status={so.stage} type="deal" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & CONVERSION */}
      {activeTab === 'sales' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Leads"
              value={salesReport.metrics.totalLeads}
              subtitle={`Qualified: ${salesReport.metrics.qualifiedLeads}`}
              icon={TrendingUp}
            />
            <StatCard
              title="Won Deals"
              value={salesReport.metrics.wonDeals}
              subtitle={`Proposals sent: ${salesReport.metrics.proposals}`}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Win Conversion Rate"
              value={salesReport.metrics.conversionRate}
              subtitle="Won Deals / Total Leads"
              icon={TrendingUp}
              color="indigo"
              highlight
            />
            <StatCard
              title="Won Revenue"
              value={`₹${salesReport.metrics.wonRevenue.toLocaleString()}`}
              subtitle="All-time contract value"
              icon={Receipt}
              color="emerald"
            />
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Stage Velocity Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(salesReport.stageBreakdown).map(([stgKey, val]: [string, any]) => (
                <div key={stgKey} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={stgKey} type="deal" />
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {val.count} deal(s)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{val.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Weighted: ₹{Math.round(val.weightedValue).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL COLLECTIONS */}
      {activeTab === 'payments' && paymentReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Invoiced"
              value={`₹${paymentReport.invoicedTotal.toLocaleString()}`}
              icon={Receipt}
            />
            <StatCard
              title="Collections Received"
              value={`₹${paymentReport.receivedTotal.toLocaleString()}`}
              icon={Receipt}
              color="emerald"
            />
            <StatCard
              title="Total Outstanding"
              value={`₹${paymentReport.outstandingTotal.toLocaleString()}`}
              icon={Receipt}
              color="rose"
            />
            <StatCard
              title="Overdue Receivables"
              value={`₹${paymentReport.overdueTotal.toLocaleString()}`}
              icon={AlertTriangle}
              color="rose"
              highlight={paymentReport.overdueTotal > 0}
            />
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Top Client Debtors & Balances
            </h3>
            <div className="space-y-2">
              {paymentReport.debtors.map((d: any) => (
                <div
                  key={d.clientId}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{d.clientName}</span>
                    <span className="text-slate-400 ml-2">
                      Invoiced: ₹{d.invoiced.toLocaleString()} • Paid: ₹{d.paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block">
                      ₹{d.pending.toLocaleString()}
                    </span>
                    {d.overdue > 0 && (
                      <span className="text-[10px] text-rose-500 font-semibold">Overdue</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM ACTIVITY */}
      {activeTab === 'activity' && activityReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Phone Calls Logged" value={activityReport.calls} icon={Calendar} color="blue" />
            <StatCard title="Meetings Conducted" value={activityReport.meetings} icon={Calendar} color="indigo" />
            <StatCard title="Emails & Follow-ups" value={activityReport.emails + activityReport.whatsapps} icon={Calendar} color="emerald" />
            <StatCard title="Tasks Completed" value={activityReport.completedTasks} icon={CheckCircle2} color="slate" />
          </div>
        </div>
      )}

      {/* Briefing Output Modal */}
      <Modal
        isOpen={briefingModalOpen}
        onClose={() => setBriefingModalOpen(false)}
        title={briefingTitle}
        subtitle="Automated scheduled briefing output generated from real-time database state"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <pre className="p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-96">
            {JSON.stringify(briefingData, null, 2)}
          </pre>
          <div className="flex justify-end">
            <button
              onClick={() => setBriefingModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
            >
              Close Briefing
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
