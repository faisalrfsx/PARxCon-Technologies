import { db } from '../db/database.js';
import { notificationService } from './notification.js';

class AutomationEngine {
  private timer: NodeJS.Timeout | null = null;

  start() {
    // Check scheduled renewals and daily tasks every 30 minutes
    this.timer = setInterval(() => {
      this.runHourlyChecks();
    }, 30 * 60 * 1000);

    // Initial check on boot
    this.runHourlyChecks();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runHourlyChecks() {
    this.checkRenewalAlerts();
  }

  // Check renewals approaching 30, 15, 7, 1 days
  checkRenewalAlerts() {
    const renewals = db.getRenewals();
    for (const r of renewals) {
      if (r.daysRemaining <= 7 && r.daysRemaining >= 0) {
        notificationService.notify({
          title: `⚠️ Renewal Alert: ${r.service}`,
          message: `${r.service} (${r.provider}) is expiring in ${r.daysRemaining} days (Cost: ${r.currency} ${r.cost.toLocaleString()}).`,
          type: r.daysRemaining <= 3 ? 'URGENT' : 'WARNING',
        });
      }
    }
  }

  // Morning Briefing Generator
  generateMorningBriefing() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayFollowups = db.getFollowups('today');
    const overdueFollowups = db.getFollowups('overdue');
    const overdueTasks = db.getTasks().filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'COMPLETED');
    const todayTasks = db.getTasks().filter((t) => t.dueDate && t.dueDate.startsWith(todayStr) && t.status !== 'COMPLETED');
    const outstanding = db.getOutstandingSummary();
    const upcomingRenewals = db.getRenewals().filter((r) => r.daysRemaining <= 15 && r.daysRemaining >= 0);

    const report = {
      timestamp: new Date().toISOString(),
      type: 'MORNING_BRIEFING',
      followupsDueToday: todayFollowups.map((f) => ({
        id: f.id,
        client: f.clientName || f.leadName,
        type: f.followupType,
        notes: f.notes,
      })),
      overdueFollowupsCount: overdueFollowups.length,
      tasksDueToday: todayTasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        assignedTo: t.assignedToName,
      })),
      overdueTasksCount: overdueTasks.length,
      totalOutstanding: outstanding.totalOutstanding,
      overdueInvoicesAmount: outstanding.overdueAmount,
      upcomingRenewals: upcomingRenewals.map((r) => ({
        service: r.service,
        daysRemaining: r.daysRemaining,
        cost: `${r.currency} ${r.cost}`,
      })),
    };

    return report;
  }

  // Evening Sales Summary Generator
  generateEveningSummary() {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const newLeads = db.getLeads().filter((l) => l.createdAt.startsWith(todayStr));
    const dealsUpdated = db.getDeals().filter((d) => d.updatedAt.startsWith(todayStr));
    const paymentsReceived = db.getPayments().filter((p) => p.paymentDate.startsWith(todayStr));
    const tomorrowFollowups = db.getFollowups().filter((f) => f.followupDate.startsWith(tomorrowStr) && f.status === 'SCHEDULED');
    const outstanding = db.getOutstandingSummary();

    const totalPaidToday = paymentsReceived.reduce((s, p) => s + p.amount, 0);

    return {
      timestamp: new Date().toISOString(),
      type: 'EVENING_SUMMARY',
      newLeadsCount: newLeads.length,
      newLeads: newLeads.map((l) => ({ company: l.companyName, source: l.leadSource, value: l.estimatedValue })),
      dealsUpdatedCount: dealsUpdated.length,
      paymentsReceivedToday: totalPaidToday,
      paymentsList: paymentsReceived.map((p) => ({ client: p.clientName, amount: p.amount, method: p.paymentMethod })),
      totalOutstanding: outstanding.totalOutstanding,
      tomorrowFollowupsCount: tomorrowFollowups.length,
      tomorrowFollowups: tomorrowFollowups.map((f) => ({ client: f.clientName || f.leadName, type: f.followupType, notes: f.notes })),
    };
  }

  // Weekly Analytical Report Generator
  generateWeeklyReport() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const leads = db.getLeads();
    const deals = db.getDeals();
    const payments = db.getPayments();
    const followups = db.getFollowups();

    const newLeads = leads.filter((l) => l.createdAt >= sevenDaysAgo);
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED' && l.updatedAt >= sevenDaysAgo);
    const proposalsSent = deals.filter((d) => (d.stage === 'PROPOSAL' || d.proposalDate) && d.updatedAt >= sevenDaysAgo);
    const negotiations = deals.filter((d) => d.stage === 'NEGOTIATION');
    const wonDeals = deals.filter((d) => d.stage === 'WON' && d.actualClosingDate && d.actualClosingDate >= sevenDaysAgo);
    const lostDeals = deals.filter((d) => d.stage === 'LOST' && d.updatedAt >= sevenDaysAgo);

    const wonRevenue = wonDeals.reduce((s, d) => s + d.dealValue, 0);
    const recentPayments = payments.filter((p) => p.paymentDate >= sevenDaysAgo);
    const revenueReceived = recentPayments.reduce((s, p) => s + p.amount, 0);

    const pipeline = db.getPipeline();
    const outstanding = db.getOutstandingSummary();

    const completedFollowups = followups.filter((f) => f.status === 'COMPLETED' && f.updatedAt >= sevenDaysAgo);
    const overdueFollowups = db.getFollowups('overdue');

    // Identify deals with no activity > 7 days
    const staleDeals = deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST' && d.updatedAt < sevenDaysAgo);

    return {
      newLeads: newLeads.length,
      qualified: qualifiedLeads.length,
      proposals: proposalsSent.length,
      negotiations: negotiations.length,
      won: wonDeals.length,
      lost: lostDeals.length,
      wonRevenue,
      revenueReceived,
      currentPipeline: pipeline.totalPipelineValue,
      weightedPipeline: pipeline.totalWeightedPipeline,
      outstanding: outstanding.totalOutstanding,
      followupsCompleted: completedFollowups.length,
      followupsOverdue: overdueFollowups.length,
      staleOpportunitiesCount: staleDeals.length,
      staleOpportunities: staleDeals.map((d) => ({
        id: d.id,
        dealName: d.dealName,
        client: d.clientName,
        stage: d.stage,
        value: d.dealValue,
        lastUpdated: d.updatedAt,
      })),
    };
  }
}

export const automationEngine = new AutomationEngine();
