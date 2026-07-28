import React from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { TabType } from '../../types';
import { LayoutDashboard, CheckSquare, Flame, Wallet, BookOpen, HeartPulse, Calendar, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useLifeOS();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
    { id: 'habits', label: 'Hábitos', icon: Flame },
    { id: 'finances', label: 'Finanzas', icon: Wallet },
    { id: 'library', label: 'Lectura', icon: BookOpen },
    { id: 'health', label: 'Salud', icon: HeartPulse },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-xl mx-auto px-1 h-16 flex items-center justify-between overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-[400px]:min-w-[52px] sm:min-w-[64px] h-full gap-1 px-1 transition-all relative cursor-pointer${
                item.id === 'library' ? ' max-[400px]:hidden' : ''
              } ${
                isActive
                  ? 'text-[var(--color-accent)] dark:text-[var(--color-accent-light)] font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="hidden min-[400px]:inline text-[10px] sm:text-[11px] leading-none whitespace-nowrap">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
