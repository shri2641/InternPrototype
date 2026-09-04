import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openDropdown, setOpenDropdown] = useState(null);

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
        <Link to="/" onClick={() => setOpenDropdown(null)}>
          <span className="logo-o">o</span><span className="logo-doo">doo</span>
        </Link>
      </div>
      
      <div className="navbar-right">
        <ul className="navbar-nav">
          <li className={`nav-item dropdown ${openDropdown === 'Apps' ? 'open' : ''}`}>
            <a href="#" className={`nav-link ${openDropdown === 'Apps' ? 'active' : ''}`} onClick={(e) => handleLinkClick(e, 'Apps')}>Apps</a>
            <div className="dropdown-menu">
              <div>
                <div className="dropdown-col-title">Finance</div>
                <Link to="/app/accounting" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Accounting</Link>
                <Link to="/app/invoicing" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Invoicing</Link>
                <Link to="/app/expenses" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Expenses</Link>
                <Link to="/app/spreadsheet" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Spreadsheet (BI)</Link>
                <Link to="/app/documents" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Documents</Link>
                <Link to="/app/sign" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Sign</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Sales</div>
                <Link to="/app/crm" className="dropdown-item" onClick={() => setOpenDropdown(null)}>CRM</Link>
                <Link to="/app/sales" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Sales</Link>
                <Link to="/app/pos-shop" className="dropdown-item" onClick={() => setOpenDropdown(null)}>POS Shop</Link>
                <Link to="/app/pos-restaurant" className="dropdown-item" onClick={() => setOpenDropdown(null)}>POS Restaurant</Link>
                <Link to="/app/subscriptions" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Subscriptions</Link>
                <Link to="/app/rental" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Rental</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Websites</div>
                <Link to="/app/website-builder" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Website Builder</Link>
                <Link to="/app/ecommerce" className="dropdown-item" onClick={() => setOpenDropdown(null)}>eCommerce</Link>
                <Link to="/app/blog" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Blog</Link>
                <Link to="/app/forum" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Forum</Link>
                <Link to="/app/elearning" className="dropdown-item" onClick={() => setOpenDropdown(null)}>eLearning</Link>
                <Link to="/app/live-chat" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Live Chat</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Supply Chain</div>
                <Link to="/app/inventory" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Inventory</Link>
                <Link to="/app/manufacturing" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Manufacturing</Link>
                <Link to="/app/purchase" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Purchase</Link>
                <Link to="/app/maintenance" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Maintenance</Link>
                <Link to="/app/quality" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Quality</Link>
                <Link to="/app/plm" className="dropdown-item" onClick={() => setOpenDropdown(null)}>PLM</Link>
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
                <Link to="/industry/agencies" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Agencies</Link>
              </div>
              <div>
                <div className="dropdown-col-title">Retail & Mfg</div>
                <Link to="/industry/retail" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Retail</Link>
                <Link to="/industry/manufacturing" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Manufacturing</Link>
                <Link to="/industry/wholesale" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Wholesale</Link>
              </div>
            </div>
          </li>
          
          <li className={`nav-item dropdown ${openDropdown === 'Community' ? 'open' : ''}`}>
            <a href="#" className={`nav-link ${openDropdown === 'Community' ? 'active' : ''}`} onClick={(e) => handleLinkClick(e, 'Community')}>Community</a>
            <div className="dropdown-menu" style={{gridTemplateColumns: '1fr', width: '250px'}}>
              <div>
                <Link to="/community/tutorials" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Tutorials</Link>
                <Link to="/community/documentation" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Documentation</Link>
                <Link to="/community/forum" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Forum</Link>
                <Link to="/community/certification" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Certification</Link>
                <Link to="/community/events" className="dropdown-item" onClick={() => setOpenDropdown(null)}>Odoo Events</Link>
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
          <Link to="/login" className="nav-link" style={{fontWeight: '400'}}>Sign in</Link>
          <Link to="/trial" className="btn btn-primary">Try it free</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
