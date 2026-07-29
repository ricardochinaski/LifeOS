import React, { useState } from 'react';
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
    exportDataJSON,
    resetToDefaults,
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
    return d.toLocaleDateString('es-ES', options);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">LifeOS</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                2.4
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 capitalize hidden sm:block">
              {getTodayFormatted()}
            </p>
          </div>
        </div>

        {/* Center: Shift 14x14 Badge */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={openShiftCalibration}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
              shiftInfo.phase === 'rest'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900'
            }`}
            title="Sincronizar rotación minera 14x14"
          >
            {shiftInfo.phase === 'rest' ? (
              <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Pickaxe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span>
              Día {shiftInfo.dayInPhase}/14 {shiftInfo.phase === 'rest' ? 'Descanso' : 'Faena'}
            </span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Google Auth / Sync Status */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  className="w-7 h-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <button
                onClick={syncToCloud}
                disabled={isSyncing}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sincronizar cambios a Google Cloud"
              >
                <Cloud className={`w-4 h-4 ${isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                {isSyncing && <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />}
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Cerrar sesión de Google"
              >
                <LogOut className="w-4 h-4" />
          </button>

          {toastMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="line-clamp-1">{toastMessage}</span>
            </div>
          )}
        </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white transition-all shadow-sm shrink-0 cursor-pointer ${isSigningIn ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Iniciar sesión con Google"
            >
              {isSigningIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </>
              )}
            </button>
          )}

          {/* Notifications Button */}
          <button
            onClick={openNotificationsModal}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Configurar Notificaciones Push"
          >
            <BellRing className="w-4 h-4" />
            <span className="text-xs font-bold hidden xl:inline">Alertas</span>
          </button>

          {/* Quick Capture Button */}
          <button
            onClick={openQuickCapture}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-emerald-400 font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0 cursor-pointer"
            title="Entrada rápida con lenguaje natural"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Capturar</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 font-bold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Ajustes y Personalización"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden xl:inline">Ajustes</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            title="Cambiar Modo Oscuro / Claro"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

    </header>
  );
};
