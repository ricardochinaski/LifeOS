import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  Dumbbell,
  Flame,
  Mic,
  MicOff,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { addDaysToDateOnly, todayLocalDate } from '../../lib/dateOnly';
import { habitAppliesToday, parseCaptureAmount, workoutLocationForPhase } from '../../lib/captureUtils';
import { getRealAccounts, getRealReadingBooks } from '../../lib/realData';
import type { Priority, WorkoutType } from '../../types';

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

export const QuickCaptureModalV2: React.FC = () => {
  const {
    isQuickCaptureOpen,
    closeQuickCapture,
    parseQuickCapture,
    addTask,
    addTransaction,
    addHabit,
    logHabit,
    addWorkoutLog,
    updateBookProgress,
    showToast,
    habits,
    habitLogs,
    projects,
    accounts,
    books,
    shiftInfo,
    setActiveTab,
  } = useLifeOS();

  const [mode, setMode] = useState<CaptureMode>('home');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('p3');
  const [taskDateMode, setTaskDateMode] = useState<'today' | 'tomorrow' | 'none'>('today');
  const [taskProjectId, setTaskProjectId] = useState('');

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');

  const [habitTitle, setHabitTitle] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [workoutDuration, setWorkoutDuration] = useState('30');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [readingBookId, setReadingBookId] = useState('');
  const [readingPages, setReadingPages] = useState('10');

  const realAccounts = useMemo(() => getRealAccounts(accounts), [accounts]);
  const realReadingBooks = useMemo(() => getRealReadingBooks(books), [books]);
  const selectedAccount = realAccounts.find((account) => account.id === expenseAccountId) || realAccounts[0];
  const selectedBook = realReadingBooks.find((book) => book.id === readingBookId) || realReadingBooks[0];

  const today = todayLocalDate();
  const weekday = new Date().getDay();
  const applicableHabits = useMemo(
    () => habits.filter((habit) => habitAppliesToday(habit, shiftInfo.phase, weekday)),
    [habits, shiftInfo.phase, weekday],
  );

  if (!isQuickCaptureOpen) return null;

  const resetAndClose = () => {
    setMode('home');
    setLastResult(null);
    setInputText('');
    setTaskTitle('');
    setTaskProjectId('');
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseAccountId('');
    setHabitTitle('');
    setWorkoutNotes('');
    setReadingBookId('');
    setReadingPages('10');
    closeQuickCapture();
  };

  const finish = (message: string) => {
    showToast(message);
    setLastResult(message);
    window.setTimeout(resetAndClose, 420);
  };

  const openModule = (tab: 'finances' | 'library') => {
    closeQuickCapture();
    setMode('home');
    setActiveTab(tab);
  };

  const localTime = () => new Date().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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
    if (!selectedBook) {
      setLastResult('Configura una lectura real antes de registrar páginas.');
      return;
    }
    const nextPage = Math.min(selectedBook.totalPages, selectedBook.currentPage + pages);
    const actualPages = Math.max(0, nextPage - selectedBook.currentPage);
    if (actualPages === 0) {
      setLastResult('Ese libro ya no tiene páginas pendientes.');
      return;
    }
    updateBookProgress(selectedBook.id, nextPage, 'Captura rápida');
    finish(`+${actualPages} páginas en “${selectedBook.title}”.`);
  };

  const toggleHabit = (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    const done = habitLogs.some((log) => log.habitId === habitId && log.date === today);
    logHabit(habitId);
    finish(done ? `${habit?.title || 'Hábito'} desmarcado.` : `${habit?.title || 'Hábito'} completado.`);
  };

  const toggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('La captura de voz directa no está disponible en este dispositivo.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-CL';
    recognition.onresult = (event: any) => {
      let current = '';
      for (let index = 0; index < event.results.length; index += 1) current += event.results[index][0].transcript;
      setInputText(current);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const dueDate = taskDateMode === 'today'
      ? today
      : taskDateMode === 'tomorrow'
        ? addDaysToDateOnly(today, 1)
        : undefined;
    const project = taskProjectId ? projects.find((item) => item.id === taskProjectId) : undefined;
    addTask({
      title: taskTitle.trim(),
      status: 'todo',
      priority: taskPriority,
      dueDate,
      projectId: project?.id,
      areaId: project?.areaId,
      subtasks: [],
    });
    finish(`Tarea “${taskTitle.trim()}” creada${project ? ` en ${project.name}` : ''}.`);
  };

  const submitExpense = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseCaptureAmount(expenseAmount);
    if (!selectedAccount) {
      setLastResult('No hay cuentas reales configuradas. Configura Finanzas antes de registrar gastos.');
      return;
    }
    if (!amount) {
      setLastResult('Ingresa un monto válido.');
      return;
    }
    addTransaction({
      accountId: selectedAccount.id,
      type: 'expense',
      amount,
      category: 'Gasto Rápido',
      areaId: 'area_finance',
      description: expenseDescription.trim() || 'Gasto rápido',
      date: today,
    });
    finish(`Gasto ${amount.toLocaleString('es-CL')} CLP registrado en ${selectedAccount.name}.`);
  };

  const submitHabit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!habitTitle.trim()) return;
    addHabit({
      title: habitTitle.trim(),
      areaId: 'area_health',
      color: '#10B981',
      icon: 'Sparkles',
      frequency: 'daily',
      targetValue: 1,
      unit: 'veces',
      shiftContext: 'all',
    });
    finish(`Hábito “${habitTitle.trim()}” creado.`);
  };

  const submitWorkout = (event: React.FormEvent) => {
    event.preventDefault();
    recordWorkout(workoutType, Math.max(1, Number(workoutDuration) || 30), workoutNotes.trim() || undefined);
  };

  const submitReading = (event: React.FormEvent) => {
    event.preventDefault();
    addPages(Math.max(1, Number(readingPages) || 10));
  };

  const submitText = (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    const parsed = parseQuickCapture(text);

    if (parsed.type === 'transaction') {
      const account = realAccounts[0];
      if (!account || !parsed.amount) {
        setLastResult(!account ? 'Configura una cuenta real antes de registrar gastos desde texto.' : 'No pude identificar un monto válido.');
        return;
      }
      addTransaction({
        accountId: account.id,
        type: 'expense',
        amount: parsed.amount,
        category: 'Gasto Rápido',
        areaId: parsed.areaId || 'area_finance',
        description: parsed.title,
        date: today,
      });
      finish(`Gasto registrado en ${account.name}.`);
      return;
    }

    if (parsed.type === 'reading') {
      if (!selectedBook || !parsed.pages) {
        setLastResult(!selectedBook ? 'Configura una lectura real antes de registrar páginas.' : 'No pude identificar cuántas páginas registrar.');
        return;
      }
      addPages(parsed.pages);
      return;
    }

    if (parsed.type === 'habit') {
      addHabit({
        title: parsed.title,
        areaId: parsed.areaId || 'area_health',
        color: '#10B981',
        icon: 'Sparkles',
        frequency: 'daily',
        targetValue: 1,
        unit: 'veces',
      });
      finish(`Hábito “${parsed.title}” creado.`);
      return;
    }

    addTask({
      title: parsed.title,
      status: 'todo',
      priority: parsed.priority || 'p3',
      dueDate: parsed.dueDate,
      areaId: parsed.areaId,
      subtasks: [],
    });
    finish(`Tarea “${parsed.title}” creada.`);
  };

  const panelTitle: Record<CaptureMode, string> = {
    home: 'Captura rápida',
    task: 'Nueva tarea',
    expense: 'Registrar gasto',
    habit: 'Nuevo hábito',
    workout: 'Entrenamiento',
    reading: 'Lectura',
    text: 'Texto libre',
  };

  const modeButton = (id: CaptureMode, label: string, icon: React.ReactNode, className: string) => (
    <button type="button" onClick={() => { setLastResult(null); setMode(id); }} className={`flex min-h-20 flex-col items-start justify-between rounded-2xl border p-3 text-left transition active:scale-[0.98] ${className}`}>
      {icon}<span className="text-xs font-black">{label}</span>
    </button>
  );

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {mode !== 'home' && <button type="button" onClick={() => { setLastResult(null); setMode('home'); }} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></button>}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-slate-950 dark:text-white">{panelTitle[mode]}</h2>
              <p className="truncate text-[10px] text-slate-500">Solo utiliza datos reales cuando necesita contexto.</p>
            </div>
          </div>
          <button type="button" onClick={resetAndClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-4 p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:p-5">
          {mode === 'home' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {modeButton('task', 'Tarea', <CheckSquare className="h-5 w-5" />, 'border-blue-800/50 bg-blue-950/20 text-blue-300')}
                {modeButton('expense', 'Gasto', <Wallet className="h-5 w-5" />, 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300')}
                {modeButton('workout', 'Entreno', <Dumbbell className="h-5 w-5" />, 'border-amber-800/50 bg-amber-950/20 text-amber-300')}
                {modeButton('habit', 'Hábito', <Flame className="h-5 w-5" />, 'border-rose-800/50 bg-rose-950/20 text-rose-300')}
                {modeButton('reading', 'Lectura', <BookOpen className="h-5 w-5" />, 'border-purple-800/50 bg-purple-950/20 text-purple-300')}
                {modeButton('text', 'Texto', <Sparkles className="h-5 w-5" />, 'border-slate-700 bg-slate-800/60 text-slate-200')}
              </div>

              {applicableHabits.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-black text-slate-900 dark:text-white">Hábitos de hoy</h3><span className="text-[10px] text-slate-500">1 toque</span></div>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto">
                    {applicableHabits.slice(0, 5).map((habit) => {
                      const done = habitLogs.some((log) => log.habitId === habit.id && log.date === today);
                      return <button type="button" key={habit.id} onClick={() => toggleHabit(habit.id)} className={`max-w-[11rem] shrink-0 truncate rounded-xl border px-3 py-2 text-xs font-bold ${done ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-200'}`} title={habit.title}>{done ? '✓ ' : ''}{habit.title}</button>;
                    })}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => recordWorkout('strength', 30)} className="rounded-2xl border border-amber-900 bg-amber-950/20 p-3 text-left"><span className="block text-[9px] font-black uppercase text-amber-400">Entreno rápido</span><span className="mt-1 block text-sm font-black text-slate-900 dark:text-white">Fuerza · 30 min</span></button>
                {selectedBook ? (
                  <button type="button" onClick={() => addPages(10)} className="min-w-0 rounded-2xl border border-purple-900 bg-purple-950/20 p-3 text-left"><span className="block text-[9px] font-black uppercase text-purple-400">Lectura rápida</span><span className="mt-1 block truncate text-sm font-black text-slate-900 dark:text-white" title={selectedBook.title}>+10 pág · {selectedBook.title}</span></button>
                ) : (
                  <button type="button" onClick={() => setMode('reading')} className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 p-3 text-left"><span className="block text-[9px] font-black uppercase text-slate-400">Lectura rápida</span><span className="mt-1 block text-sm font-black text-slate-300">Configura una lectura</span></button>
                )}
              </div>
            </>
          )}

          {mode === 'task' && (
            <form onSubmit={submitTask} className="space-y-3">
              <input className={inputClass} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Qué necesitas hacer" autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <select className={inputClass} value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)}><option value="p1">P1 · Crítica</option><option value="p2">P2 · Importante</option><option value="p3">P3 · Normal</option><option value="p4">P4 · Baja</option></select>
                <select className={inputClass} value={taskDateMode} onChange={(e) => setTaskDateMode(e.target.value as typeof taskDateMode)}><option value="today">Hoy</option><option value="tomorrow">Mañana</option><option value="none">Sin fecha</option></select>
              </div>
              <select className={inputClass} value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)}><option value="">Sin proyecto</option>{projects.filter((project) => project.status !== 'completed').map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950">Crear tarea</button>
            </form>
          )}

          {mode === 'expense' && (
            realAccounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-800 bg-amber-950/20 p-5 text-center"><Wallet className="mx-auto h-7 w-7 text-amber-400" /><h3 className="mt-2 text-sm font-black text-white">Sin cuentas reales</h3><p className="mt-1 text-xs text-slate-400">Los seeds financieros no se pueden usar como destino de un gasto.</p><button type="button" onClick={() => openModule('finances')} className="mt-3 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950">Configurar Finanzas</button></div>
            ) : (
              <form onSubmit={submitExpense} className="space-y-3">
                <input className={inputClass} inputMode="decimal" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="Monto" autoFocus />
                <input className={inputClass} value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Descripción" />
                <select className={inputClass} value={selectedAccount?.id || ''} onChange={(e) => setExpenseAccountId(e.target.value)}>{realAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
                <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950">Registrar gasto</button>
              </form>
            )
          )}

          {mode === 'habit' && (
            <form onSubmit={submitHabit} className="space-y-3"><input className={inputClass} value={habitTitle} onChange={(e) => setHabitTitle(e.target.value)} placeholder="Nombre del hábito" autoFocus /><button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950">Crear hábito diario</button></form>
          )}

          {mode === 'workout' && (
            <form onSubmit={submitWorkout} className="space-y-3"><select className={inputClass} value={workoutType} onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}>{Object.entries(workoutLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><input className={inputClass} inputMode="numeric" value={workoutDuration} onChange={(e) => setWorkoutDuration(e.target.value)} placeholder="Duración en minutos" /><textarea className={inputClass} value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} placeholder="Notas opcionales" rows={3} /><button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950">Registrar entrenamiento</button></form>
          )}

          {mode === 'reading' && (
            realReadingBooks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-purple-800 bg-purple-950/20 p-5 text-center"><BookOpen className="mx-auto h-7 w-7 text-purple-400" /><h3 className="mt-2 text-sm font-black text-white">Sin lectura activa real</h3><p className="mt-1 text-xs text-slate-400">El libro de demostración queda fuera de la captura rápida.</p><button type="button" onClick={() => openModule('library')} className="mt-3 rounded-xl bg-purple-500 px-4 py-2 text-xs font-black text-white">Abrir Biblioteca</button></div>
            ) : (
              <form onSubmit={submitReading} className="space-y-3"><select className={inputClass} value={selectedBook?.id || ''} onChange={(e) => setReadingBookId(e.target.value)}>{realReadingBooks.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select><input className={inputClass} inputMode="numeric" value={readingPages} onChange={(e) => setReadingPages(e.target.value)} placeholder="Páginas leídas" /><button className="w-full rounded-xl bg-purple-500 py-3 text-sm font-black text-white">Registrar páginas</button></form>
            )
          )}

          {mode === 'text' && (
            <form onSubmit={submitText} className="space-y-3">
              <div className="relative"><textarea className={`${inputClass} min-h-28 pr-12`} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Ej: Pagar internet viernes 30000" autoFocus /><button type="button" onClick={toggleMic} className={`absolute bottom-2 right-2 rounded-xl p-2 ${isListening ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-200'}`} aria-label="Dictar">{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button></div>
              <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950">Interpretar y guardar</button>
            </form>
          )}

          {lastResult && <p className="rounded-xl border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-xs font-bold text-amber-200">{lastResult}</p>}
        </div>
      </section>
    </div>
  );
};
