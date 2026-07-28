import React, { useEffect } from 'react';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { QuickCaptureModal } from './components/common/QuickCaptureModal';
import { ShiftCalibrationModal } from './components/common/ShiftCalibrationModal';
import { AICopilotModal } from './components/common/AICopilotModal';
import { VoiceCommandModal } from './components/common/VoiceCommandModal';
import { GoogleCalendarSyncModal } from './components/integrations/GoogleCalendarSyncModal';
import { PushNotificationsModal } from './components/integrations/PushNotificationsModal';
import { GoogleFitSyncModal } from './components/integrations/GoogleFitSyncModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { HabitsView } from './components/habits/HabitsView';
import { FinancesView } from './components/finances/FinancesView';
import { LibraryView } from './components/library/LibraryView';
import { HealthView } from './components/health/HealthView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { Bot } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab } = useLifeOS();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'tasks' && <TasksView />}
      {activeTab === 'habits' && <HabitsView />}
      {activeTab === 'finances' && <FinancesView />}
      {activeTab === 'library' && <LibraryView />}
      {activeTab === 'health' && <HealthView />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

const AppContent: React.FC = () => {
  const {
    isAICopilotOpen, openAICopilot, closeAICopilot,
    isVoiceModalOpen, closeVoiceModal,
    isCalendarModalOpen, closeCalendarModal,
    isNotificationsModalOpen, closeNotificationsModal,
    isFitModalOpen, closeFitModal,
  } = useLifeOS();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos_custom_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.primaryColor) {
          document.documentElement.setAttribute('data-accent', settings.primaryColor);
        }
        if (settings.uiDensity) {
          document.documentElement.setAttribute('data-density', settings.uiDensity);
        }
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white pb-[calc(5rem+env(safe-area-inset-bottom,0px))] relative">
      <Navbar />
      <MainContent />
      <QuickCaptureModal />
      <ShiftCalibrationModal />
      <AICopilotModal isOpen={isAICopilotOpen} onClose={closeAICopilot} />
      <VoiceCommandModal isOpen={isVoiceModalOpen} onClose={closeVoiceModal} />
      <GoogleCalendarSyncModal isOpen={isCalendarModalOpen} onClose={closeCalendarModal} />
      <PushNotificationsModal isOpen={isNotificationsModalOpen} onClose={closeNotificationsModal} />
      <GoogleFitSyncModal isOpen={isFitModalOpen} onClose={closeFitModal} />
      
      {/* Floating AI Copilot Action Button */}
      <button
        onClick={openAICopilot}
        className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-30 p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-black shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
        title="Abrir Asistente IA LifeOS Copilot"
      >
        <Bot className="w-6 h-6 text-slate-950 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs font-black uppercase tracking-wider text-slate-950 pr-1">
          Copilot IA
        </span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
      </button>

      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <LifeOSProvider>
      <AppContent />
    </LifeOSProvider>
  );
}
