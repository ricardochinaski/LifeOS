import { useCallback } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { AppCustomSettings } from '../../types';

const SETTINGS_KEY = 'lifeos_custom_settings';

const DEFAULT_SETTINGS: AppCustomSettings = {
  primaryColor: 'emerald',
  uiDensity: 'comfortable',
  fontFamily: 'sans',
  currency: 'CLP',
  autoSyncCloud: true,
  soundEffects: true,
  startOfWeek: 1,
};

export const useAppSettings = () => {
  const { showToast } = useLifeOS();

  const getSettings = useCallback((): AppCustomSettings => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SETTINGS;
  }, []);

  const saveSettings = useCallback((partial: Partial<AppCustomSettings>) => {
    const current = getSettings();
    const updated = { ...current, ...partial };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
    
    // Apply visual changes immediately
    if (partial.primaryColor) {
      document.documentElement.setAttribute('data-accent', partial.primaryColor);
    }
    if (partial.uiDensity) {
      document.documentElement.setAttribute('data-density', partial.uiDensity);
    }
    if (partial.fontFamily) {
      document.documentElement.setAttribute('data-font', partial.fontFamily);
    }
    
    showToast('Preferencias guardadas');
    return updated;
  }, [getSettings, showToast]);

  const resetSettings = useCallback(() => {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (e) {}
    showToast('Configuración restaurada a valores por defecto');
    window.location.reload();
  }, [showToast]);

  return {
    settings: getSettings(),
    saveSettings,
    resetSettings,
    DEFAULT_SETTINGS,
  };
};