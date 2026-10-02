import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Lead, LeadSource, LeadStatus } from '../types/index.js';

interface LeadsPageProps {
  onNavigate: (path: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    leadSource: 'LINKEDIN' as LeadSource,
    estimatedValue: 75000,
    city: '',
    industry: '',
    website: '',
    notes: '',
  });

  const [convertData, setConvertData] = useState({
    dealName: '',
    dealValue: 75000,
    service: 'Web Application & Cloud Services',
  });

  const fetchLeads = async () => {
    try {
      const { leads } = await api.leads.getAll(statusFilter);
      setLeads(leads);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.leads.create(formData);
      setAddModalOpen(false);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        leadSource: 'LINKEDIN',
        estimatedValue: 75000,
        city: '',
        industry: '',
        website: '',
        notes: '',
      });
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await api.leads.convert(selectedLead.id, convertData);
      setConvertModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
      onNavigate('/deals');
    } catch (err: any) {
      alert(err.message || 'Failed to convert lead');
    }
  };

  const openConvertModal = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertData({
      dealName: `${lead.companyName} Project`,
      dealValue: lead.estimatedValue || 75000,
      service: 'Web Application / Tech Implementation',
    });
    setConvertModalOpen(true);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.companyName.toLowerCase().includes(search.toLowerCase()) ||
      l.contactName.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase()))
  );

  const statuses: (LeadStatus | 'ALL')[] = [
    'ALL',
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'WON',
    'LOST',
    'ON_HOLD',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Lead Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture, qualify, and convert opportunities into active client engagements.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {statuses.map((st) => (
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

        {/* Search */}
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

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Company & Contact</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Est. Value</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          {lead.companyName}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          <span>{lead.contactName}</span>
                          {lead.email && <span>• {lead.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {lead.leadSource}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      ₹{(lead.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={lead.status} type="lead" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {lead.city ? `${lead.city}, ${lead.country}` : lead.country}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {lead.assignedToName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {lead.status !== 'WON' && (
                        <button
                          onClick={() => openConvertModal(lead)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 font-semibold text-[11px] transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                          Convert to Deal
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Sales Lead"
        subtitle="Capture new opportunity details and estimated project value"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
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
                placeholder="e.g. Acme Tech"
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
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@company.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Source
              </label>
              <select
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as LeadSource })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="LINKEDIN">LinkedIn</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="GOOGLE">Google</option>
                <option value="INDIAMART">IndiaMART</option>
                <option value="COLD_OUTREACH">Cold Outreach</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EXISTING_CLIENT">Existing Client</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Project Value (₹)
              </label>
              <input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai"
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
                placeholder="e.g. Manufacturing, Retail"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Requirement brief, expected milestones..."
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
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead to Deal & Client Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={`Convert "${selectedLead?.companyName}" into Deal & Client`}
        subtitle="This promotes the lead into an active Client account and creates an active sales deal in Proposal stage"
      >
        <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              required
              value={convertData.dealName}
              onChange={(e) => setConvertData({ ...convertData, dealName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service / Solution Description
            </label>
            <input
              type="text"
              required
              value={convertData.service}
              onChange={(e) => setConvertData({ ...convertData, service: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deal Value (₹) *
            </label>
            <input
              type="number"
              required
              value={convertData.dealValue}
              onChange={(e) => setConvertData({ ...convertData, dealValue: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setConvertModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              Confirm Conversion & Open Pipeline
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
