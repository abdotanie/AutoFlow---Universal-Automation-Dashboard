
import React, { useState } from 'react';
import { X, CheckCheck, Trash2, AlertCircle, CheckCircle, Info, AlertTriangle, Settings, Bell, Webhook, ArrowRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

// Simple time formatter fallback since date-fns might not be in import map
const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

const NotificationPanel: React.FC = () => {
  const { 
    isPanelOpen, 
    togglePanel, 
    notifications, 
    markAllAsRead, 
    clearAll, 
    markAsRead, 
    removeNotification,
    n8nInstances
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'list' | 'config'>('list');

  if (!isPanelOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" 
        onClick={togglePanel}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Bell className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Center</h2>
          </div>
          <button onClick={togglePanel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'config' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Settings size={14} />
            External Alerts
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'list' && (
            <div className="p-0">
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                  <button 
                    onClick={clearAll}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} /> Clear all
                  </button>
                </div>
              )}
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="text-slate-400" size={24} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                    <p className="text-xs text-slate-400 mt-1">We'll let you know when something important happens.</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {notification.type === 'success' && <CheckCircle className="text-green-500" size={18} />}
                          {notification.type === 'error' && <AlertCircle className="text-red-500" size={18} />}
                          {notification.type === 'warning' && <AlertTriangle className="text-amber-500" size={18} />}
                          {notification.type === 'info' && <Info className="text-blue-500" size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <p className={`text-sm font-semibold ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                               {notification.title}
                             </p>
                             <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                               {timeAgo(notification.timestamp)}
                             </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.source && (
                            <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider font-medium">
                              {notification.source}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                          className="opacity-0 group-hover:opacity-100 absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {!notification.read && (
                        <div className="absolute top-4 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
             <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                   <h3 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                     <Webhook size={16} />
                     n8n Integration
                   </h3>
                   <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                     Connect AutoFlow to multiple n8n instances to receive real-time alerts.
                   </p>
                </div>

                <div>
                   <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-3 flex items-center justify-between">
                     Connected Instances
                     <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                       {n8nInstances.length}
                     </span>
                   </h4>
                   
                   <div className="space-y-3">
                      {n8nInstances.length > 0 ? (
                        n8nInstances.map(instance => (
                           <div key={instance.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                              <div className={`w-2 h-2 rounded-full ${instance.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">{instance.name}</span>
                           </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No instances connected yet.</p>
                      )}
                   </div>
                </div>
                
                <Link 
                  to="/settings" 
                  onClick={togglePanel}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Manage Connections
                  <ArrowRight size={14} />
                </Link>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payload Info</h4>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[10px] overflow-x-auto font-mono">
{`{
  "id": "1234-5678",
  "type": "error",
  "title": "Alert Title",
  "message": "Error details...",
  "timestamp": "ISO_DATE"
}`}
                  </pre>
                </div>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
