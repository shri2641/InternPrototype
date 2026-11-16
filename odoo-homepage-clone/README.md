# Apex Inventory — Enterprise SaaS Inventory Management System

A modern, full-featured, industry-grade Inventory Management System built with React 19, Vite 8, and an integrated Node.js REST API backend with real persistent storage.

---

## ✨ Key Capabilities & Features

### 1. 🌓 Theme System (Dark Mode Default)
- **Dark Mode (Default)**: Deep navy/charcoal styling with high-contrast cards, muted borders, and vibrant status accents.
- **Light Mode**: Clean slate and white design with proper contrast and readability.
- **Instant Toggle**: Accessible directly from the top navigation bar with Sun and Moon icons.
- **Persistence**: Remembers user choice in `localStorage` across page reloads.

### 2. 📊 Executive Dashboard
- **Real-Time KPI Metric Cards**:
  - Total Products SKU count
  - Total Stock Units in warehouses
  - Low Stock Alerts (at or below safety threshold)
  - Critical Out-of-Stock Products
  - Total Inventory Valuation (currency formatted)
  - Active Categories count
- **Interactive Visual Analytics**:
  - Monthly Inbound vs Outbound flow trend chart (interactive SVG with hover tooltip)
  - Stock Health distribution donut chart (Optimal, Low Stock, Out of Stock)
  - Category-wise inventory distribution and valuation progress bars
- **Quick Action Triggers**:
  - Instant Add Product
  - Fast Stock IN (Inbound Supplier Receipt)
  - Fast Stock OUT (Customer Dispatch)
  - Recent Stock Movements audit table

### 3. 🏷️ Products Catalog Management
- **Full CRUD**: Create, read, edit, and delete products with confirmation dialogs.
- **SKU Code Generator**: Auto-generates unique industry SKUs (e.g., `FUR-7721`, `ELEC-4091`) or permits manual entry.
- **Search & Filters**: Real-time debounced search by name, SKU, or category; filter by Category and Stock Status (Optimal, Low Stock, Out of Stock).
- **Sorting & Pagination**: Multi-column sorting with configurable page sizes (10, 25, 50).
- **Quick Stock Adjust**: Inline +/- stock adjustment modal directly from table rows.
- **CSV Export**: One-click download of the entire products catalog.

### 4. 🗂️ Category Management
- Categorize inventory into departments (Electronics, Furniture, Networking, Warehouse & Storage, Packaging, Office Supplies).
- Color-coded category tags with custom icon badges.
- Cards grid displaying product counts, stock units, and total capital valuation per category.
- "Quick View Items" modal and direct link to filter products table.

### 5. 📦 Stock Control & Warehouse Reordering
- Live stock meter bars showing current levels against safety thresholds.
- Status filters: Total Monitored, Optimal, Low Stock Reorders, Critical Out of Stock.
- Dedicated modals for:
  - **Stock IN**: Record incoming replenishment batches with PO references.
  - **Stock OUT**: Record customer order shipments with SO references.
  - **Physical Audit**: Reconcile actual shelf counts against system records.

### 6. 🚚 Supplier Directory
- Manage vendor organizations with contact persons, emails, phone numbers, and warehouse addresses.
- Monitor order fulfillment lead times.
- View all catalog products linked to each supplier.

### 7. 📈 Audit Trail & Executive Reports
- **Stock Movement Log**: Chronological audit trail showing Inbound Receipts, Outbound Dispatches, and Inventory Adjustments with timestamps and auditor notes.
- **Inventory Valuation Report**: Breakdown of retail selling value vs cost basis, plus gross profit potential.
- **Reorder Forecast**: Automated purchase order recommendations for low-stock items.
- **Exporting**: Download any report as CSV, or use the **Print / PDF** feature for executive reviews.

### 8. ⚙️ Settings & Account Profile
- Company branding, currency symbol selection ($, ₹, €, £, ¥), and default low-stock safety thresholds.
- Valuation methods (FIFO, LIFO, Weighted Average).
- Full database backup download (JSON snapshot) and factory reset capability.
- User profile management with role permissions and security settings.

---

## 🚀 Getting Started

### Run the Application (Frontend + Backend APIs)
```bash
cd odoo-homepage-clone
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note**: Vite automatically serves both the modern React frontend and the backend REST API endpoints (`/api/*`) on port 5173 through Vite's built-in API plugin.

### Standalone Backend Server (Optional)
```bash
npm run server
```
Runs the standalone REST API server on `http://localhost:5001`.

### Build for Production
```bash
npm run build
```
Creates an optimized production bundle in the `dist` directory.
