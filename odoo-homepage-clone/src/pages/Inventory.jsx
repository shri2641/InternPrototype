import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import BarcodeScannerModal from '../components/common/BarcodeScannerModal';
import Icon from '../components/common/Icons';

export const Inventory = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState('table');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  // Modal for Stock Movement
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('IN'); // 'IN', 'OUT', 'ADJUST'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qtyInput, setQtyInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const prods = await inventoryApi.getProducts();
      setProducts(prods);
    } catch (err) {
      showToast('Error loading inventory: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openActionModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    if (type === 'IN') {
      setQtyInput('20');
      setReferenceInput('PO-' + Math.floor(1000 + Math.random() * 9000));
      setNoteInput('Replenishment stock received');
    } else if (type === 'OUT') {
      setQtyInput('5');
      setReferenceInput('SO-' + Math.floor(1000 + Math.random() * 9000));
      setNoteInput('Client shipment dispatch');
    } else {
      setQtyInput(String(product.stock));
      setReferenceInput('AUDIT-' + new Date().toISOString().slice(0, 10));
      setNoteInput('Physical audit count adjustment');
    }
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const val = parseInt(qtyInput, 10);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid non-negative number', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === 'IN' || modalType === 'OUT') {
        if (modalType === 'OUT' && val > selectedProduct.stock) {
          showToast(`Cannot dispatch ${val} items: only ${selectedProduct.stock} available`, 'error');
          setIsSubmitting(false);
          return;
        }

        await inventoryApi.recordMovement({
          productId: selectedProduct.id,
          type: modalType,
          quantity: val,
          reference: referenceInput,
          note: noteInput
        });

        showToast(
          `Stock ${modalType === 'IN' ? 'Inbound (+' + val + ')' : 'Outbound (-' + val + ')'} recorded for ${selectedProduct.name}`,
          'success'
        );
      } else {
        // ADJUST: calculates difference
        const currentStock = Number(selectedProduct.stock) || 0;
        const diff = val - currentStock;
        
        await inventoryApi.adjustProductStock(
          selectedProduct.id,
          diff,
          referenceInput || 'AUDIT-ADJUST',
          noteInput || `Count reconciled from ${currentStock} to ${val}`
        );

        showToast(`Stock reconciled to ${val} units for ${selectedProduct.name}`, 'success');
      }

      setModalOpen(false);
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Error updating stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Inventory list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const stock = Number(p.stock) || 0;
      const min = Number(p.minStock) || 10;
      if (statusFilter === 'in_stock') return stock > min;
      if (statusFilter === 'low_stock') return stock > 0 && stock <= min;
      if (statusFilter === 'out_of_stock') return stock <= 0;
      return true;
    });
  }, [products, statusFilter]);

  // Statistics
  const optimalCount = products.filter(p => p.stock > (p.minStock || 10)).length;
  const lowCount = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10)).length;
  const outCount = products.filter(p => p.stock <= 0).length;

  const columns = [
    {
      key: 'name',
      header: 'Item & SKU',
      render: (val, row) => (
        <div className="product-table-cell">
          <img
            src={row.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=80'}
            alt={row.name}
            className="product-thumbnail"
          />
          <div className="product-text-info">
            <span className="product-name-bold">{row.name}</span>
            <span className="product-sku-pill">SKU: {row.sku}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => <span className="category-pill-badge">{val}</span>
    },
    {
      key: 'stock',
      header: 'Stock Level & Meter',
      render: (val, row) => {
        const stock = Number(val) || 0;
        const min = Number(row.minStock) || 10;
        const targetMax = Math.max(stock, min * 3, 20);
        const percent = Math.min(100, (stock / targetMax) * 100);

        let barColor = '#10b981';
        let statusBadge = 'Optimal';
        let badgeClass = 'badge-success';

        if (stock <= 0) {
          barColor = '#ef4444';
          statusBadge = 'Out of Stock';
          badgeClass = 'badge-danger';
        } else if (stock <= min) {
          barColor = '#f59e0b';
          statusBadge = 'Low Stock';
          badgeClass = 'badge-warning';
        }

        return (
          <div className="stock-meter-cell">
            <div className="meter-labels">
              <span className={`badge-pill ${badgeClass}`}>{statusBadge}</span>
              <span className="meter-numbers">
                <strong>{stock}</strong> / min {min}
              </span>
            </div>
            <div className="stock-meter-track">
              <div
                className="stock-meter-fill"
                style={{ width: `${percent}%`, backgroundColor: barColor }}
              ></div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'supplier',
      header: 'Supplier / Reorder From',
      render: (val) => <span className="text-muted text-sm">{val || 'Unassigned'}</span>
    },
    {
      key: 'quickActions',
      header: 'Inventory Control',
      align: 'right',
      sortable: false,
      render: (_, row) => (
        <div className="inventory-actions-row">
          <button
            className="btn-stock-in-sm"
            title="Receive incoming stock"
            onClick={() => openActionModal(row, 'IN')}
          >
            + In
          </button>
          <button
            className="btn-stock-out-sm"
            title="Dispatch outgoing stock"
            onClick={() => openActionModal(row, 'OUT')}
            disabled={row.stock <= 0}
          >
            - Out
          </button>
          <button
            className="btn-stock-adj-sm"
            title="Audit / Set stock quantity"
            onClick={() => openActionModal(row, 'ADJUST')}
          >
            Audit
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="inventory-page">
      <div className="page-header-row">
        <div>
          <h2>Stock Control & Warehouse Levels</h2>
          <p className="page-header-desc">
            Monitor real-time warehouse counts, trigger inbound receipts, handle dispatches, and conduct physical audits.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn-purple"
            onClick={() => setIsScannerOpen(true)}
            title="Scan SKU barcode"
          >
            <Icon name="package" size={16} />
            <span>Barcode Scanner</span>
          </button>

          <div className="view-mode-toggle-group">
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table Grid View"
            >
              <Icon name="layers" size={16} />
              <span>Table</span>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
            >
              <Icon name="dashboard" size={16} />
              <span>Kanban</span>
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={() => navigate('/movements')}
          >
            <Icon name="shoppingCart" size={16} />
            <span>Audit Log</span>
          </button>
        </div>
      </div>

      {/* Stock Status Filter Cards */}
      <div className="inventory-status-summary-grid">
        <div
          className={`inv-status-card ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="inv-card-count">{products.length}</div>
          <div className="inv-card-label">Total SKUs Monitored</div>
        </div>

        <div
          className={`inv-status-card success ${statusFilter === 'in_stock' ? 'active' : ''}`}
          onClick={() => setStatusFilter('in_stock')}
        >
          <div className="inv-card-count text-success">{optimalCount}</div>
          <div className="inv-card-label">Optimal Stock Levels</div>
        </div>

        <div
          className={`inv-status-card warning ${statusFilter === 'low_stock' ? 'active' : ''}`}
          onClick={() => setStatusFilter('low_stock')}
        >
          <div className="inv-card-count text-warning">{lowCount}</div>
          <div className="inv-card-label">Low Stock Reorders</div>
        </div>

        <div
          className={`inv-status-card danger ${statusFilter === 'out_of_stock' ? 'active' : ''}`}
          onClick={() => setStatusFilter('out_of_stock')}
        >
          <div className="inv-card-count text-danger">{outCount}</div>
          <div className="inv-card-label">Critical Out of Stock</div>
        </div>
      </div>

      {/* Table or Kanban View */}
      {viewMode === 'table' ? (
        <div className="card-box">
          <DataTable
            columns={columns}
            data={filteredProducts}
            isLoading={loading}
            searchPlaceholder="Search inventory by SKU, product name, or category..."
            emptyMessage="No inventory items match filter"
            emptySubtext="Switch filter above to 'Total SKUs' to view all items."
          />
        </div>
      ) : (
        /* Kanban Board View */
        <div className="inventory-kanban-board">
          {/* Column 1: Optimal Stock */}
          <div className="kanban-status-col">
            <div className="kanban-col-header header-optimal">
              <span className="col-title">● Optimal Stock</span>
              <span className="col-count-badge">{products.filter(p => p.stock > (p.minStock || 10)).length}</span>
            </div>
            <div className="kanban-cards-stack">
              {products.filter(p => p.stock > (p.minStock || 10)).map(p => (
                <div key={p.id} className="inv-kanban-card">
                  <div className="k-card-top">
                    <img src={p.imageUrl} alt={p.name} className="k-card-img" />
                    <div className="k-card-info">
                      <div className="k-card-name">{p.name}</div>
                      <div className="k-card-sku">SKU: {p.sku}</div>
                    </div>
                  </div>
                  <div className="k-card-meta">
                    <span className="category-pill-badge">{p.category}</span>
                    <span className="text-success font-weight-bold">{p.stock} units</span>
                  </div>
                  <div className="k-card-actions">
                    <button className="btn-stock-in-sm flex-1" onClick={() => openActionModal(p, 'IN')}>+ Inbound</button>
                    <button className="btn-stock-out-sm flex-1" onClick={() => openActionModal(p, 'OUT')}>- Dispatch</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Low Stock */}
          <div className="kanban-status-col">
            <div className="kanban-col-header header-low">
              <span className="col-title">▲ Low Stock Warning</span>
              <span className="col-count-badge">{products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10)).length}</span>
            </div>
            <div className="kanban-cards-stack">
              {products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10)).map(p => (
                <div key={p.id} className="inv-kanban-card card-warning-edge">
                  <div className="k-card-top">
                    <img src={p.imageUrl} alt={p.name} className="k-card-img" />
                    <div className="k-card-info">
                      <div className="k-card-name">{p.name}</div>
                      <div className="k-card-sku">SKU: {p.sku}</div>
                    </div>
                  </div>
                  <div className="k-card-meta">
                    <span className="category-pill-badge">{p.category}</span>
                    <span className="text-warning font-weight-bold">{p.stock} / min {p.minStock}</span>
                  </div>
                  <div className="k-card-actions">
                    <button className="btn-success btn-sm flex-1" onClick={() => openActionModal(p, 'IN')}>⚡ Restock Now</button>
                    <button className="btn-stock-out-sm" onClick={() => openActionModal(p, 'OUT')}>- Out</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Out of Stock */}
          <div className="kanban-status-col">
            <div className="kanban-col-header header-critical">
              <span className="col-title">■ Critical Out of Stock</span>
              <span className="col-count-badge">{products.filter(p => p.stock <= 0).length}</span>
            </div>
            <div className="kanban-cards-stack">
              {products.filter(p => p.stock <= 0).map(p => (
                <div key={p.id} className="inv-kanban-card card-danger-edge">
                  <div className="k-card-top">
                    <img src={p.imageUrl} alt={p.name} className="k-card-img" />
                    <div className="k-card-info">
                      <div className="k-card-name">{p.name}</div>
                      <div className="k-card-sku">SKU: {p.sku}</div>
                    </div>
                  </div>
                  <div className="k-card-meta">
                    <span className="badge-pill badge-danger">0 AVAILABLE</span>
                    <span className="text-muted text-xs">Vendor: {p.supplier || 'N/A'}</span>
                  </div>
                  <div className="k-card-actions">
                    <button className="btn-primary btn-sm w-100" onClick={() => openActionModal(p, 'IN')}>
                      + Create Emergency PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barcode & RFID Scanner Simulator Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onStockUpdated={loadInventory}
      />

      {/* Stock Action Modal */}
      {selectedProduct && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={
            modalType === 'IN'
              ? `Stock IN (Inbound Receipt): ${selectedProduct.name}`
              : modalType === 'OUT'
              ? `Stock OUT (Dispatch / Sale): ${selectedProduct.name}`
              : `Physical Inventory Audit: ${selectedProduct.name}`
          }
          maxWidth="520px"
        >
          <form onSubmit={handleModalSubmit} className="modal-form">
            <div className="selected-product-summary-box">
              <div className="summary-col">
                <span className="summary-key">Current Stock</span>
                <span className="summary-val">{selectedProduct.stock} units</span>
              </div>
              <div className="summary-col">
                <span className="summary-key">Min Threshold</span>
                <span className="summary-val">{selectedProduct.minStock} units</span>
              </div>
              <div className="summary-col">
                <span className="summary-key">Supplier</span>
                <span className="summary-val text-truncate">{selectedProduct.supplier || 'N/A'}</span>
              </div>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">
                {modalType === 'IN'
                  ? 'Units to Add (Inbound) *'
                  : modalType === 'OUT'
                  ? 'Units to Remove (Outbound) *'
                  : 'New Actual Physical Stock Count *'}
              </label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">PO / Order Reference #</label>
              <input
                type="text"
                className="form-control"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder="e.g. PO-7712, SO-9041, AUDIT-2026-Q4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Audit Log Note</label>
              <textarea
                className="form-control"
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Reason, destination, receiving dock, inspection notes..."
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={modalType === 'IN' ? 'btn-success' : modalType === 'OUT' ? 'btn-danger' : 'btn-primary'}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Saving...'
                  : modalType === 'IN'
                  ? 'Confirm Inbound Receipt'
                  : modalType === 'OUT'
                  ? 'Confirm Outbound Dispatch'
                  : 'Confirm Audit Count'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
