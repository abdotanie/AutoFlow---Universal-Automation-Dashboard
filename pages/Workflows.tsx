import React, { useState, useMemo } from 'react';
import { Plus, Play, Pause, MoreHorizontal, Cpu, Loader2, Sparkles, Clock, Calendar, Save, X, Folder as FolderIcon, Hash, Settings2, Search, FolderOpen, Filter, Tag } from 'lucide-react';
import { Workflow, WorkflowStatus, Folder } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { generateWorkflowPlan } from '../services/geminiService';

interface Props {
  workflows: Workflow[];
  folders: Folder[];
  onToggleStatus: (id: string) => void;
  onRunWorkflow: (id: string) => void;
  onAddWorkflow: (workflow: Workflow) => void;
  onUpdateWorkflow: (workflow: Workflow) => void;
  onCreateFolder: (name: string) => void;
}

type FilterType = { type: 'all' | 'folder' | 'tag' | 'search'; value: string };

const Workflows: React.FC<Props> = ({ 
  workflows, 
  folders, 
  onToggleStatus, 
  onRunWorkflow, 
  onAddWorkflow, 
  onUpdateWorkflow,
  onCreateFolder 
}) => {
  // AI Builder State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Run State
  const [runningId, setRunningId] = useState<string | null>(null);

  // Management & Organization State
  const [activeFilter, setActiveFilter] = useState<FilterType>({ type: 'all', value: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Manage Workflow Modal (Schedule, Folder, Tags)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  // Form state for management
  const [editSchedule, setEditSchedule] = useState('');
  const [editFolderId, setEditFolderId] = useState('');
  const [editTags, setEditTags] = useState('');

  // --- Filtering Logic ---
  const filteredWorkflows = useMemo(() => {
    let filtered = workflows;

    // 1. Search Query
    if (searchQuery.trim()) {
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        w.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Sidebar Filters
    if (activeFilter.type === 'folder') {
      if (activeFilter.value === 'unfiled') {
        filtered = filtered.filter(w => !w.folderId);
      } else {
        filtered = filtered.filter(w => w.folderId === activeFilter.value);
      }
    } else if (activeFilter.type === 'tag') {
      filtered = filtered.filter(w => w.tags.includes(activeFilter.value));
    }

    return filtered;
  }, [workflows, activeFilter, searchQuery]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    workflows.forEach(w => w.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [workflows]);

  // --- Handlers ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    // Use Gemini to generate the workflow plan
    const plan = await generateWorkflowPlan(prompt);

    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      name: plan.title,
      description: plan.description,
      status: WorkflowStatus.ACTIVE,
      nodes: plan.nodes,
      lastRun: null,
      successRate: 100,
      schedule: plan.cronSchedule || undefined,
      tags: plan.tags || [],
      folderId: activeFilter.type === 'folder' && activeFilter.value !== 'unfiled' ? activeFilter.value : undefined
    };

    onAddWorkflow(newWorkflow);
    setIsGenerating(false);
    setIsModalOpen(false);
    setPrompt('');
  };

  const handleRun = (id: string) => {
    setRunningId(id);
    onRunWorkflow(id);
    setTimeout(() => setRunningId(null), 2000);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreateFolderOpen(false);
    }
  };

  const openManageModal = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setEditSchedule(workflow.schedule || '');
    setEditFolderId(workflow.folderId || '');
    setEditTags(workflow.tags.join(', '));
    setIsManageModalOpen(true);
  };

  const saveWorkflowSettings = () => {
    if (editingWorkflow) {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t !== '');
      
      onUpdateWorkflow({
        ...editingWorkflow,
        schedule: editSchedule.trim() || undefined,
        folderId: editFolderId || undefined,
        tags: tagsArray
      });
      setIsManageModalOpen(false);
      setEditingWorkflow(null);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-2">Manage and organize your automation pipelines.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative hidden md:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search..."
               className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
             />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
           >
             <Plus size={18} />
             New Workflow
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
        {/* Left Sidebar - Organization */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden md:h-[calc(100vh-12rem)]">
           <div className="p-4 border-b border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-6">
             {/* Folder Navigation */}
             <div className="space-y-1">
                <button
                  onClick={() => setActiveFilter({ type: 'all', value: '' })}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter.type === 'all' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Cpu size={16} />
                  All Workflows
                </button>
                
                <div className="pt-2 pb-1 px-3 flex items-center justify-between group">
                  <span className="text-xs font-semibold text-slate-500">Folders</span>
                  <button 
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {isCreateFolderOpen && (
                  <form onSubmit={handleCreateFolderSubmit} className="px-2 mb-2">
                    <input 
                      autoFocus
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={() => { if(!newFolderName) setIsCreateFolderOpen(false); }}
                      placeholder="Folder Name..."
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </form>
                )}

                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFilter({ type: 'folder', value: folder.id })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter.type === 'folder' && activeFilter.value === folder.id
                        ? 'bg-amber-50 text-amber-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <FolderIcon size={16} className={activeFilter.value === folder.id ? 'fill-amber-200 text-amber-500' : 'text-slate-400'} />
                       {folder.name}
                    </div>
                    <span className="text-xs text-slate-400 font-normal bg-slate-100 px-1.5 rounded-full">
                      {workflows.filter(w => w.folderId === folder.id).length}
                    </span>
                  </button>
                ))}
                
                <button
                  onClick={() => setActiveFilter({ type: 'folder', value: 'unfiled' })}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter.type === 'folder' && activeFilter.value === 'unfiled'
                      ? 'bg-slate-100 text-slate-800' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen size={16} />
                    Unfiled
                  </div>
                  <span className="text-xs text-slate-400 font-normal bg-slate-100 px-1.5 rounded-full ml-auto">
                    {workflows.filter(w => !w.folderId).length}
                  </span>
                </button>
             </div>

             {/* Tag Cloud */}
             <div className="pt-2 border-t border-slate-100">
               <div className="px-3 pb-2">
                  <span className="text-xs font-semibold text-slate-500">Tags</span>
               </div>
               <div className="px-3 flex flex-wrap gap-1.5">
                  {allTags.length === 0 && <span className="text-xs text-slate-400 italic">No tags used yet</span>}
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(activeFilter.type === 'tag' && activeFilter.value === tag ? { type: 'all', value: '' } : { type: 'tag', value: tag })}
                      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                         activeFilter.type === 'tag' && activeFilter.value === tag
                           ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                           : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      # {tag}
                    </button>
                  ))}
               </div>
             </div>
           </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group relative">
                {/* Folder Label - Absolute positioned */}
                {workflow.folderId && (
                   <div className="absolute -top-2.5 left-6 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                     <FolderIcon size={10} className="fill-amber-200" />
                     {folders.find(f => f.id === workflow.folderId)?.name}
                   </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${workflow.status === WorkflowStatus.ACTIVE ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Cpu size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        {workflow.name}
                        <StatusBadge status={workflow.status} />
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 max-w-2xl">{workflow.description}</p>
                      
                      <div className="flex items-center gap-3 mt-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          {workflow.nodes.map((node, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-mono">
                              {node}
                            </span>
                          ))}
                        </div>
                        
                        {workflow.schedule && (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200" title="Cron Schedule">
                            <Clock size={12} />
                            <span>{workflow.schedule}</span>
                          </div>
                        )}

                        {workflow.tags.length > 0 && (
                          <div className="flex items-center gap-1.5">
                             <div className="h-4 w-px bg-slate-200 mx-1"></div>
                             {workflow.tags.map(tag => (
                               <span key={tag} className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                 #{tag}
                               </span>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openManageModal(workflow)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Manage Settings (Tags, Folder, Schedule)"
                    >
                      <Settings2 size={18} />
                    </button>
                    
                    <button 
                      onClick={() => handleRun(workflow.id)}
                      disabled={runningId === workflow.id || workflow.status === WorkflowStatus.INACTIVE}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {runningId === workflow.id ? <Loader2 className="animate-spin" size={16}/> : <Play size={16} />}
                      Run
                    </button>
                    <button 
                      onClick={() => onToggleStatus(workflow.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        workflow.status === WorkflowStatus.ACTIVE 
                          ? 'text-amber-600 border-amber-200 hover:bg-amber-50' 
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                      title={workflow.status === WorkflowStatus.ACTIVE ? "Deactivate" : "Activate"}
                    >
                      {workflow.status === WorkflowStatus.ACTIVE ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>ID: {workflow.id}</span>
                  <span>Last Run: {workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            ))}
            {filteredWorkflows.length === 0 && (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
                 <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Filter className="text-slate-400" size={24} />
                 </div>
                 <h3 className="text-slate-900 font-medium text-lg">No workflows found</h3>
                 <p className="text-slate-500 mt-1">
                   {activeFilter.type !== 'all' 
                     ? "Try changing your folder or tag filters." 
                     : "Create your first workflow to get started."}
                 </p>
                 {activeFilter.type !== 'all' && (
                   <button 
                     onClick={() => setActiveFilter({ type: 'all', value: '' })}
                     className="mt-4 text-blue-600 hover:underline text-sm"
                   >
                     Clear filters
                   </button>
                 )}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-yellow-300" />
                AI Workflow Builder
              </h2>
              <p className="text-blue-100 text-sm mt-1">Describe what you want to automate, and we'll build the pipeline.</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What should this automation do?</label>
                <textarea 
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Every Monday at 9am, check Google Sheets and email a report..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[120px] text-slate-700 resize-none"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Build Workflow
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Workflow Settings Modal (Organization & Schedule) */}
      {isManageModalOpen && editingWorkflow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Settings2 className="text-slate-500" size={20} />
                 Workflow Settings
               </h3>
               <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 space-y-5">
               <div>
                 <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Target Workflow</p>
                 <p className="font-medium text-slate-900">{editingWorkflow.name}</p>
               </div>
               
               {/* Folder Select */}
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <FolderIcon size={16} className="text-amber-500" /> Folder
                 </label>
                 <select
                    value={editFolderId}
                    onChange={(e) => setEditFolderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                 >
                    <option value="">Unfiled</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                 </select>
               </div>

               {/* Tags Input */}
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Tag size={16} className="text-indigo-500" /> Tags
                 </label>
                 <div className="relative">
                    <input 
                      type="text" 
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Sales, Report, Urgent"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Hash size={14} />
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 mt-1">Comma separated values</p>
               </div>

               {/* Schedule Input */}
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" /> Cron Schedule
                 </label>
                 <div className="relative">
                    <input 
                      type="text" 
                      value={editSchedule}
                      onChange={(e) => setEditSchedule(e.target.value)}
                      placeholder="* * * * *"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Calendar size={14} />
                    </div>
                 </div>
               </div>

               <div className="flex items-center gap-3 pt-2">
                 <button 
                   onClick={() => setIsManageModalOpen(false)}
                   className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={saveWorkflowSettings}
                   className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center justify-center gap-2"
                 >
                   <Save size={16} />
                   Save Changes
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflows;