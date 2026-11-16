import React, { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Icon from '../components/common/Icons';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const statusConfig = {
  'Operational': { color: 'var(--status-success)', bg: 'var(--status-success-bg)', icon: 'check' },
  'High Security': { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', icon: 'shield' },
  'Restricted Access': { color: 'var(--status-danger)', bg: 'var(--status-danger-bg)', icon: 'shieldAlert' },
  'Maintenance': { color: 'var(--text-muted)', bg: 'var(--bg-badge-neutral)', icon: 'settings' },
};

const EMPTY_FORM = {
  name: '', location: '', manager: '', capacity: '', status: 'Operational',
  phone: '', email: '', hazardCertified: false, notes: ''
};

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const { showNotification } = useNotification();

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getWarehouses();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };
  const openEdit = (w) => { setForm({ ...w }); setEditItem(w); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      showNotification('Name and location are required', 'warning'); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const updated = await inventoryApi.updateWarehouse(editItem.id, form);
        setWarehouses(prev => prev.map(w => w.id === editItem.id ? updated : w));
        showNotification(`Warehouse "${form.name}" updated`, 'success');
      } else {
        const created = await inventoryApi.createWarehouse(form);
        setWarehouses(prev => [created, ...prev]);
        showNotification(`Warehouse "${form.name}" created`, 'success');
      }
      setShowModal(false);
    } catch {
      showNotification('Failed to save warehouse', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deleteWarehouse(deleteTarget.id);
      setWarehouses(prev => prev.filter(w => w.id !== deleteTarget.id));
      showNotification(`Warehouse "${deleteTarget.name}" deleted`, 'success');
    } catch {
      showNotification('Failed to delete warehouse', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const parseCapacity = (cap) => {
    if (!cap) return 0;
    const num = parseFloat(String(cap).replace('%', ''));
    return isNaN(num) ? 0 : Math.min(100, num);
  };

  const capColor = (pct) => {
    if (pct >= 90) return 'var(--status-danger)';
    if (pct >= 70) return 'var(--status-warning)';
    return 'var(--status-success)';
  };

  const filtered = warehouses.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.location?.toLowerCase().includes(search.toLowerCase()) ||
    w.manager?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCap = warehouses.length;
  const operational = warehouses.filter(w => w.status === 'Operational').length;
  const hazmat = warehouses.filter(w => w.hazardCertified).length;
  const avgCap = warehouses.length
    ? Math.round(warehouses.reduce((s, w) => s + parseCapacity(w.capacity), 0) / warehouses.length)
    : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <Icon name="warehouse" size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Warehouses</h1>
            <p className="page-subtitle">Manage your storage facilities and capacity</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={18} /> Add Warehouse
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Facilities', value: totalCap, icon: 'warehouse', color: '#f97316' },
          { label: 'Operational', value: operational, icon: 'check', color: 'var(--status-success)' },
          { label: 'HazMat Certified', value: hazmat, icon: 'shieldAlert', color: 'var(--status-warning)' },
          { label: 'Avg. Capacity Used', value: `${avgCap}%`, icon: 'barChart', color: 'var(--accent-cyan)' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: `color-mix(in srgb,${c.color} 15%,transparent)` }}>
              <Icon name={c.icon} size={22} color={c.color} />
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{c.value}</div>
              <div className="stat-card-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-input-wrap" style={{ maxWidth: 400 }}>
          <Icon name="search" size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, location, or manager…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading warehouses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Icon name="warehouse" size={48} />
          <h3>No warehouses found</h3>
          <p>{search ? 'Try a different search term.' : 'Add your first warehouse to get started.'}</p>
          {!search && <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={16} /> Add Warehouse</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.25rem' }}>
          {filtered.map(w => {
            const capPct = parseCapacity(w.capacity);
            const st = statusConfig[w.status] || statusConfig['Operational'];
            return (
              <div key={w.id} className="card card-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                {/* Accent stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f97316,#ea580c)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{w.name}</h3>
                      {w.hazardCertified && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600,
                          padding: '2px 8px', borderRadius: 20,
                          background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
                          <Icon name="shieldAlert" size={12} /> HazMat
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Icon name="mapPin" size={14} /> {w.location}
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 600,
                    padding: '4px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                    <Icon name={st.icon} size={12} /> {w.status}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Capacity Used</span>
                    <span style={{ fontWeight: 700, color: capColor(capPct) }}>{capPct}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${capPct}%`, background: capColor(capPct), borderRadius: 8,
                      transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginBottom: '1rem' }}>
                  {[
                    { icon: 'user', label: 'Manager', val: w.manager || '—' },
                    { icon: 'phone', label: 'Phone', val: w.phone || '—' },
                    { icon: 'mail', label: 'Email', val: w.email || '—' },
                    { icon: 'calendar', label: 'Last Audit', val: w.lastAudit || '—' },
                  ].map(r => (
                    <div key={r.label}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name={r.icon} size={12} /> {r.val}
                      </div>
                    </div>
                  ))}
                </div>

                {w.notes && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-badge-neutral)', padding: '0.5rem 0.75rem', borderRadius: 8, margin: '0 0 1rem' }}>
                    {w.notes}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(w)}>
                    <Icon name="edit" size={15} /> Edit
                  </button>
                  <button className="btn btn-danger-outline" onClick={() => setDeleteTarget(w)} title="Delete warehouse">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editItem ? `Edit: ${editItem.name}` : 'Add New Warehouse'} size="lg">
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Warehouse Name *</label>
            <input className="form-input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Central Hub - North" required />
          </div>
          <div className="form-group">
            <label className="form-label">Location / Address *</label>
            <input className="form-input" value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, State" required />
          </div>
          <div className="form-group">
            <label className="form-label">Manager Name</label>
            <input className="form-input" value={form.manager}
              onChange={e => setForm(p => ({ ...p, manager: e.target.value }))} placeholder="Facility manager" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 ..." />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="warehouse@company.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Capacity Used (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.capacity}
              onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="0–100" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes…" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="hazmat" checked={!!form.hazardCertified}
              onChange={e => setForm(p => ({ ...p, hazardCertified: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <label htmlFor="hazmat" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shieldAlert" size={16} color="var(--status-warning)" /> HazMat / Hazardous Materials Certified
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner-sm" /> Saving…</> : <><Icon name="check" size={16} /> {editItem ? 'Update Warehouse' : 'Create Warehouse'}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message={`Permanently remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
