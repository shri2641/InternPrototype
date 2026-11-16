import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/common/StatCard';
import { AreaTrendChart, DonutChart, BarDistributionChart } from '../components/common/Charts';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icons';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const outletCtx = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Quick Stock Movement Modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState('IN');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementQty, setMovementQty] = useState('');
  const [movementRef, setMovementRef] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productsList, setProductsList] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, prodRes] = await Promise.all([
        inventoryApi.getDashboardSummary(),
        inventoryApi.getProducts()
      ]);
      setData(summaryRes);
      setProductsList(prodRes);
      if (outletCtx?.refreshSummary) {
        outletCtx.refreshSummary();
      }
    } catch (err) {
      showToast('Error loading dashboard data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openStockModal = (type, prodId = '') => {
    setStockModalType(type);
    setSelectedProductId(prodId || (productsList[0]?.id || ''));
    setMovementQty(type === 'IN' ? '10' : '5');
    setMovementRef(type === 'IN' ? 'PO-' + Math.floor(1000 + Math.random() * 9000) : 'SO-' + Math.floor(1000 + Math.random() * 9000));
    setMovementNote(type === 'IN' ? 'Inbound supplier batch receipt' : 'Customer order dispatch');
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product', 'warning');
      return;
    }
    const qty = Number(movementQty);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid quantity greater than 0', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryApi.recordMovement({
        productId: selectedProductId,
        type: stockModalType,
        quantity: qty,
        reference: movementRef,
        note: movementNote
      });
      showToast(
        `Successfully recorded stock ${stockModalType === 'IN' ? 'Inbound (+' + qty + ')' : 'Outbound (-' + qty + ')'}`,
        'success'
      );
      setStockModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to record stock movement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = data?.currency || '$';

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-header-banner">
        <div className="banner-text">
          <h2>Inventory Command Center</h2>
          <p>Real-time analytics, stock velocity, and automated reorder tracking.</p>
        </div>

        <div className="banner-actions">
          <button
            className="btn-primary"
            onClick={() => navigate('/products?action=add')}
          >
            <Icon name="plus" size={16} />
            <span>Add Product</span>
          </button>

          <button
            className="btn-success"
            onClick={() => openStockModal('IN')}
          >
            <Icon name="arrowIn" size={16} />
            <span>Stock In</span>
          </button>

          <button
            className="btn-purple"
            onClick={() => openStockModal('OUT')}
          >
            <Icon name="arrowOut" size={16} />
            <span>Stock Out</span>
          </button>

          <button
            className="btn-secondary"
            onClick={fetchDashboardData}
            title="Refresh Data"
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any out of stock */}
      {data?.outOfStockCount > 0 && (
        <div className="critical-alert-banner">
          <div className="alert-banner-left">
            <div className="alert-icon-pill">
              <Icon name="alertTriangle" size={20} />
            </div>
            <div>
              <strong>Critical Stock Alert:</strong> {data.outOfStockCount} product(s) are completely out of stock and require immediate supplier reordering!
            </div>
          </div>
          <button
            className="btn-outline-danger"
            onClick={() => navigate('/inventory?status=out_of_stock')}
          >
            View Reorder List →
          </button>
        </div>
      )}

      {/* Summary Stat Cards Grid */}
      <div className="stat-cards-grid">
        <StatCard
          title="Total Products"
          value={loading ? '...' : data?.totalProducts ?? 0}
          subtitle="Catalog SKU count"
          icon="package"
          iconBg="primary"
          trend="+8% this mo"
          trendUp={true}
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Total Stock Units"
          value={loading ? '...' : (data?.totalStock ?? 0).toLocaleString()}
          subtitle="Items in warehouses"
          icon="boxes"
          iconBg="success"
          trend="+15% vs last mo"
          trendUp={true}
          onClick={() => navigate('/inventory')}
        />

        <StatCard
          title="Low Stock Items"
          value={loading ? '...' : data?.lowStockCount ?? 0}
          subtitle="At or below minimum"
          icon="alertTriangle"
          iconBg="warning"
          alert={data?.lowStockCount > 0}
          trend={data?.lowStockCount > 0 ? 'Action needed' : 'All good'}
          trendUp={false}
          onClick={() => navigate('/inventory?status=low_stock')}
        />

        <StatCard
          title="Out of Stock"
          value={loading ? '...' : data?.outOfStockCount ?? 0}
          subtitle="0 available units"
          icon="alertCircle"
          iconBg="danger"
          alert={data?.outOfStockCount > 0}
          trend={data?.outOfStockCount > 0 ? 'Urgent PO' : 'Optimal'}
          trendUp={false}
          onClick={() => navigate('/inventory?status=out_of_stock')}
        />

        <StatCard
          title="Total Inventory Value"
          value={loading ? '...' : `${currency}${(data?.totalValuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Based on retail price"
          icon="dollar"
          iconBg="cyan"
          trend="+12.4% val"
          trendUp={true}
          onClick={() => navigate('/reports')}
        />

        <StatCard
          title="Product Categories"
          value={loading ? '...' : data?.totalCategories ?? 0}
          subtitle="Active departments"
          icon="layers"
          iconBg="purple"
          onClick={() => navigate('/categories')}
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="dashboard-charts-grid">
        {/* Monthly Inbound vs Outbound Trend */}
        <div className="card-box chart-card-large">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Monthly Inventory Flow Trends</h3>
              <p className="card-subtitle">Inbound Restock Receipts vs Outbound Dispatches (6-Month View)</p>
            </div>
            <button
              className="btn-ghost-sm"
              onClick={() => navigate('/movements')}
            >
              Movement Logs →
            </button>
          </div>
          <div className="card-body">
            <AreaTrendChart data={data?.monthlyTrends || []} height={250} />
          </div>
        </div>

        {/* Stock Availability Donut Chart */}
        <div className="card-box chart-card-small">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Stock Health Overview</h3>
              <p className="card-subtitle">Distribution by inventory thresholds</p>
            </div>
          </div>
          <div className="card-body">
            <DonutChart
              data={data?.stockDistribution || []}
              totalCount={data?.totalProducts || 0}
            />
          </div>
        </div>
      </div>

      {/* Category Distribution and Recent Movements Row */}
      <div className="dashboard-dual-section">
        {/* Category Distribution Bars */}
        <div className="card-box flex-1">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Category-wise Inventory Distribution</h3>
              <p className="card-subtitle">Stock valuation and units per category</p>
            </div>
            <button
              className="btn-ghost-sm"
              onClick={() => navigate('/categories')}
            >
              All Categories →
            </button>
          </div>
          <div className="card-body">
            <BarDistributionChart
              categories={data?.categoryStats || []}
              currency={currency}
            />
          </div>
        </div>

        {/* Recent Stock Movements Table */}
        <div className="card-box flex-1">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Recent Stock Movements</h3>
              <p className="card-subtitle">Real-time audit log of stock entries</p>
            </div>
            <button
              className="btn-ghost-sm"
              onClick={() => navigate('/movements')}
            >
              View Full History →
            </button>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="mini-datatable">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product & SKU</th>
                    <th>Qty</th>
                    <th>Stock Change</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentMovements?.length > 0 ? (
                    data.recentMovements.map(mov => (
                      <tr key={mov.id}>
                        <td>
                          <span className={`badge-pill badge-${mov.type?.toLowerCase()}`}>
                            {mov.type === 'IN' ? '↓ Inbound' : mov.type === 'OUT' ? '↑ Outbound' : '⚙ Adjust'}
                          </span>
                        </td>
                        <td>
                          <div className="cell-product-name">{mov.productName}</div>
                          <div className="cell-sku-text">{mov.sku}</div>
                        </td>
                        <td>
                          <span className={`movement-qty-tag ${mov.type === 'IN' ? 'text-success' : mov.type === 'OUT' ? 'text-danger' : 'text-primary'}`}>
                            {mov.type === 'IN' ? `+${mov.quantity}` : mov.type === 'OUT' ? `-${mov.quantity}` : mov.quantity}
                          </span>
                        </td>
                        <td>
                          <span className="stock-change-text">
                            {mov.previousStock} → <strong>{mov.newStock}</strong>
                          </span>
                        </td>
                        <td className="text-muted text-sm">
                          {new Date(mov.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No recent movements recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stock Movement Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={stockModalType === 'IN' ? 'Record Stock IN (Inbound Restock)' : 'Record Stock OUT (Customer Dispatch)'}
        maxWidth="520px"
      >
        <form onSubmit={handleStockSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-control"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              {productsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Reference / PO #</label>
              <input
                type="text"
                className="form-control"
                value={movementRef}
                onChange={(e) => setMovementRef(e.target.value)}
                placeholder="e.g. PO-8901, SO-4421"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Audit Note / Reason</label>
            <textarea
              className="form-control"
              rows={2}
              value={movementNote}
              onChange={(e) => setMovementNote(e.target.value)}
              placeholder="e.g. Received from vendor batch 4, Dispatched to client..."
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStockModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={stockModalType === 'IN' ? 'btn-success' : 'btn-purple'}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : stockModalType === 'IN' ? 'Confirm Stock IN' : 'Confirm Stock OUT'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
