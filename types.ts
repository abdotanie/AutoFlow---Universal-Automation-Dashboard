

export enum WorkflowStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RUNNING = 'RUNNING',
}

export enum IntegrationStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  DISCONNECTED = 'DISCONNECTED',
  CHECKING = 'CHECKING' // UI state
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export type KeyScope = 'workflows:read' | 'workflows:write' | 'integrations:read' | 'integrations:write' | 'admin';

export interface Integration {
  id: string;
  name: string;
  icon: string; // Lucide icon name or URL
  connected: boolean;
  category: 'Communication' | 'Productivity' | 'Database' | 'Utility';
  status: IntegrationStatus;
  latencyMs: number;
  latencyTrend?: 'improving' | 'degrading' | 'stable';
  lastChecked: string; // ISO Date string
  uptime: number; // percentage
  errorMessage?: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  lastRun: string | null; // ISO Date string
  nodes: string[]; // List of integrated services involved
  successRate: number;
  schedule?: string; // Cron expression
  tags: string[];
  folderId?: string;
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  startTime: string;
  durationMs: number;
  status: LogStatus;
  outputMessage: string;
}

export interface Stats {
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  connectedServices: number;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source?: 'workflow' | 'integration' | 'system';
}

export interface AuditLogEntry {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  category: 'CREATE' | 'UPDATE' | 'DELETE' | 'SECURITY' | 'SYSTEM';
  resource: string;
  timestamp: string;
  ipAddress: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string; // The visible part e.g., sk_live_...
  key?: string; // Only present immediately after creation for display
  scopes: KeyScope[];
  rateLimit: number; // requests per minute
  createdAt: string;
  lastUsed: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface N8nInstance {
  id: string;
  name: string;
  url: string;
  active: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'automation' | 'optimization' | 'security';
  impact: 'High' | 'Medium' | 'Low';
  tools: string[];
}