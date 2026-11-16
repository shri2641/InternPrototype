# JSW-Main: Enterprise Inventory Management System (Apex Inventory)

A full-stack, SaaS-level **Inventory Management System** featuring a responsive dashboard, dark/light theme switching, live REST APIs with persistent storage, products catalog, stock movements audit trail, supplier directory, and business analytics.

## 📁 Project Directory
- `odoo-homepage-clone/`: Core application containing both the frontend dashboard and integrated backend API service.

## 🚀 Quick Start
```bash
cd odoo-homepage-clone
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

## 🌟 Modules Implemented
1. **Executive Dashboard**: Real-time KPI summary cards, interactive monthly trend charts, stock health donut chart, category valuation bars, and quick stock actions.
2. **Products Catalog**: Full CRUD, SKU generator, category and stock status filtering, real-time search, sorting, pagination, and CSV export.
3. **Category Management**: Department groupings, custom color swatches, stock meters, and category product inspection.
4. **Stock Control (Inventory)**: Real-time stock tracking with progress bars, Stock IN (inbound receipts), Stock OUT (dispatches), and cycle audit adjustments.
5. **Stock Movements (Audit Trail)**: Chronological immutable log of all inventory transactions with timestamps, references, and auditor notes.
6. **Supplier Directory**: Vendor management with lead times, contact details, and linked product catalogs.
7. **Executive Reports & Analytics**: Inventory valuation report, stock velocity, reorder forecast, print/PDF export, and CSV downloads.
8. **Settings & Themes**: Dark Mode (default) / Light Mode toggle with persistence, currency selector, low-stock threshold rules, and full JSON database backup.
9. **User Profile**: Account identity, permissions badge, department info, and security credentials.
10. **Marketing Site (`/home`)**: Preserved marketing landing page with theme support and direct links to the Inventory SaaS dashboard.
