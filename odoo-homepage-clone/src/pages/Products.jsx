import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Icon from '../components/common/Icons';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useNotification();
  const outletCtx = useOutletContext();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal
  const [viewProduct, setViewProduct] = useState(null);

  // Quick Stock Adjust Modal
  const [stockAdjustProduct, setStockAdjustProduct] = useState(null);
  const [adjustChange, setAdjustChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('Manual stock adjustment');

  // Delete Confirmation
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    sku: '',
    categoryId: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '10',
    supplierId: '',
    supplier: '',
    description: '',
    imageUrl: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, sups] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getCategories(),
        inventoryApi.getSuppliers()
      ]);
      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
      if (outletCtx?.refreshSummary) {
        outletCtx.refreshSummary();
      }
    } catch (err) {
      showToast('Error loading products: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('action') === 'add') {
      handleOpenAddModal();
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (p.categoryId !== selectedCategory && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      // Status filter
      if (selectedStatus === 'in_stock') {
        return Number(p.stock) > Number(p.minStock || 10);
      }
      if (selectedStatus === 'low_stock') {
        return Number(p.stock) > 0 && Number(p.minStock ? p.stock <= p.minStock : p.stock <= 10);
      }
      if (selectedStatus === 'out_of_stock') {
        return Number(p.stock) <= 0;
      }
      return true;
    });
  }, [products, selectedCategory, selectedStatus]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialForm,
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      categoryId: categories[0]?.id || '',
      category: categories[0]?.name || '',
      supplierId: suppliers[0]?.id || '',
      supplier: suppliers[0]?.name || ''
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      category: product.category || '',
      price: product.price ?? '',
      cost: product.cost ?? '',
      stock: product.stock ?? '',
      minStock: product.minStock ?? '10',
      supplierId: product.supplierId || '',
      supplier: product.supplier || '',
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setIsAddEditModalOpen(true);
  };

  // Generate SKU helper
  const handleGenerateSku = () => {
    const prefix = formData.category ? formData.category.slice(0, 3).toUpperCase() : 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Product name is required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find category and supplier names if IDs changed
      const catObj = categories.find(c => c.id === formData.categoryId);
      const supObj = suppliers.find(s => s.id === formData.supplierId);

      const payload = {
        ...formData,
        category: catObj ? catObj.name : formData.category,
        supplier: supObj ? supObj.name : formData.supplier,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        minStock: parseInt(formData.minStock, 10) || 10
      };

      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, payload);
        showToast(`Product "${payload.name}" updated successfully!`, 'success');
      } else {
        await inventoryApi.createProduct(payload);
        showToast(`Product "${payload.name}" created successfully!`, 'success');
      }

      setIsAddEditModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product Handler
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await inventoryApi.deleteProduct(productToDelete.id);
      showToast(`Product "${productToDelete.name}" deleted.`, 'info');
      setProductToDelete(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error deleting product', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Stock Adjust Submit
  const handleStockAdjustSubmit = async (e) => {
    e.preventDefault();
    const change = parseInt(adjustChange, 10);
    if (isNaN(change) || change === 0) {
      showToast('Enter a non-zero number to adjust stock', 'warning');
      return;
    }

    try {
      await inventoryApi.adjustProductStock(
        stockAdjustProduct.id,
        change,
        'QUICK-ADJUST',
        adjustReason
      );
      showToast(
        `Stock for ${stockAdjustProduct.name} adjusted by ${change > 0 ? '+' + change : change}`,
        'success'
      );
      setStockAdjustProduct(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error adjusting stock', 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredProducts.length) {
      showToast('No products to export', 'warning');
      return;
    }
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Min Stock', 'Supplier', 'Valuation'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.category || ''}"`,
      p.price,
      p.cost,
      p.stock,
      p.minStock,
      `"${p.supplier || ''}"`,
      (p.stock * p.price).toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apex_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported products catalog to CSV', 'success');
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'name',
      header: 'Product Details',
      render: (val, row) => (
        <div className="product-table-cell">
          <img
            src={row.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=80'}
            alt={row.name}
            className="product-thumbnail"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=80';
            }}
          />
          <div className="product-text-info">
            <span
              className="product-name-link"
              onClick={() => setViewProduct(row)}
              title="Click to view details"
            >
              {row.name}
            </span>
            <span className="product-sku-pill">SKU: {row.sku}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => (
        <span className="category-pill-badge">{val || 'Uncategorized'}</span>
      )
    },
    {
      key: 'price',
      header: 'Price / Cost',
      align: 'right',
      render: (val, row) => (
        <div className="text-right">
          <div className="price-primary">${Number(val || 0).toFixed(2)}</div>
          <div className="cost-secondary">Cost: ${Number(row.cost || 0).toFixed(2)}</div>
        </div>
      )
    },
    {
      key: 'stock',
      header: 'Stock Status',
      render: (val, row) => {
        const stock = Number(val) || 0;
        const min = Number(row.minStock) || 10;
        let badgeClass = 'badge-success';
        let statusLabel = 'In Stock';

        if (stock <= 0) {
          badgeClass = 'badge-danger';
          statusLabel = 'Out of Stock';
        } else if (stock <= min) {
          badgeClass = 'badge-warning';
          statusLabel = `Low (${stock}/${min})`;
        }

        return (
          <div className="stock-cell-wrap">
            <span className={`badge-pill ${badgeClass}`}>
              {statusLabel}
            </span>
            <div className="stock-number-text">{stock} units</div>
          </div>
        );
      }
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (val) => (
        <span className="text-muted text-sm">{val || '—'}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (_, row) => (
        <div className="table-actions-group">
          <button
            className="action-icon-btn"
            title="View Details"
            onClick={() => setViewProduct(row)}
          >
            <Icon name="eye" size={16} />
          </button>
          <button
            className="action-icon-btn adjust-btn"
            title="Quick Stock Adjust"
            onClick={() => {
              setStockAdjustProduct(row);
              setAdjustChange('');
              setAdjustReason('Physical inventory audit');
            }}
          >
            <Icon name="arrowUpDown" size={16} />
          </button>
          <button
            className="action-icon-btn"
            title="Edit Product"
            onClick={() => handleOpenEditModal(row)}
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            className="action-icon-btn delete-btn"
            title="Delete Product"
            onClick={() => setProductToDelete(row)}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="products-page">
      {/* Page Title & Actions Header */}
      <div className="page-header-row">
        <div>
          <h2>Product Inventory Catalog</h2>
          <p className="page-header-desc">
            Manage SKUs, pricing, stock thresholds, and suppliers across your entire enterprise catalog.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Icon name="download" size={16} />
            <span>Export CSV</span>
          </button>

          <button className="btn-primary" onClick={handleOpenAddModal}>
            <Icon name="plus" size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="card-box">
        <DataTable
          columns={columns}
          data={filteredProducts}
          isLoading={loading}
          searchPlaceholder="Search products by name, SKU, or category..."
          emptyMessage="No products match the criteria"
          emptySubtext="Try clearing the search or category filters, or add a new product."
          filters={
            <div className="datatable-custom-filters">
              {/* Category Filter */}
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (Optimal)</option>
                <option value="low_stock">Low Stock (At threshold)</option>
                <option value="out_of_stock">Out of Stock (0 units)</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
        maxWidth="680px"
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ergonomic Office Chair Pro"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <div className="label-with-action">
                <label className="form-label">SKU / Product Code *</label>
                <button
                  type="button"
                  className="btn-text-sm"
                  onClick={handleGenerateSku}
                >
                  Generate SKU
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. FUR-7721"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.categoryId}
                onChange={(e) => {
                  const catId = e.target.value;
                  const found = categories.find(c => c.id === catId);
                  setFormData({
                    ...formData,
                    categoryId: catId,
                    category: found ? found.name : ''
                  });
                }}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Retail Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="249.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Unit Cost / Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="140.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="50"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Min Stock Threshold (Low Alert)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="10"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Supplier Vendor</label>
              <select
                className="form-control"
                value={formData.supplierId}
                onChange={(e) => {
                  const supId = e.target.value;
                  const found = suppliers.find(s => s.id === supId);
                  setFormData({
                    ...formData,
                    supplierId: supId,
                    supplier: found ? found.name : ''
                  });
                }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Specifications</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Material, dimensions, warranty, or internal notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Product Details Drawer/Modal */}
      {viewProduct && (
        <Modal
          isOpen={!!viewProduct}
          onClose={() => setViewProduct(null)}
          title={`Product Details: ${viewProduct.name}`}
          maxWidth="640px"
        >
          <div className="view-product-card">
            <div className="view-product-header">
              <img
                src={viewProduct.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80'}
                alt={viewProduct.name}
                className="view-product-img"
              />
              <div className="view-product-summary">
                <h4>{viewProduct.name}</h4>
                <div className="view-product-sku">SKU: {viewProduct.sku}</div>
                <div className="view-badges-row">
                  <span className="category-pill-badge">{viewProduct.category}</span>
                  <span className={`badge-pill ${viewProduct.stock <= 0 ? 'badge-danger' : viewProduct.stock <= viewProduct.minStock ? 'badge-warning' : 'badge-success'}`}>
                    {viewProduct.stock <= 0 ? 'Out of Stock' : viewProduct.stock <= viewProduct.minStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>

            <div className="details-metrics-grid">
              <div className="metric-box">
                <span className="metric-box-label">Current Stock</span>
                <span className="metric-box-value">{viewProduct.stock} units</span>
              </div>
              <div className="metric-box">
                <span className="metric-box-label">Min Threshold</span>
                <span className="metric-box-value">{viewProduct.minStock} units</span>
              </div>
              <div className="metric-box">
                <span className="metric-box-label">Selling Price</span>
                <span className="metric-box-value">${Number(viewProduct.price).toFixed(2)}</span>
              </div>
              <div className="metric-box">
                <span className="metric-box-label">Inventory Valuation</span>
                <span className="metric-box-value">${(viewProduct.stock * viewProduct.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="view-info-section">
              <div className="info-row">
                <span className="info-key">Supplier Vendor:</span>
                <span className="info-val">{viewProduct.supplier || 'Not assigned'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Unit Cost:</span>
                <span className="info-val">${Number(viewProduct.cost || 0).toFixed(2)}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Gross Margin:</span>
                <span className="info-val text-success">
                  {viewProduct.price > 0 ? `${(((viewProduct.price - (viewProduct.cost || 0)) / viewProduct.price) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Description:</span>
                <span className="info-val">{viewProduct.description || 'No description provided.'}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setViewProduct(null)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const p = viewProduct;
                  setViewProduct(null);
                  handleOpenEditModal(p);
                }}
              >
                <Icon name="edit" size={16} />
                <span>Edit Product</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <Modal
          isOpen={!!stockAdjustProduct}
          onClose={() => setStockAdjustProduct(null)}
          title={`Adjust Stock: ${stockAdjustProduct.name}`}
          maxWidth="460px"
        >
          <form onSubmit={handleStockAdjustSubmit} className="modal-form">
            <div className="adjust-modal-summary">
              <div>
                <strong>Current Stock:</strong> {stockAdjustProduct.stock} units
              </div>
              <div className="text-muted text-sm">
                Enter positive value (+10) to add stock, or negative (-5) to deduct.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Stock Change Amount *</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. +15 or -8"
                value={adjustChange}
                onChange={(e) => setAdjustChange(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Audit Reason / Note</label>
              <input
                type="text"
                className="form-control"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Cycle count discrepancy, damaged item..."
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStockAdjustProduct(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Apply Stock Change
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}" (${productToDelete?.sku})? This will remove all associated catalog entries.`}
        confirmText="Yes, Delete Product"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Products;
