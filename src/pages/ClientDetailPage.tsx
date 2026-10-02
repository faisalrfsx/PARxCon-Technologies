import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  TrendingUp,
  Receipt,
  CheckSquare,
  CalendarClock,
  KeyRound,
  FolderGit2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { StatCard } from '../components/common/StatCard.js';
import { api } from '../services/api.js';
import { ClientSummary } from '../types/index.js';

interface ClientDetailPageProps {
  clientId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  clientId,
  onBack,
  onNavigate,
}) => {
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'deals' | 'payments' | 'tasks' | 'followups' | 'accounts' | 'projects' | 'leads'
  >('deals');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.clients.getSummary(clientId);
        setSummary(data);
      } catch (err) {
        console.error('Failed to load client 360 view:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [clientId]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-slate-400">Loading consolidated client 360° profile...</div>
      </div>
    );
  }

  const { client, metrics, deals, payments, invoices, tasks, followups, accounts, projects, leads } = summary;

  return (
    <div className="space-y-6">
      {/* Back button and Profile Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Clients</span>
        </button>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
              {client.companyName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {client.companyName}
                </h1>
                <StatusBadge status={client.status} type="client" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {client.industry || 'Enterprise Client'} • Client since {new Date(client.clientSince).toLocaleDateString()}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${client.email}`} className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">
                    {client.email}
                  </a>
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </span>
                )}
                {client.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.city}, {client.country}</span>
                  </span>
                )}
                {client.website && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline text-indigo-600 flex items-center gap-1">
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Contact Person
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-base block mt-0.5">
              {client.contactPerson}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Invoiced"
          value={`₹${metrics.totalInvoiced.toLocaleString()}`}
          icon={Receipt}
          color="slate"
        />
        <StatCard
          title="Total Paid"
          value={`₹${metrics.totalPaid.toLocaleString()}`}
          icon={Receipt}
          color="emerald"
        />
        <StatCard
          title="Outstanding Balance"
          value={`₹${metrics.outstanding.toLocaleString()}`}
          icon={Receipt}
          color="rose"
          highlight={metrics.outstanding > 0}
        />
        <StatCard
          title="Won Revenue"
          value={`₹${metrics.wonRevenue.toLocaleString()}`}
          subtitle={`${deals.length} total deals`}
          icon={TrendingUp}
          color="indigo"
        />
      </div>

      {/* 360-Degree Consolidated Sub-views Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'deals', label: `Deals (${deals.length})`, icon: TrendingUp },
            { id: 'payments', label: `Invoices & Payments (${invoices.length})`, icon: Receipt },
            { id: 'projects', label: `Projects (${projects.length})`, icon: FolderGit2 },
            { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
            { id: 'followups', label: `Follow-ups (${followups.length})`, icon: CalendarClock },
            { id: 'accounts', label: `Account Registry (${accounts.length})`, icon: KeyRound },
            { id: 'leads', label: `Historical Leads (${leads.length})`, icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* DEALS TAB */}
          {activeTab === 'deals' && (
            <div className="space-y-3">
              {deals.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No deals recorded for this client.</p>
              ) : (
                deals.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.dealName}</h4>
                        <StatusBadge status={d.stage} type="deal" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.service}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-slate-900 dark:text-white block">
                        ₹{d.dealValue.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Probability: {d.probability}% (Weighted: ₹{Math.round((d.dealValue * d.probability) / 100).toLocaleString()})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PAYMENTS & INVOICES TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Invoices
                </h4>
                {invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No invoices generated yet.</p>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</span>
                          <span className="text-slate-400 ml-2">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 dark:text-white">₹{inv.invoiceAmount.toLocaleString()}</span>
                          <StatusBadge status={inv.status} type="payment" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Recorded Payments
                </h4>
                {payments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No payments received yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            +₹{pay.amount.toLocaleString()}
                          </span>
                          <span className="text-slate-400 ml-2">via {pay.paymentMethod} ({pay.referenceNo || 'Direct'})</span>
                        </div>
                        <span className="text-slate-400">{new Date(pay.paymentDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No projects assigned.</p>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.projectName}</h4>
                        <p className="text-slate-500 mt-1">{p.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold text-[10px]">
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No tasks linked to this client.</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.priority} type="priority" />
                      <StatusBadge status={t.status} type="task" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FOLLOW-UPS TAB */}
          {activeTab === 'followups' && (
            <div className="space-y-2">
              {followups.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No follow-ups recorded.</p>
              ) : (
                followups.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{f.followupType}</span>
                        <span className="text-slate-400">Date: {f.followupDate}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{f.notes}</p>
                    </div>
                    <StatusBadge status={f.status} type="task" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ACCOUNT REGISTRY TAB (STRICT SECURITY: NO PLAINTEXT PASSWORDS) */}
          {activeTab === 'accounts' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                🔒 <strong>Account Reference System:</strong> Credentials for this client are stored inside dedicated password managers (Bitwarden / 1Password). Only vault pointers are listed here.
              </div>

              {accounts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No external accounts registered for this client.</p>
              ) : (
                accounts.map((acc) => (
                  <div key={acc.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{acc.serviceName}</h4>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                          {acc.category}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-500 dark:text-slate-400">
                        Username: <span className="font-mono">{acc.username || 'N/A'}</span> • 2FA: {acc.twoFactorEnabled ? 'Enabled' : 'No'}
                      </div>
                      <div className="mt-1 font-mono text-indigo-600 dark:text-indigo-400 text-[11px]">
                        Ref: {acc.credentialManager} → {acc.credentialReference}
                      </div>
                    </div>
                    {acc.url && (
                      <a href={acc.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-indigo-600">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* HISTORICAL LEADS TAB */}
          {activeTab === 'leads' && (
            <div className="space-y-2">
              {leads.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No historical leads.</p>
              ) : (
                leads.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{l.companyName}</span>
                      <span className="text-slate-400 ml-2">Source: {l.leadSource}</span>
                    </div>
                    <StatusBadge status={l.status} type="lead" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
