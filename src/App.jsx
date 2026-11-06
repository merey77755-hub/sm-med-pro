import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Folder, ChevronRight, ChevronDown, Plus, Search, 
  Save, CheckCircle, Menu, X, Tag, Trash2, Lock, Unlock, ShieldCheck, Cloud, RefreshCw, Printer, LogOut, Sun, Moon, Image as ImageIcon
} from 'lucide-react';

// --- SUPABASE БАПТАУЛАРЫ ---
const SUPABASE_URL = 'https://pvneicwdqskvqakpuddn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2SFWi_uduEGiFTKEEHiPiA_oIDFbJEd';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Телефонда автоматты жабық тұру үшін false
  const [saveStatus, setSaveStatus] = useState('synced');
  const [openSections, setOpenSections] = useState({});

  // --- ТЕМА (DARK / LIGHT REJIM) ---
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Supabase Auth күйі (Қауіпсіздік үшін)
  const [session, setSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Модальді терезелер
  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [newDiseaseTitle, setNewDiseaseTitle] = useState('');
  const [newDiseaseCategory, setNewDiseaseCategory] = useState('Хирургия');
  const [newDiseaseImage, setNewDiseaseImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showAddSubSectionModal, setShowAddSubSectionModal] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubContent, setNewSubContent] = useState('');
  const [newSubTag, setNewSubTag] = useState('Ақпарат');

  // Тоаст хабарлама
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchNotesFromCloud();

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotesFromCloud = async () => {
    setLoading(true);
    try {
      const { data: diseasesData, error: diseaseError } = await supabase
        .from('diseases')
        .select(`*, sections (*)`);

      if (diseaseError) throw diseaseError;

      if (diseasesData && diseasesData.length > 0) {
        setNotes(diseasesData);
        if (!selectedDiseaseId) {
          setSelectedDiseaseId(diseasesData[0].id);
          setSelectedCategory(diseasesData[0].category);
        }
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('Деректерді жүктеу қатесі:', err.message);
      showToast('❌ Деректерді жүктеу сәтсіз аяқталды');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setNewDiseaseImage(data.publicUrl);
      showToast('🖼️ Сурет сәтті жүктелді');
    } catch (err) {
      showToast('❌ Сурет жүктеу қатесі: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    } else {
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      showToast('🔓 Жүйеге сәтті кірдіңіз');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('🔒 Жүйеден шықтыңыз');
  };

  const requireAuth = (action) => {
    if (session) {
      action();
    } else {
      setPendingAction(() => action);
      setShowAuthModal(true);
    }
  };

  const handleAddDisease = async (e) => {
    e.preventDefault();
    if (!newDiseaseTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('diseases')
        .insert([{ 
          title: newDiseaseTitle.trim(), 
          category: newDiseaseCategory.trim() || 'Жалпы',
          image_url: newDiseaseImage || null
        }])
        .select()
        .single();

      if (error) throw error;

      const { error: secError } = await supabase
        .from('sections')
        .insert([{ disease_id: data.id, title: 'Анықтамасы', tag: 'Ақпарат', content: 'Мұнда аурудың анықтамасын жазыңыз...' }]);

      if (secError) throw secError;

      await fetchNotesFromCloud();
      setShowAddDiseaseModal(false);
      setNewDiseaseTitle('');
      setNewDiseaseImage('');
      showToast('✨ Жаңа ауру сәтті қосылды');
    } catch (err) {
      showToast('❌ Қате кетті: ' + err.message);
    }
  };

  const handleDeleteDisease = async (id) => {
    requireAuth(async () => {
      if (window.confirm('Бұл конспектіні жоюға сенімдісіз бе?')) {
        try {
          const { error } = await supabase.from('diseases').delete().eq('id', id);
          if (error) throw error;
          
          await fetchNotesFromCloud();
          showToast('🗑️ Ауру жойылды');
        } catch (err) {
          showToast('❌ Жою кезінде қате шықты');
        }
      }
    });
  };

  const handleAddSubSection = async (e) => {
    e.preventDefault();
    if (!currentDisease || !newSubTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('sections')
        .insert([{ disease_id: currentDisease.id, title: newSubTitle.trim(), content: newSubContent.trim(), tag: newSubTag }]);

      if (error) throw error;

      await fetchNotesFromCloud();
      setNewSubTitle('');
      setNewSubContent('');
      setShowAddSubSectionModal(false);
      showToast('📂 Жаңа бөлім қосылды');
    } catch (err) {
      showToast('❌ Бөлім қосу сәтсіз аяқталды');
    }
  };

  const handleDeleteSubSection = async (subId) => {
    requireAuth(async () => {
      try {
        const { error } = await supabase.from('sections').delete().eq('id', subId);
        if (error) throw error;

        await fetchNotesFromCloud();
        showToast('🗑️ Бөлім жойылды');
      } catch (err) {
        showToast('❌ Бөлімді жою қатесі');
      }
    });
  };

  const handleUpdateSubSectionContent = (subId, newContent) => {
    // Мәтінді өзгертпес бұрын авторлануды (парольді) тексеру
    requireAuth(() => {
      setNotes(prev => prev.map(n => ({
        ...n,
        sections: n.sections.map(s => s.id === subId ? { ...s, content: newContent } : s)
      })));
    });
  };

  const saveContentToCloud = async (subId, content) => {
    if (!session) return; // Егер сессия болмаса сақтамайды
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('sections')
        .update({ content })
        .eq('id', subId);

      if (error) throw error;
      setSaveStatus('synced');
    } catch (err) {
      setSaveStatus('saved');
    }
  };

  const categories = useMemo(() => {
    const set = new Set(notes.map(n => n.category));
    return Array.from(set);
  }, [notes]);

  const filteredDiseases = useMemo(() => {
    return notes.filter(note => {
      const matchesCategory = !selectedCategory || note.category === selectedCategory;
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.sections.some(s => s.content.toLowerCase().includes(searchQuery.toLowerCase()) || s.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTagFilter || note.sections.some(s => s.tag === selectedTagFilter);
      return matchesCategory && matchesSearch && matchesTag;
    });
  }, [notes, selectedCategory, searchQuery, selectedTagFilter]);

  const currentDisease = notes.find(n => n.id === selectedDiseaseId);
  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col md:flex-row h-screen font-sans text-sm overflow-hidden transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
      
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 border px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce print:hidden ${isDark ? 'bg-slate-900 border-teal-500/30 text-teal-300' : 'bg-slate-100 border-teal-500 text-teal-700'}`}>
          <ShieldCheck size={16} className="text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className={`border rounded-2xl p-6 max-w-sm w-full shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-semibold">
                <Lock size={18} className="text-teal-400" />
                <span>Өзгерту үшін жүйеге кіру (Админ)</span>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="admin@medstudy.kz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Пароль</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  required
                />
              </div>
              {authError && <div className="text-xs text-rose-400 font-medium">{authError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/20"
                >
                  Болдырмау
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-medium hover:bg-teal-500 shadow-sm"
                >
                  Кіру
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Disease Modal */}
      {showAddDiseaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Жаңа нозология (Ауру) қосу</h3>
              <button onClick={() => setShowAddDiseaseModal(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDisease} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ауру атауы</label>
                <input
                  type="text"
                  placeholder="Мысалы: Холецистит"
                  value={newDiseaseTitle}
                  onChange={(e) => setNewDiseaseTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Категория</label>
                <input
                  type="text"
                  placeholder="Мысалы: Хирургия"
                  value={newDiseaseCategory}
                  onChange={(e) => setNewDiseaseCategory(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Сурет жүктеу</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-xl cursor-pointer hover:border-teal-500 text-xs text-slate-400 transition-colors">
                    <ImageIcon size={16} className="text-teal-400" />
                    <span>{uploadingImage ? 'Жүктелуде...' : 'Файл таңдау'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {newDiseaseImage && <span className="text-xs text-teal-400 font-medium">✅ Жүктелді</span>}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDiseaseModal(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/20">Болдырмау</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-medium hover:bg-teal-500 shadow-sm">Қосу</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add SubSection Modal */}
      {showAddSubSectionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Жаңа бөлім қосу</h3>
              <button onClick={() => setShowAddSubSectionModal(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubSection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Бөлім атауы</label>
                <input
                  type="text"
                  placeholder="Мысалы: Диагностикасы"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Маңыздылық тегі</label>
                <select
                  value={newSubTag}
                  onChange={(e) => setNewSubTag(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="Ақпарат">Ақпарат</option>
                  <option value="Маңызды">Маңызды</option>
                  <option value="Шұғыл">Шұғыл</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Мазмұны</label>
                <textarea
                  rows={4}
                  placeholder="Бөлім мазмұнын жазыңыз..."
                  value={newSubContent}
                  onChange={(e) => setNewSubContent(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSubSectionModal(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/20">Болдырмау</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-medium hover:bg-teal-500 shadow-sm">Сақтау</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar - Телефонда толық адаптивті болуы үшін */}
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-64'} fixed md:static inset-y-0 left-0 transition-transform duration-300 border-r flex flex-col z-30 overflow-hidden print:hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2 font-semibold">
            <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 text-xs font-bold">M</div>
            <span>MedStudy Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-xs font-medium text-slate-500 px-2 py-1">Категориялар</div>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors ${!selectedCategory ? (isDark ? 'bg-slate-800 text-teal-400 font-medium' : 'bg-slate-200 text-teal-700 font-medium') : 'text-slate-400 hover:opacity-80'}`}
          >
            <Folder size={16} />
            <span>Барлық категориялар</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors ${selectedCategory === cat ? 'bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20' : 'text-slate-400 hover:opacity-80'}`}
            >
              <Folder size={16} className={selectedCategory === cat ? 'text-teal-400' : 'text-slate-500'} />
              <span>{cat}</span>
            </button>
          ))}
        </div>

        <div className={`p-3 border-t space-y-2 text-xs ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100'}`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cloud size={14} className={saveStatus === 'synced' ? 'text-teal-400' : 'text-amber-400 animate-pulse'} />
              {saveStatus === 'synced' ? 'Бұлтта сақталды' : 'Сақталуда...'}
            </span>
            <span>
              {session ? (
                <button onClick={handleLogout} className="text-rose-400 hover:underline flex items-center gap-1">
                  <LogOut size={12} /> Шығу
                </button>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="text-teal-400 hover:underline flex items-center gap-1">
                  <Lock size={12} /> Кіру
                </button>
              )}
            </span>
          </div>
          <button 
            onClick={fetchNotesFromCloud} 
            className={`w-full border py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 font-medium transition-colors ${isDark ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <RefreshCw size={12} /> Деректерді жаңарту
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 border-b flex items-center justify-between px-4 gap-2 print:hidden ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 md:hidden hover:opacity-80 rounded-xl text-slate-400">
              <Menu size={18} />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Іздеу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-1.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 md:px-3 md:py-1.5 border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${isDark ? 'border-slate-800 bg-slate-900 text-amber-400 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
              title="Түсті ауыстыру"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden md:inline">{isDark ? 'Жарық режим' : 'Түнгі режим'}</span>
            </button>

            <button
              onClick={() => setSelectedTagFilter(null)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${!selectedTagFilter ? 'bg-teal-600 text-white' : (isDark ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100')}`}
            >
              Барлығы
            </button>
            <button
              onClick={() => setSelectedTagFilter('Шұғыл')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${selectedTagFilter === 'Шұғыл' ? 'bg-rose-600 text-white' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'}`}
            >
              Шұғыл
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`w-72 border-r hidden md:flex flex-col print:hidden ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className="font-medium text-xs text-slate-500 uppercase tracking-wider">Нозологиялар ({filteredDiseases.length})</span>
              <button 
                onClick={() => requireAuth(() => setShowAddDiseaseModal(true))}
                className="p-1.5 bg-teal-600 text-white hover:bg-teal-500 rounded-xl shadow-sm transition-transform active:scale-95"
                title="Жаңа ауру қосу"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="text-center py-6 text-xs text-slate-500">Жүктелуде...</div>
              ) : filteredDiseases.map(disease => (
                <div
                  key={disease.id}
                  onClick={() => setSelectedDiseaseId(disease.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    selectedDiseaseId === disease.id 
                      ? (isDark ? 'bg-slate-800 border border-slate-700 shadow-sm' : 'bg-teal-50 border border-teal-200 shadow-sm') 
                      : (isDark ? 'hover:bg-slate-900 text-slate-400' : 'hover:bg-slate-100 text-slate-600')
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium truncate ${selectedDiseaseId === disease.id ? 'text-teal-400' : ''}`}>{disease.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Tag size={10} /> {disease.category} · {disease.sections.length} бөлім
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDisease(disease.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full">
            {currentDisease ? (
              <div className="space-y-6">
                <div className={`flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="space-y-2">
                    <div className="inline-block px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-xs font-medium">
                      {currentDisease.category}
                    </div>
                    <h1 className="text-2xl font-bold">{currentDisease.title}</h1>
                    
                    {currentDisease.image_url && (
                      <div className="mt-2">
                        <img src={currentDisease.image_url} alt="Ауру суреті" className="max-h-48 rounded-xl object-cover border border-slate-700 shadow-md" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => requireAuth(() => setShowAddSubSectionModal(true))}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-medium hover:bg-teal-500 flex items-center justify-center gap-1.5 shadow-sm transition-colors print:hidden"
                  >
                    <Plus size={14} /> Бөлім қосу
                  </button>
                </div>

                <div className="space-y-3">
                  {currentDisease.sections.map((section) => {
                    const isOpen = openSections[section.id] !== false;
                    return (
                      <div key={section.id} className={`border rounded-2xl overflow-hidden shadow-sm ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
                        <div className={`w-full px-4 py-3 flex items-center justify-between border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="flex items-center gap-2 text-left flex-1 font-medium hover:opacity-80"
                          >
                            {isOpen ? <ChevronDown size={16} className="text-teal-400" /> : <ChevronRight size={16} className="text-slate-500" />}
                            <span>{section.title}</span>
                          </button>
                          
                          <div className="flex items-center gap-3">
                            {section.tag && (
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                section.tag === 'Шұғыл' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                section.tag === 'Маңызды' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {section.tag}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteSubSection(section.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors print:hidden"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="p-4">
                            <textarea
                              rows={3}
                              value={section.content}
                              onChange={(e) => handleUpdateSubSectionContent(section.id, e.target.value)}
                              onBlur={(e) => saveContentToCloud(section.id, e.target.value)}
                              placeholder="Мәтінді осы жерде тікелей өңдеңіз..."
                              className={`w-full p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed resize-y ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                            />
                            <div className="text-[10px] text-slate-500 mt-1 text-right print:hidden">🔒 Өзгерту үшін жүйеге кіру қажет (Автоматты түрде бұлтта сақталады)</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 p-6 text-center">
                Сол жақ тізімнен ауруды таңдаңыз немесе жаңадан қосыңыз
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}