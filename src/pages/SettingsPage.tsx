import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  History,
  Download,
  Upload,
  Database,
  Users,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { api } from '../services/api.js';
import { ActivityLog, User } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'roles' | 'backup' | 'system'>('audit');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedDump, setCopiedDump] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, usersRes] = await Promise.all([
          api.settings.getLogs(100),
          api.auth.getUsers(),
        ]);
        setLogs(logsRes.logs);
        setUsers(usersRes.users);
      } catch (err) {
        console.error('Failed to load settings data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadCsv = (type: string) => {
    const token = api.getToken();
    const url = `/api/data/export/${type}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parxcon_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pgDumpCommand = `docker exec -t parxcon-postgres pg_dump -U postgres parxcon_ops > parxcon_ops_backup_\$(date +%F).sql`;
  const pgRestoreCommand = `cat parxcon_ops_backup.sql | docker exec -i parxcon-postgres psql -U postgres -d parxcon_ops`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Settings & Operational Governance</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit logging, role-based access control, CSV exports, and database backup routines.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'audit', label: 'Operations Audit Log' },
          { id: 'roles', label: 'Users & Roles (RBAC)' },
          { id: 'backup', label: 'Export & PostgreSQL Backup' },
          { id: 'system', label: 'System Preferences' },
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

      {/* TAB 1: AUDIT LOG (Specification 21) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            Immutable audit record tracking every entity creation, commercial update, status change, AI action, and authentication event.
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Operator / Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity</th>
                    <th className="py-3.5 px-4">Details</th>
                    <th className="py-3.5 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                        {log.action === 'AI_ACTION' && <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                        <span>{log.userName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : log.action === 'PAYMENT'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400'
                              : log.action === 'DELETE'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                              : log.action === 'AI_ACTION'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md font-sans">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & RBAC (Specification 22) */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unrestricted system authority: manage users, settings, deletion of accounts/clients, financial invoices, and API credentials.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Manager</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full sales, client accounts, reports, pipeline adjustments, and task delegation capabilities across the business.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Employee</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scoped access: can interact exclusively with assigned accounts, allocated deals, and daily operational follow-ups.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Authorized Team Members
            </h3>
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                      <span className="text-slate-400 text-[11px]">{u.email}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & CSV EXPORT (Specification 24 & 25) */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* CSV Export Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Export Business Data (CSV)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Securely export business records for accounting, audits, and spreadsheet analysis. Confidential credential secrets are strictly excluded.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleDownloadCsv('sales')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 text-left text-xs font-semibold transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white">Export Deals & Pipeline</div>
                <div className="text-[10px] text-slate-400 mt-1">parxcon_deals.csv</div>
              </button>
              <button
                onClick={() => handleDownloadCsv('clients')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 text-left text-xs font-semibold transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white">Export Client Directory</div>
                <div className="text-[10px] text-slate-400 mt-1">parxcon_clients.csv</div>
              </button>
              <button
                onClick={() => handleDownloadCsv('payments')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 text-left text-xs font-semibold transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white">Export Payment Records</div>
                <div className="text-[10px] text-slate-400 mt-1">parxcon_payments.csv</div>
              </button>
              <button
                onClick={() => handleDownloadCsv('tasks')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950 text-left text-xs font-semibold transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white">Export Operational Tasks</div>
                <div className="text-[10px] text-slate-400 mt-1">parxcon_tasks.csv</div>
              </button>
            </div>
          </div>

          {/* Database Backup & pg_dump Procedure (Specification 25) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                PostgreSQL Automated Backup & pg_dump Procedures
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              When deployed via Docker on your VPS or server, database backups can be taken with standard PostgreSQL utilities without downtime.
            </p>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. Snapshot Backup Command (pg_dump):
                </span>
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs flex justify-between items-center">
                  <span className="overflow-x-auto select-all">{pgDumpCommand}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pgDumpCommand);
                      setCopiedDump(true);
                      setTimeout(() => setCopiedDump(false), 2000);
                    }}
                    className="p-1 hover:text-white text-slate-400 shrink-0 ml-2"
                  >
                    {copiedDump ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. Restoration Procedure (psql):
                </span>
                <div className="p-3 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto select-all">
                  {pgRestoreCommand}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM PREFERENCES */}
      {activeTab === 'system' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Operational Settings
          </h3>
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Operating Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Renewal Alert Intervals</label>
              <input
                type="text"
                disabled
                value="30, 15, 7, 1 days"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
