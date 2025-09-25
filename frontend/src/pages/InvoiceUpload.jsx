import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Building, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Save,
  Edit3,
  DollarSign,
  Hash,
  Calendar,
  User,
  MapPin,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { authUtils } from '../utils/auth';
import '../styles/invoice-upload.css';

const InvoiceUpload = () => {
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processedData, setProcessedData] = useState(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState(null);

  const departments = [
    { value: 'Sales', label: 'Sales Department' },
    { value: 'Finance', label: 'Finance Department' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'Marketing', label: 'Marketing Department' },
    { value: 'Operations', label: 'Operations' },
    { value: 'IT', label: 'Information Technology' }
  ];

  const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.txt';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
      const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'txt'];
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please select a valid file type (PDF, JPG, JPEG, PNG, TXT)');
        return;
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!department) {
      setError('Please select a department');
      return;
    }

    setLoading(true);
    setError('');
    setAiAnalysisStatus(null);

    try {
      const formData = new FormData();
      formData.append('invoice', file);
      formData.append('department', department);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/invoices/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - let browser set it automatically with boundary
        }
      });

      if (response.data.success) {
        setProcessedData(response.data.data);
        
        // Capture AI analysis status
        const aiAnalysis = response.data.data.aiAnalysis;
        setAiAnalysisStatus({
          success: aiAnalysis.success,
          error: aiAnalysis.error,
          source: aiAnalysis.source,
          fieldsExtracted: aiAnalysis.fieldsExtracted
        });
        
        // Extract the invoice data from the response
        const invoiceData = response.data.data.invoice;
        console.log('Invoice data from backend:', invoiceData);
        console.log('AI Analysis Status:', aiAnalysis);
        console.log('Invoice dates:', {
          invoiceDate: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate
        });
        setVerificationData(invoiceData);
        setShowVerificationForm(true);
      } else {
        setError(response.data.message || 'Failed to process invoice');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      // Handle different types of errors
      let errorMessage = 'Failed to upload and process invoice';
      
      if (err.response?.data?.error) {
        // Check for duplicate key error
        if (err.response.data.error.includes('E11000 duplicate key error')) {
          if (err.response.data.error.includes('invoiceNumber_1')) {
            errorMessage = 'This invoice number already exists in the system. Please check if this invoice has been uploaded before.';
          } else {
            errorMessage = 'Duplicate entry detected. This invoice may already exist in the system.';
          }
        } else {
          errorMessage = err.response.data.message || err.response.data.error;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationChange = (section, field, value) => {
    console.log('Date change:', field, '=', value);
    
    setVerificationData(prev => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      // If no section specified, update directly on the root
      if (!section) {
        newData[field] = value;
      }

      console.log('Updated verification data:', {
        invoiceDate: newData.invoiceDate,
        dueDate: newData.dueDate
      });

      return newData;
    });
  };

  const handleItemChange = (index, field, value) => {
    setVerificationData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSaveInvoice = async () => {
    setSaving(true);
    setError('');

    // Validate dates on frontend (only if due date is provided)
    if (verificationData.dueDate && verificationData.invoiceDate) {
      // Parse dates properly (add time to avoid timezone issues)
      const invoiceDate = new Date(verificationData.invoiceDate + 'T12:00:00.000Z');
      const dueDate = new Date(verificationData.dueDate + 'T12:00:00.000Z');
      
      console.log('Frontend validation - Invoice Date:', invoiceDate, 'Due Date:', dueDate);
      
      if (dueDate < invoiceDate) {
        setError('Due date must be on or after the invoice date');
        setSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      
      // Format dates properly before sending
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        // If it's already a full ISO string, use it as is
        if (dateString.includes('T')) return dateString;
        // If it's YYYY-MM-DD format, convert to proper Date
        const date = new Date(dateString + 'T12:00:00.000Z'); // Use midday to avoid timezone issues
        return date.toISOString();
      };

      const formattedData = {
        ...verificationData,
        invoiceDate: formatDateForBackend(verificationData.invoiceDate),
        dueDate: verificationData.dueDate ? formatDateForBackend(verificationData.dueDate) : null,
        department,
        status: 'pending'
      };

      console.log('Original dates:', {
        invoiceDate: verificationData.invoiceDate,
        dueDate: verificationData.dueDate
      });
      console.log('Formatted dates:', {
        invoiceDate: formattedData.invoiceDate,
        dueDate: formattedData.dueDate
      });
      
      // Since the invoice was already created during upload, we need to update it
      const invoiceId = processedData.invoice._id;
      const response = await axios.put(`/api/invoices/${invoiceId}`, formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Reset form
        setFile(null);
        setDepartment('');
        setProcessedData(null);
        setShowVerificationForm(false);
        setVerificationData(null);
        setAiAnalysisStatus(null);
        
        // Show success message
        alert('Invoice saved successfully and sent for approval!');
      } else {
        setError(response.data.message || 'Failed to save invoice');
      }
    } catch (err) {
      console.error('Save error:', err);
      
      // Handle different types of errors
      let errorMessage = 'Failed to save invoice';
      
      if (err.response?.data?.error) {
        // Check for duplicate key error
        if (err.response.data.error.includes('E11000 duplicate key error')) {
          if (err.response.data.error.includes('invoiceNumber_1')) {
            errorMessage = 'This invoice number already exists in the system. Please check if this invoice has been uploaded before or modify the invoice number.';
          } else {
            errorMessage = 'Duplicate entry detected. This invoice may already exist in the system.';
          }
        } else {
          errorMessage = err.response.data.message || err.response.data.error;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    if (!processedData?.invoice?._id) {
      setError('No invoice to delete');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const invoiceId = processedData.invoice._id;
      
      const response = await axios.delete(`/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Reset form
        setFile(null);
        setDepartment('');
        setProcessedData(null);
        setShowVerificationForm(false);
        setVerificationData(null);
        setAiAnalysisStatus(null);
        setError('');
        
        alert('Invoice deleted successfully!');
      } else {
        setError(response.data.message || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete invoice';
      setError(errorMessage);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (showVerificationForm && verificationData) {
    return (
      <div className="invoice-upload-page">
        <div className="page-container">
          <div className="page-header">
            <div className="header-main">
              <div>
                <h1 className="page-title">Verify Invoice Details</h1>
                <p className="page-subtitle">Review and edit the extracted invoice information</p>
              </div>
              <div className="header-actions">
                <button 
                  onClick={() => setShowVerificationForm(false)}
                  className="btn-secondary"
                >
                  <Edit3 size={18} />
                  Back to Upload
                </button>
                <button 
                  onClick={handleDeleteInvoice}
                  className="btn-danger"
                >
                  <Trash2 size={18} />
                  Delete Invoice
                </button>
                <button 
                  onClick={handleSaveInvoice}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? <Loader size={18} className="spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* AI Analysis Status */}
          {aiAnalysisStatus && (
            <div className={`ai-analysis-status ${aiAnalysisStatus.success ? 'success' : 'warning'}`}>
              <div className="ai-status-header">
                {aiAnalysisStatus.success ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <h4>AI Analysis Status</h4>
              </div>
              <div className="ai-status-content">
                {aiAnalysisStatus.success ? (
                  <p>AI analysis successful! Extracted {aiAnalysisStatus.fieldsExtracted} fields automatically.</p>
                ) : (
                  <div>
                    <p>AI analysis used fallback data extraction. Please verify all fields manually.</p>
                    {aiAnalysisStatus.error && (
                      <p className="ai-error-details">Reason: {aiAnalysisStatus.error}</p>
                    )}
                  </div>
                )}
                <small>Data source: {aiAnalysisStatus.source === 'gemini' ? 'Gemini AI' : 'Basic OCR Fallback'}</small>
              </div>
            </div>
          )}

          <div className="verification-form">
            {/* Header Information */}
            <div className="verification-section">
              <div className="section-header">
                <FileText size={20} />
                <h3>Invoice Header</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Invoice Number *</label>
                  <input
                    type="text"
                    value={verificationData.invoiceNumber || ''}
                    onChange={(e) => handleVerificationChange('', 'invoiceNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Invoice Date *</label>
                  <input
                    type="date"
                    value={verificationData.invoiceDate ? (() => {
                      try {
                        const date = new Date(verificationData.invoiceDate);
                        return date.toISOString().split('T')[0];
                      } catch (e) {
                        console.error('Error parsing invoice date:', verificationData.invoiceDate);
                        return '';
                      }
                    })() : ''}
                    onChange={(e) => handleVerificationChange('', 'invoiceDate', e.target.value)}
                    required
                  />
                  <small className="date-helper">Browser format (DD/MM/YYYY or MM/DD/YYYY)</small>
                </div>
                <div className="form-group">
                  <label>Due Date (Optional)</label>
                  <input
                    type="date"
                    value={verificationData.dueDate ? (() => {
                      try {
                        const date = new Date(verificationData.dueDate);
                        return date.toISOString().split('T')[0];
                      } catch (e) {
                        console.error('Error parsing due date:', verificationData.dueDate);
                        return '';
                      }
                    })() : ''}
                    onChange={(e) => handleVerificationChange('', 'dueDate', e.target.value || null)}
                    min={verificationData.invoiceDate ? (() => {
                      try {
                        const date = new Date(verificationData.invoiceDate);
                        return date.toISOString().split('T')[0];
                      } catch (e) {
                        return '';
                      }
                    })() : ''}
                  />
                  <small className="date-helper">Optional - Only set if specified in the invoice</small>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="verification-section">
              <div className="section-header">
                <Building size={20} />
                <h3>Billing Information</h3>
              </div>
              <div className="billing-grid">
                <div className="billing-card">
                  <h4>Billed By</h4>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      value={verificationData.billedBy?.name || ''}
                      onChange={(e) => handleVerificationChange('billedBy', 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      value={verificationData.billedBy?.address || ''}
                      onChange={(e) => handleVerificationChange('billedBy', 'address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={verificationData.billedBy?.state || ''}
                        onChange={(e) => handleVerificationChange('billedBy', 'state', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={verificationData.billedBy?.country || ''}
                        onChange={(e) => handleVerificationChange('billedBy', 'country', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="billing-card">
                  <h4>Billed To</h4>
                  <div className="form-group">
                    <label>Company/Person Name *</label>
                    <input
                      type="text"
                      value={verificationData.billedTo?.name || ''}
                      onChange={(e) => handleVerificationChange('billedTo', 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      value={verificationData.billedTo?.address || ''}
                      onChange={(e) => handleVerificationChange('billedTo', 'address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={verificationData.billedTo?.state || ''}
                        onChange={(e) => handleVerificationChange('billedTo', 'state', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={verificationData.billedTo?.country || ''}
                        onChange={(e) => handleVerificationChange('billedTo', 'country', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="verification-section">
              <div className="section-header">
                <Hash size={20} />
                <h3>Line Items</h3>
              </div>
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>GST Rate (%)</th>
                      <th>Taxable Amount</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>IGST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationData.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <textarea
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.qty || ''}
                            onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.gstRate || ''}
                            onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={item.taxableAmount || ''}
                            onChange={(e) => handleItemChange(index, 'taxableAmount', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={item.cgst || ''}
                            onChange={(e) => handleItemChange(index, 'cgst', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={item.sgst || ''}
                            onChange={(e) => handleItemChange(index, 'sgst', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={item.igst || ''}
                            onChange={(e) => handleItemChange(index, 'igst', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={item.total || ''}
                            onChange={(e) => handleItemChange(index, 'total', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="verification-section">
              <div className="section-header">
                <DollarSign size={20} />
                <h3>Totals</h3>
              </div>
              <div className="totals-grid">
                <div className="form-group">
                  <label>Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verificationData.totals?.subTotal || ''}
                    onChange={(e) => handleVerificationChange('totals', 'subTotal', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label>CGST Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verificationData.totals?.cgstTotal || ''}
                    onChange={(e) => handleVerificationChange('totals', 'cgstTotal', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label>SGST Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verificationData.totals?.sgstTotal || ''}
                    onChange={(e) => handleVerificationChange('totals', 'sgstTotal', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label>IGST Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verificationData.totals?.igstTotal || ''}
                    onChange={(e) => handleVerificationChange('totals', 'igstTotal', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group grand-total">
                  <label>Grand Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verificationData.totals?.grandTotal || ''}
                    onChange={(e) => handleVerificationChange('totals', 'grandTotal', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="verification-section">
              <div className="section-header">
                <Eye size={20} />
                <h3>Invoice Summary</h3>
              </div>
              <div className="form-group">
                <label>Summary Description</label>
                <textarea
                  value={verificationData.summary || ''}
                  onChange={(e) => handleVerificationChange('', 'summary', e.target.value)}
                  rows={4}
                  placeholder="Brief description of the invoice..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-upload-page">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Upload Invoice</h1>
          <p className="page-subtitle">Upload and process a new invoice with department assignment</p>
        </div>

        <div className="upload-form-container">
          <div className="upload-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* File Upload Section */}
            <div className="form-section">
              <div className="section-header">
                <Upload size={20} />
                <h3>Select Invoice File</h3>
              </div>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="invoice-file"
                  accept={acceptedFileTypes}
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="invoice-file" className="file-upload-label">
                  <div className="upload-icon">
                    <FileText size={48} />
                  </div>
                  <div className="upload-text">
                    <p className="upload-primary">Click to select invoice file</p>
                    <p className="upload-secondary">Supports PDF, JPG, JPEG, PNG, TXT (Max 10MB)</p>
                  </div>
                </label>
                {file && (
                  <div className="selected-file">
                    <CheckCircle size={16} className="file-check" />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Department Selection */}
            <div className="form-section">
              <div className="section-header">
                <Building size={20} />
                <h3>Select Department</h3>
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="department-select"
                required
              >
                <option value="">Choose a department...</option>
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <div className="form-actions">
              <button
                onClick={handleUploadAndProcess}
                disabled={!file || !department || loading}
                className="btn-primary upload-btn"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="spin" />
                    Processing Invoice...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload & Process
                  </>
                )}
              </button>
            </div>

            {processedData && !showVerificationForm && (
              <div className="processing-complete">
                <div className="success-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="success-content">
                  <h4>Invoice Processed Successfully!</h4>
                  <p>The invoice has been analyzed and data extracted. Click below to verify and edit the details.</p>
                  <button
                    onClick={() => setShowVerificationForm(true)}
                    className="btn-primary verify-btn"
                  >
                    <Eye size={18} />
                    Verify & Edit Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceUpload;