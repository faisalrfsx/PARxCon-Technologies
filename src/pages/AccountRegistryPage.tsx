import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Building2,
  Lock,
} from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { AccountRegistry, AccountCategory, Client } from '../types/index.js';

export const AccountRegistryPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRegistry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    serviceName: '',
    category: 'CLOUD' as AccountCategory,
    url: '',
    username: '',
    owner: 'DevOps Lead',
    twoFactorEnabled: true,
    credentialManager: 'Bitwarden',
    credentialReference: '',
    associatedClientId: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [accRes, cliRes] = await Promise.all([
        api.accounts.getAll(),
        api.clients.getAll(),
      ]);
      setAccounts(accRes.accounts);
      setClients(cliRes.clients);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.accounts.create(formData);
      setAddModalOpen(false);
      setFormData({
        serviceName: '',
        category: 'CLOUD',
        url: '',
        username: '',
        owner: 'DevOps Lead',
        twoFactorEnabled: true,
        credentialManager: 'Bitwarden',
        credentialReference: '',
        associatedClientId: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to register account reference');
    }
  };

  const handleCopyRef = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories: (AccountCategory | 'ALL')[] = [
    'ALL',
    'CLOUD',
    'HOSTING',
    'DOMAIN',
    'EMAIL',
    'PAYMENT_GATEWAY',
    'CLIENT_ACCOUNT',
    'DEVELOPER_TOOL',
    'SOCIAL_MEDIA',
    'OTHER',
  ];

  const filteredAccounts = accounts.filter((a) => {
    const matchCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchSearch =
      a.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      (a.username && a.username.toLowerCase().includes(search.toLowerCase())) ||
      a.credentialReference.toLowerCase().includes(search.toLowerCase()) ||
      (a.associatedClientName && a.associatedClientName.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-indigo-600" />
              <span>Account Registry</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
              Zero Plaintext Secrets
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain secure pointers to external infrastructure and client credentials stored in enterprise password vaults.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account Reference</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-start gap-3.5 shadow-md">
        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-xs text-indigo-200">
            Security Compliance: Zero-Plaintext Reference Architecture
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
            To prevent credential leaks, PARxCON Ops never stores plaintext passwords in the business database.
            Instead, every entry points to an encrypted vault item in Bitwarden, 1Password, or Vaultwarden with 2FA status and authorized owner.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service, vault item..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Account Registry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No account records found.
          </div>
        ) : (
          filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {account.category}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">
                      {account.serviceName}
                    </h3>
                  </div>
                  {account.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" />
                      2FA Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <ShieldAlert className="w-3 h-3" />
                      No 2FA
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  {account.username && (
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Username/Email:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{account.username}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Owner:</span>
                    <span>{account.owner || 'DevOps Team'}</span>
                  </div>
                  {account.associatedClientName && (
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Client:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {account.associatedClientName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Vault Reference Pointer Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>{account.credentialManager} Vault Path</span>
                    <button
                      onClick={() => handleCopyRef(account.id, account.credentialReference)}
                      className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                      title="Copy vault item title"
                    >
                      {copiedId === account.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate select-all">
                    {account.credentialReference}
                  </p>
                </div>

                {account.notes && (
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {account.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {account.url ? (
                  <a
                    href={account.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Open Service Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px]">Direct / Internal</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Account Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Account Reference"
        subtitle="Securely record external service credentials via Bitwarden / 1Password vault path"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                placeholder="e.g. AWS Production Infrastructure"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AccountCategory })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="CLOUD">Cloud (AWS, GCP, Azure)</option>
                <option value="HOSTING">Hosting / VPS</option>
                <option value="DOMAIN">Domain / DNS</option>
                <option value="EMAIL">Email / Workspace</option>
                <option value="PAYMENT_GATEWAY">Payment Gateway (Razorpay, Stripe)</option>
                <option value="CLIENT_ACCOUNT">Client Account</option>
                <option value="DEVELOPER_TOOL">Developer Tool (GitHub, Sentry)</option>
                <option value="ANALYTICS">Analytics</option>
                <option value="CRM">CRM / Helpdesk</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username / Login Email
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="devops@parxcon.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Service Console URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://aws.amazon.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credential Manager
              </label>
              <select
                value={formData.credentialManager}
                onChange={(e) => setFormData({ ...formData, credentialManager: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Bitwarden">Bitwarden Enterprise</option>
                <option value="1Password">1Password Vault</option>
                <option value="Vaultwarden">Vaultwarden (Self-hosted)</option>
                <option value="KeePass">KeePass</option>
                <option value="Other">Other Vault</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vault Item / Secret Path *
              </label>
              <input
                type="text"
                required
                value={formData.credentialReference}
                onChange={(e) => setFormData({ ...formData, credentialReference: e.target.value })}
                placeholder="e.g. PARxCON Vault / AWS Production Root"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Client (Optional)
              </label>
              <select
                value={formData.associatedClientId}
                onChange={(e) => setFormData({ ...formData, associatedClientId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Internal Business Infrastructure</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="twoFactor"
                checked={formData.twoFactorEnabled}
                onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="twoFactor" className="font-semibold text-slate-700 dark:text-slate-300">
                2FA Multi-factor Authentication is Enabled
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Operational Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Hardware YubiKey required, rotation policy..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              Register Reference
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
