import React, { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Icon from '../components/common/Icons';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const PO_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'In Transit', 'Received & Stocked', 'Cancelled'];

const statusStyle = {
  'Draft':              { color: 'var(--text-muted)',        bg: 'var(--bg-badge-neutral)' },
  'Pending Approval':   { color: 'var(--status-warning)',    bg: 'var(--status-warning-bg)' },
  'Approved':           { color: 'var(--accent-cyan)',       bg: 'var(--accent-cyan-light)' },
  'In Transit':         { color: '#f97316',                  bg: 'rgba(249,115,22,0.15)' },
  'Received & Stocked': { color: 'var(--status-success)',    bg: 'var(--status-success-bg)' },
  'Cancelled':          { color: 'var(--status-danger)',     bg: 'var(--status-danger-bg)' },
};

const EMPTY_FORM = {
  supplierName: '', supplierId: '', status: 'Draft', expectedDelivery: '',
  shippingMethod: 'Standard Ground Freight', notes: '',
  items: [{ productName: '', sku: '', orderedQty: 1, unitCost: 0 }],
  tax: 0, shippingFee: 0,
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const { showNotification } = useNotification();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pos, sups] = await Promise.all([
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getSuppliers(),
      ]);
      setOrders(Array.isArray(pos) ? pos : []);
      setSuppliers(Array.isArray(sups) ? sups : []);
    } catch {
      showNotification('Failed to load purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Form helpers ── */
  const calcSubtotal = (items) =>
    (items || []).reduce((s, it) => s + (Number(it.orderedQty) || 0) * (Number(it.unitCost) || 0), 0);

  const calcTotal = (items, tax, shipping) =>
    calcSubtotal(items) + (Number(tax) || 0) + (Number(shipping) || 0);

  const updateItem = (idx, field, val) =>
    setForm(p => { const items = [...p.items]; items[idx] = { ...items[idx], [field]: val }; return { ...p, items }; });

  const addLine = () =>
    setForm(p => ({ ...p, items: [...p.items, { productName: '', sku: '', orderedQty: 1, unitCost: 0 }] }));

  const removeLine = (idx) =>
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const openAdd = () => { setForm(EMPTY_FORM); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.supplierName.trim()) { showNotification('Supplier name is required', 'warning'); return; }
    if (!form.items.length || !form.items[0].productName) { showNotification('Add at least one line item', 'warning'); return; }
    setSaving(true);
    const sub = calcSubtotal(form.items);
    const payload = {
      ...form,
      subtotal: sub,
      totalAmount: calcTotal(form.items, form.tax, form.shippingFee),
    };
    try {
      const created = await inventoryApi.createPurchaseOrder(payload);
      setOrders(prev => [created, ...prev]);
      showNotification(`Purchase Order ${created.poNumber} created`, 'success');
      setShowModal(false);
    } catch {
      showNotification('Failed to create purchase order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async () => {
    if (!receiveTarget) return;
    setReceiving(true);
    try {
      const res = await inventoryApi.receivePurchaseOrder(receiveTarget.id);
      showNotification(`✅ ${receiveTarget.poNumber} received — inventory updated!`, 'success');
      setOrders(prev => prev.map(o => o.id === receiveTarget.id ? res.po || { ...o, status: 'Received & Stocked' } : o));
    } catch {
      showNotification('Failed to receive shipment', 'error');
    } finally {
      setReceiving(false);
      setReceiveTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deletePurchaseOrder(deleteTarget.id);
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      showNotification(`${deleteTarget.poNumber} deleted`, 'success');
    } catch {
      showNotification('Failed to delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── Stats ── */
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending Approval').length,
    inTransit: orders.filter(o => o.status === 'In Transit' || o.status === 'Approved').length,
    received: orders.filter(o => o.status === 'Received & Stocked').length,
    totalValue: orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
  };

  /* ── Filtered list ── */
  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchSearch = !search ||
      o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-icon" style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)' }}>
            <Icon name="purchase" size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Purchase Orders</h1>
            <p className="page-subtitle">Manage procurement, track shipments, and auto-stock inventory</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={18} /> New Purchase Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Orders', value: stats.total, icon: 'receiptText', color: '#f97316' },
          { label: 'Pending Approval', value: stats.pending, icon: 'clock', color: 'var(--status-warning)' },
          { label: 'In Transit', value: stats.inTransit, icon: 'truck', color: 'var(--accent-cyan)' },
          { label: 'Received', value: stats.received, icon: 'check', color: 'var(--status-success)' },
          { label: 'Total PO Value', value: fmt(stats.totalValue), icon: 'dollar', color: 'var(--accent-purple)' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: `color-mix(in srgb,${c.color} 15%,transparent)` }}>
              <Icon name={c.icon} size={22} color={c.color} />
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value" style={{ fontSize: c.label === 'Total PO Value' ? '1rem' : undefined }}>{c.value}</div>
              <div className="stat-card-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrap" style={{ flex: 1, minWidth: 220 }}>
          <Icon name="search" size={16} className="search-icon" />
          <input className="search-input" placeholder="Search PO number or supplier…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', ...PO_STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: filterStatus === s ? 'none' : '1px solid var(--border-color)',
                background: filterStatus === s ? 'var(--accent-primary)' : 'transparent',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s'
              }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading orders…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Icon name="purchase" size={48} />
          <h3>No purchase orders found</h3>
          <p>{search || filterStatus !== 'All' ? 'Try adjusting your filters.' : 'Create your first purchase order.'}</p>
          {!search && filterStatus === 'All' && (
            <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={16} /> New PO</button>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Expected</th>
                  <th>Shipping</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => {
                  const st = statusStyle[po.status] || statusStyle['Draft'];
                  const canReceive = po.status === 'Approved' || po.status === 'In Transit';
                  return (
                    <tr key={po.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {po.poNumber}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.supplierName}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          {(po.items || []).length} line{(po.items || []).length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {(po.items || []).map(i => i.productName).join(', ').substring(0, 40)}
                          {((po.items || []).map(i => i.productName).join(', ')).length > 40 ? '…' : ''}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(po.totalAmount)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                          borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: st.bg, color: st.color }}>
                          {po.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {po.shippingMethod || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setViewItem(po)} title="View details">
                            <Icon name="eye" size={14} />
                          </button>
                          {canReceive && (
                            <button className="btn btn-sm" onClick={() => setReceiveTarget(po)}
                              title="Receive shipment & stock inventory"
                              style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600 }}>
                              <Icon name="arrowIn" size={13} /> Receive
                            </button>
                          )}
                          {po.status === 'Draft' && (
                            <button className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(po)} title="Delete">
                              <Icon name="trash" size={14} />
                            </button>
                          )}
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

      {/* View Detail Modal */}
      {viewItem && (
        <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title={`${viewItem.poNumber} — Details`} size="lg">
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {[
                ['Supplier', viewItem.supplierName],
                ['Status', viewItem.status],
                ['Shipping', viewItem.shippingMethod],
                ['Expected', viewItem.expectedDelivery ? new Date(viewItem.expectedDelivery).toLocaleDateString('en-IN') : '—'],
                ['Created', viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleDateString('en-IN') : '—'],
                ['Received', viewItem.receivedDate ? new Date(viewItem.receivedDate).toLocaleDateString('en-IN') : 'Not yet'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Line Items</div>
              <table className="data-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th>Unit Cost</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewItem.items || []).map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{it.productName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.sku || '—'}</td>
                      <td>{it.orderedQty}</td>
                      <td>{it.receivedQty ?? '—'}</td>
                      <td>{fmt(it.unitCost)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt((it.orderedQty || 0) * (it.unitCost || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              {[
                ['Subtotal', fmt(viewItem.subtotal)],
                ['Tax', fmt(viewItem.tax)],
                ['Shipping', fmt(viewItem.shippingFee)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '2rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{k}</span>
                  <span style={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1.1rem', minWidth: 80, textAlign: 'right' }}>{fmt(viewItem.totalAmount)}</span>
              </div>
            </div>

            {viewItem.notes && (
              <div style={{ background: 'var(--bg-badge-neutral)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Notes: </strong>{viewItem.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
              {(viewItem.status === 'Approved' || viewItem.status === 'In Transit') && (
                <button className="btn btn-primary" onClick={() => { setReceiveTarget(viewItem); setViewItem(null); }}>
                  <Icon name="arrowIn" size={16} /> Receive Shipment
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create PO Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Purchase Order" size="xl">
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select className="form-select" value={form.supplierName}
                onChange={e => {
                  const sup = suppliers.find(s => s.name === e.target.value);
                  setForm(p => ({ ...p, supplierName: e.target.value, supplierId: sup?.id || '' }));
                }}>
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                <option value="__custom__">Other (type below)</option>
              </select>
              {(form.supplierName === '__custom__' || !suppliers.find(s => s.name === form.supplierName) && form.supplierName) && (
                <input className="form-input" style={{ marginTop: 6 }} placeholder="Supplier name"
                  value={form.supplierName === '__custom__' ? '' : form.supplierName}
                  onChange={e => setForm(p => ({ ...p, supplierName: e.target.value }))} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {PO_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery</label>
              <input className="form-input" type="date" value={form.expectedDelivery}
                onChange={e => setForm(p => ({ ...p, expectedDelivery: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Method</label>
              <select className="form-select" value={form.shippingMethod}
                onChange={e => setForm(p => ({ ...p, shippingMethod: e.target.value }))}>
                {['Standard Ground Freight', 'Express Air', 'Rail Freight', 'Sea Freight', 'Last-mile Courier'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Line Items</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                <Icon name="plus" size={14} /> Add Item
              </button>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px 36px', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="form-input" placeholder="Product name" value={it.productName}
                    onChange={e => updateItem(idx, 'productName', e.target.value)} />
                  <input className="form-input" placeholder="SKU" value={it.sku}
                    onChange={e => updateItem(idx, 'sku', e.target.value)} />
                  <input className="form-input" type="number" min="1" placeholder="Qty" value={it.orderedQty}
                    onChange={e => updateItem(idx, 'orderedQty', Number(e.target.value))} />
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="Unit ₹" value={it.unitCost}
                    onChange={e => updateItem(idx, 'unitCost', Number(e.target.value))} />
                  <button type="button" onClick={() => removeLine(idx)} disabled={form.items.length === 1}
                    style={{ background: 'var(--status-danger-bg)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--status-danger)', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tax (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.tax}
                onChange={e => setForm(p => ({ ...p, tax: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Fee (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.shippingFee}
                onChange={e => setForm(p => ({ ...p, shippingFee: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '0.75rem 1rem', background: 'var(--bg-badge-neutral)', borderRadius: 10 }}>
            {[['Subtotal', calcSubtotal(form.items)], ['Tax', form.tax], ['Shipping', form.shippingFee]].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</div>
                <div style={{ fontWeight: 700 }}>{fmt(v)}</div>
              </div>
            ))}
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{fmt(calcTotal(form.items, form.tax, form.shippingFee))}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Special instructions or notes…" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner-sm" /> Creating…</> : <><Icon name="check" size={16} /> Create Purchase Order</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receive Shipment Confirm */}
      <ConfirmDialog
        isOpen={!!receiveTarget}
        onClose={() => setReceiveTarget(null)}
        onConfirm={handleReceive}
        title="Receive Shipment"
        message={`Mark ${receiveTarget?.poNumber} as received? All ordered quantities will be automatically added to inventory and stock movements recorded.`}
        confirmLabel={receiving ? 'Processing…' : 'Receive & Stock'}
        variant="success"
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Purchase Order"
        message={`Permanently delete ${deleteTarget?.poNumber}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
