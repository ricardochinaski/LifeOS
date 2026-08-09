import React, { useEffect, useRef, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import type { Priority } from '../../types';

const TASK_SEED_PARAM = 'lifeosTasks';
const TASK_SEED_VALUE = 'pending';

type SeedStatus = 'idle' | 'waiting' | 'done' | 'error';

type PendingTaskSpec = {
  title: string;
  description: string;
  priority: Priority;
  subtasks: string[];
  tags: string[];
};

const PENDING_TASKS: PendingTaskSpec[] = [
  {
    title: 'Validar sincronización web ↔ Android',
    description: 'Confirmar que proyecto, tareas y cambios de LifeOS se sincronizan entre Vercel y la app Android usando la misma cuenta Google.',
    priority: 'p1',
    tags: ['LifeOS', 'sync', 'firestore', 'android'],
    subtasks: [
      'Abrir LifeOS Android con la misma cuenta Google',
      'Confirmar que aparece el proyecto LifeOS',
      'Confirmar que aparecen estas tareas',
      'Editar o crear una tarea en un cliente y verificar el cambio en el otro',
    ],
  },
  {
    title: 'Corregir persistencia de entrenamientos',
    description: 'Cerrar los huecos de persistencia y carga de workoutLogs para que los entrenamientos sobrevivan recargas y sincronicen por Firestore.',
    priority: 'p1',
    tags: ['LifeOS', 'health', 'workoutLogs', 'firestore'],
    subtasks: [
      'Incluir workoutLogs en la carga desde localStorage',
      'Incluir workoutLogs en el guardado a localStorage',
      'Agregar workoutLogs al setterMap de Firestore',
      'Validar listener, recarga y recuperación desde la nube',
    ],
  },
  {
    title: 'Completar backend seguro del Copilot IA (PR #12)',
    description: 'Terminar la migración de Gemini fuera del cliente y dejar el Copilot operando mediante backend Vercel.',
    priority: 'p1',
    tags: ['LifeOS', 'security', 'gemini', 'vercel', 'PR12'],
    subtasks: [
      'Crear o validar el endpoint /api/chat',
      'Configurar GEMINI_API_KEY y FIREBASE_PROJECT_ID en Vercel',
      'Configurar PLIEGOS_API_BASE_URL',
      'Añadir rate limiting y estrategia de rotación de clave',
      'Verificar que la clave de Gemini no llegue al bundle del cliente',
    ],
  },
  {
    title: 'Corregir tarjeta de sincronización del dashboard',
    description: 'La tarjeta del dashboard debe reflejar la sesión real de Google y no pedir conexión cuando currentUser ya está autenticado.',
    priority: 'p2',
    tags: ['LifeOS', 'dashboard', 'auth', 'ux'],
    subtasks: [
      'Usar currentUser como fuente de verdad',
      'Eliminar el mensaje “Conecta Google” cuando la sesión está activa',
      'Mostrar un estado de sincronización coherente con syncState/lastSyncedAt',
    ],
  },
  {
    title: 'Crear vista visible de Proyectos',
    description: 'Añadir una vista clara para consultar y gestionar proyectos; actualmente se accede a ellos principalmente mediante filtros y selectores de tareas.',
    priority: 'p2',
    tags: ['LifeOS', 'projects', 'ui', 'ux'],
    subtasks: [
      'Mostrar listado o tarjetas de proyectos',
      'Mostrar estado y progreso de cada proyecto',
      'Permitir editar y eliminar proyectos desde la vista',
      'Mantener integración con filtros y creación de tareas',
    ],
  },
  {
    title: 'Repetir prueba de entrenamiento de 30 minutos',
    description: 'Después de corregir workoutLogs, registrar nuevamente un entrenamiento de 30 minutos y comprobar persistencia y sincronización.',
    priority: 'p2',
    tags: ['LifeOS', 'health', 'test'],
    subtasks: [
      'Registrar un entrenamiento de 30 minutos desde el flujo normal',
      'Recargar LifeOS y verificar que el registro permanezca',
      'Comprobar sesiones y minutos semanales',
      'Comprobar el mismo registro en web y Android',
    ],
  },
  {
    title: 'Retirar herramientas temporales de prueba de sincronización',
    description: 'Eliminar banners, parámetros y componentes temporales usados para probar Firestore una vez terminada la validación entre clientes.',
    priority: 'p2',
    tags: ['LifeOS', 'cleanup', 'sync'],
    subtasks: [
      'Eliminar SyncProbeRunner de producción',
      'Retirar parámetros temporales de prueba',
      'Conservar solo diagnóstico reutilizable apropiado para desarrollo',
    ],
  },
];

const clearTaskSeedParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(TASK_SEED_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export const LifeOSTaskSeeder: React.FC = () => {
  const {
    currentUser,
    isSyncing,
    projects,
    tasks,
    addTask,
    setActiveTab,
  } = useLifeOS();

  const requested = new URLSearchParams(window.location.search).get(TASK_SEED_PARAM) === TASK_SEED_VALUE;
  const attemptedRef = useRef(false);
  const [status, setStatus] = useState<SeedStatus>(requested ? 'waiting' : 'idle');
  const [detail, setDetail] = useState('Esperando autenticación y datos de LifeOS…');

  useEffect(() => {
    if (!requested || attemptedRef.current) return;
    if (!currentUser || isSyncing) {
      setStatus('waiting');
      setDetail('Esperando autenticación y carga desde Firestore…');
      return;
    }

    const lifeOSProject = projects.find((project) => project.name.trim().toLowerCase() === 'lifeos');
    if (!lifeOSProject) {
      setStatus('error');
      setDetail('No se encontró el proyecto LifeOS en la sesión autenticada.');
      return;
    }

    attemptedRef.current = true;

    try {
      let created = 0;

      for (const spec of PENDING_TASKS) {
        const alreadyExists = tasks.some(
          (task) => task.projectId === lifeOSProject.id && task.title.trim().toLowerCase() === spec.title.trim().toLowerCase(),
        );

        if (alreadyExists) continue;

        addTask({
          title: spec.title,
          description: spec.description,
          status: 'todo',
          priority: spec.priority,
          projectId: lifeOSProject.id,
          areaId: 'area_work',
          shiftContext: 'all',
          subtasks: spec.subtasks.map((title, index) => ({
            id: `sub_lifeos_${Date.now()}_${index}`,
            title,
            completed: false,
          })),
          tags: spec.tags,
        });
        created += 1;
      }

      setActiveTab('tasks');
      setStatus('done');
      setDetail(created > 0 ? `${created} tareas pendientes creadas dentro del proyecto LifeOS.` : 'Las tareas pendientes ya existían; no se crearon duplicados.');
      clearTaskSeedParam();
    } catch (error) {
      console.error('LifeOS task seed failed:', error);
      setStatus('error');
      setDetail(error instanceof Error ? error.message : String(error));
    }
  }, [requested, currentUser, isSyncing, projects, tasks, addTask, setActiveTab]);

  useEffect(() => {
    if (status !== 'done') return;
    const timeout = window.setTimeout(() => setStatus('idle'), 9000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (status === 'idle') return null;

  const success = status === 'done';
  const failure = status === 'error';

  return (
    <div className="fixed left-3 right-3 top-20 z-[101] mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${success ? 'bg-emerald-400' : failure ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`} />
        <div>
          <p className="text-sm font-black">Pendientes · Proyecto LifeOS</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{detail}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado: {status}</p>
        </div>
      </div>
    </div>
  );
};
