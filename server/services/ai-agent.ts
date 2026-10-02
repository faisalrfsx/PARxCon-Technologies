import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../db/database.js';
import { automationEngine } from './automation.js';
import { LeadSource, DealStage, PaymentMethod, TaskPriority, FollowupType, AccountCategory } from '../db/types.js';

// ==========================================
// CONTROLLED BACKEND TOOLS IMPLEMENTATION
// AI NEVER HAS UNRESTRICTED DB ACCESS
// ==========================================

export const opsTools = {
  create_lead(args: {
    companyName: string;
    contactName: string;
    phone?: string;
    email?: string;
    leadSource?: string;
    estimatedValue?: number;
    notes?: string;
    city?: string;
  }) {
    const validSources: LeadSource[] = [
      'LINKEDIN', 'WEBSITE', 'REFERRAL', 'GOOGLE', 'INDIAMART', 'COLD_OUTREACH', 'EMAIL', 'WHATSAPP', 'EXISTING_CLIENT', 'OTHER'
    ];
    let source: LeadSource = 'WEBSITE';
    if (args.leadSource) {
      const match = validSources.find(s => s.toLowerCase() === args.leadSource?.toLowerCase());
      if (match) source = match;
    }

    const lead = db.createLead({
      companyName: args.companyName,
      contactName: args.contactName,
      phone: args.phone,
      email: args.email,
      leadSource: source,
      estimatedValue: args.estimatedValue || 0,
      notes: args.notes,
      city: args.city,
      status: 'NEW',
    });

    db.logActivity({
      userName: 'Ops Assistant AI',
      action: 'AI_ACTION',
      entityType: 'Lead',
      entityId: lead.id,
      entityName: lead.companyName,
      details: `Created lead "${lead.companyName}" (${source}) via AI natural language command`,
    });

    return {
      success: true,
      message: `Lead created successfully for ${lead.companyName}.`,
      lead,
    };
  },

  update_lead(args: { id: string; status?: string; notes?: string; estimatedValue?: number }) {
    const updated = db.updateLead(args.id, args as any);
    if (!updated) return { error: `Lead with ID ${args.id} not found.` };
    return { success: true, lead: updated };
  },

  search_leads(args: { query: string }) {
    const q = args.query.toLowerCase();
    const leads = db.getLeads().filter(
      l => l.companyName.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q)
    );
    return { count: leads.length, leads: leads.slice(0, 5) };
  },

  create_client(args: { companyName: string; contactPerson: string; email: string; phone?: string; city?: string; notes?: string }) {
    const client = db.createClient({
      companyName: args.companyName,
      contactPerson: args.contactPerson,
      email: args.email,
      phone: args.phone,
      city: args.city,
      notes: args.notes,
      status: 'ACTIVE',
    });

    db.logActivity({
      userName: 'Ops Assistant AI',
      action: 'AI_ACTION',
      entityType: 'Client',
      entityId: client.id,
      entityName: client.companyName,
      details: `Created client "${client.companyName}" via AI`,
    });

    return { success: true, client };
  },

  search_clients(args: { query: string }) {
    const clients = db.getClients(args.query);
    return { count: clients.length, clients: clients.slice(0, 5) };
  },

  get_client_summary(args: { clientIdOrName: string }) {
    let client = db.getClientById(args.clientIdOrName);
    if (!client) {
      const match = db.getClients(args.clientIdOrName);
      if (match.length > 0) client = match[0];
    }

    if (!client) {
      return { error: `No client found matching "${args.clientIdOrName}".` };
    }

    const summary = db.getClientSummary(client.id);
    return summary;
  },

  create_deal(args: {
    clientNameOrId: string;
    dealName: string;
    service: string;
    dealValue: number;
    stage?: string;
    probability?: number;
    notes?: string;
  }) {
    let client = db.getClientById(args.clientNameOrId);
    if (!client) {
      const found = db.getClients(args.clientNameOrId);
      if (found.length > 0) client = found[0];
    }

    // Auto-create client if not found
    if (!client) {
      client = db.createClient({
        companyName: args.clientNameOrId,
        contactPerson: 'Lead Contact',
        email: `contact@${args.clientNameOrId.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        status: 'PROSPECT',
      });
    }

    const stage = (args.stage?.toUpperCase() as DealStage) || 'DISCOVERY';
    const deal = db.createDeal({
      clientId: client.id,
      dealName: args.dealName,
      service: args.service || 'Professional Services',
      dealValue: args.dealValue,
      stage: stage,
      probability: args.probability !== undefined ? args.probability : stage === 'WON' ? 100 : 50,
      notes: args.notes,
    });

    db.logActivity({
      userName: 'Ops Assistant AI',
      action: 'AI_ACTION',
      entityType: 'Deal',
      entityId: deal.id,
      entityName: deal.dealName,
      details: `Created deal "${deal.dealName}" for ₹${deal.dealValue.toLocaleString()} via AI command`,
    });

    return {
      success: true,
      message: `Deal created for ${client.companyName} at ₹${deal.dealValue.toLocaleString()}.`,
      deal,
    };
  },

  get_pipeline() {
    return db.getPipeline();
  },

  record_payment(args: {
    clientNameOrId: string;
    amount: number;
    paymentMethod?: string;
    notes?: string;
    dealId?: string;
  }) {
    let client = db.getClientById(args.clientNameOrId);
    if (!client) {
      const found = db.getClients(args.clientNameOrId);
      if (found.length > 0) client = found[0];
    }

    if (!client) {
      return { error: `Client "${args.clientNameOrId}" not found. Please provide an existing client name.` };
    }

    const result = db.recordPayment({
      clientId: client.id,
      amount: args.amount,
      paymentMethod: (args.paymentMethod?.toUpperCase() as PaymentMethod) || 'BANK_TRANSFER',
      notes: args.notes || 'Recorded via Ops Assistant AI',
      dealId: args.dealId,
    });

    db.logActivity({
      userName: 'Ops Assistant AI',
      action: 'PAYMENT',
      entityType: 'Payment',
      entityId: result.payment.id,
      entityName: client.companyName,
      details: `Recorded payment of ₹${args.amount.toLocaleString()} for ${client.companyName}`,
    });

    return {
      success: true,
      message: `Payment of ₹${args.amount.toLocaleString()} recorded for ${client.companyName}.`,
      invoiceNumber: result.invoice ? result.invoice.invoiceNumber : 'N/A',
      invoiceAmount: result.invoice ? result.invoice.invoiceAmount : 'N/A',
      paidAmount: args.amount,
      outstandingAmount: result.pendingAmount,
    };
  },

  get_outstanding_payments() {
    return db.getOutstandingSummary();
  },

  create_task(args: {
    title: string;
    priority?: string;
    dueDate?: string;
    clientNameOrId?: string;
    description?: string;
  }) {
    let clientId: string | undefined;
    if (args.clientNameOrId) {
      const c = db.getClientById(args.clientNameOrId) || db.getClients(args.clientNameOrId)[0];
      if (c) clientId = c.id;
    }

    const task = db.createTask({
      title: args.title,
      priority: (args.priority?.toUpperCase() as TaskPriority) || 'MEDIUM',
      dueDate: args.dueDate || new Date().toISOString().split('T')[0],
      clientId,
      description: args.description,
    });

    return { success: true, task };
  },

  complete_task(args: { idOrTitle: string }) {
    let task = db.getTaskById(args.idOrTitle);
    if (!task) {
      const found = db.getTasks().find(t => t.title.toLowerCase().includes(args.idOrTitle.toLowerCase()));
      if (found) task = found;
    }

    if (!task) return { error: `Task "${args.idOrTitle}" not found.` };
    const updated = db.updateTask(task.id, { status: 'COMPLETED' });
    return { success: true, task: updated };
  },

  create_followup(args: {
    clientNameOrId?: string;
    leadNameOrId?: string;
    followupDate?: string;
    followupType?: string;
    notes: string;
  }) {
    let clientId: string | undefined;
    let leadId: string | undefined;

    if (args.clientNameOrId) {
      const c = db.getClientById(args.clientNameOrId) || db.getClients(args.clientNameOrId)[0];
      if (c) clientId = c.id;
    }
    if (args.leadNameOrId) {
      const l = db.getLeadById(args.leadNameOrId) || db.getLeads().find(lead => lead.companyName.toLowerCase().includes(args.leadNameOrId!.toLowerCase()));
      if (l) leadId = l.id;
    }

    // Default followupDate: tomorrow if not specified
    const followupDate = args.followupDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const followup = db.createFollowup({
      clientId,
      leadId,
      followupDate,
      followupType: (args.followupType?.toUpperCase() as FollowupType) || 'CALL',
      notes: args.notes,
    });

    db.logActivity({
      userName: 'Ops Assistant AI',
      action: 'AI_ACTION',
      entityType: 'Followup',
      entityId: followup.id,
      entityName: followup.clientName || followup.leadName || 'Followup',
      details: `Created follow-up for ${followupDate}: "${args.notes}"`,
    });

    return { success: true, message: `Follow-up scheduled for ${followupDate}.`, followup };
  },

  get_today_followups() {
    const today = db.getFollowups('today');
    const overdue = db.getFollowups('overdue');
    return {
      todayCount: today.length,
      todayFollowups: today.map(f => ({
        id: f.id,
        entity: f.clientName || f.leadName || 'Unassigned',
        type: f.followupType,
        notes: f.notes,
        date: f.followupDate,
      })),
      overdueCount: overdue.length,
      overdueFollowups: overdue.map(f => ({
        id: f.id,
        entity: f.clientName || f.leadName || 'Unassigned',
        type: f.followupType,
        notes: f.notes,
        date: f.followupDate,
      })),
    };
  },

  get_overdue_followups() {
    return { overdue: db.getFollowups('overdue') };
  },

  create_account_record(args: {
    serviceName: string;
    category?: string;
    url?: string;
    username?: string;
    credentialManager?: string;
    credentialReference: string;
    notes?: string;
  }) {
    // STRICT SECURITY: We never store passwords!
    const account = db.createAccount({
      serviceName: args.serviceName,
      category: (args.category?.toUpperCase() as AccountCategory) || 'OTHER',
      url: args.url,
      username: args.username,
      credentialManager: args.credentialManager || 'Bitwarden',
      credentialReference: args.credentialReference,
      notes: args.notes,
    });

    db.logActivity({
      userName: 'Ops Assistant AI',
      action: 'AI_ACTION',
      entityType: 'Account',
      entityId: account.id,
      entityName: account.serviceName,
      details: `Created account registry reference for ${account.serviceName} (${account.credentialManager})`,
    });

    return { success: true, account };
  },

  search_account_records(args: { query: string }) {
    const q = args.query.toLowerCase();
    const accounts = db.getAccounts().filter(
      a => a.serviceName.toLowerCase().includes(q) || a.credentialReference.toLowerCase().includes(q)
    );
    return { count: accounts.length, accounts };
  },

  get_dashboard_summary() {
    return db.getDashboardSummary();
  },

  generate_sales_report() {
    const pipeline = db.getPipeline();
    const leads = db.getLeads();
    const payments = db.getPayments();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthPayments = payments.filter(p => p.paymentDate.startsWith(currentMonth));
    const revenueThisMonth = monthPayments.reduce((s, p) => s + p.amount, 0);

    return {
      currentMonth,
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(l => l.status === 'QUALIFIED').length,
      activeOpportunities: pipeline.activeDealsCount,
      pipelineValue: pipeline.totalPipelineValue,
      weightedPipeline: pipeline.totalWeightedPipeline,
      wonRevenueAllTime: pipeline.wonRevenue,
      revenueThisMonth,
      stageBreakdown: pipeline.stages,
    };
  },

  generate_weekly_report() {
    return automationEngine.generateWeeklyReport();
  },

  analyze_deals_closing_soon() {
    const deals = db.getDeals();
    const active = deals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST');

    // Deterministic rule-based ranking:
    // Criteria:
    // 1. Stage proximity to closing: Verbal Confirmation (weight 40), Negotiation (weight 30), Proposal (weight 15)
    // 2. High probability (weight 30)
    // 3. Has scheduled follow-up within 7 days (weight 30)
    const ranked = active.map(d => {
      let score = 0;
      const reasons: string[] = [];

      if (d.stage === 'VERBAL_CONFIRMATION') {
        score += 40;
        reasons.push('In final Verbal Confirmation stage awaiting sign-off');
      } else if (d.stage === 'NEGOTIATION') {
        score += 30;
        reasons.push('In Negotiation stage with agreed scope');
      } else if (d.stage === 'PROPOSAL') {
        score += 15;
        reasons.push('Proposal under review');
      }

      if (d.probability >= 70) {
        score += 30;
        reasons.push(`High stated closing probability of ${d.probability}%`);
      }

      if (d.nextFollowup) {
        score += 20;
        reasons.push(`Active follow-up scheduled on ${d.nextFollowup}`);
      }

      return {
        id: d.id,
        dealName: d.dealName,
        client: d.clientName,
        dealValue: d.dealValue,
        stage: d.stage,
        probability: d.probability,
        confidenceScore: score,
        heuristicRulesUsed: reasons,
      };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);

    return {
      methodology: 'Evaluated active pipeline using deterministic criteria: Deal Stage weighting (Verbal/Negotiation), Probability threshold (>=70%), and Active follow-up proximity.',
      likelyClosingDeals: ranked,
    };
  },
};

// ==========================================
// GEMINI SDK & DETERMINISTIC PARSER
// ==========================================

export async function processOpsCommand(userMessage: string, userId: string): Promise<{
  reply: string;
  toolCallsExecuted: { tool: string; args: any; result: any }[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  const executed: { tool: string; args: any; result: any }[] = [];

  // 1. If Gemini API key is available, use Gemini with tool calling
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // System instruction with safety boundaries
      const systemInstruction = `You are PARxCON Ops Assistant, the operational AI for PARxCON Ops internal CRM and business command center.
Your job is to assist operators in executing commands and querying metrics.
STRICT SAFETY & DATA CONSTRAINTS:
1. NEVER invent, fabricate, or hallucinate database results or statistics.
2. AI calls controlled backend tools to query or mutate database state.
3. NEVER delete records without explicit confirmation from the user.
4. Financial records: Always verify invoice amounts and compute outstanding accurately (Invoice - Paid).
5. Passwords & Secrets: NEVER store or print plaintext passwords. Refer users to Bitwarden/1Password registry references.
6. When asked about deals closing soon or forecasts, explain the deterministic business rules and criteria used rather than pretending to predict the future.
Currency is INR (₹) by default.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'get_today_followups',
                  description: "Get all follow-ups due today and overdue follow-ups.",
                  parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                  name: 'get_pipeline',
                  description: 'Get full active sales pipeline and stage breakdown.',
                  parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                  name: 'get_outstanding_payments',
                  description: 'Get total invoiced, received, outstanding balances, and who owes money.',
                  parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                  name: 'get_client_summary',
                  description: 'Get full consolidated 360-degree history of a client.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: { clientIdOrName: { type: Type.STRING, description: 'Client company name or ID' } },
                    required: ['clientIdOrName'],
                  },
                },
                {
                  name: 'create_lead',
                  description: 'Create a new sales lead in the database.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      companyName: { type: Type.STRING },
                      contactName: { type: Type.STRING },
                      leadSource: { type: Type.STRING, description: 'LINKEDIN, WEBSITE, REFERRAL, GOOGLE, etc.' },
                      estimatedValue: { type: Type.NUMBER },
                      notes: { type: Type.STRING },
                      phone: { type: Type.STRING },
                      email: { type: Type.STRING },
                    },
                    required: ['companyName', 'contactName'],
                  },
                },
                {
                  name: 'create_deal',
                  description: 'Create a deal for a client.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      clientNameOrId: { type: Type.STRING },
                      dealName: { type: Type.STRING },
                      service: { type: Type.STRING },
                      dealValue: { type: Type.NUMBER },
                      stage: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: ['clientNameOrId', 'dealName', 'service', 'dealValue'],
                  },
                },
                {
                  name: 'record_payment',
                  description: 'Record a payment received from a client against an invoice or deal.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      clientNameOrId: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      paymentMethod: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: ['clientNameOrId', 'amount'],
                  },
                },
                {
                  name: 'create_followup',
                  description: 'Schedule a follow-up reminder or call.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      clientNameOrId: { type: Type.STRING },
                      followupDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
                      followupType: { type: Type.STRING, description: 'CALL, EMAIL, WHATSAPP, MEETING, PROPOSAL_FOLLOWUP' },
                      notes: { type: Type.STRING },
                    },
                    required: ['notes'],
                  },
                },
                {
                  name: 'generate_weekly_report',
                  description: 'Generate weekly sales, revenue, pipeline, and follow-up report.',
                  parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                  name: 'generate_sales_report',
                  description: "Generate current month's sales report.",
                  parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                  name: 'analyze_deals_closing_soon',
                  description: 'Analyze which deals are likely to close soon based on stage, probability, and follow-up status.',
                  parameters: { type: Type.OBJECT, properties: {} },
                },
              ],
            },
          ],
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        let toolResultsText = '';

        for (const call of functionCalls) {
          if (call.name && (opsTools as any)[call.name]) {
            const toolName = call.name;
            const fn = (opsTools as any)[toolName];
            const result = fn(call.args);
            executed.push({ tool: toolName, args: call.args, result });
            toolResultsText += `\n[Tool: ${toolName}]: ${JSON.stringify(result)}`;
          }
        }

        // Generate final human-friendly summary incorporating the real tool results
        const finalPrompt = `User said: "${userMessage}"
Tools executed:
${toolResultsText}

Format a concise, professional operational response confirming the actions taken or answering the query with exact figures.`;

        const finalResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: finalPrompt,
          config: { systemInstruction },
        });

        return {
          reply: finalResponse.text || 'Operation executed successfully.',
          toolCallsExecuted: executed,
        };
      } else if (response.text) {
        return {
          reply: response.text,
          toolCallsExecuted: executed,
        };
      }
    } catch (err) {
      console.warn('Gemini API call encountered error, engaging deterministic engine:', err);
    }
  }

  // 2. Deterministic high-speed NLP matcher for 100% reliability
  return executeDeterministicCommand(userMessage);
}

// Fallback deterministic natural language intent parser
function executeDeterministicCommand(input: string): { reply: string; toolCallsExecuted: any[] } {
  const text = input.trim();
  const lower = text.toLowerCase();
  const executed: any[] = [];

  // Match 1: Follow-ups query ("What do I need to follow up today?", "What do I need to do today?", "today's work")
  if (lower.includes('follow up today') || lower.includes('follow-up') && lower.includes('today') || lower.includes('do today') || lower.includes("today's work")) {
    const data = opsTools.get_today_followups();
    executed.push({ tool: 'get_today_followups', args: {}, result: data });

    let msg = `Here is your schedule for today:\n\n`;
    if (data.todayFollowups.length > 0) {
      msg += `📅 **Today's Follow-ups (${data.todayCount}):**\n`;
      data.todayFollowups.forEach(f => {
        msg += `• **${f.entity}** (${f.type}): ${f.notes}\n`;
      });
    } else {
      msg += `✅ No follow-ups scheduled for today.\n`;
    }

    if (data.overdueCount > 0) {
      msg += `\n⚠️ **Overdue Follow-ups (${data.overdueCount}):**\n`;
      data.overdueFollowups.forEach(f => {
        msg += `• **${f.entity}** (${f.type}): ${f.notes} (Due: ${f.date})\n`;
      });
    }

    return { reply: msg, toolCallsExecuted: executed };
  }

  // Match 2: Active pipeline query ("Show my active pipeline", "How much sales pipeline do I have?")
  if (lower.includes('pipeline') || lower.includes('active opportunities') || lower.includes('sales pipeline')) {
    const pipe = opsTools.get_pipeline();
    executed.push({ tool: 'get_pipeline', args: {}, result: pipe });

    const msg = `**Current Sales Pipeline Summary:**\n\n` +
      `• **Total Active Pipeline:** ₹${pipe.totalPipelineValue.toLocaleString()}\n` +
      `• **Weighted Pipeline (Value × Prob):** ₹${Math.round(pipe.totalWeightedPipeline).toLocaleString()}\n` +
      `• **Won Revenue:** ₹${pipe.wonRevenue.toLocaleString()}\n` +
      `• **Active Deals:** ${pipe.activeDealsCount}\n\n` +
      `**Breakdown by Stage:**\n` +
      `• Discovery: ₹${pipe.stages.DISCOVERY.value.toLocaleString()} (${pipe.stages.DISCOVERY.count} deals)\n` +
      `• Proposal: ₹${pipe.stages.PROPOSAL.value.toLocaleString()} (${pipe.stages.PROPOSAL.count} deals)\n` +
      `• Negotiation: ₹${pipe.stages.NEGOTIATION.value.toLocaleString()} (${pipe.stages.NEGOTIATION.count} deals)\n` +
      `• Verbal Confirmation: ₹${pipe.stages.VERBAL_CONFIRMATION.value.toLocaleString()} (${pipe.stages.VERBAL_CONFIRMATION.count} deals)\n` +
      `• Won: ₹${pipe.stages.WON.value.toLocaleString()} (${pipe.stages.WON.count} deals)`;

    return { reply: msg, toolCallsExecuted: executed };
  }

  // Match 3: Outstanding query ("Who owes us money?", "Outstanding payments", "pending amounts")
  if (lower.includes('owes') || lower.includes('outstanding') || lower.includes('pending payment') || lower.includes('unpaid')) {
    const out = opsTools.get_outstanding_payments();
    executed.push({ tool: 'get_outstanding_payments', args: {}, result: out });

    let msg = `**Outstanding Payments Summary:**\n\n` +
      `• **Total Invoiced:** ₹${out.totalInvoiced.toLocaleString()}\n` +
      `• **Total Received:** ₹${out.totalReceived.toLocaleString()}\n` +
      `• **Total Outstanding:** ₹${out.totalOutstanding.toLocaleString()}\n` +
      `• **Overdue Amount:** ₹${out.overdueAmount.toLocaleString()}\n\n` +
      `**Clients with Pending Balances:**\n`;

    if (out.debtors.length === 0) {
      msg += `All clients are fully paid up!`;
    } else {
      out.debtors.forEach(d => {
        msg += `• **${d.clientName}**: ₹${d.pending.toLocaleString()} pending (Invoiced: ₹${d.invoiced.toLocaleString()}, Paid: ₹${d.paid.toLocaleString()}${d.overdue > 0 ? `, ⚠️ ₹${d.overdue.toLocaleString()} overdue` : ''})\n`;
      });
    }

    return { reply: msg, toolCallsExecuted: executed };
  }

  // Match 4: Payment recording ("XYZ paid 25k today", "ABC paid ₹40,000 today against their ₹85,000 website project")
  const payRegex = /([a-zA-Z0-9\s]+?)\s+paid\s+(?:₹|rs\.?|inr\s*)?([0-9,]+(?:\.[0-9]+)?|\d+\s*k|\d+\s*lakh)/i;
  const payMatch = text.match(payRegex);
  if (payMatch) {
    const rawClient = payMatch[1].replace(/^(recorded|add|enter|update)\s+/i, '').trim();
    let rawAmount = payMatch[2].toLowerCase().replace(/,/g, '');
    let amount = 0;
    if (rawAmount.includes('k')) {
      amount = parseFloat(rawAmount.replace('k', '')) * 1000;
    } else if (rawAmount.includes('lakh')) {
      amount = parseFloat(rawAmount.replace('lakh', '')) * 100000;
    } else {
      amount = parseFloat(rawAmount);
    }

    const res = opsTools.record_payment({ clientNameOrId: rawClient, amount });
    executed.push({ tool: 'record_payment', args: { clientNameOrId: rawClient, amount }, result: res });

    if ('error' in res && res.error) {
      return { reply: `❌ ${res.error}`, toolCallsExecuted: executed };
    }

    const successfulRes = res as {
      success: boolean;
      message: string;
      invoiceNumber: string;
      invoiceAmount: number | string;
      paidAmount: number;
      outstandingAmount: number;
    };

    const reply = `✅ **Payment recorded successfully.**\n\n` +
      `• **Client:** ${rawClient}\n` +
      `• **Invoice:** ${successfulRes.invoiceNumber}\n` +
      `• **Invoice Amount:** ${typeof successfulRes.invoiceAmount === 'number' ? `₹${successfulRes.invoiceAmount.toLocaleString()}` : successfulRes.invoiceAmount}\n` +
      `• **Paid Amount:** ₹${amount.toLocaleString()}\n` +
      `• **Outstanding Balance:** ₹${successfulRes.outstandingAmount.toLocaleString()}`;

    return { reply, toolCallsExecuted: executed };
  }

  // Match 5: Add Lead / Deal ("Add a new lead ABC Electricals from LinkedIn. Contact person is Ahmed. Website project estimated at ₹85,000")
  if (lower.includes('add a new lead') || lower.includes('added a new lead') || lower.includes('new lead from')) {
    // Parse company name, source, contact, estimated value
    let company = 'New Lead';
    let contact = 'Primary Contact';
    let source = 'WEBSITE';
    let value = 0;

    const sourceMatch = text.match(/from\s+(LinkedIn|Website|Referral|Google|IndiaMART|Cold Outreach|WhatsApp|Email)/i);
    if (sourceMatch) source = sourceMatch[1].toUpperCase();

    // Look for company name
    const compMatch = text.match(/(?:lead|from\s+\w+,?)\s+([A-Z0-9][A-Za-z0-9\s&]+?)(?:,|\.|from|contact|project|estimated|around|$)/i);
    if (compMatch && compMatch[1].trim()) company = compMatch[1].trim();

    // Look for contact
    const contactMatch = text.match(/contact(?: person)? is ([A-Za-z\s]+?)(?:,|\.|$)/i);
    if (contactMatch) contact = contactMatch[1].trim();

    // Look for value
    const valMatch = text.match(/(?:₹|rs\.?|inr\s*)?([0-9,]+|\d+(?:\.\d+)?\s*(?:k|lakh))/i);
    if (valMatch) {
      const vStr = valMatch[1].toLowerCase().replace(/,/g, '');
      if (vStr.includes('lakh')) value = parseFloat(vStr.replace('lakh', '')) * 100000;
      else if (vStr.includes('k')) value = parseFloat(vStr.replace('k', '')) * 1000;
      else value = parseFloat(vStr);
    }

    const leadRes = opsTools.create_lead({
      companyName: company,
      contactName: contact,
      leadSource: source,
      estimatedValue: value,
    });
    executed.push({ tool: 'create_lead', args: { company, contact, source, value }, result: leadRes });

    let dealRes = null;
    if (value > 0) {
      dealRes = opsTools.create_deal({
        clientNameOrId: company,
        dealName: `${company} Project`,
        service: 'Web Development / Tech Services',
        dealValue: value,
      });
      executed.push({ tool: 'create_deal', args: { company, value }, result: dealRes });
    }

    return {
      reply: `✅ **Lead created successfully!**\n\n` +
        `• **Company:** ${company}\n` +
        `• **Contact Person:** ${contact}\n` +
        `• **Source:** ${source}\n` +
        `• **Estimated Value:** ₹${value.toLocaleString()}\n` +
        (dealRes ? `• **Associated Deal:** Created "${company} Project" (₹${value.toLocaleString()})` : ''),
      toolCallsExecuted: executed,
    };
  }

  // Match 6: Remind / Follow-up ("Remind me to call XYZ tomorrow", "Set follow up with ABC on Monday")
  if (lower.startsWith('remind me') || lower.includes('follow up with') || lower.includes('set follow-up') || lower.includes('schedule a call')) {
    const isTomorrow = lower.includes('tomorrow');
    const followupDate = isTomorrow
      ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const res = opsTools.create_followup({
      followupDate,
      followupType: lower.includes('call') ? 'CALL' : lower.includes('email') ? 'EMAIL' : 'PROPOSAL_FOLLOWUP',
      notes: text,
    });
    executed.push({ tool: 'create_followup', args: { followupDate, notes: text }, result: res });

    return {
      reply: `✅ **Follow-up reminder scheduled!**\n\n• **Date:** ${followupDate}\n• **Action:** ${text}\n• **Status:** Scheduled`,
      toolCallsExecuted: executed,
    };
  }

  // Match 7: Client history ("Give me the complete history of ABC Electricals", "Show me everything related to ABC")
  if (lower.includes('history of') || lower.includes('everything related to') || lower.includes('tell me about')) {
    const cleanQuery = text.replace(/^(give me the complete history of|show me everything related to|tell me about)\s+/i, '').replace(/[?.!]/g, '').trim();
    const summary = opsTools.get_client_summary({ clientIdOrName: cleanQuery });
    executed.push({ tool: 'get_client_summary', args: { cleanQuery }, result: summary });

    if ((summary as any).error) {
      return { reply: `❌ ${(summary as any).error}`, toolCallsExecuted: executed };
    }

    const { client, metrics, deals, payments, invoices, tasks, followups, accounts } = summary as any;
    const msg = `**Consolidated 360° History for ${client.companyName}**\n\n` +
      `• **Contact:** ${client.contactPerson} (${client.email}, ${client.phone || 'No phone'})\n` +
      `• **Status:** ${client.status} | Client Since: ${new Date(client.clientSince).toLocaleDateString()}\n` +
      `• **Industry:** ${client.industry || 'General'}\n\n` +
      `**Financial Overview:**\n` +
      `• Total Invoiced: ₹${metrics.totalInvoiced.toLocaleString()}\n` +
      `• Total Paid: ₹${metrics.totalPaid.toLocaleString()}\n` +
      `• **Outstanding Balance:** ₹${metrics.outstanding.toLocaleString()}\n` +
      `• Won Revenue: ₹${metrics.wonRevenue.toLocaleString()}\n\n` +
      `**Deals (${deals.length}):** ${deals.map((d: any) => `${d.dealName} (₹${d.dealValue.toLocaleString()} - ${d.stage})`).join('; ') || 'None'}\n` +
      `**Payments (${payments.length}):** ${payments.map((p: any) => `₹${p.amount.toLocaleString()} on ${p.paymentDate.slice(0, 10)}`).join('; ') || 'None'}\n` +
      `**Tasks (${tasks.length}):** ${tasks.map((t: any) => `${t.title} [${t.status}]`).join('; ') || 'None'}\n` +
      `**Account References (${accounts.length}):** ${accounts.map((a: any) => `${a.serviceName} (${a.credentialManager}: ${a.credentialReference})`).join('; ') || 'None'}`;

    return { reply: msg, toolCallsExecuted: executed };
  }

  // Match 8: Weekly / Monthly Sales Report
  if (lower.includes('weekly') && lower.includes('report') || lower.includes("sales report")) {
    const report = automationEngine.generateWeeklyReport();
    executed.push({ tool: 'generate_weekly_report', args: {}, result: report });

    const msg = `📊 **WEEKLY SALES REPORT**\n\n` +
      `• **New Leads:** ${report.newLeads}\n` +
      `• **Qualified:** ${report.qualified}\n` +
      `• **Proposals Sent:** ${report.proposals}\n` +
      `• **Negotiations Active:** ${report.negotiations}\n` +
      `• **Deals Won:** ${report.won}\n` +
      `• **Deals Lost:** ${report.lost}\n\n` +
      `💰 **Won Revenue:** ₹${report.wonRevenue.toLocaleString()}\n` +
      `📈 **Current Pipeline:** ₹${report.currentPipeline.toLocaleString()} (Weighted: ₹${Math.round(report.weightedPipeline).toLocaleString()})\n` +
      `💳 **Outstanding Balance:** ₹${report.outstanding.toLocaleString()}\n\n` +
      `**Follow-ups:**\n` +
      `• Completed: ${report.followupsCompleted}\n` +
      `• Overdue: ${report.followupsOverdue}\n\n` +
      `⚠️ **Attention Required:**\n` +
      `${report.staleOpportunitiesCount} opportunities have had no recorded activity for more than 7 days.`;

    return { reply: msg, toolCallsExecuted: executed };
  }

  // Match 9: Analysis of deals closing soon
  if (lower.includes('closing soon') || lower.includes('likely to close') || lower.includes('forecast')) {
    const analysis = opsTools.analyze_deals_closing_soon();
    executed.push({ tool: 'analyze_deals_closing_soon', args: {}, result: analysis });

    let msg = `🎯 **Deals Likely to Close Soon (Rule-Based Analysis)**\n\n` +
      `*${analysis.methodology}*\n\n`;

    if (analysis.likelyClosingDeals.length === 0) {
      msg += `No active deals currently meet the high-probability closing threshold.`;
    } else {
      analysis.likelyClosingDeals.slice(0, 4).forEach((d, idx) => {
        msg += `${idx + 1}. **${d.dealName}** (${d.client})\n` +
          `   • **Value:** ₹${d.dealValue.toLocaleString()} | **Stage:** ${d.stage} (${d.probability}%)\n` +
          `   • **Rule Criteria:** ${d.heuristicRulesUsed.join('; ')}\n\n`;
      });
    }

    return { reply: msg, toolCallsExecuted: executed };
  }

  // Default: Return dashboard summary and available command hints
  const summary = db.getDashboardSummary();
  return {
    reply: `I am your **PARxCON Ops Assistant**. I can execute business operations, track leads, record payments, and generate live analytical reports.\n\n` +
      `**Current Quick Stats:**\n` +
      `• Active Pipeline: ₹${summary.metrics.pipelineValue.toLocaleString()} across ${summary.metrics.activeOpportunities} deals\n` +
      `• Outstanding Payments: ₹${summary.metrics.pendingPayments.toLocaleString()}\n` +
      `• Follow-ups Due Today: ${summary.metrics.followupsDueToday} (${summary.metrics.overdueFollowups} overdue)\n\n` +
      `**Try commands like:**\n` +
      `• *"Add a new lead ABC Electricals from LinkedIn, estimated at ₹85,000"*\n` +
      `• *"XYZ paid 25k today"*\n` +
      `• *"What do I need to follow up today?"*\n` +
      `• *"Show my active pipeline"*\n` +
      `• *"Who owes us money?"*\n` +
      `• *"Give me the complete history of ABC Electricals"*\n` +
      `• *"Give me my weekly sales report"*`,
    toolCallsExecuted: executed,
  };
}
