import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download,
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  Badge,
  FileText,
  Search
} from 'lucide-react';
import { authUtils } from '../utils/auth';

const InvoiceOverview = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 5 // Show fewer invoices on dashboard
  });

  const currentUser = authUtils.getCurrentUser();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'invoiceDate',
        sortOrder: 'desc'
      });

      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/invoices?${params.toString()}`, {
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

  useEffect(() => {
    fetchInvoices();
  }, [pagination.current]);

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

  if (loading) {
    return (
      <div className="invoice-overview">
        <div className="section-header">
          <h2 className="section-title">Recent Invoices</h2>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-overview">
        <div className="section-header">
          <h2 className="section-title">Recent Invoices</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchInvoices} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-overview">
      <div className="section-header">
        <h2 className="section-title">Recent Invoices</h2>
        {currentUser?.role === 'clerk' && (
          <a href="/invoices/search" className="search-link">
            <Search size={16} />
            Advanced Search
          </a>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="no-invoices-state">
          <FileText size={48} />
          <h3>No invoices found</h3>
          <p>No invoices have been uploaded yet.</p>
        </div>
      ) : (
        <div className="invoice-table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Department</th>
                <th>Amount</th>
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

          {/* Show pagination only if there are more pages */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.current} of {pagination.pages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}

          {currentUser?.role === 'clerk' && (
            <div className="view-all-link">
              <a href="/invoices/search" className="view-all-btn">
                View All Invoices & Search →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceOverview;