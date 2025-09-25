import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Eye, 
  Filter, 
  Search, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Building,
  User,
  FileText
} from 'lucide-react';
import { authUtils } from '../utils/auth';
import '../styles/department-invoices.css';

const DepartmentInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const currentUser = authUtils.getCurrentUser();

  useEffect(() => {
    fetchDepartmentInvoices();
  }, [statusFilter]);

  const fetchDepartmentInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          department: currentUser?.department || '',
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: 1,
          limit: 100
        }
      });

      if (response.data.success) {
        setInvoices(response.data.data.invoices || []);
      } else {
        setError('Failed to fetch department invoices');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch department invoices');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'approved':
        return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon rejected" />;
      case 'paid':
        return <CheckCircle size={16} className="status-icon paid" />;
      default:
        return <AlertTriangle size={16} className="status-icon default" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status}`;
  };

  const getFilteredAndSortedInvoices = () => {
    let filtered = invoices.filter(invoice =>
      invoice.billedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'newest':
        return filtered.sort((a, b) => new Date(b.createdAt || b.invoiceDate) - new Date(a.createdAt || a.invoiceDate));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt || a.invoiceDate) - new Date(b.createdAt || b.invoiceDate));
      case 'amount-high':
        return filtered.sort((a, b) => (b.totals?.grandTotal || 0) - (a.totals?.grandTotal || 0));
      case 'amount-low':
        return filtered.sort((a, b) => (a.totals?.grandTotal || 0) - (b.totals?.grandTotal || 0));
      case 'vendor':
        return filtered.sort((a, b) => (a.billedBy?.name || '').localeCompare(b.billedBy?.name || ''));
      case 'status':
        return filtered.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return filtered;
    }
  };

  const getStatusCounts = () => {
    return {
      all: invoices.length,
      pending: invoices.filter(inv => inv.status === 'pending').length,
      approved: invoices.filter(inv => inv.status === 'approved').length,
      rejected: invoices.filter(inv => inv.status === 'rejected').length,
      paid: invoices.filter(inv => inv.status === 'paid').length
    };
  };

  const filteredInvoices = getFilteredAndSortedInvoices();
  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="department-invoices-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading department invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="department-invoices-page">
      <div className="page-header">
        <div className="header-main">
          <div>
            <h1 className="page-title">Department Invoices</h1>
            <p className="page-subtitle">
              All invoices for {currentUser?.department} department
            </p>
          </div>
          <div className="invoice-summary">
            <div className="summary-item">
              <FileText size={20} />
              <span>{filteredInvoices.length} Total</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Status Tabs */}
      <div className="status-tabs">
        {[
          { key: 'all', label: 'All', count: statusCounts.all },
          { key: 'pending', label: 'Pending', count: statusCounts.pending },
          { key: 'approved', label: 'Approved', count: statusCounts.approved },
          { key: 'paid', label: 'Paid', count: statusCounts.paid },
          { key: 'rejected', label: 'Rejected', count: statusCounts.rejected }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`status-tab ${statusFilter === tab.key ? 'active' : ''}`}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by vendor, invoice number, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Highest Amount</option>
            <option value="amount-low">Lowest Amount</option>
            <option value="vendor">Vendor A-Z</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="invoices-container">
        {filteredInvoices.length === 0 ? (
          <div className="no-invoices">
            <FileText size={48} />
            <h3>No Invoices Found</h3>
            <p>No invoices match your current filters.</p>
          </div>
        ) : (
          <div className="invoices-table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice Details</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Submitted By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td>
                      <div className="invoice-details">
                        <div className="vendor-name">{invoice.billedBy?.name || 'Unknown Vendor'}</div>
                        <div className="invoice-meta">
                          <span className="invoice-number">#{invoice.invoiceNumber}</span>
                          <span className="created-date">
                            Created {formatDate(invoice.createdAt || invoice.invoiceDate)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="amount-cell">
                        <DollarSign size={16} />
                        <span className="amount">{formatCurrency(invoice.totals?.grandTotal || 0)}</span>
                      </div>
                    </td>
                    <td>
                      <div className={getStatusBadgeClass(invoice.status)}>
                        {getStatusIcon(invoice.status)}
                        <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={16} />
                        <span>{invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <User size={16} />
                        <span>{invoice.uploadedBy?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowModal(true);
                        }}
                        className="view-details-btn"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {showModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Invoice Details</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="invoice-full-details">
                <div className="details-grid">
                  <div className="detail-group">
                    <label>Vendor</label>
                    <p>{selectedInvoice.billedBy?.name || 'Unknown Vendor'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Invoice Number</label>
                    <p>{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="detail-group">
                    <label>Invoice Date</label>
                    <p>{formatDate(selectedInvoice.invoiceDate)}</p>
                  </div>
                  <div className="detail-group">
                    <label>Due Date</label>
                    <p>{selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : 'No due date'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Status</label>
                    <div className={getStatusBadgeClass(selectedInvoice.status)}>
                      {getStatusIcon(selectedInvoice.status)}
                      <span>{selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}</span>
                    </div>
                  </div>
                  <div className="detail-group">
                    <label>Department</label>
                    <p>{selectedInvoice.department || currentUser?.department}</p>
                  </div>
                  <div className="detail-group">
                    <label>Submitted By</label>
                    <p>{selectedInvoice.uploadedBy?.name || 'Unknown'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Created Date</label>
                    <p>{formatDate(selectedInvoice.createdAt || selectedInvoice.invoiceDate)}</p>
                  </div>
                  
                  {/* Financial Details */}
                  <div className="detail-group">
                    <label>Subtotal</label>
                    <p>{formatCurrency(selectedInvoice.totals?.subtotal || 0)}</p>
                  </div>
                  <div className="detail-group">
                    <label>Discount</label>
                    <p>{formatCurrency(selectedInvoice.totals?.discount || 0)}</p>
                  </div>
                  <div className="detail-group">
                    <label>CGST</label>
                    <p>{formatCurrency(selectedInvoice.totals?.cgstTotal || 0)}</p>
                  </div>
                  <div className="detail-group">
                    <label>SGST</label>
                    <p>{formatCurrency(selectedInvoice.totals?.sgstTotal || 0)}</p>
                  </div>
                  <div className="detail-group">
                    <label>IGST</label>
                    <p>{formatCurrency(selectedInvoice.totals?.igstTotal || 0)}</p>
                  </div>
                  <div className="detail-group">
                    <label>Grand Total</label>
                    <p className="amount">{formatCurrency(selectedInvoice.totals?.grandTotal || 0)}</p>
                  </div>
                  
                  {/* Vendor Details */}
                  <div className="detail-group full-width">
                    <label>Vendor Address</label>
                    <p>{selectedInvoice.billedBy?.address || 'No address available'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Vendor GSTIN</label>
                    <p>{selectedInvoice.billedBy?.GSTIN || 'Not provided'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Vendor PAN</label>
                    <p>{selectedInvoice.billedBy?.PAN || 'Not provided'}</p>
                  </div>
                  
                  <div className="detail-group full-width">
                    <label>Summary</label>
                    <p>{selectedInvoice.summary || 'No summary available'}</p>
                  </div>
                  
                  {selectedInvoice.additionalNotes && (
                    <div className="detail-group full-width">
                      <label>Additional Notes</label>
                      <p>{selectedInvoice.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentInvoices;