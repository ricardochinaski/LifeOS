import React from 'react';
import { useLifeOS } from '../../../context/LifeOSContext';
import { Wallet } from 'lucide-react';

export const FinanceSection: React.FC = () => {
  const { appSettings, updateAppSettings, accounts, budgets } = useLifeOS();

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Wallet className="w-6 h-6 text-emerald-500" />
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Finanzas & Configuración Moneda</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Define la divisa por defecto y límites financieros.</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Moneda Principal del Sistema
        </label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'CLP', label: 'CLP ($)', name: 'Peso Chileno' },
            { id: 'USD', label: 'USD ($)', name: 'Dólar US' },
            { id: 'EUR', label: 'EUR (€)', name: 'Euro' },
            { id: 'UF', label: 'UF', name: 'Unidad Fomento' }
          ].map((curr) => (
            <button
              key={curr.id}
              onClick={() => updateAppSettings({ currency: curr.id as any })}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                appSettings.currency === curr.id
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="text-sm font-black">{curr.label}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{curr.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Resumen Cuentas Financieras Registradas:</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {accounts.length} Cuentas activas | {budgets.length} Presupuestos mensuales configurados
        </p>
      </div>
    </div>
  );
};