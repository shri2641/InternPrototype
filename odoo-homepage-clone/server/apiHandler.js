import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to read data
export function getDbData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading data.json:', err);
  }
  return { products: [], categories: [], suppliers: [], movements: [], settings: {}, user: {} };
}

// Helper to write data
export function saveDbData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing data.json:', err);
    return false;
  }
}

// Compute dashboard summary stats
export function getDashboardSummary() {
  const db = getDbData();
  const products = db.products || [];
  const categories = db.categories || [];
  const movements = db.movements || [];

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockThreshold = db.settings?.lowStockThreshold || 10;

  const lowStockItems = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.minStock) || lowStockThreshold));
  const outOfStockItems = products.filter(p => (Number(p.stock) || 0) <= 0);
  
  const totalValuation = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);
  const totalCostValuation = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.cost) || 0)), 0);

  // Category breakdown
  const categoryStats = categories.map(cat => {
    const prods = products.filter(p => p.categoryId === cat.id || p.category === cat.name);
    const count = prods.length;
    const catStock = prods.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const value = prods.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color || '#6366f1',
      count,
      stock: catStock,
      value
    };
  });

  // Monthly trends (computed or realistic breakdown)
  const monthlyTrends = [
    { month: 'Jun', inbound: 140, outbound: 110 },
    { month: 'Jul', inbound: 165, outbound: 130 },
    { month: 'Aug', inbound: 190, outbound: 175 },
    { month: 'Sep', inbound: 210, outbound: 195 },
    { month: 'Oct', inbound: 240, outbound: 210 },
    { month: 'Nov', inbound: 285, outbound: 235 }
  ];

  // Stock status distribution
  const stockDistribution = [
    { label: 'In Stock (Optimal)', count: Math.max(0, totalProducts - lowStockItems.length - outOfStockItems.length), color: '#10b981' },
    { label: 'Low Stock', count: lowStockItems.length, color: '#f59e0b' },
    { label: 'Out of Stock', count: outOfStockItems.length, color: '#ef4444' }
  ];

  // Recent movements sorted by timestamp desc
  const recentMovements = [...movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7);

  return {
    totalProducts,
    totalStock,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    lowStockItems,
    outOfStockItems,
    totalValuation,
    totalCostValuation,
    totalCategories: categories.length,
    categoryStats,
    monthlyTrends,
    stockDistribution,
    recentMovements,
    currency: db.settings?.currency || '$'
  };
}

// Main API Dispatcher
export function handleApiRequest(url, method, body = null, queryParams = {}) {
  const db = getDbData();
  const cleanPath = url.split('?')[0].replace(/^\/api/, '');

  // 1. Dashboard summary
  if (cleanPath === '/dashboard/summary' && method === 'GET') {
    return { status: 200, data: getDashboardSummary() };
  }

  // 2. Health check
  if (cleanPath === '/health') {
    return { status: 200, data: { status: 'healthy', timestamp: new Date().toISOString() } };
  }

  // 3. User Profile
  if (cleanPath === '/auth/me' && method === 'GET') {
    return { status: 200, data: db.user };
  }
  if (cleanPath === '/auth/profile' && method === 'PUT') {
    db.user = { ...db.user, ...body, updatedAt: new Date().toISOString() };
    saveDbData(db);
    return { status: 200, data: db.user };
  }

  // 4. Settings
  if (cleanPath === '/settings' && method === 'GET') {
    return { status: 200, data: db.settings };
  }
  if (cleanPath === '/settings' && method === 'PUT') {
    db.settings = { ...db.settings, ...body };
    saveDbData(db);
    return { status: 200, data: db.settings };
  }

  // 5. Products routes
  if (cleanPath === '/products') {
    if (method === 'GET') {
      let result = [...(db.products || [])];
      
      // Search
      const search = (queryParams.search || '').trim().toLowerCase();
      if (search) {
        result = result.filter(p => 
          (p.name && p.name.toLowerCase().includes(search)) ||
          (p.sku && p.sku.toLowerCase().includes(search)) ||
          (p.category && p.category.toLowerCase().includes(search)) ||
          (p.description && p.description.toLowerCase().includes(search))
        );
      }

      // Filter by category
      if (queryParams.category && queryParams.category !== 'all') {
        result = result.filter(p => p.categoryId === queryParams.category || p.category.toLowerCase() === queryParams.category.toLowerCase());
      }

      // Filter by stock status
      if (queryParams.status && queryParams.status !== 'all') {
        const threshold = db.settings?.lowStockThreshold || 10;
        if (queryParams.status === 'in_stock') {
          result = result.filter(p => (Number(p.stock) || 0) > (Number(p.minStock) || threshold));
        } else if (queryParams.status === 'low_stock') {
          result = result.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.minStock) || threshold));
        } else if (queryParams.status === 'out_of_stock') {
          result = result.filter(p => (Number(p.stock) || 0) <= 0);
        }
      }

      // Sorting
      const sortBy = queryParams.sortBy || 'name';
      const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        if (sortBy === 'price' || sortBy === 'stock' || sortBy === 'cost') {
          return ((Number(a[sortBy]) || 0) - (Number(b[sortBy]) || 0)) * sortOrder;
        }
        return (String(a[sortBy] || '')).localeCompare(String(b[sortBy] || '')) * sortOrder;
      });

      return { status: 200, data: result };
    }

    if (method === 'POST') {
      const newProduct = {
        id: 'prod-' + Date.now(),
        name: body.name || 'Untitled Product',
        sku: body.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        categoryId: body.categoryId || '',
        category: body.category || 'General',
        price: Number(body.price) || 0,
        cost: Number(body.cost) || 0,
        stock: Number(body.stock) || 0,
        minStock: Number(body.minStock) || (db.settings?.lowStockThreshold || 10),
        supplierId: body.supplierId || '',
        supplier: body.supplier || 'Standard Vendor',
        description: body.description || '',
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.products = [newProduct, ...(db.products || [])];
      
      // Also record initial movement if stock > 0
      if (newProduct.stock > 0) {
        const initialMov = {
          id: 'mov-' + Date.now(),
          productId: newProduct.id,
          productName: newProduct.name,
          sku: newProduct.sku,
          type: 'IN',
          quantity: newProduct.stock,
          previousStock: 0,
          newStock: newProduct.stock,
          reference: 'INIT-STOCK',
          note: 'Initial inventory on product creation',
          timestamp: new Date().toISOString(),
          performedBy: db.user?.name || 'Admin'
        };
        db.movements = [initialMov, ...(db.movements || [])];
      }

      saveDbData(db);
      return { status: 201, data: newProduct };
    }
  }

  // Single Product operations
  const prodMatch = cleanPath.match(/^\/products\/([a-zA-Z0-9_-]+)(\/stock)?$/);
  if (prodMatch) {
    const prodId = prodMatch[1];
    const isStockUpdate = !!prodMatch[2];
    const index = db.products.findIndex(p => p.id === prodId);

    if (index === -1) {
      return { status: 404, data: { error: 'Product not found' } };
    }

    if (method === 'GET') {
      const prod = db.products[index];
      const prodMovements = (db.movements || []).filter(m => m.productId === prodId);
      return { status: 200, data: { ...prod, movements: prodMovements } };
    }

    if (method === 'DELETE') {
      const deleted = db.products.splice(index, 1)[0];
      saveDbData(db);
      return { status: 200, data: { message: 'Product deleted', product: deleted } };
    }

    if (method === 'PUT') {
      db.products[index] = {
        ...db.products[index],
        ...body,
        updatedAt: new Date().toISOString()
      };
      saveDbData(db);
      return { status: 200, data: db.products[index] };
    }

    if (isStockUpdate && (method === 'PATCH' || method === 'POST')) {
      const current = db.products[index];
      const prevStock = Number(current.stock) || 0;
      const change = Number(body.change) || 0;
      const newStock = Math.max(0, prevStock + change);
      
      current.stock = newStock;
      current.updatedAt = new Date().toISOString();

      const mov = {
        id: 'mov-' + Date.now(),
        productId: current.id,
        productName: current.name,
        sku: current.sku,
        type: change >= 0 ? 'IN' : 'OUT',
        quantity: Math.abs(change),
        previousStock: prevStock,
        newStock: newStock,
        reference: body.reference || 'QUICK-ADJUST',
        note: body.note || 'Manual quick stock update',
        timestamp: new Date().toISOString(),
        performedBy: db.user?.name || 'Admin'
      };
      db.movements = [mov, ...(db.movements || [])];
      saveDbData(db);

      return { status: 200, data: { product: current, movement: mov } };
    }
  }

  // 6. Categories routes
  if (cleanPath === '/categories') {
    if (method === 'GET') {
      const catsWithCount = (db.categories || []).map(cat => {
        const prods = (db.products || []).filter(p => p.categoryId === cat.id || p.category === cat.name);
        return {
          ...cat,
          productCount: prods.length,
          totalStock: prods.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
        };
      });
      return { status: 200, data: catsWithCount };
    }

    if (method === 'POST') {
      const newCat = {
        id: 'cat-' + Date.now(),
        name: body.name || 'New Category',
        description: body.description || '',
        color: body.color || '#6366f1',
        icon: body.icon || 'Folder',
        createdAt: new Date().toISOString()
      };
      db.categories = [...(db.categories || []), newCat];
      saveDbData(db);
      return { status: 201, data: newCat };
    }
  }

  const catMatch = cleanPath.match(/^\/categories\/([a-zA-Z0-9_-]+)$/);
  if (catMatch) {
    const catId = catMatch[1];
    const index = db.categories.findIndex(c => c.id === catId);
    if (index === -1) {
      return { status: 404, data: { error: 'Category not found' } };
    }

    if (method === 'PUT') {
      db.categories[index] = { ...db.categories[index], ...body };
      saveDbData(db);
      return { status: 200, data: db.categories[index] };
    }

    if (method === 'DELETE') {
      const deleted = db.categories.splice(index, 1)[0];
      saveDbData(db);
      return { status: 200, data: deleted };
    }
  }

  // 7. Suppliers routes
  if (cleanPath === '/suppliers') {
    if (method === 'GET') {
      const supsWithCount = (db.suppliers || []).map(sup => {
        const prods = (db.products || []).filter(p => p.supplierId === sup.id || p.supplier === sup.name);
        return {
          ...sup,
          productCount: prods.length,
          products: prods.map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock }))
        };
      });
      return { status: 200, data: supsWithCount };
    }

    if (method === 'POST') {
      const newSup = {
        id: 'sup-' + Date.now(),
        name: body.name || 'New Supplier',
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        address: body.address || '',
        leadTimeDays: Number(body.leadTimeDays) || 7,
        status: body.status || 'Active',
        notes: body.notes || ''
      };
      db.suppliers = [...(db.suppliers || []), newSup];
      saveDbData(db);
      return { status: 201, data: newSup };
    }
  }

  const supMatch = cleanPath.match(/^\/suppliers\/([a-zA-Z0-9_-]+)$/);
  if (supMatch) {
    const supId = supMatch[1];
    const index = db.suppliers.findIndex(s => s.id === supId);
    if (index === -1) {
      return { status: 404, data: { error: 'Supplier not found' } };
    }

    if (method === 'PUT') {
      db.suppliers[index] = { ...db.suppliers[index], ...body };
      saveDbData(db);
      return { status: 200, data: db.suppliers[index] };
    }

    if (method === 'DELETE') {
      const deleted = db.suppliers.splice(index, 1)[0];
      saveDbData(db);
      return { status: 200, data: deleted };
    }
  }

  // 8. Movements & Inventory Adjustments
  if (cleanPath === '/movements' || cleanPath === '/inventory/movements') {
    if (method === 'GET') {
      let list = [...(db.movements || [])];
      if (queryParams.type && queryParams.type !== 'all') {
        list = list.filter(m => m.type.toUpperCase() === queryParams.type.toUpperCase());
      }
      if (queryParams.search) {
        const s = queryParams.search.toLowerCase();
        list = list.filter(m => 
          (m.productName && m.productName.toLowerCase().includes(s)) ||
          (m.sku && m.sku.toLowerCase().includes(s)) ||
          (m.reference && m.reference.toLowerCase().includes(s))
        );
      }
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { status: 200, data: list };
    }

    if (method === 'POST') {
      const { productId, type, quantity, reference, note } = body;
      const prod = db.products.find(p => p.id === productId);
      if (!prod) {
        return { status: 404, data: { error: 'Product not found for movement' } };
      }

      const qty = Math.max(1, Number(quantity) || 1);
      const prevStock = Number(prod.stock) || 0;
      let newStock = prevStock;

      if (type === 'IN') {
        newStock = prevStock + qty;
      } else if (type === 'OUT') {
        if (prevStock < qty) {
          return { status: 400, data: { error: `Cannot dispatch ${qty} units. Current stock is only ${prevStock}.` } };
        }
        newStock = prevStock - qty;
      } else if (type === 'ADJUST') {
        newStock = Number(quantity); // For adjust, quantity can represent the new target count
      }

      prod.stock = Math.max(0, newStock);
      prod.updatedAt = new Date().toISOString();

      const mov = {
        id: 'mov-' + Date.now(),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: type.toUpperCase(),
        quantity: type === 'ADJUST' ? Math.abs(newStock - prevStock) : qty,
        previousStock: prevStock,
        newStock: prod.stock,
        reference: reference || (type === 'IN' ? 'PO-RESTOCK' : type === 'OUT' ? 'SO-DISPATCH' : 'AUDIT-ADJUST'),
        note: note || '',
        timestamp: new Date().toISOString(),
        performedBy: db.user?.name || 'Admin'
      };

      db.movements = [mov, ...(db.movements || [])];
      saveDbData(db);

      return { status: 201, data: { movement: mov, product: prod } };
    }
  }

  // 9. Reports API
  if (cleanPath === '/reports') {
    const summary = getDashboardSummary();
    const products = db.products || [];
    const movements = db.movements || [];

    const valuationByCat = summary.categoryStats;
    const topValuedProducts = [...products]
      .sort((a, b) => ((b.stock * b.price) - (a.stock * a.price)))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        stock: p.stock,
        price: p.price,
        cost: p.cost,
        valuation: (p.stock * p.price),
        profitPotential: (p.stock * (p.price - p.cost))
      }));

    const stockOutHistory = movements.filter(m => m.type === 'OUT');
    const stockInHistory = movements.filter(m => m.type === 'IN');

    return {
      status: 200,
      data: {
        summary,
        topValuedProducts,
        valuationByCat,
        totalInboundMovements: stockInHistory.length,
        totalOutboundMovements: stockOutHistory.length,
        totalInboundQty: stockInHistory.reduce((s, m) => s + (m.quantity || 0), 0),
        totalOutboundQty: stockOutHistory.reduce((s, m) => s + (m.quantity || 0), 0),
      }
    };
  }

  // 10. Warehouses & Storage Facilities
  if (cleanPath === '/warehouses') {
    if (method === 'GET') {
      return { status: 200, data: db.warehouses || [] };
    }
    if (method === 'POST') {
      const newWh = {
        id: 'wh-' + Date.now(),
        name: body.name || 'New Facility',
        code: body.code || 'WH-' + Math.floor(100 + Math.random() * 900),
        location: body.location || body.address || '',
        address: body.address || body.location || '',
        manager: body.manager || '',
        phone: body.phone || '',
        email: body.email || '',
        capacity: body.capacity ? `${body.capacity}%` : '0%',
        status: body.status || 'Operational',
        hazardCertified: !!body.hazardCertified,
        notes: body.notes || '',
        lastAudit: body.lastAudit || new Date().toISOString().split('T')[0],
        totalSKUs: Number(body.totalSKUs) || 0,
      };
      db.warehouses = [...(db.warehouses || []), newWh];
      saveDbData(db);
      return { status: 201, data: newWh };
    }
  }

  const whMatch = cleanPath.match(/^\/warehouses\/([a-zA-Z0-9_-]+)$/);
  if (whMatch) {
    const whId = whMatch[1];
    const idx = (db.warehouses || []).findIndex(w => w.id === whId);
    if (idx === -1) return { status: 404, data: { error: 'Warehouse not found' } };
    if (method === 'PUT') {
      db.warehouses[idx] = {
        ...db.warehouses[idx], ...body,
        capacity: body.capacity ? `${String(body.capacity).replace('%','')}%` : db.warehouses[idx].capacity,
      };
      saveDbData(db);
      return { status: 200, data: db.warehouses[idx] };
    }
    if (method === 'DELETE') {
      db.warehouses = db.warehouses.filter(w => w.id !== whId);
      saveDbData(db);
      return { status: 200, data: { message: 'Warehouse deleted' } };
    }
  }

  // 11. Safety & Quality Control Inspections
  if (cleanPath === '/safety/inspections') {
    if (method === 'GET') {
      return { status: 200, data: db.safetyInspections || [] };
    }
    if (method === 'POST') {
      const newInsp = {
        id: 'insp-' + Date.now(),
        productId: body.productId,
        productName: body.productName,
        sku: body.sku,
        batchNumber: body.batchNumber || 'LOT-' + Date.now().toString().slice(-4),
        inspector: body.inspector || db.user?.name || 'QA Specialist',
        inspectionDate: new Date().toISOString(),
        status: body.status || 'Passed', // Passed, Quarantined, Pending Inspection
        complianceLevel: body.complianceLevel || 'Standard QA Checked',
        issueFound: body.issueFound || 'None',
        actionTaken: body.actionTaken || 'Approved for storage',
        safetyLockActive: body.status === 'Quarantined'
      };
      db.safetyInspections = [newInsp, ...(db.safetyInspections || [])];
      saveDbData(db);
      return { status: 201, data: newInsp };
    }
  }

  const inspMatch = cleanPath.match(/^\/safety\/inspections\/([a-zA-Z0-9_-]+)$/);
  if (inspMatch) {
    const inspId = inspMatch[1];
    const index = (db.safetyInspections || []).findIndex(i => i.id === inspId);
    if (index === -1) {
      return { status: 404, data: { error: 'Inspection record not found' } };
    }
    if (method === 'PUT') {
      db.safetyInspections[index] = { ...db.safetyInspections[index], ...body };
      saveDbData(db);
      return { status: 200, data: db.safetyInspections[index] };
    }
    if (method === 'DELETE') {
      db.safetyInspections = db.safetyInspections.filter(i => i.id !== inspId);
      saveDbData(db);
      return { status: 200, data: { message: 'Inspection deleted' } };
    }
  }

  // 12. Purchase Orders & Procurement
  if (cleanPath === '/purchase-orders') {
    if (method === 'GET') {
      return { status: 200, data: db.purchaseOrders || [] };
    }
    if (method === 'POST') {
      const newPO = {
        id: 'po-' + Date.now(),
        poNumber: 'PO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        issueDate: new Date().toISOString(),
        expectedDelivery: body.expectedDelivery || new Date(Date.now() + 7 * 86400000).toISOString(),
        status: body.status || 'Issued & In Transit',
        paymentTerms: body.paymentTerms || 'Net 30 Days',
        shippingMethod: body.shippingMethod || 'Standard Ground Freight',
        items: body.items || [],
        subtotal: Number(body.subtotal) || 0,
        tax: Number(body.tax) || 0,
        shippingFee: Number(body.shippingFee) || 0,
        totalAmount: Number(body.totalAmount) || 0,
        notes: body.notes || ''
      };
      db.purchaseOrders = [newPO, ...(db.purchaseOrders || [])];
      saveDbData(db);
      return { status: 201, data: newPO };
    }
  }

  const poReceiveMatch = cleanPath.match(/^\/purchase-orders\/([a-zA-Z0-9_-]+)\/receive$/);
  if (poReceiveMatch && method === 'POST') {
    const poId = poReceiveMatch[1];
    const po = (db.purchaseOrders || []).find(p => p.id === poId);
    if (!po) {
      return { status: 404, data: { error: 'Purchase Order not found' } };
    }
    
    // Mark as received and increment inventory stocks!
    po.status = 'Received & Stocked';
    po.receivedDate = new Date().toISOString();

    for (const item of (po.items || [])) {
      const prod = (db.products || []).find(p => p.id === item.productId || p.sku === item.sku);
      if (prod) {
        const prev = prod.stock;
        prod.stock = prev + item.orderedQty;
        item.receivedQty = item.orderedQty;

        // Record stock movement
        db.movements = [
          {
            id: 'mov-' + Date.now() + Math.random().toString(36).substr(2, 3),
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'IN',
            quantity: item.orderedQty,
            previousStock: prev,
            newStock: prod.stock,
            reference: po.poNumber,
            note: `Auto-stocked from Purchase Order ${po.poNumber} (${po.supplierName})`,
            timestamp: new Date().toISOString(),
            performedBy: db.user?.name || 'Procurement Mgr'
          },
          ...(db.movements || [])
        ];
      }
    }

    saveDbData(db);
    return { status: 200, data: { message: 'PO stock received and integrated into warehouse inventory', po } };
  }

  const poIdMatch = cleanPath.match(/^\/purchase-orders\/([a-zA-Z0-9_-]+)$/);
  if (poIdMatch && method === 'DELETE') {
    const poId = poIdMatch[1];
    db.purchaseOrders = (db.purchaseOrders || []).filter(p => p.id !== poId);
    saveDbData(db);
    return { status: 200, data: { message: 'Purchase order deleted' } };
  }

  return { status: 404, data: { error: `Endpoint ${method} ${cleanPath} not found` } };
}
