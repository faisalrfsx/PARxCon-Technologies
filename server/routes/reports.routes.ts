import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { automationEngine } from '../services/automation.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/sales
router.get('/sales', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const leads = db.getLeads();
  const deals = db.getDeals();
  const pipeline = db.getPipeline();

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
  const proposals = deals.filter((d) => d.stage === 'PROPOSAL').length;
  const wonDeals = deals.filter((d) => d.stage === 'WON').length;
  const lostDeals = deals.filter((d) => d.stage === 'LOST').length;

  const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : 0;

  return res.json({
    metrics: {
      totalLeads,
      qualifiedLeads,
      proposals,
      wonDeals,
      lostDeals,
      conversionRate: `${conversionRate}%`,
      wonRevenue: pipeline.wonRevenue,
      totalPipelineValue: pipeline.totalPipelineValue,
      weightedPipeline: pipeline.totalWeightedPipeline,
    },
    stageBreakdown: pipeline.stages,
  });
});

// GET /api/reports/payments
router.get('/payments', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const outstanding = db.getOutstandingSummary();
  const payments = db.getPayments();
  const invoices = db.getInvoices();

  return res.json({
    invoicedTotal: outstanding.totalInvoiced,
    receivedTotal: outstanding.totalReceived,
    outstandingTotal: outstanding.totalOutstanding,
    overdueTotal: outstanding.overdueAmount,
    recentPayments: payments.slice(0, 15),
    overdueInvoices: invoices.filter((i) => i.status === 'OVERDUE' || (i.status === 'PARTIALLY_PAID' && i.dueDate < new Date().toISOString().split('T')[0])),
    debtors: outstanding.debtors,
  });
});

// GET /api/reports/activity
router.get('/activity', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const followups = db.getFollowups();
  const tasks = db.getTasks();

  const calls = followups.filter((f) => f.followupType === 'CALL').length;
  const meetings = followups.filter((f) => f.followupType === 'MEETING').length;
  const emails = followups.filter((f) => f.followupType === 'EMAIL').length;
  const whatsapps = followups.filter((f) => f.followupType === 'WHATSAPP').length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;

  return res.json({
    calls,
    meetings,
    emails,
    whatsapps,
    completedTasks,
    pendingTasks,
    recentFollowups: followups.slice(0, 10),
  });
});

// GET /api/reports/weekly
router.get('/weekly', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const report = automationEngine.generateWeeklyReport();
  return res.json(report);
});

// GET /api/reports/morning-briefing
router.get('/morning-briefing', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const briefing = automationEngine.generateMorningBriefing();
  return res.json(briefing);
});

// GET /api/reports/evening-summary
router.get('/evening-summary', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const summary = automationEngine.generateEveningSummary();
  return res.json(summary);
});

export default router;
