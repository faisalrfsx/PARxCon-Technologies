import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/leads
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const leads = db.getLeads(status);
  return res.json({ leads });
});

// GET /api/leads/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  return res.json({ lead });
});

// POST /api/leads
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { companyName, contactName } = req.body;
  if (!companyName || !contactName) {
    return res.status(400).json({ error: 'Company Name and Contact Name are required.' });
  }

  const lead = db.createLead({
    ...req.body,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Lead',
    entityId: lead.id,
    entityName: lead.companyName,
    details: `Added new lead "${lead.companyName}" from ${lead.leadSource} (Est: ₹${(lead.estimatedValue || 0).toLocaleString()})`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ lead });
});

// PUT /api/leads/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateLead(req.params.id, {
    ...req.body,
    updatedBy: req.user!.name,
  });

  if (!updated) return res.status(404).json({ error: 'Lead not found.' });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Lead',
    entityId: updated.id,
    entityName: updated.companyName,
    details: `Updated lead "${updated.companyName}" (Status: ${updated.status})`,
    ipAddress: req.ip,
  });

  return res.json({ lead: updated });
});

// DELETE /api/leads/:id
router.delete('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  const success = db.deleteLead(req.params.id);
  if (success) {
    db.logActivity({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'DELETE',
      entityType: 'Lead',
      entityId: lead.id,
      entityName: lead.companyName,
      details: `Deleted lead "${lead.companyName}"`,
      ipAddress: req.ip,
    });
  }
  return res.json({ success });
});

// POST /api/leads/:id/convert (Convert lead into active Client + Deal)
router.post('/:id/convert', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  // 1. Create or match client
  let client = lead.clientId ? db.getClientById(lead.clientId) : undefined;
  if (!client) {
    client = db.createClient({
      companyName: lead.companyName,
      contactPerson: lead.contactName,
      email: lead.email || `contact@${lead.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: lead.phone,
      country: lead.country,
      city: lead.city,
      industry: lead.industry,
      website: lead.website,
      status: 'ACTIVE',
      createdBy: req.user!.name,
    });
  }

  // 2. Create deal
  const dealValue = Number(req.body.dealValue) || lead.estimatedValue || 50000;
  const deal = db.createDeal({
    clientId: client.id,
    dealName: req.body.dealName || `${lead.companyName} Implementation`,
    service: req.body.service || 'Web / Software Solutions',
    dealValue,
    leadId: lead.id,
    stage: 'PROPOSAL',
    probability: 60,
    assignedToId: req.user!.id,
    assignedToName: req.user!.name,
    createdBy: req.user!.name,
  });

  // 3. Mark lead as Qualified or Won
  db.updateLead(lead.id, {
    status: 'QUALIFIED',
    clientId: client.id,
    updatedBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'STATUS_CHANGE',
    entityType: 'Lead',
    entityId: lead.id,
    entityName: lead.companyName,
    details: `Converted lead "${lead.companyName}" into Client & Deal "${deal.dealName}" (₹${deal.dealValue.toLocaleString()})`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, client, deal });
});

export default router;
