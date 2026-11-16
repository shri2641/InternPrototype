import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Movements from './pages/Movements';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Warehouses from './pages/Warehouses';
import Safety from './pages/Safety';
import PurchaseOrders from './pages/PurchaseOrders';
import Home from './pages/Home';
import GenericPage from './pages/GenericPage';

import './index.css';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* SaaS Inventory Management Layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/movements" element={<Movements />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/app/inventory" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Marketing Landing Site */}
            <Route
              path="/home"
              element={
                <div className="marketing-site-wrapper">
                  <Navbar />
                  <main className="marketing-main">
                    <Home />
                  </main>
                  <Footer />
                </div>
              }
            />

            {/* Catch-all for other marketing pages */}
            <Route
              path="*"
              element={
                <div className="marketing-site-wrapper">
                  <Navbar />
                  <main className="marketing-main">
                    <GenericPage />
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
