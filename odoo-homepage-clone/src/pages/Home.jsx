import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          All your business on <span className="highlight-orange">one platform.</span>
        </h1>
        <h2 className="hero-subtitle">
          Simple, efficient, yet <span className="highlight-blue">affordable!</span>
        </h2>
        
        <div className="hero-actions">
          <Link to="/trial" className="btn btn-primary btn-hero">Start now - It's free</Link>
          <Link to="/contact" className="btn btn-secondary btn-hero">Meet an advisor</Link>
        </div>
        
        <div style={{ position: 'relative', display: 'inline-block', marginTop: '2rem' }}>
          <div className="hero-pricing-tag">
            <svg className="hero-arrow" width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10,20 Q40,10 80,70" />
              <path d="M60,65 L80,70 L70,50" />
            </svg>
            <div className="hero-pricing-text">580.00 Rs / month</div>
            <div className="hero-pricing-sub">for ALL apps</div>
          </div>
        </div>
      </div>
      <div className="hero-curve-wrapper">
        <div className="hero-curve"></div>
      </div>
    </section>
  );
};

const KanbanBoard = () => {
  const initialCards = [
    { id: 'c1', col: 'qualified', title: 'B&B 6 months supply', price: '3,000.00 €', customer: 'Bella Ciao B&B', tag: 'Long term', tagClass: 'tag-purple', icon: '📞' },
    { id: 'c2', col: 'qualified', title: 'Regular supply for a foodtruck', price: '2,000.00 €', customer: 'Waffles on Wheels', tag: 'Long term', tagClass: 'tag-purple', icon: '🗄️' },
    { id: 'c3', col: 'qualified', title: 'Yoga studio 3 months supply', price: '1,000.00 €', customer: 'Inner Peace', tag: 'Long term', tagClass: 'tag-purple', icon: '✉️' },
    { id: 'c4', col: 'proposition', title: 'New cafe partnership in Paris', price: '3,000.00 €', customer: "Fiona's Floral Cafe", tag: 'Long term', tagClass: 'tag-purple', icon: '👥' },
    { id: 'c5', col: 'proposition', title: '20kg catering business', price: '400.00 €', customer: "Clara's Catering", tag: 'New client', tagClass: 'tag-orange', icon: '📦' },
    { id: 'c6', col: 'proposition', title: 'Regular supply for a resto', price: '1,500.00 €', customer: "Zuza's Zitti", tag: 'Long term', tagClass: 'tag-purple', icon: '📞' },
    { id: 'c7', col: 'won', title: '20kg for a cafe', price: '300.00 €', customer: "Fiona's Floral Cafe", tag: 'New client', tagClass: 'tag-orange', icon: '📞' },
    { id: 'c8', col: 'won', title: '20kg variety', price: '350.00 €', customer: 'Waffles on Wheels', tag: 'New client', tagClass: 'tag-orange', icon: '⏱️' },
  ];

  const [cards, setCards] = useState(initialCards);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('cardId', id);
  };

  const handleDrop = (e, col) => {
    const cardId = e.dataTransfer.getData('cardId');
    setCards(cards.map(c => c.id === cardId ? { ...c, col } : c));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const columns = [
    { id: 'qualified', title: 'Qualified', amount: '9000' },
    { id: 'proposition', title: 'Proposition', amount: '400' },
    { id: 'won', title: 'Won', amount: '650' }
  ];

  return (
    <section className="kanban-section">
      <div className="hero-content">
        <h2 className="kanban-title">
          <span className="highlight-pink">Level up</span> your quality of <span className="highlight-underline">work</span>
        </h2>
      </div>
      
      <div className="kanban-container">
        {columns.map(col => (
          <div 
            key={col.id} 
            className={`kanban-column ${col.id === 'proposition' ? 'highlighted' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="kanban-header">
              <div className="kanban-header-title">
                <span>{col.title}</span>
                <span style={{color: '#adb5bd', cursor: 'pointer'}}>+</span>
              </div>
              <div className="kanban-progress">
                <div className="progress-green" style={{width: '60%'}}></div>
                <div className="progress-red" style={{width: col.id === 'proposition' ? '40%' : '20%'}}></div>
              </div>
              <div className="kanban-amount">{col.amount}</div>
            </div>
            
            <div className="kanban-cards">
              {cards.filter(c => c.col === col.id).map(card => (
                <div 
                  key={card.id} 
                  className="kanban-card" 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, card.id)}
                >
                  <div className="card-title">{card.title}</div>
                  <div className="card-price">{card.price}</div>
                  <div className="card-customer">{card.customer}</div>
                  <div className="card-footer">
                    <div className="card-tags-wrapper">
                      <span className={`card-tag ${card.tagClass}`}>{card.tag}</span>
                      <div className="card-meta">
                        {'★'.repeat(3)} <span style={{fontSize:'0.9rem', marginLeft:'4px'}}>{card.icon}</span>
                      </div>
                    </div>
                    <img src={`https://i.pravatar.cc/150?u=${card.id}`} className="card-avatar" alt="avatar" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const AppShowcase = () => {
  const apps = [
    { category: 'Finance', items: [
      { name: 'Accounting', path: '/app/accounting', desc: 'Manage your finances', icon: '📊' },
      { name: 'Invoicing', path: '/app/invoicing', desc: 'Get paid faster', icon: '🧾' },
      { name: 'Expenses', path: '/app/expenses', desc: 'Track employee expenses', icon: '💸' },
    ]},
    { category: 'Sales', items: [
      { name: 'CRM', path: '/app/crm', desc: 'Track leads and close opportunities', icon: '🤝' },
      { name: 'Sales', path: '/app/sales', desc: 'Send polished quotations', icon: '📈' },
      { name: 'Point of Sale', path: '/app/pos', desc: 'User friendly POS interface', icon: '🏪' },
    ]},
    { category: 'Websites', items: [
      { name: 'Website Builder', path: '/app/website-builder', desc: 'Create stunning websites', icon: '🌐' },
      { name: 'eCommerce', path: '/app/ecommerce', desc: 'Sell online beautifully', icon: '🛒' },
      { name: 'eLearning', path: '/app/elearning', desc: 'Create engaging courses', icon: '🎓' },
    ]},
    { category: 'Supply Chain', items: [
      { name: 'Inventory', path: '/app/inventory', desc: 'Maximize your warehouse efficiency', icon: '📦' },
      { name: 'Manufacturing', path: '/app/manufacturing', desc: 'Plan and execute production', icon: '🏭' },
      { name: 'Purchase', path: '/app/purchase', desc: 'Manage purchase orders easily', icon: '🛒' },
    ]}
  ];

  return (
    <section className="app-section">
      <h3 className="h2 mb-4">A powerful app for <br/>every business need.</h3>
      
      <div className="app-grid mt-4">
        {apps.map((cat, i) => (
          <div key={i} className="app-category">
            <div className="app-category-title">{cat.category}</div>
            <div className="app-list">
              {cat.items.map((app, j) => (
                <Link to={app.path} key={j} className="app-item" style={{textDecoration: 'none'}}>
                  <div className="app-icon">{app.icon}</div>
                  <div className="app-info">
                    <div className="app-name">{app.name}</div>
                    <div className="app-desc">{app.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 text-center">
        <Link to="/apps" className="btn btn-outline-primary">Discover all apps</Link>
      </div>
    </section>
  );
};

const ValueProposition = () => {
  return (
    <section className="value-section">
      <div className="value-container">
        <h2 className="value-title">No more painful integrations.</h2>
        <p className="value-desc">
          If you have individual software solutions that work, but don't talk to each other, you are probably entering things more than once and missing a comprehensive overview of what's going on.
        </p>
        <p className="value-desc">
          Between the Odoo apps and the tens of thousands of Community apps, there is something to help address all of your business needs in a single, cost-effective and modular solution: no more work to get different technology cooperating.
        </p>
        <p className="value-desc">
          Odoo apps are perfectly integrated with each other, allowing you to fully automate your business processes and reap the savings and benefits.
        </p>
        <Link to="/integrations" className="btn btn-secondary mt-4" style={{color: '#714B67', backgroundColor: '#fff'}}>View integrations</Link>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div>
      <Hero />
      <KanbanBoard />
      <AppShowcase />
      <ValueProposition />
    </div>
  );
};

export default Home;
