import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Download,
  FileDown,
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
import '../styles/invoice-search.css';

const InvoiceSearch = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('vendor');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    vendor: '',
    department: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [sortBy, setSortBy] = useState('invoiceDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [hasSearched, setHasSearched] = useState(false);

  const currentUser = authUtils.getCurrentUser();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      // Add user filters
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (filters.department) params.append('department', filters.department);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      
      // Add search term based on search type
      if (searchTerm) {
        if (searchType === 'invoiceNumber') {
          params.append('invoiceNumber', searchTerm);
        } else if (searchType === 'vendor') {
          params.append('vendor', searchTerm);
        }
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/invoices?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setPagination(response.data.data.pagination);
        setHasSearched(true);
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
    const newFilters = { ...filters };
    
    if (searchType === 'vendor') {
      newFilters.vendor = searchTerm;
    }
    
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchInvoices();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const applyFilters = () => {
    fetchInvoices();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      vendor: '',
      department: '',
      minAmount: '',
      maxAmount: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    setHasSearched(false);
    setInvoices([]);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  useEffect(() => {
    if (hasSearched) {
      fetchInvoices();
    }
  }, [pagination.current, sortBy, sortOrder]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const downloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/invoices/${invoiceId}/file`, {
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

  return (
    <div className="invoice-search-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-main">
            <h1 className="page-title">Search Invoices</h1>
            <div className="user-info">
              <p className="welcome-text">
                Search and filter company invoices
              </p>
            </div>
          </div>
          <p className="page-subtitle">Use advanced filters to find specific invoices quickly</p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="invoice-controls">
          {/* Main Search Bar */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <div className="search-type-selector">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="search-type-select"
                >
                  <option value="vendor">Vendor</option>
                  <option value="invoiceNumber">Invoice #</option>
                </select>
              </div>
              <div className="search-input-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder={
                    searchType === 'vendor' 
                      ? "Search by vendor name..." 
                      : "Search by invoice number..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button type="submit" className="search-btn">
                Search
              </button>
            </div>
          </form>

          {/* Quick Filters Row */}
          <div className="quick-filters">
            <div className="filter-group">
              <Filter size={16} />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
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
                title="From Date"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="filter-date"
                placeholder="End Date"
                title="To Date"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`advanced-filter-toggle ${showAdvancedFilters ? 'active' : ''}`}
            >
              {showAdvancedFilters ? 'Less Filters' : 'More Filters'}
            </button>

            <button
              type="button"
              onClick={applyFilters}
              className="apply-filters-btn"
              disabled={!hasSearched && !searchTerm && !Object.values(filters).some(v => v)}
            >
              Apply Filters
            </button>

            {(searchTerm || Object.values(filters).some(v => v)) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="clear-filters-btn"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="advanced-filters-row">
                <div className="filter-group">
                  <Building size={16} />
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Departments</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div className="filter-group amount-range">
                  <DollarSign size={16} />
                  <input
                    type="number"
                    placeholder="Min Amount"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="filter-amount"
                    min="0"
                    step="0.01"
                  />
                  <span className="amount-separator">to</span>
                  <input
                    type="number"
                    placeholder="Max Amount"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="filter-amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchTerm || Object.values(filters).some(v => v)) && (
            <div className="active-filters">
              <span className="active-filters-label">Active filters:</span>
              <div className="filter-tags">
                {searchTerm && (
                  <span className="filter-tag">
                    {searchType === 'vendor' ? 'Vendor' : 'Invoice #'}: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.status && (
                  <span className="filter-tag">
                    Status: {filters.status}
                    <button onClick={() => handleFilterChange('status', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.startDate && (
                  <span className="filter-tag">
                    From: {formatDate(filters.startDate)}
                    <button onClick={() => handleFilterChange('startDate', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.endDate && (
                  <span className="filter-tag">
                    To: {formatDate(filters.endDate)}
                    <button onClick={() => handleFilterChange('endDate', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.department && (
                  <span className="filter-tag">
                    Department: {filters.department}
                    <button onClick={() => handleFilterChange('department', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.minAmount && (
                  <span className="filter-tag">
                    Min: ₹{filters.minAmount}
                    <button onClick={() => handleFilterChange('minAmount', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.maxAmount && (
                  <span className="filter-tag">
                    Max: ₹{filters.maxAmount}
                    <button onClick={() => handleFilterChange('maxAmount', '')} className="remove-filter">×</button>
                  </span>
                )}
              </div>
            </div>
          )}
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

        {/* Results Section */}
        {!hasSearched && !loading && (
          <div className="no-search-state">
            <Search size={48} />
            <h3>Search for Invoices</h3>
            <p>Use the search bar and filters above to find specific invoices.</p>
          </div>
        )}

        {hasSearched && !loading && invoices.length === 0 && (
          <div className="no-results-state">
            <FileText size={48} />
            <h3>No invoices found</h3>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        )}

        {/* Invoice Table */}
        {invoices.length > 0 && (
          <div className="invoice-table-container">
            <div className="table-header">
              <h3>Search Results ({pagination.total} invoices found)</h3>
            </div>
            
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
                  <th>Department</th>
                  <th onClick={() => handleSort('totals.grandTotal')} className="sortable">
                    Amount
                    {sortBy === 'totals.grandTotal' && (
                      <span className={`sort-indicator ${sortOrder}`}></span>
                    )}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="invoice-number">{invoice.invoiceNumber}</td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td className="vendor-name">{invoice.billedBy?.name || 'N/A'}</td>
                    <td>
                      <span className="department-badge">{invoice.department}</span>
                    </td>
                    <td className="amount">{formatCurrency(invoice.totals?.grandTotal || 0)}</td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => window.open(`/invoices/${invoice._id}`, '_blank')}
                          className="action-btn view-btn"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => downloadInvoice(invoice._id, invoice.invoiceNumber)}
                          className="action-btn download-btn"
                          title="Download Invoice"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.current - 2) + i;
                    if (pageNum <= pagination.pages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`pagination-btn ${pageNum === pagination.current ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Searching invoices...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceSearch;