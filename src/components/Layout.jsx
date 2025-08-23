import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useWarehouse } from '../hooks/useWarehouseContext';
import XPProgressBar from './XPProgressBar';
import AnimatedBackground from './AnimatedBackground';
import ChatWidget from './chat/ChatWidget';

const Layout = () => {
  const { user } = useWarehouse();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  // Check if we're on the picking page
  const isPickingPage = location.pathname === '/picking';

  return (
    <div className="relative min-h-screen">
      {/* Background - fixed for other pages, relative for picking */}
      <div className={isPickingPage ? "absolute inset-0 z-0" : "fixed inset-0 z-0"}>
        <AnimatedBackground />
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header - sticky for picking page, normal for others */}
        <div className={`glass-card border-b border-white/10 p-4 ${isPickingPage ? 'sticky top-0 z-50' : ''}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              {/* Logo and Brand - centered */}
              <button 
                onClick={handleLogoClick}
                className="flex flex-col items-center space-y-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-2">
                  <Package size={24} />
                </div>
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white">Arrowhead Polaris</h1>
                  <p className="text-xs text-gray-400">v6.0</p>
                </div>
              </button>
            </div>

            {/* XP Progress Bar - Hidden on Dashboard */}
            {location.pathname !== '/dashboard' && (
              <XPProgressBar 
                current={user?.xp || 0} 
                max={user?.xpToNextLevel || 1000} 
                level={user?.level || 1} 
              />
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className={isPickingPage ? "" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"}>
          <Outlet />
        </main>
      </div>

      {/* Chat Widget - Fixed Position */}
      <ChatWidget />
    </div>
  );
};

export default Layout;