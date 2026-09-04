import React from 'react';
import './index.css';

const Header = () => (
  <header className="header">
    <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
    <input type="text" className="search-input" placeholder="Search or jump to..." />
  </header>
);

const RepoHeader = () => (
  <div className="repo-header">
    <div className="repo-title-row">
      <h1 className="repo-title">
        <a href="#">odoo</a>
        <span>/</span>
        <a href="#" style={{fontWeight: 600}}>odoo</a>
        <span className="repo-badge">Public</span>
      </h1>
      <div className="repo-actions">
        <button>Watch 1.8k</button>
        <button>Fork 20.3k</button>
        <button>Star 32.1k</button>
      </div>
    </div>
    <div className="repo-tabs">
      <div className="repo-tab active">
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" style={{fill: 'var(--color-fg-muted)'}}>
          <path d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v12.5A1.75 1.75 0 0112.25 16h-8.5A1.75 1.75 0 012 14.25Zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25Zm6.75 3.75a.75.75 0 010 1.5h-5a.75.75 0 010-1.5Zm0 3a.75.75 0 010 1.5h-5a.75.75 0 010-1.5Zm0 3a.75.75 0 010 1.5h-5a.75.75 0 010-1.5Z"></path>
        </svg>
        Code
      </div>
      <div className="repo-tab">Issues <span className="repo-badge">4k+</span></div>
      <div className="repo-tab">Pull requests <span className="repo-badge">2k+</span></div>
      <div className="repo-tab">Actions</div>
      <div className="repo-tab">Projects</div>
      <div className="repo-tab">Security</div>
      <div className="repo-tab">Insights</div>
    </div>
  </div>
);

const FileIcon = ({ type }) => {
  if (type === 'folder') {
    return (
      <svg aria-label="Directory" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="file-icon folder">
        <path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z"></path>
      </svg>
    );
  }
  return (
    <svg aria-label="File" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="file-icon">
      <path d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
    </svg>
  );
};

const mockFiles = [
  { name: 'addons', type: 'folder', commit: '[FIX] point_of_sale: ensure barcode scanner works', date: '3 hours ago' },
  { name: 'odoo', type: 'folder', commit: '[IMP] core: improve performance', date: '5 hours ago' },
  { name: 'setup', type: 'folder', commit: '[REF] setup: clean up dependencies', date: '2 days ago' },
  { name: '.gitignore', type: 'file', commit: '[IMP] add .env to gitignore', date: 'last month' },
  { name: 'COPYING', type: 'file', commit: 'Update license', date: '2 years ago' },
  { name: 'README.md', type: 'file', commit: '[DOC] update readme for v17', date: '3 days ago' },
  { name: 'odoo-bin', type: 'file', commit: '[IMP] cli: add new arg', date: '2 weeks ago' },
];

const FileExplorer = () => (
  <div className="file-explorer">
    <div className="file-explorer-header">
      <div className="commit-info">
        <img className="commit-avatar" src="https://github.com/odoo.png" alt="Odoo" />
        <span className="commit-message"><a href="#" style={{color: 'inherit'}}>odoo</a> [FIX] point_of_sale: ensure barcode scanner works</span>
      </div>
      <div className="commit-time">
        <span>3 hours ago</span>
      </div>
    </div>
    <div className="file-list">
      {mockFiles.map((file, i) => (
        <div className="file-row" key={i}>
          <div className="file-icon" style={{marginRight: '16px'}}>
            <FileIcon type={file.type} />
          </div>
          <div className="file-name">
            <a href="#">{file.name}</a>
          </div>
          <div className="file-commit">
            <a href="#" style={{color: 'inherit'}}>{file.commit}</a>
          </div>
          <div className="file-date">
            {file.date}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Readme = () => (
  <div className="readme-section">
    <div className="readme-header">
      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" style={{fill: 'var(--color-fg-muted)'}}>
        <path d="M2 1.75C2 .784 2.784 0 3.75 0h8.5C13.216 0 14 .784 14 1.75v12.5A1.75 1.75 0 0112.25 16h-8.5A1.75 1.75 0 012 14.25Zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25Zm6.75 3.75a.75.75 0 010 1.5h-5a.75.75 0 010-1.5Zm0 3a.75.75 0 010 1.5h-5a.75.75 0 010-1.5Zm0 3a.75.75 0 010 1.5h-5a.75.75 0 010-1.5Z"></path>
      </svg>
      README.md
    </div>
    <div className="readme-content">
      <h1>Odoo</h1>
      <p>Odoo is a suite of web based open source business apps.</p>
      <p>The main Odoo Apps include an Open Source CRM, Website Builder, eCommerce, Warehouse Management, Project Management, Billing & Accounting, Point of Sale, Human Resources, Marketing, Manufacturing, Purchase Management, ...</p>
      <p>Odoo Apps can be used as stand-alone applications, but they also integrate seamlessly so you get a full-featured Open Source ERP when you install several Apps.</p>
    </div>
  </div>
);

const Sidebar = () => (
  <div className="sidebar">
    <div className="sidebar-section">
      <h2>About</h2>
      <p>Odoo. Open Source Apps To Grow Your Business.</p>
      <div style={{marginBottom: '16px'}}>
        <a href="#">https://www.odoo.com</a>
      </div>
      <div>
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" style={{fill: 'var(--color-fg-muted)', marginRight: '8px', verticalAlign: 'text-bottom'}}>
          <path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zM6.32 7.32a.75.75 0 011.06-1.06l2.12 2.12a.75.75 0 01-1.06 1.06L6.32 7.32z"></path>
        </svg>
        <span style={{color: 'var(--color-fg-muted)'}}>33.1k stars</span>
      </div>
    </div>
    <div className="sidebar-section">
      <h2>Releases</h2>
      <p>230 tags</p>
    </div>
    <div className="sidebar-section">
      <h2>Contributors</h2>
      <p>2,504</p>
    </div>
    <div className="sidebar-section">
      <h2>Languages</h2>
      <div style={{display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px'}}>
        <div style={{backgroundColor: '#3572A5', width: '50%'}}></div>
        <div style={{backgroundColor: '#f1e05a', width: '40%'}}></div>
        <div style={{backgroundColor: '#563d7c', width: '10%'}}></div>
      </div>
      <div style={{fontSize: '12px', display: 'flex', gap: '16px'}}>
        <span><span style={{color: '#3572A5', marginRight: '4px'}}>●</span>Python 50%</span>
        <span><span style={{color: '#f1e05a', marginRight: '4px'}}>●</span>JavaScript 40%</span>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <div>
      <Header />
      <RepoHeader />
      <div className="main-content">
        <div className="file-explorer-container">
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
            <button style={{backgroundColor: 'var(--color-canvas-subtle)'}}>master</button>
            <div style={{display: 'flex', gap: '8px'}}>
              <button>Go to file</button>
              <button>Add file</button>
              <button style={{backgroundColor: '#238636', color: '#fff', borderColor: 'rgba(240, 246, 252, 0.1)'}}>Code</button>
            </div>
          </div>
          <FileExplorer />
          <Readme />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
