import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Search,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../services/api.js';
import { Payment, Invoice, Client, PaymentMethod } from '../types/index.js';

interface PaymentsPageProps {
  onNavigate: (path: string) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [outstandingSummary, setOutstandingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    clientId: '',
    invoiceId: '',
    amount: 25000,
    paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
    referenceNo: '',
    notes: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    invoiceAmount: 50000,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [payRes, invRes, cliRes, outRes] = await Promise.all([
        api.payments.getAll(),
        api.payments.getInvoices(),
        api.clients.getAll(),
        api.payments.getOutstanding(),
      ]);
      setPayments(payRes.payments);
      setInvoices(invRes.invoices);
      setClients(cliRes.clients);
      setOutstandingSummary(outRes);

      if (cliRes.clients.length > 0) {
        if (!paymentForm.clientId) setPaymentForm((p) => ({ ...p, clientId: cliRes.clients[0].id }));
        if (!invoiceForm.clientId) setInvoiceForm((i) => ({ ...i, clientId: cliRes.clients[0].id }));
      }
    } catch (err) {
      console.error('Failed to load payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.payments.recordPayment(paymentForm);
      setPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.payments.createInvoice(invoiceForm);
      setInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  // Compute pending amount per invoice by summing all payments against that invoice
  const getInvoicePending = (inv: Invoice) => {
    const invPayments = payments.filter((p) => p.invoiceId === inv.id);
    const paid = invPayments.reduce((s, p) => s + p.amount, 0);
    return Math.max(0, inv.invoiceAmount - paid);
  };

  const getInvoicePaid = (inv: Invoice) => {
    const invPayments = payments.filter((p) => p.invoiceId === inv.id);
    return invPayments.reduce((s, p) => s + p.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <span>Payments & Collections</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated pending calculations (Invoice Amount - Total Payments), invoices, and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInvoiceModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shadow-2xs"
          >
            + Create Invoice
          </button>
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {outstandingSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
              Total Invoiced
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
              ₹{outstandingSummary.totalInvoiced.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold block">
              Total Collections Received
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
              ₹{outstandingSummary.totalReceived.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
              Outstanding Balance
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
              ₹{outstandingSummary.totalOutstanding.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-rose-500 uppercase tracking-wider font-bold block">
              Overdue Collections
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 block mt-0.5">
              ₹{outstandingSummary.overdueAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Invoices & Outstanding ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Invoice Amount</th>
                  <th className="py-3.5 px-4">Paid to Date</th>
                  <th className="py-3.5 px-4">Pending (Auto-calc)</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const paid = getInvoicePaid(inv);
                    const pending = getInvoicePending(inv);
                    const isOverdue = pending > 0 && inv.dueDate < new Date().toISOString().split('T')[0];

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {inv.clientName}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          ₹{inv.invoiceAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                          ₹{paid.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-black">
                          <span className={pending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                            ₹{pending.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={isOverdue ? 'OVERDUE' : inv.status} type="payment" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {pending > 0 && (
                            <button
                              onClick={() => {
                                setPaymentForm({
                                  clientId: inv.clientId,
                                  invoiceId: inv.id,
                                  amount: pending,
                                  paymentMethod: 'BANK_TRANSFER',
                                  referenceNo: '',
                                  notes: `Settlement for ${inv.invoiceNumber}`,
                                });
                                setPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-400 font-semibold text-[11px] transition-colors border border-emerald-200 dark:border-emerald-800"
                            >
                              Pay Balance
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Invoice Ref</th>
                  <th className="py-3.5 px-4">Payment Ref #</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {pay.clientName}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        +₹{pay.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {pay.invoiceNumber || 'Direct'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {pay.referenceNo || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {pay.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Client Payment"
        subtitle="Receipt confirmation will automatically adjust outstanding invoice balances"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Account *
            </label>
            <select
              required
              value={paymentForm.clientId}
              onChange={(e) => setPaymentForm({ ...paymentForm, clientId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Received (₹) *
            </label>
            <input
              type="number"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="STRIPE">Stripe / Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank / UTR Reference #
              </label>
              <input
                type="text"
                value={paymentForm.referenceNo}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                placeholder="e.g. HDFC-RTGS-998811"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Milestone advance, retainer payment..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              Confirm Payment Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Generate Client Invoice"
        subtitle="Issue commercial billing invoice for client settlement"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Account *
            </label>
            <select
              required
              value={invoiceForm.clientId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
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
                Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={invoiceForm.invoiceAmount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceAmount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Due Date *
            </label>
            <input
              type="date"
              required
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInvoiceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
