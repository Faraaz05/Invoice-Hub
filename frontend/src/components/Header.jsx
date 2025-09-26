import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { authUtils } from '../utils/auth';

function Header() {
  const navigate = useNavigate();
  const currentUser = authUtils.getCurrentUser();

  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear authentication data
      authUtils.clearAuth();
      
      // Redirect to login page
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">InvoiceHub</h1>
          <span className="header-subtitle">Invoice Management System</span>
        </div>
        <div className="header-actions">
          <div className="header-user-menu">
            <button className="header-user-btn" title={`Logged in as ${currentUser?.email || 'User'}`}>
              <User size={18} />
              <span className="header-user-name">
                {currentUser?.name || currentUser?.email || 'User'}
              </span>
            </button>
          </div>
          <button 
            className="header-action-btn header-logout-btn" 
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;