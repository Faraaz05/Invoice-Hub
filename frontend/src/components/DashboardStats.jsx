import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/invoices/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to load dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-stats-loading">
        <div className="stats-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card-skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-stats-error">
        <p>{error}</p>
        <button onClick={fetchDashboardStats} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.overview?.totalInvoices || 0,
      icon: FileText,
      color: 'blue',
      description: 'All invoices in system'
    },
    {
      title: 'Pending Approval',
      value: stats.overview?.pendingApprovals || 0,
      icon: Clock,
      color: 'orange',
      description: 'Awaiting manager approval'
    },
    {
      title: 'Monthly Spend',
      value: formatCurrency(stats.overview?.monthlySpend || 0),
      icon: DollarSign,
      color: 'green',
      description: 'This month\'s spend'
    },
    {
      title: 'Overdue Invoices',
      value: stats.overview?.overdueInvoices || 0,
      icon: XCircle,
      color: 'red',
      description: 'Overdue invoices'
    }
  ];

  return (
    <div className="dashboard-stats">
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`stat-card stat-card-${stat.color}`}>
              <div className="stat-card-header">
                <div className="stat-icon">
                  <IconComponent size={24} />
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                </div>
              </div>
              <p className="stat-description">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* {stats.recentInvoices && stats.recentInvoices.length > 0 && (
        <div className="recent-invoices">
          <div className="recent-invoices-card">
            <div className="recent-invoices-header">
              <FileText size={20} />
              <h3>Recent Invoices</h3>
            </div>
            <div className="recent-invoices-content">
              {stats.recentInvoices.map(invoice => (
                <div key={invoice._id} className="recent-invoice-item">
                  <div className="invoice-info">
                    <div className="invoice-number">{invoice.invoiceNumber}</div>
                    <div className="invoice-company">{invoice.billedBy?.name}</div>
                  </div>
                  <div className="invoice-details">
                    <div className="invoice-amount">{formatCurrency(invoice.totals?.grandTotal || 0)}</div>
                    <div className={`invoice-status status-${invoice.status}`}>
                      {invoice.status === 'pending' && <Clock size={14} />}
                      {invoice.status === 'approved' && <CheckCircle size={14} />}
                      {invoice.status === 'rejected' && <XCircle size={14} />}
                      <span>{invoice.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default DashboardStats;