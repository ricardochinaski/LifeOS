import React, { useEffect, useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { isNative } from '../../lib/native';
import {
  loadDailyAutomationSettings,
  syncDailyAutomationNotifications,
} from '../../utils/notifications';

export const DailyAutomationBridge: React.FC = () => {
  const { tasks, habits, habitLogs, shiftConfig } = useLifeOS();
  const [settingsRevision, setSettingsRevision] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSettingsChange = () => setSettingsRevision((value) => value + 1);
    window.addEventListener('lifeos:daily-automation-changed', handleSettingsChange);
    return () => window.removeEventListener('lifeos:daily-automation-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    if (!isNative()) return;

    const timer = window.setTimeout(async () => {
      try {
        const settings = await loadDailyAutomationSettings();
        await syncDailyAutomationNotifications({
          tasks,
          habits,
          habitLogs,
          shiftConfig,
          settings,
        });
      } catch (error) {
        console.error('Daily automation reconciliation failed:', error);
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [tasks, habits, habitLogs, shiftConfig, settingsRevision]);

  return null;
};
