import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, 
  Trash2, Edit3, Save, X, Lock, Unlock, Download, Upload, 
  Search, BookOpen, Image as ImageIcon, ExternalLink, FileText
} from 'lucide-react';

const INITIAL_LIBRARY = [
  {
    id: 'cat-1',
    title: 'Хирургия',
    tag: 'Негізгі',
    children: [
      {
        id: 'sec-1',
        title: 'Жедел аппендицит',
        content: 'Жедел аппендицит — соқыр ішек өсіндісінің қабынуы.\n\n• Клиникасы: Оң мықын аймағының ауыруы (Кохер симптомы), жүрек айну, құсу, субфебрильді температура.\n• Диагностика: УДЗ, ЖҚА (лейкоцитоз).\n• Симптомдар: МакБерни, Ровзинг, Ситковский.',
        imageUrl: '',
        tag: 'Аурулар',
        children: [
          {
            id: 'sec-1-1',
            title: 'Операциялық ем (Аппендэктомия)',
            content: 'Лапароскопиялық немесе дәстүрлі ашық аппендэктомия жасау алгоритмі.',
            imageUrl: '',
            tag: 'Хирургиялық ем',
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 'cat-2',
    title: 'Кардиология',
    tag: 'Терапия',
    children: [
      {
        id: 'sec-2',
        title: 'Гипертониялық криз',
        content: 'АҚҚ күрт жоғарылауымен (систолалық >180, диастолалық >120 мм сын.бағ.) жүретін шұғыл жағдай.',
        imageUrl: '',
        tag: 'Шұғыл көмек',
        children: []
      }
    ]
  }
];

export default function App() {
  const [library, setLibrary] = useState(() => {
    const saved = localStorage.getItem('medstudy_library_v4');
    return saved ? JSON.parse(saved) : INITIAL_LIBRARY;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [editingSection, setEditingSection] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTag, setEditTag] = useState('');

  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    localStorage.setItem('medstudy_library_v4', JSON.stringify(library));
  }, [library]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === '202306') {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const updateTree = (list, updated) => {
    return list.map(item => {
      if (item.id === updated.id) return updated;
      if (item.children && item.children.length > 0) {
        return { ...item, children: updateTree(item.children, updated) };
      }
      return item;
    });
  };

  const addChildToTree = (list, parentId, newChild) => {
    return list.map(item => {
      if (item.id === parentId) {
        return { ...item, children: [...(item.children || []), newChild] };
      }
      if (item.children && item.children.length > 0) {
        return { ...item, children: addChildToTree(item.children, parentId, newChild) };
      }
      return item;
    });
  };

  const deleteFromTree = (list, id) => {
    return list
      .filter(item => item.id !== id)
      .map(item => {
        if (item.children && item.children.length > 0) {
          return { ...item, children: deleteFromTree(item.children, id) };
        }
        return item;
      });
  };

  const handleSaveEdit = () => {
    if (!editingSection) return;
    const updated = {
      ...editingSection,
      title: editTitle,
      content: editContent,
      imageUrl: editImageUrl,
      tag: editTag
    };
    setLibrary(prev => updateTree(prev, updated));
    setEditingSection(null);
  };

  const handleAddCategory = () => {
    const newCat = {
      id: 'cat-' + Date.now(),
      title: 'Жаңа Категория',
      tag: 'Бөлім',
      children: []
    };
    setLibrary([newCat, ...library]);
    startEditing(newCat);
  };

  const handleAddChild = (parentId) => {
    const newChild = {
      id: 'sec-' + Date.now(),
      title: 'Жаңа конспект / бөлімше',
      content: 'Мәтінді осында жазыңыз...',
      imageUrl: '',
      tag: 'Анықтама',
      children: []
    };
    setLibrary(prev => addChildToTree(prev, parentId, newChild));
    setExpanded(prev => ({ ...prev, [parentId]: true }));
    startEditing(newChild);
  };

  const handleDelete = (id) => {
    if (confirm('Осы бөлімді өшіруге сенімдісіз бе?')) {
      setLibrary(prev => deleteFromTree(prev, id));
      if (editingSection && editingSection.id === id) setEditingSection(null);
    }
  };

  const startEditing = (sec) => {
    setEditingSection(sec);
    setEditTitle(sec.title);
    setEditContent(sec.content || '');
    setEditImageUrl(sec.imageUrl || '');
    setEditTag(sec.tag || '');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `medstudy_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    a.remove();
  };

  const importJSON = (e) => {
    const reader = new FileReader();
    if (e.target.files[0]) {
      reader.readAsText(e.target.files[0], "UTF-8");
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          setLibrary(parsed);
          alert('Деректер сәтті жүктелді!');
        } catch (err) {
          alert('Қате JSON файлы!');
        }
      };
    }
  };

  const renderTree = (items, level = 0) => {
    return items.map((item) => {
      const isExpanded = expanded[item.id];
      const hasChildren = item.children && item.children.length > 0;
      const isRoot = level === 0;

      return (
        <div key={item.id} className={`transition-all ${isRoot ? 'mb-3' : 'ml-4 md:ml-6 my-2 border-l border-slate-200 pl-3'}`}>
          <div className={`group flex items-center justify-between p-3.5 rounded-xl border transition duration-200 ${
            isRoot 
              ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' 
              : 'bg-slate-50/80 border-slate-200/60 hover:bg-white'
          }`}>
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleExpand(item.id)}>
              <button className="text-slate-400 hover:text-slate-600">
                {hasChildren ? (
                  isExpanded ? <ChevronDown className="w-4 h-4 text-slate-700" /> : <ChevronRight className="w-4 h-4 text-slate-500" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isRoot ? (
                isExpanded ? <FolderOpen className="w-5 h-5 text-blue-600" /> : <Folder className="w-5 h-5 text-blue-600" />
              ) : null}

              <span className={`font-semibold tracking-tight ${isRoot ? 'text-slate-900 text-base' : 'text-slate-800 text-sm'}`}>
                {item.title}
              </span>

              {item.tag && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {item.tag}
                </span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                <button 
                  onClick={() => handleAddChild(item.id)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  title="Бөлімше қосу"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => startEditing(item)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                  title="Өңдеу"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                  title="Жою"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {isExpanded && (
            <div className="mt-1">
              {item.content && (
                <div className="ml-7 my-2 p-4 bg-white border border-slate-200/80 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-line shadow-xs">
                  {item.content}
                  {item.imageUrl && (
                    <div className="mt-3">
                      <div 
                        onClick={() => setPreviewImg(item.imageUrl)}
                        className="relative group w-44 h-28 rounded-lg overflow-hidden border border-slate-200 cursor-pointer bg-slate-100"
                      >
                        <img src={item.imageUrl} alt="Attachment" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs gap-1 font-medium">
                          <ExternalLink className="w-3.5 h-3.5" /> Қарау
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasChildren && renderTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const filterTree = (list, query) => {
    return list.reduce((acc, item) => {
      const matchTitle = item.title.toLowerCase().includes(query.toLowerCase());
      const matchContent = (item.content || '').toLowerCase().includes(query.toLowerCase());
      const filteredChildren = item.children ? filterTree(item.children, query) : [];

      if (matchTitle || matchContent || filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const displayedLibrary = searchTerm ? filterTree(library, searchTerm) : library;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col font-sans antialiased">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 text-white p-2 rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">MedStudy</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Іздеу..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl pl-9 pr-3 py-1.5 text-sm w-48 transition focus:outline-none"
              />
            </div>

            <button 
              onClick={exportJSON}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 font-medium transition shadow-xs"
              title="Сақтық көшірме жүктеу"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Экспорт
            </button>

            <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 font-medium transition cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5 text-slate-500" /> Импорт
              <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            </label>

            {isAdmin ? (
              <>
                <button 
                  onClick={handleAddCategory}
                  className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl font-medium transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Категория
                </button>
                <button 
                  onClick={() => setIsAdmin(false)}
                  className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200/60"
                  title="Шығу"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowPinModal(true)}
                className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
                title="Редакциялау"
              >
                <Unlock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto p-4 md:p-8 flex-1">
        {displayedLibrary.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-slate-400 text-sm">Конспектілер табылмады.</p>
          </div>
        ) : (
          renderTree(displayedLibrary)
        )}
      </main>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xs w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Админ пароль</h3>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input 
                type="password" 
                placeholder="PIN" 
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:border-slate-400"
                autoFocus
              />
              {pinError && <p className="text-xs text-rose-500 text-center">Қате PIN код!</p>}
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition">
                Кіру
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Бөлімді өңдеу</h3>
              <button onClick={() => setEditingSection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Тақырыбы</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Тег / Категория</label>
                <input 
                  type="text" 
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Мазмұны</label>
                <textarea 
                  rows="5"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Сурет (Файл жүктеу)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl cursor-pointer transition">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" /> Таңдау
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {editImageUrl && (
                    <button onClick={() => setEditImageUrl('')} className="text-xs text-rose-500 hover:underline">
                      Өшіру
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingSection(null)} className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition">
                Болдырмау
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Сақтау
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button onClick={() => setPreviewImg(null)} className="absolute top-4 right-4 text-white bg-slate-800/80 p-2 rounded-full hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
          <img src={previewImg} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}