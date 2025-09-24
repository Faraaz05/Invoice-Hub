import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Download, 
  Building, 
  Calendar, 
  DollarSign,
  FileText,
  User,
  MapPin,
  Hash,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Badge
} from 'lucide-react';
import { authUtils } from '../utils/auth';
import '../styles/invoice-details.css';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = authUtils.getCurrentUser();

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setInvoice(response.data.data);
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError(err.response?.data?.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/invoices/${id}/file`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'orange', icon: Clock, text: 'Pending Approval' },
      approved: { color: 'green', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: XCircle, text: 'Rejected' },
      paid: { color: 'blue', icon: Badge, text: 'Paid' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <div className={`status-badge-large status-${config.color}`}>
        <IconComponent size={18} />
        <span>{config.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="invoice-details-loading">
          <div className="loading-header"></div>
          <div className="loading-content">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-section"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <FileText size={64} />
          <h2>Invoice Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-details-page">
      <div className="page-container">
        {/* Header */}
        <div className="invoice-details-header">
          <div className="header-actions">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <button onClick={downloadInvoice} className="download-btn">
              <Download size={16} />
              Download Invoice
            </button>
          </div>
          
          <div className="invoice-title-section">
            <div className="title-main">
              <h1 className="invoice-title">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="invoice-date">
              <Calendar size={16} />
              Invoice Date: {formatDate(invoice.invoiceDate)}
            </p>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="invoice-content">
          {/* Billing Information */}
          <div className="billing-section">
            <div className="billing-card">
              <h3 className="section-title">
                <Building size={18} />
                Billed From
              </h3>
              <div className="billing-info">
                <h4 className="company-name">{invoice.billedBy?.name}</h4>
                <div className="address-info">
                  <MapPin size={14} />
                  <span>{invoice.billedBy?.address}</span>
                </div>
                {invoice.billedBy?.GSTIN && (
                  <div className="tax-info">
                    <Hash size={14} />
                    <span>GSTIN: {invoice.billedBy.GSTIN}</span>
                  </div>
                )}
                {invoice.billedBy?.PAN && (
                  <div className="tax-info">
                    <CreditCard size={14} />
                    <span>PAN: {invoice.billedBy.PAN}</span>
                  </div>
                )}
                <div className="location-info">
                  {invoice.billedBy?.state}, {invoice.billedBy?.country}
                </div>
              </div>
            </div>

            <div className="billing-card">
              <h3 className="section-title">
                <Building size={18} />
                Billed To
              </h3>
              <div className="billing-info">
                <h4 className="company-name">{invoice.billedTo?.name}</h4>
                <div className="address-info">
                  <MapPin size={14} />
                  <span>{invoice.billedTo?.address}</span>
                </div>
                {invoice.billedTo?.GSTIN && (
                  <div className="tax-info">
                    <Hash size={14} />
                    <span>GSTIN: {invoice.billedTo.GSTIN}</span>
                  </div>
                )}
                {invoice.billedTo?.PAN && (
                  <div className="tax-info">
                    <CreditCard size={14} />
                    <span>PAN: {invoice.billedTo.PAN}</span>
                  </div>
                )}
                <div className="location-info">
                  {invoice.billedTo?.state}, {invoice.billedTo?.country}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section">
            <h3 className="section-title">
              <FileText size={18} />
              Invoice Items
            </h3>
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>GST Rate</th>
                    <th>Taxable Amount</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="item-description">{item.description}</td>
                      <td>{item.hsn || '-'}</td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-center">{item.gstRate}%</td>
                      <td className="text-right">{formatCurrency(item.taxableAmount)}</td>
                      <td className="text-right">{formatCurrency(item.cgst || 0)}</td>
                      <td className="text-right">{formatCurrency(item.sgst || 0)}</td>
                      <td className="text-right">{formatCurrency(item.igst || 0)}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="totals-section">
            <div className="totals-card">
              <h3 className="section-title">
                <DollarSign size={18} />
                Invoice Summary
              </h3>
              <div className="totals-breakdown">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.totals?.subTotal || 0)}</span>
                </div>
                <div className="total-row">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(invoice.totals?.totalTax || 0)}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(invoice.totals?.grandTotal || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Information */}
          <div className="workflow-section">
            <h3 className="section-title">
              <User size={18} />
              Workflow Information
            </h3>
            <div className="workflow-info">
              <div className="workflow-item">
                <span className="workflow-label">Uploaded By:</span>
                <span className="workflow-value">
                  {invoice.uploadedBy?.name} ({invoice.uploadedBy?.email})
                </span>
              </div>
              <div className="workflow-item">
                <span className="workflow-label">Upload Date:</span>
                <span className="workflow-value">{formatDate(invoice.createdAt)}</span>
              </div>
              {invoice.department && (
                <div className="workflow-item">
                  <span className="workflow-label">Department:</span>
                  <span className="workflow-value">{invoice.department}</span>
                </div>
              )}
              {invoice.approver && (
                <div className="workflow-item">
                  <span className="workflow-label">Approved By:</span>
                  <span className="workflow-value">
                    {invoice.approver.name} ({invoice.approver.email})
                  </span>
                </div>
              )}
              {invoice.approvalDate && (
                <div className="workflow-item">
                  <span className="workflow-label">Approval Date:</span>
                  <span className="workflow-value">{formatDate(invoice.approvalDate)}</span>
                </div>
              )}
              {invoice.approvalComments && (
                <div className="workflow-item">
                  <span className="workflow-label">Comments:</span>
                  <span className="workflow-value">{invoice.approvalComments}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;