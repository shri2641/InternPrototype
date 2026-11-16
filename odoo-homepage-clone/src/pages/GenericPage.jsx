import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const GenericPage = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Create a readable title from the path
  const title = path
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' > ');

  return (
    <div className="generic-page-wrap">
      <div className="generic-page-card">
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
          {title || 'Module'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
          You have selected <strong>{title || 'this module'}</strong>. 
          The full modern <strong>Inventory Management System</strong> is now live with real-time stock control, analytics, and suppliers!
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            Open Inventory Dashboard →
          </Link>
          <Link to="/home" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GenericPage;
