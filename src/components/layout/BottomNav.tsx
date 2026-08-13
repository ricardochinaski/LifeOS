import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import type { TabType } from '../../types';
import {
  BellRing,
  BookOpen,
  Bot,
  CalendarDays,
  CheckSquare,
  Dumbbell,
  Flame,
  FolderKanban,
  LayoutDashboard,
  MoreHorizontal,
  Pickaxe,
  Plus,
  Settings,
  Wallet,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openQuickCapture,
    openAICopilot,
    openNotificationsModal,
    openShiftCalibration,
  } = useLifeOS();
  const [moreOpen, setMoreOpen] = useState(false);

  const navigate = (tab: TabType) => {
    setActiveTab(tab);
    setMoreOpen(false);
  };

  const openProjects = () => {
    localStorage.setItem('lifeos_open_tasks_full', 'projects');
    setActiveTab('tasks');
    setMoreOpen(false);
    window.dispatchEvent(new Event('lifeos:open-tasks-full'));
  };

  const openAction = (action: () => void) => {
    setMoreOpen(false);
    action();
  };

  const moreTabs: TabType[] = ['habits', 'finances', 'library', 'health', 'settings'];
  const moreActive = moreTabs.includes(activeTab);

  const moduleItems: { id: TabType; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'habits', label: 'Hábitos', description: 'Rutinas y rachas', icon: Flame },
    { id: 'health', label: 'Entrenamientos', description: 'Sesiones, ejercicios y progreso', icon: Dumbbell },
    { id: 'finances', label: 'Finanzas', description: 'Cuentas y movimientos', icon: Wallet },
    { id: 'library', label: 'Biblioteca', description: 'Libros y sesiones', icon: BookOpen },
  ];

  const navButton = (item: { id: TabType; label: string; icon: React.FC<{ className?: string }> }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate(item.id)}
        className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${
          isActive
            ? 'font-bold text-[var(--color-accent)] dark:text-[var(--color-accent-light)]'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
        <span className="text-[10px] leading-none">{item.label}</span>
        {isActive && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />}
      </button>
    );
  };

  const hubRow = (
    label: string,
    description: string,
    icon: React.ReactNode,
    onClick: () => void,
    highlighted = false,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
        highlighted
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${highlighted ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-slate-100 dark:bg-slate-800'}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black">{label}</p>
        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </button>
  );

  return (
    <>
      {moreOpen && (
        <>
          <button type="button" aria-label="Cerrar menú" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]" />
          <section className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 z-50 max-h-[70dvh] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between px-3 pb-1 pt-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">LifeOS</p>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Más</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Hub</span>
            </div>

            <div className="mt-1 border-t border-slate-100 pt-2 dark:border-slate-800">
              <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Módulos</p>
              {hubRow('Proyectos', 'Gestión avanzada de proyectos y tareas', <FolderKanban className="h-4 w-4" />, openProjects)}
              {moduleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.id}>
                    {hubRow(item.label, item.description, <Icon className="h-4 w-4" />, () => navigate(item.id), activeTab === item.id)}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Inteligencia y automatización</p>
              {hubRow('Copilot IA', 'Consultar y operar con contexto real', <Bot className="h-4 w-4" />, () => openAction(openAICopilot), true)}
              {hubRow('Alertas y automatizaciones', 'Daily Plan y recordatorios', <BellRing className="h-4 w-4" />, () => openAction(openNotificationsModal))}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Sistema</p>
              {hubRow('Turno 14×14', 'Calibrar Faena / Descanso', <Pickaxe className="h-4 w-4" />, () => openAction(openShiftCalibration))}
              {hubRow('Configuración', 'Apariencia, datos, IA e integraciones', <Settings className="h-4 w-4" />, () => navigate('settings'), activeTab === 'settings')}
            </div>
          </section>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto flex h-16 max-w-xl items-center px-1">
          {navButton({ id: 'dashboard', label: 'Inicio', icon: LayoutDashboard })}
          {navButton({ id: 'tasks', label: 'Tareas', icon: CheckSquare })}

          <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center">
            <button type="button" onClick={() => { setMoreOpen(false); openQuickCapture(); }} className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/25 transition active:scale-95 dark:border-slate-900" aria-label="Capturar" title="Capturar"><Plus className="h-6 w-6" /></button>
            <span className="mt-0.5 text-[9px] font-bold leading-none text-slate-500 dark:text-slate-400">Capturar</span>
          </div>

          {navButton({ id: 'calendar', label: 'Calendario', icon: CalendarDays })}

          <button type="button" onClick={() => setMoreOpen((value) => !value)} className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${moreActive || moreOpen ? 'font-bold text-[var(--color-accent)] dark:text-[var(--color-accent-light)]' : 'text-slate-500 dark:text-slate-400'}`}>
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] leading-none">Más</span>
            {moreActive && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />}
          </button>
        </div>
      </nav>
    </>
  );
};