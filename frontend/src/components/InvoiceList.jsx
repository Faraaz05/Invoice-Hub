import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Badge,
  FileText
} from 'lucide-react';
import { authUtils } from '../utils/auth';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    vendor: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [sortBy, setSortBy] = useState('invoiceDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const currentUser = authUtils.getCurrentUser();

  useEffect(() => {
    fetchInvoices();
  }, [filters, pagination.current, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');

      const currentUser = authUtils.getCurrentUser();
      const userRole = currentUser?.role || 'clerk';

      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      // Add role-based filtering
      if (userRole === 'manager') {
        // Managers see invoices from their department that need approval
        params.append('department', currentUser.department);
        params.append('needsApproval', 'true');
      } else if (userRole === 'controller') {
        // Controllers see approved invoices ready for payment
        params.append('status', 'approved');
      }
      // Clerks and Admin see all invoices (no additional filters)

      // Add user filters
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.vendor) params.append('vendor', filters.vendor);

      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/invoices?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setPagination(response.data.data.pagination);
      } else {
        setError('Failed to load invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, vendor: searchTerm }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const downloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/invoices/${invoiceId}/file`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'orange', icon: Clock, text: 'Pending' },
      approved: { color: 'green', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: XCircle, text: 'Rejected' },
      paid: { color: 'blue', icon: Badge, text: 'Paid' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`status-badge status-${config.color}`}>
        <IconComponent size={14} />
        {config.text}
      </span>
    );
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="invoice-list-loading">
        <div className="loading-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="invoice-row-skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-list">
      <div className="invoice-list-header">
        {(() => {
          const currentUser = authUtils.getCurrentUser();
          const userRole = currentUser?.role || 'clerk';
          
          const titleConfig = {
            clerk: {
              title: 'All Invoices',
              subtitle: 'View and manage all invoices in the system'
            },
            manager: {
              title: 'Review & Approve',
              subtitle: 'Review and approve invoices from your department'
            },
            controller: {
              title: 'Payment Processing',
              subtitle: 'Process payments for approved invoices'
            },
            admin: {
              title: 'Invoice Management',
              subtitle: 'Search, filter and manage all invoices'
            }
          };
          
          const config = titleConfig[userRole] || titleConfig.admin;
          
          return (
            <>
              <h2 className="section-title">{config.title}</h2>
              <p className="section-subtitle">{config.subtitle}</p>
            </>
          );
        })()}
      </div>

      {/* Search and Filters */}
      <div className="invoice-controls">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by vendor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
          </div>
        </form>

        <div className="filters">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              {(() => {
                const currentUser = authUtils.getCurrentUser();
                const userRole = currentUser?.role || 'clerk';
                
                // Role-based status options
                if (userRole === 'clerk') {
                  return (
                    <>
                      <option value="">All Invoices</option>
                      <option value="pending">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="paid">Paid</option>
                    </>
                  );
                } else if (userRole === 'manager') {
                  return (
                    <>
                      <option value="">All Pending Approval</option>
                      <option value="pending">Needs My Approval</option>
                      <option value="approved">Approved by Me</option>
                      <option value="rejected">Rejected by Me</option>
                    </>
                  );
                } else if (userRole === 'controller') {
                  return (
                    <>
                      <option value="">All Approved</option>
                      <option value="approved">Ready for Payment</option>
                      <option value="paid">Already Paid</option>
                    </>
                  );
                } else {
                  // Admin sees all options
                  return (
                    <>
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="paid">Paid</option>
                    </>
                  );
                }
              })()}
            </select>
          </div>

          <div className="filter-group">
            <Calendar size={16} />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-date"
              placeholder="Start Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-date"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchInvoices} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Invoice Table */}
      <div className="invoice-table-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('invoiceNumber')} className="sortable">
                Invoice #
                {sortBy === 'invoiceNumber' && (
                  <span className={`sort-indicator ${sortOrder}`}></span>
                )}
              </th>
              <th onClick={() => handleSort('invoiceDate')} className="sortable">
                Date
                {sortBy === 'invoiceDate' && (
                  <span className={`sort-indicator ${sortOrder}`}></span>
                )}
              </th>
              <th>Vendor</th>
              <th onClick={() => handleSort('totals.grandTotal')} className="sortable">
                Amount
                {sortBy === 'totals.grandTotal' && (
                  <span className={`sort-indicator ${sortOrder}`}></span>
                )}
              </th>
              <th>Status</th>
              <th>Uploaded By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="invoice-row">
                <td className="invoice-number">
                  <strong>{invoice.invoiceNumber}</strong>
                </td>
                <td className="invoice-date">
                  {formatDate(invoice.invoiceDate)}
                </td>
                <td className="vendor-info">
                  <div className="vendor-name">
                    <Building size={14} />
                    {invoice.billedBy?.name || 'N/A'}
                  </div>
                </td>
                <td className="invoice-amount">
                  <div className="amount-display">
                    <DollarSign size={14} />
                    {formatCurrency(invoice.totals?.grandTotal || 0)}
                  </div>
                </td>
                <td className="invoice-status">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="uploaded-by">
                  {invoice.uploadedBy?.name || 'Unknown'}
                </td>
                <td className="invoice-actions">
                  <button
                    onClick={() => window.open(`/invoices/${invoice._id}`, '_blank')}
                    className="action-btn view-btn"
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => downloadInvoice(invoice._id, invoice.invoiceNumber)}
                    className="action-btn download-btn"
                    title="Download Invoice"
                  >
                    <Download size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && !loading && (
          <div className="no-invoices">
            <FileText size={48} />
            <h3>No Invoices Found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
            {pagination.total} invoices
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            {[...Array(pagination.pages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === pagination.pages ||
                (page >= pagination.current - 1 && page <= pagination.current + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-btn ${page === pagination.current ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                );
              } else if (page === pagination.current - 2 || page === pagination.current + 2) {
                return <span key={page} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;