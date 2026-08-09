import React, { useMemo, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { BookStatus, ReadingGroup } from '../../types';
import {
  Activity,
  BookOpen,
  Bookmark,
  CalendarDays,
  Clock,
  FileText,
  Play,
  Plus,
  Quote,
  Square,
  Target,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

type LibrarySection = 'books' | 'groups' | 'sessions';
type GroupCadence = ReadingGroup['schedule']['type'];

export const LibraryView: React.FC = () => {
  const {
    books,
    readingLogs,
    bookNotes,
    readingGroups,
    readingSessions,
    currentUser,
    addBook,
    updateBookProgress,
    updateBookStatus,
    addBookNote,
    createReadingGroup,
    deleteReadingGroup,
    updateReadingGroupProgress,
    startReadingSession,
    endReadingSession,
    updateReadingSession,
  } = useLifeOS();

  const [section, setSection] = useState<LibrarySection>('books');
  const [activeTabStatus, setActiveTabStatus] = useState<BookStatus | 'all'>('reading');
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');

  const [isAddingBook, setIsAddingBook] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPages, setBookPages] = useState('300');
  const [bookCategory, setBookCategory] = useState('Desarrollo Personal');
  const [bookCoverUrl, setBookCoverUrl] = useState('');

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteQuote, setNoteQuote] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePage, setNotePage] = useState('');

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupBookId, setGroupBookId] = useState<string>(books[0]?.id || '');
  const [groupTargetPage, setGroupTargetPage] = useState('');
  const [groupCadence, setGroupCadence] = useState<GroupCadence>('weekly');

  const [isStartingSession, setIsStartingSession] = useState(false);
  const [sessionBookId, setSessionBookId] = useState<string>(books.find((book) => book.status === 'reading')?.id || books[0]?.id || '');
  const [sessionGroupId, setSessionGroupId] = useState('');

  const selectedBook = books.find((book) => book.id === selectedBookId) || books[0];
  const filteredBooks = books.filter((book) => activeTabStatus === 'all' || book.status === activeTabStatus);
  const activeSessions = readingSessions.filter((session) => !session.endTime);
  const completedSessions = readingSessions.filter((session) => Boolean(session.endTime));

  const totalPagesRead = readingLogs.reduce((sum, log) => sum + log.pagesRead, 0);
  const logDaysCount = new Set(readingLogs.map((log) => log.date)).size || 1;
  const avgPagesPerDay = Math.round(totalPagesRead / logDaysCount);

  const sessionGroupOptions = useMemo(
    () => readingGroups.filter((group) => !sessionBookId || group.bookId === sessionBookId),
    [readingGroups, sessionBookId],
  );

  const bookName = (bookId: string) => books.find((book) => book.id === bookId)?.title || 'Libro no disponible';
  const groupNameFor = (groupId?: string) =>
    groupId ? readingGroups.find((group) => group.id === groupId)?.name || 'Grupo no disponible' : 'Lectura individual';

  const handleCreateBook = (event: React.FormEvent) => {
    event.preventDefault();
    if (!bookTitle.trim()) return;

    addBook({
      title: bookTitle.trim(),
      author: bookAuthor.trim() || 'Autor Desconocido',
      totalPages: Math.max(1, parseInt(bookPages, 10) || 300),
      currentPage: 0,
      status: 'reading',
      category: bookCategory.trim() || 'Lectura',
      coverUrl: bookCoverUrl.trim() || undefined,
    });

    setBookTitle('');
    setBookAuthor('');
    setBookCoverUrl('');
    setIsAddingBook(false);
  };

  const handleCreateNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteTitle.trim() || !selectedBook) return;

    addBookNote({
      bookId: selectedBook.id,
      title: noteTitle.trim(),
      quote: noteQuote.trim() || undefined,
      content: noteContent.trim(),
      pageNumber: parseInt(notePage, 10) || undefined,
    });

    setNoteTitle('');
    setNoteQuote('');
    setNoteContent('');
    setNotePage('');
    setIsAddingNote(false);
  };

  const handleCreateGroup = (event: React.FormEvent) => {
    event.preventDefault();
    const linkedBook = books.find((book) => book.id === groupBookId);
    if (!groupName.trim() || !linkedBook) return;

    const ownerId = currentUser?.uid || 'local';
    const targetPage = Math.max(
      linkedBook.currentPage + 1,
      Math.min(linkedBook.totalPages, parseInt(groupTargetPage, 10) || linkedBook.totalPages),
    );

    createReadingGroup({
      name: groupName.trim(),
      description: groupDescription.trim(),
      bookId: linkedBook.id,
      ownerId,
      memberIds: [ownerId],
      schedule: { type: groupCadence },
      status: 'active',
      currentPage: linkedBook.currentPage,
      targetPage,
      membersCount: 1,
    });

    setGroupName('');
    setGroupDescription('');
    setGroupTargetPage('');
    setIsAddingGroup(false);
  };

  const handleStartSession = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!sessionBookId) return;
    startReadingSession(sessionBookId, sessionGroupId || undefined);
    setIsStartingSession(false);
    setSection('sessions');
  };

  const bumpGroupProgress = (group: ReadingGroup, pages: number) => {
    const nextPage = Math.max(0, Math.min(group.targetPage, group.currentPage + pages));
    const progress = group.targetPage > 0 ? Math.round((nextPage / group.targetPage) * 100) : 0;
    updateReadingGroupProgress(group.id, progress, nextPage);
  };

  const startGroupSession = (group: ReadingGroup) => {
    setSessionBookId(group.bookId);
    setSessionGroupId(group.id);
    startReadingSession(group.bookId, group.id);
    setSection('sessions');
  };

  const sectionButton = (id: LibrarySection, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-black transition-all ${
        section === id
          ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Biblioteca & Lectura</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Libros, notas, grupos y sesiones en un único flujo sincronizado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>~{avgPagesPerDay} págs/día</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Activity className="h-4 w-4" />
              <span>{activeSessions.length} activa{activeSessions.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {sectionButton('books', 'Libros y notas', <BookOpen className="h-4 w-4" />)}
          {sectionButton('groups', `Grupos (${readingGroups.length})`, <Users className="h-4 w-4" />)}
          {sectionButton('sessions', `Sesiones (${readingSessions.length})`, <Clock className="h-4 w-4" />)}
        </div>
      </div>

      {section === 'books' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'reading', label: 'Leyendo ahora' },
                { id: 'want_to_read', label: 'Por leer' },
                { id: 'completed', label: 'Completados' },
                { id: 'all', label: 'Todos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabStatus(tab.id as BookStatus | 'all')}
                  className={`rounded-xl border px-3.5 py-2 font-bold transition-all ${
                    activeTabStatus === tab.id
                      ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsAddingBook((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500"
            >
              <Plus className="h-4 w-4" />
              Nuevo libro
            </button>
          </div>

          {isAddingBook && (
            <form onSubmit={handleCreateBook} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agregar libro</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Título"
                  value={bookTitle}
                  onChange={(event) => setBookTitle(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Autor"
                  value={bookAuthor}
                  onChange={(event) => setBookAuthor(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Páginas"
                  value={bookPages}
                  onChange={(event) => setBookPages(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Categoría"
                  value={bookCategory}
                  onChange={(event) => setBookCategory(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="url"
                  placeholder="URL portada (opcional)"
                  value={bookCoverUrl}
                  onChange={(event) => setBookCoverUrl(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingBook(false)} className="px-4 py-2 text-xs text-slate-500">Cancelar</button>
                <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">Guardar</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Estante ({filteredBooks.length})</h2>
              {filteredBooks.length === 0 && (
                <div className="lifeos-ux-empty rounded-3xl p-7 text-center">
                  <BookOpen className="mx-auto mb-3 h-6 w-6 text-purple-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Sin libros en este estante</h3>
                  <p className="mt-1 text-xs text-slate-500">Cambia el filtro o agrega tu próxima lectura.</p>
                </div>
              )}
              {filteredBooks.map((book) => {
                const isSelected = book.id === selectedBook?.id;
                const pct = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
                return (
                  <button
                    type="button"
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-purple-300 bg-purple-50/90 ring-2 ring-purple-500/20 dark:border-purple-800 dark:bg-purple-950/40'
                        : 'border-slate-200 bg-white hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="h-16 w-12 rounded-xl border border-slate-200 object-cover shadow dark:border-slate-800" />
                    ) : (
                      <div className="flex h-16 w-12 items-center justify-center rounded-xl bg-purple-900 text-purple-200">
                        <Bookmark className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{book.title}</p>
                      <p className="text-[11px] text-slate-500">{book.author}</p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-purple-600" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{pct}% · {book.currentPage}/{book.totalPages}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedBook ? (
              <div className="space-y-6 lg:col-span-2">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="rounded-md bg-purple-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {selectedBook.category || 'Lectura'}
                      </span>
                      <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedBook.title}</h2>
                      <p className="text-xs text-slate-500">{selectedBook.author}</p>
                    </div>
                    <select
                      value={selectedBook.status}
                      onChange={(event) => updateBookStatus(selectedBook.id, event.target.value as BookStatus)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="reading">Leyendo</option>
                      <option value="want_to_read">Por leer</option>
                      <option value="completed">Completado</option>
                      <option value="abandoned">Abandonado</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Página {selectedBook.currentPage} de {selectedBook.totalPages}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[10, 25, 50].map((pages) => (
                        <button
                          type="button"
                          key={pages}
                          onClick={() => updateBookProgress(selectedBook.id, Math.min(selectedBook.totalPages, selectedBook.currentPage + pages))}
                          className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                        >
                          +{pages} págs
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSessionBookId(selectedBook.id);
                          setSessionGroupId('');
                          setIsStartingSession(true);
                          setSection('sessions');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 px-3 py-1.5 text-xs font-bold text-purple-700 dark:border-purple-800 dark:text-purple-300"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Iniciar sesión
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notas y citas</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingNote((value) => !value)}
                      className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva nota
                    </button>
                  </div>

                  {isAddingNote && (
                    <form onSubmit={handleCreateNote} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <input
                        type="text"
                        placeholder="Título de la nota"
                        value={noteTitle}
                        onChange={(event) => setNoteTitle(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        required
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
                        <input
                          type="text"
                          placeholder="Cita destacada (opcional)"
                          value={noteQuote}
                          onChange={(event) => setNoteQuote(event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white p-2 text-xs italic dark:border-slate-700 dark:bg-slate-900"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Página"
                          value={notePage}
                          onChange={(event) => setNotePage(event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <textarea
                        placeholder="Resumen o puntos clave..."
                        rows={4}
                        value={noteContent}
                        onChange={(event) => setNoteContent(event.target.value)}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAddingNote(false)} className="px-3 py-1 text-xs text-slate-500">Cancelar</button>
                        <button type="submit" className="rounded-lg bg-purple-600 px-4 py-1 text-xs font-bold text-white">Guardar</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {bookNotes.filter((note) => note.bookId === selectedBook.id).length === 0 && (
                      <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-800/50">Aún no hay notas para este libro.</p>
                    )}
                    {bookNotes
                      .filter((note) => note.bookId === selectedBook.id)
                      .map((note) => (
                        <div key={note.id} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-800/40">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{note.title}</h4>
                            <span className="text-[10px] text-slate-400">{note.pageNumber ? `p. ${note.pageNumber} · ` : ''}{note.createdAt}</span>
                          </div>
                          {note.quote && (
                            <div className="flex items-start gap-2 rounded-xl border-l-4 border-purple-500 bg-purple-50 p-2.5 text-xs italic text-purple-900 dark:bg-purple-950/60 dark:text-purple-200">
                              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                              <span>“{note.quote}”</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">{note.content}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 lg:col-span-2 dark:border-slate-700">
                Agrega un libro para comenzar tu diario de lectura.
              </div>
            )}
          </div>
        </>
      )}

      {section === 'groups' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Grupos de lectura</h2>
              <p className="text-xs text-slate-500">Seguimiento compartido por libro, meta de páginas y cadencia.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGroupBookId(groupBookId || books[0]?.id || '');
                setIsAddingGroup((value) => !value);
              }}
              disabled={books.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Nuevo grupo
            </button>
          </div>

          {isAddingGroup && (
            <form onSubmit={handleCreateGroup} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Nombre del grupo"
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  required
                />
                <select
                  value={groupBookId}
                  onChange={(event) => setGroupBookId(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  required
                >
                  <option value="">Selecciona un libro</option>
                  {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                </select>
              </div>
              <textarea
                value={groupDescription}
                onChange={(event) => setGroupDescription(event.target.value)}
                placeholder="Objetivo o descripción"
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={groupCadence}
                  onChange={(event) => setGroupCadence(event.target.value as GroupCadence)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Cada dos semanas</option>
                  <option value="monthly">Mensual</option>
                  <option value="custom">Personalizada</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={groupTargetPage}
                  onChange={(event) => setGroupTargetPage(event.target.value)}
                  placeholder="Página objetivo (por defecto: final)"
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingGroup(false)} className="px-4 py-2 text-xs text-slate-500">Cancelar</button>
                <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">Crear grupo</button>
              </div>
            </form>
          )}

          {readingGroups.length === 0 ? (
            <div className="lifeos-ux-empty rounded-3xl p-8 text-center">
              <Users className="mx-auto mb-3 h-7 w-7 text-purple-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Todavía no hay grupos</h3>
              <p className="mt-1 text-xs text-slate-500">Crea uno para coordinar una lectura y registrar sesiones asociadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {readingGroups.map((group) => {
                const linkedBook = books.find((book) => book.id === group.bookId);
                const pct = Math.max(0, Math.min(100, group.progress));
                return (
                  <div key={group.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{group.name}</h3>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:bg-purple-950 dark:text-purple-300">{group.status}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-300">{linkedBook?.title || 'Libro no disponible'}</p>
                        {group.description && <p className="mt-2 text-xs text-slate-500">{group.description}</p>}
                      </div>
                      <button type="button" onClick={() => deleteReadingGroup(group.id)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label={`Eliminar ${group.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Página {group.currentPage} / {group.targetPage}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-purple-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 sm:grid-cols-3">
                      <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"><UserRound className="h-3.5 w-3.5" />{group.membersCount} miembro{group.membersCount === 1 ? '' : 's'}</div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"><CalendarDays className="h-3.5 w-3.5" />{group.schedule.type}</div>
                      <div className="col-span-2 flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 sm:col-span-1 dark:bg-slate-800/60"><Target className="h-3.5 w-3.5" />Meta {group.targetPage}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[10, 25].map((pages) => (
                        <button key={pages} type="button" onClick={() => bumpGroupProgress(group, pages)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">+{pages} págs</button>
                      ))}
                      <button type="button" onClick={() => startGroupSession(group)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white">
                        <Play className="h-3.5 w-3.5" />
                        Iniciar sesión
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {section === 'sessions' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Sesiones de lectura</h2>
              <p className="text-xs text-slate-500">Cronometra lectura individual o asociada a un grupo y registra páginas.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsStartingSession((value) => !value)}
              disabled={books.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Iniciar sesión
            </button>
          </div>

          {isStartingSession && (
            <form onSubmit={handleStartSession} className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] dark:border-slate-800 dark:bg-slate-900">
              <select
                value={sessionBookId}
                onChange={(event) => {
                  setSessionBookId(event.target.value);
                  setSessionGroupId('');
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                required
              >
                <option value="">Selecciona un libro</option>
                {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
              </select>
              <select
                value={sessionGroupId}
                onChange={(event) => setSessionGroupId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Lectura individual</option>
                {sessionGroupOptions.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
              <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">Comenzar</button>
            </form>
          )}

          {activeSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">En curso</h3>
              {activeSessions.map((session) => (
                <div key={session.id} className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{bookName(session.bookId)}</h4>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{groupNameFor(session.groupId)} · comenzó {session.startTime}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">{session.pagesRead} páginas registradas</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateReadingSession(session.id, { pagesRead: session.pagesRead + 5 })} className="rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">+5 págs</button>
                    <button type="button" onClick={() => updateReadingSession(session.id, { pagesRead: session.pagesRead + 10 })} className="rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">+10 págs</button>
                    <button type="button" onClick={() => endReadingSession(session.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                      <Square className="h-3.5 w-3.5" />Finalizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Historial</h3>
            {completedSessions.length === 0 ? (
              <div className="lifeos-ux-empty rounded-3xl p-8 text-center">
                <Clock className="mx-auto mb-3 h-7 w-7 text-purple-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Aún no hay sesiones finalizadas</h3>
                <p className="mt-1 text-xs text-slate-500">Inicia una sesión para medir tiempo y páginas de lectura.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {completedSessions.map((session) => (
                  <div key={session.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{bookName(session.bookId)}</h4>
                        <p className="mt-1 text-[11px] text-slate-500">{groupNameFor(session.groupId)}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{session.date}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"><p className="text-[10px] text-slate-400">Duración</p><p className="text-xs font-black text-slate-800 dark:text-white">{session.duration} min</p></div>
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"><p className="text-[10px] text-slate-400">Páginas</p><p className="text-xs font-black text-slate-800 dark:text-white">{session.pagesRead}</p></div>
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"><p className="text-[10px] text-slate-400">Horario</p><p className="text-xs font-black text-slate-800 dark:text-white">{session.startTime}–{session.endTime}</p></div>
                    </div>
                    {session.notes && <p className="mt-3 text-xs text-slate-500">{session.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
