import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Client, ClientStatus } from '../types/index.js';

interface ClientsPageProps {
  onNavigate: (path: string) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    country: 'India',
    industry: '',
    website: '',
    status: 'ACTIVE' as ClientStatus,
    notes: '',
  });

  const fetchClients = async () => {
    try {
      const { clients } = await api.clients.getAll(search);
      setClients(clients);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { client } = await api.clients.create(formData);
      setAddModalOpen(false);
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        city: '',
        country: 'India',
        industry: '',
        website: '',
        status: 'ACTIVE',
        notes: '',
      });
      fetchClients();
      onNavigate(`/clients/${client.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create client');
    }
  };

  const filteredClients = clients.filter(
    (c) => statusFilter === 'ALL' || c.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Client Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain accounts, track relationships, and review consolidated 360° histories.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'ACTIVE', 'PROSPECT', 'INACTIVE', 'FORMER_CLIENT'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
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
            placeholder="Search company, contact..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Clients Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No clients found. Click "Add Client" to create one.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => onNavigate(`/clients/${client.id}`)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {client.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">
                        {client.companyName}
                      </h3>
                      <p className="text-[11px] text-slate-400">{client.industry || 'General'}</p>
                    </div>
                  </div>
                  <StatusBadge status={client.status} type="client" />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16">Contact:</span>
                    <span className="truncate">{client.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16">Email:</span>
                    <span className="truncate text-indigo-600 dark:text-indigo-400">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-400 w-16">Phone:</span>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-400 w-16">City:</span>
                      <span>{client.city}, {client.country}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">
                  Since {new Date(client.clientSince).toLocaleDateString()}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                  <span>Consolidated 360°</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create Client Account"
        subtitle="Add a new business account and contact profile"
      >
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. BlueStar Industries"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Ramesh Gupta"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@bluestar.in"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98200 11223"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Logistics"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
                <option value="FORMER_CLIENT">Former Client</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Account background, key stakeholders..."
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
              Save Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
