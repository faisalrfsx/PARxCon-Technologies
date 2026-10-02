import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/payments
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const payments = db.getPayments();
  return res.json({ payments });
});

// GET /api/payments/invoices
router.get('/invoices', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const invoices = db.getInvoices();
  return res.json({ invoices });
});

// GET /api/payments/outstanding
router.get('/outstanding', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const outstanding = db.getOutstandingSummary();
  return res.json(outstanding);
});

// POST /api/payments/invoices (Create invoice)
router.post('/invoices', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { clientId, invoiceNumber, invoiceAmount, dueDate } = req.body;
  if (!clientId || !invoiceNumber || invoiceAmount === undefined || !dueDate) {
    return res.status(400).json({ error: 'Client, Invoice Number, Invoice Amount, and Due Date are required.' });
  }

  const invoice = db.createInvoice({
    clientId,
    invoiceNumber,
    invoiceAmount: Number(invoiceAmount),
    dueDate,
    dealId: req.body.dealId,
    notes: req.body.notes,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Invoice',
    entityId: invoice.id,
    entityName: invoice.invoiceNumber,
    details: `Issued invoice ${invoice.invoiceNumber} for ₹${invoice.invoiceAmount.toLocaleString()} to ${invoice.clientName}`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ invoice });
});

// POST /api/payments (Record a payment)
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { clientId, amount, paymentMethod } = req.body;
  if (!clientId || amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid Client ID and Payment Amount (>0) are required.' });
  }

  const result = db.recordPayment({
    clientId,
    amount: Number(amount),
    paymentMethod,
    invoiceId: req.body.invoiceId,
    dealId: req.body.dealId,
    referenceNo: req.body.referenceNo,
    notes: req.body.notes,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'PAYMENT',
    entityType: 'Payment',
    entityId: result.payment.id,
    entityName: result.payment.clientName,
    details: `Recorded payment of ₹${Number(amount).toLocaleString()} via ${paymentMethod || 'Bank Transfer'} (${result.payment.referenceNo || 'No ref'})`,
    ipAddress: req.ip,
  });

  return res.status(201).json(result);
});

export default router;
