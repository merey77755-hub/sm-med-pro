import React from 'react';
import { Plus, Cloud, LogOut, Lock, Trash2 } from 'lucide-react';

interface SidebarProps {
  session: any;
  categories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  filteredDiseases: any[];
  selectedDiseaseId: string | null;
  setSelectedDiseaseId: (id: string) => void;
  loading: boolean;
  setShowNewDiseaseModal: (show: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  handleDeleteDisease: (id: string) => void;
  signOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session, categories, selectedCategory, setSelectedCategory,
  filteredDiseases, selectedDiseaseId, setSelectedDiseaseId,
  loading, setShowNewDiseaseModal, setShowAuthModal, handleDeleteDisease, signOut
}) => {
  return (
    <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold flex items-center gap-2">
        <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center text-white text-xs">M</div>
        <span>MedStudy Pro</span>
      </div>
      
      <div className="p-3">
        {session && (
          <button onClick={() => setShowNewDiseaseModal(true)} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors">
            <Plus size={14} /> Жаңа ауру қосу
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Категориялар ({categories.length})</div>
        <button onClick={() => setSelectedCategory(null)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${!selectedCategory ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50'}`}>
          Барлық категориялар
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${selectedCategory === cat ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50'}`}>
            📁 {cat}
          </button>
        ))}

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">Аурулар тізімі</div>
        {loading ? <div className="text-xs text-slate-400 px-3">Жүктелуде...</div> : filteredDiseases.map(d => (
          <div key={d.id} onClick={() => setSelectedDiseaseId(d.id)} className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedDiseaseId === d.id ? 'bg-white dark:bg-slate-800 border border-teal-500/30 shadow-sm text-teal-600 dark:text-teal-400 font-medium' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}>
            <div className="truncate">{d.title}</div>
            {session && (
              <button onClick={(e) => { e.stopPropagation(); handleDeleteDisease(d.id); }} className="text-slate-400 hover:text-rose-500 p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
        <span className="text-slate-500 flex items-center gap-1"><Cloud size={14} className="text-teal-500" /> Сақталды</span>
        {session ? (
          <button onClick={signOut} className="text-rose-500 flex items-center gap-1 hover:underline"><LogOut size={12} /> Шығу</button>
        ) : (
          <button onClick={() => setShowAuthModal(true)} className="text-teal-500 flex items-center gap-1 hover:underline"><Lock size={12} /> Кіру</button>
        )}
      </div>
    </aside>
  );
};