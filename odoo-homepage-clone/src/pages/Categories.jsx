import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Icon from '../components/common/Icons';

export const Categories = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Category Products Modal
  const [viewCategory, setViewCategory] = useState(null);

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialForm = {
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'Folder'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        inventoryApi.getCategories(),
        inventoryApi.getProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      showToast('Error loading categories: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#3b82f6',
      icon: category.icon || 'Folder'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await inventoryApi.updateCategory(editingCategory.id, formData);
        showToast(`Category "${formData.name}" updated`, 'success');
      } else {
        await inventoryApi.createCategory(formData);
        showToast(`Category "${formData.name}" created`, 'success');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Error saving category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await inventoryApi.deleteCategory(categoryToDelete.id);
      showToast(`Category "${categoryToDelete.name}" removed`, 'info');
      setCategoryToDelete(null);
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Error deleting category', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const availableColors = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'
  ];

  return (
    <div className="categories-page">
      <div className="page-header-row">
        <div>
          <h2>Product Categories</h2>
          <p className="page-header-desc">
            Organize catalog products, track department valuation, and manage inventory groupings.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Icon name="plus" size={16} />
          <span>New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state-box">
          <Icon name="refresh" size={28} className="spin-icon" />
          <p>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="card-box empty-state-box text-center py-5">
          <Icon name="layers" size={48} />
          <h4 className="mt-3">No categories found</h4>
          <p className="text-muted">Create your first category to start organizing inventory.</p>
          <button className="btn-primary mt-3" onClick={handleOpenAdd}>Create Category</button>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map(cat => {
            const catProducts = products.filter(p => p.categoryId === cat.id || p.category === cat.name);
            const totalStock = catProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
            const totalVal = catProducts.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);

            return (
              <div key={cat.id} className="category-card" style={{ borderTopColor: cat.color || '#3b82f6' }}>
                <div className="category-card-top">
                  <div className="category-badge-icon" style={{ backgroundColor: `${cat.color || '#3b82f6'}20`, color: cat.color || '#3b82f6' }}>
                    <Icon name="layers" size={22} color={cat.color || '#3b82f6'} />
                  </div>
                  <div className="category-actions-group">
                    <button
                      className="action-icon-btn"
                      title="Edit Category"
                      onClick={() => handleOpenEdit(cat)}
                    >
                      <Icon name="edit" size={15} />
                    </button>
                    <button
                      className="action-icon-btn delete-btn"
                      title="Delete Category"
                      onClick={() => setCategoryToDelete(cat)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="category-card-name">{cat.name}</h3>
                <p className="category-card-desc">{cat.description || 'No description entered.'}</p>

                <div className="category-card-metrics">
                  <div className="metric-pill">
                    <span className="metric-num">{catProducts.length}</span>
                    <span className="metric-lbl">Products</span>
                  </div>
                  <div className="metric-pill">
                    <span className="metric-num">{totalStock}</span>
                    <span className="metric-lbl">Total Stock</span>
                  </div>
                  <div className="metric-pill">
                    <span className="metric-num">${totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="metric-lbl">Valuation</span>
                  </div>
                </div>

                <div className="category-card-footer">
                  <button
                    className="btn-ghost-sm"
                    onClick={() => setViewCategory(cat)}
                  >
                    Quick View Items ({catProducts.length})
                  </button>
                  <button
                    className="btn-text-sm"
                    onClick={() => navigate(`/products?category=${cat.id}`)}
                  >
                    Filter in Table →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Category'}
        maxWidth="500px"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Warehouse Equipment, Peripherals..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Brief description of the items in this group..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color Theme Tag</label>
            <div className="color-picker-row">
              {availableColors.map(c => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch-btn ${formData.color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFormData({ ...formData, color: c })}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
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
              {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Products in Category Modal */}
      {viewCategory && (
        <Modal
          isOpen={!!viewCategory}
          onClose={() => setViewCategory(null)}
          title={`Products in "${viewCategory.name}"`}
          maxWidth="640px"
        >
          {(() => {
            const catProds = products.filter(p => p.categoryId === viewCategory.id || p.category === viewCategory.name);
            return (
              <div className="category-products-modal-content">
                {catProds.length === 0 ? (
                  <p className="text-muted text-center py-4">No products currently assigned to this category.</p>
                ) : (
                  <div className="mini-products-list">
                    {catProds.map(p => (
                      <div key={p.id} className="mini-prod-item">
                        <img
                          src={p.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=80&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          className="mini-prod-img"
                        />
                        <div className="mini-prod-info">
                          <span className="mini-prod-name">{p.name}</span>
                          <span className="mini-prod-sku">{p.sku} | ${p.price}</span>
                        </div>
                        <div className="mini-prod-stock">
                          <span className={`badge-pill ${p.stock <= 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>
                            {p.stock} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setViewCategory(null)}>Close</button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const id = viewCategory.id;
                      setViewCategory(null);
                      navigate(`/products?category=${id}`);
                    }}
                  >
                    Manage in Products Table →
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? Existing products will not be deleted but will become uncategorized.`}
        confirmText="Yes, Delete Category"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Categories;
