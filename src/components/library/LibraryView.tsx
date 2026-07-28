import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { Book, BookNote, BookStatus } from '../../types';
import {
  BookOpen, Plus, Bookmark, Star, Calendar, FileText,
  Clock, CheckCircle2, ChevronRight, Edit3, Trash2, Tag, Quote
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const {
    books,
    readingLogs,
    bookNotes,
    addBook,
    updateBookProgress,
    updateBookStatus,
    addBookNote
  } = useLifeOS();

  const [activeTabStatus, setActiveTabStatus] = useState<BookStatus | 'all'>('reading');
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');

  // Add Book Modal
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPages, setBookPages] = useState('300');
  const [bookCategory, setBookCategory] = useState('Desarrollo Personal');
  const [bookCoverUrl, setBookCoverUrl] = useState('');

  // Add Note Modal
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteQuote, setNoteQuote] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePage, setNotePage] = useState('');

  const selectedBook = books.find((b) => b.id === selectedBookId) || books[0];

  const filteredBooks = books.filter((b) => {
    if (activeTabStatus === 'all') return true;
    return b.status === activeTabStatus;
  });

  // Calculate Reading Velocity (Pages / Day average)
  const totalPagesRead = readingLogs.reduce((sum, l) => sum + l.pagesRead, 0);
  const logDaysCount = new Set(readingLogs.map((l) => l.date)).size || 1;
  const avgPagesPerDay = Math.round(totalPagesRead / logDaysCount);

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    addBook({
      title: bookTitle,
      author: bookAuthor || 'Autor Desconocido',
      totalPages: parseInt(bookPages, 10) || 300,
      currentPage: 0,
      status: 'reading',
      category: bookCategory,
      coverUrl: bookCoverUrl || undefined,
    });

    setBookTitle('');
    setBookAuthor('');
    setIsAddingBook(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !selectedBook) return;

    addBookNote({
      bookId: selectedBook.id,
      title: noteTitle,
      quote: noteQuote,
      content: noteContent,
      pageNumber: parseInt(notePage, 10) || undefined,
    });

    setNoteTitle('');
    setNoteQuote('');
    setNoteContent('');
    setIsAddingNote(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Biblioteca & Diario de Lectura</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Seguimiento de ritmo de lectura y fichas de notas estilo Notion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Velocity Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Ritmo: ~{avgPagesPerDay} págs/día</span>
          </div>

          <button
            onClick={() => setIsAddingBook(!isAddingBook)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Libro</span>
          </button>
        </div>
      </div>

      {/* Book Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'reading', label: 'Leyendo Ahora' },
          { id: 'want_to_read', label: 'Por Leer' },
          { id: 'completed', label: 'Completados' },
          { id: 'all', label: 'Todos los Libros' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabStatus(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl border font-bold transition-all ${
              activeTabStatus === tab.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Book Modal */}
      {isAddingBook && (
        <form onSubmit={handleCreateBook} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agregar Nuevo Libro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Título del libro"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Autor(es)"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Total páginas"
              value={bookPages}
              onChange={(e) => setBookPages(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Categoría"
              value={bookCategory}
              onChange={(e) => setBookCategory(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <input
              type="url"
              placeholder="URL Portada de Imagen (Opcional)"
              value={bookCoverUrl}
              onChange={(e) => setBookCoverUrl(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingBook(false)}
              className="px-4 py-2 text-xs text-slate-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
            >
              Guardar Libro
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Books Shelf + Selected Book Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookshelf List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Estante de Libros ({filteredBooks.length})</h2>

          <div className="space-y-3">
            {filteredBooks.map((b) => {
              const isSelected = b.id === selectedBook?.id;
              const pct = Math.round((b.currentPage / b.totalPages) * 100);

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookId(b.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                  }`}
                >
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      className="w-12 h-16 object-cover rounded-xl shadow border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-xl bg-purple-900 text-purple-200 flex items-center justify-center font-bold">
                      <Bookmark className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{b.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{b.author}</p>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{pct}% ({b.currentPage}/{b.totalPages} pág)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Book Workspace (Progress Tracker & Notion-style Notes) */}
        {selectedBook && (
          <div className="lg:col-span-2 space-y-6">
            {/* Book Detail Banner */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {selectedBook.category || 'Lectura'}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedBook.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedBook.author}</p>
                </div>

                {/* Status Switcher */}
                <select
                  value={selectedBook.status}
                  onChange={(e) => updateBookStatus(selectedBook.id, e.target.value as BookStatus)}
                  className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="reading">Leyendo</option>
                  <option value="want_to_read">Por Leer</option>
                  <option value="completed">Completado</option>
                  <option value="abandoned">Abandonado</option>
                </select>
              </div>

              {/* Page Increments */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Progreso actual: {selectedBook.currentPage} / {selectedBook.totalPages} páginas
                </span>

                <div className="flex items-center gap-2">
                  {[+10, +25, +50].map((p) => (
                    <button
                      key={p}
                      onClick={() => updateBookProgress(selectedBook.id, selectedBook.currentPage + p)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                    >
                      +{p} págs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Book Notes Section (Notion Style) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fichas de Notas & Citas Key</h3>
                </div>
                <button
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Nota</span>
                </button>
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <form onSubmit={handleCreateNote} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <input
                    type="text"
                    placeholder="Título de la nota (Ej: Las 4 Leyes)"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Cita textual destacada (Opcional)"
                    value={noteQuote}
                    onChange={(e) => setNoteQuote(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 italic"
                  />
                  <textarea
                    placeholder="Resumen o puntos clave en Markdown..."
                    rows={4}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1 text-xs text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg"
                    >
                      Guardar Nota
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              <div className="space-y-3">
                {bookNotes
                  .filter((n) => n.bookId === selectedBook.id)
                  .map((note) => (
                    <div key={note.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{note.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{note.createdAt}</span>
                      </h4>

                      {note.quote && (
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border-l-4 border-purple-500 text-purple-900 dark:text-purple-200 text-xs italic flex items-start gap-2">
                          <Quote className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <span>"{note.quote}"</span>
                        </div>
                      )}

                      <pre className="text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
