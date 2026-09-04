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
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '4rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🚧</div>
        <h1 style={{fontSize: '2rem', color: '#212529', marginBottom: '1rem', fontFamily: '"Inter", sans-serif'}}>
          {title || 'Page'}
        </h1>
        <p style={{color: '#6c757d', marginBottom: '2rem', fontSize: '1.1rem'}}>
          This module is part of the Odoo suite but is currently under construction in this clone. 
          Check back later for full functionality!
        </p>
        <Link to="/" className="btn btn-primary" style={{padding: '0.75rem 2rem'}}>
          Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default GenericPage;
