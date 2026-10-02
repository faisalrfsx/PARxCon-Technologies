import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  DatabaseSchema,
  Client,
  Lead,
  Deal,
  Project,
  Invoice,
  Payment,
  Task,
  Followup,
  AccountRegistry,
  Renewal,
  ActivityLog,
  Notification,
  User,
  AiConversation,
  AiMessage,
} from './types.js';
import { getInitialSeedData } from './seed-data.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'parxcon_ops.json');

class Database {
  private data: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.data = getInitialSeedData();
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialSeedData();
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize database from file, falling back to seed:', err);
      this.data = getInitialSeedData();
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // --- Users & Auth ---
  getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...rest }) => rest as User);
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${uuidv4()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  // --- Clients ---
  getClients(search?: string): Client[] {
    let list = [...this.data.clients];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getClientById(id: string): Client | undefined {
    return this.data.clients.find((c) => c.id === id);
  }

  getClientSummary(id: string) {
    const client = this.getClientById(id);
    if (!client) return null;

    const leads = this.data.leads.filter((l) => l.clientId === id);
    const deals = this.data.deals.filter((d) => d.clientId === id);
    const projects = this.data.projects.filter((p) => p.clientId === id);
    const invoices = this.data.invoices.filter((i) => i.clientId === id);
    const payments = this.data.payments.filter((p) => p.clientId === id);
    const tasks = this.data.tasks.filter((t) => t.clientId === id);
    const followups = this.data.followups.filter((f) => f.clientId === id);
    const accounts = this.data.accounts.filter((a) => a.associatedClientId === id);

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.invoiceAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    return {
      client,
      metrics: {
        totalDeals: deals.length,
        totalInvoiced,
        totalPaid,
        outstanding,
        wonRevenue: deals.filter((d) => d.stage === 'WON').reduce((s, d) => s + d.dealValue, 0),
        activeProjects: projects.filter((p) => p.status === 'In Progress').length,
      },
      leads,
      deals,
      projects,
      invoices,
      payments,
      tasks,
      followups,
      accounts,
    };
  }

  createClient(clientData: Partial<Client> & { companyName: string; contactPerson: string; email: string }): Client {
    const newClient: Client = {
      id: `cli-${uuidv4()}`,
      companyName: clientData.companyName,
      contactPerson: clientData.contactPerson,
      email: clientData.email,
      phone: clientData.phone || '',
      country: clientData.country || 'India',
      city: clientData.city || '',
      industry: clientData.industry || '',
      website: clientData.website || '',
      status: clientData.status || 'PROSPECT',
      clientSince: clientData.clientSince || new Date().toISOString(),
      notes: clientData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: clientData.createdBy || 'System',
    };
    this.data.clients.push(newClient);
    this.persist();
    return newClient;
  }

  updateClient(id: string, updates: Partial<Client>): Client | null {
    const index = this.data.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.clients[index] = {
      ...this.data.clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.clients[index];
  }

  deleteClient(id: string): boolean {
    const index = this.data.clients.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.data.clients.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Leads ---
  getLeads(status?: string): Lead[] {
    let list = [...this.data.leads];
    if (status && status !== 'ALL') {
      list = list.filter((l) => l.status === status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getLeadById(id: string): Lead | undefined {
    return this.data.leads.find((l) => l.id === id);
  }

  createLead(leadData: Partial<Lead> & { companyName: string; contactName: string }): Lead {
    const newLead: Lead = {
      id: `led-${uuidv4()}`,
      companyName: leadData.companyName,
      contactName: leadData.contactName,
      phone: leadData.phone || '',
      email: leadData.email || '',
      country: leadData.country || 'India',
      city: leadData.city || '',
      industry: leadData.industry || '',
      website: leadData.website || '',
      leadSource: leadData.leadSource || 'WEBSITE',
      status: leadData.status || 'NEW',
      estimatedValue: leadData.estimatedValue || 0,
      currency: leadData.currency || 'INR',
      notes: leadData.notes || '',
      assignedToId: leadData.assignedToId,
      assignedToName: leadData.assignedToName || 'Unassigned',
      clientId: leadData.clientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: leadData.createdBy || 'System',
    };
    this.data.leads.push(newLead);
    this.persist();
    return newLead;
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const index = this.data.leads.findIndex((l) => l.id === id);
    if (index === -1) return null;
    this.data.leads[index] = {
      ...this.data.leads[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.leads[index];
  }

  deleteLead(id: string): boolean {
    const index = this.data.leads.findIndex((l) => l.id === id);
    if (index === -1) return false;
    this.data.leads.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Deals ---
  getDeals(stage?: string): Deal[] {
    let list = [...this.data.deals];
    if (stage && stage !== 'ALL') {
      list = list.filter((d) => d.stage === stage);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getDealById(id: string): Deal | undefined {
    return this.data.deals.find((d) => d.id === id);
  }

  createDeal(dealData: Partial<Deal> & { dealName: string; service: string; dealValue: number; clientId: string }): Deal {
    const client = this.getClientById(dealData.clientId);
    const newDeal: Deal = {
      id: `del-${uuidv4()}`,
      dealName: dealData.dealName,
      service: dealData.service,
      description: dealData.description || '',
      dealValue: Number(dealData.dealValue) || 0,
      currency: dealData.currency || 'INR',
      probability: dealData.probability !== undefined ? dealData.probability : 50,
      stage: dealData.stage || 'DISCOVERY',
      proposalDate: dealData.proposalDate,
      expectedClosingDate: dealData.expectedClosingDate,
      actualClosingDate: dealData.stage === 'WON' ? new Date().toISOString() : undefined,
      notes: dealData.notes || '',
      clientId: dealData.clientId,
      clientName: client ? client.companyName : dealData.clientName || 'Unknown',
      leadId: dealData.leadId,
      assignedToId: dealData.assignedToId,
      assignedToName: dealData.assignedToName || 'Unassigned',
      nextFollowup: dealData.nextFollowup,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: dealData.createdBy || 'System',
    };
    this.data.deals.push(newDeal);
    this.persist();
    return newDeal;
  }

  updateDeal(id: string, updates: Partial<Deal>): Deal | null {
    const index = this.data.deals.findIndex((d) => d.id === id);
    if (index === -1) return null;
    const current = this.data.deals[index];

    let actualClosingDate = current.actualClosingDate;
    if (updates.stage === 'WON' && current.stage !== 'WON') {
      actualClosingDate = new Date().toISOString();
      updates.probability = 100;
    } else if (updates.stage === 'LOST' && current.stage !== 'LOST') {
      updates.probability = 0;
    }

    this.data.deals[index] = {
      ...current,
      ...updates,
      actualClosingDate,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.deals[index];
  }

  deleteDeal(id: string): boolean {
    const index = this.data.deals.findIndex((d) => d.id === id);
    if (index === -1) return false;
    this.data.deals.splice(index, 1);
    this.persist();
    return true;
  }

  getPipeline() {
    const deals = this.data.deals;
    const stages: Record<string, { count: number; value: number; weightedValue: number; deals: Deal[] }> = {
      DISCOVERY: { count: 0, value: 0, weightedValue: 0, deals: [] },
      REQUIREMENT: { count: 0, value: 0, weightedValue: 0, deals: [] },
      PROPOSAL: { count: 0, value: 0, weightedValue: 0, deals: [] },
      NEGOTIATION: { count: 0, value: 0, weightedValue: 0, deals: [] },
      VERBAL_CONFIRMATION: { count: 0, value: 0, weightedValue: 0, deals: [] },
      WON: { count: 0, value: 0, weightedValue: 0, deals: [] },
      LOST: { count: 0, value: 0, weightedValue: 0, deals: [] },
    };

    let totalPipelineValue = 0;
    let totalWeightedPipeline = 0;
    let wonRevenue = 0;

    deals.forEach((d) => {
      const val = Number(d.dealValue) || 0;
      const prob = Number(d.probability) || 0;
      const weighted = (val * prob) / 100;

      if (stages[d.stage]) {
        stages[d.stage].count += 1;
        stages[d.stage].value += val;
        stages[d.stage].weightedValue += weighted;
        stages[d.stage].deals.push(d);
      }

      if (d.stage === 'WON') {
        wonRevenue += val;
      } else if (d.stage !== 'LOST') {
        totalPipelineValue += val;
        totalWeightedPipeline += weighted;
      }
    });

    return {
      stages,
      totalPipelineValue,
      totalWeightedPipeline,
      wonRevenue,
      activeDealsCount: deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST').length,
    };
  }

  // --- Projects ---
  getProjects(): Project[] {
    return [...this.data.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createProject(data: Partial<Project> & { projectName: string; clientId: string }): Project {
    const client = this.getClientById(data.clientId);
    const newPrj: Project = {
      id: `prj-${uuidv4()}`,
      projectName: data.projectName,
      clientId: data.clientId,
      clientName: client ? client.companyName : data.clientName || 'Unknown',
      status: data.status || 'In Progress',
      budget: Number(data.budget) || 0,
      currency: data.currency || 'INR',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.projects.push(newPrj);
    this.persist();
    return newPrj;
  }

  // --- Invoices & Payments ---
  getInvoices(): Invoice[] {
    return [...this.data.invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getPayments(): Payment[] {
    return [...this.data.payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }

  createInvoice(invData: Partial<Invoice> & { clientId: string; invoiceNumber: string; invoiceAmount: number; dueDate: string }): Invoice {
    const client = this.getClientById(invData.clientId);
    const deal = invData.dealId ? this.getDealById(invData.dealId) : undefined;
    const newInvoice: Invoice = {
      id: `inv-${uuidv4()}`,
      invoiceNumber: invData.invoiceNumber,
      clientId: invData.clientId,
      clientName: client ? client.companyName : invData.clientName || 'Unknown',
      dealId: invData.dealId,
      dealName: deal ? deal.dealName : invData.dealName,
      invoiceAmount: Number(invData.invoiceAmount),
      currency: invData.currency || 'INR',
      issueDate: invData.issueDate || new Date().toISOString(),
      dueDate: invData.dueDate,
      status: 'PENDING',
      notes: invData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.invoices.push(newInvoice);
    this.persist();
    return newInvoice;
  }

  recordPayment(payData: Partial<Payment> & { clientId: string; amount: number }): { payment: Payment; invoice?: Invoice; pendingAmount: number } {
    const client = this.getClientById(payData.clientId);
    const deal = payData.dealId ? this.getDealById(payData.dealId) : undefined;
    let invoice = payData.invoiceId ? this.data.invoices.find((i) => i.id === payData.invoiceId) : undefined;

    // If no invoiceId passed, find matching open invoice for this deal or client
    if (!invoice && payData.dealId) {
      invoice = this.data.invoices.find((i) => i.dealId === payData.dealId && i.status !== 'PAID');
    }
    if (!invoice) {
      invoice = this.data.invoices.find((i) => i.clientId === payData.clientId && i.status !== 'PAID');
    }

    const newPayment: Payment = {
      id: `pay-${uuidv4()}`,
      clientId: payData.clientId,
      clientName: client ? client.companyName : payData.clientName || 'Unknown',
      dealId: payData.dealId || (invoice ? invoice.dealId : undefined),
      dealName: deal ? deal.dealName : (invoice ? invoice.dealName : undefined),
      invoiceId: invoice ? invoice.id : payData.invoiceId,
      invoiceNumber: invoice ? invoice.invoiceNumber : payData.invoiceNumber,
      amount: Number(payData.amount),
      currency: payData.currency || 'INR',
      paymentDate: payData.paymentDate || new Date().toISOString(),
      paymentMethod: payData.paymentMethod || 'BANK_TRANSFER',
      referenceNo: payData.referenceNo || '',
      notes: payData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: payData.createdBy || 'System',
    };
    this.data.payments.push(newPayment);

    // Update invoice status if matched
    let pendingAmount = 0;
    if (invoice) {
      const allPaymentsForInv = this.data.payments.filter((p) => p.invoiceId === invoice!.id);
      const totalPaidOnInv = allPaymentsForInv.reduce((sum, p) => sum + p.amount, 0);
      pendingAmount = Math.max(0, invoice.invoiceAmount - totalPaidOnInv);

      if (pendingAmount <= 0) {
        invoice.status = 'PAID';
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }
      invoice.updatedAt = new Date().toISOString();
    } else {
      // Calculate overall client pending
      const totalInvoiced = this.data.invoices.filter((i) => i.clientId === payData.clientId).reduce((s, i) => s + i.invoiceAmount, 0);
      const totalPaid = this.data.payments.filter((p) => p.clientId === payData.clientId).reduce((s, p) => s + p.amount, 0);
      pendingAmount = Math.max(0, totalInvoiced - totalPaid);
    }

    this.persist();
    return { payment: newPayment, invoice, pendingAmount };
  }

  getOutstandingSummary() {
    const todayStr = new Date().toISOString().split('T')[0];
    const invoices = this.data.invoices;
    const payments = this.data.payments;

    let totalInvoiced = 0;
    let totalReceived = 0;
    let overdueAmount = 0;
    const clientBalances: Record<string, { clientId: string; clientName: string; invoiced: number; paid: number; pending: number; overdue: number }> = {};

    invoices.forEach((inv) => {
      totalInvoiced += inv.invoiceAmount;
      const invPayments = payments.filter((p) => p.invoiceId === inv.id);
      const paid = invPayments.reduce((s, p) => s + p.amount, 0);
      const pending = Math.max(0, inv.invoiceAmount - paid);

      const isOverdue = inv.dueDate < todayStr && pending > 0;
      if (isOverdue) overdueAmount += pending;

      if (!clientBalances[inv.clientId]) {
        clientBalances[inv.clientId] = {
          clientId: inv.clientId,
          clientName: inv.clientName || 'Unknown',
          invoiced: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
        };
      }
      clientBalances[inv.clientId].invoiced += inv.invoiceAmount;
      clientBalances[inv.clientId].paid += paid;
      clientBalances[inv.clientId].pending += pending;
      if (isOverdue) {
        clientBalances[inv.clientId].overdue += pending;
      }
    });

    totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalReceived);

    const debtors = Object.values(clientBalances).filter((c) => c.pending > 0).sort((a, b) => b.pending - a.pending);

    return {
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      overdueAmount,
      debtors,
    };
  }

  // --- Tasks ---
  getTasks(status?: string, assignedToId?: string): Task[] {
    let list = [...this.data.tasks];
    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }
    if (assignedToId) {
      list = list.filter((t) => t.assignedToId === assignedToId);
    }
    return list.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
  }

  getTaskById(id: string): Task | undefined {
    return this.data.tasks.find((t) => t.id === id);
  }

  createTask(data: Partial<Task> & { title: string }): Task {
    const client = data.clientId ? this.getClientById(data.clientId) : undefined;
    const deal = data.dealId ? this.getDealById(data.dealId) : undefined;
    const newTask: Task = {
      id: `tsk-${uuidv4()}`,
      title: data.title,
      description: data.description || '',
      clientId: data.clientId,
      clientName: client ? client.companyName : data.clientName,
      dealId: data.dealId,
      dealName: deal ? deal.dealName : data.dealName,
      projectId: data.projectId,
      projectName: data.projectName,
      assignedToId: data.assignedToId,
      assignedToName: data.assignedToName || 'Unassigned',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'PENDING',
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'System',
    };
    this.data.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    let completedDate = this.data.tasks[index].completedDate;
    if (updates.status === 'COMPLETED' && this.data.tasks[index].status !== 'COMPLETED') {
      completedDate = new Date().toISOString();
    } else if (updates.status && updates.status !== 'COMPLETED') {
      completedDate = undefined;
    }

    this.data.tasks[index] = {
      ...this.data.tasks[index],
      ...updates,
      completedDate,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.tasks[index];
  }

  deleteTask(id: string): boolean {
    const index = this.data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.data.tasks.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Follow-ups ---
  getFollowups(filter?: 'today' | 'overdue' | 'upcoming' | 'all'): Followup[] {
    const todayStr = new Date().toISOString().split('T')[0];
    let list = [...this.data.followups];

    if (filter === 'today') {
      list = list.filter((f) => f.followupDate.startsWith(todayStr) && f.status === 'SCHEDULED');
    } else if (filter === 'overdue') {
      list = list.filter((f) => f.followupDate < todayStr && f.status === 'SCHEDULED');
    } else if (filter === 'upcoming') {
      list = list.filter((f) => f.followupDate > todayStr && f.status === 'SCHEDULED');
    }

    return list.sort((a, b) => a.followupDate.localeCompare(b.followupDate));
  }

  createFollowup(data: Partial<Followup> & { followupDate: string }): Followup {
    const client = data.clientId ? this.getClientById(data.clientId) : undefined;
    const lead = data.leadId ? this.getLeadById(data.leadId) : undefined;
    const deal = data.dealId ? this.getDealById(data.dealId) : undefined;

    const newFollowup: Followup = {
      id: `flw-${uuidv4()}`,
      clientId: data.clientId,
      clientName: client ? client.companyName : data.clientName,
      leadId: data.leadId,
      leadName: lead ? lead.companyName : data.leadName,
      dealId: data.dealId,
      dealName: deal ? deal.dealName : data.dealName,
      assignedToId: data.assignedToId,
      assignedToName: data.assignedToName || 'Unassigned',
      followupDate: data.followupDate,
      followupType: data.followupType || 'CALL',
      status: data.status || 'SCHEDULED',
      notes: data.notes || '',
      outcome: data.outcome || '',
      nextFollowup: data.nextFollowup,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'System',
    };
    this.data.followups.push(newFollowup);
    this.persist();
    return newFollowup;
  }

  updateFollowup(id: string, updates: Partial<Followup>): Followup | null {
    const index = this.data.followups.findIndex((f) => f.id === id);
    if (index === -1) return null;
    this.data.followups[index] = {
      ...this.data.followups[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.followups[index];
  }

  deleteFollowup(id: string): boolean {
    const index = this.data.followups.findIndex((f) => f.id === id);
    if (index === -1) return false;
    this.data.followups.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Account Registry (SECURITY: NO PLAINTEXT PASSWORDS) ---
  getAccounts(): AccountRegistry[] {
    return [...this.data.accounts].sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }

  createAccount(data: Partial<AccountRegistry> & { serviceName: string; credentialReference: string }): AccountRegistry {
    // Strictly strip any accidental plaintext password property
    const sanitized = { ...data };
    delete (sanitized as any).password;
    delete (sanitized as any).secret;

    const client = sanitized.associatedClientId ? this.getClientById(sanitized.associatedClientId) : undefined;

    const newAccount: AccountRegistry = {
      id: `acc-${uuidv4()}`,
      serviceName: sanitized.serviceName,
      category: sanitized.category || 'OTHER',
      url: sanitized.url || '',
      username: sanitized.username || '',
      owner: sanitized.owner || 'DevOps',
      twoFactorEnabled: !!sanitized.twoFactorEnabled,
      credentialManager: sanitized.credentialManager || 'Bitwarden',
      credentialReference: sanitized.credentialReference,
      renewalDate: sanitized.renewalDate,
      associatedClientId: sanitized.associatedClientId,
      associatedClientName: client ? client.companyName : sanitized.associatedClientName,
      notes: sanitized.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: sanitized.createdBy || 'System',
    };
    this.data.accounts.push(newAccount);
    this.persist();
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<AccountRegistry>): AccountRegistry | null {
    const index = this.data.accounts.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const sanitized = { ...updates };
    delete (sanitized as any).password;

    this.data.accounts[index] = {
      ...this.data.accounts[index],
      ...sanitized,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.accounts[index];
  }

  deleteAccount(id: string): boolean {
    const index = this.data.accounts.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.data.accounts.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Renewals ---
  getRenewals(): (Renewal & { daysRemaining: number; isUrgent: boolean })[] {
    const now = Date.now();
    return [...this.data.renewals]
      .map((r) => {
        const renTime = new Date(r.renewalDate).getTime();
        const diffMs = renTime - now;
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isUrgent = daysRemaining <= 7;
        return { ...r, daysRemaining, isUrgent };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  createRenewal(data: Partial<Renewal> & { service: string; provider: string; renewalDate: string; cost: number }): Renewal {
    const newRen: Renewal = {
      id: `rnw-${uuidv4()}`,
      service: data.service,
      provider: data.provider,
      renewalDate: data.renewalDate,
      cost: Number(data.cost) || 0,
      currency: data.currency || 'INR',
      autoRenewal: !!data.autoRenewal,
      owner: data.owner || 'System Admin',
      alertDays: data.alertDays || [30, 15, 7, 1],
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.renewals.push(newRen);
    this.persist();
    return newRen;
  }

  updateRenewal(id: string, updates: Partial<Renewal>): Renewal | null {
    const index = this.data.renewals.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.data.renewals[index] = {
      ...this.data.renewals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.renewals[index];
  }

  deleteRenewal(id: string): boolean {
    const index = this.data.renewals.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.data.renewals.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Dashboard Summary ---
  getDashboardSummary() {
    const leads = this.data.leads;
    const deals = this.data.deals;
    const followups = this.data.followups;
    const renewals = this.getRenewals();
    const projects = this.data.projects;

    const pipeline = this.getPipeline();
    const outstanding = this.getOutstandingSummary();
    const todayFollowups = this.getFollowups('today');
    const overdueFollowups = this.getFollowups('overdue');

    // Revenue this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const revenueThisMonth = this.data.payments
      .filter((p) => p.paymentDate.startsWith(currentMonth))
      .reduce((s, p) => s + p.amount, 0);

    return {
      metrics: {
        totalLeads: leads.length,
        activeOpportunities: pipeline.activeDealsCount,
        pipelineValue: pipeline.totalPipelineValue,
        weightedPipeline: pipeline.totalWeightedPipeline,
        wonRevenue: pipeline.wonRevenue,
        revenueThisMonth,
        pendingPayments: outstanding.totalOutstanding,
        overduePayments: outstanding.overdueAmount,
        followupsDueToday: todayFollowups.length,
        overdueFollowups: overdueFollowups.length,
        activeProjects: projects.filter((p) => p.status === 'In Progress').length,
        upcomingRenewals: renewals.filter((r) => r.daysRemaining <= 30).length,
      },
      todayFollowups,
      overdueFollowups,
      pipelineByStage: pipeline.stages,
      outstandingDebtors: outstanding.debtors.slice(0, 5),
      upcomingRenewalsList: renewals.filter((r) => r.daysRemaining <= 30).slice(0, 5),
      recentActivity: this.getActivityLogs(8),
    };
  }

  // --- Activity Logs ---
  getActivityLogs(limit = 50): ActivityLog[] {
    return [...this.data.activityLogs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  logActivity(data: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const newLog: ActivityLog = {
      id: `log-${uuidv4()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(newLog);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.persist();
    return newLog;
  }

  // --- Notifications ---
  getNotifications(): Notification[] {
    return [...this.data.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const notif: Notification = {
      id: `notif-${uuidv4()}`,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  markNotificationRead(id: string): boolean {
    const n = this.data.notifications.find((notif) => notif.id === id);
    if (n) {
      n.isRead = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(): boolean {
    this.data.notifications.forEach((n) => (n.isRead = true));
    this.persist();
    return true;
  }

  // --- Global Search ---
  globalSearch(q: string) {
    if (!q || !q.trim()) return { clients: [], leads: [], deals: [], projects: [], tasks: [], accounts: [] };
    const query = q.trim().toLowerCase();

    const clients = this.data.clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(query) ||
        c.contactPerson.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.city && c.city.toLowerCase().includes(query))
    );

    const leads = this.data.leads.filter(
      (l) =>
        l.companyName.toLowerCase().includes(query) ||
        l.contactName.toLowerCase().includes(query) ||
        (l.email && l.email.toLowerCase().includes(query))
    );

    const deals = this.data.deals.filter(
      (d) =>
        d.dealName.toLowerCase().includes(query) ||
        (d.clientName && d.clientName.toLowerCase().includes(query)) ||
        d.service.toLowerCase().includes(query)
    );

    const projects = this.data.projects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(query) ||
        (p.clientName && p.clientName.toLowerCase().includes(query))
    );

    const tasks = this.data.tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.clientName && t.clientName.toLowerCase().includes(query))
    );

    const accounts = this.data.accounts.filter(
      (a) =>
        a.serviceName.toLowerCase().includes(query) ||
        (a.username && a.username.toLowerCase().includes(query)) ||
        a.credentialReference.toLowerCase().includes(query) ||
        (a.associatedClientName && a.associatedClientName.toLowerCase().includes(query))
    );

    return {
      clients: clients.slice(0, 10),
      leads: leads.slice(0, 10),
      deals: deals.slice(0, 10),
      projects: projects.slice(0, 10),
      tasks: tasks.slice(0, 10),
      accounts: accounts.slice(0, 10),
    };
  }

  // --- AI Conversations ---
  getAiConversations(userId: string): AiConversation[] {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  createAiConversation(userId: string, title = 'Ops Command'): AiConversation {
    const conv: AiConversation = {
      id: `conv-${uuidv4()}`,
      userId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.conversations.push(conv);
    this.persist();
    return conv;
  }

  getAiMessages(conversationId: string): AiMessage[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addAiMessage(msg: Omit<AiMessage, 'id' | 'createdAt'>): AiMessage {
    const newMsg: AiMessage = {
      id: `msg-${uuidv4()}`,
      ...msg,
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(newMsg);
    // Update conversation updatedAt
    const conv = this.data.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.persist();
    return newMsg;
  }

  // --- Settings ---
  getSettings(): Record<string, string> {
    return { ...this.data.settings };
  }

  updateSettings(settings: Record<string, string>) {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
    };
    this.persist();
    return this.data.settings;
  }
}

export const db = new Database();
