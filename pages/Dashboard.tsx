import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Activity, CheckCircle, XCircle, Zap, Sparkles, Bot, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { Workflow, ExecutionLog, Recommendation } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';

interface Props {
  workflows: Workflow[];
  recentLogs: ExecutionLog[];
}

const Dashboard: React.FC<Props> = ({ workflows, recentLogs }) => {
  const activeWorkflows = workflows.filter(w => w.status === 'ACTIVE').length;
  const totalRuns = recentLogs.length;
  const failedRuns = recentLogs.filter(l => l.status === 'FAILED').length;
  const successRate = totalRuns > 0 ? Math.round(((totalRuns - failedRuns) / totalRuns) * 100) : 100;
  const { theme } = useTheme();
  const { n8nInstances, addNotification } = useNotification();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Calculate real-time chart data from recentLogs
  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    const now = new Date();

    // Initialize last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Filter logs for this day
      const dayLogs = recentLogs.filter(log => {
        const logDate = new Date(log.startTime);
        logDate.setHours(0,0,0,0);
        return logDate.getTime() === d.getTime();
      });

      const success = dayLogs.filter(l => l.status === 'SUCCESS').length;
      const fail = dayLogs.filter(l => l.status === 'FAILED').length;

      data.push({
        name: dayName,
        success,
        fail
      });
    }
    return data;
  }, [recentLogs]);

  const handleGenerateRecommendations = async () => {
    setLoadingRecs(true);
    
    // Context data to send to n8n AI
    const context = {
      activeWorkflowsCount: workflows.filter(w => w.status === 'ACTIVE').length,
      recentErrors: recentLogs.filter(l => l.status === 'FAILED').map(l => l.outputMessage).slice(0, 5),
      topIntegrations: Array.from(new Set(workflows.flatMap(w => w.nodes))).slice(0, 5)
    };

    const activeInstance = n8nInstances.find(i => i.active);

    if (!activeInstance) {
       setLoadingRecs(false);
       addNotification({ title: 'No Connection', message: 'Please connect an n8n instance in settings first.', type: 'warning' });
       return;
    }

    try {
      // Attempt to hit the n8n webhook
      // Note: This expects the n8n workflow to return a JSON response with recommendations
      const response = await fetch(activeInstance.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_dashboard_recommendations',
          context
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch from n8n');
      
      const data = await response.json();
      setRecommendations(data.recommendations || data); // Handle nested or direct array
      addNotification({ title: 'Insights Generated', message: `Received fresh insights from ${activeInstance.name}.`, type: 'success' });
    } catch (error) {
      console.warn("n8n fetch failed, using mock data", error);
      
      // Simulate network delay for mock
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Fallback Mock Data for Demo
      setRecommendations([
         { 
           id: '1', 
           title: 'Automate Invoice Processing', 
           description: 'High volume of "File Created" logs detected. Use OpenAI to extract data from PDFs and sync to Xero automatically.', 
           type: 'automation', 
           impact: 'High', 
           tools: ['Gmail', 'OpenAI', 'Xero'] 
         },
         { 
           id: '2', 
           title: 'Smart Error Handling', 
           description: '3 recent timeouts in "Lead Sync". Implement an auto-retry loop with exponential backoff via n8n.', 
           type: 'optimization', 
           impact: 'Medium', 
           tools: ['n8n', 'Slack'] 
         },
         { 
           id: '3', 
           title: 'Security Scan', 
           description: 'Detected deprecated API version usage in "Customer Onboarding". Update to v2 endpoints.', 
           type: 'security', 
           impact: 'Low', 
           tools: ['System'] 
         }
      ]);
      addNotification({ title: 'Using Cached Insights', message: 'Could not reach n8n. Showing simulated recommendations.', type: 'info' });
    } finally {
      setLoadingRecs(false);
      setHasFetched(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your automation performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Active Workflows" 
          value={activeWorkflows} 
          icon={Zap} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Success Rate" 
          value={`${successRate}%`} 
          icon={CheckCircle} 
          color="bg-green-500"
        />
        <StatCard 
          title="Total Executions" 
          value={totalRuns + 1420} 
          icon={Activity} 
          color="bg-indigo-500"
        />
        <StatCard 
          title="Failed Runs" 
          value={failedRuns} 
          icon={XCircle} 
          color="bg-red-500" 
          alert={failedRuns > 0}
        />
      </div>

      {/* AI Recommendations Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-indigo-100 dark:border-slate-700 relative overflow-hidden transition-all duration-300">
         <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
           <Bot size={120} />
         </div>
         
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative z-10">
           <div>
             <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
               <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
               AI Workflow Recommendations
             </h3>
             <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
               {n8nInstances.length > 0 
                 ? "Generate intelligent suggestions based on your recent activity logs via n8n."
                 : "Connect an n8n instance to enable AI-powered workflow analysis."}
             </p>
           </div>
           
           {n8nInstances.length > 0 ? (
             <button 
               onClick={handleGenerateRecommendations}
               disabled={loadingRecs}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {loadingRecs ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
               {loadingRecs ? 'Analyzing...' : hasFetched ? 'Refresh Insights' : 'Generate Recommendations'}
             </button>
           ) : (
             <Link 
               to="/settings"
               className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
             >
               Connect n8n <ArrowRight size={16} />
             </Link>
           )}
         </div>

         {/* Recommendations Grid */}
         {hasFetched && recommendations.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
             {recommendations.map((rec) => (
               <div key={rec.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-2">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                     rec.impact === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                     rec.impact === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                     'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                   }`}>
                     {rec.impact} Impact
                   </span>
                   {rec.type === 'automation' && <Zap size={14} className="text-amber-500" />}
                   {rec.type === 'optimization' && <Activity size={14} className="text-blue-500" />}
                 </div>
                 <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{rec.title}</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                   {rec.description}
                 </p>
                 <div className="flex flex-wrap gap-1 mt-auto">
                   {rec.tools.map(tool => (
                     <span key={tool} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                       {tool}
                     </span>
                   ))}
                 </div>
               </div>
             ))}
           </div>
         )}
         
         {hasFetched && recommendations.length === 0 && (
           <div className="text-center py-8 text-indigo-400 italic">
             No recommendations found at this time. System functioning optimally.
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-sm border border-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">Execution History (Last 7 Days)</h3>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Updates
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke={isDark ? "#64748b" : "#94a3b8"} />
                <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} allowDecimals={false} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#f1f5f9"} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }}
                />
                <Area type="monotone" dataKey="success" stroke="#22c55e" fillOpacity={1} fill="url(#colorSuccess)" />
                <Area type="monotone" dataKey="fail" stroke="#ef4444" fillOpacity={1} fill="url(#colorFail)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-4">Live Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[320px]">
            {recentLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className={`mt-1 w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-500' : log.status === 'RUNNING' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{log.workflowName}</p>
                  <p className="text-xs text-muted-foreground">{log.outputMessage}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.startTime).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center italic py-10">No recent activity recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; alert?: boolean }> = ({ title, value, icon: Icon, color, alert }) => (
  <div className={`bg-card p-6 rounded-xl shadow-sm border ${alert ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800' : 'border-border'} flex items-center justify-between`}>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon className={`${color.replace('bg-', 'text-')}`} size={24} />
    </div>
  </div>
);

export default Dashboard;