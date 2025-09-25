import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminOnlyRoute from './components/AdminOnlyRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceUpload from './pages/InvoiceUpload';
import InvoiceDetails from './pages/InvoiceDetails';
import InvoiceSearch from './pages/InvoiceSearch';
import AdminDashboard from './pages/AdminDashboard';
import PendingApprovals from './pages/PendingApprovals';
import DepartmentInvoices from './pages/DepartmentInvoices';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import { authUtils } from './utils/auth';
import './App.css';
import './styles/globals.css';
import './styles/layout.css';

function App() {
  // Initialize auth on app load
  React.useEffect(() => {
    authUtils.initializeAuth();
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Authentication - no layout, public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Main App Routes - with layout and protection */}
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  {/* Redirect root to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Protected Main App Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/invoices/upload" element={<InvoiceUpload />} />
                  <Route path="/invoices/:id" element={<InvoiceDetails />} />
                  <Route path="/invoices" element={<Dashboard />} /> {/* Reuse dashboard for invoice list */}
                  <Route path="/invoices/search" element={<InvoiceSearch />} /> {/* Clerk invoice search */}
                  <Route path="/approvals" element={<PendingApprovals />} /> {/* Manager approval view */}
                  <Route path="/department-invoices" element={<DepartmentInvoices />} /> {/* Manager department invoices */}
                  <Route path="/department-analytics" element={<DepartmentAnalytics />} /> {/* Manager department analytics */}
                  <Route path="/payments" element={<Dashboard />} /> {/* Controller payment view */}
                  <Route path="/users" element={
                    <AdminOnlyRoute>
                      <AdminDashboard />
                    </AdminOnlyRoute>
                  } />
                  <Route path="/reports" element={<Dashboard />} /> {/* Admin reports placeholder */}
                  
                  {/* Catch all route - redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
