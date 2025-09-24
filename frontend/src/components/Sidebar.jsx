import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Users, 
  BarChart3,
  Settings,
  HelpCircle,
  CheckCircle,
  Eye,
  CreditCard
} from 'lucide-react';
import { authUtils } from '../utils/auth';

function Sidebar() {
  const location = useLocation();
  const currentUser = authUtils.getCurrentUser();
  const userRole = currentUser?.role || 'clerk';

  // Define navigation items based on user roles
  const getNavItemsForRole = (role) => {
    const commonItems = [
      { 
        path: '/dashboard', 
        label: 'Dashboard', 
        icon: LayoutDashboard,
        description: 'Overview & Analytics',
        roles: ['admin', 'manager', 'controller', 'clerk']
      }
    ];

    const roleSpecificItems = [
      // Clerk specific items
      { 
        path: '/invoices/upload', 
        label: 'Upload Invoice', 
        icon: Upload,
        description: 'Add new invoices',
        roles: ['admin', 'clerk']
      },
      
      // Manager specific items
      { 
        path: '/invoices', 
        label: 'Review Invoices', 
        icon: Eye,
        description: 'Review & approve invoices',
        roles: ['manager']
      },
      { 
        path: '/approvals', 
        label: 'Pending Approvals', 
        icon: CheckCircle,
        description: 'Invoices awaiting approval',
        roles: ['manager']
      },
      
      // Controller specific items
      { 
        path: '/invoices', 
        label: 'Payment Processing', 
        icon: CreditCard,
        description: 'Mark invoices as paid',
        roles: ['controller']
      },
      { 
        path: '/payments', 
        label: 'Payment History', 
        icon: BarChart3,
        description: 'View payment records',
        roles: ['controller']
      },
      
      // Admin specific items
      { 
        path: '/users', 
        label: 'User Management', 
        icon: Users,
        description: 'Manage users & roles',
        roles: ['admin']
      },
      { 
        path: '/reports', 
        label: 'Reports & Analytics', 
        icon: BarChart3,
        description: 'System reports & analytics',
        roles: ['admin']
      }
    ];

    // Filter items based on user role
    const allItems = [...commonItems, ...roleSpecificItems];
    return allItems.filter(item => item.roles.includes(role));
  };

  const navItems = getNavItemsForRole(userRole);

  // Bottom navigation items - always visible but role-dependent
  const getBottomNavItems = (role) => {
    const items = [
      { 
        path: '/help', 
        label: 'Help & Support', 
        icon: HelpCircle,
        description: 'Get assistance',
        roles: ['admin', 'manager', 'controller', 'clerk']
      }
    ];

    // Only show settings for admin
    if (role === 'admin') {
      items.unshift({
        path: '/settings', 
        label: 'Settings', 
        icon: Settings,
        description: 'System configuration'
      });
    }

    return items;
  };

  const bottomNavItems = getBottomNavItems(userRole);

  const renderNavItem = (item) => {
    const IconComponent = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <li key={item.path} className="nav-item">
        <Link
          to={item.path}
          className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
          title={item.description}
        >
          <div className="nav-link-content">
            <IconComponent size={18} className="nav-link-icon" />
            <div className="nav-link-text">
              <span className="nav-link-label">{item.label}</span>
              <span className="nav-link-description">{item.description}</span>
            </div>
          </div>
        </Link>
      </li>
    );
  };

  // Get role-specific section title
  const getSectionTitle = (role) => {
    const titles = {
      admin: 'Administration',
      manager: 'Management',
      controller: 'Payment Control',
      clerk: 'Invoice Processing'
    };
    return titles[role] || 'Navigation';
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">{getSectionTitle(userRole)}</h3>
          <ul className="nav-list">
            {navItems.map(renderNavItem)}
          </ul>
        </div>
        
        <div className="nav-section nav-section-bottom">
          <ul className="nav-list">
            {bottomNavItems.map(renderNavItem)}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;