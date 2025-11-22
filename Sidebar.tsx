import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Workflow, 
  Blocks, 
  ScrollText, 
  Settings, 
  LogOut,
  Zap,
  PieChart,
  Bot,
  BrainCircuit,
  Bell
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { unreadCount, togglePanel } = useNotification();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/workflows', label: 'Workflows', icon: Workflow },
    { path: '/integrations', label: 'Integrations', icon: Blocks },
    { path: '/logs', label: 'Execution Logs', icon: ScrollText },
    { path: '/insights', label: 'Predictive Insights', icon: BrainCircuit },
    { path: '/usage', label: 'Usage & Billing', icon: PieChart },
    { path: '/assistant', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-xl transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Zap size={20} className="text-white" fill="white" />
        </div>
        <span className="text-xl font-bold tracking-tight">AutoFlow</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                active 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button 
          onClick={togglePanel}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors relative"
        >
          <div className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
            )}
          </div>
          Notifications
          {unreadCount > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        
        <Link 
          to="/settings" 
          className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium transition-colors ${
            isActive('/settings')
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings size={18} />
          Settings
        </Link>
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
      
      <div className="p-6 text-xs text-slate-600">
        v1.0.3 &copy; 2025 AutoFlow Inc.
      </div>
    </aside>
  );
};

export default Sidebar;