import React, { useState, useEffect } from 'react';
import { Search, Plus, Image as ImageIcon, Printer, Menu, Edit3, X, Trash2, ArrowUp, ArrowDown, Lock, LogOut, CornerDownRight } from 'lucide-react';
import { supabase } from '../supabase';

interface Section {
  id: string;
  title: string;
  content: string;
  parent_id?: string | null;
  disease_id: string;
}

interface ContentAreaProps {
  currentDisease: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  session: any;
  saveContentToCloud: (subId: string, content: string) => void;
  onAddSection: (diseaseId: string, title: string, parentId?: string | null) => void;
  onUpdateDisease: (diseaseId: string, newTitle: string, newCategory: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sections: any[], index: number, direction: 'up' | 'down') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  signOut: () => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  currentDisease, searchQuery, setSearchQuery, session, saveContentToCloud, onAddSection, onUpdateDisease, onUpdateSectionTitle, onDeleteSection, onMoveSection, isSidebarOpen, setIsSidebarOpen, setShowAuthModal, signOut
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSec, setShowAddSec] = useState<string | null | boolean>(false); // false, true (root), немесе parentId (ішкі бөлім үшін)
  const [uploading, setUploading] = useState(false);

  const [isEditingDisease, setIsEditingDisease] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitleText, setEditSectionTitleText] = useState('');

  const [localContents, setLocalContents] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (currentDisease && currentDisease.sections) {
      const initial: { [key: string]: string } = {};
      currentDisease.sections.forEach((s: any) => {
        initial[s.id] = s.content || '';
      });
      setLocalContents(initial);
    }
  }, [currentDisease]);

  const handleTextChange = (sectionId: string, val: string) => {
    setLocalContents(prev => ({ ...prev, [sectionId]: val }));
  };

  const handleTextBlur = (sectionId: string) => {
    const val = localContents[sectionId];
    if (val !== undefined) {
      saveContentToCloud(sectionId, val);
    }
  };

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

  const handleAddSectionSubmit = (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !currentDisease) return;
    onAddSection(currentDisease.id, newSectionTitle, parentId);
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
      setLocalContents(prev => ({ ...prev, [sectionId]: updatedContent }));
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
    setLocalContents(prev => ({ ...prev, [sectionId]: updatedContent }));
    saveContentToCloud(sectionId, updatedContent);
  };

  const renderPublicContent = (content: string) => {
    if (!content) return <span className="text-slate-400">Мәтін жоқ</span>;
    const parts = content.split(/(!\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        const imgUrl = match[2];
        return (
          <div key={index} className="my-3">
            <img src={imgUrl} alt="Конспект суреті" className="max-h-80 rounded-xl border border-slate-200 shadow-sm object-contain" />
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const renderEditableImages = (sectionId: string, currentContent: string) => {
    if (!currentContent) return null;
    const matches = Array.from(currentContent.matchAll(/!\[(.*?)\]\((.*?)\)/g));
    if (matches.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-3 mt-3">
        {matches.map((match, index) => {
          const imgUrl = match[2];
          return (
            <div key={index} className="relative inline-block group">
              <img src={imgUrl} alt="Конспект суреті" className="max-h-60 rounded-xl border border-slate-200 shadow-sm object-contain" />
              <button
                onClick={() => handleRemoveImage(sectionId, currentContent, imgUrl)}
                className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white w-7 h-7 rounded-full shadow-md text-xs flex items-center justify-center transition-all print:hidden"
                title="Суретті өшіру"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Рекурсивті түрде бөлімдер мен олардың ішкі бөлімдерін ағаш тәрізді шығару функциясы
  const renderSectionsTree = (parentId: string | null = null, level: number = 0) => {
    if (!currentDisease || !currentDisease.sections) return null;
    
    const filteredSections = currentDisease.sections.filter((s: any) => (parentId === null ? !s.parent_id : s.parent_id === parentId));

    if (filteredSections.length === 0 && level > 0) return null;

    return filteredSections.map((section: any, index: number) => {
      const currentText = localContents[section.id] !== undefined ? localContents[section.id] : (section.content || '');
      const indentClass = level > 0 ? `ml-4 md:ml-8 border-l-2 border-teal-100 pl-3 md:pl-4 mt-3` : '';

      return (
        <div key={section.id} className={`space-y-3 ${indentClass}`}>
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-3 print:border-none print:shadow-none print:p-0 print:mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {level > 0 && <CornerDownRight size={14} className="text-teal-500 shrink-0" />}
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
                    <span className={`font-semibold text-teal-600 ${level === 0 ? 'text-sm print:text-teal-700 print:text-base' : 'text-xs text-slate-700'}`}>{section.title}</span>
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

              <div className="flex items-center gap-2 print:hidden flex-wrap justify-end">
                {session && (
                  <>
                    {/* Ішкі бөлім қосу батырмасы */}
                    <button 
                      onClick={() => setShowAddSec(section.id)} 
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="Ішкі бөлім қосу"
                    >
                      <Plus size={12} /> Ішкі бөлім
                    </button>

                    <button onClick={() => onDeleteSection(section.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg" title="Жою">
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
                      onChange={(e) => handleImageUpload(section.id, currentText, e)}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Бұл бөлімнің ішіне ішкі бөлім қосу формасы */}
            {showAddSec === section.id && (
              <form onSubmit={(e) => handleAddSectionSubmit(e, section.id)} className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl flex flex-col sm:flex-row gap-2 print:hidden">
                <input 
                  type="text"
                  placeholder="Ішкі бөлім атауы..."
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none text-slate-900"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium">Қосу</button>
                  <button type="button" onClick={() => setShowAddSec(false)} className="px-3 py-2 bg-slate-200 rounded-lg text-xs font-medium text-slate-700">Жоқ</button>
                </div>
              </form>
            )}

            {/* Конспект жазу немесе оқу өрісі */}
            {session ? (
              <>
                <textarea
                  rows={5}
                  value={currentText}
                  onChange={(e) => handleTextChange(section.id, e.target.value)}
                  onBlur={() => handleTextBlur(section.id)}
                  onPaste={(e) => handlePaste(section.id, currentText, e)}
                  placeholder="Конспектіні осында жазыңыз немесе суретті Ctrl+V арқылы қойыңыз..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-xs leading-relaxed resize-y text-slate-900"
                />
                <div>
                  {renderEditableImages(section.id, currentText)}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed py-2">
                {renderPublicContent(currentText)}
              </div>
            )}
          </div>

          {/* Осы бөлімге тиесілі ішкі бөлімдерді рекурсивті түрде шығару */}
          {renderSectionsTree(section.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white text-slate-900 transition-all duration-300 print:h-auto print:overflow-visible">
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

      {/* Жоғарғы панель */}
      <header className="h-14 border-b border-slate-200 px-3 md:px-6 flex items-center justify-between bg-slate-50/50 shrink-0 print:hidden">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            title="Сайдбарды ашу/жабу"
          >
            <Menu size={20} />
          </button>
          
          <div className="relative w-32 sm:w-72">
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

        <div className="shrink-0">
          {session ? (
            <button onClick={signOut} className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 border border-rose-200 transition-colors">
              <LogOut size={14} /> <span className="hidden sm:inline">Шығу</span>
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-xs text-teal-600 hover:bg-teal-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 border border-teal-200 transition-colors">
              <Lock size={14} /> <span>Кіру</span>
            </button>
          )}
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
                    onClick={() => setShowAddSec(showAddSec === 'root' ? false : 'root')} 
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> Бөлім қосу
                  </button>
                )}
              </div>
            </div>

            {/* Басты (root) бөлім қосу формасы */}
            {showAddSec === 'root' && (
              <form onSubmit={(e) => handleAddSectionSubmit(e, null)} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-2 print:hidden">
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

            {/* Бөлімдерді ағаш тәрізді (nested tree) көрсету */}
            <div className="space-y-4 print:space-y-6">
              {currentDisease.sections && currentDisease.sections.length > 0 ? (
                renderSectionsTree(null, 0)
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