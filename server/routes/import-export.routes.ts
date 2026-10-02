import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

function arrayToCsv(items: any[], headers: string[]): string {
  if (!items || items.length === 0) return headers.join(',') + '\n';
  const csvLines = [headers.join(',')];

  for (const item of items) {
    const line = headers.map((header) => {
      const val = item[header] !== undefined && item[header] !== null ? String(item[header]) : '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvLines.push(line.join(','));
  }

  return csvLines.join('\n');
}

// GET /api/data/export/:type (sales | clients | payments | tasks)
router.get('/export/:type', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const type = req.params.type.toLowerCase();

  if (type === 'sales' || type === 'deals') {
    const deals = db.getDeals();
    const headers = ['id', 'dealName', 'clientName', 'service', 'dealValue', 'currency', 'stage', 'probability', 'expectedClosingDate', 'actualClosingDate'];
    const csv = arrayToCsv(deals, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=parxcon_deals.csv');
    return res.send(csv);
  }

  if (type === 'clients') {
    const clients = db.getClients();
    const headers = ['id', 'companyName', 'contactPerson', 'email', 'phone', 'city', 'country', 'industry', 'status', 'clientSince'];
    const csv = arrayToCsv(clients, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=parxcon_clients.csv');
    return res.send(csv);
  }

  if (type === 'payments') {
    const payments = db.getPayments();
    const headers = ['id', 'clientName', 'invoiceNumber', 'amount', 'currency', 'paymentDate', 'paymentMethod', 'referenceNo', 'notes'];
    const csv = arrayToCsv(payments, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=parxcon_payments.csv');
    return res.send(csv);
  }

  if (type === 'tasks') {
    const tasks = db.getTasks();
    const headers = ['id', 'title', 'clientName', 'priority', 'status', 'dueDate', 'assignedToName', 'description'];
    const csv = arrayToCsv(tasks, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=parxcon_tasks.csv');
    return res.send(csv);
  }

  return res.status(400).json({ error: 'Unsupported export type. Use sales, clients, payments, or tasks.' });
});

// POST /api/data/import/:type (leads | clients | deals)
router.post('/import/:type', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const type = req.params.type.toLowerCase();
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items must be a non-empty array of records.' });
  }

  let importedCount = 0;

  if (type === 'leads') {
    for (const item of items) {
      if (item.companyName && item.contactName) {
        db.createLead({
          companyName: item.companyName,
          contactName: item.contactName,
          phone: item.phone,
          email: item.email,
          leadSource: item.leadSource || 'OTHER',
          status: item.status || 'NEW',
          estimatedValue: Number(item.estimatedValue) || 0,
          notes: item.notes,
          createdBy: req.user!.name,
        });
        importedCount++;
      }
    }
  } else if (type === 'clients') {
    for (const item of items) {
      if (item.companyName && item.contactPerson && item.email) {
        db.createClient({
          companyName: item.companyName,
          contactPerson: item.contactPerson,
          email: item.email,
          phone: item.phone,
          city: item.city,
          country: item.country || 'India',
          industry: item.industry,
          status: item.status || 'ACTIVE',
          notes: item.notes,
          createdBy: req.user!.name,
        });
        importedCount++;
      }
    }
  } else if (type === 'deals') {
    for (const item of items) {
      if (item.dealName && item.clientId && item.dealValue) {
        db.createDeal({
          dealName: item.dealName,
          clientId: item.clientId,
          service: item.service || 'Service',
          dealValue: Number(item.dealValue),
          stage: item.stage || 'DISCOVERY',
          probability: Number(item.probability) || 50,
          createdBy: req.user!.name,
        });
        importedCount++;
      }
    }
  } else {
    return res.status(400).json({ error: 'Unsupported import type. Supported: leads, clients, deals.' });
  }

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'DataImport',
    details: `Imported ${importedCount} ${type} records into system`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, importedCount });
});

export default router;
