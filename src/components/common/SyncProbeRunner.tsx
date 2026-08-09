import React, { useEffect, useRef, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { db, doc, getDoc, setDoc } from '../../lib/firebase';

const SYNC_PROBE_PARAM = 'syncProbe';
const SYNC_PROBE_VALUE = 'lifeos';
const SYNC_PROBE_PROJECT_ID = 'proj_lifeos_sync_probe_2026_08_09';

type ProbeStatus = 'idle' | 'waiting-auth' | 'writing' | 'waiting-ui' | 'confirmed' | 'cloud-only' | 'error';

const clearSyncProbeParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(SYNC_PROBE_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export const SyncProbeRunner: React.FC = () => {
  const { currentUser, isSyncing, projects, setActiveTab } = useLifeOS();
  const requested = new URLSearchParams(window.location.search).get(SYNC_PROBE_PARAM) === SYNC_PROBE_VALUE;
  const attemptedRef = useRef(false);
  const [status, setStatus] = useState<ProbeStatus>(requested ? 'waiting-auth' : 'idle');
  const [detail, setDetail] = useState('Esperando sesión de Google…');

  useEffect(() => {
    if (!requested || attemptedRef.current) return;
    if (!currentUser || isSyncing) {
      setStatus('waiting-auth');
      setDetail('Esperando que termine la autenticación y la carga desde Firestore…');
      return;
    }

    attemptedRef.current = true;
    setStatus('writing');
    setDetail('Escribiendo el proyecto LifeOS en Firestore…');

    const run = async () => {
      try {
        const project = {
          id: SYNC_PROBE_PROJECT_ID,
          name: 'LifeOS',
          description: 'Proyecto de prueba para validar la sincronización de LifeOS entre dispositivos.',
          areaId: 'area_work',
          color: '#3B82F6',
          icon: 'RefreshCw',
          createdAt: new Date().toISOString().split('T')[0],
          category: 'app',
          status: 'in_progress',
          progress: 0,
          milestones: [],
          tags: ['LifeOS', 'sync-test'],
        };

        const projectRef = doc(db, 'users', currentUser.uid, 'projects', SYNC_PROBE_PROJECT_ID);
        await setDoc(projectRef, project, { merge: true });

        const verification = await getDoc(projectRef);
        if (!verification.exists()) {
          throw new Error('Firestore no devolvió el proyecto después de escribirlo.');
        }

        setStatus('waiting-ui');
        setDetail('Firestore confirmó el proyecto. Esperando que el listener de LifeOS lo cargue en la interfaz…');
      } catch (error) {
        console.error('LifeOS end-to-end sync probe failed:', error);
        const message = error instanceof Error ? error.message : String(error);
        setStatus('error');
        setDetail(message);
        localStorage.setItem(
          'lifeos_sync_probe_result',
          JSON.stringify({ status: 'error', message, completedAt: new Date().toISOString() }),
        );
      }
    };

    void run();
  }, [requested, currentUser, isSyncing]);

  useEffect(() => {
    if (status !== 'waiting-ui') return;

    const visible = projects.some(
      (project) => project.id === SYNC_PROBE_PROJECT_ID || project.name.trim().toLowerCase() === 'lifeos',
    );

    if (visible) {
      setStatus('confirmed');
      setDetail('Sincronización confirmada: Firestore guardó LifeOS y la interfaz lo recibió.');
      setActiveTab('tasks');
      clearSyncProbeParam();
      localStorage.setItem(
        'lifeos_sync_probe_result',
        JSON.stringify({
          status: 'confirmed',
          projectId: SYNC_PROBE_PROJECT_ID,
          completedAt: new Date().toISOString(),
        }),
      );
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatus('cloud-only');
      setDetail('Firestore guardó LifeOS, pero la interfaz no lo recibió. El problema está en el listener de proyectos.');
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [status, projects, setActiveTab]);

  useEffect(() => {
    if (status !== 'confirmed') return;
    const timeout = window.setTimeout(() => setStatus('idle'), 8000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (status === 'idle') return null;

  const success = status === 'confirmed';
  const failure = status === 'error' || status === 'cloud-only';

  return (
    <div className="fixed left-3 right-3 top-20 z-[100] mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${success ? 'bg-emerald-400' : failure ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`} />
        <div>
          <p className="text-sm font-black">Prueba de sincronización LifeOS</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{detail}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado: {status}</p>
        </div>
      </div>
    </div>
  );
};
