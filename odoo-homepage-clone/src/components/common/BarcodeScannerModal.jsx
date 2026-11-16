import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import Modal from './Modal';
import Icon from './Icons';

export const BarcodeScannerModal = ({ isOpen, onClose, onStockUpdated }) => {
  const { showToast } = useNotification();
  const [skuQuery, setSkuQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [matchedProduct, setMatchedProduct] = useState(null);
  const [quickQty, setQuickQty] = useState(1);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSkuQuery('');
      setMatchedProduct(null);
      inventoryApi.getProducts().then(setProducts).catch(console.error);
    }
  }, [isOpen]);

  const handleSearch = (query) => {
    setSkuQuery(query);
    const clean = query.trim().toUpperCase();
    if (!clean) {
      setMatchedProduct(null);
      return;
    }
    const found = products.find(p => p.sku.toUpperCase() === clean || p.sku.toUpperCase().includes(clean));
    setMatchedProduct(found || null);
  };

  const handleQuickAction = async (type) => {
    if (!matchedProduct) return;
    const qty = parseInt(quickQty, 10) || 1;

    setProcessing(true);
    try {
      await inventoryApi.recordMovement({
        productId: matchedProduct.id,
        type: type,
        quantity: qty,
        reference: `SCAN-${Date.now().toString().slice(-4)}`,
        note: `Quick barcode scan ${type === 'IN' ? 'inbound receipt' : 'outbound dispatch'}`
      });

      showToast(`Scanned ${matchedProduct.sku}: ${type === 'IN' ? '+' : '-'}${qty} units updated!`, 'success');
      
      // Update local matched product stock
      const updatedStock = type === 'IN' ? matchedProduct.stock + qty : matchedProduct.stock - qty;
      setMatchedProduct({ ...matchedProduct, stock: Math.max(0, updatedStock) });

      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      showToast(err.message || 'Scan update failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Warehouse Barcode & RFID Scanner Simulator" maxWidth="560px">
      <div className="scanner-modal-body">
        {/* Animated Scanner Viewfinder */}
        <div className="scanner-viewfinder">
          <div className="scanner-laser-line"></div>
          <div className="scanner-corner top-left"></div>
          <div className="scanner-corner top-right"></div>
          <div className="scanner-corner bottom-left"></div>
          <div className="scanner-corner bottom-right"></div>
          <div className="scanner-hint-text">
            <Icon name="package" size={24} />
            <span>Point hardware scanner or select SKU below</span>
          </div>
        </div>

        {/* Input input */}
        <div className="form-group mt-3">
          <label className="form-label">SKU / Barcode Number</label>
          <div className="scanner-input-wrap">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. FUR-7721, ELEC-4091, NET-5510..."
              value={skuQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {skuQuery && (
              <button className="search-clear-btn" onClick={() => handleSearch('')}>
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick SKU Buttons */}
        <div className="quick-sku-chips">
          <span className="text-muted text-xs">Quick Test SKUs:</span>
          {products.slice(0, 4).map(p => (
            <button
              key={p.id}
              type="button"
              className="sku-chip-btn"
              onClick={() => handleSearch(p.sku)}
            >
              {p.sku}
            </button>
          ))}
        </div>

        {/* Match Result Display */}
        {matchedProduct ? (
          <div className="matched-scan-card mt-3">
            <img
              src={matchedProduct.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=80'}
              alt={matchedProduct.name}
              className="matched-scan-img"
            />
            <div className="matched-scan-details flex-1">
              <div className="matched-scan-title">{matchedProduct.name}</div>
              <div className="matched-scan-meta">
                <span>SKU: <strong>{matchedProduct.sku}</strong></span>
                <span>Category: {matchedProduct.category}</span>
                <span>Price: ${matchedProduct.price}</span>
              </div>
              <div className="matched-stock-pill mt-2">
                Current Warehouse Stock: <strong>{matchedProduct.stock} units</strong>
              </div>
            </div>

            {/* Direct Quick Scan Actions */}
            <div className="matched-quick-actions">
              <div className="scan-qty-input-wrap">
                <label className="text-xs text-muted">Scan Qty:</label>
                <input
                  type="number"
                  min="1"
                  className="form-control text-center py-1"
                  value={quickQty}
                  onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '65px' }}
                />
              </div>

              <button
                className="btn-success btn-sm w-100 mt-2"
                disabled={processing}
                onClick={() => handleQuickAction('IN')}
              >
                + Scan IN
              </button>
              <button
                className="btn-purple btn-sm w-100 mt-1"
                disabled={processing || matchedProduct.stock <= 0}
                onClick={() => handleQuickAction('OUT')}
              >
                - Scan OUT
              </button>
            </div>
          </div>
        ) : skuQuery ? (
          <div className="scan-not-found mt-3">
            <Icon name="alertTriangle" size={24} color="#f59e0b" />
            <span>No catalog item matched SKU "{skuQuery}"</span>
          </div>
        ) : null}

        <div className="modal-footer mt-4">
          <button className="btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
