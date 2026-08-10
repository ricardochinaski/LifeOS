import React, { useMemo, useState } from 'react';
import { CheckCircle2, ListChecks, ShieldCheck, Sparkles } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  buildPersonalDailySetupPlan,
  countPersonalDailySetupChanges,
  DAILY_HABITS,
  DAILY_PROJECTS,
} from '../../lib/personalDailySetup';

const waitForUniqueTimestamp = () => new Promise<void>((resolve) => setTimeout(resolve, 4));

export const PersonalDailySetupCard: React.FC = () => {
  const {
    currentUser,
    projects,
    tasks,
    habits,
    addProject,
    updateProject,
    deleteProject,
    deleteTask,
    addHabit,
    updateHabit,
    deleteHabit,
    showToast,
  } = useLifeOS();
  const [isApplying, setIsApplying] = useState(false);

  const plan = useMemo(
    () => buildPersonalDailySetupPlan(projects, tasks, habits),
    [projects, tasks, habits],
  );
  const pendingChanges = countPersonalDailySetupChanges(plan);

  if (pendingChanges === 0) return null;

  const applySetup = async () => {
    if (!currentUser || isApplying) return;

    const confirmed = window.confirm(
      `LifeOS aplicará la puesta en marcha diaria.\n\n` +
      `• Retirará ${plan.deleteTaskIds.length} tareas demo sin editar.\n` +
      `• Retirará ${plan.deleteHabitIds.length} hábitos demo sin editar.\n` +
      `• Ajustará/creará los proyectos y 5 hábitos diarios mostrados.\n` +
      `• No tocará Finanzas, Salud, Biblioteca ni elementos que hayas editado o creado.\n\n` +
      `¿Aplicar ahora?`,
    );
    if (!confirmed) return;

    setIsApplying(true);
    try {
      plan.deleteTaskIds.forEach(deleteTask);
      plan.deleteHabitIds.forEach(deleteHabit);
      plan.deleteProjectIds.forEach(deleteProject);

      plan.updateProjects.forEach(updateProject);
      plan.updateHabits.forEach(updateHabit);

      for (const project of plan.addProjects) {
        addProject(project);
        await waitForUniqueTimestamp();
      }
      for (const habit of plan.addHabits) {
        addHabit(habit);
        await waitForUniqueTimestamp();
      }

      showToast('Puesta en marcha diaria aplicada. Tus datos propios se conservaron.');
    } catch (error) {
      console.error('Error applying personal daily setup:', error);
      showToast('No se pudo completar la puesta en marcha. Revisa la sincronización e inténtalo nuevamente.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section className="mb-4 rounded-3xl border border-emerald-500/30 bg-emerald-50 p-4 shadow-sm dark:bg-emerald-950/20">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-500 p-2.5 text-slate-950">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Puesta en marcha · uso diario
          </p>
          <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">Organizar LifeOS con datos reales</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            Limpia únicamente semillas iniciales sin editar y prepara una estructura mínima. La operación es idempotente y conserva tus registros propios.
          </p>

          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-3 dark:border-emerald-900 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-600" />
                <p className="text-[10px] font-black uppercase text-slate-500">Proyectos</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-200">
                {DAILY_PROJECTS.map((project) => project.name).join(' · ')}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-3 dark:border-emerald-900 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-[10px] font-black uppercase text-slate-500">Hábitos diarios</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-200">
                {DAILY_HABITS.map((habit) => habit.title).join(' · ')}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {plan.deleteTaskIds.length + plan.deleteHabitIds.length + plan.deleteProjectIds.length} semillas retirables · {plan.addProjects.length + plan.addHabits.length} elementos faltantes
            </div>
            <button
              type="button"
              onClick={applySetup}
              disabled={!currentUser || isApplying}
              className="min-h-11 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplying ? 'Aplicando…' : currentUser ? 'Aplicar configuración diaria' : 'Inicia sesión para aplicar'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
