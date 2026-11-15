import React, { useState } from 'react';
import { Search, Plus, Image as ImageIcon, Printer, Menu, Edit3, X, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../supabase';

interface ContentAreaProps {
  currentDisease: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  session: any;
  saveContentToCloud: (subId: string, content: string) => void;
  onAddSection: (diseaseId: string, title: string) => void;
  onUpdateDisease: (diseaseId: string, newTitle: string, newCategory: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sections: any[], index: number, direction: 'up' | 'down') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  currentDisease, searchQuery, setSearchQuery, session, saveContentToCloud, onAddSection, onUpdateDisease, onUpdateSectionTitle, onDeleteSection, onMoveSection, isSidebarOpen, setIsSidebarOpen
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSec, setShowAddSec] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Ауру атауын өңдеу
  const [isEditingDisease, setIsEditingDisease] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Ішкі бөлім атауын өңдеу
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitleText, setEditSectionTitleText] = useState('');

  const handleOpenEdit = () => {
    if (!currentDisease) return;
    setEditTitle(currentDisease.title);
    setEditCategory(currentDisease.category);
    setIsEditingDisease(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editCategory.trim() || !currentDisease) return;
    onUpdateDisease(currentDisease.id, editTitle, editCategory);
    setIsEditingDisease(false);
  };

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
      {/* Ауру атауын өңдеу терезесі */}
      {isEditingDisease && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm text-slate-900">Атауын немесе категорияны өңдеу</span>
              <button onClick={() => setIsEditingDisease(false)} className="text-slate-500 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Ауру атауы</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  required 
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs outline-none text-slate-900" 
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Категория (Пән атауы)</label>
                <input 
                  type="text" 
                  value={editCategory} 
                  onChange={e => setEditCategory(e.target.value)} 
                  required 
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs outline-none text-slate-900" 
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsEditingDisease(false)} className="w-1/2 py-2.5 bg-slate-200 rounded-xl text-xs font-medium text-slate-700">Болдырмау</button>
                <button type="submit" className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium">Сақтау</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium">{currentDisease.category}</span>
                  {session && (
                    <button 
                      onClick={handleOpenEdit} 
                      className="text-slate-400 hover:text-teal-600 flex items-center gap-1 text-[11px] transition-colors print:hidden"
                      title="Атауын өңдеу"
                    >
                      <Edit3 size={13} /> Өзгерту
                    </button>
                  )}
                </div>
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
                currentDisease.sections.map((section: any, index: number) => (
                  <div key={section.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-3 print:border-none print:shadow-none print:p-0 print:mb-6">
                    <div className="flex justify-between items-center">
                      {/* Бөлім атауын өңдеу немесе көрсету */}
                      <div className="flex items-center gap-2">
                        {editingSectionId === section.id ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="text" 
                              value={editSectionTitleText} 
                              onChange={e => setEditSectionTitleText(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs outline-none"
                            />
                            <button 
                              onClick={() => {
                                if (editSectionTitleText.trim()) {
                                  onUpdateSectionTitle(section.id, editSectionTitleText);
                                  setEditingSectionId(null);
                                }
                              }} 
                              className="px-2 py-1 bg-teal-600 text-white rounded-lg text-xs"
                            >
                              Сақтау
                            </button>
                            <button onClick={() => setEditingSectionId(null)} className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs">Болдырмау</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-teal-600 text-sm print:text-teal-700 print:text-base">{section.title}</span>
                            {session && (
                              <button 
                                onClick={() => { setEditingSectionId(section.id); setEditSectionTitleText(section.title); }}
                                className="text-slate-400 hover:text-teal-600 text-[11px] flex items-center gap-0.5 print:hidden"
                                title="Бөлім атауын өзгерту"
                              >
                                <Edit3 size={12} /> Өзгерту
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Батырмалар: Орнын ауыстыру, өшіру және фото қосу */}
                      <div className="flex items-center gap-2 print:hidden">
                        {session && (
                          <>
                            {/* Жоғары жылжыту */}
                            {index > 0 && (
                              <button 
                                onClick={() => onMoveSection(currentDisease.sections, index, 'up')} 
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                                title="Жоғары жылжыту"
                              >
                                <ArrowUp size={14} />
                              </button>
                            )}
                            {/* Төмен жылжыту */}
                            {index < currentDisease.sections.length - 1 && (
                              <button 
                                onClick={() => onMoveSection(currentDisease.sections, index, 'down')} 
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                                title="Төмен жылжыту"
                              >
                                <ArrowDown size={14} />
                              </button>
                            )}
                            {/* Бөлімді өшіру */}
                            <button 
                              onClick={() => onDeleteSection(section.id)} 
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="Бөлімді жою"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {session && (
                          <label className="cursor-pointer px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors text-slate-700">
                            <ImageIcon size={14} className="text-teal-500" />
                            <span>{uploading ? 'Жүктелуде...' : 'Фото (Ctrl+V)'}</span>
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