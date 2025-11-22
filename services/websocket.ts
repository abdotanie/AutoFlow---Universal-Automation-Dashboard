
import { ExecutionLog, LogStatus, Workflow, WorkflowStatus } from '../types';

type LogCallback = (log: ExecutionLog) => void;
type WorkflowCallback = (workflow: Workflow) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private logListeners: LogCallback[] = [];
  private workflowListeners: WorkflowCallback[] = [];
  private mockLogTimeout: any = null;
  private mockWorkflowTimeout: any = null;
  private isConnected: boolean = false;
  private workflows: Workflow[] = [];
  private useMock: boolean = true;

  connect(url: string = 'ws://localhost:8080/ws') {
    if (this.isConnected) return;
    
    console.log(`Initializing Real-time Log Stream...`);
    this.isConnected = true;
    
    // Attempt WebSocket connection
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WS Connected');
        this.useMock = false;
        this.stopMockStreams();
      };
      
      this.socket.onmessage = (e) => {
        try {
           const msg = JSON.parse(e.data);
           if (msg.type === 'LOG') this.notifyLogListeners(msg.data);
           if (msg.type === 'WORKFLOW_UPDATE') this.notifyWorkflowListeners(msg.data);
        } catch(err) { console.error('WS Message Error', err); }
      };

      this.socket.onerror = (error) => {
        console.warn('WS Error -> Fallback to Mock', error);
        this.useMock = true;
        this.startMockStreams();
      };
      
      this.socket.onclose = () => {
        console.log('WS Closed -> Switching to Mock');
        if (this.isConnected) { 
             this.useMock = true;
             this.startMockStreams();
        }
      };

    } catch (e) {
      console.warn('WS Init Failed -> Using Mock', e);
      this.useMock = true;
    }

    // Start mock immediately (race condition handled by useMock check or stopMockStreams on open)
    this.startMockStreams(); 
  }

  disconnect() {
    this.isConnected = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.stopMockStreams();
  }

  updateWorkflows(workflows: Workflow[]) {
    this.workflows = workflows;
  }

  onLog(callback: LogCallback) {
    this.logListeners.push(callback);
  }

  offLog(callback: LogCallback) {
    this.logListeners = this.logListeners.filter(cb => cb !== callback);
  }

  onWorkflowUpdate(callback: WorkflowCallback) {
    this.workflowListeners.push(callback);
  }

  offWorkflowUpdate(callback: WorkflowCallback) {
    this.workflowListeners = this.workflowListeners.filter(cb => cb !== callback);
  }

  private notifyLogListeners(log: ExecutionLog) {
    this.logListeners.forEach(cb => cb(log));
  }

  private notifyWorkflowListeners(workflow: Workflow) {
    this.workflowListeners.forEach(cb => cb(workflow));
  }

  private startMockStreams() {
    if (!this.mockLogTimeout) this.scheduleNextLog();
    if (!this.mockWorkflowTimeout) this.scheduleNextWorkflowUpdate();
  }

  private stopMockStreams() {
    if (this.mockLogTimeout) {
      clearTimeout(this.mockLogTimeout);
      this.mockLogTimeout = null;
    }
    if (this.mockWorkflowTimeout) {
      clearTimeout(this.mockWorkflowTimeout);
      this.mockWorkflowTimeout = null;
    }
  }

  private scheduleNextLog() {
    if (!this.isConnected) return;
    if (!this.useMock) return;

    // Random interval between 1s and 3s for logs
    const delay = Math.floor(Math.random() * 3000) + 1000;

    this.mockLogTimeout = setTimeout(() => {
      this.emitMockLifecycle();
      this.scheduleNextLog();
    }, delay);
  }

  private scheduleNextWorkflowUpdate() {
    if (!this.isConnected) return;
    if (!this.useMock) return;

    // Random interval between 15s and 45s for workflow status changes
    const delay = Math.floor(Math.random() * 30000) + 15000;

    this.mockWorkflowTimeout = setTimeout(() => {
      this.emitMockWorkflowUpdate();
      this.scheduleNextWorkflowUpdate();
    }, delay);
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'log_' + Math.random().toString(36).substr(2, 9);
  }

  private emitMockWorkflowUpdate() {
    if (!this.isConnected || this.workflows.length === 0) return;
    
    // Pick a random workflow
    const wf = this.workflows[Math.floor(Math.random() * this.workflows.length)];
    
    // Toggle its status
    const newStatus = wf.status === WorkflowStatus.ACTIVE ? WorkflowStatus.INACTIVE : WorkflowStatus.ACTIVE;
    
    const updatedWorkflow = { ...wf, status: newStatus };
    
    // Notify app of the update
    this.notifyWorkflowListeners(updatedWorkflow);
  }

  private emitMockLifecycle() {
    if (!this.isConnected) return;

    // Only generate logs for ACTIVE workflows
    const activeWorkflows = this.workflows.length > 0 
      ? this.workflows.filter(w => w.status === WorkflowStatus.ACTIVE)
      : [];

    if (activeWorkflows.length === 0) return;

    const randomWf = activeWorkflows[Math.floor(Math.random() * activeWorkflows.length)];
    const id = this.generateId();
    const startTime = new Date().toISOString();
    
    // 1. Emit RUNNING state
    const runningLog: ExecutionLog = {
      id,
      workflowId: randomWf.id,
      workflowName: randomWf.name,
      startTime: startTime,
      durationMs: 0,
      status: LogStatus.RUNNING,
      outputMessage: 'Processing workflow execution...',
    };

    this.notifyLogListeners(runningLog);

    // 2. Schedule Completion
    const executionTime = Math.floor(Math.random() * 2500) + 500;
    const isSuccess = Math.random() > 0.15; // 85% success rate

    const successMessages = [
      'Data synced successfully', 
      'Email delivered', 
      'Report generated', 
      'Payload processed', 
      'Webhook triggered',
      'Database record updated',
      'Cache invalidated',
      'Notification pushed'
    ];

    const errorMessages = [
      'Timeout waiting for API', 
      'Rate limit exceeded', 
      'Connection refused', 
      'Invalid JSON payload', 
      'Authentication failed',
      'Dependency service unavailable'
    ];

    setTimeout(() => {
      if (!this.isConnected) return;
      if (!this.useMock) return; // Stop if we switched to real

      const message = isSuccess 
        ? successMessages[Math.floor(Math.random() * successMessages.length)]
        : errorMessages[Math.floor(Math.random() * errorMessages.length)];

      const finalLog: ExecutionLog = {
        ...runningLog,
        durationMs: executionTime,
        status: isSuccess ? LogStatus.SUCCESS : LogStatus.FAILED,
        outputMessage: message,
      };

      this.notifyLogListeners(finalLog);
    }, executionTime);
  }
}

export const socketService = new WebSocketService();
