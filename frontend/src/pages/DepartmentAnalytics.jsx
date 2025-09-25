import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Clock, 
  Users,
  PieChart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import '../styles/department-analytics.css';

const DepartmentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalInvoices: 0,
      totalAmount: 0,
      avgProcessingTime: 0,
      approvalRate: 0
    },
    statusBreakdown: {
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0
    },
    quarterlyTrends: [],
    topVendors: [],
    departmentStats: []
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build URL with optional timeframe parameter
      const url = selectedTimeframe === 'all' 
        ? '/api/invoices/analytics'
        : `/api/invoices/analytics?timeframe=${selectedTimeframe}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch analytics');
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

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  const formatDays = (days) => {
    return `${Math.round(days)} days`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="status-icon pending" />;
      case 'approved': return <TrendingUp size={16} className="status-icon approved" />;
      case 'rejected': return <TrendingDown size={16} className="status-icon rejected" />;
      case 'paid': return <DollarSign size={16} className="status-icon paid" />;
      default: return <FileText size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="department-analytics-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="department-analytics-page">
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="department-analytics-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-main">
          <div>
            <h1 className="page-title">Department Analytics</h1>
            <p className="page-subtitle">Insights and performance metrics for your department</p>
          </div>
          <div className="timeframe-selector">
            <label htmlFor="timeframe">Time Period:</label>
            <select 
              id="timeframe"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="timeframe-select"
            >
              <option value="all">All Time</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-section">
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-icon total-invoices">
              <FileText size={24} />
            </div>
            <div className="card-content">
              <h3>Total Invoices</h3>
              <p className="stat-value">{analytics.overview.totalInvoices.toLocaleString()}</p>
              <span className="stat-label">Processed</span>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon total-amount">
              <DollarSign size={24} />
            </div>
            <div className="card-content">
              <h3>Total Amount</h3>
              <p className="stat-value">{formatCurrency(analytics.overview.totalAmount)}</p>
              <span className="stat-label">Processed Value</span>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon processing-time">
              <Clock size={24} />
            </div>
            <div className="card-content">
              <h3>Avg Processing</h3>
              <p className="stat-value">{formatDays(analytics.overview.avgProcessingTime)}</p>
              <span className="stat-label">Per Invoice</span>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon approval-rate">
              <TrendingUp size={24} />
            </div>
            <div className="card-content">
              <h3>Approval Rate</h3>
              <p className="stat-value">{formatPercentage(analytics.overview.approvalRate)}</p>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Status Breakdown Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Invoice Status Breakdown</h3>
            <PieChart size={20} />
          </div>
          <div className="status-chart">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
              const total = Object.values(analytics.statusBreakdown).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={status} className="status-item">
                  <div className="status-info">
                    {getStatusIcon(status)}
                    <span className="status-name">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </div>
                  <div className="status-stats">
                    <span className="status-count">{count}</span>
                    <div className="status-bar">
                      <div 
                        className={`status-fill ${status}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="status-percentage">{formatPercentage(percentage)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Trends Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Quarterly Trends</h3>
            <BarChart3 size={20} />
          </div>
          <div className="trends-chart">
            {analytics.quarterlyTrends.length > 0 ? (
              <div className="trends-bars">
                {analytics.quarterlyTrends.map((quarter, index) => {
                  const maxAmount = Math.max(...analytics.quarterlyTrends.map(q => q.totalAmount));
                  const heightPercentage = maxAmount > 0 ? (quarter.totalAmount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={index} className="trend-item">
                      <div className="trend-bar">
                        <div 
                          className="trend-fill"
                          style={{ height: `${heightPercentage}%` }}
                          title={`${quarter.quarter}: ${formatCurrency(quarter.totalAmount)}`}
                        ></div>
                      </div>
                      <div className="trend-details">
                        <span className="trend-quarter">{quarter.quarter}</span>
                        <span className="trend-count">{quarter.invoiceCount}</span>
                        <span className="trend-amount">{formatCurrency(quarter.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data">
                <Calendar size={32} />
                <p>No quarterly trend data available for the selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Top Vendors */}
        <div className="vendors-container">
          <div className="section-header">
            <h3>Top Vendors</h3>
            <Users size={20} />
          </div>
          <div className="vendors-list">
            {analytics.topVendors.length > 0 ? (
              analytics.topVendors.map((vendor, index) => (
                <div key={index} className="vendor-item">
                  <div className="vendor-rank">#{index + 1}</div>
                  <div className="vendor-info">
                    <h4>{vendor.name}</h4>
                    <p>{vendor.invoiceCount} invoices</p>
                  </div>
                  <div className="vendor-amount">
                    {formatCurrency(vendor.totalAmount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <Users size={32} />
                <p>No vendor data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Performance */}
        <div className="performance-container">
          <div className="section-header">
            <h3>Department Performance</h3>
            <BarChart3 size={20} />
          </div>
          <div className="performance-metrics">
            <div className="metric-item">
              <div className="metric-icon efficiency">
                <TrendingUp size={20} />
              </div>
              <div className="metric-content">
                <h4>Processing Efficiency</h4>
                <p className="metric-value">
                  {analytics.overview.avgProcessingTime < 5 ? 'Excellent' : 
                   analytics.overview.avgProcessingTime < 10 ? 'Good' : 'Needs Improvement'}
                </p>
                <span className="metric-desc">Based on processing time</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon quality">
                <DollarSign size={20} />
              </div>
              <div className="metric-content">
                <h4>Approval Quality</h4>
                <p className="metric-value">
                  {analytics.overview.approvalRate > 90 ? 'Excellent' : 
                   analytics.overview.approvalRate > 75 ? 'Good' : 'Needs Improvement'}
                </p>
                <span className="metric-desc">Based on approval rate</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon volume">
                <FileText size={20} />
              </div>
              <div className="metric-content">
                <h4>Processing Volume</h4>
                <p className="metric-value">
                  {analytics.overview.totalInvoices > 100 ? 'High' : 
                   analytics.overview.totalInvoices > 50 ? 'Medium' : 'Low'}
                </p>
                <span className="metric-desc">Invoice throughput</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalytics;