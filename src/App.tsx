import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Folder, ChevronRight, ChevronDown, Search, 
  ShieldCheck, Cloud, LogOut, Sun, Moon,
  Menu, X, Tag, Trash2, Lock
} from 'lucide-react';

// ==========================================
// 1. TYPESCRIPT ИНТЕРФЕЙСТЕРІ (Қатаң түрде тексеру үшін)
// ==========================================
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

// ==========================================
// 2. ҚАУІПСІЗ SUPABASE БАПТАУЛАРЫ (.env арқылы)
// ==========================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

// ==========================================
// 3. БӨЛІНГЕН КОМПОНЕНТТЕР
// ==========================================
const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogin: (e: string, p: string) => void;
  authError: string | null;
}> = ({ isOpen, onClose, onLogin, authError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold">
            <Lock size={18} className="text-teal-500" />
            <span>Жүйеге кіру</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} className="space-y-3">
          <input
            type="email" placeholder="Email" required autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <input
            type="password" placeholder="Пароль" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          {authError && <div className="text-xs text-rose-500 font-medium">{authError}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Болдырмау</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-medium hover:bg-teal-500">Кіру</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SectionItemProps {
  section: Section;
  session: any;
  isOpen: boolean;
  toggleSection: (id: string) => void;
  handleDelete: (id: string) => void;
  saveContentToCloud: (id: string, content: string) => Promise<void>;
}

const SectionItem: React.FC<SectionItemProps> = ({ 
  section, session, isOpen, toggleSection, handleDelete, saveContentToCloud 
}) => {
  const [localContent, setLocalContent] = useState(section.content);

  useEffect(() => {
    if (localContent === section.content) return;
    const handler = setTimeout(async () => {
      try { await saveContentToCloud(section.id, localContent); } 
      catch { setLocalContent(section.content); } 
    }, 1500);
    return () => clearTimeout(handler);
  }, [localContent, section.content, section.id, saveContentToCloud]);

  const handleBlur = () => {
    if (localContent !== section.content) {
      saveContentToCloud(section.id, localContent);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-2xl overflow-hidden shadow-sm transition-colors">
      <div className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2 text-left flex-1 font-medium hover:opacity-80">
          {isOpen ? <ChevronDown size={16} className="text-teal-500" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span>{section.title}</span>
        </button>
        <div className="flex items-center gap-3">
          {section.tag && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              section.tag === 'Шұғыл' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600' :
              section.tag === 'Маңызды' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' : 
              'bg-blue-100 dark:bg-blue-500/10 text-blue-600'
            }`}>
              {section.tag}
            </span>
          )}
          {session && (
            <button onClick={() => handleDelete(section.id)} className="text-slate-400 hover:text-rose-500 p-1 print:hidden">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="p-4">
          <textarea
            rows={4}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            readOnly={!session}
            placeholder={session ? "Мәтінді осы жерде өңдеңіз..." : "Оқу үшін ғана (өңдеу үшін жүйеге кіріңіз)"}
            className={`w-full p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50 leading-relaxed resize-y ${
              !session ? 'bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed opacity-80' : 'bg-white dark:bg-slate-950'
            } border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200`}
          />
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. НЕГІЗГІ APP КОМПОНЕНТІ
// ==========================================
export default function App() {
  const [notes, setNotes] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [session, setSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      showToast('❌ Деректерді жүктеу сәтсіз аяқталды');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else {
      setShowAuthModal(false);
      showToast('🔓 Жүйеге сәтті кірдіңіз');
    }
  };

  const saveContentToCloud = useCallback(async (subId: string, newContent: string) => {
    setSaveStatus('saving');
    const { error } = await supabase.from('sections').update({ content: newContent }).eq('id', subId);
    
    if (error) {
      setSaveStatus('error');
      showToast('❌ Сақтау мүмкін болмады. Интернетті тексеріңіз.');
      throw error;
    }
    
    setSaveStatus('synced');
    setNotes(prev => prev.map(n => ({
      ...n,
      sections: n.sections.map(s => s.id === subId ? { ...s, content: newContent } : s)
    })));
  }, [showToast]);

  const handleDeleteDisease = async (id: string) => {
    if (!session) return setShowAuthModal(true);
    if (window.confirm('Бұл конспектіні жоюға сенімдісіз бе?')) {
      const { error } = await supabase.from('diseases').delete().eq('id', id);
      if (!error) { await fetchNotesFromCloud(); showToast('🗑️ Ауру жойылды'); }
    }
  };

  const handleDeleteSubSection = async (subId: string) => {
    if (!session) return setShowAuthModal(true);
    if (window.confirm('Бөлімді жоюға сенімдісіз бе?')) {
      const { error } = await supabase.from('sections').delete().eq('id', subId);
      if (!error) { await fetchNotesFromCloud(); showToast('🗑️ Бөлім жойылды'); }
    }
  };

  const categories = useMemo(() => Array.from(new Set(notes.map(n => n.category))), [notes]);
  const filteredDiseases = useMemo(() => {
    return notes.filter(note => {
      const matchesCategory = !selectedCategory || note.category === selectedCategory;
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.sections.some(s => s.content.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const currentDisease = notes.find(n => n.id === selectedDiseaseId);

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans text-sm overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 print:hidden bg-slate-100 dark:bg-slate-900 border border-teal-500/50 text-teal-700 dark:text-teal-300">
          <ShieldCheck size={16} className="text-teal-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} authError={authError} />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-64'} fixed md:static inset-y-0 left-0 transition-transform duration-300 flex flex-col z-30 overflow-hidden print:hidden border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-bold">M</div>
            <span>MedStudy Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-xs font-medium text-slate-400 px-2 py-1">Категориялар</div>
          <button onClick={() => { setSelectedCategory(null); setIsSidebarOpen(false); }} className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors ${!selectedCategory ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
            <Folder size={16} /> <span>Барлық категориялар</span>
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => { setSelectedCategory(cat); setIsSidebarOpen(false); }} className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors ${selectedCategory === cat ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
              <Folder size={16} className={selectedCategory === cat ? 'text-teal-500' : 'text-slate-400'} />
              <span>{cat}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1.5">
              <Cloud size={14} className={saveStatus === 'synced' ? 'text-teal-500' : saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-rose-500'} />
              {saveStatus === 'synced' ? 'Сақталды' : saveStatus === 'saving' ? 'Сақталуда...' : 'Қате кетті'}
            </span>
            <span>
              {session ? (
                <button onClick={() => supabase.auth.signOut()} className="text-rose-500 hover:underline flex items-center gap-1"><LogOut size={12} /> Шығу</button>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="text-teal-500 hover:underline flex items-center gap-1"><Lock size={12} /> Кіру</button>
              )}
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 z-10 bg-white dark:bg-slate-950">
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between px-4 gap-2 print:hidden">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><Menu size={20} /></button>
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Іздеу..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/50" />
            </div>
          </div>
          <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="p-2 border border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-600" />}
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className={`${selectedDiseaseId && window.innerWidth < 768 ? 'hidden' : 'flex'} w-full md:w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex-col print:hidden`}>
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-medium text-xs text-slate-500 uppercase tracking-wider">Аурулар ({filteredDiseases.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? <div className="text-center py-6 text-xs text-slate-500">Жүктелуде...</div> : 
                filteredDiseases.map(disease => (
                  <div key={disease.id} onClick={() => setSelectedDiseaseId(disease.id)} className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between group ${selectedDiseaseId === disease.id ? 'bg-white dark:bg-slate-800 border border-teal-200 dark:border-slate-700 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 border border-transparent'}`}>
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate ${selectedDiseaseId === disease.id ? 'text-teal-600 dark:text-teal-400' : ''}`}>{disease.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1"><Tag size={10} /> {disease.category}</div>
                    </div>
                    {session && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDisease(disease.id); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))
              }
            </div>
          </div>

          <div className={`${!selectedDiseaseId && window.innerWidth < 768 ? 'hidden' : 'flex'} flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full flex-col`}>
            <button className="md:hidden mb-4 text-teal-600 text-xs font-medium flex items-center gap-1 w-max" onClick={() => setSelectedDiseaseId(null)}>
               ← Тізімге қайту
            </button>

            {currentDisease ? (
              <div className="space-y-6 pb-20">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="inline-block px-2.5 py-0.5 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-medium mb-2">
                    {currentDisease.category}
                  </div>
                  <h1 className="text-2xl font-bold">{currentDisease.title}</h1>
                </div>

                <div className="space-y-3">
                  {currentDisease.sections.map((section) => (
                    <SectionItem
                      key={section.id} section={section} session={session}
                      isOpen={openSections[section.id] !== false}
                      toggleSection={(id) => setOpenSections(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }))}
                      handleDelete={handleDeleteSubSection}
                      saveContentToCloud={saveContentToCloud}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 p-6 text-center">
                Сол жақ тізімнен конспектіні таңдаңыз
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}