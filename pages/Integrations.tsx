import React, { useState } from 'react';
import { 
  Mail, 
  Sheet, 
  Database, 
  Slack, 
  Github, 
  Globe,
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  RefreshCw,
  Server,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertOctagon,
  Loader2
} from 'lucide-react';
import { Integration, IntegrationStatus } from '../types';

interface Props {
  integrations: Integration[];
  onUpdateIntegration: (integration: Integration) => void;
}

const Integrations: React.FC<Props> = ({ integrations, onUpdateIntegration }) => {
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const getIcon = (name: string) => {
    switch(name) {
      case 'Gmail': return <Mail className="text-red-500" size={24} />;
      case 'Slack': return <Slack className="text-purple-500" size={24} />;
      case 'Google Sheets': return <Sheet className="text-green-600" size={24} />;
      case 'Notion': return <Database className="text-slate-800" size={24} />;
      case 'PostgreSQL': return <Database className="text-blue-700" size={24} />;
      case 'GitHub': return <Github className="text-slate-900" size={24} />;
      case 'Webhook': return <Globe className="text-orange-500" size={24} />;
      default: return <Globe className="text-slate-500" size={24} />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case IntegrationStatus.HEALTHY:
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: <Wifi size={12} />, label: 'Healthy' };
      case IntegrationStatus.DEGRADED:
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Activity size={12} />, label: 'Degraded' };
      case IntegrationStatus.ERROR:
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertTriangle size={12} />, label: 'Error' };
      case IntegrationStatus.EXPIRED:
        return { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <AlertOctagon size={12} />, label: 'Token Expired' };
      case IntegrationStatus.CHECKING:
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Loader2 size={12} className="animate-spin" />, label: 'Checking...' };
      case IntegrationStatus.DISCONNECTED:
      default:
        return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <WifiOff size={12} />, label: 'Disconnected' };
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    setRefreshingId(integration.id);
    
    // Update state to CHECKING
    onUpdateIntegration({ ...integration, status: IntegrationStatus.CHECKING });

    // Simulate Network Request
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success
      
      onUpdateIntegration({
        ...integration,
        status: success ? IntegrationStatus.HEALTHY : IntegrationStatus.ERROR,
        latencyMs: success ? Math.floor(Math.random() * 100) : 0,
        lastChecked: new Date().toISOString(),
        connected: success,
        errorMessage: success ? undefined : 'Connection timed out during health check.'
      });
      setRefreshingId(null);
    }, 1500);
  };

  const handleReconnect = (integration: Integration) => {
    setRefreshingId(integration.id);
    
    // Simulate Re-auth flow
    setTimeout(() => {
      onUpdateIntegration({
        ...integration,
        status: IntegrationStatus.HEALTHY,
        connected: true,
        latencyMs: 45,
        latencyTrend: 'stable',
        lastChecked: new Date().toISOString(),
        errorMessage: undefined
      });
      setRefreshingId(null);
    }, 2000);
  };

  const handleConnect = (integration: Integration) => {
     // New connection flow
     handleReconnect(integration);
  };

  const healthyCount = integrations.filter(i => i.status === IntegrationStatus.HEALTHY).length;
  const issueCount = integrations.filter(i => [IntegrationStatus.ERROR, IntegrationStatus.EXPIRED, IntegrationStatus.DEGRADED].includes(i.status)).length;
  const avgLatency = Math.round(integrations.reduce((acc, curr) => acc + curr.latencyMs, 0) / (integrations.filter(i => i.connected).length || 1));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="text-blue-600" />
          Integration Health
        </h1>
        <p className="text-slate-500 mt-2">Real-time status monitoring and connection management.</p>
      </div>

      {/* Health Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">System Status</p>
            <p className={`text-xl font-bold mt-1 ${issueCount === 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {issueCount === 0 ? 'All Systems Operational' : `${issueCount} Issues Detected`}
            </p>
          </div>
          <div className={`p-3 rounded-full ${issueCount === 0 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {issueCount === 0 ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Connections</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{healthyCount} <span className="text-slate-400 text-sm font-normal">/ {integrations.length}</span></p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Server size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Avg Latency</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{avgLatency}ms</p>
          </div>
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
            <Activity size={24} />
          </div>
        </div>

         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Uptime (30d)</p>
            <p className="text-2xl font-bold mt-1 text-green-600">99.92%</p>
          </div>
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {issueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-amber-800">Attention Needed</h4>
            <p className="text-sm text-amber-700 mt-1">
              Some integrations are experiencing issues. Please review the connections marked below to ensure workflows continue to run smoothly.
            </p>
          </div>
        </div>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const isChecking = integration.status === IntegrationStatus.CHECKING || refreshingId === integration.id;
          const isDisconnected = integration.status === IntegrationStatus.DISCONNECTED;
          const isError = integration.status === IntegrationStatus.ERROR || integration.status === IntegrationStatus.EXPIRED;
          const isDegraded = integration.status === IntegrationStatus.DEGRADED;
          const isHealthy = integration.status === IntegrationStatus.HEALTHY;

          const badge = getStatusBadge(isChecking ? IntegrationStatus.CHECKING : integration.status);

          return (
            <div 
              key={integration.id} 
              className={`bg-white rounded-xl border shadow-sm transition-all flex flex-col justify-between h-64 relative overflow-hidden ${
                isError 
                  ? 'border-red-200 shadow-red-100' 
                  : isDegraded 
                    ? 'border-amber-200 shadow-amber-100' 
                    : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Status Stripe */}
              <div className={`h-1.5 w-full ${
                isHealthy ? 'bg-green-500' : 
                isDegraded ? 'bg-amber-500' : 
                isError ? 'bg-red-500' : 
                isChecking ? 'bg-blue-500' : 'bg-slate-300'
              }`} />

              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    {getIcon(integration.name)}
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${badge.color}`}>
                    {badge.icon}
                    {badge.label}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-900">{integration.name}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{integration.category}</p>
                </div>

                {/* Metrics / Error Message */}
                <div className="mt-6">
                   {isDisconnected ? (
                      <p className="text-sm text-slate-400 italic flex items-center gap-2">
                        <WifiOff size={14} /> Not connected
                      </p>
                   ) : isError ? (
                      <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                         <p className="text-xs font-bold text-red-700 flex items-center gap-1 mb-1">
                           <AlertTriangle size={12} /> Connection Error
                         </p>
                         <p className="text-xs text-red-600 leading-tight">
                           {integration.errorMessage || "Unknown connection error."}
                         </p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Latency</p>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-lg font-mono font-semibold ${integration.latencyMs > 300 ? 'text-amber-600' : 'text-slate-700'}`}>
                               {isChecking ? '...' : `${integration.latencyMs}ms`}
                            </p>
                            {!isChecking && (
                              <div title={`Trend: ${integration.latencyTrend}`}>
                                {integration.latencyTrend === 'degrading' && <ArrowUpRight size={14} className="text-red-500" />}
                                {integration.latencyTrend === 'improving' && <ArrowDownRight size={14} className="text-green-500" />}
                                {integration.latencyTrend === 'stable' && <Minus size={14} className="text-slate-300" />}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Uptime</p>
                          <p className="text-lg font-mono font-semibold text-slate-700">{integration.uptime}%</p>
                        </div>
                      </div>
                   )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                {isDisconnected ? (
                   <button 
                     onClick={() => handleConnect(integration)}
                     className="w-full py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium text-sm transition-colors"
                   >
                     Connect
                   </button>
                ) : isError ? (
                   <div className="flex gap-2 w-full">
                     <button 
                       onClick={() => handleReconnect(integration)}
                       className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                       disabled={isChecking}
                     >
                       {isChecking ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                       Auto-Fix
                     </button>
                     <button className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-medium text-sm">
                       Log
                     </button>
                   </div>
                ) : (
                   <div className="flex gap-2 w-full">
                     <button 
                       onClick={() => handleTestConnection(integration)}
                       className="flex-1 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                       disabled={isChecking}
                     >
                       {isChecking ? <RefreshCw size={14} className="animate-spin" /> : 'Test Health'}
                     </button>
                     <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                       <ShieldCheck size={16} />
                     </button>
                   </div>
                )}
              </div>
              
              {/* Timestamp Overlay for Last Check */}
              {!isDisconnected && (
                 <div className="absolute top-3 right-4 text-[10px] text-slate-400 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                   Checked: {new Date(integration.lastChecked).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Integrations;