import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  DollarSign, 
  Calendar, 
  Building,
  User,
  AlertCircle,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { authUtils } from '../utils/auth';
import '../styles/pending-approvals.css';

const PendingApprovals = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const currentUser = authUtils.getCurrentUser();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/invoices?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          status: 'pending',
          department: currentUser?.department || '',
          page: 1,
          limit: 50
        }
      });

      if (response.data.success) {
        const invoicesData = response.data.data.invoices || [];
        console.log('Fetched invoices:', invoicesData);
        console.log('Sample invoice structure:', invoicesData[0]);
        setInvoices(invoicesData);
      } else {
        setError('Failed to fetch pending approvals');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (invoiceId, action, comment = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Convert frontend action to backend expected format
      const backendAction = action === 'approve' ? 'approved' : 'rejected';
      console.log('Approval request:', { invoiceId, originalAction: action, backendAction, comment });
      
      const response = await axios.post(
        `/api/invoices/${invoiceId}/approve-reject`,
        {
          action: backendAction,
          comment
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Remove from pending list
        setInvoices(invoices.filter(inv => inv._id !== invoiceId));
        setShowModal(false);
        setSelectedInvoice(null);
        
        // Show success message
        alert(`Invoice ${action}d successfully!`);
      } else {
        setError(response.data.message || `Failed to ${action} invoice`);
      }
    } catch (err) {
      console.error('Approval error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || `Failed to ${action} invoice`);
    } finally {
      setActionLoading(false);
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

  const handleDownloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/invoices/${invoiceId}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoice-${invoiceNumber}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download invoice. Please try again.');
    }
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
      default:
        return filtered;
    }
  };

  const filteredInvoices = getFilteredAndSortedInvoices();

  if (loading) {
    return (
      <div className="pending-approvals-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-approvals-page">
      <div className="page-header">
        <div className="header-main">
          <div>
            <h1 className="page-title">Pending Approvals</h1>
            <p className="page-subtitle">
              Review and approve invoices for {currentUser?.department} department
            </p>
          </div>
          <div className="approval-stats">
            <div className="stat-item">
              <Clock size={20} />
              <span>{filteredInvoices.length} Pending</span>
            </div>
          </div>
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
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="approvals-container">
        {filteredInvoices.length === 0 ? (
          <div className="no-approvals">
            <Clock size={48} />
            <h3>No Pending Approvals</h3>
            <p>All invoices for your department have been processed.</p>
          </div>
        ) : (
          <div className="approvals-grid">
            {filteredInvoices.map(invoice => (
              <div key={invoice._id} className="approval-card">
                <div className="card-header">
                  <div className="invoice-info">
                    <h3 className="vendor-name">{invoice.billedBy?.name || 'Unknown Vendor'}</h3>
                    <p className="invoice-number">#{invoice.invoiceNumber}</p>
                  </div>
                  <div className="amount-badge">
                    {formatCurrency(invoice.totals?.grandTotal || 0)}
                  </div>
                </div>

                <div className="card-content">
                  <div className="invoice-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>Due: {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}</span>
                    </div>
                    <div className="detail-item">
                      <Building size={16} />
                      <span>{invoice.department || currentUser?.department}</span>
                    </div>
                    <div className="detail-item">
                      <User size={16} />
                      <span>Submitted by: {invoice.uploadedBy?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="description">
                    <p>{invoice.summary || 'No summary available'}</p>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowModal(true);
                    }}
                    className="btn-secondary view-btn"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  
                  <div className="action-buttons">
                    <button
                      onClick={() => handleApproval(invoice._id, 'reject')}
                      className="btn-reject"
                      disabled={actionLoading}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(invoice._id, 'approve')}
                      className="btn-approve"
                      disabled={actionLoading}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                    <label>Department</label>
                    <p>{selectedInvoice.department || currentUser?.department}</p>
                  </div>
                  <div className="detail-group">
                    <label>Submitted By</label>
                    <p>{selectedInvoice.uploadedBy?.name || 'Unknown'}</p>
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

            <div className="modal-actions">
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice._id, selectedInvoice.invoiceNumber)}
                className="btn-download"
                type="button"
              >
                <Download size={16} />
                Download Invoice
              </button>
              
              <div className="approval-actions">
                <button
                  onClick={() => handleApproval(selectedInvoice._id, 'reject')}
                  className="btn-reject"
                  disabled={actionLoading}
                >
                  <XCircle size={16} />
                  Reject Invoice
                </button>
                <button
                  onClick={() => handleApproval(selectedInvoice._id, 'approve')}
                  className="btn-approve"
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} />
                  Approve Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;