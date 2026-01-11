import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { playSound as utilsPlaySound } from '../utils/audio';
import api from '../services/api';

const WarehouseContext = createContext();

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within WarehouseProvider');
  }
  return context;
};

export const WarehouseProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickedOrders, setPickedOrders] = useState([]);
  const [packedOrders, setPackedOrders] = useState([]);
  const [availablePickingOrders, setAvailablePickingOrders] = useState([]);

  // Load available orders from API when user is logged in
  useEffect(() => {
    if (!user) return;
    
    const loadOrders = async () => {
      try {
        const orders = await api.orders.getAvailable();
        setAvailablePickingOrders(orders);
      } catch (error) {
        console.error('Failed to load orders:', error);
        setAvailablePickingOrders([]);
      }
    };
    
    loadOrders();
  }, [user]);

  // Load picked orders from API (backend is single source of truth)
  useEffect(() => {
    if (!user) return;
    
    const loadPickedOrders = async () => {
      try {
        const orders = await api.orders.getByStatus('READY_TO_PACK');
        setPickedOrders(orders);
      } catch (error) {
        console.error('Failed to load picked orders:', error);
        setPickedOrders([]);
      }
    };
    
    loadPickedOrders();
  }, [user]);

  // Load packed orders from API (backend is single source of truth)
  useEffect(() => {
    if (!user) return;
    
    const loadPackedOrders = async () => {
      try {
        const orders = await api.orders.getByStatus('PACKED');
        setPackedOrders(orders);
      } catch (error) {
        console.error('Failed to load packed orders:', error);
        setPackedOrders([]);
      }
    };
    
    loadPackedOrders();
  }, [user]);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth functions
  const login = async (email, password) => {
    try {
      // Use backend API for login
      const response = await api.auth.login(email, password);
      
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        utilsPlaySound('success');
        toast.success(`Welcome back, ${response.user.name}!`);
        navigate('/dashboard');
        return true;
      } else {
        utilsPlaySound('error');
        toast.error('Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      utilsPlaySound('error');
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
      return false;
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Achievement Management
  const unlockAchievement = async (achievementId) => {
    if (!user || user.achievements.includes(achievementId)) return;

    try {
      const achievementsData = await import('../data/achievements.json');
      const achievement = achievementsData.achievements.find(a => a.id === achievementId);

      if (achievement) {
        const newUser = {
          ...user,
          achievements: [...user.achievements, achievementId]
        };

        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        utilsPlaySound('confetti');
        toast.success(
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{achievement.icon}</span>
            <div>
              <p className="font-bold">Achievement Unlocked!</p>
              <p className="text-sm">{achievement.name}</p>
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Achievement unlock error:', error);
    }
  };

  // Notification Management
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 10));
  };

  // Stats Update
  const updateStats = (statUpdate) => {
    if (!user) return;

    const newUser = {
      ...user,
      stats: {
        ...user.stats,
        ...statUpdate
      }
    };

    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  // Persist picked orders to localStorage
  const persistPickedOrders = (orders) => {
    setPickedOrders(orders);
    localStorage.setItem('warehouse_pickedOrders', JSON.stringify(orders));
  };

  // Persist packed orders to localStorage
  const persistPackedOrders = (orders) => {
    setPackedOrders(orders);
    localStorage.setItem('warehouse_packedOrders', JSON.stringify(orders));
  };

  // Persist available orders to localStorage
  const persistAvailableOrders = (orders) => {
    setAvailablePickingOrders(orders);
    localStorage.setItem('warehouse_availableOrders', JSON.stringify(orders));
  };

  const value = {
    user,
    loading,
    notifications,
    activeOrder,
    setActiveOrder,
    pickedOrders,
    setPickedOrders: persistPickedOrders,
    packedOrders,
    setPackedOrders: persistPackedOrders,
    availablePickingOrders,
    setAvailablePickingOrders: persistAvailableOrders,
    login,
    logout,
    playSound: utilsPlaySound,
    unlockAchievement,
    addNotification,
    updateStats,
    updateUser: (newUser) => {
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};