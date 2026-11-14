import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ToastProps {
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2">
      <ShieldCheck size={16} className="text-teal-400" />
      <span>{message}</span>
    </div>
  );
};