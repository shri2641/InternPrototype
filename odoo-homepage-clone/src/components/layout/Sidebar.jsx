import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Icon from '../common/Icons';

export const Sidebar = ({ isOpen, onClose, lowStockCount = 0, isMobile = false }) => {
  const coreItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Products', path: '/products', icon: 'package' },
    { name: 'Categories', path: '/categories', icon: 'layers' },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: 'boxes',
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'warning'
    },
  ];

  const supplyItems = [
    { name: 'Suppliers', path: '/suppliers', icon: 'truck' },
    { name: 'Stock Movements', path: '/movements', icon: 'shoppingCart' },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: 'purchase' },
    { name: 'Reports', path: '/reports', icon: 'barChart' },
  ];

  const advancedItems = [
    { name: 'Warehouses', path: '/warehouses', icon: 'warehouse' },
    { name: 'Safety & QC', path: '/safety', icon: 'shieldCheck' },
  ];

  const systemItems = [
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'User Profile', path: '/profile', icon: 'user' },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        {/* Brand header */}
        <div className="sidebar-brand-header">
          <Link to="/dashboard" className="sidebar-brand-link" onClick={handleNavClick}>
            <div className="brand-logo-icon" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              <Icon name="package" size={24} color="#fff" />
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">Apex<span className="brand-accent">Inventory</span></span>
              <span className="brand-badge">SaaS v2.4</span>
            </div>
          </Link>

          {isMobile && (
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Management</div>
          <ul className="nav-list">
            {coreItems.map(item => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon name={item.icon} size={20} className="nav-icon" />
                  <span className="nav-link-text">{item.name}</span>
                  {item.badge && (
                    <span className={`nav-badge ${item.badgeColor || 'primary'}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-section-title">Supply & Analytics</div>
          <ul className="nav-list">
            {supplyItems.map(item => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon name={item.icon} size={20} className="nav-icon" />
                  <span className="nav-link-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-section-title">Advanced Operations</div>
          <ul className="nav-list">
            {advancedItems.map(item => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon name={item.icon} size={20} className="nav-icon" />
                  <span className="nav-link-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-section-title">System & Account</div>
          <ul className="nav-list">
            {systemItems.map(item => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon name={item.icon} size={20} className="nav-icon" />
                  <span className="nav-link-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer Link to Marketing Home */}
        <div className="sidebar-footer">
          <Link to="/home" className="website-link-btn" title="View Marketing Site">
            <Icon name="externalLink" size={16} />
            <span>Marketing Landing</span>
          </Link>

          <div className="user-profile-preview">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
              alt="Shrishti Verma"
              className="user-avatar-img"
            />
            <div className="user-info-text">
              <span className="user-name">Shrishti Verma</span>
              <span className="user-role">Inventory Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
