import React, { useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, Cloud, Copy, ExternalLink, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useLifeOS } from '../../context/LifeOSContext';

type AIStatus = {
  provider: string;
  model: string;
  configured: boolean;
  mode: 'gemini-backend' | 'local-safe';
  reachable?: boolean;
};

const VERCEL_ENV_URL = 'https://vercel.com/aselec/life-os/settings/environment-variables';

export const AIBackendStatusCard: React.FC = () => {
  const { currentUser, showToast } = useLifeOS();
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestStatus = useCallback(async (probe = false) => {
    const user = auth.currentUser;
    if (!user) {
      setStatus(null);
      setError('Inicia sesión con Google para verificar el backend de IA.');
      return;
    }

    probe ? setProbing(true) : setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/ai-status', {
        method: probe ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`AI_STATUS_${response.status}`);
      const data = await response.json() as AIStatus;
      setStatus(data);
      if (probe) {
        if (!data.configured) showToast('Falta configurar GEMINI_API_KEY en Vercel.');
        else if (data.reachable) showToast('Gemini respondió correctamente desde el backend.');
        else showToast('La variable existe, pero Gemini no respondió correctamente.');
      }
    } catch (err) {
      console.error('AI backend status check failed.', err);
      setError('No fue posible verificar el backend de IA en este momento.');
    } finally {
      setLoading(false);
      setProbing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser) void requestStatus(false);
    else {
      setStatus(null);
      setError(null);
    }
  }, [currentUser, requestStatus]);

  const copyVariable = async () => {
    try {
      await navigator.clipboard.writeText('GEMINI_API_KEY');
      showToast('Nombre de variable copiado: GEMINI_API_KEY');
    } catch {
      showToast('Variable requerida: GEMINI_API_KEY');
    }
  };

  const configured = Boolean(status?.configured);
  const reachable = status?.reachable;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-500"><Bot className="h-5 w-5" /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">IA · backend seguro</p>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Configuración de Gemini</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">La API key no se guarda dentro del APK. LifeOS la lee desde el servidor para evitar exponerla.</p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void requestStatus(false)}
            disabled={!currentUser || loading || probing}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Estado
          </button>
          <button
            type="button"
            onClick={() => void requestStatus(true)}
            disabled={!currentUser || probing}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-slate-950 disabled:opacity-50"
          >
            <Cloud className={`h-3.5 w-3.5 ${probing ? 'animate-pulse' : ''}`} /> Probar Gemini
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Estado</p>
          <p className={`mt-1 flex items-center gap-1.5 text-xs font-black ${configured ? 'text-emerald-500' : 'text-amber-500'}`}>
            {configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
            {configured ? 'Gemini configurado' : currentUser ? 'Falta API key' : 'Sin verificar'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Modelo</p>
          <p className="mt-1 truncate text-xs font-black text-slate-800 dark:text-slate-100">{status?.model || 'Sin verificar'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Prueba real</p>
          <p className={`mt-1 text-xs font-black ${reachable === true ? 'text-emerald-500' : reachable === false ? 'text-rose-500' : 'text-slate-500'}`}>
            {reachable === true ? 'Conexión OK' : reachable === false ? 'Sin respuesta' : 'No ejecutada'}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100">Dónde colocar tu API key</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-slate-300">Vercel → proyecto <strong>life-os</strong> → Settings → Environment Variables. Crea <code className="rounded bg-slate-950/10 px-1 py-0.5 dark:bg-white/10">GEMINI_API_KEY</code> y vuelve a desplegar la rama o producción que quieras usar.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={copyVariable} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-black text-slate-700 dark:border-slate-600 dark:text-slate-200">
                <Copy className="h-3.5 w-3.5" /> Copiar variable
              </button>
              <button type="button" onClick={() => window.open(VERCEL_ENV_URL, '_blank', 'noopener,noreferrer')} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-blue-500 px-2.5 py-1.5 text-[10px] font-black text-white">
                <ExternalLink className="h-3.5 w-3.5" /> Abrir Vercel
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-[11px] font-bold text-rose-500">{error}</p>}
    </section>
  );
};
