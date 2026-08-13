import React, { useMemo, useState } from 'react';
import { BookOpen, Clock, Play, Plus, Square } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { isDemoBook } from '../../lib/demoData';
import { OperationalModeHeader, FullModeBackButton } from '../common/OperationalModeHeader';
import { LibraryView } from './LibraryView';

export const LibraryOperationalView: React.FC = () => {
  const {
    books,
    readingLogs,
    readingGroups,
    readingSessions,
    updateBookProgress,
    startReadingSession,
    endReadingSession,
  } = useLifeOS();
  const [fullMode, setFullMode] = useState(false);

  const realBooks = useMemo(() => books.filter((book) => !isDemoBook(book)), [books]);
  const activeBook = realBooks.find((book) => book.status === 'reading');
  const demoCount = books.length - realBooks.length;
  const activeSession = readingSessions.find((session) => !session.endTime && (!activeBook || session.bookId === activeBook.id));
  const recentLogs = useMemo(() => [...readingLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [readingLogs]);
  const totalPages = readingLogs.reduce((sum, log) => sum + log.pagesRead, 0);

  if (fullMode) {
    return (
      <div>
        <FullModeBackButton onBack={() => setFullMode(false)} label="modo operativo" />
        <LibraryView />
      </div>
    );
  }

  const addPages = (amount: number) => {
    if (!activeBook) return;
    updateBookProgress(activeBook.id, Math.min(activeBook.totalPages, activeBook.currentPage + amount));
  };

  const progress = activeBook?.totalPages ? Math.round((activeBook.currentPage / activeBook.totalPages) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <OperationalModeHeader
        eyebrow="Biblioteca"
        title="Lectura activa"
        description="Libro activo, avance y sesión actual."
        icon={<BookOpen className="h-5 w-5" />}
        onOpenFull={() => setFullMode(true)}
        action={(
          <button
            type="button"
            onClick={() => setFullMode(true)}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950"
          >
            <Plus className="h-4 w-4" /> Libro / nota
          </button>
        )}
      />

      {demoCount > 0 && (
        <section className="rounded-2xl border border-amber-800/70 bg-amber-950/20 px-3 py-2.5 text-xs text-amber-200">
          <span className="font-black">Contenido demo oculto.</span> El libro seed no se usa como lectura activa.
        </section>
      )}

      {activeBook ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex gap-4">
            {activeBook.coverUrl ? (
              <img src={activeBook.coverUrl} alt={activeBook.title} className="h-24 w-16 shrink-0 rounded-xl object-cover shadow" />
            ) : (
              <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-xl bg-purple-950 text-purple-200">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">Leyendo ahora</p>
              <h2 className="mt-1 line-clamp-2 text-lg font-black text-slate-950 dark:text-white">{activeBook.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{activeBook.author}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Pág. {activeBook.currentPage}/{activeBook.totalPages}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-purple-600" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[10, 20, 30].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => addPages(amount)}
                className="min-h-9 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-black text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
              >
                +{amount} págs
              </button>
            ))}
          </div>

          <div className="mt-3">
            {activeSession ? (
              <button
                type="button"
                onClick={() => endReadingSession(activeSession.id)}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white"
              >
                <Square className="h-4 w-4" /> Terminar sesión activa
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startReadingSession(activeBook.id)}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white dark:bg-emerald-500 dark:text-slate-950"
              >
                <Play className="h-4 w-4" /> Iniciar sesión de lectura
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen className="mx-auto h-7 w-7 text-purple-500" />
          <h2 className="mt-2 text-sm font-black text-slate-900 dark:text-white">Sin lectura activa real</h2>
          <p className="mt-1 text-xs text-slate-500">Elige o agrega un libro real antes de registrar avance.</p>
          <button type="button" onClick={() => setFullMode(true)} className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white">Abrir biblioteca</button>
        </section>
      )}

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400">Páginas</p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{totalPages}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400">Sesiones</p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{readingSessions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400">Grupos</p>
          <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{readingGroups.length}</p>
        </div>
      </section>

      {recentLogs.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-purple-500" /><h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Lecturas recientes</h2></div>
          <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                <span className="text-slate-500">{log.date}</span>
                <span className="font-black text-slate-900 dark:text-white">+{log.pagesRead} págs</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
