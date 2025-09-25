import React from 'react';
import { authUtils } from '../utils/auth';
import DashboardStats from '../components/DashboardStats';
import InvoiceList from '../components/InvoiceList';
import InvoiceOverview from '../components/InvoiceOverview';
import '../styles/dashboard.css';
import '../styles/invoice-list.css';
import '../styles/invoice-overview.css';

const Dashboard = () => {
  const currentUser = authUtils.getCurrentUser();
  
  const getWelcomeMessage = () => {
    const roleMessages = {
      admin: 'Complete system oversight and user management',
      manager: 'Review and approve invoices for your department',
      controller: 'Mark approved invoices as paid',
      clerk: 'Upload and manage invoice processing'
    };
    
    return roleMessages[currentUser?.role] || 'Welcome to InvoiceHub';
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      manager: 'Manager',
      controller: 'Controller', 
      clerk: 'Clerk'
    };
    
    return roleNames[role] || role;
  };

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-main">
            <h1 className="page-title">Dashboard</h1>
            <div className="user-info">
              <p className="welcome-text">
                Welcome back, <strong>{currentUser?.name}</strong>
              </p>
              <span className="user-role-badge">
                {getRoleDisplayName(currentUser?.role)}
                {currentUser?.department && ` - ${currentUser.department}`}
              </span>
            </div>
          </div>
          <p className="page-subtitle">{getWelcomeMessage()}</p>
        </div>

        {/* Role-specific Dashboard Content */}
        {currentUser?.role === 'admin' ? (
          // Admin Dashboard - User Management Focus
          <section className="dashboard-section">
            <div className="admin-dashboard-overview">
              <h2>System Overview</h2>
              <p>Welcome to the InvoiceHub administration panel. Use the sidebar to manage user accounts and system settings.</p>
              
              <div className="admin-quick-actions">
                <div className="quick-action-card">
                  <h3>User Management</h3>
                  <p>Create and manage user accounts across all roles and departments.</p>
                  <a href="/users" className="action-link">Manage Users →</a>
                </div>
                
                <div className="quick-action-card">
                  <h3>System Reports</h3>
                  <p>View comprehensive reports and analytics across the system.</p>
                  <a href="/reports" className="action-link">View Reports →</a>
                </div>
                
                <div className="quick-action-card">
                  <h3>System Settings</h3>
                  <p>Configure system-wide settings and preferences.</p>
                  <a href="/settings" className="action-link">System Settings →</a>
                </div>
              </div>
            </div>
          </section>
        ) : (
          // Non-Admin Dashboard - Invoice Management Focus
          <>
            <section className="dashboard-section">
              <DashboardStats />
            </section>
            <section className="dashboard-section">
              {currentUser?.role === 'clerk' || currentUser?.role === 'controller' ? (
                <InvoiceOverview />
              ) : (
                <InvoiceList />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;