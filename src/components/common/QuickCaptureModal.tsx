import React, { useMemo, useRef, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { addDaysToDateOnly, todayLocalDate } from '../../lib/dateOnly';
import { habitAppliesToday, parseCaptureAmount, workoutLocationForPhase } from '../../lib/captureUtils';
import type { Priority, WorkoutType } from '../../types';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  DollarSign,
  Dumbbell,
  Flame,
  Mic,
  MicOff,
  Plus,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';

type CaptureMode = 'home' | 'task' | 'expense' | 'habit' | 'workout' | 'reading' | 'text';

const workoutLabels: Record<WorkoutType, string> = {
  strength: 'Fuerza',
  cardio: 'Cardio',
  hiit: 'HIIT',
  yoga: 'Yoga',
  mobility: 'Movilidad',
  sports: 'Deporte',
  other: 'Otro',
};

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    closeQuickCapture,
    parseQuickCapture,
    executeQuickCapture,
    addTask,
    addTransaction,
    addHabit,
    logHabit,
    addWorkoutLog,
    updateBookProgress,
    startReadingSession,
    endReadingSession,
    showToast,
    habits,
    habitLogs,
    accounts,
    books,
    readingSessions,
    shiftInfo,
  } = useLifeOS();

  const [mode, setMode] = useState<CaptureMode>('home');
  const [inputText, setInputText] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('p3');
  const [taskDateMode, setTaskDateMode] = useState<'today' | 'tomorrow' | 'none'>('today');

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState(accounts[0]?.id || '');

  const [newHabitTitle, setNewHabitTitle] = useState('');

  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [workoutDuration, setWorkoutDuration] = useState('30');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const activeBooks = useMemo(
    () => books.filter((book) => book.status === 'reading'),
    [books],
  );
  const [readingBookId, setReadingBookId] = useState('');

  const today = todayLocalDate();
  const weekday = new Date().getDay();
  const applicableHabits = useMemo(
    () => habits.filter((habit) => habitAppliesToday(habit, shiftInfo.phase, weekday)),
    [habits, shiftInfo.phase, weekday],
  );
  const activeBook = activeBooks.find((book) => book.id === readingBookId) || activeBooks[0];
  const activeSession = readingSessions.find((session) => !session.endTime);

  if (!isQuickCaptureOpen) return null;

  const resetAndClose = () => {
    setMode('home');
    setInputText('');
    setLastResult(null);
    setTaskTitle('');
    setExpenseAmount('');
    setExpenseDescription('');
    setNewHabitTitle('');
    setWorkoutNotes('');
    closeQuickCapture();
  };

  const finish = (message: string) => {
    showToast(message);
    setLastResult(message);
    window.setTimeout(resetAndClose, 450);
  };

  const localTime = () => new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const recordWorkout = (type: WorkoutType, duration: number, notes?: string) => {
    addWorkoutLog({
      date: today,
      time: localTime(),
      type,
      durationMinutes: duration,
      exercises: [],
      notes: notes || 'Captura rápida',
      locationContext: workoutLocationForPhase(shiftInfo.phase),
    });
    finish(`${workoutLabels[type]} · ${duration} min registrado.`);
  };

  const addPages = (pages: number) => {
    const book = activeBook;
    if (!book) return;
    const nextPage = Math.min(book.totalPages, book.currentPage + pages);
    const actualPages = Math.max(0, nextPage - book.currentPage);
    if (actualPages === 0) return;
    updateBookProgress(book.id, nextPage, 'Captura rápida');
    finish(`+${actualPages} páginas en “${book.title}”.`);
  };

  const toggleHabit = (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    const isDone = habitLogs.some((log) => log.habitId === habitId && log.date === today);
    logHabit(habitId);
    finish(isDone ? `${habit?.title || 'Hábito'} desmarcado.` : `${habit?.title || 'Hábito'} completado.`);
  };

  const toggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('La captura de voz directa no está disponible en este navegador.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'es-CL';
    rec.onresult = (event: any) => {
      let current = '';
      for (let index = 0; index < event.results.length; index += 1) current += event.results[index][0].transcript;
      setInputText(current);
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const parsed = parseQuickCapture(inputText);

  const submitText = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim()) return;
    const result = executeQuickCapture(inputText);
    if (result.success) {
      setInputText('');
      finish(result.message);
    } else {
      setLastResult(result.message);
    }
  };

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const dueDate = taskDateMode === 'today'
      ? today
      : taskDateMode === 'tomorrow'
        ? addDaysToDateOnly(today, 1)
        : undefined;
    addTask({
      title: taskTitle.trim(),
      status: 'todo',
      priority: taskPriority,
      dueDate,
      areaId: 'area_work',
      subtasks: [],
    });
    finish(`Tarea “${taskTitle.trim()}” creada.`);
  };

  const submitExpense = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseCaptureAmount(expenseAmount);
    const accountId = expenseAccountId || accounts[0]?.id;
    if (!amount || !accountId) {
      setLastResult(accounts.length === 0 ? 'Configura una cuenta antes de registrar gastos.' : 'Ingresa un monto válido.');
      return;
    }
    addTransaction({
      accountId,
      type: 'expense',
      amount,
      category: 'Gasto Rápido',
      areaId: 'area_finance',
      description: expenseDescription.trim() || 'Gasto rápido',
      date: today,
    });
    finish(`Gasto ${amount.toLocaleString('es-CL')} CLP registrado.`);
  };

  const submitHabit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newHabitTitle.trim()) return;
    addHabit({
      title: newHabitTitle.trim(),
      areaId: 'area_health',
      color: '#10B981',
      icon: 'Sparkles',
      frequency: 'daily',
      targetValue: 1,
      unit: 'veces',
      shiftContext: 'all',
    });
    finish(`Hábito “${newHabitTitle.trim()}” creado.`);
  };

  const submitWorkout = (event: React.FormEvent) => {
    event.preventDefault();
    const duration = Math.max(1, Number(workoutDuration) || 0);
    recordWorkout(workoutType, duration, workoutNotes.trim() || undefined);
  };

  const panelTitle: Record<CaptureMode, string> = {
    home: 'Captura rápida',
    task: 'Nueva tarea',
    expense: 'Registrar gasto',
    habit: 'Hábitos',
    workout: 'Entrenamiento',
    reading: 'Lectura',
    text: 'Texto libre',
  };

  const modeButton = (id: CaptureMode, label: string, icon: React.ReactNode, className: string) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      className={`flex min-h-20 flex-col items-start justify-between rounded-2xl border p-3 text-left transition active:scale-[0.98] ${className}`}
    >
      {icon}
      <span className="text-xs font-black">{label}</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            {mode !== 'home' && (
              <button type="button" onClick={() => setMode('home')} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">{panelTitle[mode]}</h2>
              <p className="text-[11px] text-slate-500">Registra lo importante sin salir de lo que estás haciendo.</p>
            </div>
          </div>
          <button type="button" onClick={resetAndClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          {mode === 'home' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {modeButton('task', 'Tarea', <CheckSquare className="h-5 w-5" />, 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300')}
                {modeButton('expense', 'Gasto', <Wallet className="h-5 w-5" />, 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300')}
                {modeButton('workout', 'Entreno', <Dumbbell className="h-5 w-5" />, 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300')}
                {modeButton('habit', 'Hábito', <Flame className="h-5 w-5" />, 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300')}
                {modeButton('reading', 'Lectura', <BookOpen className="h-5 w-5" />, 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300')}
                {modeButton('text', 'Texto', <Sparkles className="h-5 w-5" />, 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200')}
              </div>

              {applicableHabits.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">Hábitos de hoy</h3>
                    <span className="text-[10px] text-slate-500">1 toque</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {applicableHabits.slice(0, 5).map((habit) => {
                      const done = habitLogs.some((log) => log.habitId === habit.id && log.date === today);
                      return (
                        <button
                          type="button"
                          key={habit.id}
                          onClick={() => toggleHabit(habit.id)}
                          className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold ${done ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                        >
                          {done ? '✓ ' : ''}{habit.title}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => recordWorkout('strength', 30)} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-900 dark:bg-amber-950/30">
                  <span className="block text-[10px] font-bold uppercase text-amber-600">Entreno rápido</span>
                  <span className="mt-1 block text-sm font-black text-slate-900 dark:text-white">Fuerza · 30 min</span>
                </button>
                {activeBook ? (
                  <button type="button" onClick={() => addPages(10)} className="rounded-2xl border border-purple-200 bg-purple-50 p-3 text-left dark:border-purple-900 dark:bg-purple-950/30">
                    <span className="block text-[10px] font-bold uppercase text-purple-600">Lectura rápida</span>
                    <span className="mt-1 block truncate text-sm font-black text-slate-900 dark:text-white">+10 pág · {activeBook.title}</span>
                  </button>
                ) : (
                  <button type="button" onClick={() => setMode('reading')} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-700 dark:bg-slate-800">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Lectura</span>
                    <span className="mt-1 block text-sm font-black text-slate-900 dark:text-white">Elegir libro</span>
                  </button>
                )}
              </section>
            </>
          )}

          {mode === 'task' && (
            <form onSubmit={submitTask} className="space-y-4">
              <input autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="¿Qué necesitas hacer?" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <div className="grid grid-cols-4 gap-2">
                {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map((priority) => (
                  <button type="button" key={priority} onClick={() => setTaskPriority(priority)} className={`rounded-xl border py-2 text-xs font-black uppercase ${taskPriority === priority ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 dark:border-slate-700'}`}>{priority}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([['today', 'Hoy'], ['tomorrow', 'Mañana'], ['none', 'Sin fecha']] as const).map(([value, label]) => (
                  <button type="button" key={value} onClick={() => setTaskDateMode(value)} className={`rounded-xl border py-2 text-xs font-bold ${taskDateMode === value ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-200 dark:border-slate-700'}`}>{label}</button>
                ))}
              </div>
              <button type="submit" disabled={!taskTitle.trim()} className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-black text-white disabled:opacity-40">Crear tarea</button>
            </form>
          )}

          {mode === 'expense' && (
            <form onSubmit={submitExpense} className="space-y-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input autoFocus inputMode="decimal" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="45.000" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 pl-9 text-lg font-black dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <input value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="Descripción (opcional)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <select value={expenseAccountId || accounts[0]?.id || ''} onChange={(event) => setExpenseAccountId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <button type="submit" disabled={accounts.length === 0 || !parseCaptureAmount(expenseAmount)} className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-40">Registrar gasto</button>
            </form>
          )}

          {mode === 'habit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {applicableHabits.map((habit) => {
                  const done = habitLogs.some((log) => log.habitId === habit.id && log.date === today);
                  return (
                    <button type="button" key={habit.id} onClick={() => toggleHabit(habit.id)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-3 text-left dark:border-slate-700">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{habit.title}</p>
                        <p className="text-[11px] text-slate-500">{habit.targetValue} {habit.unit}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{done ? 'Hecho' : 'Marcar'}</span>
                    </button>
                  );
                })}
              </div>
              <form onSubmit={submitHabit} className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <input value={newHabitTitle} onChange={(event) => setNewHabitTitle(event.target.value)} placeholder="Nuevo hábito" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
                <button type="submit" disabled={!newHabitTitle.trim()} className="rounded-xl bg-rose-600 px-4 text-xs font-black text-white disabled:opacity-40">Crear</button>
              </form>
            </div>
          )}

          {mode === 'workout' && (
            <form onSubmit={submitWorkout} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['strength', 'cardio', 'hiit', 'mobility', 'yoga', 'sports'] as WorkoutType[]).map((type) => (
                  <button type="button" key={type} onClick={() => setWorkoutType(type)} className={`rounded-xl border px-2 py-2 text-xs font-bold ${workoutType === type ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-200 dark:border-slate-700'}`}>{workoutLabels[type]}</button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((minutes) => (
                  <button type="button" key={minutes} onClick={() => setWorkoutDuration(String(minutes))} className={`rounded-xl border py-2 text-xs font-black ${Number(workoutDuration) === minutes ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-200 dark:border-slate-700'}`}>{minutes} min</button>
                ))}
              </div>
              <input inputMode="numeric" value={workoutDuration} onChange={(event) => setWorkoutDuration(event.target.value)} placeholder="Duración en minutos" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <textarea rows={2} value={workoutNotes} onChange={(event) => setWorkoutNotes(event.target.value)} placeholder="Notas (opcional)" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <button type="submit" className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-black text-slate-950">Registrar entrenamiento</button>
            </form>
          )}

          {mode === 'reading' && (
            <div className="space-y-4">
              {activeBooks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700">No hay libros con estado “Leyendo”. Agrégalos desde Biblioteca.</div>
              ) : (
                <>
                  <select value={activeBook?.id || ''} onChange={(event) => setReadingBookId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800">
                    {activeBooks.map((book) => <option key={book.id} value={book.id}>{book.title} · {book.currentPage}/{book.totalPages}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 30].map((pages) => <button type="button" key={pages} onClick={() => addPages(pages)} className="rounded-2xl border border-purple-200 bg-purple-50 py-3 text-sm font-black text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-300">+{pages} pág</button>)}
                  </div>
                  {activeSession ? (
                    <button type="button" onClick={() => { endReadingSession(activeSession.id); finish('Sesión de lectura finalizada.'); }} className="w-full rounded-2xl border border-rose-300 bg-rose-50 py-3 text-sm font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">Finalizar sesión activa</button>
                  ) : activeBook ? (
                    <button type="button" onClick={() => { startReadingSession(activeBook.id); finish(`Sesión iniciada · ${activeBook.title}.`); }} className="w-full rounded-2xl bg-purple-600 py-3 text-sm font-black text-white">Iniciar sesión de lectura</button>
                  ) : null}
                </>
              )}
            </div>
          )}

          {mode === 'text' && (
            <form onSubmit={submitText} className="space-y-4">
              <div className="relative">
                <textarea autoFocus rows={4} value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder="Ej: Comprar alimentos $45000 #Finanzas" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 pr-12 text-sm dark:border-slate-700 dark:bg-slate-800" />
                <button type="button" onClick={toggleMic} className={`absolute bottom-3 right-3 rounded-xl p-2 ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              {inputText.trim() && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <span className="font-black capitalize text-emerald-600">{parsed.type}</span>
                  <span className="ml-2 text-slate-600 dark:text-slate-300">{parsed.title}</span>
                  {parsed.amount ? <span className="ml-2 font-bold">${parsed.amount}</span> : null}
                  {parsed.pages ? <span className="ml-2 font-bold">{parsed.pages} pág</span> : null}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['Tarea hoy p1', 'Comprar alimentos $45000 #Finanzas', 'Leer 20 paginas', 'Hábito meditar diario'].map((example) => (
                  <button type="button" key={example} onClick={() => setInputText(example)} className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{example}</button>
                ))}
              </div>
              <button type="submit" disabled={!inputText.trim()} className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-black text-white dark:bg-emerald-500 dark:text-slate-950 disabled:opacity-40">Procesar texto</button>
            </form>
          )}

          {lastResult && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              {lastResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
