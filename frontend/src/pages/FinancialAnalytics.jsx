import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  Building,
  Target,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { authUtils } from '../utils/auth';
import '../styles/financial-analytics.css';

const FinancialAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: ''
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const currentUser = authUtils.getCurrentUser();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.department) params.append('department', filters.department);

      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/financial-analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = () => {
    fetchAnalytics();
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      department: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const exportData = () => {
    // Create CSV export functionality
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Department,Total Invoices,Total Amount,Average Amount,Pending Count,Approved Count,Paid Count\n" +
      analyticsData.departmentAnalytics.map(dept => 
        `${dept._id},${dept.totalInvoices},${dept.totalAmount},${Math.round(dept.avgAmount)},${dept.pendingCount},${dept.approvedCount},${dept.paidCount}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !analyticsData) {
    return (
      <div className="financial-analytics-page">
        <div className="page-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading financial analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="financial-analytics-page">
        <div className="page-container">
          <div className="error-state">
            <AlertTriangle size={48} />
            <h3>Failed to Load Analytics</h3>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="retry-btn">
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, departmentAnalytics, monthlyTrends, vendorAnalytics, taxAnalytics, gstRateDistribution, paymentTrends, amountDistribution, overdueAnalytics } = analyticsData || {};

  return (
    <div className="financial-analytics-page">
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-main">
            <h1 className="page-title">Company Financial Analytics</h1>
            <div className="header-actions">
              <button onClick={exportData} className="export-btn">
                <Download size={16} />
                Export Data
              </button>
              <button onClick={fetchAnalytics} className="refresh-btn" disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                Refresh
              </button>
            </div>
          </div>
          <p className="page-subtitle">Comprehensive financial insights and business intelligence</p>
          {lastUpdated && (
            <p className="last-updated">Last updated: {lastUpdated.toLocaleString()}</p>
          )}
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-container">
            <div className="filter-group">
              <Filter size={16} />
              <label>Date Range:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="filter-input-date"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="filter-input-date"
              />
            </div>

            <div className="filter-group">
              <Building size={16} />
              <label>Department:</label>
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

            <div className="filter-actions">
              <button onClick={applyFilters} className="apply-btn">
                Apply Filters
              </button>
              {(filters.startDate || filters.endDate || filters.department) && (
                <button onClick={clearFilters} className="clear-btn">
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon total-expenses">
              <DollarSign size={24} />
            </div>
            <div className="metric-content">
              <h3>Total Expenses</h3>
              <p className="metric-value">{formatCurrency(overview?.totalAmount)}</p>
              <span className="metric-label">Across all invoices</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon total-invoices">
              <FileText size={24} />
            </div>
            <div className="metric-content">
              <h3>Total Invoices</h3>
              <p className="metric-value">{formatNumber(overview?.totalInvoices)}</p>
              <span className="metric-label">Invoice count</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon avg-invoice">
              <Target size={24} />
            </div>
            <div className="metric-content">
              <h3>Average Invoice</h3>
              <p className="metric-value">{formatCurrency(overview?.avgInvoiceAmount)}</p>
              <span className="metric-label">Per invoice average</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon tax-paid">
              <TrendingUp size={24} />
            </div>
            <div className="metric-content">
              <h3>Tax Paid</h3>
              <p className="metric-value">{formatCurrency(overview?.totalTaxAmount)}</p>
              <span className="metric-label">Total GST paid</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon pending-amount">
              <AlertTriangle size={24} />
            </div>
            <div className="metric-content">
              <h3>Pending Amount</h3>
              <p className="metric-value">{formatCurrency(overview?.pendingAmount)}</p>
              <span className="metric-label">{overview?.pendingInvoices} pending invoices</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon paid-amount">
              <DollarSign size={24} />
            </div>
            <div className="metric-content">
              <h3>Paid Amount</h3>
              <p className="metric-value">{formatCurrency(overview?.paidAmount)}</p>
              <span className="metric-label">{overview?.paidInvoices} paid invoices</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="analytics-section">
          <h2 className="section-title">Invoice Status Breakdown</h2>
          <div className="status-breakdown">
            <div className="status-item pending">
              <div className="status-bar">
                <div 
                  className="status-fill"
                  style={{ 
                    width: `${((overview?.pendingInvoices || 0) / (overview?.totalInvoices || 1)) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="status-info">
                <span className="status-label">Pending</span>
                <span className="status-count">{overview?.pendingInvoices || 0}</span>
                <span className="status-amount">{formatCurrency(overview?.pendingAmount)}</span>
              </div>
            </div>

            <div className="status-item approved">
              <div className="status-bar">
                <div 
                  className="status-fill"
                  style={{ 
                    width: `${((overview?.approvedInvoices || 0) / (overview?.totalInvoices || 1)) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="status-info">
                <span className="status-label">Approved</span>
                <span className="status-count">{overview?.approvedInvoices || 0}</span>
                <span className="status-amount">{formatCurrency(overview?.approvedAmount)}</span>
              </div>
            </div>

            <div className="status-item paid">
              <div className="status-bar">
                <div 
                  className="status-fill"
                  style={{ 
                    width: `${((overview?.paidInvoices || 0) / (overview?.totalInvoices || 1)) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="status-info">
                <span className="status-label">Paid</span>
                <span className="status-count">{overview?.paidInvoices || 0}</span>
                <span className="status-amount">{formatCurrency(overview?.paidAmount)}</span>
              </div>
            </div>

            <div className="status-item rejected">
              <div className="status-bar">
                <div 
                  className="status-fill"
                  style={{ 
                    width: `${((overview?.rejectedInvoices || 0) / (overview?.totalInvoices || 1)) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="status-info">
                <span className="status-label">Rejected</span>
                <span className="status-count">{overview?.rejectedInvoices || 0}</span>
                <span className="status-amount">-</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Analytics */}
        <div className="analytics-section">
          <h2 className="section-title">Department Spending Analysis</h2>
          <div className="department-analytics">
            {departmentAnalytics?.map((dept, index) => (
              <div key={dept._id} className="department-card">
                <div className="department-header">
                  <h3 className="department-name">{dept._id}</h3>
                  <span className="department-rank">#{index + 1}</span>
                </div>
                <div className="department-metrics">
                  <div className="department-metric">
                    <span className="metric-label">Total Amount</span>
                    <span className="metric-value">{formatCurrency(dept.totalAmount)}</span>
                  </div>
                  <div className="department-metric">
                    <span className="metric-label">Invoice Count</span>
                    <span className="metric-value">{dept.totalInvoices}</span>
                  </div>
                  <div className="department-metric">
                    <span className="metric-label">Average</span>
                    <span className="metric-value">{formatCurrency(dept.avgAmount)}</span>
                  </div>
                </div>
                <div className="department-status">
                  <div className="status-mini pending">
                    <span>{dept.pendingCount} Pending</span>
                  </div>
                  <div className="status-mini approved">
                    <span>{dept.approvedCount} Approved</span>
                  </div>
                  <div className="status-mini paid">
                    <span>{dept.paidCount} Paid</span>
                  </div>
                </div>
                <div className="department-bar">
                  <div 
                    className="department-fill"
                    style={{ 
                      width: `${(dept.totalAmount / (departmentAnalytics[0]?.totalAmount || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="analytics-section">
          <h2 className="section-title">Top Vendors by Spend</h2>
          <div className="vendor-analytics">
            <div className="vendor-table">
              <div className="vendor-header">
                <span>Vendor</span>
                <span>Invoices</span>
                <span>Total Amount</span>
                <span>Average</span>
                <span>Last Invoice</span>
              </div>
              {vendorAnalytics?.map((vendor, index) => (
                <div key={vendor._id} className="vendor-row">
                  <div className="vendor-name">
                    <span className="vendor-rank">#{index + 1}</span>
                    <span className="vendor-title">{vendor._id || 'Unknown Vendor'}</span>
                  </div>
                  <span className="vendor-count">{vendor.totalInvoices}</span>
                  <span className="vendor-amount">{formatCurrency(vendor.totalAmount)}</span>
                  <span className="vendor-avg">{formatCurrency(vendor.avgAmount)}</span>
                  <span className="vendor-date">
                    {new Date(vendor.lastInvoiceDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Amount Distribution */}
        <div className="analytics-section">
          <h2 className="section-title">Invoice Amount Distribution</h2>
          <div className="amount-distribution">
            {amountDistribution?.map((range, index) => (
              <div key={range.range} className="amount-range-card">
                <h3 className="range-title">{range.range}</h3>
                <div className="range-metrics">
                  <div className="range-metric">
                    <span className="metric-label">Count</span>
                    <span className="metric-value">{range.count}</span>
                  </div>
                  <div className="range-metric">
                    <span className="metric-label">Total</span>
                    <span className="metric-value">{formatCurrency(range.totalAmount)}</span>
                  </div>
                </div>
                <div className="range-bar">
                  <div 
                    className="range-fill"
                    style={{ 
                      width: `${(range.count / Math.max(...(amountDistribution?.map(r => r.count) || [1]))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GST Rate Analysis */}
        <div className="analytics-section">
          <h2 className="section-title">GST Rate Distribution</h2>
          <div className="gst-analysis">
            <div className="tax-summary">
              <div className="tax-card">
                <h3>Total CGST</h3>
                <p>{formatCurrency(taxAnalytics?.totalCGST)}</p>
              </div>
              <div className="tax-card">
                <h3>Total SGST</h3>
                <p>{formatCurrency(taxAnalytics?.totalSGST)}</p>
              </div>
              <div className="tax-card">
                <h3>Total IGST</h3>
                <p>{formatCurrency(taxAnalytics?.totalIGST)}</p>
              </div>
              <div className="tax-card">
                <h3>Average Tax Rate</h3>
                <p>{formatPercentage(taxAnalytics?.avgTaxRate)}</p>
              </div>
            </div>
            
            <div className="gst-rates">
              {gstRateDistribution?.map((rate) => (
                <div key={rate._id} className="gst-rate-item">
                  <span className="gst-rate">{rate._id}% GST</span>
                  <span className="gst-count">{rate.count} items</span>
                  <span className="gst-amount">{formatCurrency(rate.totalAmount)}</span>
                  <div className="gst-bar">
                    <div 
                      className="gst-fill"
                      style={{ 
                        width: `${(rate.count / Math.max(...(gstRateDistribution?.map(r => r.count) || [1]))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overdue Analysis */}
        {overdueAnalytics?.count > 0 && (
          <div className="analytics-section alert-section">
            <h2 className="section-title">
              <AlertTriangle size={20} />
              Overdue Invoices Alert
            </h2>
            <div className="alert-content">
              <div className="alert-metric">
                <span className="alert-label">Overdue Count</span>
                <span className="alert-value">{overdueAnalytics.count}</span>
              </div>
              <div className="alert-metric">
                <span className="alert-label">Overdue Amount</span>
                <span className="alert-value">{formatCurrency(overdueAnalytics.totalAmount)}</span>
              </div>
              <div className="alert-metric">
                <span className="alert-label">Avg Days Overdue</span>
                <span className="alert-value">{Math.round(overdueAnalytics.avgDaysOverdue)} days</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialAnalytics;