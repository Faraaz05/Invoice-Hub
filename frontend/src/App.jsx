import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceUpload from './pages/InvoiceUpload';
import InvoiceDetails from './pages/InvoiceDetails';
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
                  <Route path="/approvals" element={<Dashboard />} /> {/* Manager approval view */}
                  <Route path="/payments" element={<Dashboard />} /> {/* Controller payment view */}
                  <Route path="/users" element={<Dashboard />} /> {/* Admin user management placeholder */}
                  <Route path="/reports" element={<Dashboard />} /> {/* Admin reports placeholder */}
                  <Route path="/settings" element={<Dashboard />} /> {/* Admin settings placeholder */}
                  <Route path="/help" element={<Dashboard />} /> {/* Help page placeholder */}
                  
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
