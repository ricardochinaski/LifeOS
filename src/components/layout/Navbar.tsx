import React from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Sparkles,
  Sun,
  Moon,
  Plus,
  Layers,
  Pickaxe,
  Coffee,
  Cloud,
  LogOut,
  RefreshCw,
  BellRing,
  Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    openQuickCapture,
    activeTab,
    setActiveTab,
    toastMessage,
    shiftInfo,
    openShiftCalibration,
    currentUser,
    isSyncing,
    isSigningIn,
    signInWithGoogle,
    logout,
    syncToCloud,
    openNotificationsModal,
  } = useLifeOS();

  const getTodayFormatted = () => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const label = d.toLocaleDateString('es-CL', options);
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const visibleToastMessage = toastMessage?.startsWith('Datos cargados desde la nube (')
    ? 'Datos sincronizados desde la nube.'
    : toastMessage;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90">
      <div className="relative mx-auto flex h-16 max-w-7xl min-w-0 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-md shadow-emerald-500/20 sm:h-10 sm:w-10">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">LifeOS</span>
              <span className="hidden rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 xs:inline sm:text-[10px]">
                2.4
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              {getTodayFormatted()}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={openShiftCalibration}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
              shiftInfo.phase === 'rest'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 dark:hover:bg-emerald-900'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200 dark:hover:bg-amber-900'
            }`}
            title="Sincronizar rotación minera 14x14"
          >
            {shiftInfo.phase === 'rest' ? (
              <Coffee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Pickaxe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span>Día {shiftInfo.dayInPhase}/14 {shiftInfo.phase === 'rest' ? 'Descanso' : 'Faena'}</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950 sm:h-9 sm:w-9">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <button
                onClick={syncToCloud}
                disabled={isSyncing}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-700"
                title="Sincronizar cambios"
                aria-label="Sincronizar cambios"
              >
                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin text-amber-400" /> : <Cloud className="h-4 w-4 text-emerald-500" />}
              </button>

              <button
                onClick={logout}
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/60 sm:flex"
                title="Cerrar sesión de Google"
                aria-label="Cerrar sesión de Google"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className={`flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 ${isSigningIn ? 'cursor-not-allowed opacity-50' : ''}`}
              title="Iniciar sesión con Google"
            >
              {isSigningIn ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={openNotificationsModal}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400 dark:hover:bg-amber-900"
            title="Configurar alertas"
            aria-label="Configurar alertas"
          >
            <BellRing className="h-4 w-4" />
          </button>

          <button
            onClick={openQuickCapture}
            className="hidden h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-black text-slate-950 shadow-sm transition-all hover:bg-emerald-400 md:flex"
            title="Captura rápida"
          >
            <Plus className="h-4 w-4" />
            <span>Capturar</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`hidden h-10 w-10 items-center justify-center rounded-xl border transition-colors md:flex ${
              activeTab === 'settings'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            title="Ajustes"
            aria-label="Ajustes"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={toggleDarkMode}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:flex"
            title="Cambiar tema"
            aria-label="Cambiar tema"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
        </div>

        {visibleToastMessage && (
          <div className="absolute right-3 top-[calc(100%+0.5rem)] z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 shadow-xl animate-fade-in dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-200 sm:right-6 sm:max-w-sm">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="line-clamp-2">{visibleToastMessage}</span>
          </div>
        )}
      </div>
    </header>
  );
};
