import React, { useState, useRef, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { chatWithAI, parseVoiceCommand } from '../../lib/api';
import { Bot, Send, Sparkles, X, User, RefreshCw, HeartPulse, Briefcase, Wallet, CheckSquare, Zap, Mic } from 'lucide-react';

const CHAT_STORAGE_KEY = 'lifeos_chat_messages';

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

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose }) => {
  const {
    shiftConfig,
    shiftInfo,
    healthProfile,
    healthLogs,
    tasks,
    habits,
    accounts,
    showToast,
    openQuickCapture,
    openVoiceModal,
    addHabit,
    addTask,
  } = useLifeOS();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "¿Cómo están mis niveles de SpO2 y salud?",
    "Planifica mis prioridades para el turno",
    "Resumen de mis gastos y cuentas",
    "¿Qué hábitos debería reforzar hoy?"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  // Load persisted chat on mount
  useEffect(() => {
    if (isOpen && !loadedRef.current) {
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
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
      // Default welcome message if no saved history
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola! Soy **LifeOS Copilot**, tu asistente de Inteligencia Artificial integrado.

Conozco tu rotación de turno **${shiftConfig.workDays}x${shiftConfig.restDays}** (Día ${shiftInfo.dayInPhase} en ${shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'}), tus métricas de altitud (${healthProfile.miningAltitudeMeters} msnm) y el estado de tus tareas y finanzas.

¿En qué te puedo asesorar hoy?

📌 **Puedes pedirme cosas como:**
• *"Crea un hábito de leer 20 min diarios"*
• *"Añade tarea: comprar provisiones"*
• *"Registra gasto de $15000 en combustible"*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [isOpen, shiftConfig, shiftInfo, healthProfile]);

  // Persist messages on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const latestBiometrics = healthLogs.length > 0 ? healthLogs[0] : null;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const handleExecuteAction = (text: string): string | null => {
    const result = parseVoiceCommand({ text });
    if (!result || !result.intent || result.intent === 'unknown') return null;

    const { intent, data } = result;

    if (intent === 'habit' && data.habitTitle) {
      addHabit({
        title: data.habitTitle,
        description: `Creado por LifeOS Copilot`,
        color: '#10B981',
        icon: 'Sparkles',
        frequency: 'daily',
        targetValue: data.habitTarget || 1,
        unit: data.habitUnit || 'veces',
      });
      return `✅ Hábito creado: **${data.habitTitle}**${data.habitTarget ? ` (${data.habitTarget} ${data.habitUnit || 'veces'})` : ''}`;
    }

    if (intent === 'task' && data.taskTitle) {
      addTask({
        title: data.taskTitle,
        status: 'todo',
        priority: data.priority || 'p2',
        areaId: 'area_work',
        subtasks: [],
      });
      return `✅ Tarea creada: **${data.taskTitle}**${data.priority ? ` (${data.priority.toUpperCase()})` : ''}`;
    }

    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Try to execute action from user message
      const actionResult = handleExecuteAction(text);
      if (actionResult) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: actionResult,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsLoading(false);
        return;
      }

      // If not an action, get AI conversational reply
      const userContext = {
        shiftInfo: {
          workDays: shiftConfig.workDays,
          restDays: shiftConfig.restDays,
          dayInPhase: shiftInfo.dayInPhase,
          phase: shiftInfo.phase,
          locationName: shiftConfig.locationName
        },
        healthProfile: {
          miningAltitudeMeters: healthProfile.miningAltitudeMeters,
          dailyWaterTargetMl: healthProfile.dailyWaterTargetMl
        },
        latestBiometrics: latestBiometrics ? {
          spO2Pct: latestBiometrics.spO2Pct,
          bloodPressureSys: latestBiometrics.bloodPressureSys,
          bloodPressureDia: latestBiometrics.bloodPressureDia,
          heartRateBpm: latestBiometrics.heartRateBpm,
          sleepHours: latestBiometrics.sleepHours
        } : null,
        pendingTasksCount,
        habitsCount: habits.length,
        accountsCount: accounts.length
      };

      const data = await chatWithAI({
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        userContext
      });

      if (data.reply) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (data.suggestedActions && Array.isArray(data.suggestedActions)) {
          setSuggestedPrompts(data.suggestedActions);
        }
      } else {
        showToast('Respuesta del servidor no disponible');
      }
    } catch (err) {
      console.error('Error in chat:', err);
      showToast('Error de conexión con el Copilot IA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Chat reiniciado. ¿En qué puedo ayudarte?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    showToast('Historial de chat eliminado.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
      <div className="w-full max-w-3xl h-[85vh] sm:h-[750px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">LifeOS Copilot IA</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gemini 3.1 Flash Lite
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Asistente personal contextualizado en tu turno {shiftConfig.workDays}x{shiftConfig.restDays} y biometría de altitud.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer relative z-10"
              title="Limpiar historial"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Context Chips Bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-[10px] font-extrabold">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <Briefcase className="w-3 h-3" /> Día {shiftInfo.dayInPhase} ({shiftInfo.phase === 'work' ? 'Faena' : 'Descanso'})
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <HeartPulse className="w-3 h-3" /> SpO2: {latestBiometrics?.spO2Pct || 96}% ({healthProfile.miningAltitudeMeters}m)
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <CheckSquare className="w-3 h-3" /> {pendingTasksCount} Pendientes
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
            <Wallet className="w-3 h-3" /> Cuentas Activas
          </span>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-100/50 dark:bg-slate-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-700'
                    : 'bg-emerald-500 text-slate-950 font-black'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[80%] space-y-1`}>
                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[9px] font-bold text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'} px-1`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-3xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>LifeOS Copilot pensando respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Sugerencias Rápidas:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsVoiceModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors cursor-pointer"
              title="Dictar por Voz"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje o pregunta a LifeOS Copilot..."
              className="flex-1 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
