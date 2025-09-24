import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Eye,
  Edit3,
  Trash2,
  Shield,
  Building,
  Mail,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { authUtils } from '../utils/auth';
import '../styles/admin-dashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Form state for creating new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'clerk',
    department: '',
    password: ''
  });
  const [creating, setCreating] = useState(false);

  const departments = [
    'Sales',
    'Finance', 
    'HR',
    'Marketing',
    'Operations',
    'IT'
  ];

  const roles = [
    { value: 'clerk', label: 'Clerk', description: 'Can upload and manage invoices' },
    { value: 'manager', label: 'Manager', description: 'Can approve invoices for their department' },
    { value: 'controller', label: 'Finance Controller', description: 'Can mark invoices as paid and view analytics' },
    { value: 'admin', label: 'Admin', description: 'Can manage user accounts' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/auth/register', newUser, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers([...users, response.data.data]);
        setNewUser({
          name: '',
          email: '',
          role: 'clerk',
          department: '',
          password: ''
        });
        setShowCreateForm(false);
        alert('User created successfully!');
      } else {
        setError(response.data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesDepartment = !filterDepartment || user.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={16} className="role-icon admin" />;
      case 'controller': return <CheckCircle size={16} className="role-icon controller" />;
      case 'manager': return <User size={16} className="role-icon manager" />;
      case 'clerk': return <User size={16} className="role-icon clerk" />;
      default: return <User size={16} className="role-icon" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    return `role-badge role-badge-${role}`;
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div className="header-main">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage user accounts and permissions</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn-primary create-user-btn"
          >
            <UserPlus size={18} />
            Create User
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-meta">ID: {user._id.slice(-6)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="role-cell">
                    {getRoleIcon(user.role)}
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="department-cell">
                    <Building size={14} />
                    <span>
                      {user.role === 'manager' 
                        ? (user.department || 'Not assigned') 
                        : 'Not applicable'
                      }
                    </span>
                  </div>
                </td>
                <td>
                  <div className="email-cell">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                </td>
                <td>
                  <span className="status-badge status-active">
                    <CheckCircle size={12} />
                    Active
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn view-btn"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="action-btn edit-btn"
                      title="Edit User"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <Users size={48} />
            <h3>No users found</h3>
            <p>Try adjusting your search filters or create a new user.</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New User</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="create-user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value, department: ''})}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <small className="role-description">
                    {roles.find(r => r.value === newUser.role)?.description}
                  </small>
                </div>
                
                {newUser.role === 'manager' && (
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <small>Managers oversee invoices for their assigned department</small>
                  </div>
                )}
                
                <div className="form-group full-width">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    placeholder="Enter password"
                    minLength={6}
                  />
                  <small>Password must be at least 6 characters long</small>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;