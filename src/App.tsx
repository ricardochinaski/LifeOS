import React, { useEffect } from 'react';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { QuickCaptureModal } from './components/common/QuickCaptureModal';
import { ShiftCalibrationModal } from './components/common/ShiftCalibrationModal';
import { AICopilotModal } from './components/common/AICopilotModal';
import { VoiceCommandModal } from './components/common/VoiceCommandModal';
import { CommandPalette } from './components/common/CommandPalette';
import { GoogleCalendarSyncModal } from './components/integrations/GoogleCalendarSyncModal';
import { PushNotificationsModal } from './components/integrations/PushNotificationsModal';
import { Bot } from 'lucide-react';

import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { HabitsView } from './components/habits/HabitsView';
import { FinancesView } from './components/finances/FinancesView';
import { LibraryView } from './components/library/LibraryView';
import { HealthView } from './components/health/HealthView';
import { SettingsView } from './components/settings/SettingsView';


const MainContent: React.FC = () => {
  const { activeTab } = useLifeOS();

  return (
    <main className="lifeos-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'tasks' && <TasksView />}
      {activeTab === 'habits' && <HabitsView />}
      {activeTab === 'finances' && <FinancesView />}
      {activeTab === 'library' && <LibraryView />}
      {activeTab === 'health' && <HealthView />}
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
    appSettings,
  } = useLifeOS();

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', appSettings.primaryColor);
    document.documentElement.setAttribute('data-density', appSettings.uiDensity);
    document.documentElement.setAttribute('data-font', appSettings.fontFamily);
  }, [appSettings.primaryColor, appSettings.uiDensity, appSettings.fontFamily]);

  return (
    <div className="lifeos-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white pb-[calc(5rem+env(safe-area-inset-bottom,0px))] relative">
      <Navbar />
      <MainContent />
      <QuickCaptureModal />
      <ShiftCalibrationModal />
      <AICopilotModal isOpen={isAICopilotOpen} onClose={closeAICopilot} />
      <VoiceCommandModal isOpen={isVoiceModalOpen} onClose={closeVoiceModal} />
      <CommandPalette />
      <GoogleCalendarSyncModal isOpen={isCalendarModalOpen} onClose={closeCalendarModal} />
      <PushNotificationsModal isOpen={isNotificationsModalOpen} onClose={closeNotificationsModal} />

      {/* Floating AI Copilot */}
      <button
        onClick={openAICopilot}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-30 p-3 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="LifeOS Copilot IA"
      >
        <Bot className="w-5 h-5" />
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
