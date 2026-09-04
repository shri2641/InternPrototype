import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h5>Community</h5>
          <ul>
            <li><Link to="/community/tutorials">Tutorials</Link></li>
            <li><Link to="/community/documentation">Documentation</Link></li>
            <li><Link to="/community/forum">Forum</Link></li>
            <li><Link to="/community/events">Events</Link></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Services</h5>
          <ul>
            <li><Link to="/services/partner">Find a Partner</Link></li>
            <li><Link to="/services/implementation">Implementation</Link></li>
            <li><Link to="/services/support">Support</Link></li>
            <li><Link to="/services/upgrades">Upgrades</Link></li>
            <li><Link to="/services/education">Education</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>About us</h5>
          <ul>
            <li><Link to="/about">Our company</Link></li>
            <li><Link to="/jobs">Jobs</Link></li>
            <li><Link to="/podcast">Podcast</Link></li>
            <li><Link to="/customers">Customers</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div className="footer-brand">
          <div className="navbar-brand" style={{color: '#fff'}}>
            <span className="logo-o" style={{color: '#fff'}}>o</span><span className="logo-doo" style={{color: '#fff'}}>doo</span>
          </div>
          <p>
            Odoo is a suite of open source business apps that cover all your company needs: CRM, eCommerce, accounting, inventory, point of sale, project management, etc.
          </p>
          <p>
            Odoo's unique value proposition is to be at the same time very easy to use and fully integrated.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 Odoo S.A. Clone</div>
        <div className="footer-bottom-links">
          <a href="#">English</a>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of service</Link>
          <Link to="/security">Security</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
