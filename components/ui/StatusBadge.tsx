import React from 'react';
import { Loader2 } from 'lucide-react';
import { WorkflowStatus, LogStatus } from '../../types';

interface Props {
  status: WorkflowStatus | LogStatus | string;
  type?: 'workflow' | 'log';
}

const StatusBadge: React.FC<Props> = ({ status, type = 'workflow' }) => {
  let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  const s = status.toUpperCase();

  if (s === 'ACTIVE' || s === 'SUCCESS') {
    colorClass = 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
  } else if (s === 'INACTIVE' || s === 'FAILED') {
    colorClass = 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
  } else if (s === 'RUNNING') {
    colorClass = 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
  } else if (s === 'DRAFT') {
    colorClass = 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${colorClass} inline-flex items-center gap-1`}>
      {s === 'RUNNING' && <Loader2 size={10} className="animate-spin" />}
      {status}
    </span>
  );
};

export default StatusBadge;