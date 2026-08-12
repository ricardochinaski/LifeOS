import React, { useEffect } from 'react';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { QuickCaptureModal } from './components/common/QuickCaptureModal';
import { ShiftCalibrationModal } from './components/common/ShiftCalibrationModal';
import { AICopilotModal } from './components/common/AICopilotModal';
import { VoiceCommandModal } from './components/common/VoiceCommandModal';
import { CommandPalette } from './components/common/CommandPalette';
import { DailyAutomationBridge } from './components/common/DailyAutomationBridge';
import { PersonalDailySetupCard } from './components/common/PersonalDailySetupCard';
import { DemoDataGuardCard } from './components/common/DemoDataGuardCard';
import { GoogleCalendarSyncModal } from './components/integrations/GoogleCalendarSyncModal';
import { PushNotificationsModal } from './components/integrations/PushNotificationsModal';

import { DashboardViewV2 } from './components/dashboard/DashboardViewV2';
import { TasksOperationalView } from './components/tasks/TasksOperationalView';
import { HabitsOperationalView } from './components/habits/HabitsOperationalView';
import { FinancesOperationalView } from './components/finances/FinancesOperationalView';
import { LibraryOperationalView } from './components/library/LibraryOperationalView';
import { HealthOperationalView } from './components/health/HealthOperationalView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';

const PERSONAL_VISUAL_DEFAULTS_KEY = 'lifeos_personal_visual_defaults_v1';

const MainContent: React.FC = () => {
  const { activeTab } = useLifeOS();

  return (
    <main className="lifeos-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
      {activeTab === 'dashboard' && (
        <>
          <PersonalDailySetupCard />
          <DemoDataGuardCard />
          <DashboardViewV2 />
        </>
      )}
      {activeTab === 'tasks' && <TasksOperationalView />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'habits' && <HabitsOperationalView />}
      {activeTab === 'finances' && <FinancesOperationalView />}
      {activeTab === 'library' && <LibraryOperationalView />}
      {activeTab === 'health' && <HealthOperationalView />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

const AppContent: React.FC = () => {
  const {
    isAICopilotOpen, closeAICopilot,
    isVoiceModalOpen, closeVoiceModal,
    isCalendarModalOpen, closeCalendarModal,
    isNotificationsModalOpen, closeNotificationsModal,
    appSettings, updateAppSettings,
    darkMode, toggleDarkMode,
  } = useLifeOS();

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', appSettings.primaryColor);
    document.documentElement.setAttribute('data-density', appSettings.uiDensity);
    document.documentElement.setAttribute('data-font', appSettings.fontFamily);
  }, [appSettings.primaryColor, appSettings.uiDensity, appSettings.fontFamily]);

  useEffect(() => {
    if (localStorage.getItem(PERSONAL_VISUAL_DEFAULTS_KEY) === 'done') return;

    // Wait until LifeOS has had a chance to hydrate saved settings before applying
    // this one-time personal environment decision. Future user changes are respected.
    const timer = window.setTimeout(() => {
      if (!darkMode) toggleDarkMode();
      if (appSettings.uiDensity !== 'compact') updateAppSettings({ uiDensity: 'compact' });
      localStorage.setItem(PERSONAL_VISUAL_DEFAULTS_KEY, 'done');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [appSettings.uiDensity, darkMode, toggleDarkMode, updateAppSettings]);

  return (
    <div className="lifeos-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white pb-[calc(5rem+env(safe-area-inset-bottom,0px))] relative overflow-x-hidden">
      <DailyAutomationBridge />
      <Navbar />
      <MainContent />
      <QuickCaptureModal />
      <ShiftCalibrationModal />
      <AICopilotModal isOpen={isAICopilotOpen} onClose={closeAICopilot} />
      <VoiceCommandModal isOpen={isVoiceModalOpen} onClose={closeVoiceModal} />
      <CommandPalette />
      <GoogleCalendarSyncModal isOpen={isCalendarModalOpen} onClose={closeCalendarModal} />
      <PushNotificationsModal isOpen={isNotificationsModalOpen} onClose={closeNotificationsModal} />
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
