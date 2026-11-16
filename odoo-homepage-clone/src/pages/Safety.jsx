import React, { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Icon from '../components/common/Icons';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const STATUS_OPTIONS = ['Passed', 'Failed', 'Quarantined', 'Pending', 'Under Review'];

const statusStyle = {
  Passed:       { color: 'var(--status-success)',  bg: 'var(--status-success-bg)'  },
  Failed:       { color: 'var(--status-danger)',   bg: 'var(--status-danger-bg)'   },
  Quarantined:  { color: 'var(--status-danger)',   bg: 'var(--status-danger-bg)'   },
  Pending:      { color: 'var(--status-warning)',  bg: 'var(--status-warning-bg)'  },
  'Under Review':{ color: 'var(--accent-cyan)',    bg: 'var(--accent-cyan-light)'  },
};

const EMPTY_FORM = {
  productName: '', sku: '', batchNumber: '', inspector: '',
  status: 'Pending', issueDescription: '', actionTaken: '',
  location: '', temperature: '', humidity: ''
};

export default function Safety() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const { showNotification } = useNotification();

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getSafetyInspections();
      setInspections(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to load inspections', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditItem(item); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.inspector.trim()) {
      showNotification('Product name and inspector are required', 'warning'); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const updated = await inventoryApi.updateSafetyInspection(editItem.id, form);
        setInspections(prev => prev.map(i => i.id === editItem.id ? updated : i));
        showNotification('Inspection record updated', 'success');
      } else {
        const created = await inventoryApi.createSafetyInspection(form);
        setInspections(prev => [created, ...prev]);
        showNotification('Inspection record created', 'success');
      }
      setShowModal(false);
    } catch {
      showNotification('Failed to save inspection', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deleteSafetyInspection(deleteTarget.id);
      setInspections(prev => prev.filter(i => i.id !== deleteTarget.id));
      showNotification('Inspection deleted', 'success');
    } catch {
      showNotification('Failed to delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleSafetyLock = async (item) => {
    try {
      const updated = await inventoryApi.updateSafetyInspection(item.id, {
        ...item,
        safetyLockActive: !item.safetyLockActive
      });
      setInspections(prev => prev.map(i => i.id === item.id ? updated : i));
      showNotification(
        updated.safetyLockActive ? `🔒 Safety lock engaged for "${item.productName}"` : `🔓 Safety lock released for "${item.productName}"`,
        updated.safetyLockActive ? 'warning' : 'success'
      );
    } catch {
      showNotification('Failed to toggle safety lock', 'error');
    }
  };

  const quarantined = inspections.filter(i => i.safetyLockActive);
  const stats = {
    total: inspections.length,
    passed: inspections.filter(i => i.status === 'Passed').length,
    quarantined: inspections.filter(i => i.status === 'Quarantined' || i.safetyLockActive).length,
    pending: inspections.filter(i => i.status === 'Pending').length,
  };

  const filtered = inspections.filter(i => {
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    const matchSearch = !search ||
      i.productName?.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase()) ||
      i.inspector?.toLowerCase().includes(search.toLowerCase()) ||
      i.batchNumber?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fld = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder} />
    </div>
  );

  return (
    <div className="page-container">
      {/* Quarantine Alert Banner */}
      {quarantined.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem', borderRadius: 10,
          background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)',
          color: 'var(--status-danger)', fontWeight: 600
        }}>
          <Icon name="shieldAlert" size={20} color="var(--status-danger)" />
          <span>⚠️ {quarantined.length} item{quarantined.length > 1 ? 's are' : ' is'} under Safety Lock / Quarantine.
          Restricted from inventory use until cleared.</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-icon" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <Icon name="shieldCheck" size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Safety & Quality Control</h1>
            <p className="page-subtitle">Track inspections, compliance, and safety locks</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={18} /> New Inspection
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Inspections', value: stats.total, icon: 'clipboardCheck', color: '#f97316' },
          { label: 'Passed', value: stats.passed, icon: 'shieldCheck', color: 'var(--status-success)' },
          { label: 'Quarantined / Locked', value: stats.quarantined, icon: 'shieldAlert', color: 'var(--status-danger)' },
          { label: 'Pending Review', value: stats.pending, icon: 'clock', color: 'var(--status-warning)' },
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

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Icon name="search" size={16} className="search-icon" />
          <input className="search-input" placeholder="Search product, SKU, batch, inspector…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', ...STATUS_OPTIONS].map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                border: filterStatus === s ? 'none' : '1px solid var(--border-color)',
                background: filterStatus === s ? 'var(--accent-primary)' : 'transparent',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading inspections…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Icon name="shieldCheck" size={48} />
          <h3>No inspections found</h3>
          <p>{search || filterStatus !== 'All' ? 'Try adjusting your filters.' : 'Create the first inspection record.'}</p>
          {!search && filterStatus === 'All' && (
            <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={16} /> New Inspection</button>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Batch #</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Safety Lock</th>
                  <th>Date</th>
                  <th>Issue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const st = statusStyle[item.status] || statusStyle['Pending'];
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</div>
                        {item.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</div>}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.batchNumber || '—'}</td>
                      <td>{item.inspector}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                          borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: st.bg, color: st.color }}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleSafetyLock(item)}
                          title={item.safetyLockActive ? 'Release safety lock' : 'Engage safety lock'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: item.safetyLockActive ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
                            color: item.safetyLockActive ? 'var(--status-danger)' : 'var(--status-success)',
                            transition: 'all 0.2s'
                          }}>
                          <Icon name={item.safetyLockActive ? 'shield' : 'shieldCheck'} size={12} />
                          {item.safetyLockActive ? 'LOCKED' : 'Clear'}
                        </button>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {item.inspectionDate ? new Date(item.inspectionDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ maxWidth: 200, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div title={item.issueDescription} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                          {item.issueDescription || '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}><Icon name="edit" size={14} /></button>
                          <button className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(item)}><Icon name="trash" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Inspection Record' : 'New Quality Inspection'} size="lg">
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.productName} required
              onChange={e => setForm(p => ({ ...p, productName: e.target.value }))} placeholder="Product being inspected" />
          </div>
          {fld('sku', 'SKU / Product Code', 'text', 'e.g. PRD-001')}
          {fld('batchNumber', 'Batch / Lot Number', 'text', 'e.g. BATCH-2026-001')}
          <div className="form-group">
            <label className="form-label">Inspector Name *</label>
            <input className="form-input" value={form.inspector} required
              onChange={e => setForm(p => ({ ...p, inspector: e.target.value }))} placeholder="QC Inspector" />
          </div>
          <div className="form-group">
            <label className="form-label">Inspection Status</label>
            <select className="form-select" value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {fld('location', 'Warehouse / Zone', 'text', 'e.g. Zone A, Rack 3')}
          {fld('temperature', 'Temperature (°C)', 'text', 'e.g. 22')}
          {fld('humidity', 'Humidity (%)', 'text', 'e.g. 55')}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Issue Description</label>
            <textarea className="form-input" rows={2} value={form.issueDescription}
              onChange={e => setForm(p => ({ ...p, issueDescription: e.target.value }))}
              placeholder="Describe any defects, deviations, or issues found…" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Action Taken</label>
            <textarea className="form-input" rows={2} value={form.actionTaken}
              onChange={e => setForm(p => ({ ...p, actionTaken: e.target.value }))}
              placeholder="Corrective or preventive actions…" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="safetyLock" checked={!!form.safetyLockActive}
              onChange={e => setForm(p => ({ ...p, safetyLockActive: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <label htmlFor="safetyLock" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" size={16} color="var(--status-danger)" /> Engage Safety Lock (Quarantine — blocks inventory use)
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner-sm" /> Saving…</> : <><Icon name="check" size={16} /> {editItem ? 'Update Record' : 'Create Inspection'}</>}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Inspection"
        message={`Remove inspection for "${deleteTarget?.productName}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
