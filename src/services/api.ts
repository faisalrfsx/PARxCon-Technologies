import {
  User,
  Client,
  Lead,
  Deal,
  Payment,
  Invoice,
  Task,
  Followup,
  AccountRegistry,
  Renewal,
  DashboardSummary,
  ClientSummary,
  ActivityLog,
  Notification,
} from '../types/index.js';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('parxcon_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('parxcon_token', token);
    } else {
      localStorage.removeItem('parxcon_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      // Trigger session refresh event
      window.dispatchEvent(new Event('auth_unauthorized'));
    }

    if (!response.ok) {
      let errMsg = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errMsg = errorData.error;
      } catch (_) {}
      throw new Error(errMsg);
    }

    return response.json();
  }

  // Auth
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
    me: () => this.request<{ user: User }>('/api/auth/me'),
    getUsers: () => this.request<{ users: User[] }>('/api/auth/users'),
  };

  // Dashboard
  dashboard = {
    getSummary: () => this.request<DashboardSummary>('/api/dashboard'),
  };

  // Leads
  leads = {
    getAll: (status?: string) =>
      this.request<{ leads: Lead[] }>(`/api/leads${status ? `?status=${status}` : ''}`),
    getById: (id: string) => this.request<{ lead: Lead }>(`/api/leads/${id}`),
    create: (data: Partial<Lead>) =>
      this.request<{ lead: Lead }>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Lead>) =>
      this.request<{ lead: Lead }>(`/api/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/leads/${id}`, { method: 'DELETE' }),
    convert: (id: string, data?: { dealName?: string; service?: string; dealValue?: number }) =>
      this.request<{ success: boolean; client: Client; deal: Deal }>(`/api/leads/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
  };

  // Clients
  clients = {
    getAll: (search?: string) =>
      this.request<{ clients: Client[] }>(`/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    getById: (id: string) => this.request<{ client: Client }>(`/api/clients/${id}`),
    getSummary: (id: string) => this.request<ClientSummary>(`/api/clients/${id}/summary`),
    create: (data: Partial<Client>) =>
      this.request<{ client: Client }>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Client>) =>
      this.request<{ client: Client }>(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/clients/${id}`, { method: 'DELETE' }),
  };

  // Deals
  deals = {
    getAll: (stage?: string) =>
      this.request<{ deals: Deal[] }>(`/api/deals${stage ? `?stage=${stage}` : ''}`),
    getPipeline: () => this.request<any>('/api/deals/pipeline'),
    getById: (id: string) => this.request<{ deal: Deal }>(`/api/deals/${id}`),
    create: (data: Partial<Deal>) =>
      this.request<{ deal: Deal }>('/api/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Deal>) =>
      this.request<{ deal: Deal }>(`/api/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/deals/${id}`, { method: 'DELETE' }),
  };

  // Payments
  payments = {
    getAll: () => this.request<{ payments: Payment[] }>('/api/payments'),
    getInvoices: () => this.request<{ invoices: Invoice[] }>('/api/payments/invoices'),
    getOutstanding: () => this.request<any>('/api/payments/outstanding'),
    createInvoice: (data: Partial<Invoice>) =>
      this.request<{ invoice: Invoice }>('/api/payments/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    recordPayment: (data: Partial<Payment>) =>
      this.request<{ payment: Payment; invoice?: Invoice; pendingAmount: number }>('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Tasks
  tasks = {
    getAll: (status?: string) =>
      this.request<{ tasks: Task[] }>(`/api/tasks${status ? `?status=${status}` : ''}`),
    create: (data: Partial<Task>) =>
      this.request<{ task: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Task>) =>
      this.request<{ task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' }),
  };

  // Follow-ups
  followups = {
    getAll: (filter?: 'today' | 'overdue' | 'upcoming' | 'all') =>
      this.request<{ followups: Followup[] }>(`/api/followups${filter ? `?filter=${filter}` : ''}`),
    create: (data: Partial<Followup>) =>
      this.request<{ followup: Followup }>('/api/followups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Followup>) =>
      this.request<{ followup: Followup }>(`/api/followups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/followups/${id}`, { method: 'DELETE' }),
  };

  // Accounts (NO PLAINTEXT PASSWORDS)
  accounts = {
    getAll: () => this.request<{ accounts: AccountRegistry[] }>('/api/accounts'),
    create: (data: Partial<AccountRegistry>) =>
      this.request<{ account: AccountRegistry }>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<AccountRegistry>) =>
      this.request<{ account: AccountRegistry }>(`/api/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/accounts/${id}`, { method: 'DELETE' }),
  };

  // Renewals
  renewals = {
    getAll: () => this.request<{ renewals: Renewal[] }>('/api/renewals'),
    create: (data: Partial<Renewal>) =>
      this.request<{ renewal: Renewal }>('/api/renewals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Renewal>) =>
      this.request<{ renewal: Renewal }>(`/api/renewals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/renewals/${id}`, { method: 'DELETE' }),
  };

  // Reports
  reports = {
    getSales: () => this.request<any>('/api/reports/sales'),
    getPayments: () => this.request<any>('/api/reports/payments'),
    getActivity: () => this.request<any>('/api/reports/activity'),
    getWeekly: () => this.request<any>('/api/reports/weekly'),
    getMorningBriefing: () => this.request<any>('/api/reports/morning-briefing'),
    getEveningSummary: () => this.request<any>('/api/reports/evening-summary'),
  };

  // Search
  search = {
    query: (q: string) =>
      this.request<{
        clients: Client[];
        leads: Lead[];
        deals: Deal[];
        projects: any[];
        tasks: Task[];
        accounts: AccountRegistry[];
      }>(`/api/search?q=${encodeURIComponent(q)}`),
  };

  // AI Ops Assistant
  ai = {
    chat: (message: string, conversationId?: string) =>
      this.request<{
        conversationId: string;
        message: { id: string; role: string; content: string };
        toolCalls: { tool: string; args: any; result: any }[];
      }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      }),
    getConversations: () => this.request<{ conversations: any[] }>('/api/ai/conversations'),
    getMessages: (conversationId: string) =>
      this.request<{ messages: any[] }>(`/api/ai/conversations/${conversationId}/messages`),
  };

  // Settings & System
  settings = {
    get: () => this.request<{ settings: Record<string, string> }>('/api/settings'),
    update: (settings: Record<string, string>) =>
      this.request<{ settings: Record<string, string> }>('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      }),
    getLogs: (limit = 100) => this.request<{ logs: ActivityLog[] }>(`/api/settings/logs?limit=${limit}`),
    getNotifications: () => this.request<{ notifications: Notification[] }>('/api/settings/notifications'),
    markNotificationRead: (id: string) =>
      this.request<{ success: boolean }>(`/api/settings/notifications/${id}/read`, { method: 'POST' }),
    markAllNotificationsRead: () =>
      this.request<{ success: boolean }>('/api/settings/notifications/read-all', { method: 'POST' }),
  };
}

export const api = new ApiService();
