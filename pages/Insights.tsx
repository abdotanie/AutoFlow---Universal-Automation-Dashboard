import React, { useMemo, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  BrainCircuit, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Lightbulb,
  Activity,
  Cpu,
  Search,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Workflow, ExecutionLog, LogStatus, Integration, IntegrationStatus } from '../types';

// --- Tremor-like UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg ring-1 ring-slate-200 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-slate-900 font-medium text-lg ${className}`}>
    {children}
  </h3>
);

const Text: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-slate-500 text-sm ${className}`}>
    {children}
  </p>
);

const Metric: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-slate-900 text-3xl font-semibold ${className}`}>
    {children}
  </p>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'red' | 'amber' | 'purple'; icon?: any }> = ({ children, color = 'blue', icon: Icon }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-500/10',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-500/10',
    red: 'bg-red-50 text-red-700 ring-red-500/10',
    amber: 'bg-amber-50 text-amber-700 ring-amber-500/10',
    purple: 'bg-purple-50 text-purple-700 ring-purple-500/10',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${colors[color]}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string; className?: string }> = ({ value, color = 'bg-blue-500', className = '' }) => (
  <div className={`w-full bg-slate-100 rounded-full h-2 ${className}`}>
    <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }}></div>
  </div>
);

// --- Main Page Component ---

interface Props {
  workflows: Workflow[];
  logs: ExecutionLog[];
  integrations: Integration[];
}

interface AutomatedSuggestion {
  title: string;
  reasoning: string;
  suggestedTools: string[];
  efficiencyGain: string;
}

const Insights: React.FC<Props> = ({ workflows, logs, integrations }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7D');
  const [discoveryResults, setDiscoveryResults] = useState<AutomatedSuggestion[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);

  // 1. Forecasting Logic
  const forecastData = useMemo(() => {
    const data = [];
    const now = new Date();
    const days = 10; // 7 past + 3 future

    // Historical (Past 7 Days)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      
      // Mock logic: Count logs for this day + some baseline
      const count = logs.filter(l => new Date(l.startTime).getDate() === d.getDate()).length + 150 + (Math.random() * 50);
      
      data.push({
        date: dayStr,
        Actual: Math.round(count),
        Predicted: null,
      });
    }

    // Future (Next 3 Days)
    const lastActual = data[data.length - 1].Actual as number;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      
      // Linear projection + noise
      const predicted = Math.round(lastActual * (1 + (0.05 * i)) + (Math.random() * 20 - 10));
      
      data.push({
        date: dayStr,
        Actual: null,
        Predicted: predicted,
      });
    }
    // Bridge the gap visually by adding the last actual point as the first predicted point
    if (data.length > 3) {
       const bridgeIndex = data.length - 3;
       data[bridgeIndex].Predicted = data[bridgeIndex].Actual; 
    }

    return data;
  }, [logs]);

  // 2. Risk Analysis Engine
  const riskAnalysis = useMemo(() => {
    return workflows.map(wf => {
      const wfLogs = logs.filter(l => l.workflowId === wf.id);
      const failCount = wfLogs.filter(l => l.status === LogStatus.FAILED).length;
      const total = wfLogs.length || 1;
      const failureRate = (failCount / total) * 100;
      
      // Mock Latency Trend
      const isLatencyRising = Math.random() > 0.7; 
      
      // Integration Health
      const connectedIntegrations = integrations.filter(i => wf.nodes.some(n => n.includes(i.name)));
      const hasIntegrationIssues = connectedIntegrations.some(i => i.status !== IntegrationStatus.HEALTHY);

      let score = 10; // Base risk
      score += failureRate * 1.5;
      if (isLatencyRising) score += 20;
      if (hasIntegrationIssues) score += 30;

      return {
        ...wf,
        riskScore: Math.min(100, Math.round(score)),
        failureRate: Math.round(failureRate),
        trend: isLatencyRising ? 'Degrading' : 'Stable',
        issue: hasIntegrationIssues ? 'Integration Error' : failureRate > 10 ? 'High Failure Rate' : 'None'
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [workflows, logs, integrations]);

  // 3. AI Recommendations (Rule-Based)
  const recommendations = useMemo(() => {
    const recs = [];
    const highRisk = riskAnalysis.filter(r => r.riskScore > 50);
    
    if (highRisk.length > 0) {
      recs.push({
        title: 'Stabilize Critical Workflows',
        description: `${highRisk.length} workflows have a failure probability > 50%. Inspect integration credentials immediately.`,
        impact: 'High Impact',
        color: 'red' as const
      });
    }

    const degrading = riskAnalysis.filter(r => r.trend === 'Degrading');
    if (degrading.length > 0) {
      recs.push({
        title: 'Optimize Latency',
        description: `Detected increasing latency in "${degrading[0].name}". Consider increasing timeout thresholds or optimizing data payloads.`,
        impact: 'Performance',
        color: 'amber' as const
      });
    }

    // Forecast Insight
    const nextDay = forecastData.find(d => d.Predicted !== null);
    if (nextDay && (nextDay.Predicted || 0) > 200) {
      recs.push({
        title: 'Scale Resources',
        description: 'Traffic is forecasted to peak tomorrow. Ensure webhook rate limits are adjusted.',
        impact: 'Forecasting',
        color: 'blue' as const
      });
    }

    if (recs.length === 0) {
      recs.push({
        title: 'System Optimized',
        description: 'All predictive models indicate nominal performance. No immediate actions required.',
        impact: 'Info',
        color: 'green' as const
      });
    }

    return recs;
  }, [riskAnalysis, forecastData]);

  // 4. Generative AI Discovery Logic
  const handleDiscoverAutomations = async () => {
    setIsLoadingDiscovery(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Context prep
      const workflowContext = workflows.map(w => `${w.name}: ${w.description} (Nodes: ${w.nodes.join(', ')})`).join('\n');
      const logSummary = logs.slice(0, 50).map(l => `${l.workflowName} - ${l.status}: ${l.outputMessage}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the current automation ecosystem and user behavior logs to suggest 3 NEW, creative automation workflows that would add value. 
        
        Current Workflows:
        ${workflowContext}
        
        Recent Activity Logs:
        ${logSummary}
        
        Suggest workflows that fill gaps (e.g., error alerts, reporting, cross-platform sync).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                suggestedTools: { type: Type.ARRAY, items: { type: Type.STRING } },
                efficiencyGain: { type: Type.STRING }
              },
              required: ["title", "reasoning", "suggestedTools", "efficiencyGain"]
            }
          }
        }
      });
      
      if (response.text) {
        setDiscoveryResults(JSON.parse(response.text));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  const avgRiskScore = Math.round(riskAnalysis.reduce((a, b) => a + b.riskScore, 0) / (riskAnalysis.length || 1));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-slate-900 text-2xl font-bold flex items-center gap-3">
          <BrainCircuit className="text-indigo-600" size={28} />
          Predictive Insights
        </h1>
        <p className="text-slate-500 mt-1">AI-driven forecasts, risk scoring, and optimization suggestions.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-indigo-500">
          <div className="flex items-start justify-between">
            <div>
              <Text>Avg. Stability Score</Text>
              <Metric>{100 - avgRiskScore}/100</Metric>
            </div>
            <div className="bg-indigo-50 p-2 rounded-lg">
              <Activity className="text-indigo-600" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge color="green" icon={TrendingUp}>
              +2.4%
            </Badge>
            <Text>vs last week</Text>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between">
            <div>
              <Text>Predicted Failures (24h)</Text>
              <Metric>~{Math.round(forecastData[forecastData.length-1].Predicted! * 0.04)}</Metric>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="text-amber-600" size={20} />
            </div>
          </div>
           <div className="mt-4 flex items-center gap-2">
            <Badge color="amber" icon={TrendingUp}>
              High Risk
            </Badge>
            <Text>requires attention</Text>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div>
              <Text>Optimization Savings</Text>
              <Metric>14.2 hrs</Metric>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <Zap className="text-emerald-600" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge color="blue" icon={CheckCircle2}>
              AI Verified
            </Badge>
            <Text>potential runtime reduction</Text>
          </div>
        </Card>
      </div>

      {/* AI Automation Discovery Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="bg-indigo-100 p-1.5 rounded-md">
                    <Sparkles className="text-indigo-600" size={18} />
                 </div>
                 <Title className="text-indigo-900">AI Automation Discovery</Title>
              </div>
              <Text>
                Let Gemini AI analyze your traffic patterns and suggest new workflows to automate.
              </Text>
            </div>
            <button 
              onClick={handleDiscoverAutomations}
              disabled={isLoadingDiscovery}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoadingDiscovery ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isLoadingDiscovery ? 'Analyzing Patterns...' : 'Analyze Ecosystem'}
            </button>
          </div>

          {discoveryResults.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {discoveryResults.map((item, idx) => (
                 <div key={idx} className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                   <h4 className="font-bold text-slate-900 pr-6">{item.title}</h4>
                   <p className="text-xs text-slate-500 mt-2 mb-3 leading-relaxed h-16 overflow-hidden">
                     {item.reasoning}
                   </p>
                   
                   <div className="flex flex-wrap gap-1 mb-4">
                     {item.suggestedTools.map((t, i) => (
                       <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                         {t}
                       </span>
                     ))}
                   </div>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Zap size={12} /> {item.efficiencyGain}
                      </span>
                      <button className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Create this workflow">
                        <Plus size={16} />
                      </button>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-slate-300">
               <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Search className="text-slate-400" size={24} />
               </div>
               <p className="text-slate-600 font-medium">No suggestions generated yet</p>
               <p className="text-slate-400 text-sm mt-1">Click "Analyze Ecosystem" to run the AI discovery engine.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Chart & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title>Workflow Volume Forecast</Title>
              <Text>Historical execution volume vs AI predicted demand.</Text>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200">Executions</button>
               <button className="px-3 py-1 text-xs font-medium bg-white text-slate-400 rounded-md hover:bg-slate-50">Latency</button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Actual" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fill="url(#colorActual)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Predicted" 
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  fill="url(#colorPredicted)" 
                />
                {/* Dividing line between actual and predicted */}
                <ReferenceLine x={forecastData[forecastData.length - 4]?.date} stroke="#cbd5e1" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Actual Volume
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-purple-500/50 border border-purple-500 border-dashed"></span> AI Prediction
            </div>
          </div>
        </Card>

        {/* Insights Feed */}
        <Card className="flex flex-col">
          <div className="mb-4 flex items-center gap-2">
             <div className="bg-yellow-100 p-1.5 rounded-md">
                <Lightbulb className="text-yellow-600" size={18} />
             </div>
             <Title>Smart Suggestions</Title>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
             {recommendations.map((rec, idx) => (
               <div key={idx} className="group p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:ring-1 hover:ring-indigo-100 hover:shadow-sm transition-all">
                 <div className="flex justify-between items-start mb-1">
                   <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                     rec.color === 'red' ? 'bg-red-100 text-red-700' :
                     rec.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                     rec.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                     'bg-emerald-100 text-emerald-700'
                   }`}>
                     {rec.impact}
                   </span>
                   <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                 </div>
                 <h4 className="text-sm font-semibold text-slate-800 mt-2">{rec.title}</h4>
                 <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                   {rec.description}
                 </p>
               </div>
             ))}
          </div>
          <button className="mt-4 w-full py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Generate Report
          </button>
        </Card>
      </div>

      {/* Risk Analysis Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <Title>Workflow Risk Assessment</Title>
            <Text>Failure probability scoring based on 30-day history.</Text>
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search workflows..." 
               className="pl-9 pr-4 py-1.5 text-sm border-none ring-1 ring-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3 font-medium">Workflow Name</th>
                <th className="px-6 py-3 font-medium">Risk Score</th>
                <th className="px-6 py-3 font-medium">Failure Rate</th>
                <th className="px-6 py-3 font-medium">Trend</th>
                <th className="px-6 py-3 font-medium">Key Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskAnalysis.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {item.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-700 font-mono">{item.riskScore}</span>
                      <ProgressBar 
                        value={item.riskScore} 
                        color={item.riskScore > 60 ? 'bg-red-500' : item.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'} 
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {item.failureRate}%
                  </td>
                  <td className="px-6 py-4">
                    {item.trend === 'Degrading' ? (
                      <Badge color="amber" icon={TrendingUp}>Degrading</Badge>
                    ) : (
                      <Badge color="green" icon={CheckCircle2}>Stable</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className={`${item.issue !== 'None' ? 'text-red-600 font-medium' : ''}`}>
                      {item.issue}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Insights;