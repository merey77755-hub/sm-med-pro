import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabase';
import { Sidebar } from './components/Sidebar';
import { ContentArea } from './components/ContentArea';
import { AuthModal } from './components/AuthModal';
import { NewDiseaseModal } from './components/NewDiseaseModal';
import { Toast } from './components/Toast';

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

export default function App() {
  const [notes, setNotes] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [session, setSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showNewDiseaseModal, setShowNewDiseaseModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

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
    const { error } = await supabase.from('sections').update({ content: newContent }).eq('id', subId);
    if (error) {
      showToast('❌ Сақтау қатесі');
    } else {
      setNotes(prev => prev.map(n => ({
        ...n,
        sections: n.sections.map(s => s.id === subId ? { ...s, content: newContent } : s)
      })));
    }
  };

  const handleCreateDisease = async (newTitle: string, newCategory: string) => {
    const { data, error } = await supabase.from('diseases').insert([
      { title: newTitle, category: newCategory }
    ]).select().single();

    if (!error && data) {
      await supabase.from('sections').insert([
        { disease_id: data.id, title: 'Жалпы сипаттама', content: 'Мұнда конспект жазылады...', tag: 'Ақпарат' }
      ]);
      setShowNewDiseaseModal(false);
      await fetchNotesFromCloud();
      setSelectedDiseaseId(data.id);
      showToast('✅ Жаңа ауру қосылды');
    } else {
      showToast('❌ Қосу кезінде қате кетті');
    }
  };

  const handleUpdateDisease = async (diseaseId: string, newTitle: string, newCategory: string) => {
    const { error } = await supabase.from('diseases').update({
      title: newTitle,
      category: newCategory
    }).eq('id', diseaseId);

    if (!error) {
      await fetchNotesFromCloud();
      showToast('✅ Ауру атауы өзгертілді');
    } else {
      showToast('❌ Өзгерту қатесі');
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, newTitle: string) => {
    const { error } = await supabase.from('sections').update({ title: newTitle }).eq('id', sectionId);
    if (!error) {
      await fetchNotesFromCloud();
      showToast('✅ Бөлім атауы өзгертілді');
    } else {
      showToast('❌ Қате кетті');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Бұл бөлімді жоюға сенімдісіз бе?')) return;
    const { error } = await supabase.from('sections').delete().eq('id', sectionId);
    if (!error) {
      await fetchNotesFromCloud();
      showToast('🗑️ Бөлім жойылды');
    } else {
      showToast('❌ Жою қатесі');
    }
  };

  const handleMoveSection = async (sections: any[], index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Орындарын ауыстыру
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Бөлімдерді state-те жаңарту
    setNotes(prev => prev.map(n => n.id === currentDisease?.id ? { ...n, sections: newSections } : n));
  };

  const handleAddSection = async (diseaseId: string, title: string) => {
    const { error } = await supabase.from('sections').insert([
      { disease_id: diseaseId, title: title, content: 'Конспект жазыңыз...', tag: 'Ақпарат' }
    ]);
    if (!error) {
      await fetchNotesFromCloud();
      showToast('✅ Жаңа бөлім қосылды');
    } else {
      showToast('❌ Бөлім қосу қатесі');
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
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans text-sm">
      {toastMessage && <Toast message={toastMessage} />}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin} 
          authError={authError} 
        />
      )}

      {showNewDiseaseModal && (
        <NewDiseaseModal 
          onClose={() => setShowNewDiseaseModal(false)} 
          onCreate={handleCreateDisease} 
        />
      )}

      <Sidebar 
        session={session}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        filteredDiseases={filteredDiseases}
        selectedDiseaseId={selectedDiseaseId}
        setSelectedDiseaseId={setSelectedDiseaseId}
        loading={loading}
        setShowNewDiseaseModal={setShowNewDiseaseModal}
        setShowAuthModal={setShowAuthModal}
        handleDeleteDisease={handleDeleteDisease}
        signOut={() => supabase.auth.signOut()}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <ContentArea 
        currentDisease={currentDisease}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        session={session}
        saveContentToCloud={saveContentToCloud}
        onAddSection={handleAddSection}
        onUpdateDisease={handleUpdateDisease}
        onUpdateSectionTitle={handleUpdateSectionTitle}
        onDeleteSection={handleDeleteSection}
        onMoveSection={handleMoveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </div>
  );
}