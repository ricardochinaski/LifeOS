import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { parseVoiceCommand } from '../../lib/api';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  Wallet,
  HeartPulse,
  CheckSquare,
  AlertCircle,
  Volume2,
  Flame
} from 'lucide-react';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, addHealthLog, addTask, addHabit, financialAccounts, showToast } = useLifeOS();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'es-CL';

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setTranscript('');
      setParsedResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Reconocimiento de voz no soportado por este navegador.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setParsedResult(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting voice recognition:', e);
      }
    }
  };

  const handleProcessTranscript = async (textToProcess?: string) => {
    const queryText = textToProcess || transcript;
    if (!queryText.trim()) {
      showToast('Por favor habla o escribe un comando de voz primero.');
      return;
    }

    setIsParsing(true);
    setParsedResult(null);

    try {
      const data = await parseVoiceCommand({ text: queryText });
      setIsParsing(false);
      setParsedResult(data);
    } catch (err) {
      console.error('Error parsing voice query:', err);
      setIsParsing(false);
      showToast('Error al procesar el dictado con la IA');
    }
  };

  const handleConfirmAction = () => {
    if (!parsedResult) return;

    const { intent, data } = parsedResult;
    const defaultAccountId = financialAccounts[0]?.id || 'acc_1';

    if (intent === 'expense' || intent === 'income') {
      const amount = data.amount || 1000;
      addTransaction({
        accountId: defaultAccountId,
        type: intent,
        amount: amount,
        category: data.category || (intent === 'expense' ? 'Gastos Varios' : 'Otros Ingresos'),
        description: data.description || transcript || 'Dictado por voz',
        date: new Date().toISOString().split('T')[0]
      });
      showToast(`¡${intent === 'expense' ? 'Gasto' : 'Ingreso'} de $${amount.toLocaleString('es-CL')} CLP registrado!`);
    } else if (intent === 'health_log') {
      addHealthLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spO2Pct: data.spO2Pct || 98,
        heartRateBpm: data.heartRateBpm || 70,
        bloodPressureSys: data.bloodPressureSys || 120,
        bloodPressureDia: data.bloodPressureDia || 80,
        weightKg: data.weightKg || 78,
        sleepHours: data.sleepHours || 8,
        sleepQuality: 'buena',
        energyLevel: 8,
        locationContext: 'mine_camp',
        notes: `Dictado por voz: "${transcript}"`
      });
      showToast('¡Registro biométrico guardado en tu Ficha de Salud!');
    } else if (intent === 'habit') {
      addHabit({
        title: data.habitTitle || transcript || 'Nuevo Hábito',
        description: `Creado por comando de voz: "${transcript}"`,
        color: '#10B981',
        icon: 'Sparkles',
        frequency: 'daily',
        targetValue: data.habitTarget || 1,
        unit: data.habitUnit || 'veces',
      });
      showToast('¡Hábito creado exitosamente!');
    } else {
      // Task
      addTask({
        title: data.taskTitle || transcript || 'Nueva Tarea Dictada',
        description: `Creada por comando de voz: "${transcript}"`,
        status: 'todo',
        priority: data.priority || 'p2',
        dueDate: new Date().toISOString().split('T')[0],
        subtasks: []
      });
      showToast('¡Tarea agregada a tu lista de pendientes!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
                  Dictado Inteligente Gemini IA
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Manos Libres
                </span>
              </div>
              <h2 className="text-lg font-black text-white">Comandos de Voz Rápidos</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Button & Wave */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <button
            onClick={toggleListening}
            className={`relative p-6 rounded-full transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white shadow-2xl shadow-rose-500/50 scale-110 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/30'
            }`}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            {isListening && (
              <span className="absolute -inset-2 rounded-full border-2 border-rose-500/60 animate-ping pointer-events-none" />
            )}
          </button>

          <p className="text-xs font-bold text-slate-300 text-center">
            {isListening ? (
              <span className="text-rose-400 font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1.5 justify-center">
                <Volume2 className="w-4 h-4" /> Escuchando... Habla libremente en CLP o Salud
              </span>
            ) : (
              <span>Haz clic en el micrófono para dictar o escribe abajo</span>
            )}
          </p>

          {!speechSupported && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              Nota: Tu navegador no soporta captura de voz directa, pero puedes escribir abajo para procesar con IA.
            </p>
          )}
        </div>

        {/* Transcript Area / Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Transcripción o Mensaje:</span>
            {transcript && (
              <button
                onClick={() => setTranscript('')}
                className="text-slate-400 hover:text-white text-[10px]"
              >
                Limpiar
              </button>
            )}
          </label>
          <div className="relative">
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder='Ejemplos: "Gaste 15 mil pesos en almuerzo" o "Tengo 98 de saturación y 65 de pulso" o "Tarea comprar pasajes"'
              rows={3}
              className="w-full p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />
            <button
              onClick={() => handleProcessTranscript()}
              disabled={isParsing || !transcript.trim()}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors shadow-md"
              title="Interpretar con IA"
            >
              {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Examples Pills */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Probar Ejemplos Dictados:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setTranscript('Gaste 18500 pesos en supermercado Líder');
                handleProcessTranscript('Gaste 18500 pesos en supermercado Líder');
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
            >
              <Wallet className="w-3 h-3 text-amber-400" /> "Gaste 18.500 en supermercado"
            </button>
            <button
              onClick={() => {
                setTranscript('Saturación 98 por ciento pulso 65 y presión 120 con 80');
                handleProcessTranscript('Saturación 98 por ciento pulso 65 y presión 120 con 80');
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
            >
              <HeartPulse className="w-3 h-3 text-rose-400" /> "SpO2 98%, Pulso 65, Presión 120/80"
            </button>
            <button
              onClick={() => {
                setTranscript('Tarea urgente preparar acreditación de salud de faena');
                handleProcessTranscript('Tarea urgente preparar acreditación de salud de faena');
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
            >
              <CheckSquare className="w-3 h-3 text-blue-400" /> "Tarea acreditar salud faena"
            </button>
            <button
              onClick={() => {
                setTranscript('Crea hábito de leer 20 minutos diarios');
                handleProcessTranscript('Crea hábito de leer 20 minutos diarios');
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
            >
              <Flame className="w-3 h-3 text-orange-400" /> "Crea hábito leer 20 min"
            </button>
          </div>
        </div>

        {/* Interpreted Result Card */}
        {parsedResult && (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
              <span className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> Interpretación Gemini IA:
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {parsedResult.intent}
              </span>
            </div>

            <p className="text-xs font-medium text-slate-200 leading-relaxed">
              {parsedResult.summary}
            </p>

            <button
              onClick={handleConfirmAction}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Confirmar y Guardar en LifeOS</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>SpeechRecognition API + Gemini 3.1 Flash Lite</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
