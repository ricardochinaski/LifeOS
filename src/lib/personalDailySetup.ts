import type { Habit, Project, Task } from '../types';

export type DailyProjectSpec = Omit<Project, 'id' | 'createdAt'>;
export type DailyHabitSpec = Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>;

const normalize = (value: string) => value.trim().toLocaleLowerCase('es-CL');

export const DAILY_PROJECTS: DailyProjectSpec[] = [
  {
    name: 'IPLACEX',
    description: 'Estudios y evaluaciones de Ingeniería en Ejecución en Electricidad.',
    areaId: 'area_learning',
    color: '#8B5CF6',
    icon: 'GraduationCap',
    category: 'personal',
    status: 'in_progress',
    progress: 0,
    milestones: [],
    tags: ['estudios', 'iplacex'],
  },
  {
    name: 'Trading / BeLike Project',
    description: 'Preparación, seguimiento y registro del proceso de trading y BeLike.',
    areaId: 'area_work',
    color: '#3B82F6',
    icon: 'ChartCandlestick',
    category: 'app',
    status: 'in_progress',
    progress: 0,
    milestones: [],
    tags: ['trading', 'belike'],
  },
  {
    name: 'Electric NOM México',
    description: 'Publicación, seguimiento y mantenimiento de Electric NOM México.',
    areaId: 'area_work',
    color: '#F59E0B',
    icon: 'Zap',
    category: 'app',
    status: 'in_progress',
    progress: 0,
    milestones: [],
    tags: ['app', 'electric-nom'],
  },
  {
    name: 'LifeOS',
    description: 'Desarrollo y uso diario de LifeOS.',
    areaId: 'area_work',
    color: '#10B981',
    icon: 'Smartphone',
    category: 'app',
    status: 'in_progress',
    progress: 0,
    milestones: [],
    tags: ['lifeos'],
  },
  {
    name: 'Dirección personal',
    description: 'Prioridades, planificación y administración personal.',
    areaId: 'area_learning',
    color: '#6366F1',
    icon: 'Compass',
    category: 'personal',
    status: 'in_progress',
    progress: 0,
    milestones: [],
    tags: ['personal', 'planificacion'],
  },
  {
    name: 'Hogar & Vida Personal',
    description: 'Pendientes de hogar y vida personal.',
    areaId: 'area_home',
    color: '#EC4899',
    icon: 'Home',
    category: 'home',
    status: 'in_progress',
    progress: 0,
    milestones: [],
    tags: ['hogar', 'personal'],
  },
  {
    name: 'HydroStack',
    description: 'Proyecto hidropónico y de automatización; pausado hasta retomar trabajo en casa.',
    areaId: 'area_home',
    color: '#14B8A6',
    icon: 'Sprout',
    category: 'hardware',
    status: 'paused',
    progress: 0,
    milestones: [],
    tags: ['hydrostack', 'hardware'],
  },
];

export const DAILY_HABITS: DailyHabitSpec[] = [
  {
    title: 'Hidratación',
    description: 'Beber agua de forma consistente durante el día.',
    areaId: 'area_health',
    color: '#06B6D4',
    icon: 'Droplets',
    frequency: 'daily',
    targetValue: 1,
    unit: 'día',
    shiftContext: 'all',
    timeOfDay: 'afternoon',
    activeDays: [],
  },
  {
    title: 'Tomar creatina',
    description: 'Registrar la creatina diaria.',
    areaId: 'area_health',
    color: '#10B981',
    icon: 'Pill',
    frequency: 'daily',
    targetValue: 1,
    unit: 'vez',
    shiftContext: 'all',
    timeOfDay: 'morning',
    activeDays: [],
  },
  {
    title: 'Dormir 7+ horas',
    description: 'Objetivo diario de descanso de al menos 7 horas.',
    areaId: 'area_health',
    color: '#6366F1',
    icon: 'Moon',
    frequency: 'daily',
    targetValue: 7,
    unit: 'horas',
    shiftContext: 'all',
    timeOfDay: 'evening',
    activeDays: [],
  },
  {
    title: 'Revisión breve del Daily Plan',
    description: 'Revisar prioridades y contexto del día antes de dispersar el foco.',
    areaId: 'area_learning',
    color: '#3B82F6',
    icon: 'ListChecks',
    frequency: 'daily',
    targetValue: 1,
    unit: 'vez',
    shiftContext: 'all',
    timeOfDay: 'morning',
    activeDays: [],
  },
  {
    title: 'Orden de 10 minutos',
    description: 'Dedicar 10 minutos a dejar una zona ordenada.',
    areaId: 'area_home',
    color: '#EC4899',
    icon: 'Sparkles',
    frequency: 'daily',
    targetValue: 10,
    unit: 'minutos',
    shiftContext: 'all',
    timeOfDay: 'evening',
    activeDays: [],
  },
];

const DEMO_TASK_TITLES: Record<string, string> = {
  task_1: 'Calibrar turno de trabajo (14x14) en LifeOS',
  task_2: 'Configurar presupuestos mensuales en CLP',
  task_3: 'Registrar primer chequeo de constantes vitales',
  task_home_laundry_reset: 'Lavar ropa y dejar una muda lista',
  task_home_deep_clean: 'Limpieza profunda de dormitorio y bano',
  task_home_meal_prep: 'Preparar comidas base de la semana',
  task_personal_weekly_review: 'Revision semanal personal',
  task_personal_documents: 'Ordenar documentos importantes',
  task_home_maintenance: 'Chequeo de mantenimiento del hogar',
  task_personal_call_family: 'Llamar o visitar a alguien importante',
  task_finance_subscription_audit: 'Auditar suscripciones y gastos hormiga',
};

const DEMO_HABIT_TITLES: Record<string, string> = {
  habit_1: 'Ejercicio & Movilidad',
  habit_2: 'Hidratación Consciente',
  habit_3: 'Lectura Diaria',
  habit_4: 'Registro de Finanzas Diarias',
  habit_core_sleep: 'Dormir 7+ horas',
  habit_core_morning_reset: 'Rutina de manana',
  habit_core_10_min_order: 'Orden de 10 minutos',
  habit_core_no_impulse_spend: 'Sin compras impulsivas',
  habit_core_deep_work: 'Bloque de enfoque profundo',
  habit_core_journal: 'Diario breve',
  habit_core_steps: 'Caminar 8.000 pasos',
  habit_core_meditation: 'Respiracion o meditacion',
  habit_core_learning_note: 'Una nota de aprendizaje',
  habit_core_screen_boundary: 'Apagar pantallas 30 min antes',
};

const HABIT_SEED_UPGRADES: Record<string, string> = {
  habit_2: 'Hidratación',
  habit_core_sleep: 'Dormir 7+ horas',
  habit_core_10_min_order: 'Orden de 10 minutos',
};

const PROJECT_SEED_UPGRADES: Record<string, { original: string; target: string }> = {
  proj_huerta: { original: 'Huerta Vertical Hidropónica', target: 'HydroStack' },
  proj_app: { original: 'LifeOS App Móvil PWA', target: 'LifeOS' },
  proj_1: { original: 'Configuración Inicial LifeOS', target: 'Dirección personal' },
};

const RETIRABLE_PROJECTS: Record<string, string> = {
  proj_3: 'Fondo de Reserva Personal',
};

export interface PersonalDailySetupPlan {
  deleteTaskIds: string[];
  deleteHabitIds: string[];
  updateHabits: Habit[];
  addHabits: DailyHabitSpec[];
  deleteProjectIds: string[];
  updateProjects: Project[];
  addProjects: DailyProjectSpec[];
}

const matchesSeed = (actual: string, expected: string) => normalize(actual) === normalize(expected);

export const buildPersonalDailySetupPlan = (
  projects: Project[],
  tasks: Task[],
  habits: Habit[],
): PersonalDailySetupPlan => {
  const deleteTaskIds = tasks
    .filter((task) => DEMO_TASK_TITLES[task.id] && matchesSeed(task.title, DEMO_TASK_TITLES[task.id]))
    .map((task) => task.id);

  const desiredProjectNames = new Set(projects.map((project) => normalize(project.name)));
  const updateProjects: Project[] = [];
  const deleteProjectIds: string[] = [];

  for (const project of projects) {
    const upgrade = PROJECT_SEED_UPGRADES[project.id];
    if (upgrade && matchesSeed(project.name, upgrade.original)) {
      const target = DAILY_PROJECTS.find((spec) => spec.name === upgrade.target);
      if (!target) continue;
      if (desiredProjectNames.has(normalize(target.name))) {
        deleteProjectIds.push(project.id);
      } else {
        updateProjects.push({
          ...project,
          ...target,
          targetDate: undefined,
          budget: undefined,
          notes: undefined,
        });
        desiredProjectNames.add(normalize(target.name));
      }
      continue;
    }

    const retireTitle = RETIRABLE_PROJECTS[project.id];
    if (retireTitle && matchesSeed(project.name, retireTitle)) deleteProjectIds.push(project.id);
  }

  const addProjects = DAILY_PROJECTS.filter((spec) => !desiredProjectNames.has(normalize(spec.name)));

  const desiredHabitTitles = new Set(habits.map((habit) => normalize(habit.title)));
  const updateHabits: Habit[] = [];
  const deleteHabitIds: string[] = [];

  for (const habit of habits) {
    const originalTitle = DEMO_HABIT_TITLES[habit.id];
    if (!originalTitle || !matchesSeed(habit.title, originalTitle)) continue;

    const upgradeTitle = HABIT_SEED_UPGRADES[habit.id];
    if (upgradeTitle) {
      const target = DAILY_HABITS.find((spec) => spec.title === upgradeTitle);
      if (!target) continue;
      const targetAlreadyExists = habits.some(
        (candidate) => candidate.id !== habit.id && normalize(candidate.title) === normalize(target.title),
      );
      if (targetAlreadyExists) {
        deleteHabitIds.push(habit.id);
      } else {
        updateHabits.push({
          ...habit,
          ...target,
          notifyAt: undefined,
        });
        desiredHabitTitles.add(normalize(target.title));
      }
    } else {
      deleteHabitIds.push(habit.id);
    }
  }

  const addHabits = DAILY_HABITS.filter((spec) => !desiredHabitTitles.has(normalize(spec.title)));

  return {
    deleteTaskIds,
    deleteHabitIds,
    updateHabits,
    addHabits,
    deleteProjectIds,
    updateProjects,
    addProjects,
  };
};

export const countPersonalDailySetupChanges = (plan: PersonalDailySetupPlan) =>
  plan.deleteTaskIds.length +
  plan.deleteHabitIds.length +
  plan.updateHabits.length +
  plan.addHabits.length +
  plan.deleteProjectIds.length +
  plan.updateProjects.length +
  plan.addProjects.length;
