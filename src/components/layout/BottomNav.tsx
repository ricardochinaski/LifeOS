import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import type { TabType } from '../../types';
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckSquare,
  Flame,
  HeartPulse,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Settings,
  Wallet,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openQuickCapture, openAICopilot } = useLifeOS();
  const [moreOpen, setMoreOpen] = useState(false);

  const navigate = (tab: TabType) => {
    setActiveTab(tab);
    setMoreOpen(false);
  };

  const moreTabs: TabType[] = ['habits', 'finances', 'library', 'health', 'settings'];
  const moreActive = moreTabs.includes(activeTab);

  const secondaryItems: { id: TabType; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'habits', label: 'Hábitos', description: 'Rutinas y rachas', icon: Flame },
    { id: 'finances', label: 'Finanzas', description: 'Cuentas y movimientos', icon: Wallet },
    { id: 'health', label: 'Salud', description: 'Registros y entrenos', icon: HeartPulse },
    { id: 'library', label: 'Lectura', description: 'Libros y sesiones', icon: BookOpen },
    { id: 'settings', label: 'Ajustes', description: 'Cuenta e integraciones', icon: Settings },
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

  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
          />
          <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 z-50 w-64 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Más de LifeOS</p>

            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                openAICopilot();
              }}
              className="mb-1 flex w-full items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-3 text-left text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
            >
              <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-950"><Bot className="h-4 w-4" /></div>
              <div>
                <p className="text-xs font-black">Copilot IA</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Consultar y organizar LifeOS</p>
              </div>
            </button>

            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800"><Icon className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-black">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex h-16 max-w-xl items-center px-1">
          {navButton({ id: 'dashboard', label: 'Inicio', icon: LayoutDashboard })}
          {navButton({ id: 'tasks', label: 'Tareas', icon: CheckSquare })}

          <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => { setMoreOpen(false); openQuickCapture(); }}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/25 transition active:scale-95 dark:border-slate-900"
              aria-label="Capturar"
              title="Capturar"
            >
              <Plus className="h-6 w-6" />
            </button>
            <span className="mt-0.5 text-[9px] font-bold leading-none text-slate-500 dark:text-slate-400">Capturar</span>
          </div>

          {navButton({ id: 'calendar', label: 'Calendario', icon: CalendarDays })}

          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${moreActive || moreOpen ? 'font-bold text-[var(--color-accent)] dark:text-[var(--color-accent-light)]' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] leading-none">Más</span>
            {moreActive && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />}
          </button>
        </div>
      </nav>
    </>
  );
};
