import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Briefcase, CheckSquare, Dumbbell, RefreshCw, Send, Sparkles, User, Wallet, X } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { chatWithAI, parseVoiceCommand } from '../../lib/api';
import { getRealAccounts } from '../../lib/realData';
import { differenceInDateOnlyDays, todayLocalDate } from '../../lib/dateOnly';

const CHAT_STORAGE_KEY = 'lifeos_chat_messages_v3_training';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const localTime = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

export const AICopilotModalV2: React.FC<AICopilotModalProps> = ({ isOpen, onClose }) => {
  const {
    shiftConfig,
    shiftInfo,
    tasks,
    habits,
    accounts,
    workoutLogs,
    showToast,
    addHabit,
    addTask,
    addTransaction,
  } = useLifeOS();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const today = todayLocalDate();

  const realAccounts = useMemo(() => getRealAccounts(accounts), [accounts]);
  const pendingTasksCount = tasks.filter((task) => task.status !== 'completed').length;
  const workouts7 = useMemo(() => workoutLogs.filter((workout) => {
    const diff = differenceInDateOnlyDays(today, workout.date);
    return diff >= 0 && diff <= 6;
  }), [workoutLogs, today]);
  const workoutMinutes7 = workouts7.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const latestWorkout = useMemo(
    () => [...workoutLogs].sort((a, b) => `${b.date}T${b.time || '00:00'}`.localeCompare(`${a.date}T${a.time || '00:00'}`))[0],
    [workoutLogs],
  );

  const suggestedPrompts = useMemo(() => {
    const prompts = [
      'Planifica mis prioridades para el turno',
      'Resume mis tareas pendientes',
      'Resume mis entrenamientos recientes',
      '¿Qué hábitos debería reforzar hoy?',
    ];
    if (realAccounts.length > 0) prompts.push('Resume mis cuentas reales');
    return prompts;
  }, [realAccounts.length]);

  const welcomeMessage = useMemo(() => {
    const trainingLine = workouts7.length
      ? `En los últimos 7 días registraste ${workouts7.length} sesiones y ${workoutMinutes7} minutos de entrenamiento.`
      : 'Aún no hay entrenamientos registrados en los últimos 7 días.';
    const financeLine = realAccounts.length > 0
      ? `Hay ${realAccounts.length} cuenta${realAccounts.length === 1 ? '' : 's'} real${realAccounts.length === 1 ? '' : 'es'} disponible${realAccounts.length === 1 ? '' : 's'} para contexto financiero.`
      : 'No hay cuentas reales configuradas; los seeds financieros quedan fuera del contexto.';
    return `Soy LifeOS Copilot. Conozco tu rotación ${shiftConfig.workDays}x${shiftConfig.restDays}, tus tareas, hábitos y actividad de entrenamiento registrada.\n\n${trainingLine}\n${financeLine}\n\nPuedo consultar, analizar y proponer acciones; cuando una acción cambie LifeOS, mantengo el control explícito en la interacción.`;
  }, [workouts7.length, workoutMinutes7, realAccounts.length, shiftConfig.workDays, shiftConfig.restDays]);

  useEffect(() => {
    if (!isOpen || loadedRef.current) return;
    loadedRef.current = true;
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading Copilot history:', error);
    }
    setMessages([{ id: 'welcome-training', role: 'assistant', content: welcomeMessage, timestamp: localTime() }]);
  }, [isOpen, welcomeMessage]);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleExecuteAction = async (text: string): Promise<string | null> => {
    const result = await parseVoiceCommand({ text });
    if (!result?.intent || result.intent === 'unknown') return null;
    const data = result.data || {};

    if (result.intent === 'habit' && data.habitTitle) {
      addHabit({
        title: data.habitTitle,
        description: 'Creado por LifeOS Copilot',
        areaId: 'area_health',
        color: '#10B981',
        icon: 'Sparkles',
        frequency: 'daily',
        targetValue: data.habitTarget || 1,
        unit: data.habitUnit || 'veces',
      });
      return `Hábito creado: ${data.habitTitle}.`;
    }

    if (result.intent === 'task' && data.taskTitle) {
      addTask({ title: data.taskTitle, status: 'todo', priority: data.priority || 'p2', subtasks: [] });
      return `Tarea creada: ${data.taskTitle}.`;
    }

    if ((result.intent === 'expense' || result.intent === 'income') && data.amount) {
      const account = realAccounts[0];
      if (!account) return 'No hay una cuenta real configurada. Configúrala en Finanzas antes de registrar movimientos desde Copilot.';
      addTransaction({
        accountId: account.id,
        type: result.intent === 'income' ? 'income' : 'expense',
        amount: Number(data.amount),
        category: result.intent === 'income' ? 'Ingreso Copilot' : 'Gasto Copilot',
        areaId: 'area_finance',
        description: data.description || text,
        date: today,
      });
      return `${result.intent === 'income' ? 'Ingreso' : 'Gasto'} registrado en ${account.name}.`;
    }
    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: localTime() };
    setMessages((current) => [...current, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const actionResult = await handleExecuteAction(text);
      if (actionResult) {
        setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: actionResult, timestamp: localTime() }]);
        return;
      }

      const userContext = {
        shiftInfo: {
          workDays: shiftConfig.workDays,
          restDays: shiftConfig.restDays,
          dayInPhase: shiftInfo.dayInPhase,
          phase: shiftInfo.phase,
          locationName: shiftConfig.locationName,
        },
        pendingTasksCount,
        habitsCount: habits.length,
        accountsCount: realAccounts.length,
        training: {
          sessions7d: workouts7.length,
          minutes7d: workoutMinutes7,
          latest: latestWorkout ? {
            date: latestWorkout.date,
            type: latestWorkout.type,
            durationMinutes: latestWorkout.durationMinutes,
            exercisesCount: latestWorkout.exercises.length,
          } : null,
        },
      };

      const data = await chatWithAI({
        messages: [...messages, userMsg].map((message) => ({ role: message.role, content: message.content })),
        userContext,
      });
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.reply || 'No pude generar una respuesta útil con el contexto disponible.', timestamp: localTime() }]);
    } catch (error) {
      console.error('Error in Copilot:', error);
      showToast('No se pudo consultar LifeOS Copilot.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setMessages([{ id: `welcome-${Date.now()}`, role: 'assistant', content: welcomeMessage, timestamp: localTime() }]);
    showToast('Historial del Copilot eliminado.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm sm:items-center sm:p-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <section className="flex h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-700 bg-slate-950 text-white shadow-2xl sm:h-[760px] sm:rounded-[2rem]">
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950"><Bot className="h-5 w-5" /></div><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-base font-black">LifeOS Copilot</h2><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">Contexto real</span></div><p className="truncate text-[10px] text-slate-400">Turno, tareas, hábitos, finanzas y entrenamientos.</p></div></div>
          <div className="flex shrink-0 items-center gap-1.5"><button type="button" onClick={clearChat} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-amber-300" aria-label="Limpiar chat"><RefreshCw className="h-4 w-4" /></button><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar Copilot"><X className="h-5 w-5" /></button></div>
        </header>

        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-slate-800 bg-slate-900/70 px-4 py-2 text-[10px] font-black">
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300"><Briefcase className="h-3 w-3" /> Día {shiftInfo.dayInPhase} · {shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'}</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-300"><Dumbbell className="h-3 w-3" /> {workouts7.length} entrenos · {workoutMinutes7} min</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-300"><CheckSquare className="h-3 w-3" /> {pendingTasksCount} pendientes</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-purple-300"><Wallet className="h-3 w-3" /> {realAccounts.length} cuentas reales</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950 p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${message.role === 'user' ? 'bg-slate-700' : 'bg-emerald-500 text-slate-950'}`}>{message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</div>
              <div className={`max-w-[84%] ${message.role === 'user' ? 'text-right' : ''}`}><div className={`whitespace-pre-wrap rounded-2xl border px-3.5 py-3 text-left text-sm leading-6 ${message.role === 'user' ? 'border-slate-700 bg-slate-800' : 'border-slate-800 bg-slate-900'}`}>{message.content}</div><p className="mt-1 px-1 text-[9px] font-bold text-slate-500">{message.timestamp}</p></div>
            </div>
          ))}
          {isLoading && <div className="flex items-center gap-2.5 text-xs text-slate-400"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950"><Bot className="h-4 w-4" /></div><RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> Analizando contexto disponible…</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-900 p-3">
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">{suggestedPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => handleSendMessage(prompt)} className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-bold text-slate-300 hover:border-emerald-500/40">{prompt}</button>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2"><div className="relative flex-1"><Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" /><input value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} placeholder="Pregunta o pide una acción…" className="w-full rounded-2xl border border-slate-700 bg-slate-800 py-3 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none" /></div><button type="submit" disabled={!inputMessage.trim() || isLoading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 disabled:opacity-40" aria-label="Enviar"><Send className="h-5 w-5" /></button></form>
        </div>
      </section>
    </div>
  );
};