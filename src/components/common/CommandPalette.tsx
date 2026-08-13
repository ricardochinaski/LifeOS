import React, { useEffect, useState } from 'react';
import { CheckSquare, Dumbbell, Flame, Keyboard, Plus, Search, Wallet, X } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { TabType } from '../../types';

const destinations: { tab: TabType; label: string; icon: React.ElementType }[] = [
  { tab: 'dashboard', label: 'Abrir centro diario', icon: Keyboard },
  { tab: 'tasks', label: 'Ir a tareas', icon: CheckSquare },
  { tab: 'habits', label: 'Ir a hábitos', icon: Flame },
  { tab: 'health', label: 'Ir a entrenamientos', icon: Dumbbell },
  { tab: 'finances', label: 'Ir a finanzas', icon: Wallet },
];

export const CommandPalette: React.FC = () => {
  const { setActiveTab, openQuickCapture } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(current => !current);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) return null;
  const items = [
    ...destinations.map(item => ({ ...item, action: () => setActiveTab(item.tab) })),
    { label: 'Capturar tarea, gasto, entreno o hábito', icon: Plus, action: openQuickCapture },
  ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  const select = (action: () => void) => {
    action();
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-sm flex items-start justify-center p-4 pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-800 px-4">
          <Search className="w-5 h-5 text-emerald-400" />
          <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Busca una acción..." className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500" />
          <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2">
          {items.map(item => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => select(item.action)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-200 hover:bg-slate-800"><Icon className="w-4 h-4 text-emerald-400" />{item.label}</button>;
          })}
          {items.length === 0 && <p className="p-4 text-center text-xs text-slate-500">No hay acciones que coincidan.</p>}
        </div>
        <p className="border-t border-slate-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Ctrl K para abrir o cerrar</p>
      </div>
    </div>
  );
};