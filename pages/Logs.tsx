
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Calendar, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, PauseCircle, PlayCircle, Download, FileText, FileJson, Filter } from 'lucide-react';
import { ExecutionLog, LogStatus } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

interface Props {
  logs: ExecutionLog[];
}

const Logs: React.FC<Props> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Live Stream Control
  const [isPaused, setIsPaused] = useState(false);
  const [snapshotLogs, setSnapshotLogs] = useState<ExecutionLog[]>([]);
  const [isPulse, setIsPulse] = useState(false);

  // Export Menu State
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExecutionLog; direction: 'asc' | 'desc' }>({
    key: 'startTime',
    direction: 'desc'
  });

  // Trigger pulse animation on the Live badge when new logs arrive or update
  useEffect(() => {
    if (logs.length > 0 && !isPaused) {
      setIsPulse(true);
      const timer = setTimeout(() => setIsPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [logs, isPaused]);

  // Handle Pause/Resume Logic
  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      setSnapshotLogs([]);
    } else {
      // Pause
      setIsPaused(true);
      setSnapshotLogs(logs); // Freeze current view
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Helper to get local YYYY-MM-DD string
  const getDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-CA');
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDatePreset(val);

    if (val === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (val === 'TODAY') {
      const today = getDateStr(0);
      setStartDate(today);
      setEndDate(today);
    } else if (val === '7D') {
      setStartDate(getDateStr(7));
      setEndDate(getDateStr(0));
    } else if (val === '30D') {
      setStartDate(getDateStr(30));
      setEndDate(getDateStr(0));
    } else if (val === 'CUSTOM') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleSort = (key: keyof ExecutionLog) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'startTime' ? 'desc' : 'asc' };
    });
  };

  // Determine which dataset to render (Live or Frozen Snapshot)
  const effectiveLogs = isPaused ? snapshotLogs : logs;
  
  // Calculate new logs count since pause
  const newLogsCount = useMemo(() => {
    if (!isPaused || snapshotLogs.length === 0) return 0;
    // Find index of the newest snapshot log in the current logs
    const snapshotHeadId = snapshotLogs[0].id;
    const index = logs.findIndex(l => l.id === snapshotHeadId);
    
    // If not found, it implies all current logs are new or the snapshot log fell off the list
    return index === -1 ? logs.length : index;
  }, [logs, snapshotLogs, isPaused]);

  // Memoized filtered logs
  const filteredLogs = useMemo(() => {
    return effectiveLogs.filter(log => {
      // Search Filter
      const matchesSearch = log.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.outputMessage.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

      // Date Filter
      let matchesDate = true;
      const logDate = new Date(log.startTime);
      
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (logDate < start) matchesDate = false;
      }
      
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (logDate > end) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const { key, direction } = sortConfig;
      let comparison = 0;

      switch (key) {
        case 'startTime':
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'workflowName':
          comparison = a.workflowName.localeCompare(b.workflowName);
          break;
        default:
          comparison = 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }, [effectiveLogs, searchTerm, statusFilter, startDate, endDate, sortConfig]);

  const hasActiveFilters = !!(searchTerm || statusFilter !== 'ALL' || datePreset !== 'ALL' || startDate || endDate);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExport = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `execution-logs-${timestamp}.${format}`;

    if (format === 'json') {
      const jsonContent = JSON.stringify(filteredLogs, null, 2);
      downloadFile(jsonContent, filename, 'application/json');
    } else {
      const headers = ['ID', 'Workflow Name', 'Status', 'Output Message', 'Duration (ms)', 'Start Time'];
      const rows = filteredLogs.map(log => [
        log.id,
        `"${(log.workflowName || '').replace(/"/g, '""')}"`, // Escape quotes
        log.status,
        `"${(log.outputMessage || '').replace(/"/g, '""')}"`,
        log.durationMs,
        log.startTime
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      downloadFile(csvContent, filename, 'text/csv');
    }
    setIsExportOpen(false);
  };

  const renderSortIcon = (column: keyof ExecutionLog) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown size={14} className="ml-1 text-slate-300 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  const SortableHeader = ({ column, label }: { column: keyof ExecutionLog, label: string }) => (
    <th 
      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {label} {renderSortIcon(column)}
      </div>
    </th>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Execution Logs</h1>
              <span 
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 border ${
                  isPaused 
                    ? 'bg-amber-50 border-amber-100 text-amber-600' 
                    : `bg-emerald-50 border-emerald-100 text-emerald-600 ${isPulse ? 'shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-105 ring-1 ring-emerald-400' : ''}`
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {!isPaused && <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isPulse ? 'animate-ping' : ''}`}></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                {isPaused ? 'Stream Paused' : 'Live Updates'}
              </span>
            </div>
            <p className="text-slate-500 mt-2">Real-time history of your workflow runs.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={togglePause}
             className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium shadow-sm ${
               isPaused 
                 ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                 : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
             }`}
           >
             {isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
             {isPaused ? 'Resume Stream' : 'Pause Stream'}
           </button>
        </div>
      </div>

      {/* Notification for new logs while paused */}
      {isPaused && newLogsCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="font-medium">{newLogsCount} new {newLogsCount === 1 ? 'log' : 'logs'} arrived while paused.</span>
          </div>
          <button 
            onClick={togglePause}
            className="text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            Show Latest
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center gap-4 z-10 relative">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search logs by name or message..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* Status Select with visual indicator */}
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <div className={`w-2 h-2 rounded-full transition-colors ${
                 statusFilter === 'ALL' ? 'bg-slate-300' : 
                 statusFilter === LogStatus.SUCCESS ? 'bg-green-500' :
                 statusFilter === LogStatus.FAILED ? 'bg-red-500' : 'bg-blue-500'
               }`} />
             </div>
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-colors cursor-pointer min-w-[140px]"
             >
               <option value="ALL">All Status</option>
               <option value={LogStatus.SUCCESS}>Success</option>
               <option value={LogStatus.FAILED}>Failed</option>
               <option value={LogStatus.RUNNING}>Running</option>
             </select>
             <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Preset Select */}
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={datePreset}
              onChange={handlePresetChange}
              className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-colors cursor-pointer min-w-[160px]"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Custom Date Inputs */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-slate-600 focus:outline-none p-1.5 border-r border-slate-200 cursor-pointer"
                placeholder="Start"
              />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-slate-600 focus:outline-none p-1.5 cursor-pointer"
                placeholder="End"
              />
            </div>
          )}

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm transition-all duration-200 border border-red-200 hover:border-red-300 font-medium whitespace-nowrap shadow-sm animate-in fade-in zoom-in-95"
            >
              <X size={16} />
              Clear
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block"></div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 bg-white hover:bg-slate-50 rounded-lg text-sm transition-all duration-200 border border-slate-200 font-medium whitespace-nowrap shadow-sm active:scale-95"
            >
              <Download size={16} />
              Export
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                  >
                    <FileText size={14} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 border-t border-slate-50 transition-colors"
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

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <SortableHeader column="status" label="Status" />
                <SortableHeader column="workflowName" label="Workflow" />
                <th className="px-6 py-4">Output</th>
                <th className="px-6 py-4">Duration</th>
                <SortableHeader column="startTime" label="Timestamp" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors animate-in fade-in slide-in-from-top-1 duration-300">
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} type="log" />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {log.workflowName}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={log.outputMessage}>
                    {log.outputMessage}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {log.status === LogStatus.RUNNING ? '---' : `${log.durationMs}ms`}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(log.startTime).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    {statusFilter === LogStatus.RUNNING 
                      ? "No active workflows running at the moment."
                      : "No logs found matching your criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
