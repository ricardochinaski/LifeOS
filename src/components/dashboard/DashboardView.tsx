import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { ShiftDashboardCard } from './ShiftDashboardCard';
import {
  Flame, CheckSquare, Wallet, BookOpen, Sparkles, Plus,
  CheckCircle2, Circle, ChevronRight,
  Dumbbell, HeartPulse, Bookmark, Settings2, Moon, Activity, Eye, EyeOff
} from 'lucide-react';

interface WidgetConfig {
  shiftCard: boolean;
  habits: boolean;
  tasks: boolean;
  finances: boolean;
  library: boolean;
  health: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig = {
  shiftCard: true,
  habits: true,
  tasks: true,
  finances: true,
  library: true,
  health: true,
};

export const DashboardView: React.FC = () => {
  const {
    habits,
    habitLogs,
    logHabit,
    tasks,
    toggleTaskStatus,
    accounts,
    budgets,
    transactions,
    books,
    updateBookProgress,
    healthProfile,
    healthLogs,
    setActiveTab,
    openQuickCapture
  } = useLifeOS();

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(() => {
    try {
      const saved = localStorage.getItem('lifeos_widget_config');
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('lifeos_widget_config', JSON.stringify(widgetConfig));
  }, [widgetConfig]);

  const toggleWidget = (key: keyof WidgetConfig) => {
    setWidgetConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Today's Habits
  const habitsLoggedToday = habitLogs.filter((l) => l.date === todayStr).map((l) => l.habitId);
  const totalHabitsCount = habits.length;
  const habitsDoneCount = habitsLoggedToday.length;
  const habitsProgressPct = totalHabitsCount > 0 ? Math.round((habitsDoneCount / totalHabitsCount) * 100) : 0;

  // 2. Priority Tasks (P1 / P2)
  const priorityTasks = tasks.filter((t) => (t.priority === 'p1' || t.priority === 'p2') && t.status !== 'completed');

  // 3. Financial Progress
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currentMonthStr = todayStr.substring(0, 7);
  const thisMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalBudgetLimit = budgets
    .filter((b) => b.period === currentMonthStr)
    .reduce((sum, b) => sum + b.monthlyLimit, 0) || 1350;
  const budgetSpentPct = Math.min(100, Math.round((thisMonthExpenses / totalBudgetLimit) * 100));

  // 4. Currently Reading Book
  const activeBook = books.find((b) => b.status === 'reading') || books[0];

  // 5. Health Latest Log
  const latestHealthLog = healthLogs.length > 0 ? healthLogs[0] : null;

  const handleQuickPageAdd = (bookId: string, pagesToAdd: number) => {
    if (!activeBook) return;
    updateBookProgress(bookId, activeBook.currentPage + pagesToAdd);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">Mi Día — LifeOS</h1>
          </div>
          <p className="text-sm text-slate-300">
            Unificación en tiempo real de tus hábitos, tareas prioritarias, finanzas y salud en faena.
          </p>
        </div>

        {/* Quick Actions & Score */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 bg-slate-800/80 p-2.5 px-4 rounded-2xl border border-slate-700/80">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Hábitos</p>
              <p className="text-base font-bold text-emerald-400">{habitsDoneCount}/{totalHabitsCount}</p>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">P1/P2</p>
              <p className="text-base font-bold text-amber-400">{priorityTasks.length}</p>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Gastos</p>
              <p className="text-base font-bold text-sky-400">{budgetSpentPct}%</p>
            </div>
          </div>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Personalizar Widgets del Dashboard"
          >
            <Settings2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Widgets</span>
          </button>
        </div>
      </div>

      {/* 14x14 Mining Shift Card Widget */}
      {widgetConfig.shiftCard && <ShiftDashboardCard />}

      {/* Grid Layout for Dashboard Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Today's Habits Widget */}
        {widgetConfig.habits && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Hábitos de Hoy</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{habitsProgressPct}% completado hoy</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('habits')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Ver todos los hábitos"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${habitsProgressPct}%` }}
              />
            </div>

            {/* Habit List */}
            <div className="space-y-2.5 pt-1">
              {habits.map((h) => {
                const isCompleted = habitsLoggedToday.includes(h.id);
                return (
                  <div
                    key={h.id}
                    onClick={() => logHabit(h.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </button>
                      <div>
                        <p className={`text-xs font-semibold ${isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {h.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Meta: {h.targetValue} {h.unit}
                        </p>
                      </div>
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{h.streak}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Module 2: Priority Tasks Widget */}
        {widgetConfig.tasks && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Tareas Prioritarias</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{priorityTasks.length} urgentes pendientes</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Ver todas las tareas"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {priorityTasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">¡Al día! Sin tareas urgentes pendientes.</p>
                </div>
              ) : (
                priorityTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskStatus(t.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{t.title}</p>
                        {t.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            t.priority === 'p1' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {t.priority.toUpperCase()}
                          </span>
                          {t.dueTime && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ⏰ {t.dueTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={openQuickCapture}
                className="w-full py-2 px-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar tarea rápida</span>
              </button>
            </div>
          </div>
        )}

        {/* Module 3: Side Column Widgets (Finances, Reading, Health) */}
        <div className="space-y-6">
          
          {/* Health & Biometrics Widget */}
          {widgetConfig.health && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Salud & Biometría</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Monitoreo en Faena Minera</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('health')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Abrir Módulo de Salud"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Health Grid Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-rose-500">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase text-slate-400">Oximetría SpO2</span>
                  </div>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                    {latestHealthLog?.spO2Pct ? `${latestHealthLog.spO2Pct}%` : '--'}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-semibold">{latestHealthLog?.spO2Pct ? 'Saludable a gran altura' : 'Sin datos'}</p>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-indigo-500">
                    <Moon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase text-slate-400">Sueño Anoche</span>
                  </div>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                    {latestHealthLog?.sleepHours ? `${latestHealthLog.sleepHours}h` : '--'}
                  </p>
                  <p className="text-[10px] text-indigo-400 font-semibold">{latestHealthLog?.sleepQuality ? `Calidad ${latestHealthLog.sleepQuality}` : 'Sin datos'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Presión: {latestHealthLog?.bloodPressureSys && latestHealthLog?.bloodPressureDia ? `${latestHealthLog.bloodPressureSys}/${latestHealthLog.bloodPressureDia} mmHg` : 'Sin datos'}</span>
                <button
                  onClick={() => setActiveTab('health')}
                  className="text-rose-600 dark:text-rose-400 font-bold hover:underline text-[11px]"
                >
                  Registrar +
                </button>
              </div>

              <button
                onClick={() => setActiveTab('health')}
                className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Rutina de Ejercicios IA</span>
              </button>
            </div>
          )}

          {/* Finance Overview Card Widget */}
          {widgetConfig.finances && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Finanzas del Mes</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Balance: ${totalBalance.toLocaleString('es-CL')} CLP</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('finances')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Ver Finanzas"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Budget Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>Gastado: ${thisMonthExpenses.toLocaleString('es-CL')}</span>
                  <span>Límite: ${totalBudgetLimit.toLocaleString('es-CL')}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      budgetSpentPct > 90 ? 'bg-red-500' : budgetSpentPct > 70 ? 'bg-amber-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${budgetSpentPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Book Card Widget */}
          {widgetConfig.library && activeBook && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Leyendo Ahora</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeBook.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('library')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Book Details */}
              <div className="flex items-center gap-4 pt-1">
                {activeBook.coverUrl ? (
                  <img
                    src={activeBook.coverUrl}
                    alt={activeBook.title}
                    className="w-14 h-20 object-cover rounded-xl shadow border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-14 h-20 rounded-xl bg-purple-900 text-purple-200 flex items-center justify-center font-bold">
                    <Bookmark className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{activeBook.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeBook.author}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>Pág. {activeBook.currentPage} / {activeBook.totalPages}</span>
                      <span>{Math.round((activeBook.currentPage / activeBook.totalPages) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(activeBook.currentPage / activeBook.totalPages) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Pages Logger Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">Sumar págs:</span>
                {[+10, +20, +30].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleQuickPageAdd(activeBook.id, num)}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-colors"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* WIDGET CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personalizar Panel de Widgets</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Activa o desactiva las tarjetas visibles en la pantalla principal de LifeOS según tus necesidades en faena o descanso.
            </p>

            <div className="space-y-2">
              {[
                { key: 'shiftCard', label: 'Rotación Minera 14x14', desc: 'Día actual y contador de faena/descanso' },
                { key: 'habits', label: 'Hábitos del Día', desc: 'Progreso y marcas rápidas' },
                { key: 'tasks', label: 'Tareas Prioritarias P1/P2', desc: 'Acciones urgentes pendientes' },
                { key: 'health', label: 'Salud & Biometría', desc: 'Oximetría, sueño y presión arterial' },
                { key: 'finances', label: 'Finanzas del Mes', desc: 'Balance y límite presupuestario' },
                { key: 'library', label: 'Lectura Activa', desc: 'Progreso de libro y avance rápido' },
              ].map(({ key, label, desc }) => {
                const k = key as keyof WidgetConfig;
                const active = widgetConfig[k];
                return (
                  <div
                    key={key}
                    onClick={() => toggleWidget(k)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                    <div className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      active ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

