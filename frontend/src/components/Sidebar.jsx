import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Users, 
  BarChart3,
  CheckCircle,
  Eye,
  CreditCard,
  Search,
  TrendingUp
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
        roles: ['controller', 'clerk']
      }
    ];

    const roleSpecificItems = [
      // Clerk specific items
      { 
        path: '/invoices/upload', 
        label: 'Upload Invoice', 
        icon: Upload,
        description: 'Add new invoices',
        roles: ['clerk']
      },
      { 
        path: '/invoices/search', 
        label: 'Search Invoices', 
        icon: Search,
        description: 'Search & filter invoices',
        roles: ['clerk']
      },
      
      // Manager specific items
      { 
        path: '/approvals', 
        label: 'Pending Approvals', 
        icon: CheckCircle,
        description: 'Invoices awaiting approval',
        roles: ['manager']
      },
      { 
        path: '/department-invoices', 
        label: 'Department Invoices', 
        icon: Eye,
        description: 'View all department invoices',
        roles: ['manager']
      },
      { 
        path: '/department-analytics', 
        label: 'Department Analytics', 
        icon: BarChart3,
        description: 'Department performance metrics',
        roles: ['manager']
      },
      
      // Controller specific items
      { 
        path: '/invoices/search', 
        label: 'Search Invoices', 
        icon: Search,
        description: 'Search company invoices',
        roles: ['controller']
      },
      { 
        path: '/payment-processing', 
        label: 'Payment Processing', 
        icon: CreditCard,
        description: 'Process company payments',
        roles: ['controller']
      },
      { 
        path: '/financial-analytics', 
        label: 'Financial Analytics', 
        icon: TrendingUp,
        description: 'Company financial analytics',
        roles: ['controller']
      },
      
      // Admin specific items
      { 
        path: '/users', 
        label: 'User Management', 
        icon: Users,
        description: 'Manage users & roles',
        roles: ['admin']
      }
    ];

    // Filter items based on user role
    const allItems = [...commonItems, ...roleSpecificItems];
    return allItems.filter(item => item.roles.includes(role));
  };

  const navItems = getNavItemsForRole(userRole);

  // No bottom navigation items needed

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
        

      </nav>
    </aside>
  );
}

export default Sidebar;