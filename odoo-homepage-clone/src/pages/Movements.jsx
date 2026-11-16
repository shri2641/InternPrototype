import React, { useState, useEffect, useMemo } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/common/DataTable';
import Icon from '../components/common/Icons';

export const Movements = () => {
  const { showToast } = useNotification();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getMovements();
      setMovements(data);
    } catch (err) {
      showToast('Error loading movement logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Type filter
      if (typeFilter !== 'all' && m.type.toUpperCase() !== typeFilter.toUpperCase()) {
        return false;
      }
      // Date filter
      if (dateFilter !== 'all') {
        const movDate = new Date(m.timestamp);
        const now = new Date();
        const diffDays = (now - movDate) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === '7days' && diffDays > 7) return false;
        if (dateFilter === '30days' && diffDays > 30) return false;
      }
      return true;
    });
  }, [movements, typeFilter, dateFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredMovements.length) {
      showToast('No movement records to export', 'warning');
      return;
    }
    const headers = ['Timestamp', 'Type', 'Product Name', 'SKU', 'Quantity', 'Previous Stock', 'New Stock', 'Reference', 'Audit Note', 'Performed By'];
    const rows = filteredMovements.map(m => [
      `"${new Date(m.timestamp).toLocaleString()}"`,
      m.type,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.sku,
      m.quantity,
      m.previousStock,
      m.newStock,
      `"${m.reference || ''}"`,
      `"${(m.note || '').replace(/"/g, '""')}"`,
      `"${m.performedBy || 'Admin'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported movement history to CSV', 'success');
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (val) => (
        <div className="movement-timestamp-cell">
          <span className="date-main">
            {new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="time-sub">
            {new Date(val).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Action Type',
      render: (val) => {
        const type = String(val).toUpperCase();
        let badgeClass = 'badge-primary';
        let label = '⚙ ADJUST';

        if (type === 'IN') {
          badgeClass = 'badge-success';
          label = '↓ INBOUND';
        } else if (type === 'OUT') {
          badgeClass = 'badge-danger';
          label = '↑ OUTBOUND';
        }

        return <span className={`badge-pill ${badgeClass}`}>{label}</span>;
      }
    },
    {
      key: 'productName',
      header: 'Product & SKU',
      render: (val, row) => (
        <div className="product-text-info">
          <span className="product-name-bold">{val}</span>
          <span className="product-sku-pill">SKU: {row.sku}</span>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (val, row) => {
        const type = String(row.type).toUpperCase();
        const prefix = type === 'IN' ? '+' : type === 'OUT' ? '-' : '';
        const colorClass = type === 'IN' ? 'text-success' : type === 'OUT' ? 'text-danger' : 'text-primary';

        return (
          <span className={`movement-qty-badge ${colorClass}`}>
            {prefix}{val} units
          </span>
        );
      }
    },
    {
      key: 'stockChange',
      header: 'Stock Delta',
      render: (_, row) => (
        <div className="stock-delta-cell">
          <span className="stock-before">{row.previousStock}</span>
          <span className="stock-arrow">→</span>
          <span className="stock-after">{row.newStock}</span>
        </div>
      )
    },
    {
      key: 'reference',
      header: 'Reference #',
      render: (val) => <span className="ref-tag">{val || '—'}</span>
    },
    {
      key: 'note',
      header: 'Notes & Auditor',
      render: (val, row) => (
        <div className="movement-note-cell">
          <span className="note-text">{val || 'No note entered'}</span>
          <span className="auditor-text">by {row.performedBy || 'System'}</span>
        </div>
      )
    }
  ];

  // Quick metrics
  const totalInbound = movements.filter(m => m.type === 'IN').reduce((s, m) => s + (m.quantity || 0), 0);
  const totalOutbound = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + (m.quantity || 0), 0);

  return (
    <div className="movements-page">
      <div className="page-header-row">
        <div>
          <h2>Stock Movement Audit Trail</h2>
          <p className="page-header-desc">
            Immutable log of all inbound shipments, outbound customer dispatches, and warehouse cycle adjustments.
          </p>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV}>
          <Icon name="download" size={16} />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Movement Velocity Highlights */}
      <div className="movements-summary-bar">
        <div className="summary-stat-box">
          <span className="summary-box-title">Total Movements</span>
          <span className="summary-box-val">{movements.length} events</span>
        </div>
        <div className="summary-stat-box text-success">
          <span className="summary-box-title">Total Inbound Units</span>
          <span className="summary-box-val">+{totalInbound.toLocaleString()} units</span>
        </div>
        <div className="summary-stat-box text-danger">
          <span className="summary-box-title">Total Outbound Units</span>
          <span className="summary-box-val">-{totalOutbound.toLocaleString()} units</span>
        </div>
        <div className="summary-stat-box text-purple">
          <span className="summary-box-title">Net Inventory Change</span>
          <span className="summary-box-val">{(totalInbound - totalOutbound > 0 ? '+' : '') + (totalInbound - totalOutbound).toLocaleString()}</span>
        </div>
      </div>

      {/* Table with custom filters */}
      <div className="card-box">
        <DataTable
          columns={columns}
          data={filteredMovements}
          isLoading={loading}
          searchPlaceholder="Search audit trail by SKU, product name, or PO #..."
          emptyMessage="No stock movement records found"
          emptySubtext="Try selecting 'All Types' or clearing your search query."
          filters={
            <div className="datatable-custom-filters">
              {/* Type Filter */}
              <select
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Movement Types</option>
                <option value="IN">Inbound Receipts (Stock IN)</option>
                <option value="OUT">Outbound Dispatches (Stock OUT)</option>
                <option value="ADJUST">Inventory Adjustments</option>
              </select>

              {/* Date Filter */}
              <select
                className="filter-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default Movements;
