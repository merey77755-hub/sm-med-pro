import React from 'react';
import { Search, Sun, Moon } from 'lucide-react';

interface ContentAreaProps {
  currentDisease: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  session: any;
  saveContentToCloud: (subId: string, content: string) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  currentDisease, searchQuery, setSearchQuery, isDarkMode, setIsDarkMode, session, saveContentToCloud
}) => {
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Іздеу..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs outline-none" 
          />
        </div>
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
                currentDisease.sections.map((section: any) => (
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
  );
};