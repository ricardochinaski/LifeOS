import React from 'react';
import { useLifeOS } from '../../../context/LifeOSContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { APP_CONSTANTS, AccentColorId, DensityId, FontFamilyId, CurrencyId } from '../constants';
import { Palette, Maximize2, Type, Wallet, Check } from 'lucide-react';

export const ThemeSection: React.FC = () => {
  const { darkMode, toggleDarkMode } = useLifeOS();
  const { settings, saveSettings } = useAppSettings();

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Palette className="w-6 h-6 text-emerald-500" />
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Personalización de Interfaz</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ajusta los colores, temas y densidad visual a tu preferencia.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Modo de Iluminación
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { if (darkMode) toggleDarkMode(); }}
            className={`p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              !darkMode
                ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 text-amber-500">☀️</span> Modo Claro
            </span>
            {!darkMode && <Check className="w-4 h-4 text-amber-500" />}
          </button>

          <button
            onClick={() => { if (!darkMode) toggleDarkMode(); }}
            className={`p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              darkMode
                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 text-indigo-400">🌙</span> Modo Oscuro Minero
            </span>
            {darkMode && <Check className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Primary Color Accent */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Color de Acento Principal
        </label>
        <div className="grid grid-cols-5 gap-2.5">
          {APP_CONSTANTS.COLORS.ACCENT_OPTIONS.map((color) => (
            <button
              key={color.id}
              onClick={() => saveSettings({ primaryColor: color.id as AccentColorId })}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                settings.primaryColor === color.id
                  ? 'border-slate-900 dark:border-white ring-2 ring-emerald-500/50 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full ${color.bg} shadow-md`} />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Densidad de Tarjetas y Espaciado
        </label>
        <div className="grid grid-cols-3 gap-3">
          {APP_CONSTANTS.COLORS.DENSITY_OPTIONS.map((den) => (
            <button
              key={den.id}
              onClick={() => saveSettings({ uiDensity: den.id as DensityId })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.uiDensity === den.id
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="text-xs font-bold">{den.label}</p>
              <p className="text-[10px] opacity-70">{den.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Familia Tipográfica
        </label>
        <div className="grid grid-cols-3 gap-3">
          {APP_CONSTANTS.COLORS.FONT_OPTIONS.map((font) => (
            <button
              key={font.id}
              onClick={() => saveSettings({ fontFamily: font.id as FontFamilyId })}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                settings.fontFamily === font.id
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="text-xs font-bold">{font.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Moneda Principal
        </label>
        <div className="grid grid-cols-4 gap-3">
          {APP_CONSTANTS.CURRENCIES.map((curr) => (
            <button
              key={curr}
              onClick={() => saveSettings({ currency: curr as CurrencyId })}
              className={`px-4 py-3 rounded-2xl border text-center transition-all cursor-pointer text-xs font-bold ${
                settings.currency === curr
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-sync & Sound toggles */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={settings.autoSyncCloud}
            onChange={(e) => saveSettings({ autoSyncCloud: e.target.checked })}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Sincronización automática en la nube</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={settings.soundEffects}
            onChange={(e) => saveSettings({ soundEffects: e.target.checked })}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Efectos de sonido</span>
        </label>
      </div>
    </div>
  );
};