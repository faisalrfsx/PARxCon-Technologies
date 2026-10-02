export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'ON_HOLD';

export type LeadSource =
  | 'LINKEDIN'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'GOOGLE'
  | 'INDIAMART'
  | 'COLD_OUTREACH'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'EXISTING_CLIENT'
  | 'OTHER';

export type DealStage =
  | 'DISCOVERY'
  | 'REQUIREMENT'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'VERBAL_CONFIRMATION'
  | 'WON'
  | 'LOST';

export type ClientStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'FORMER_CLIENT';

export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod = 'BANK_TRANSFER' | 'UPI' | 'STRIPE' | 'CASH' | 'CHEQUE' | 'OTHER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type FollowupType =
  | 'CALL'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'MEETING'
  | 'LINKEDIN'
  | 'PROPOSAL_FOLLOWUP'
  | 'PAYMENT_FOLLOWUP'
  | 'OTHER';

export type FollowupStatus = 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';

export type AccountCategory =
  | 'HOSTING'
  | 'DOMAIN'
  | 'EMAIL'
  | 'CLOUD'
  | 'SOCIAL_MEDIA'
  | 'ADVERTISING'
  | 'ANALYTICS'
  | 'CRM'
  | 'PAYMENT_GATEWAY'
  | 'DEVELOPER_TOOL'
  | 'CLIENT_ACCOUNT'
  | 'OTHER';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  industry?: string;
  website?: string;
  status: ClientStatus;
  clientSince: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  phone?: string;
  email?: string;
  country: string;
  city?: string;
  industry?: string;
  website?: string;
  leadSource: LeadSource;
  status: LeadStatus;
  estimatedValue?: number;
  currency: string;
  notes?: string;
  assignedToId?: string;
  assignedToName?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Deal {
  id: string;
  dealName: string;
  service: string;
  description?: string;
  dealValue: number;
  currency: string;
  probability: number; // 0-100
  stage: DealStage;
  proposalDate?: string;
  expectedClosingDate?: string;
  actualClosingDate?: string;
  notes?: string;
  clientId: string;
  clientName?: string;
  leadId?: string;
  assignedToId?: string;
  assignedToName?: string;
  nextFollowup?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Project {
  id: string;
  projectName: string;
  clientId: string;
  clientName?: string;
  status: string;
  budget?: number;
  currency: string;
  startDate: string;
  endDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  dealId?: string;
  dealName?: string;
  invoiceAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName?: string;
  dealId?: string;
  dealName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  dealId?: string;
  dealName?: string;
  projectId?: string;
  projectName?: string;
  assignedToId?: string;
  assignedToName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Followup {
  id: string;
  clientId?: string;
  clientName?: string;
  leadId?: string;
  leadName?: string;
  dealId?: string;
  dealName?: string;
  assignedToId?: string;
  assignedToName?: string;
  followupDate: string;
  followupType: FollowupType;
  status: FollowupStatus;
  notes?: string;
  outcome?: string;
  nextFollowup?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// SECURITY: NO PLAINTEXT PASSWORDS STORED
export interface AccountRegistry {
  id: string;
  serviceName: string;
  category: AccountCategory;
  url?: string;
  username?: string;
  owner?: string;
  twoFactorEnabled: boolean;
  credentialManager: string; // "Bitwarden", "1Password", "Vaultwarden"
  credentialReference: string; // e.g. "AWS Production / parxcon-infra"
  renewalDate?: string;
  associatedClientId?: string;
  associatedClientName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Renewal {
  id: string;
  service: string;
  provider: string;
  renewalDate: string;
  cost: number;
  currency: string;
  autoRenewal: boolean;
  owner?: string;
  alertDays: number[]; // [30, 15, 7, 1]
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userName: string;
  action: string; // CREATE, UPDATE, DELETE, PAYMENT, STATUS_CHANGE, AI_ACTION, AUTH
  entityType: string; // Lead, Deal, Client, Payment, Task, Followup, Account, System
  entityId?: string;
  entityName?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  target: string; // User ID or 'ALL'
  isRead: boolean;
  channel: 'SYSTEM' | 'EMAIL' | 'SLACK' | 'WHATSAPP';
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: string;
  toolResults?: string;
  createdAt: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  clients: Client[];
  leads: Lead[];
  deals: Deal[];
  projects: Project[];
  invoices: Invoice[];
  payments: Payment[];
  tasks: Task[];
  followups: Followup[];
  accounts: AccountRegistry[];
  renewals: Renewal[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  conversations: AiConversation[];
  messages: AiMessage[];
  settings: Record<string, string>;
}
