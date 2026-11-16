import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from '../common/Toast';
import CommandPalette from '../common/CommandPalette';
import { inventoryApi, syncOfflineCache } from '../../services/api';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect mobile screen width
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch summary data for alerts
  const loadAlerts = async () => {
    try {
      const res = await inventoryApi.getDashboardSummary();
      setSummary(res);
      syncOfflineCache();
    } catch (err) {
      console.warn('Could not load summary for layout:', err);
    }
  };

  useEffect(() => {
    loadAlerts();
    // Poll alerts every 30s
    const timer = setInterval(loadAlerts, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={(summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0)}
        isMobile={isMobile}
      />

      <div className={`app-main-viewport ${!sidebarOpen && !isMobile ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenCommandPalette={() => setIsCmdOpen(true)}
          lowStockItems={summary?.lowStockItems || []}
          outOfStockItems={summary?.outOfStockItems || []}
        />

        <main className="app-content-area">
          <Outlet context={{ summary, refreshSummary: loadAlerts }} />
        </main>
      </div>

      <Toast />
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
    </div>
  );
};

export default AppLayout;
