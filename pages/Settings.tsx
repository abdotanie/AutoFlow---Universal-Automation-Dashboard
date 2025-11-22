

import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Monitor, 
  Save,
  Check,
  Loader2,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Laptop,
  FileClock,
  Search,
  Filter,
  Download,
  Calendar,
  Lock,
  Users,
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  FileText,
  FileJson,
  CheckCircle,
  Webhook,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { AuditLogEntry, UserRole, ApiKey, KeyScope } from '../types';

// Mock Data for Audit Logs
const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: '1', userName: 'Alex Morgan', userEmail: 'alex.morgan@company.com', action: 'Updated Workflow', category: 'UPDATE', resource: 'Weekly Report Generator', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), ipAddress: '192.168.1.42' },
  { id: '2', userName: 'Alex Morgan', userEmail: 'alex.morgan@company.com', action: 'Login Successful', category: 'SECURITY', resource: 'Web Dashboard', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), ipAddress: '192.168.1.42' },
  { id: '3', userName: 'System', userEmail: 'system@autoflow.ai', action: 'Auto-Scale Triggered', category: 'SYSTEM', resource: 'Worker Pool', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), ipAddress: '10.0.0.1' },
  { id: '4', userName: 'Sarah Connor', userEmail: 'sarah@company.com', action: 'Created Workflow', category: 'CREATE', resource: 'Skynet Defense Protocol', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), ipAddress: '172.16.0.23' },
  { id: '5', userName: 'Alex Morgan', userEmail: 'alex.morgan@company.com', action: 'Deleted Integration', category: 'DELETE', resource: 'Old Notion DB', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), ipAddress: '192.168.1.42' },
  { id: '6', userName: 'Sarah Connor', userEmail: 'sarah@company.com', action: 'API Key Regenerated', category: 'SECURITY', resource: 'Main API Key', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), ipAddress: '172.16.0.23' },
  { id: '7', userName: 'System', userEmail: 'system@autoflow.ai', action: 'Backup Completed', category: 'SYSTEM', resource: 'Primary Database', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), ipAddress: '10.0.0.1' },
];

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: 'k1',
    name: 'Development Local',
    prefix: 'sk_test_...8f2a',
    scopes: ['workflows:read', 'workflows:write'],
    rateLimit: 60,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'k2',
    name: 'CI/CD Pipeline',
    prefix: 'sk_live_...x92m',
    scopes: ['admin'],
    rateLimit: 1000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'ACTIVE'
  }
];

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { addNotification, n8nInstances, addN8nInstance, removeN8nInstance, toggleN8nInstance } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance' | 'audit' | 'api-keys' | 'webhooks'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulated User Context
  const [currentUser, setCurrentUser] = useState({
    name: 'Alex Morgan',
    email: 'alex.morgan@company.com',
    role: UserRole.ADMIN // Default role
  });

  // Audit Filter State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState('ALL');
  const [isAuditExportOpen, setIsAuditExportOpen] = useState(false);

  // API Key State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<KeyScope[]>(['workflows:read']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  // Webhook State
  const [newN8nName, setNewN8nName] = useState('');
  const [newN8nUrl, setNewN8nUrl] = useState('');
  const [isAddingN8n, setIsAddingN8n] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your preferences have been updated successfully.',
        source: 'system'
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  // Redirect if user role loses access to current tab
  useEffect(() => {
    if (currentUser.role === UserRole.VIEWER && activeTab === 'audit') {
      setActiveTab('profile');
    }
  }, [currentUser.role, activeTab]);

  const filteredAuditLogs = useMemo(() => {
    let logs = MOCK_AUDIT_LOGS;

    // RBAC: Filter logs based on role
    if (currentUser.role !== UserRole.ADMIN) {
      // Non-admins can only see logs related to their own actions
      logs = logs.filter(log => log.userEmail === currentUser.email);
    }

    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.resource.toLowerCase().includes(auditSearch.toLowerCase());
      
      const matchesCategory = auditCategory === 'ALL' || log.category === auditCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [auditSearch, auditCategory, currentUser]);

  const tabs = useMemo(() => {
    const t = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'appearance', label: 'Appearance', icon: Monitor },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'webhooks', label: 'Webhooks & Alerts', icon: Webhook },
      { id: 'api-keys', label: 'API Keys', icon: Key },
    ];
    // RBAC: Only Admin and Editor can access Audit Logs tab
    if (currentUser.role !== UserRole.VIEWER) {
      t.push({ id: 'audit', label: 'Audit Logs', icon: FileClock });
    }
    return t;
  }, [currentUser.role]);

  // Download Helper
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Audit Log Export Handler
  const handleAuditExport = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-logs-${timestamp}.${format}`;

    if (format === 'json') {
      const jsonContent = JSON.stringify(filteredAuditLogs, null, 2);
      downloadFile(jsonContent, filename, 'application/json');
    } else {
      const headers = ['ID', 'User Name', 'User Email', 'Action', 'Category', 'Resource', 'Timestamp', 'IP Address'];
      const rows = filteredAuditLogs.map(log => [
        log.id,
        `"${log.userName}"`,
        `"${log.userEmail}"`,
        `"${log.action}"`,
        log.category,
        `"${log.resource}"`,
        log.timestamp,
        log.ipAddress
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      downloadFile(csvContent, filename, 'text/csv');
    }
    setIsAuditExportOpen(false);
  };

  // API Key Handlers
  const handleGenerateKey = () => {
    const randomPart = Array.from({length: 32}, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const fullKey = `sk_live_${randomPart}`;
    const prefix = `sk_live_...${randomPart.slice(-4)}`;
    
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      prefix: prefix,
      scopes: newKeyScopes,
      rateLimit: newKeyRateLimit,
      createdAt: new Date().toISOString(),
      lastUsed: 'Never',
      status: 'ACTIVE'
    };

    setApiKeys(prev => [newKey, ...prev]);
    setNewlyGeneratedKey(fullKey);
    setNewKeyName('');
    setNewKeyScopes(['workflows:read']);
    setNewKeyRateLimit(60);
    
    addNotification({
      type: 'success',
      title: 'API Key Generated',
      message: 'New API key created successfully. Please copy it now.',
      source: 'system'
    });
  };

  const confirmRevokeKey = () => {
    if (keyToRevoke) {
      setApiKeys(prev => prev.filter(k => k.id !== keyToRevoke));
      addNotification({
        type: 'info',
        title: 'API Key Revoked',
        message: 'The API key has been permanently revoked.',
        source: 'system'
      });
      setKeyToRevoke(null);
    }
  };

  const toggleScope = (scope: KeyScope) => {
    setNewKeyScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Copied to clipboard.',
      source: 'system'
    });
  };

  const handleAddN8nInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if(newN8nName && newN8nUrl) {
      addN8nInstance(newN8nName, newN8nUrl);
      setNewN8nName('');
      setNewN8nUrl('');
      setIsAddingN8n(false);
      addNotification({
        type: 'success',
        title: 'Instance Connected',
        message: `Connected to ${newN8nName} successfully.`,
        source: 'system'
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and application configuration.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Current Plan</span>
            </div>
            <p className="font-bold text-indigo-900 dark:text-indigo-200">Pro Enterprise</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 mb-3">Next billing date: Oct 1, 2025</p>
            <button className="w-full py-1.5 bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors">
              Manage Subscription
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[500px]">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">{tabs.find(t => t.id === activeTab)?.label} Settings</h2>
            {activeTab !== 'audit' && activeTab !== 'api-keys' && activeTab !== 'webhooks' && (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  saveSuccess 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={16} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>

          <div className="p-6 lg:p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-muted border-4 border-card shadow-sm overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 border-2 border-card">
                      <User size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                {/* Role Switcher for Demo */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      Role Simulator
                    </h3>
                    <span className="text-[10px] text-muted-foreground bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">Demo Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Change your role to test access controls. Admins see all logs, Editors see only their own, Viewers have no access.
                  </p>
                  <div className="flex gap-2">
                    {Object.values(UserRole).map(role => (
                      <button
                        key={role}
                        onClick={() => setCurrentUser(prev => ({ ...prev, role }))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          currentUser.role === role
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                    <input 
                      type="text" 
                      defaultValue="Alex"
                      onChange={(e) => setCurrentUser(p => ({ ...p, name: e.target.value + ' Morgan' }))}
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue="Morgan"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      defaultValue="alex.morgan@company.com"
                      onChange={(e) => setCurrentUser(p => ({ ...p, email: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
                  <textarea 
                    rows={4}
                    defaultValue="Lead DevOps Engineer passionate about automation and AI."
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground resize-none" 
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Mail size={18} className="text-slate-400" />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    <ToggleItem 
                      title="Workflow Failures" 
                      description="Get notified immediately when a critical workflow fails." 
                      defaultChecked={true} 
                    />
                    <ToggleItem 
                      title="Weekly Digest" 
                      description="A summary of your automation performance delivered every Monday." 
                      defaultChecked={true} 
                    />
                    <ToggleItem 
                      title="Product Updates" 
                      description="News about new features and integration updates." 
                      defaultChecked={false} 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Smartphone size={18} className="text-slate-400" />
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    <ToggleItem 
                      title="Browser Alerts" 
                      description="Show desktop notifications when workflows complete." 
                      defaultChecked={false} 
                    />
                    <ToggleItem 
                      title="Security Alerts" 
                      description="Notify me of suspicious login attempts." 
                      defaultChecked={true} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Interface Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`group relative p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${
                        theme === 'light' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-border hover:border-slate-300 dark:hover:border-slate-600 bg-card hover:bg-muted'
                      }`}
                    >
                      <div className="w-full aspect-video bg-white rounded-lg border border-slate-200 shadow-sm group-hover:shadow-md flex items-center justify-center">
                        <Sun className="text-blue-500" size={24} />
                      </div>
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>Light</span>
                      {theme === 'light' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`group relative p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${
                        theme === 'dark' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-border hover:border-slate-300 dark:hover:border-slate-600 bg-card hover:bg-muted'
                      }`}
                    >
                      <div className="w-full aspect-video bg-slate-900 rounded-lg shadow-sm group-hover:shadow-md flex items-center justify-center">
                        <Moon className="text-slate-400" size={24} />
                      </div>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>Dark</span>
                      {theme === 'dark' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setTheme('system')}
                      className={`group relative p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${
                        theme === 'system' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-border hover:border-slate-300 dark:hover:border-slate-600 bg-card hover:bg-muted'
                      }`}
                    >
                      <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm group-hover:shadow-md flex items-center justify-center">
                        <Laptop className="text-slate-500" size={24} />
                      </div>
                      <span className={`text-sm font-medium ${theme === 'system' ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>System</span>
                      {theme === 'system' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                   <label className="block text-sm font-medium text-foreground mb-3">Density</label>
                   <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 rounded bg-card border border-border"></div>
                           <div className="h-2 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-4 rounded bg-card border border-border"></div>
                           <div className="h-2 w-16 bg-slate-300 dark:bg-slate-600 rounded"></div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">Comfortable</span>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 max-w-2xl">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
                   <Shield className="text-amber-600 shrink-0" size={20} />
                   <div>
                     <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500">Two-Factor Authentication is inactive</h4>
                     <p className="text-xs text-amber-700 dark:text-amber-600 mt-1">Secure your account by enabling 2FA via Authenticator App.</p>
                     <button className="mt-2 text-xs font-bold text-amber-800 dark:text-amber-500 hover:text-amber-900 underline">Enable 2FA</button>
                   </div>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <input 
                      type="password" 
                      placeholder="Current Password"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground" 
                    />
                    <input 
                      type="password" 
                      placeholder="New Password"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground" 
                    />
                    <input 
                      type="password" 
                      placeholder="Confirm New Password"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground" 
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-border">
                   <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                   <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all of your content.</p>
                   <button className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors">
                     Delete Account
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'webhooks' && (
              <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div>
                     <h3 className="text-lg font-bold text-foreground">Webhooks & Alerts</h3>
                     <p className="text-sm text-muted-foreground">Manage connections to external services like n8n for critical alerts.</p>
                   </div>
                   <button 
                     onClick={() => setIsAddingN8n(true)}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                   >
                     <Plus size={16} />
                     Connect Instance
                   </button>
                 </div>

                 {isAddingN8n && (
                   <form onSubmit={handleAddN8nInstance} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border animate-in slide-in-from-top-2">
                     <h4 className="font-bold text-foreground mb-3 text-sm">New Connection</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <div>
                         <label className="block text-xs font-medium text-muted-foreground mb-1">Instance Name</label>
                         <input 
                           type="text" 
                           value={newN8nName}
                           onChange={(e) => setNewN8nName(e.target.value)}
                           placeholder="e.g. Production n8n"
                           className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground text-sm"
                           autoFocus
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-muted-foreground mb-1">Webhook URL</label>
                         <input 
                           type="text" 
                           value={newN8nUrl}
                           onChange={(e) => setNewN8nUrl(e.target.value)}
                           placeholder="https://n8n.example.com/webhook/..."
                           className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground text-sm"
                         />
                       </div>
                     </div>
                     <div className="flex justify-end gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsAddingN8n(false)}
                          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={!newN8nName || !newN8nUrl}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Connection
                        </button>
                     </div>
                   </form>
                 )}

                 <div className="space-y-4">
                   {n8nInstances.map(instance => (
                     <div key={instance.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-border p-4 flex flex-col md:flex-row items-center gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-600">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                           <Webhook size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground truncate">{instance.name}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              instance.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {instance.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-md">
                            {instance.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                           <button 
                             onClick={() => {
                               // Mock test trigger
                               addNotification({
                                 type: 'info',
                                 title: `Test Alert sent to ${instance.name}`,
                                 message: 'Verifying webhook connectivity...',
                                 source: 'system'
                               });
                             }}
                             className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                             title="Test Connection"
                           >
                             <Zap size={16} />
                           </button>
                           
                           <button 
                             onClick={() => toggleN8nInstance(instance.id)}
                             className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                               instance.active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                             }`}
                             title={instance.active ? "Pause" : "Resume"}
                           >
                             <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                               instance.active ? 'translate-x-5' : 'translate-x-0'
                             }`} />
                           </button>

                           <button 
                             onClick={() => removeN8nInstance(instance.id)}
                             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-2"
                             title="Remove Instance"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                   ))}

                   {n8nInstances.length === 0 && !isAddingN8n && (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="mx-auto w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <Webhook className="text-slate-400" size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-foreground">No Connected Instances</h3>
                        <p className="text-xs text-muted-foreground mt-1">Connect an n8n instance to receive critical alerts.</p>
                      </div>
                   )}
                 </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div>
                     <h3 className="text-lg font-bold text-foreground">Personal API Keys</h3>
                     <p className="text-sm text-muted-foreground">Manage keys for accessing the AutoFlow API programmatically.</p>
                   </div>
                   <button 
                     onClick={() => { setIsCreateKeyOpen(true); setNewlyGeneratedKey(null); }}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                   >
                     <Plus size={16} />
                     Generate New Key
                   </button>
                </div>
                
                {/* Key List */}
                <div className="space-y-4">
                  {apiKeys.map(key => (
                    <div key={key.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-border p-4 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 mt-1 md:mt-0">
                          <Key size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-foreground">{key.name}</h4>
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                              {key.prefix}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                             {key.scopes.map(scope => (
                               <span key={scope} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                                 {scope}
                               </span>
                             ))}
                             <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-600">
                               Limit: {key.rateLimit} req/min
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                            <span>Last Used: {key.lastUsed === 'Never' ? 'Never' : new Date(key.lastUsed).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setKeyToRevoke(key.id)}
                        className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto md:ml-0"
                        title="Revoke Key"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {apiKeys.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      <div className="mx-auto w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Key className="text-slate-400" size={24} />
                      </div>
                      <h3 className="text-sm font-medium text-foreground">No API Keys</h3>
                      <p className="text-xs text-muted-foreground mt-1">Generate a key to get started with the API.</p>
                    </div>
                  )}
                </div>

                {/* Create Key Modal */}
                {isCreateKeyOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                      <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">Generate New API Key</h3>
                        <button onClick={() => setIsCreateKeyOpen(false)} className="text-muted-foreground hover:text-foreground">
                          <X size={20} />
                        </button>
                      </div>
                      
                      {!newlyGeneratedKey ? (
                        <div className="p-6 space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Key Name</label>
                            <input 
                              type="text" 
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                              placeholder="e.g. CI/CD Pipeline"
                              className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Key Scopes</label>
                            <div className="grid grid-cols-2 gap-2">
                               {['workflows:read', 'workflows:write', 'integrations:read', 'integrations:write', 'admin'].map((scope) => (
                                 <button
                                   key={scope}
                                   onClick={() => toggleScope(scope as KeyScope)}
                                   className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                                     newKeyScopes.includes(scope as KeyScope)
                                       ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                                       : 'bg-background border-border text-muted-foreground hover:border-slate-300'
                                   }`}
                                 >
                                   <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                      newKeyScopes.includes(scope as KeyScope) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'
                                   }`}>
                                      {newKeyScopes.includes(scope as KeyScope) && <Check size={10} className="text-white" />}
                                   </div>
                                   {scope}
                                 </button>
                               ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Rate Limit (Req/Min)</label>
                            <select 
                              value={newKeyRateLimit}
                              onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                            >
                              <option value={60}>60 req/min (Standard)</option>
                              <option value={1000}>1,000 req/min (High Performance)</option>
                              <option value={5000}>5,000 req/min (Enterprise)</option>
                            </select>
                          </div>

                          <div className="pt-2">
                             <button 
                               onClick={handleGenerateKey}
                               disabled={!newKeyName}
                               className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               Generate Key
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 space-y-6">
                           <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-start gap-3 border border-green-200 dark:border-green-900">
                              <CheckCircle className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={20} />
                              <div>
                                <h4 className="font-bold text-green-800 dark:text-green-300">API Key Generated</h4>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">Please copy your key now. You won't be able to see it again.</p>
                              </div>
                           </div>

                           <div>
                             <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Secret Key</label>
                             <div className="flex items-center gap-2">
                               <code className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-border font-mono text-sm break-all text-foreground">
                                 {newlyGeneratedKey}
                               </code>
                               <button 
                                 onClick={() => copyToClipboard(newlyGeneratedKey || '')}
                                 className="p-3 bg-slate-100 dark:bg-slate-800 border border-border rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                 title="Copy to clipboard"
                               >
                                 <Copy size={18} />
                               </button>
                             </div>
                           </div>
                           
                           <div className="flex justify-end">
                             <button 
                               onClick={() => setIsCreateKeyOpen(false)}
                               className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-lg font-medium transition-opacity"
                             >
                               Done
                             </button>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Revoke Confirmation Modal */}
                {keyToRevoke && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                      <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Revoke API Key?</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-6">
                          Are you sure you want to revoke this key? Any applications using it will lose access immediately. This action cannot be undone.
                        </p>
                        
                        <div className="flex gap-3 w-full">
                          <button 
                            onClick={() => setKeyToRevoke(null)}
                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={confirmRevokeKey}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                          >
                            Revoke Key
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-6">
                {/* RBAC Banner */}
                {currentUser.role !== UserRole.ADMIN && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
                    <Lock size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Limited Access</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        You are viewing logs in <strong>Editor</strong> mode. You can only see actions performed by your account ({currentUser.email}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-border">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search user, action, or resource..."
                            value={auditSearch}
                            onChange={(e) => setAuditSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={auditCategory}
                            onChange={(e) => setAuditCategory(e.target.value)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                        >
                            <option value="ALL">All Events</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="SECURITY">Security</option>
                            <option value="SYSTEM">System</option>
                        </select>
                        <div className="relative">
                          <button 
                            onClick={() => setIsAuditExportOpen(!isAuditExportOpen)}
                            className="px-3 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <Download size={18} />
                            <span className="hidden sm:inline">Export</span>
                          </button>
                          
                          {isAuditExportOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setIsAuditExportOpen(false)}
                              />
                              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                <button
                                  onClick={() => handleAuditExport('csv')}
                                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors"
                                >
                                  <FileText size={14} />
                                  Export CSV
                                </button>
                                <button
                                  onClick={() => handleAuditExport('json')}
                                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 border-t border-slate-50 dark:border-slate-700 transition-colors"
                                >
                                  <FileJson size={14} />
                                  Export JSON
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Resource</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {filteredAuditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{log.userName}</p>
                                                <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                            log.category === 'CREATE' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' :
                                            log.category === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900' :
                                            log.category === 'SECURITY' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900' :
                                            log.category === 'SYSTEM' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900' :
                                            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">
                                        {log.resource}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {new Date(log.timestamp).toLocaleDateString()} <span className="text-xs opacity-60">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground font-mono text-xs">
                                        {log.ipAddress}
                                    </td>
                                </tr>
                            ))}
                             {filteredAuditLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        {currentUser.role === UserRole.EDITOR 
                                          ? "No audit logs found for your account." 
                                          : "No audit logs found matching your filters."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ title: string; description: string; defaultChecked: boolean }> = ({ title, description, defaultChecked }) => {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
};

export default Settings;
