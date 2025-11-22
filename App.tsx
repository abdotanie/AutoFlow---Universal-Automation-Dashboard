import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import Integrations from './pages/Integrations';
import Logs from './pages/Logs';
import Usage from './pages/Usage';
import Assistant from './pages/Assistant';
import Insights from './pages/Insights';
import SettingsPage from './pages/Settings';
import NotificationPanel from './components/NotificationPanel';
import { Workflow, WorkflowStatus, ExecutionLog, LogStatus, Integration, IntegrationStatus, Folder } from './types';
import { socketService } from './services/websocket';
import { ThemeProvider } from './context/ThemeContext';
import { useNotification } from './context/NotificationContext';

// Initial Mock Data
const INITIAL_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Marketing' },
  { id: 'f2', name: 'DevOps' },
  { id: 'f3', name: 'Sales' },
];

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: '1',
    name: 'Lead Sync: Form to Slack',
    description: 'Notify the sales channel when a high-value lead submits the website form.',
    status: WorkflowStatus.ACTIVE,
    lastRun: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    nodes: ['Webhook', 'Filter', 'Slack'],
    successRate: 98,
    tags: ['Sales', 'Notifications'],
    folderId: 'f3'
  },
  {
    id: '2',
    name: 'Weekly Report Generator',
    description: 'Pull data from PostgreSQL, format in Google Sheets, and email PDF.',
    status: WorkflowStatus.ACTIVE,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    nodes: ['Cron', 'PostgreSQL', 'Google Sheets', 'Gmail'],
    successRate: 100,
    schedule: '0 9 * * 1', // Every Monday at 9am
    tags: ['Reporting', 'Data'],
    folderId: 'f1'
  },
  {
    id: '3',
    name: 'Customer Onboarding',
    description: 'Send welcome email series and add to CRM.',
    status: WorkflowStatus.INACTIVE,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), // > 30 days ago
    nodes: ['Stripe', 'Mailchimp', 'Salesforce'],
    successRate: 92,
    tags: ['Onboarding', 'Email'],
    folderId: 'f3'
  }
];

const INITIAL_INTEGRATIONS: Integration[] = [
  { 
    id: '1', 
    name: 'Gmail', 
    icon: 'Mail', 
    connected: true, 
    category: 'Communication',
    status: IntegrationStatus.HEALTHY,
    latencyMs: 45,
    latencyTrend: 'stable',
    lastChecked: new Date().toISOString(),
    uptime: 99.9
  },
  { 
    id: '2', 
    name: 'Slack', 
    icon: 'Slack', 
    connected: true, 
    category: 'Communication',
    status: IntegrationStatus.HEALTHY,
    latencyMs: 62,
    latencyTrend: 'stable',
    lastChecked: new Date().toISOString(),
    uptime: 99.8
  },
  { 
    id: '3', 
    name: 'Google Sheets', 
    icon: 'Sheet', 
    connected: true, 
    category: 'Productivity',
    status: IntegrationStatus.DEGRADED,
    latencyMs: 420, // High latency
    latencyTrend: 'degrading',
    lastChecked: new Date().toISOString(),
    uptime: 98.5,
    errorMessage: 'High API latency detected'
  },
  { 
    id: '4', 
    name: 'Notion', 
    icon: 'Database', 
    connected: false, 
    category: 'Productivity',
    status: IntegrationStatus.DISCONNECTED,
    latencyMs: 0,
    latencyTrend: 'stable',
    lastChecked: new Date(Date.now() - 86400000).toISOString(),
    uptime: 0
  },
  { 
    id: '5', 
    name: 'PostgreSQL', 
    icon: 'Database', 
    connected: true, 
    category: 'Database',
    status: IntegrationStatus.HEALTHY,
    latencyMs: 12,
    latencyTrend: 'stable',
    lastChecked: new Date().toISOString(),
    uptime: 100
  },
  { 
    id: '6', 
    name: 'GitHub', 
    icon: 'Github', 
    connected: true, 
    category: 'Utility',
    status: IntegrationStatus.EXPIRED,
    latencyMs: 0,
    latencyTrend: 'stable',
    lastChecked: new Date().toISOString(),
    uptime: 95.5,
    errorMessage: 'OAuth Token Expired'
  },
];

const INITIAL_LOGS: ExecutionLog[] = [
  {
    id: 'l1',
    workflowId: '1',
    workflowName: 'Lead Sync: Form to Slack',
    startTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    durationMs: 450,
    status: LogStatus.SUCCESS,
    outputMessage: 'Message sent to #sales-leads'
  },
  {
    id: 'l2',
    workflowId: '1',
    workflowName: 'Lead Sync: Form to Slack',
    startTime: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    durationMs: 420,
    status: LogStatus.SUCCESS,
    outputMessage: 'Message sent to #sales-leads'
  },
  {
    id: 'l3',
    workflowId: '2',
    workflowName: 'Weekly Report Generator',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    durationMs: 1240,
    status: LogStatus.SUCCESS,
    outputMessage: 'Email sent to management@corp.com'
  },
  {
    id: 'l4',
    workflowId: '3',
    workflowName: 'Customer Onboarding',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    durationMs: 800,
    status: LogStatus.FAILED,
    outputMessage: 'API Rate Limit Exceeded (Mailchimp)'
  },
];

const App: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [logs, setLogs] = useState<ExecutionLog[]>(INITIAL_LOGS);
  
  // Hooks
  const { addNotification } = useNotification();

  // Sync workflows with the socket service so it generates relevant logs
  useEffect(() => {
    socketService.updateWorkflows(workflows);
  }, [workflows]);

  // Global Integration Monitoring (Simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setIntegrations(prevIntegrations => {
        return prevIntegrations.map(i => {
          if (!i.connected) return i;
          
          // Simulate latency fluctuation
          const change = Math.random() > 0.5 ? 5 : -5;
          const newLatency = Math.max(10, i.latencyMs + change);
          
          // Determine Trend
          let trend: 'improving' | 'degrading' | 'stable' = 'stable';
          if (newLatency > i.latencyMs + 2) trend = 'degrading';
          else if (newLatency < i.latencyMs - 2) trend = 'improving';
          else trend = i.latencyTrend || 'stable';

          let newStatus = i.status;
          let errorMessage = i.errorMessage;

          // Degrade if high latency
          if (newLatency > 400) {
            newStatus = IntegrationStatus.DEGRADED;
            errorMessage = 'High Latency detected';
          } else if (i.status === IntegrationStatus.DEGRADED && newLatency < 300) {
             newStatus = IntegrationStatus.HEALTHY;
             errorMessage = undefined;
          }
          
          // 1% chance of random error for testing notification
          if (Math.random() < 0.01 && newStatus === IntegrationStatus.HEALTHY) {
            newStatus = IntegrationStatus.ERROR;
            errorMessage = 'Unexpected Connection Drop';
            
            // Trigger Notification
            addNotification({
              type: 'error',
              title: 'Integration Failed',
              message: `Connection to ${i.name} dropped unexpectedly.`,
              source: 'integration'
            });
          }

          return {
            ...i,
            latencyMs: newLatency,
            latencyTrend: trend,
            status: newStatus,
            errorMessage
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [addNotification]);

  // Connect to WebSocket Service
  useEffect(() => {
    socketService.connect();

    const handleRealtimeLog = (newLog: ExecutionLog) => {
      setLogs(prevLogs => {
        // Check if log ID already exists (for status updates: RUNNING -> SUCCESS)
        const existingIndex = prevLogs.findIndex(l => l.id === newLog.id);
        
        if (existingIndex >= 0) {
          const updatedLogs = [...prevLogs];
          updatedLogs[existingIndex] = newLog;
          return updatedLogs;
        }

        // Add new log and limit history to 500
        const updated = [newLog, ...prevLogs];
        return updated.slice(0, 500);
      });
      
      // Update workflow last run
      if (newLog.status !== LogStatus.RUNNING) {
        setWorkflows(prevWorkflows => prevWorkflows.map(w => 
          w.id === newLog.workflowId 
            ? { ...w, lastRun: newLog.startTime } 
            : w
        ));
      }

      // Trigger Notifications on Failure
      if (newLog.status === LogStatus.FAILED) {
        addNotification({
          type: 'error',
          title: 'Workflow Execution Failed',
          message: `Workflow "${newLog.workflowName}" failed: ${newLog.outputMessage}`,
          source: 'workflow'
        });
      }
    };

    const handleWorkflowUpdate = (updatedWorkflow: Workflow) => {
      setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
      addNotification({
        type: 'info',
        title: 'Workflow Status Updated',
        message: `Workflow "${updatedWorkflow.name}" was set to ${updatedWorkflow.status} by system.`,
        source: 'system'
      });
    };

    socketService.onLog(handleRealtimeLog);
    socketService.onWorkflowUpdate(handleWorkflowUpdate);

    return () => {
      socketService.offLog(handleRealtimeLog);
      socketService.offWorkflowUpdate(handleWorkflowUpdate);
      socketService.disconnect();
    };
  }, [addNotification]);

  const handleToggleWorkflowStatus = (id: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: w.status === WorkflowStatus.ACTIVE ? WorkflowStatus.INACTIVE : WorkflowStatus.ACTIVE }
        : w
    ));
  };

  const handleAddWorkflow = (workflow: Workflow) => {
    setWorkflows(prev => [workflow, ...prev]);
    addNotification({
      type: 'success',
      title: 'Workflow Created',
      message: `"${workflow.name}" has been successfully created.`,
      source: 'system'
    });
  };
  
  const handleUpdateWorkflow = (updatedWorkflow: Workflow) => {
    setWorkflows(prev => prev.map(w => 
      w.id === updatedWorkflow.id ? updatedWorkflow : w
    ));
  };

  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = { id: crypto.randomUUID(), name };
    setFolders(prev => [...prev, newFolder]);
  };

  const handleUpdateIntegration = (updatedIntegration: Integration) => {
    setIntegrations(prev => prev.map(i => 
      i.id === updatedIntegration.id ? updatedIntegration : i
    ));
    
    // If manually updated to Healthy, notify
    if (updatedIntegration.status === IntegrationStatus.HEALTHY) {
      addNotification({
        type: 'success',
        title: 'Integration Restored',
        message: `${updatedIntegration.name} is now connected and healthy.`,
        source: 'integration'
      });
    }
  };

  const handleRunWorkflow = (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) return;

    const logId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    // 1. Add a temporary "Running" log
    const runningLog: ExecutionLog = {
      id: logId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      startTime: startTime,
      durationMs: 0,
      status: LogStatus.RUNNING,
      outputMessage: 'Workflow execution in progress...'
    };

    setLogs(prev => [runningLog, ...prev]);
    addNotification({
       type: 'info',
       title: 'Workflow Started',
       message: `Manually triggered "${workflow.name}".`,
       source: 'workflow'
    });

    // 2. Simulate backend execution completion
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success chance
      
      const endStatus = isSuccess ? LogStatus.SUCCESS : LogStatus.FAILED;
      const endMsg = isSuccess ? 'Workflow completed successfully.' : 'Error: Connection timeout.';

      setLogs(prev => prev.map(log => {
        if (log.id === logId) {
          return {
            ...log,
            durationMs: Math.floor(Math.random() * 1000) + 200,
            status: endStatus,
            outputMessage: endMsg
          };
        }
        return log;
      }));
      
      setWorkflows(prev => prev.map(w => 
        w.id === id ? { ...w, lastRun: startTime } : w
      ));

      addNotification({
        type: isSuccess ? 'success' : 'error',
        title: isSuccess ? 'Workflow Completed' : 'Workflow Failed',
        message: `"${workflow.name}" finished: ${endMsg}`,
        source: 'workflow'
      });

    }, 2000);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
          <Sidebar />
          <NotificationPanel />
          <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
            <div className="max-w-7xl mx-auto h-full">
              <Routes>
                <Route 
                  path="/" 
                  element={<Dashboard workflows={workflows} recentLogs={logs} />} 
                />
                <Route 
                  path="/workflows" 
                  element={
                    <Workflows 
                      workflows={workflows} 
                      folders={folders}
                      onToggleStatus={handleToggleWorkflowStatus}
                      onRunWorkflow={handleRunWorkflow}
                      onAddWorkflow={handleAddWorkflow}
                      onUpdateWorkflow={handleUpdateWorkflow}
                      onCreateFolder={handleCreateFolder}
                    />
                  } 
                />
                <Route 
                  path="/integrations" 
                  element={
                    <Integrations 
                      integrations={integrations} 
                      onUpdateIntegration={handleUpdateIntegration} 
                    />
                  } 
                />
                <Route 
                  path="/logs" 
                  element={<Logs logs={logs} />} 
                />
                <Route 
                  path="/insights" 
                  element={<Insights workflows={workflows} logs={logs} integrations={integrations} />} 
                />
                <Route 
                  path="/usage" 
                  element={<Usage workflows={workflows} logs={logs} />} 
                />
                <Route 
                  path="/assistant" 
                  element={<Assistant workflows={workflows} logs={logs} onRunWorkflow={handleRunWorkflow} />} 
                />
                <Route 
                  path="/settings" 
                  element={<SettingsPage />} 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;