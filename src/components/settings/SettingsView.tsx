import React, { useState, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { getGeminiApiKey, setGeminiApiKey } from '../../lib/gemini';
import {
  Settings,
  Palette,
  Briefcase,
  Wallet,
  HeartPulse,
  Bell,
  BellRing,
  Database,
  Cloud,
  Moon,
  Sun,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Calendar,
  Volume2,
  VolumeX,
  Type,
  Maximize2,
  Check,
  RefreshCw,
  Sliders,
  ChevronRight,
  Bot,
  Key,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    shiftConfig,
    updateShiftConfig,
    openShiftCalibration,
    healthProfile,
    updateHealthProfile,
    currentUser,
    signInWithGoogle,
    logout,
    syncToCloud,
    isSyncing,
    syncState,
    lastSyncedAt,
    exportDataJSON,
    importDataJSON,
    resetToDefaults,
    appSettings,
    updateAppSettings,
    showToast,
    accounts,
    budgets,
    openNotificationsModal
  } = useLifeOS();

  const [activeSection, setActiveSection] = useState<'theme' | 'shift' | 'finance' | 'health' | 'notifications' | 'ai' | 'data'>('theme');

  const [pendingBackup, setPendingBackup] = useState<Record<string, unknown> | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveCustomSettings = (updated: Partial<typeof appSettings>) => {
    updateAppSettings(updated);
    if (updated.primaryColor) {
      document.documentElement.setAttribute('data-accent', updated.primaryColor);
    }
    if (updated.uiDensity) {
      document.documentElement.setAttribute('data-density', updated.uiDensity);
    }
    showToast('Preferencias guardadas y sincronizadas.');
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.version || parsed.tasks || parsed.habits || parsed.accounts) {
          setPendingBackup(parsed);
        } else {
          showToast('El archivo JSON no contiene un formato de respaldo LifeOS válido.');
        }
      } catch (err) {
        console.error('Error importing JSON:', err);
        showToast('Error al procesar el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Ajustes Globales
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LifeOS v2.4
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Configuración & Personalización</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {currentUser ? (
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-800/80 border border-slate-700">
              <img src={currentUser.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded-full border border-emerald-500" />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-white leading-tight">{currentUser.displayName || 'Usuario'}</p>
                <p className="text-[10px] text-emerald-400">Google Cloud Conectado</p>
              </div>
              <button
                onClick={syncToCloud}
                disabled={isSyncing}
                className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                title="Sincronizar ahora"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Cloud className="w-4 h-4" />
              <span>Conectar Google Cloud</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Cloud className={`h-4 w-4 ${Object.values(syncState).some(state => state === 'error') ? 'text-rose-500' : 'text-emerald-500'}`} />
        <span className="font-bold text-slate-700 dark:text-slate-200">{Object.values(syncState).some(state => state === 'error') ? 'Hay módulos pendientes de sincronizar' : currentUser ? 'Cuenta y ajustes sincronizados' : 'Respaldo solo en este dispositivo'}</span>
        {lastSyncedAt && <span className="text-slate-400">Última actualización: {new Date(lastSyncedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      {/* Main Grid: Sidebar Menu + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <button
              onClick={() => setActiveSection('theme')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'theme'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Palette className="w-4 h-4" /> Apariencia & Tema
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveSection('shift')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'shift'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" /> Rotación 14x14 Roster
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveSection('finance')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'finance'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4" /> Finanzas & Moneda
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveSection('health')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'health'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4" /> Salud & Biometría
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveSection('notifications')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'notifications'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" /> Alertas & Notificaciones
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveSection('ai')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'ai'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Bot className="w-4 h-4" /> Inteligencia Artificial
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveSection('data')}
              className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSection === 'data'
                  ? 'bg-[var(--color-accent)] text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Database className="w-4 h-4" /> Datos, Nube & Backups
              </span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </div>

        {/* Dynamic Settings Details Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. Theme & Appearance */}
          {activeSection === 'theme' && (
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
                      <Sun className="w-5 h-5 text-amber-500" /> Modo Claro
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
                      <Moon className="w-5 h-5 text-indigo-400" /> Modo Oscuro Minero
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
                  {[
                    { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-500' },
                    { id: 'blue', name: 'Zafiro', bg: 'bg-blue-500' },
                    { id: 'purple', name: 'Amatista', bg: 'bg-purple-500' },
                    { id: 'amber', name: 'Cobre', bg: 'bg-amber-500' },
                    { id: 'rose', name: 'Carmesí', bg: 'bg-rose-500' },
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => saveCustomSettings({ primaryColor: color.id as any })}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                        appSettings.primaryColor === color.id
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
                  {[
                    { id: 'comfortable', label: 'Cómoda', desc: 'Espacioso' },
                    { id: 'compact', label: 'Compacta', desc: 'Alta Densidad' },
                    { id: 'spacious', label: 'Expandida', desc: 'Máximo Confort' }
                  ].map((den) => (
                    <button
                      key={den.id}
                      onClick={() => saveCustomSettings({ uiDensity: den.id as any })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        appSettings.uiDensity === den.id
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
            </div>
          )}

          {/* 2. Shift Roster 14x14 */}
          {activeSection === 'shift' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Sistema de Turnos Roster</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configura la rotación de días de trabajo y descanso en faena.</p>
                  </div>
                </div>

                <button
                  onClick={openShiftCalibration}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Sliders className="w-4 h-4" /> Recalibrar Turno
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Esquema Actual</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {shiftConfig.workDays} x {shiftConfig.restDays}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {shiftConfig.workDays} Días de Faena / {shiftConfig.restDays} Días de Descanso
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Fase Actual</span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 capitalize">
                    Día {shiftConfig.currentDayInPhase} ({shiftConfig.currentPhase === 'rest' ? 'Descanso' : 'Faena Minera'})
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fecha Ancla: {shiftConfig.anchorDate}
                  </p>
                </div>
              </div>

              {pendingBackup && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 space-y-3">
                  <div><p className="text-sm font-black text-amber-700 dark:text-amber-300">Revisar restauración</p><p className="text-xs text-slate-600 dark:text-slate-300">Backup {String(pendingBackup.version || 'legacy')} · {Array.isArray(pendingBackup.tasks) ? `${pendingBackup.tasks.length} tareas` : 'sin tareas detectadas'}. La clave de Gemini no se importa.</p></div>
                  <div className="flex flex-wrap gap-2"><button onClick={() => setImportMode('merge')} className={`rounded-xl px-3 py-2 text-xs font-bold ${importMode === 'merge' ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Fusionar por ID</button><button onClick={() => setImportMode('replace')} className={`rounded-xl px-3 py-2 text-xs font-bold ${importMode === 'replace' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Reemplazar este dispositivo</button></div>
                  <div className="flex gap-2"><button onClick={() => { importDataJSON(pendingBackup, importMode); setPendingBackup(null); }} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950">Confirmar restauración</button><button onClick={() => setPendingBackup(null)} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500">Cancelar</button></div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ubicación o Campamento Minero
                </label>
                <input
                  type="text"
                  value={shiftConfig.locationName || 'Mina / Campamento Doña Inés'}
                  onChange={(e) => updateShiftConfig({ locationName: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* 3. Finance & Currency */}
          {activeSection === 'finance' && (
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
                      onClick={() => saveCustomSettings({ currency: curr.id as any })}
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
          )}

          {/* 4. Health & Altitude */}
          {activeSection === 'health' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <HeartPulse className="w-6 h-6 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Metas Médicas & Altitud Minera</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Establece objetivos de agua e indicadores fisiológicos de seguridad.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Altitud Operativa (msnm)
                  </label>
                  <input
                    type="number"
                    value={healthProfile.miningAltitudeMeters}
                    onChange={(e) => updateHealthProfile({ miningAltitudeMeters: parseInt(e.target.value, 10) || 4200 })}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">Recomendado parafaenas a más de 3,000 msnm.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Meta Diaria de Agua (ml)
                  </label>
                  <input
                    type="number"
                    value={healthProfile.dailyWaterTargetMl}
                    onChange={(e) => updateHealthProfile({ dailyWaterTargetMl: parseInt(e.target.value, 10) || 3500 })}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">Sugerido 3,500 ml para prevenir deshidratación.</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Notifications */}
          {activeSection === 'notifications' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Bell className="w-6 h-6 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Alertas & Notificaciones</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recordatorios de turno, salud e hidratacion en tu telefono.</p>
                </div>
              </div>

              <button
                onClick={openNotificationsModal}
                className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BellRing className="w-5 h-5" /> Configurar Notificaciones y Recordatorios
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <Briefcase className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-400">Cambio de Turno</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">24h antes</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <HeartPulse className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-400">Salud & SpO2</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">8 AM diario</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Notificaciones Nativas Android
                </p>
                <p className="text-[11px] text-slate-300">
                  Las alertas usan el sistema de notificaciones nativo de Android para recordatorios confiables.
                </p>
              </div>
            </div>
          )}

          {/* 6. AI Configuration */}
          {activeSection === 'ai' && <AISection />}

          {/* 7. Data & Cloud Backup */}
          {activeSection === 'data' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Database className="w-6 h-6 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Gestión de Datos & Copias de Respaldo</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Exporta, importa o sincroniza tu base de datos completa.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={exportDataJSON}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left transition-all space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Exportar Backup (JSON)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Descarga una copia completa codificada en JSON con todas tus tareas, hábitos, transacciones y fichas de salud.
                  </p>
                </button>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left transition-all space-y-2 cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportJSON}
                    accept=".json"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Restaurar desde JSON</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Selecciona un archivo `.json` exportado previamente para cargar tus datos en este dispositivo.
                  </p>
                </div>
              </div>

              {/* Reset to clean defaults */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Restablecer este dispositivo</p>
                  <p className="text-[11px] text-slate-400">Restaura los valores locales; no elimina la información de Google Cloud.</p>
                </div>
                <button
                  onClick={() => resetToDefaults()}
                  className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restablecer local</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AISection: React.FC = () => {
  const { showToast } = useLifeOS();
  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = () => {
    setGeminiApiKey(apiKey.trim());
    showToast('API Key de Gemini guardada.');
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Gemini AI (Gratuito)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">API Key gratuita de Google para Copilot, Voz y Rutinas</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-2">
        <p className="font-bold flex items-center gap-2 text-blue-300">
          <Zap className="w-4 h-4" /> ¿Cómo obtener tu API Key gratuita?
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
          <li>Ve a <a href="https://aistudio.google.com/apikey" className="text-blue-400 underline" target="_blank">aistudio.google.com/apikey</a></li>
          <li>Inicia sesión con tu cuenta Google</li>
          <li>Haz clic en <strong>Create API Key</strong></li>
          <li>Copia la key y pégala aquí abajo</li>
        </ol>
        <p className="text-[11px] text-slate-400 mt-2">
          Gemini 3.1 Flash Lite es <strong>completamente gratuito</strong> con 60 requests/minuto. Sin necesidad de tarjeta de crédito.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gemini API Key</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 pr-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-300">Funcionalidades con Gemini AI:</p>
        <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <p><Bot className="w-3 h-3 inline mr-1 text-blue-400" /> Copilot IA - Asistente inteligente de turno</p>
          <p><Sparkles className="w-3 h-3 inline mr-1 text-amber-400" /> Comandos de Voz - Dictado inteligente</p>
          <p><HeartPulse className="w-3 h-3 inline mr-1 text-rose-400" /> Planificador de Rutinas - Ejercicios personalizados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-slate-600 dark:text-slate-300 space-y-3">
        <p className="font-bold text-amber-700 dark:text-amber-300">Privacidad de IA</p>
        <p>La clave permanece solo en este dispositivo y nunca se incluye en backups ni en Firestore. Las consultas que envíes al Copilot se procesan con Gemini.</p>
        <div className="flex flex-wrap gap-2"><button onClick={() => { setGeminiApiKey(''); setApiKey(''); showToast('API Key eliminada de este dispositivo.'); }} className="rounded-xl border border-rose-500/30 px-3 py-2 text-[10px] font-bold text-rose-600 dark:text-rose-300">Eliminar API Key</button><button onClick={() => { localStorage.removeItem('lifeos_chat_messages'); showToast('Historial del Copilot eliminado.'); }} className="rounded-xl border border-slate-300 px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-slate-600 dark:text-slate-300">Borrar historial Copilot</button></div>
      </div>
    </div>
  );
};
