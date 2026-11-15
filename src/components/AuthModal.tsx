import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  authError: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, authError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Жүйеге кіру</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required 
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100" 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100" 
          />
          {authError && <div className="text-xs text-rose-500">{authError}</div>}
          <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium transition-colors">Кіру</button>
        </form>
      </div>
    </div>
  );
};