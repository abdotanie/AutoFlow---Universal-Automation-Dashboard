import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Activity,
  DollarSign,
  Lightbulb
} from 'lucide-react';
import { Workflow, ExecutionLog, LogStatus, WorkflowStatus } from '../types';

interface Props {
  workflows: Workflow[];
  logs: ExecutionLog[];
}

// Mock pricing model
const COST_PER_TASK = 0.0015; // $0.0015 per execution
const MONTHLY_QUOTA = 10000;
const BILLING_CYCLE_DAY = 1; // Resets on the 1st

const Usage: React.FC<Props> = ({ workflows, logs }) => {
  
  // --- Calculations ---

  const currentMonthLogs = useMemo(() => {
    const now = new Date();
    return logs.filter(log => {
      const logDate = new Date(log.startTime);
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    });
  }, [logs]);

  const totalTasksUsed = currentMonthLogs.length + 2450; // Adding base mock usage for visual realism
  const currentCost = totalTasksUsed * COST_PER_TASK;
  
  // Forecasting
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedCost = (currentCost / dayOfMonth) * daysInMonth;
  const usagePercentage = Math.min((totalTasksUsed / MONTHLY_QUOTA) * 100, 100);

  // Daily Usage Data (Mock generation based on current logs + noise)
  const dailyUsageData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Count actual logs for this day
      const realCount = logs.filter(l => new Date(l.startTime).getDate() === d.getDate()).length;
      // Add mock base load
      const total = realCount + Math.floor(Math.random() * 100) + 300;
      
      days.push({
        name: dayStr,
        tasks: total,
        cost: (total * COST_PER_TASK).toFixed(2)
      });
    }
    return days;
  }, [logs]);

  // Service Breakdown Data
  const serviceUsageData = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach(log => {
        // Infer service from workflow description/name loosely for demo
        const wf = workflows.find(w => w.id === log.workflowId);
        if (wf) {
            const keyService = wf.nodes.find(n => n !== 'Webhook' && n !== 'Filter') || 'Core';
            map[keyService] = (map[keyService] || 0) + 1;
        }
    });
    // Add some mock data for better chart visuals if logs are empty
    if (Object.keys(map).length < 3) {
        map['OpenAI'] = 450;
        map['Gmail'] = 320;
        map['PostgreSQL'] = 210;
        map['Slack'] = 180;
    }

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [logs, workflows]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

  // --- Optimization Recommendations ---

  const recommendations = useMemo(() => {
    const recs = [];
    
    // 1. Detect high failure rate workflows
    workflows.forEach(wf => {
      const wfLogs = logs.filter(l => l.workflowId === wf.id);
      const failures = wfLogs.filter(l => l.status === LogStatus.FAILED).length;
      if (wfLogs.length > 0 && (failures / wfLogs.length) > 0.3) {
        recs.push({
          type: 'critical',
          title: `High Failure Rate: ${wf.name}`,
          desc: 'Over 30% of executions fail. Debug or disable to save costs on retries.',
          action: 'Inspect Logs'
        });
      }
    });

    // 2. Detect Zombie Workflows (Active but no runs in 30 days)
    // (Using mock date logic for demo)
    workflows.forEach(wf => {
      if (wf.status === WorkflowStatus.ACTIVE && wf.lastRun) {
         const lastRun = new Date(wf.lastRun);
         const diffTime = Math.abs(Date.now() - lastRun.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         if (diffDays > 30) {
           recs.push({
             type: 'warning',
             title: `Unused Workflow: ${wf.name}`,
             desc: 'This workflow is active but hasn\'t triggered in 30+ days.',
             action: 'Deactivate'
           });
         }
      }
    });

    // 3. Generic Optimization if specific ones aren't found
    if (recs.length === 0) {
        recs.push({
            type: 'info',
            title: 'Consolidate Webhooks',
            desc: 'You have multiple workflows triggering on similar webhooks. Merging them could reduce overhead.',
            action: 'View Workflows'
        });
    }

    return recs;
  }, [workflows, logs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Usage & Billing</h1>
        <p className="text-slate-500 mt-2">Monitor your resource consumption and estimated costs.</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={64} className="text-blue-600" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-2">Month-to-Date Cost</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">${currentCost.toFixed(2)}</span>
            <span className="text-sm text-slate-500">USD</span>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
            <TrendingUp size={16} className="text-amber-500 mr-2" />
            <span>Forecast: <strong>${projectedCost.toFixed(2)}</strong> by month end</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Task Usage</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${usagePercentage > 80 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-slate-900">{totalTasksUsed.toLocaleString()}</span>
            <span className="text-sm text-slate-400">/ {MONTHLY_QUOTA.toLocaleString()} tasks</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-1000 ${usagePercentage > 80 ? 'bg-red-500' : 'bg-blue-600'}`} 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Resets in {daysInMonth - dayOfMonth} days</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-md border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="text-blue-400" size={24} />
            <div>
              <h3 className="font-bold text-lg">Pro Plan</h3>
              <p className="text-xs text-slate-400">Active until Oct 1, 2025</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-300">Included Seats</span>
              <span className="font-medium">5 / 5</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-300">API Rate Limit</span>
              <span className="font-medium">100 req/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Log Retention</span>
              <span className="font-medium">30 Days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Usage Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Daily Task Consumption</h3>
            <select className="text-sm border-slate-200 rounded-md text-slate-600 p-1 bg-slate-50">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyUsageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by Service Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-lg font-bold text-slate-800 mb-2">API Consumption</h3>
           <p className="text-sm text-slate-500 mb-6">Distribution of API calls by service.</p>
           
           <div className="h-60">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={serviceUsageData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {serviceUsageData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '8px' }} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Lightbulb className="text-violet-600" size={20} />
             Cost Optimization Insights
           </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className={`mt-1 p-2 rounded-lg ${rec.type === 'critical' ? 'bg-red-100 text-red-600' : rec.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                 {rec.type === 'critical' ? <AlertTriangle size={20} /> : rec.type === 'warning' ? <Activity size={20} /> : <Zap size={20} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{rec.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{rec.desc}</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                {rec.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Usage;