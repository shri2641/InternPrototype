import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../../services/api';
import Icon from './Icons';

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Load items for instant fuzzy search
      Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getCategories(),
        inventoryApi.getSuppliers()
      ]).then(([p, c, s]) => {
        setProducts(p || []);
        setCategories(c || []);
        setSuppliers(s || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  // Static navigation routes
  const navigationItems = [
    { title: 'Go to Dashboard', icon: 'dashboard', category: 'Navigation', action: () => navigate('/dashboard') },
    { title: 'Open Products Catalog', icon: 'package', category: 'Navigation', action: () => navigate('/products') },
    { title: 'Add New Product', icon: 'plus', category: 'Action', action: () => navigate('/products?action=add') },
    { title: 'Stock Control & Reorders', icon: 'boxes', category: 'Navigation', action: () => navigate('/inventory') },
    { title: 'Stock Movements Audit', icon: 'shoppingCart', category: 'Navigation', action: () => navigate('/movements') },
    { title: 'Suppliers Directory', icon: 'truck', category: 'Navigation', action: () => navigate('/suppliers') },
    { title: 'Executive Reports & Valuation', icon: 'barChart', category: 'Navigation', action: () => navigate('/reports') },
    { title: 'System Settings', icon: 'settings', category: 'Navigation', action: () => navigate('/settings') },
    { title: 'User Profile & Security', icon: 'user', category: 'Navigation', action: () => navigate('/profile') },
    { title: 'Marketing Landing Site', icon: 'externalLink', category: 'Navigation', action: () => navigate('/home') },
  ];

  // Filtered search results
  const q = query.trim().toLowerCase();

  const matchingNav = navigationItems.filter(item => 
    !q || item.title.toLowerCase().includes(q)
  );

  const matchingProducts = products.filter(p => 
    q && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  ).slice(0, 5).map(p => ({
    title: `${p.name} (${p.sku})`,
    sub: `${p.category} • ${p.stock} units in stock • $${p.price}`,
    icon: 'package',
    category: 'Product',
    action: () => navigate(`/inventory?highlight=${p.id}`)
  }));

  const matchingCategories = categories.filter(c =>
    q && c.name.toLowerCase().includes(q)
  ).slice(0, 3).map(c => ({
    title: `Category: ${c.name}`,
    sub: `${c.description || 'Browse category products'}`,
    icon: 'layers',
    category: 'Category',
    action: () => navigate(`/products?category=${c.id}`)
  }));

  const matchingSuppliers = suppliers.filter(s =>
    q && (s.name.toLowerCase().includes(q) || (s.contactPerson && s.contactPerson.toLowerCase().includes(q)))
  ).slice(0, 3).map(s => ({
    title: s.name,
    sub: `Contact: ${s.contactPerson || 'N/A'} • ${s.leadTimeDays || 7} days lead time`,
    icon: 'truck',
    category: 'Supplier',
    action: () => navigate('/suppliers')
  }));

  const allResults = [...matchingProducts, ...matchingCategories, ...matchingSuppliers, ...matchingNav];

  // Keyboard navigation (Arrow keys & Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => (idx + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => (idx - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        allResults[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div className="cmd-palette-box" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="cmd-input-row">
          <Icon name="search" size={20} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input-field"
            placeholder="Type a command, product SKU, supplier, or route..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="cmd-badge">ESC</kbd>
        </div>

        <div className="cmd-results-list">
          {allResults.length > 0 ? (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.category}-${item.title}-${idx}`}
                  className={`cmd-result-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-icon">
                    <Icon name={item.icon} size={18} />
                  </div>
                  <div className="cmd-item-text">
                    <div className="cmd-item-title">{item.title}</div>
                    {item.sub && <div className="cmd-item-sub">{item.sub}</div>}
                  </div>
                  <span className="cmd-item-cat-badge">{item.category}</span>
                </div>
              );
            })
          ) : (
            <div className="cmd-empty-state">
              <Icon name="search" size={28} />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵ Enter</kbd></span>
          <span>Close with <kbd>ESC</kbd></span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
