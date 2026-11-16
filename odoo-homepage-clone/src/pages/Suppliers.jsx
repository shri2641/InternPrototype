import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Icon from '../components/common/Icons';

export const Suppliers = () => {
  const { showToast } = useNotification();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Supplier Details Modal
  const [viewSupplier, setViewSupplier] = useState(null);

  // Delete Supplier
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialForm = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    leadTimeDays: '7',
    status: 'Active',
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      showToast('Error loading suppliers: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      leadTimeDays: String(supplier.leadTimeDays || '7'),
      status: supplier.status || 'Active',
      notes: supplier.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Supplier name is required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        leadTimeDays: parseInt(formData.leadTimeDays, 10) || 7
      };

      if (editingSupplier) {
        await inventoryApi.updateSupplier(editingSupplier.id, payload);
        showToast(`Supplier "${formData.name}" updated`, 'success');
      } else {
        await inventoryApi.createSupplier(payload);
        showToast(`Supplier "${formData.name}" added`, 'success');
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      showToast(err.message || 'Error saving supplier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await inventoryApi.deleteSupplier(supplierToDelete.id);
      showToast(`Supplier "${supplierToDelete.name}" removed`, 'info');
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (err) {
      showToast(err.message || 'Error deleting supplier', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Supplier Organization',
      render: (val, row) => (
        <div className="supplier-main-cell">
          <div className="supplier-icon-pill">
            <Icon name="truck" size={18} />
          </div>
          <div>
            <span
              className="product-name-link"
              onClick={() => setViewSupplier(row)}
            >
              {val}
            </span>
            <div className="text-muted text-sm">{row.address || 'Address unlisted'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contactPerson',
      header: 'Key Contact',
      render: (val, row) => (
        <div className="contact-person-cell">
          <span className="contact-name">{val || '—'}</span>
          <span className="contact-email">{row.email || '—'}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (val) => <span className="text-sm">{val || '—'}</span>
    },
    {
      key: 'leadTimeDays',
      header: 'Lead Time',
      render: (val) => (
        <span className="lead-time-pill">{val} days average</span>
      )
    },
    {
      key: 'productCount',
      header: 'Catalog Items',
      align: 'center',
      render: (val, row) => (
        <button
          className="badge-count-link"
          onClick={() => setViewSupplier(row)}
          title="Click to view supplied products"
        >
          {val || 0} Products
        </button>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => (
        <span className={`badge-pill ${val === 'Active' ? 'badge-success' : 'badge-warning'}`}>
          {val || 'Active'}
        </span>
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
            title="View Details & Products"
            onClick={() => setViewSupplier(row)}
          >
            <Icon name="eye" size={16} />
          </button>
          <button
            className="action-icon-btn"
            title="Edit Supplier"
            onClick={() => handleOpenEdit(row)}
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            className="action-icon-btn delete-btn"
            title="Delete Supplier"
            onClick={() => setSupplierToDelete(row)}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="suppliers-page">
      <div className="page-header-row">
        <div>
          <h2>Supplier Vendor Directory</h2>
          <p className="page-header-desc">
            Manage vendor contacts, monitor order lead times, and link suppliers with stock catalog items.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Icon name="plus" size={16} />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="card-box">
        <DataTable
          columns={columns}
          data={suppliers}
          isLoading={loading}
          searchPlaceholder="Search suppliers by company name, contact, or email..."
          emptyMessage="No suppliers found"
          emptySubtext="Add a vendor to link with your catalog products."
        />
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Supplier'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Company / Supplier Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Apex Tech Supplies Inc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Key Contact Person</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Marcus Vance"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active Vendor</option>
                <option value="Pending">Pending Review</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="orders@supplier.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Physical Warehouse Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="City, State, Country"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Fulfillment Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vendor Notes & Payment Terms</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Net 30 payment terms, specialized in monitors..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Supplier Details Modal */}
      {viewSupplier && (
        <Modal
          isOpen={!!viewSupplier}
          onClose={() => setViewSupplier(null)}
          title={`Supplier Profile: ${viewSupplier.name}`}
          maxWidth="620px"
        >
          <div className="view-supplier-content">
            <div className="view-supplier-header">
              <div className="supplier-avatar-large">
                <Icon name="truck" size={32} />
              </div>
              <div>
                <h3>{viewSupplier.name}</h3>
                <div className="text-muted text-sm">{viewSupplier.address || 'Address unlisted'}</div>
                <div className="mt-2">
                  <span className={`badge-pill ${viewSupplier.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                    {viewSupplier.status}
                  </span>
                  <span className="lead-time-pill ml-2">{viewSupplier.leadTimeDays || 7} Days Lead Time</span>
                </div>
              </div>
            </div>

            <div className="details-metrics-grid mt-4">
              <div className="metric-box">
                <span className="metric-box-label">Contact Person</span>
                <span className="metric-box-value text-base">{viewSupplier.contactPerson || 'None specified'}</span>
              </div>
              <div className="metric-box">
                <span className="metric-box-label">Email</span>
                <span className="metric-box-value text-base text-truncate">{viewSupplier.email || 'N/A'}</span>
              </div>
              <div className="metric-box">
                <span className="metric-box-label">Phone</span>
                <span className="metric-box-value text-base">{viewSupplier.phone || 'N/A'}</span>
              </div>
              <div className="metric-box">
                <span className="metric-box-label">Linked Products</span>
                <span className="metric-box-value">{viewSupplier.productCount || viewSupplier.products?.length || 0} SKUs</span>
              </div>
            </div>

            {viewSupplier.notes && (
              <div className="view-notes-box mt-3">
                <strong>Internal Vendor Notes:</strong>
                <p className="text-muted mt-1">{viewSupplier.notes}</p>
              </div>
            )}

            <div className="supplier-products-section mt-4">
              <h4 className="section-subheading">Supplied Products in Catalog</h4>
              {viewSupplier.products && viewSupplier.products.length > 0 ? (
                <div className="mini-products-list">
                  {viewSupplier.products.map(p => (
                    <div key={p.id} className="mini-prod-item">
                      <div className="mini-prod-info">
                        <span className="mini-prod-name">{p.name}</span>
                        <span className="mini-prod-sku">SKU: {p.sku}</span>
                      </div>
                      <span className="badge-pill badge-primary">
                        {p.stock} units
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No products currently assigned to this vendor.</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewSupplier(null)}>Close</button>
              <button
                className="btn-primary"
                onClick={() => {
                  const s = viewSupplier;
                  setViewSupplier(null);
                  handleOpenEdit(s);
                }}
              >
                <Icon name="edit" size={16} />
                <span>Edit Supplier</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to remove supplier "${supplierToDelete?.name}"? Linked products will remain in the catalog.`}
        confirmText="Yes, Remove Supplier"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Suppliers;
