import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Icon from './common/Icons';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openDropdown, setOpenDropdown] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  const handleLinkClick = (e, link) => {
    if (['Apps', 'Industries', 'Community'].includes(link)) {
      e.preventDefault();
      setOpenDropdown(openDropdown === link ? null : link);
    } else {
      setOpenDropdown(null);
    }
  };

  const getActiveClass = (path) => {
    return currentPath === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/home" onClick={() => setOpenDropdown(null)}>
          <span className="logo-o">o</span><span className="logo-doo">doo</span>
        </Link>
      </div>
      
      <div className="navbar-right">
        <ul className="navbar-nav">
          <li className={`nav-item dropdown ${openDropdown === 'Apps' ? 'open' : ''}`}>
            <a href="#" className={`nav-link ${openDropdown === 'Apps' ? 'active' : ''}`} onClick={(e) => handleLinkClick(e, 'Apps')}>Apps</a>
            <div className="dropdown-menu">
              <div>
                <div className="dropdown-col-title">Supply Chain (Live)</div>
                <Link to="/dashboard" className="dropdown-item highlight-item" onClick={() => setOpenDropdown(null)}>
                  <strong>⚡ Inventory Dashboard</strong>
                </Link>
                <Link to="/products" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Products Catalog</Link>
                <Link to="/inventory" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Stock Control</Link>
                <Link to="/movements" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Stock Movements</Link>
                <Link to="/suppliers" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Suppliers</Link>
                <Link to="/reports" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Reports & Analytics</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Finance</div>
                <Link to="/app/accounting" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Accounting</Link>
                <Link to="/app/invoicing" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Invoicing</Link>
                <Link to="/app/expenses" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Expenses</Link>
                <Link to="/app/spreadsheet" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Spreadsheet (BI)</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Sales</div>
                <Link to="/app/crm" className="dropdown-item" onClick={() => setOpenDropdown(null)}>CRM</Link>
                <Link to="/app/sales" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Sales</Link>
                <Link to="/app/pos-shop" className="dropdown-item" onClick={() => setOpenDropdown(null)}>POS Shop</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Websites</div>
                <Link to="/app/website-builder" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Website Builder</Link>
                <Link to="/app/ecommerce" className="dropdown-item" onClick={() => setOpenDropdown(null)}>eCommerce</Link>
              </div>
            </div>
          </li>
          
          <li className={`nav-item dropdown ${openDropdown === 'Industries' ? 'open' : ''}`}>
            <a href="#" className={`nav-link ${openDropdown === 'Industries' ? 'active' : ''}`} onClick={(e) => handleLinkClick(e, 'Industries')}>Industries</a>
            <div className="dropdown-menu" style={{gridTemplateColumns: 'repeat(2, 1fr)', width: '400px'}}>
              <div>
                <div className="dropdown-col-title">Services</div>
                <Link to="/industry/it-services" className="dropdown-item" onClick={() => setOpenDropdown(null)}>IT Services</Link>
                <Link to="/industry/consulting" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Consulting</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Retail & Mfg</div>
                <Link to="/industry/retail" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Retail</Link>
                <Link to="/industry/manufacturing" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Manufacturing</Link>
              </div>
            </div>
          </li>
          
          <li className="nav-item">
            <Link to="/pricing" className={`nav-link ${getActiveClass('/pricing')}`} onClick={() => setOpenDropdown(null)}>Pricing</Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className={`nav-link ${getActiveClass('/contact')}`} onClick={() => setOpenDropdown(null)}>Contact</Link>
          </li>
        </ul>
        
        <div className="navbar-actions">
          {/* Theme toggle in navbar */}
          <button
            onClick={toggleTheme}
            className="navbar-theme-toggle"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={18} />
          </button>

          <Link to="/dashboard" className="btn btn-primary nav-dashboard-btn">
            Open Inventory SaaS →
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
