import React, { useState } from 'react';
import { Search, Plus, Image as ImageIcon, Printer, Menu } from 'lucide-react';
import { supabase } from '../supabase';

interface ContentAreaProps {
  currentDisease: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  session: any;
  saveContentToCloud: (subId: string, content: string) => void;
  onAddSection: (diseaseId: string, title: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  currentDisease, searchQuery, setSearchQuery, session, saveContentToCloud, onAddSection, isSidebarOpen, setIsSidebarOpen
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

  const handleRemoveImage = (sectionId: string, currentContent: string, imgUrl: string) => {
    if (!window.confirm('Бұл суретті жоюға сенімдісіз бе?')) return;
    const regex = new RegExp(`!\\[.*?\\]\\(${imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    const updatedContent = currentContent.replace(regex, '').trim();
    saveContentToCloud(sectionId, updatedContent);
  };

  const renderContentWithImages = (sectionId: string, currentContent: string, content: string) => {
    if (!content) return null;
    const parts = content.split(/(!\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        const imgUrl = match[2];
        return (
          <div key={index} className="my-3 relative inline-block group print:my-2">
            <img src={imgUrl} alt="Конспект суреті" className="max-h-80 rounded-xl border border-slate-200 shadow-sm object-contain print:max-h-96 print:border-none print:shadow-none" />
            {session && (
              <button
                onClick={() => handleRemoveImage(sectionId, currentContent, imgUrl)}
                className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white w-7 h-7 rounded-full shadow-md text-xs flex items-center justify-center transition-all print:hidden"
                title="Суретті өшіру"
              >
                ✕
              </button>
            )}
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white text-slate-900 transition-all duration-300 print:h-auto print:overflow-visible">
      {/* Телефон мен ноут үшін печать кезінде таза ақ фон мен дұрыс формат беретін стиль */}
      <style>{`
        @media print {
          body, html {
            background-color: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          main {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          textarea {
            border: none !important;
            background: transparent !important;
            resize: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <header className="h-14 border-b border-slate-200 px-4 md:px-6 flex items-center justify-between bg-slate-50/50 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
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
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs outline-none text-slate-900" 
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 print:p-0 print:overflow-visible">
        {currentDisease ? (
          <>
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 print:border-b print:border-slate-300">
              <div>
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium print:bg-transparent print:text-teal-700 print:p-0">{currentDisease.category}</span>
                <h1 className="text-xl md:text-2xl font-bold mt-2 text-slate-900 print:text-black">{currentDisease.title}</h1>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} className="text-teal-500" /> Печать / PDF
                </button>

                {session && (
                  <button 
                    onClick={() => setShowAddSec(!showAddSec)} 
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> Бөлім қосу
                  </button>
                )}
              </div>
            </div>

            {showAddSec && (
              <form onSubmit={handleAddSectionSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-2 print:hidden">
                <input 
                  type="text"
                  placeholder="Бөлім атауы (Мысалы: Диагностика, Емі)"
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none text-slate-900"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 sm:flex-none px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-medium">Қосу</button>
                  <button type="button" onClick={() => setShowAddSec(false)} className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 rounded-xl text-xs font-medium text-slate-700">Жоқ</button>
                </div>
              </form>
            )}

            <div className="space-y-4 print:space-y-6">
              {currentDisease.sections && currentDisease.sections.length > 0 ? (
                currentDisease.sections.map((section: any) => (
                  <div key={section.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-3 print:border-none print:shadow-none print:p-0 print:mb-6">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-xs text-teal-600 text-sm print:text-teal-700 print:text-base">{section.title}</div>
                      
                      {session && (
                        <label className="cursor-pointer px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors text-slate-700 print:hidden">
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
                      value={section.content}
                      onChange={(e) => saveContentToCloud(section.id, e.target.value)}
                      onPaste={(e) => handlePaste(section.id, section.content, e)}
                      readOnly={!session}
                      placeholder={session ? "Конспектіні осында жазыңыз немесе суретті Ctrl+V арқылы қойыңыз..." : "Өзгерту үшін жүйеге кіріңіз"}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-xs leading-relaxed resize-y text-slate-900 print:border-none print:bg-transparent print:resize-none print:p-0 print:text-black"
                    />

                    <div className="mt-2 text-xs text-slate-800 print:text-black">
                      {renderContentWithImages(section.id, section.content, section.content)}
                    </div>
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