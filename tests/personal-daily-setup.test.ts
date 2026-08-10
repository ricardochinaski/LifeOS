import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPersonalDailySetupPlan,
  countPersonalDailySetupChanges,
  DAILY_HABITS,
} from '../src/lib/personalDailySetup.ts';
import type { Habit, Project, Task } from '../src/types/index.ts';

const project = (id: string, name: string): Project => ({
  id,
  name,
  areaId: 'area_work',
  color: '#000000',
  icon: 'Box',
  createdAt: '2026-08-10',
  status: 'in_progress',
});

const task = (id: string, title: string): Task => ({
  id,
  title,
  status: 'todo',
  priority: 'p2',
  subtasks: [],
  createdAt: '2026-08-10',
});

const habit = (id: string, title: string): Habit => ({
  id,
  title,
  areaId: 'area_health',
  color: '#000000',
  icon: 'Circle',
  frequency: 'daily',
  targetValue: 1,
  unit: 'vez',
  streak: 2,
  bestStreak: 4,
  createdAt: '2026-08-10',
});

const configuredDailyHabit = (id: string, title: string): Habit => {
  const spec = DAILY_HABITS.find((item) => item.title === title);
  assert.ok(spec);
  return {
    ...spec,
    id,
    streak: 2,
    bestStreak: 4,
    createdAt: '2026-08-10',
  };
};

test('known untouched demo seeds are cleaned or upgraded while user data is preserved', () => {
  const plan = buildPersonalDailySetupPlan(
    [
      project('proj_huerta', 'Huerta Vertical Hidropónica'),
      project('proj_app', 'LifeOS App Móvil PWA'),
      project('proj_1', 'Configuración Inicial LifeOS'),
      project('proj_3', 'Fondo de Reserva Personal'),
      project('proj_user', 'Proyecto real'),
    ],
    [
      task('task_1', 'Calibrar turno de trabajo (14x14) en LifeOS'),
      task('task_user', 'Tarea real'),
    ],
    [
      habit('habit_2', 'Hidratación Consciente'),
      habit('habit_core_sleep', 'Dormir 7+ horas'),
      habit('habit_3', 'Lectura Diaria'),
      habit('habit_user', 'Hábito real'),
    ],
  );

  assert.deepEqual(plan.deleteTaskIds, ['task_1']);
  assert.deepEqual(plan.deleteProjectIds, ['proj_3']);
  assert.deepEqual(plan.deleteHabitIds, ['habit_3']);
  assert.equal(plan.updateProjects.find((item) => item.id === 'proj_huerta')?.name, 'HydroStack');
  assert.equal(plan.updateProjects.find((item) => item.id === 'proj_huerta')?.status, 'paused');
  assert.equal(plan.updateProjects.find((item) => item.id === 'proj_app')?.name, 'LifeOS');
  assert.equal(plan.updateHabits.find((item) => item.id === 'habit_2')?.title, 'Hidratación');
  assert.equal(plan.updateHabits.find((item) => item.id === 'habit_core_sleep')?.targetValue, 7);
  assert.ok(plan.addProjects.some((item) => item.name === 'IPLACEX'));
  assert.ok(plan.addHabits.some((item) => item.title === 'Tomar creatina'));
});

test('edited seed entities are treated as user data and never deleted', () => {
  const plan = buildPersonalDailySetupPlan(
    [project('proj_3', 'Mi fondo real')],
    [task('task_1', 'Turno calibrado y documentado por mí')],
    [habit('habit_3', 'Lectura técnica semanal')],
  );

  assert.deepEqual(plan.deleteProjectIds, []);
  assert.deepEqual(plan.deleteTaskIds, []);
  assert.deepEqual(plan.deleteHabitIds, []);
});

test('the setup is idempotent when desired projects and habits already exist', () => {
  const projects = [
    'IPLACEX',
    'Trading / BeLike Project',
    'Electric NOM México',
    'LifeOS',
    'Dirección personal',
    'Hogar & Vida Personal',
    'HydroStack',
  ].map((name, index) => project(`custom_project_${index}`, name));

  const habits = [
    'Hidratación',
    'Tomar creatina',
    'Dormir 7+ horas',
    'Revisión breve del Daily Plan',
    'Orden de 10 minutos',
  ].map((title, index) => habit(`custom_habit_${index}`, title));

  const plan = buildPersonalDailySetupPlan(projects, [], habits);
  assert.equal(countPersonalDailySetupChanges(plan), 0);
});

test('reused seed habit ids stop being pending after they already match the daily setup', () => {
  const projects = [
    'IPLACEX',
    'Trading / BeLike Project',
    'Electric NOM México',
    'LifeOS',
    'Dirección personal',
    'Hogar & Vida Personal',
    'HydroStack',
  ].map((name, index) => project(`custom_project_${index}`, name));

  const habits = [
    configuredDailyHabit('habit_2', 'Hidratación'),
    configuredDailyHabit('custom_creatine', 'Tomar creatina'),
    configuredDailyHabit('habit_core_sleep', 'Dormir 7+ horas'),
    configuredDailyHabit('custom_daily_plan', 'Revisión breve del Daily Plan'),
    configuredDailyHabit('habit_core_10_min_order', 'Orden de 10 minutos'),
  ];

  const plan = buildPersonalDailySetupPlan(projects, [], habits);
  assert.deepEqual(plan.updateHabits, []);
  assert.equal(countPersonalDailySetupChanges(plan), 0);
});
