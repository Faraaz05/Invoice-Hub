import api from './client';

// Auth API calls
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  getManagers: async () => {
    const response = await api.get('/api/auth/managers');
    return response.data;
  },
};

// Invoice API calls
export const invoiceAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/api/invoices/dashboard/stats');
    return response.data;
  },

  getAllInvoices: async (params = {}) => {
    const response = await api.get('/api/invoices', { params });
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await api.get(`/api/invoices/${id}`);
    return response.data;
  },

  uploadInvoice: async (formData) => {
    const response = await api.post('/api/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  approveRejectInvoice: async (id, action, comments) => {
    const response = await api.post(`/api/invoices/${id}/approve-reject`, {
      action,
      comments,
    });
    return response.data;
  },

  markAsPaid: async (id, paymentDate, paymentReference) => {
    const response = await api.post(`/api/invoices/${id}/mark-paid`, {
      paymentDate,
      paymentReference,
    });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },
};