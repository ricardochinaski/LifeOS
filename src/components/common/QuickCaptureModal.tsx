import React, { useState, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { X, Sparkles, Plus, CheckCircle2, DollarSign, BookOpen, Flame, Tag, Clock, Mic, MicOff } from 'lucide-react';

export const QuickCaptureModal: React.FC = () => {
  const { isQuickCaptureOpen, closeQuickCapture, parseQuickCapture, executeQuickCapture } = useLifeOS();
  const [inputText, setInputText] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!isQuickCaptureOpen) return null;

  const toggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta captura de voz directa.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'es-CL';

      rec.onresult = (e: any) => {
        let current = '';
        for (let i = 0; i < e.results.length; i++) {
          current += e.results[i][0].transcript;
        }
        setInputText(current);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    }
  };

  const parsed = parseQuickCapture(inputText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const res = executeQuickCapture(inputText);
    if (res.success) {
      setLastResult(res.message);
      setInputText('');
      setTimeout(() => {
        closeQuickCapture();
        setLastResult(null);
      }, 900);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputText(example);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Captura Rápida (NLP Engine)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Procesa tareas, gastos, hábitos y páginas con etiquetas</p>
            </div>
          </div>
          <button
            onClick={closeQuickCapture}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <textarea
              autoFocus
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: 'Entrenar mañana a las 8am #Salud p1' o 'Gasto $18 en almuerzo #Finanzas' o 'Leer 25 paginas'"
              className="w-full p-3 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 resize-none"
            />
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
              title={isListening ? 'Detener grabación de voz' : 'Dictar por micrófono'}
            >
              {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Live Parsing Preview */}
          {inputText.trim().length > 0 && (
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <span>Detección en tiempo real:</span>
                <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
                  {parsed.type === 'task' && '✓ Tarea'}
                  {parsed.type === 'transaction' && '💰 Gasto / Transacción'}
                  {parsed.type === 'habit' && '🔥 Hábito'}
                  {parsed.type === 'reading' && '📚 Lectura'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium">
                  Título: {parsed.title}
                </span>

                {parsed.priority && parsed.type === 'task' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold uppercase ${
                    parsed.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                    parsed.priority === 'p2' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {parsed.priority.toUpperCase()}
                  </span>
                )}

                {parsed.amount && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    <DollarSign className="w-3 h-3" />
                    Monto: ${parsed.amount}
                  </span>
                )}

                {parsed.pages && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                    <BookOpen className="w-3 h-3" />
                    Páginas: {parsed.pages}
                  </span>
                )}

                {parsed.areaId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-medium">
                    <Tag className="w-3 h-3" />
                    {parsed.areaId.replace('area_', '').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Examples */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ejemplos rápidos para probar:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Revisar arquitectura Clean Arch #Trabajo p1',
                'Entrenar 45 min #Salud p2',
                'Comprar alimentos $45000 #Finanzas',
                'Leer 20 paginas de Hábitos Atómicos'
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Success feedback */}
          {lastResult && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lastResult}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeQuickCapture}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Procesar & Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
