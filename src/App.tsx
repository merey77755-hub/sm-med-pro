import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Folder, ChevronRight, ChevronDown, Search, 
  ShieldCheck, Cloud, LogOut, Sun, Moon,
  Menu, X, Tag, Trash2, Lock, Plus
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  content: string;
  tag?: 'Шұғыл' | 'Маңызды' | 'Ақпарат';
  disease_id: string;
}

interface Disease {
  id: string;
  title: string;
  category: string;
  created_at: string;
  sections: Section[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

export default function App() {
  const [notes, setNotes] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [session, setSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showNewDiseaseModal, setShowNewDiseaseModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Хирургия');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    fetchNotesFromCloud();
    return () => subscription.unsubscribe();
  }, []);

  const fetchNotesFromCloud = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('diseases').select(`*, sections (*)`).order('created_at', { ascending: false });
      if (error) throw error;
      setNotes(data || []);
      if (data?.length > 0 && !selectedDiseaseId) setSelectedDiseaseId(data[0].id);
    } catch (err) {
      showToast('❌ Деректерді жүктеу қатесі');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: string, p: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) setAuthError(error.message);
    else {
      setShowAuthModal(false);
      showToast('🔓 Жүйеге сәтті кірдіңіз');
    }
  };

  const saveContentToCloud = async (subId: string, newContent: string) => {
    setSaveStatus('saving');
    const { error } = await supabase.from('sections').update({ content: newContent }).eq('id', subId);
    if (error) {
      setSaveStatus('error');
      showToast('❌ Сақтау қатесі');
    } else {
      setSaveStatus('synced');
      setNotes(prev => prev.map(n => ({
        ...n,
        sections: n.sections.map(s => s.id === subId ? { ...s, content: newContent } : s)
      })));
    }
  };

  const handleCreateDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { data, error } = await supabase.from('diseases').insert([
      { title: newTitle, category: newCategory }
    ]).select().single();

    if (!error && data) {
      // Автоматты түрде бастапқы бөлім қосу
      await supabase.from('sections').insert([
        { disease_id: data.id, title: 'Жалпы сипаттама', content: 'Мұнда конспект жазылады...', tag: 'Ақпарат' }
      ]);
      setShowNewDiseaseModal(false);
      setNewTitle('');
      await fetchNotesFromCloud();
      setSelectedDiseaseId(data.id);
      showToast('✅ Жаңа ауру қосылды');
    }
  };

  const handleDeleteDisease = async (id: string) => {
    if (!session) return setShowAuthModal(true);
    if (window.confirm('Бұл ауруды жоюға сенімдісіз бе?')) {
      await supabase.from('diseases').delete().eq('id', id);
      await fetchNotesFromCloud();
      showToast('🗑️ Жойылды');
    }
  };

  const currentDisease = notes.find(n => n.id === selectedDiseaseId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans text-sm">
      
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2">
          <ShieldCheck size={16} className="text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Жүйеге кіру</span>
              <button onClick={() => setShowAuthModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const target = e.currentTarget as any;
              handleLogin(target.email.value, target.password.value);
            }} className="space-y-3">
              <input name="email" type="email" placeholder="Email" required className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs" />
              <input name="password" type="password" placeholder="Пароль" required className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs" />
              {authError && <div className="text-xs text-rose-500">{authError}</div>}
              <button type="submit" className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-xs font-medium">Кіру</button>
            </form>
          </div>
        </div>
      )}

      {/* New Disease Modal */}
      {showNewDiseaseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Жаңа ауру қосу</span>
              <button onClick={() => setShowNewDiseaseModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDisease} className="space-y-3">
              <input type="text" placeholder="Ауру атауы" value={newTitle} onChange={e => setNewTitle(e.target.value)} required className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs" />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs">
                <option value="Хирургия">Хирургия</option>
                <option value="Акушерлік">Акушерлік</option>
                <option value="Терапия">Терапия</option>
              </select>
              <button type="submit" className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-xs font-medium">Қосу</button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold flex items-center gap-2">
          <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center text-white text-xs">M</div>
          <span>MedStudy Pro</span>
        </div>
        
        <div className="p-3">
          {session && (
            <button onClick={() => setShowNewDiseaseModal(true)} className="w-full py-2 bg-teal-600 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
              <Plus size={14} /> Жаңа ауру қосу
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Аурулар тізімі</div>
          {loading ? <div className="text-xs text-slate-400">Жүктелуде...</div> : notes.map(d => (
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
            <button onClick={() => supabase.auth.signOut()} className="text-rose-500 flex items-center gap-1"><LogOut size={12} /> Шығу</button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-teal-500 flex items-center gap-1"><Lock size={12} /> Кіру</button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-400">Медициналық конспектілер жүйесі</div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 border border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          {currentDisease ? (
            <>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-medium">{currentDisease.category}</span>
                <h1 className="text-2xl font-bold mt-2">{currentDisease.title}</h1>
              </div>

              <div className="space-y-4">
                {currentDisease.sections && currentDisease.sections.length > 0 ? (
                  currentDisease.sections.map(section => (
                    <div key={section.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                      <div className="font-semibold mb-2 text-xs text-teal-600 dark:text-teal-400">{section.title}</div>
                      <textarea
                        rows={4}
                        defaultValue={section.content}
                        onBlur={(e) => saveContentToCloud(section.id, e.target.value)}
                        readOnly={!session}
                        placeholder={session ? "Мәтінді жазыңыз..." : "Өзгерту үшін жүйеге кіріңіз"}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-y"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">Бұл ауруға әлі бөлімдер қосылмаған.</div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">Сол жақтан ауруды таңдаңыз</div>
          )}
        </div>
      </main>
    </div>
  );
}