import { useState, useEffect, createContext, useContext } from 'react';
import { updateMasterVolume } from '../utils/audio';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('warehouseSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      soundEffects: true,
      achievementNotifications: true,
      showAnimations: false,
      highContrastMode: false,
      darkMode: true,
      backgroundMusic: false,
      volumeLevel: 75
    };
  });

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('warehouseSettings', JSON.stringify(updatedSettings));

    // Apply settings immediately
    applySettings(updatedSettings);

    // Update audio volume if volume setting changed
    if ('volumeLevel' in newSettings || 'soundEffects' in newSettings) {
      updateMasterVolume(updatedSettings.volumeLevel || 75);
    }
  };

  const applySettings = (settings) => {
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply animations
    if (!settings.showAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const value = {
    settings,
    updateSettings,
    applySettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
