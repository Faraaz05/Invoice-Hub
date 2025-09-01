import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import Approvals from "./pages/Approvals";
import Payments from "./pages/Payments";
import Vendors from "./pages/Vendors";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, checkAuth } = useAuthStore();
  
  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  console.log('AppRoutes rendering, user:', user);

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'clerk': return '/invoices/new';
      case 'manager': return '/approvals';
      case 'controller': return '/dashboard';
      case 'admin': return '/admin';
      default: return '/dashboard';
    }
  };

  console.log('Default route:', getDefaultRoute());

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />
      
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      <Route element={<Layout />}>
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute roles={['controller', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/invoices" 
          element={
            <ProtectedRoute roles={['clerk', 'controller']}>
              <Invoices />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/invoices/new" 
          element={
            <ProtectedRoute roles={['clerk']}>
              <NewInvoice />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/approvals" 
          element={
            <ProtectedRoute roles={['manager', 'controller']}>
              <Approvals />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute roles={['controller']}>
              <Payments />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vendors" 
          element={
            <ProtectedRoute roles={['controller']}>
              <Vendors />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute roles={['controller']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute roles={['controller']}>
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  console.log('App component rendering...');
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return (
      <div style={{ padding: '20px', fontSize: '16px', color: 'red' }}>
        <h1>Error loading app</h1>
        <p>Check console for details</p>
        <pre>{error?.toString()}</pre>
      </div>
    );
  }
};

export default App;
