import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../common/Icons';

export const Topbar = ({ onToggleSidebar, onOpenCommandPalette, lowStockItems = [], outOfStockItems = [] }) => {
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute readable page title from route
  const getPageTitle = () => {
    const path = location.pathname.replace(/^\//, '');
    if (!path || path === 'dashboard') return 'Dashboard Overview';
    if (path === 'products') return 'Products Catalog';
    if (path === 'categories') return 'Product Categories';
    if (path === 'inventory') return 'Stock Control & Reordering';
    if (path === 'suppliers') return 'Suppliers Directory';
    if (path === 'movements') return 'Stock Movement Audit';
    if (path === 'reports') return 'Analytics & Reports';
    if (path === 'settings') return 'System Settings';
    if (path === 'profile') return 'User Profile';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const totalAlerts = (lowStockItems.length || 0) + (outOfStockItems.length || 0);

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Icon name="menu" size={20} />
        </button>

        <div className="topbar-breadcrumb">
          <span className="breadcrumb-root">Apex</span>
          <span className="breadcrumb-sep">/</span>
          <h1 className="breadcrumb-current">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Search / Command Palette Trigger */}
        <button
          className="topbar-search-trigger"
          onClick={onOpenCommandPalette}
          title="Global Quick Search (Ctrl+K)"
        >
          <Icon name="search" size={15} className="text-muted" />
          <span className="search-trigger-text">Quick Search...</span>
          <kbd className="cmd-pill">Ctrl K</kbd>
        </button>

        {/* Quick Action Button */}
        <button
          className="topbar-quick-add"
          onClick={() => navigate('/products?action=add')}
          title="Add New Product"
        >
          <Icon name="plus" size={16} />
          <span className="quick-add-text">New Product</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="topbar-icon-btn theme-toggle-btn"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={20} className="theme-toggle-icon" />
        </button>

        {/* Notifications Dropdown */}
        <div className="topbar-dropdown-wrapper" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="topbar-icon-btn"
            aria-label="View notifications"
          >
            <Icon name="bell" size={20} />
            {totalAlerts > 0 && (
              <span className="notification-badge-pulse">{totalAlerts}</span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notifications-menu">
              <div className="notif-header">
                <span className="notif-title">Inventory Alerts</span>
                <span className="notif-count-pill">{totalAlerts} active</span>
              </div>

              <div className="notif-list">
                {outOfStockItems.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-title text-danger">● Critical Out of Stock</div>
                    {outOfStockItems.slice(0, 3).map(item => (
                      <Link
                        key={item.id}
                        to={`/inventory?highlight=${item.id}`}
                        className="notif-item danger"
                        onClick={() => setIsNotifOpen(false)}
                      >
                        <div className="notif-item-title">{item.name}</div>
                        <div className="notif-item-sub">SKU: {item.sku} | 0 units in stock</div>
                      </Link>
                    ))}
                  </div>
                )}

                {lowStockItems.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-title text-warning">▲ Low Stock Warning</div>
                    {lowStockItems.slice(0, 3).map(item => (
                      <Link
                        key={item.id}
                        to={`/inventory?highlight=${item.id}`}
                        className="notif-item warning"
                        onClick={() => setIsNotifOpen(false)}
                      >
                        <div className="notif-item-title">{item.name}</div>
                        <div className="notif-item-sub">Only {item.stock} left (Min: {item.minStock})</div>
                      </Link>
                    ))}
                  </div>
                )}

                {totalAlerts === 0 && (
                  <div className="notif-empty">
                    <Icon name="checkCircle" size={28} color="#10b981" />
                    <p>All stock levels are optimal!</p>
                  </div>
                )}
              </div>

              <div className="notif-footer">
                <Link
                  to="/inventory"
                  className="notif-view-all"
                  onClick={() => setIsNotifOpen(false)}
                >
                  Manage All Stock Levels →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="topbar-dropdown-wrapper" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(prev => !prev)}
            className="user-menu-trigger"
            aria-label="User profile options"
          >
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
              alt="Shrishti Verma"
              className="topbar-avatar"
            />
            <span className="topbar-user-name">Shrishti</span>
            <Icon name="chevronDown" size={14} className="user-arrow" />
          </button>

          {isProfileOpen && (
            <div className="user-dropdown-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">Shrishti Verma</div>
                <div className="user-menu-email">shrishtiverma107@gmail.com</div>
                <div className="user-menu-role-badge">Director of Operations</div>
              </div>

              <div className="user-menu-links">
                <Link
                  to="/profile"
                  className="user-menu-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Icon name="user" size={16} />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  className="user-menu-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Icon name="settings" size={16} />
                  <span>System Settings</span>
                </Link>

                <Link
                  to="/reports"
                  className="user-menu-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Icon name="barChart" size={16} />
                  <span>Executive Reports</span>
                </Link>
              </div>

              <div className="user-menu-divider"></div>

              <Link
                to="/home"
                className="user-menu-item"
                onClick={() => setIsProfileOpen(false)}
              >
                <Icon name="externalLink" size={16} />
                <span>Marketing Website</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
