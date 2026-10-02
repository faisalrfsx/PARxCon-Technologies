import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Followup, FollowupType, FollowupStatus, Client, Lead } from '../types/index.js';

export const FollowupsPage: React.FC = () => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'all'>('today');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    leadId: '',
    followupDate: new Date().toISOString().split('T')[0],
    followupType: 'CALL' as FollowupType,
    notes: '',
  });

  const [outcomeData, setOutcomeData] = useState({
    outcome: '',
    nextFollowup: '',
  });

  const fetchData = async () => {
    try {
      const [flwRes, cliRes, ledRes] = await Promise.all([
        api.followups.getAll(activeTab),
        api.clients.getAll(),
        api.leads.getAll(),
      ]);
      setFollowups(flwRes.followups);
      setClients(cliRes.clients);
      setLeads(ledRes.leads);

      if (cliRes.clients.length > 0 && !formData.clientId) {
        setFormData((prev) => ({ ...prev, clientId: cliRes.clients[0].id }));
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.followups.create(formData);
      setAddModalOpen(false);
      setFormData({
        clientId: clients[0]?.id || '',
        leadId: '',
        followupDate: new Date().toISOString().split('T')[0],
        followupType: 'CALL',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create follow-up');
    }
  };

  const handleCompleteWithOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    try {
      await api.followups.update(selectedFollowup.id, {
        status: 'COMPLETED',
        outcome: outcomeData.outcome,
        nextFollowup: outcomeData.nextFollowup || undefined,
      });

      // If user scheduled a next follow-up date, automatically create it
      if (outcomeData.nextFollowup) {
        await api.followups.create({
          clientId: selectedFollowup.clientId,
          leadId: selectedFollowup.leadId,
          followupDate: outcomeData.nextFollowup,
          followupType: selectedFollowup.followupType,
          notes: `Follow-up after: ${outcomeData.outcome}`,
        });
      }

      setOutcomeModalOpen(false);
      setSelectedFollowup(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up');
    }
  };

  const getTypeIcon = (type: FollowupType) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-4 h-4 text-blue-500" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-indigo-500" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'MEETING':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-600" />
            <span>Follow-up Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain sales momentum, schedule touchpoints, and log client discussion outcomes.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* Tabs (Today, Overdue, Upcoming, All) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'today', label: "Today's Follow-ups" },
          { id: 'overdue', label: 'Overdue Follow-ups' },
          { id: 'upcoming', label: 'Upcoming Follow-ups' },
          { id: 'all', label: 'All Follow-ups' },
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

      {/* Follow-up Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No follow-ups found in this view.
          </div>
        ) : (
          followups.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {getTypeIcon(f.followupType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                        {f.clientName || f.leadName || 'Contact Follow-up'}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {f.followupType.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={f.status} type="task" />
                </div>

                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {f.notes}
                </div>

                {f.outcome && (
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Outcome: {f.outcome}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium text-[11px]">
                  Scheduled: {new Date(f.followupDate).toLocaleDateString()}
                </span>

                {f.status !== 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setSelectedFollowup(f);
                      setOutcomeData({ outcome: '', nextFollowup: '' });
                      setOutcomeModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 font-semibold text-[11px] transition-colors border border-indigo-200 dark:border-indigo-800"
                  >
                    Log Outcome & Close
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Schedule Follow-up"
        subtitle="Set reminder to call, message, or meet with a lead or client"
      >
        <form onSubmit={handleCreateFollowup} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Client
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">None / Lead Only</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Date *
              </label>
              <input
                type="date"
                required
                value={formData.followupDate}
                onChange={(e) => setFormData({ ...formData, followupDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Channel / Type
              </label>
              <select
                value={formData.followupType}
                onChange={(e) => setFormData({ ...formData, followupType: e.target.value as FollowupType })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="MEETING">Meeting</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="PROPOSAL_FOLLOWUP">Proposal Follow-up</option>
                <option value="PAYMENT_FOLLOWUP">Payment Follow-up</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Follow-up Agenda / Notes *
            </label>
            <textarea
              rows={3}
              required
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Call Ahmed Khan to review staging feedback and discuss release date..."
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
              Schedule Follow-up
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Outcome Modal */}
      <Modal
        isOpen={outcomeModalOpen}
        onClose={() => setOutcomeModalOpen(false)}
        title="Log Discussion Outcome"
        subtitle={`Record feedback for follow-up with ${selectedFollowup?.clientName || selectedFollowup?.leadName}`}
      >
        <form onSubmit={handleCompleteWithOutcome} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discussion Outcome Brief *
            </label>
            <textarea
              rows={3}
              required
              value={outcomeData.outcome}
              onChange={(e) => setOutcomeData({ ...outcomeData, outcome: e.target.value })}
              placeholder="e.g. Client approved milestone 1, requested revised quotation for module 2..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Schedule Next Follow-up (Optional)
            </label>
            <input
              type="date"
              value={outcomeData.nextFollowup}
              onChange={(e) => setOutcomeData({ ...outcomeData, nextFollowup: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOutcomeModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              Mark Completed & Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
