import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Icon from '../components/common/Icons';

export const Settings = () => {
  const { showToast } = useNotification();
  const { toggleTheme, isDark } = useTheme();

  const [saving, setSaving] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const [settings, setSettings] = useState({
    companyName: 'Apex Supply & Inventory Co.',
    currency: '$',
    currencyCode: 'USD',
    lowStockThreshold: 10,
    valuationMethod: 'FIFO',
    emailNotifications: true,
    lowStockAlerts: true,
    soundAlerts: false
  });

  const loadSettings = async () => {
    try {
      const data = await inventoryApi.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      showToast('Error loading settings: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.updateSettings(settings);
      showToast('System settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const [products, categories, suppliers, movements, sett, user] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getCategories(),
        inventoryApi.getSuppliers(),
        inventoryApi.getMovements(),
        inventoryApi.getSettings(),
        inventoryApi.getUserProfile()
      ]);
      const backup = { products, categories, suppliers, movements, settings: sett, user, exportedAt: new Date().toISOString() };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `apex_inventory_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Database JSON backup downloaded!', 'success');
    } catch (err) {
      showToast('Failed to create backup: ' + err.message, 'error');
    }
  };

  const handleResetDemoData = async () => {
    try {
      localStorage.removeItem('apex_inventory_offline_db');
      showToast('Local database cache cleared and restored to default demo state.', 'success');
      setConfirmResetOpen(false);
      window.location.reload();
    } catch (err) {
      showToast('Error resetting database: ' + err.message, 'error');
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header-row">
        <div>
          <h2>System Preferences & Settings</h2>
          <p className="page-header-desc">
            Configure enterprise company details, default inventory thresholds, theme preferences, and data backups.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* General Enterprise Settings */}
        <div className="card-box settings-card">
          <div className="card-header-row">
            <div className="card-header-with-icon">
              <Icon name="settings" size={20} className="header-icon" />
              <div>
                <h3 className="card-title">Enterprise & Inventory Rules</h3>
                <p className="card-subtitle">Global company preferences and stock calculation rules</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="card-body">
            <div className="form-group">
              <label className="form-label">Company / Organization Name</label>
              <input
                type="text"
                className="form-control"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Primary Currency Symbol</label>
                <select
                  className="form-control"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="$">$ (USD / CAD / AUD)</option>
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="¥">¥ (JPY / CNY)</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Default Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value, 10) || 10 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Inventory Cost Valuation Method</label>
              <select
                className="form-control"
                value={settings.valuationMethod}
                onChange={(e) => setSettings({ ...settings, valuationMethod: e.target.value })}
              >
                <option value="FIFO">First-In, First-Out (FIFO) - Recommended</option>
                <option value="LIFO">Last-In, First-Out (LIFO)</option>
                <option value="WeightedAverage">Weighted Average Cost (WAC)</option>
              </select>
            </div>

            <div className="form-actions-right mt-4">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Icon name="check" size={16} />
                <span>{saving ? 'Saving...' : 'Save General Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Theme & Display Settings */}
        <div className="card-box settings-card">
          <div className="card-header-row">
            <div className="card-header-with-icon">
              <Icon name={isDark ? 'moon' : 'sun'} size={20} className="header-icon" />
              <div>
                <h3 className="card-title">Theme & Appearance</h3>
                <p className="card-subtitle">Active theme: {isDark ? 'Dark Mode (Default SaaS)' : 'Clean Light Mode'}</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="theme-toggle-panel">
              <div
                className={`theme-option-box ${isDark ? 'selected' : ''}`}
                onClick={() => isDark ? null : toggleTheme()}
              >
                <div className="theme-preview dark-preview">
                  <div className="preview-nav"></div>
                  <div className="preview-card"></div>
                </div>
                <div className="theme-option-info">
                  <div className="theme-option-name">
                    <Icon name="moon" size={16} />
                    <span>Dark Mode (Default)</span>
                  </div>
                  <p className="theme-option-desc">Deep navy / charcoal background with high contrast cards.</p>
                </div>
              </div>

              <div
                className={`theme-option-box ${!isDark ? 'selected' : ''}`}
                onClick={() => !isDark ? null : toggleTheme()}
              >
                <div className="theme-preview light-preview">
                  <div className="preview-nav"></div>
                  <div className="preview-card"></div>
                </div>
                <div className="theme-option-info">
                  <div className="theme-option-name">
                    <Icon name="sun" size={16} />
                    <span>Light Mode</span>
                  </div>
                  <p className="theme-option-desc">Clean white and slate surfaces with crisp typography.</p>
                </div>
              </div>
            </div>

            <div className="notification-toggles mt-4">
              <h4 className="section-subheading">Alert Preferences</h4>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.lowStockAlerts}
                  onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                />
                <span>Enable pulsing topbar badge for low-stock and out-of-stock items</span>
              </label>

              <label className="checkbox-row mt-2">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                />
                <span>Receive daily digest of reorder recommendations</span>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management & Backups */}
        <div className="card-box settings-card full-width">
          <div className="card-header-row">
            <div className="card-header-with-icon">
              <Icon name="download" size={20} className="header-icon" />
              <div>
                <h3 className="card-title">Database Backup & Disaster Recovery</h3>
                <p className="card-subtitle">Export full system snapshots or restore initial demo state</p>
              </div>
            </div>
          </div>

          <div className="card-body data-management-row">
            <div className="data-action-block">
              <h4>Export Full System Backup</h4>
              <p className="text-muted text-sm">
                Downloads a complete JSON snapshot including all products, categories, suppliers, stock movements, and settings.
              </p>
              <button className="btn-secondary mt-3" onClick={handleExportBackup}>
                <Icon name="download" size={16} />
                <span>Download JSON Backup</span>
              </button>
            </div>

            <div className="data-action-block danger-block">
              <h4>Factory Reset Demo Database</h4>
              <p className="text-muted text-sm">
                Restores the system to default seed data with 14 products, 6 categories, and 5 suppliers.
              </p>
              <button
                className="btn-outline-danger mt-3"
                onClick={() => setConfirmResetOpen(true)}
              >
                <Icon name="trash" size={16} />
                <span>Reset to Seed Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset to Factory Demo Data?"
        message="This will reload the initial demo data with 14 sample products and movement logs. Continue?"
        confirmText="Yes, Reset Database"
        isDanger={true}
      />
    </div>
  );
};

export default Settings;
