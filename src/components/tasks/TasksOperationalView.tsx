import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CheckSquare, Clock3, Plus, Target } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { todayLocalDate } from '../../lib/dateOnly';
import { rankDailyTasks } from '../../lib/dailyPlan';
import { OperationalModeHeader, FullModeBackButton } from '../common/OperationalModeHeader';
import { TasksView } from './TasksView';

type TaskFilter = 'due' | 'focus' | 'overdue' | 'all';

const MOBILE_TASK_LIMIT = 8;

export const TasksOperationalView: React.FC = () => {
  const { tasks, projects, shiftInfo, toggleTaskStatus, openQuickCapture } = useLifeOS();
  const [fullMode, setFullMode] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>('due');
  const [showAll, setShowAll] = useState(false);
  const today = todayLocalDate();

  const ranked = useMemo(() => rankDailyTasks(tasks, today, shiftInfo.phase), [tasks, today, shiftInfo.phase]);
  const overdueCount = ranked.filter((task) => task.dueDate && task.dueDate < today).length;
  const todayCount = ranked.filter((task) => task.dueDate === today).length;
  const focusCount = ranked.filter((task) => task.priority === 'p1' || task.priority === 'p2').length;
  const dueCount = overdueCount + todayCount;

  const visibleTasks = useMemo(() => {
    if (filter === 'due') return ranked.filter((task) => task.dueDate === today || (task.dueDate && task.dueDate < today));
    if (filter === 'focus') return ranked.filter((task) => task.priority === 'p1' || task.priority === 'p2');
    if (filter === 'overdue') return ranked.filter((task) => task.dueDate && task.dueDate < today);
    return ranked;
  }, [filter, ranked, today]);

  const displayedTasks = showAll ? visibleTasks : visibleTasks.slice(0, MOBILE_TASK_LIMIT);
  const remainingCount = Math.max(0, visibleTasks.length - displayedTasks.length);

  if (fullMode) {
    return (
      <div>
        <FullModeBackButton onBack={() => setFullMode(false)} label="modo operativo" />
        <TasksView />
      </div>
    );
  }

  const filterButton = (id: TaskFilter, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => {
        setFilter(id);
        setShowAll(false);
      }}
      className={`min-h-9 shrink-0 rounded-xl border px-3 py-2 text-[11px] font-black transition-all ${
        filter === id
          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
      }`}
    >
      {label}{typeof count === 'number' ? ` · ${count}` : ''}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      <OperationalModeHeader
        eyebrow="Tareas"
        title="Qué toca resolver"
        description={`Ordenadas por fecha, urgencia y contexto de ${shiftInfo.phase === 'work' ? 'faena' : 'descanso'}.`}
        icon={<CheckSquare className="h-5 w-5" />}
        onOpenFull={() => setFullMode(true)}
        action={(
          <button
            type="button"
            onClick={openQuickCapture}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-slate-950"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Tarea rápida</span><span className="sm:hidden">Nueva</span>
          </button>
        )}
      />

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <span className={`text-xs font-black ${overdueCount ? 'text-rose-500' : 'text-slate-500'}`}>{overdueCount} atrasadas</span>
        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{todayCount} hoy</span>
        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{focusCount} P1/P2</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterButton('due', 'Hoy + atrasadas', dueCount)}
        {filterButton('focus', 'Enfoque', focusCount)}
        {filterButton('overdue', 'Atrasadas', overdueCount)}
        {filterButton('all', 'Todas', ranked.length)}
      </div>

      <section className="space-y-2">
        {visibleTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
            <h2 className="mt-2 text-sm font-black text-slate-900 dark:text-white">Sin tareas en esta vista</h2>
            <p className="mt-1 text-xs text-slate-500">Cambia el filtro o captura una nueva tarea.</p>
          </div>
        )}

        {displayedTasks.map((task) => {
          const project = task.projectId ? projects.find((item) => item.id === task.projectId) : undefined;
          const overdue = Boolean(task.dueDate && task.dueDate < today);
          return (
            <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-700"
                  aria-label={`Completar ${task.title}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-black text-slate-950 dark:text-white">{task.title}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${task.priority === 'p1' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : task.priority === 'p2' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>{task.priority}</span>
                  </div>
                  {task.description && <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">{task.description}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                    {overdue && <span className="inline-flex items-center gap-1 text-rose-500"><AlertTriangle className="h-3.5 w-3.5" /> Atrasada</span>}
                    {task.dueDate && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {task.dueDate}{task.dueTime ? ` · ${task.dueTime}` : ''}</span>}
                    {project && <span className="inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {project.name}</span>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Ver {remainingCount} tareas más
          </button>
        )}
      </section>
    </div>
  );
};