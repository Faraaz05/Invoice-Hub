import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Download,
  User
} from 'lucide-react';
import '../styles/payment-processing.css';

const PaymentProcessing = () => {
  const [approvedInvoices, setApprovedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('amount-desc');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchApprovedInvoices();
  }, []);

  const fetchApprovedInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoices?status=approved&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approved invoices');
      }

      const data = await response.json();
      setApprovedInvoices(data.data?.invoices || []);
      

      
      // Extract unique departments for filter
      const uniqueDepartments = [...new Set(data.data?.invoices?.map(inv => inv.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
      
    } catch (err) {
      setError('Failed to load approved invoices');
      console.error('Error fetching approved invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      setProcessingPayment(invoiceId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark invoice as paid');
      }

      // Remove the paid invoice from the list
      setApprovedInvoices(prev => prev.filter(inv => inv._id !== invoiceId));
      
      // Show success feedback (could add a toast notification here)
      
    } catch (err) {
      setError(`Failed to process payment: ${err.message}`);
      console.error('Error marking invoice as paid:', err);
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilteredAndSortedInvoices = () => {
    let filtered = approvedInvoices.filter(invoice => {
      const matchesSearch = searchTerm === '' || 
        invoice.billedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = filterDepartment === 'all' || 
        invoice.department === filterDepartment;
      
      return matchesSearch && matchesDepartment;
    });

    // Sort invoices
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount-desc':
          return (b.totals?.grandTotal || 0) - (a.totals?.grandTotal || 0);
        case 'amount-asc':
          return (a.totals?.grandTotal || 0) - (b.totals?.grandTotal || 0);
        case 'date-desc':
          return new Date(b.invoiceDate || b.createdAt) - new Date(a.invoiceDate || a.createdAt);
        case 'date-asc':
          return new Date(a.invoiceDate || a.createdAt) - new Date(b.invoiceDate || b.createdAt);
        case 'vendor-asc':
          return (a.billedBy?.name || '').localeCompare(b.billedBy?.name || '');
        case 'vendor-desc':
          return (b.billedBy?.name || '').localeCompare(a.billedBy?.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredInvoices = getFilteredAndSortedInvoices();
  const totalPendingAmount = filteredInvoices.reduce((sum, inv) => {
    const amount = inv.totals?.grandTotal || 0;
    return sum + amount;
  }, 0);

  if (loading) {
    return (
      <div className="payment-processing-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading approved invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-processing-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Payment Processing</h1>
            <p>Process approved invoices for payment and manage company payment workflows</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Clock />
              </div>
              <div className="stat-content">
                <div className="stat-value">{filteredInvoices.length}</div>
                <div className="stat-label">Ready for Payment</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign />
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(totalPendingAmount)}</div>
                <div className="stat-label">Total to Process</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-dismiss">×</button>
        </div>
      )}

      <div className="filters-section">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by vendor, invoice number, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Department:</label>
            <select 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="vendor-asc">Vendor (A-Z)</option>
              <option value="vendor-desc">Vendor (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="invoices-container">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} />
            <h3>No Invoices Ready for Payment</h3>
            <p>All approved invoices have been processed or no invoices match your current filters.</p>
          </div>
        ) : (
          <div className="invoices-table">
            <div className="table-header">
              <div className="header-cell">Invoice Details</div>
              <div className="header-cell">Vendor</div>
              <div className="header-cell">Department</div>
              <div className="header-cell">Amount</div>
              <div className="header-cell">Approved Date</div>
              <div className="header-cell">Actions</div>
            </div>
            
            {filteredInvoices.map(invoice => (
              <div key={invoice._id} className="table-row">
                <div className="cell invoice-details">
                  <div className="invoice-number">#{invoice.invoiceNumber || 'N/A'}</div>
                  <div className="invoice-description">
                    {invoice.items?.[0]?.description || 
                     (invoice.summary ? invoice.summary.substring(0, 50) + '...' : 'No description')}
                  </div>
                </div>
                
                <div className="cell vendor-info">
                  <div className="vendor-name">{invoice.billedBy?.name || 'Unknown Vendor'}</div>
                  {invoice.billedBy?.GSTIN && (
                    <div className="vendor-gstin">GST: {invoice.billedBy.GSTIN}</div>
                  )}
                </div>
                
                <div className="cell department-info">
                  <div className="department-badge">
                    <Building2 size={14} />
                    {invoice.department || 'N/A'}
                  </div>
                </div>
                
                <div className="cell amount-info">
                  <div className="amount">
                    {formatCurrency(invoice.totals?.grandTotal || 0)}
                  </div>
                  {((invoice.totals?.cgstTotal || 0) + (invoice.totals?.sgstTotal || 0) + (invoice.totals?.igstTotal || 0)) > 0 && (
                    <div className="gst-note">
                      Incl. GST: {formatCurrency(
                        (invoice.totals?.cgstTotal || 0) + 
                        (invoice.totals?.sgstTotal || 0) + 
                        (invoice.totals?.igstTotal || 0)
                      )}
                    </div>
                  )}
                </div>
                
                <div className="cell date-info">
                  <div className="date">{formatDate(invoice.invoiceDate || invoice.createdAt)}</div>
                  {invoice.approver && (
                    <div className="processed-by">
                      <User size={12} />
                      {invoice.approver.name}
                    </div>
                  )}
                </div>
                
                <div className="cell actions">
                  <button
                    onClick={() => handleMarkAsPaid(invoice._id)}
                    disabled={processingPayment === invoice._id}
                    className="mark-paid-btn"
                  >
                    {processingPayment === invoice._id ? (
                      <>
                        <div className="btn-spinner"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Mark as Paid
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessing;