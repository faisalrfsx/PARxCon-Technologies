import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  ArrowRight,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Deal, DealStage, Client } from '../types/index.js';

interface DealsPageProps {
  onNavigate: (path: string) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({ onNavigate }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    dealName: '',
    service: '',
    dealValue: 100000,
    probability: 50,
    stage: 'DISCOVERY' as DealStage,
    expectedClosingDate: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [dealsRes, clientsRes] = await Promise.all([
        api.deals.getAll(stageFilter),
        api.clients.getAll(),
      ]);
      setDeals(dealsRes.deals);
      setClients(clientsRes.clients);
      if (clientsRes.clients.length > 0 && !formData.clientId) {
        setFormData((prev) => ({ ...prev, clientId: clientsRes.clients[0].id }));
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stageFilter]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.deals.create(formData);
      setAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create deal');
    }
  };

  const handleUpdateStage = async (dealId: string, newStage: DealStage) => {
    try {
      await api.deals.update(dealId, { stage: newStage });
      fetchData();
    } catch (err) {
      console.error('Failed to update deal stage:', err);
    }
  };

  const stages: (DealStage | 'ALL')[] = [
    'ALL',
    'DISCOVERY',
    'REQUIREMENT',
    'PROPOSAL',
    'NEGOTIATION',
    'VERBAL_CONFIRMATION',
    'WON',
    'LOST',
  ];

  const filteredDeals = deals.filter(
    (d) =>
      d.dealName.toLowerCase().includes(search.toLowerCase()) ||
      (d.clientName && d.clientName.toLowerCase().includes(search.toLowerCase())) ||
      d.service.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = filteredDeals.reduce((s, d) => s + d.dealValue, 0);
  const totalWeighted = filteredDeals.reduce((s, d) => s + (d.dealValue * d.probability) / 100, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <span>Sales & Deals Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track deal stages, closing probabilities, and automated weighted pipeline values.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stage Board
            </button>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
            Deals Count
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
            {filteredDeals.length}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
            Total Pipeline Value
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
            ₹{totalValue.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-bold block">
            Weighted Pipeline (Value × Prob)
          </span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
            ₹{Math.round(totalWeighted).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {stages.map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                stageFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals, clients..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Deal & Client</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Value</th>
                  <th className="py-3.5 px-4">Probability</th>
                  <th className="py-3.5 px-4">Weighted Value</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4 text-right">Stage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No deals found.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const weighted = (deal.dealValue * deal.probability) / 100;
                    return (
                      <tr key={deal.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {deal.dealName}
                            </span>
                            <span className="text-slate-400 text-[11px]">{deal.clientName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {deal.service}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          ₹{deal.dealValue.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {deal.probability}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{Math.round(weighted).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={deal.stage} type="deal" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={deal.stage}
                            onChange={(e) => handleUpdateStage(deal.id, e.target.value as DealStage)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-medium"
                          >
                            <option value="DISCOVERY">Discovery</option>
                            <option value="REQUIREMENT">Requirement</option>
                            <option value="PROPOSAL">Proposal</option>
                            <option value="NEGOTIATION">Negotiation</option>
                            <option value="VERBAL_CONFIRMATION">Verbal Confirmation</option>
                            <option value="WON">Won</option>
                            <option value="LOST">Lost</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STAGE BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
          {(['PROPOSAL', 'NEGOTIATION', 'VERBAL_CONFIRMATION', 'WON'] as DealStage[]).map((stg) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stg);
            const stageVal = stageDeals.reduce((s, d) => s + d.dealValue, 0);

            return (
              <div
                key={stg}
                className="bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {stg.replace(/_/g, ' ')} ({stageDeals.length})
                  </h3>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    ₹{stageVal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageDeals.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.dealName}</h4>
                        <span className="font-mono text-[10px] text-slate-400">{d.probability}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{d.clientName}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">
                          ₹{d.dealValue.toLocaleString()}
                        </span>
                        <select
                          value={d.stage}
                          onChange={(e) => handleUpdateStage(d.id, e.target.value as DealStage)}
                          className="text-[10px] p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        >
                          <option value="DISCOVERY">Move: Discovery</option>
                          <option value="PROPOSAL">Move: Proposal</option>
                          <option value="NEGOTIATION">Move: Negotiation</option>
                          <option value="VERBAL_CONFIRMATION">Move: Verbal</option>
                          <option value="WON">Move: Won</option>
                          <option value="LOST">Move: Lost</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Deal Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create New Sales Deal"
        subtitle="Add a commercial opportunity and associate it with a client"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Account *
            </label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactPerson})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              required
              value={formData.dealName}
              onChange={(e) => setFormData({ ...formData, dealName: e.target.value })}
              placeholder="e.g. Mobile Ordering App"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service Solution Brief *
            </label>
            <input
              type="text"
              required
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              placeholder="e.g. Next.js SaaS portal with ERP sync"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deal Value (₹) *
              </label>
              <input
                type="number"
                required
                value={formData.dealValue}
                onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closing Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="DISCOVERY">Discovery</option>
                <option value="REQUIREMENT">Requirement</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="VERBAL_CONFIRMATION">Verbal Confirmation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Closing Date
              </label>
              <input
                type="date"
                value={formData.expectedClosingDate}
                onChange={(e) => setFormData({ ...formData, expectedClosingDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
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
              Save Deal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
