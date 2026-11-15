import React, { useState } from 'react';
import { Search, Sun, Moon, Plus, Image as ImageIcon, Printer, Menu } from 'lucide-react';
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
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  currentDisease, searchQuery, setSearchQuery, isDarkMode, setIsDarkMode, session, saveContentToCloud, onAddSection, isSidebarOpen, setIsSidebarOpen
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSec, setShowAddSec] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Шрифт баптаулары (Түрі, Өлшемі, Түсі)
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [fontSize, setFontSize] = useState('text-xs');
  const [fontColor, setFontColor] = useState('text-slate-900 dark:text-slate-100');

  const handleAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !currentDisease) return;
    onAddSection(currentDisease.id, newSectionTitle);
    setNewSectionTitle('');
    setShowAddSec(false);
  };

  const uploadAndInsertImage = async (file: File, sectionId: string, currentContent: string) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const updatedContent = (currentContent || '') + `\n![Сурет](${imageUrl})\n`;
      saveContentToCloud(sectionId, updatedContent);
    } catch (err: any) {
      alert('Суретті жүктеу қатесі: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (sectionId: string, currentContent: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAndInsertImage(file, sectionId, currentContent);
  };

  // Ноутбукке сақтамай-ақ Ctrl + V арқылы суретті тікелей қою
  const handlePaste = (sectionId: string, currentContent: string, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadAndInsertImage(file, sectionId, currentContent);
        }
      }
    }
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Сайдбарды ашу/жабу"
          >
            <Menu size={20} />
          </button>
          
          <div className="relative w-48 sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Іздеу..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100" 
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Шрифт түрін, өлшемін және түсін өзгерту панелі */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-[11px]">
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="bg-transparent outline-none px-1 text-slate-700 dark:text-slate-300">
              <option value="font-sans">Sans</option>
              <option value="font-serif">Serif</option>
              <option value="font-mono">Mono</option>
            </select>
            <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="bg-transparent outline-none px-1 text-slate-700 dark:text-slate-300">
              <option value="text-xs">Кіші</option>
              <option value="text-sm">Орташа</option>
              <option value="text-base">Үлкен</option>
            </select>
            <select value={fontColor} onChange={e => setFontColor(e.target.value)} className="bg-transparent outline-none px-1 text-slate-700 dark:text-slate-300">
              <option value="text-slate-900 dark:text-slate-100">Қара</option>
              <option value="text-teal-600 dark:text-teal-400">Жасыл</option>
              <option value="text-blue-600 dark:text-blue-400">Көк</option>
              <option value="text-rose-600 dark:text-rose-400">Қызыл</option>
            </select>
          </div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 border border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
        {currentDisease ? (
          <>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
              <div>
                <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-medium">{currentDisease.category}</span>
                <h1 className="text-xl md:text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">{currentDisease.title}</h1>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => window.print()} 
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors print:hidden"
                >
                  <Printer size={14} className="text-teal-500" /> Печать / PDF
                </button>

                {session && (
                  <button 
                    onClick={() => setShowAddSec(!showAddSec)} 
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors print:hidden"
                  >
                    <Plus size={14} /> Бөлім қосу
                  </button>
                )}
              </div>
            </div>

            {showAddSec && (
              <form onSubmit={handleAddSectionSubmit} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-2 print:hidden">
                <input 
                  type="text"
                  placeholder="Бөлім атауы (Мысалы: Диагностика, Емі)"
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  className="flex-1 p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 sm:flex-none px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-medium">Қосу</button>
                  <button type="button" onClick={() => setShowAddSec(false)} className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">Жоқ</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {currentDisease.sections && currentDisease.sections.length > 0 ? (
                currentDisease.sections.map((section: any) => (
                  <div key={section.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm space-y-3 print:border-none print:shadow-none print:p-0 print:mb-6">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-xs text-teal-600 dark:text-teal-400 text-sm">{section.title}</div>
                      
                      {session && (
                        <label className="cursor-pointer px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors text-slate-700 dark:text-slate-300 print:hidden">
                          <ImageIcon size={14} className="text-teal-500" />
                          <span>{uploading ? 'Жүктелуде...' : 'Фото (немесе Ctrl+V)'}</span>
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
                      rows={6}
                      defaultValue={section.content}
                      onBlur={(e) => saveContentToCloud(section.id, e.target.value)}
                      onPaste={(e) => handlePaste(section.id, section.content, e)}
                      readOnly={!session}
                      placeholder={session ? "Конспектіні осында жазыңыз немесе суретті Ctrl+V арқылы қойыңыз..." : "Өзгерту үшін жүйеге кіріңіз"}
                      className={`w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-y ${fontFamily} ${fontSize} ${fontColor} print:border-none print:bg-transparent print:resize-none print:p-0`}
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