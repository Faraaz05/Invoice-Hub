import React from 'react';
import { authUtils } from '../utils/auth';
import DashboardStats from '../components/DashboardStats';
import InvoiceList from '../components/InvoiceList';
import '../styles/dashboard.css';
import '../styles/invoice-list.css';

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

        {/* Dashboard Statistics */}
        <section className="dashboard-section">
          <DashboardStats />
        </section>

        {/* Invoice Management Section */}
        <section className="dashboard-section">
          <InvoiceList />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;