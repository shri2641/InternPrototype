import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Icon from '../components/common/Icons';

export const Reports = () => {
  const { showToast } = useNotification();
  const [reportsData, setReportsData] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);

  // Filter tab
  const [activeTab, setActiveTab] = useState('valuation'); // 'valuation', 'movements', 'lowstock'

  const loadData = async () => {
    try {
      const [repRes, prodRes, movRes] = await Promise.all([
        inventoryApi.getReports(),
        inventoryApi.getProducts(),
        inventoryApi.getMovements()
      ]);
      setReportsData(repRes);
      setProducts(prodRes);
      setMovements(movRes);
    } catch (err) {
      showToast('Error loading reports: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CSV Export dispatcher
  const handleExportCSV = () => {
    if (activeTab === 'valuation') {
      const headers = ['SKU', 'Product Name', 'Category', 'Stock Units', 'Unit Price ($)', 'Unit Cost ($)', 'Valuation ($)', 'Est Profit Margin ($)'];
      const rows = products.map(p => [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        p.stock,
        p.price,
        p.cost,
        (p.stock * p.price).toFixed(2),
        (p.stock * (p.price - p.cost)).toFixed(2)
      ]);
      downloadCsv(headers, rows, `inventory_valuation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (activeTab === 'movements') {
      const headers = ['Timestamp', 'Type', 'SKU', 'Product Name', 'Quantity', 'Previous Stock', 'New Stock', 'Reference', 'Auditor'];
      const rows = movements.map(m => [
        `"${new Date(m.timestamp).toLocaleString()}"`,
        m.type,
        m.sku,
        `"${m.productName.replace(/"/g, '""')}"`,
        m.quantity,
        m.previousStock,
        m.newStock,
        `"${m.reference || ''}"`,
        `"${m.performedBy || 'Admin'}"`
      ]);
      downloadCsv(headers, rows, `stock_movements_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const lowStockProds = products.filter(p => p.stock <= (p.minStock || 10));
      const headers = ['SKU', 'Product Name', 'Category', 'Current Stock', 'Min Threshold', 'Deficit To Reorder', 'Supplier'];
      const rows = lowStockProds.map(p => [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        p.stock,
        p.minStock,
        Math.max(0, (p.minStock * 2) - p.stock),
        `"${p.supplier || ''}"`
      ]);
      downloadCsv(headers, rows, `low_stock_reorder_report_${new Date().toISOString().slice(0, 10)}.csv`);
    }
    showToast(`Exported ${activeTab} report to CSV`, 'success');
  };

  const downloadCsv = (headers, rows, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportsData?.summary;
  const topProducts = reportsData?.topValuedProducts || [];
  const lowStockList = products.filter(p => p.stock <= (p.minStock || 10));

  return (
    <div className="reports-page">
      {/* Screen Header */}
      <div className="page-header-row print-hide">
        <div>
          <h2>Analytics & Executive Reports</h2>
          <p className="page-header-desc">
            Auditable business intelligence, capital valuation, stock movement velocities, and reorder forecasts.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            <Icon name="barChart" size={16} />
            <span>Print / PDF</span>
          </button>

          <button className="btn-primary" onClick={handleExportCSV}>
            <Icon name="download" size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="reports-tabs-bar print-hide">
        <button
          className={`tab-btn ${activeTab === 'valuation' ? 'active' : ''}`}
          onClick={() => setActiveTab('valuation')}
        >
          <Icon name="dollar" size={16} />
          <span>Inventory Valuation</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <Icon name="shoppingCart" size={16} />
          <span>Movement Velocity & Turnover</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'lowstock' ? 'active' : ''}`}
          onClick={() => setActiveTab('lowstock')}
        >
          <Icon name="alertTriangle" size={16} />
          <span>Low Stock & Reorder Forecast</span>
        </button>
      </div>

      {/* TAB 1: VALUATION REPORT */}
      {activeTab === 'valuation' && (
        <div className="report-content-section">
          {/* Key Metric Blocks */}
          <div className="report-metrics-grid">
            <div className="report-metric-card">
              <span className="rep-metric-title">Total Retail Valuation</span>
              <h3 className="rep-metric-val text-success">
                ${(summary?.totalValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="rep-metric-sub">Potential revenue value of catalog</span>
            </div>

            <div className="report-metric-card">
              <span className="rep-metric-title">Total Cost Basis</span>
              <h3 className="rep-metric-val text-primary">
                ${(summary?.totalCostValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="rep-metric-sub">Total capital invested in inventory</span>
            </div>

            <div className="report-metric-card">
              <span className="rep-metric-title">Gross Profit Potential</span>
              <h3 className="rep-metric-val text-purple">
                ${((summary?.totalValuation || 0) - (summary?.totalCostValuation || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="rep-metric-sub">
                Gross Margin: {summary?.totalValuation > 0 ? (((summary.totalValuation - summary.totalCostValuation) / summary.totalValuation) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="report-metric-card">
              <span className="rep-metric-title">Total Monitored Units</span>
              <h3 className="rep-metric-val">
                {(summary?.totalStock || 0).toLocaleString()}
              </h3>
              <span className="rep-metric-sub">Across {summary?.totalProducts || 0} active SKUs</span>
            </div>
          </div>

          {/* Top Valued Products Table */}
          <div className="card-box mt-4">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Top 10 Highest Valued Inventory Assets</h3>
                <p className="card-subtitle">Ranked by capital held in warehouse stock (Stock × Retail Price)</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="mini-datatable">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Stock Units</th>
                    <th>Unit Price</th>
                    <th>Unit Cost</th>
                    <th>Total Valuation</th>
                    <th>Gross Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={p.id}>
                      <td><span className="rank-badge">#{idx + 1}</span></td>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="text-muted text-sm">SKU: {p.sku}</div>
                      </td>
                      <td><span className="category-pill-badge">{p.category}</span></td>
                      <td><strong>{p.stock}</strong> units</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>${Number(p.cost).toFixed(2)}</td>
                      <td className="text-success font-weight-bold">
                        ${Number(p.valuation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-purple">
                        {p.price > 0 ? `${(((p.price - p.cost) / p.price) * 100).toFixed(1)}%` : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVEMENT REPORT */}
      {activeTab === 'movements' && (
        <div className="report-content-section">
          <div className="report-metrics-grid">
            <div className="report-metric-card">
              <span className="rep-metric-title">Total Inbound Shipments</span>
              <h3 className="rep-metric-val text-success">{reportsData?.totalInboundMovements || 0} POs</h3>
              <span className="rep-metric-sub">+{reportsData?.totalInboundQty || 0} units received</span>
            </div>

            <div className="report-metric-card">
              <span className="rep-metric-title">Total Outbound Dispatches</span>
              <h3 className="rep-metric-val text-danger">{reportsData?.totalOutboundMovements || 0} Orders</h3>
              <span className="rep-metric-sub">-{reportsData?.totalOutboundQty || 0} units fulfilled</span>
            </div>

            <div className="report-metric-card">
              <span className="rep-metric-title">Fulfillment Ratio</span>
              <h3 className="rep-metric-val text-cyan">
                {reportsData?.totalInboundQty > 0
                  ? `${((reportsData.totalOutboundQty / reportsData.totalInboundQty) * 100).toFixed(1)}%`
                  : 'N/A'}
              </h3>
              <span className="rep-metric-sub">Outbound units / Inbound intake</span>
            </div>

            <div className="report-metric-card">
              <span className="rep-metric-title">Audit Adjustments</span>
              <h3 className="rep-metric-val text-warning">
                {movements.filter(m => m.type === 'ADJUST').length} Events
              </h3>
              <span className="rep-metric-sub">Physical warehouse discrepancies</span>
            </div>
          </div>

          <div className="card-box mt-4">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Recent Stock Movement Transactions</h3>
                <p className="card-subtitle">Complete chronological velocity log</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="mini-datatable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>SKU & Product</th>
                    <th>Quantity</th>
                    <th>Reference #</th>
                    <th>Auditor</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id}>
                      <td className="text-muted text-sm">{new Date(m.timestamp).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge-pill badge-${m.type.toLowerCase()}`}>
                          {m.type === 'IN' ? '↓ Inbound' : m.type === 'OUT' ? '↑ Outbound' : '⚙ Adjust'}
                        </span>
                      </td>
                      <td>
                        <strong>{m.productName}</strong>
                        <div className="text-muted text-sm">{m.sku}</div>
                      </td>
                      <td>
                        <strong className={m.type === 'IN' ? 'text-success' : m.type === 'OUT' ? 'text-danger' : 'text-primary'}>
                          {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : m.quantity} units
                        </strong>
                      </td>
                      <td><span className="ref-tag">{m.reference}</span></td>
                      <td className="text-muted text-sm">{m.performedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOW STOCK & REORDER REPORT */}
      {activeTab === 'lowstock' && (
        <div className="report-content-section">
          <div className="alert-banner-box">
            <Icon name="alertTriangle" size={24} color="#f59e0b" />
            <div>
              <h4>Active Reorder Recommendations</h4>
              <p>The following items are at or below their assigned minimum safety stock levels. Issue purchase orders immediately to avoid out-of-stock supply disruptions.</p>
            </div>
          </div>

          <div className="card-box mt-4">
            <div className="table-responsive">
              <table className="mini-datatable">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Available Stock</th>
                    <th>Min Safety Threshold</th>
                    <th>Recommended Order Qty</th>
                    <th>Primary Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockList.length > 0 ? (
                    lowStockList.map(p => {
                      const isOut = p.stock <= 0;
                      const recommendedQty = Math.max(10, (p.minStock * 2) - p.stock);

                      return (
                        <tr key={p.id}>
                          <td>
                            <span className={`badge-pill ${isOut ? 'badge-danger' : 'badge-warning'}`}>
                              {isOut ? 'CRITICAL OUT' : 'LOW STOCK'}
                            </span>
                          </td>
                          <td>
                            <strong>{p.name}</strong>
                            <div className="text-muted text-sm">SKU: {p.sku}</div>
                          </td>
                          <td><span className="category-pill-badge">{p.category}</span></td>
                          <td>
                            <strong className={isOut ? 'text-danger' : 'text-warning'}>
                              {p.stock} units
                            </strong>
                          </td>
                          <td>{p.minStock} units</td>
                          <td>
                            <span className="reorder-qty-pill">
                              Order +{recommendedQty} units
                            </span>
                          </td>
                          <td className="text-muted text-sm">{p.supplier || 'Unassigned'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-success">
                        <Icon name="checkCircle" size={24} color="#10b981" />
                        <div className="mt-2">All product stock counts are currently above minimum safety thresholds!</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
