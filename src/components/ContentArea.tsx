import React, { useState } from 'react';
import { Search, Sun, Moon, Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../supabase';

interface ContentAreaProps {
  currentDisease: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  session: any;
  saveContentToCloud: (subId: string, content: string) => void;
  onAddSection: (diseaseId: string, title: string) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  currentDisease, searchQuery, setSearchQuery, isDarkMode, setIsDarkMode, session, saveContentToCloud, onAddSection
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSec, setShowAddSec] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !currentDisease) return;
    onAddSection(currentDisease.id, newSectionTitle);
    setNewSectionTitle('');
    setShowAddSec(false);
  };

  const handleImageUpload = async (sectionId: string, currentContent: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const updatedContent = (currentContent || '') + `\n![Сурет](${imageUrl})\n`;
      saveContentToCloud(sectionId, updatedContent);
    } catch (err: any) {
      alert('Суретті жүктеу кезінде қате кетті: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Іздеу..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100" 
          />
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 border border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {currentDisease ? (
          <>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-end">
              <div>
                <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-medium">{currentDisease.category}</span>
                <h1 className="text-2xl font-bold mt-2">{currentDisease.title}</h1>
              </div>
              {session && (
                <button 
                  onClick={() => setShowAddSec(!showAddSec)} 
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} /> Бөлім қосу
                </button>
              )}
            </div>

            {showAddSec && (
              <form onSubmit={handleAddSectionSubmit} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex gap-2">
                <input 
                  type="text"
                  placeholder="Бөлім атауы (Мысалы: Диагностика, Емі)"
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  className="flex-1 p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100"
                  required
                />
                <button type="submit" className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-medium">Қосу</button>
                <button type="button" onClick={() => setShowAddSec(false)} className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">Жоқ</button>
              </form>
            )}

            <div className="space-y-4">
              {currentDisease.sections && currentDisease.sections.length > 0 ? (
                currentDisease.sections.map((section: any) => (
                  <div key={section.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-xs text-teal-600 dark:text-teal-400">{section.title}</div>
                      
                      {/* Фото қосу батырмасы орнында */}
                      {session && (
                        <label className="cursor-pointer px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors text-slate-700 dark:text-slate-300">
                          <ImageIcon size={14} className="text-teal-500" />
                          <span>{uploading ? 'Жүктелуде...' : 'Фото қосу'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(section.id, section.content, e)}
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>

                    <textarea
                      rows={5}
                      defaultValue={section.content}
                      onBlur={(e) => saveContentToCloud(section.id, e.target.value)}
                      readOnly={!session}
                      placeholder={session ? "Конспектіні осында жазыңыз..." : "Өзгерту үшін жүйеге кіріңіз"}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-y text-slate-900 dark:text-slate-100"
                    />
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-10 text-center">Бұл ауруға әлі бөлімдер қосылмаған.</div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">Сол жақтан ауруды таңдаңыз</div>
        )}
      </div>
    </main>
  );
};