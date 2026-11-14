import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewDiseaseModalProps {
  onClose: () => void;
  onCreate: (title: string, category: string) => Promise<void>;
}

export const NewDiseaseModal: React.FC<NewDiseaseModalProps> = ({ onClose, onCreate }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCategory.trim()) return;
    onCreate(newTitle, newCategory);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Жаңа ауру қосу</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Ауру атауы</label>
            <input 
              type="text" 
              placeholder="Мысалы: Холецистит" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              required 
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100" 
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Категория (қалағаныңызды еркін жазыңыз)</label>
            <input 
              type="text" 
              placeholder="Мысалы: Хирургия, Терапия..." 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
              required 
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100" 
            />
          </div>
          <div className="pt-2 flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-1/2 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Болдырмау
            </button>
            <button 
              type="submit" 
              className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium"
            >
              Қосу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};