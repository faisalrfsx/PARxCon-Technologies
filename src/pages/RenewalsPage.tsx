import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  CreditCard,
} from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Renewal } from '../types/index.js';

export const RenewalsPage: React.FC = () => {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    service: '',
    provider: '',
    renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    cost: 5000,
    currency: 'INR',
    autoRenewal: false,
    owner: 'DevOps Lead',
    notes: '',
  });

  const fetchRenewals = async () => {
    try {
      const { renewals } = await api.renewals.getAll();
      setRenewals(renewals);
    } catch (err) {
      console.error('Failed to load renewals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const handleCreateRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.renewals.create(formData);
      setAddModalOpen(false);
      setFormData({
        service: '',
        provider: '',
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        cost: 5000,
        currency: 'INR',
        autoRenewal: false,
        owner: 'DevOps Lead',
        notes: '',
      });
      fetchRenewals();
    } catch (err: any) {
      alert(err.message || 'Failed to create renewal');
    }
  };

  const urgentRenewals = renewals.filter((r) => r.daysRemaining <= 7);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCw className="w-6 h-6 text-indigo-600" />
            <span>Renewal Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track domain names, hosting servers, SSL certificates, SaaS subscriptions, and software licenses with 30, 15, 7, and 1-day alerts.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Renewal Item</span>
        </button>
      </div>

      {/* Urgent Alert Banner */}
      {urgentRenewals.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-xs text-rose-800 dark:text-rose-300">
              {urgentRenewals.length} Renewal(s) Expiring within 7 Days!
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
              Verify payment methods or submit manual purchase orders to prevent service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Renewals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Service & Provider</th>
                <th className="py-3.5 px-4">Cost</th>
                <th className="py-3.5 px-4">Renewal Date</th>
                <th className="py-3.5 px-4">Countdown / Alert Window</th>
                <th className="py-3.5 px-4">Billing Mode</th>
                <th className="py-3.5 px-4">Responsible Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {renewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active renewal records tracked.
                  </td>
                </tr>
              ) : (
                renewals.map((r) => {
                  const isExpiringSoon = r.daysRemaining <= 7;
                  const isModerate = r.daysRemaining <= 15 && !isExpiringSoon;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {r.service}
                          </span>
                          <span className="text-slate-400 text-[11px]">{r.provider}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{r.cost.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(r.renewalDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isExpiringSoon
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : isModerate
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {r.daysRemaining <= 0
                              ? 'Due Today!'
                              : `${r.daysRemaining} days remaining`}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.autoRenewal
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {r.autoRenewal ? 'Auto-Renew' : 'Manual Payment'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {r.owner || 'System Admin'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Renewal Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Track Subscription or License Renewal"
        subtitle="Configure alerts (30, 15, 7, 1 days) for domain, SSL, or cloud service"
      >
        <form onSubmit={handleCreateRenewal} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Service / Subscription Name *
              </label>
              <input
                type="text"
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                placeholder="e.g. *.parxcon.com Wildcard SSL"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Provider / Vendor *
              </label>
              <input
                type="text"
                required
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g. DigiCert / Namecheap"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Renewal Date *
              </label>
              <input
                type="date"
                required
                value={formData.renewalDate}
                onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Annual / Cycle Cost (₹) *
              </label>
              <input
                type="number"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsible Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="DevOps Lead"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="autoRenewal"
                checked={formData.autoRenewal}
                onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="autoRenewal" className="font-semibold text-slate-700 dark:text-slate-300">
                Card Auto-Renewal is Enabled
              </label>
            </div>
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
              Save Renewal Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
