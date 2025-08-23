import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Trophy, 
  Activity, 
  Settings, 
  Star, 
  Clock, 
  Award,
  Target,
  TrendingUp,
  Calendar,
  Package,
  Zap,
  Crown,
  Edit3,
  Save,
  Camera
} from 'lucide-react';
import GameIcon from './GameIcon';
import AnimatedCounter from './AnimatedCounter';
import { useWarehouse } from '../hooks/useWarehouseContext';
import { useSettings } from '../hooks/useSettings';
import { playSound, initializeAudio } from '../utils/audio';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, updateUser, playSound } = useWarehouse();
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user || {});

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    try {
      await initializeAudio();
      await playSound('success');
    } catch (error) {
      console.log('Audio error:', error);
    }
    updateUser(editedUser);
    setIsEditing(false);
  };

  const handleCancel = async () => {
    try {
      await initializeAudio();
      await playSound('click');
    } catch (error) {
      console.log('Audio error:', error);
    }
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleTabChange = async (tab) => {
    try {
      await initializeAudio();
      await playSound('click');
    } catch (error) {
      console.log('Audio error:', error);
    }
    setActiveTab(tab);
  };

  const handleCloseWithSound = async () => {
    try {
      await initializeAudio();
      await playSound('click');
    } catch (error) {
      console.log('Audio error:', error);
    }
    onClose();
  };

  const handleEditWithSound = async () => {
    try {
      await initializeAudio();
      await playSound('click');
    } catch (error) {
      console.log('Audio error:', error);
    }
    setIsEditing(true);
  };

  const handleHover = async () => {
    try {
      await initializeAudio();
      await playSound('hover');
    } catch (error) {
      console.log('Audio error:', error);
    }
  };

  const getUserTier = (level) => {
    if (level >= 50) return 'cosmic';
    if (level >= 25) return 'mega';
    if (level >= 15) return 'super';
    if (level >= 8) return 'standard';
    return 'normal';
  };

  const getTierName = (tier) => {
    switch(tier) {
      case 'cosmic': return 'Cosmic Legend';
      case 'mega': return 'Mega Master';
      case 'super': return 'Super Operator';
      case 'standard': return 'Standard Worker';
      default: return 'Novice';
    }
  };

  const calculateTotalXP = () => {
    return (user.level - 1) * 1000 + user.xp;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleCloseWithSound}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotateY: 15 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="relative"
                >
                  <GameIcon
                    iconType="trophy"
                    actualQuantity={user.level}
                    size={80}
                    iconSize="large"
                  />
                  <motion.div 
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Lvl {user.level}
                  </motion.div>
                </motion.div>
                
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editedUser.name || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                        className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 text-white outline-none"
                      />
                      <input
                        type="text"
                        value={editedUser.role || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                        className="text-lg bg-transparent border-b border-gray-500 text-gray-300 outline-none"
                        placeholder="Role"
                      />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-3xl font-bold text-white flex items-center">
                        {user.name}
                        <span className="text-4xl ml-3">{user.avatar}</span>
                      </h1>
                      <p className="text-gray-300 text-lg">{user.role || 'Warehouse Operator'} - {user.department || 'Warehouse'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Crown className="text-yellow-400" size={16} />
                        <span className="text-yellow-300 font-medium">
                          {getTierName(getUserTier(user.level))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      onMouseEnter={handleHover}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancel}
                      onMouseEnter={handleHover}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEditWithSound}
                    onMouseEnter={handleHover}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <Edit3 size={16} />
                    <span>Edit</span>
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseWithSound}
                  onMouseEnter={handleHover}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Level {user.level} Progress</span>
                <span className="text-sm text-blue-400 font-bold">
                  {user.xp} / {user.xpToNextLevel} XP
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((user.xp / user.xpToNextLevel) * 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <div className="flex">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange(tab.id)}
                  onMouseEnter={handleHover}
                  className={`flex-1 px-6 py-4 text-center transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 p-6 rounded-2xl text-center">
                      <div className="flex justify-center mb-3">
                        <GameIcon iconType="trophy" actualQuantity={user.level} size={50} iconSize="medium" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        <AnimatedCounter target={user.level} duration={1000} />
                      </h3>
                      <p className="text-gray-400">Current Level</p>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-2xl text-center">
                      <div className="flex justify-center mb-3">
                        <Zap className="text-yellow-400" size={50} />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        <AnimatedCounter target={calculateTotalXP()} duration={1500} />
                      </h3>
                      <p className="text-gray-400">Total XP</p>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl text-center">
                      <div className="flex justify-center mb-3">
                        <Star className="text-purple-400" size={50} />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        <AnimatedCounter target={user.stats?.ordersProcessed || 0} duration={1200} />
                      </h3>
                      <p className="text-gray-400">Orders Completed</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white/5 p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Activity className="mr-2 text-blue-400" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {user.role === 'Picker' && (
                        <>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Package className="text-green-400" size={16} />
                              </div>
                              <span className="text-gray-300">Picked {user.stats?.itemsPicked || 0} items total</span>
                            </div>
                            <span className="text-gray-500 text-sm">Lifetime</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Target className="text-blue-400" size={16} />
                              </div>
                              <span className="text-gray-300">{user.stats?.accuracy || 0}% Accuracy Rate</span>
                            </div>
                            <span className="text-gray-500 text-sm">Current</span>
                          </div>
                        </>
                      )}
                      {user.role === 'Packer' && (
                        <>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <Package className="text-purple-400" size={16} />
                              </div>
                              <span className="text-gray-300">Packed {user.stats?.itemsPacked || 0} items</span>
                            </div>
                            <span className="text-gray-500 text-sm">Lifetime</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Clock className="text-green-400" size={16} />
                              </div>
                              <span className="text-gray-300">Avg pack time: {user.stats?.averagePackTime || 0}s</span>
                            </div>
                            <span className="text-gray-500 text-sm">Current</span>
                          </div>
                        </>
                      )}
                      {user.role === 'Receiver' && (
                        <>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                <Package className="text-cyan-400" size={16} />
                              </div>
                              <span className="text-gray-300">Received {user.stats?.itemsReceived || 0} items</span>
                            </div>
                            <span className="text-gray-500 text-sm">Lifetime</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                <Calendar className="text-yellow-400" size={16} />
                              </div>
                              <span className="text-gray-300">{user.stats?.purchaseOrdersReceived || 0} POs processed</span>
                            </div>
                            <span className="text-gray-500 text-sm">Total</span>
                          </div>
                        </>
                      )}
                      {(user.role === 'Admin' || user.role === 'Manager') && (
                        <>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Package className="text-green-400" size={16} />
                              </div>
                              <span className="text-gray-300">Processed {user.stats?.ordersProcessed || 0} orders</span>
                            </div>
                            <span className="text-gray-500 text-sm">Lifetime</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Trophy className="text-blue-400" size={16} />
                              </div>
                              <span className="text-gray-300">Team Leader - Level {user.level}</span>
                            </div>
                            <span className="text-gray-500 text-sm">Current</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                      <Clock className="mx-auto mb-2 text-blue-400" size={32} />
                      <p className="text-xl font-bold">{user.stats?.averagePickTime || 45}s</p>
                      <p className="text-xs text-gray-400">Avg Pick Time</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                      <Target className="mx-auto mb-2 text-green-400" size={32} />
                      <p className="text-xl font-bold">{user.stats?.accuracy || 98}%</p>
                      <p className="text-xs text-gray-400">Accuracy</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                      <Package className="mx-auto mb-2 text-purple-400" size={32} />
                      <p className="text-xl font-bold">{user.stats?.itemsPicked || 1247}</p>
                      <p className="text-xs text-gray-400">Items Picked</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                      <TrendingUp className="mx-auto mb-2 text-yellow-400" size={32} />
                      <p className="text-xl font-bold">{user.stats?.averagePackTime ? Math.round((120 / user.stats.averagePackTime) * 100) : user.stats?.averagePickTime ? Math.round((50 / user.stats.averagePickTime) * 100) : 100}%</p>
                      <p className="text-xs text-gray-400">Efficiency</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30">
                      <div className="flex items-center space-x-3">
                        <Award className="text-yellow-400" size={32} />
                        <div>
                          <h4 className="font-semibold text-white">Speed Demon</h4>
                          <p className="text-sm text-gray-300">Complete 100 picks in under 30 seconds each</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
                      <div className="flex items-center space-x-3">
                        <Crown className="text-purple-400" size={32} />
                        <div>
                          <h4 className="font-semibold text-white">Accuracy Expert</h4>
                          <p className="text-sm text-gray-300">Maintain 99% accuracy for 50 orders</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="font-semibold mb-2">Audio Settings</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Sound effects</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                            onMouseEnter={handleHover}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings.soundEffects ? 'bg-blue-500' : 'bg-gray-600'
                            } relative`}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                              animate={{ x: settings.soundEffects ? 26 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Background music</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSettings({ backgroundMusic: !settings.backgroundMusic })}
                            onMouseEnter={handleHover}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings.backgroundMusic ? 'bg-blue-500' : 'bg-gray-600'
                            } relative`}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                              animate={{ x: settings.backgroundMusic ? 26 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Volume</span>
                          <div className="flex items-center space-x-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.volumeLevel}
                              onChange={(e) => updateSettings({ volumeLevel: parseInt(e.target.value) })}
                              className="w-24 accent-blue-500"
                            />
                            <span className="text-blue-400 font-mono w-12 text-right">{settings.volumeLevel}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="font-semibold mb-2">Notification Preferences</h4>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Achievement notifications</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSettings({ achievementNotifications: !settings.achievementNotifications })}
                            onMouseEnter={handleHover}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings.achievementNotifications ? 'bg-purple-500' : 'bg-gray-600'
                            } relative`}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                              animate={{ x: settings.achievementNotifications ? 26 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </label>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="font-semibold mb-2">Display Settings</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Enhanced Visuals</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSettings({ showAnimations: !settings.showAnimations })}
                            onMouseEnter={handleHover}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings.showAnimations ? 'bg-green-500' : 'bg-gray-600'
                            } relative`}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                              animate={{ x: settings.showAnimations ? 26 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">Dark mode</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                            onMouseEnter={handleHover}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings.darkMode ? 'bg-indigo-500' : 'bg-gray-600'
                            } relative`}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                              animate={{ x: settings.darkMode ? 26 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-gray-300">High contrast mode</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateSettings({ highContrastMode: !settings.highContrastMode })}
                            onMouseEnter={handleHover}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings.highContrastMode ? 'bg-yellow-500' : 'bg-gray-600'
                            } relative`}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                              animate={{ x: settings.highContrastMode ? 26 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfile;
