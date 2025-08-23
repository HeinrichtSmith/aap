import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  Volume2, 
  Bell, 
  Eye, 
  Contrast, 
  Moon,
  Music,
  Save
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { playSound, initializeAudio } from '../utils/audio';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await initializeAudio();
      await playSound('success');
    } catch (error) {
      console.log('Audio error:', error);
    }
    updateSettings(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = async () => {
    try {
      await initializeAudio();
      await playSound('click');
    } catch (error) {
      console.log('Audio error:', error);
    }
    setLocalSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const handleHover = async () => {
    try {
      await initializeAudio();
      await playSound('hover');
    } catch (error) {
      console.log('Audio error:', error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="text-blue-400" size={32} />
                <h2 className="text-2xl font-bold text-white">User Settings</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                onMouseEnter={handleHover}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
            {/* Audio Settings */}
            <div className="bg-white/5 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Volume2 className="mr-2 text-blue-400" size={20} />
                Audio Settings
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Sound Effects</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSettingChange('soundEffects', !localSettings.soundEffects)}
                    onMouseEnter={handleHover}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localSettings.soundEffects ? 'bg-blue-500' : 'bg-gray-600'
                    } relative`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.soundEffects ? 26 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Background Music</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSettingChange('backgroundMusic', !localSettings.backgroundMusic)}
                    onMouseEnter={handleHover}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localSettings.backgroundMusic ? 'bg-blue-500' : 'bg-gray-600'
                    } relative`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.backgroundMusic ? 26 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Volume Level</span>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localSettings.volumeLevel}
                      onChange={(e) => handleSettingChange('volumeLevel', parseInt(e.target.value))}
                      className="w-32 accent-blue-500"
                    />
                    <span className="text-blue-400 font-mono w-12 text-right">{localSettings.volumeLevel}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white/5 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Bell className="mr-2 text-purple-400" size={20} />
                Notification Settings
              </h3>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Achievement Notifications</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSettingChange('achievementNotifications', !localSettings.achievementNotifications)}
                  onMouseEnter={handleHover}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localSettings.achievementNotifications ? 'bg-purple-500' : 'bg-gray-600'
                  } relative`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                    animate={{ x: localSettings.achievementNotifications ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </label>
            </div>

            {/* Display Settings */}
            <div className="bg-white/5 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Eye className="mr-2 text-green-400" size={20} />
                Display Settings
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Enhanced Visuals</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSettingChange('showAnimations', !localSettings.showAnimations)}
                    onMouseEnter={handleHover}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localSettings.showAnimations ? 'bg-green-500' : 'bg-gray-600'
                    } relative`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.showAnimations ? 26 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Dark Mode</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSettingChange('darkMode', !localSettings.darkMode)}
                    onMouseEnter={handleHover}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localSettings.darkMode ? 'bg-indigo-500' : 'bg-gray-600'
                    } relative`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.darkMode ? 26 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">High Contrast Mode</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSettingChange('highContrastMode', !localSettings.highContrastMode)}
                    onMouseEnter={handleHover}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localSettings.highContrastMode ? 'bg-yellow-500' : 'bg-gray-600'
                    } relative`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.highContrastMode ? 26 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              onMouseEnter={handleHover}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              onMouseEnter={handleHover}
              className={`px-6 py-2 rounded-xl transition-colors flex items-center space-x-2 ${
                hasChanges 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasChanges}
            >
              <Save size={18} />
              <span>Save Changes</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;