import { apiClient } from './client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Invoice types that match the backend schemas
export interface InvoiceItem {
  id?: number;
  description: string;
  sac_code?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id?: number;
  filename?: string;
  processed_date?: string;
  status: 'draft' | 'verification' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'overdue';
  seller_name?: string;
  seller_address?: string;
  seller_email?: string;
  seller_gstin?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_gstin?: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_month?: string;
  reference_number?: string;
  total_amount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  pan_number?: string;
  amount_in_words?: string;
  department?: string;
  summary?: string;
  assigned_to?: number;
  approved_by?: number;
  comments?: string;
  items: InvoiceItem[];
}

export interface OCRResult {
  success: boolean;
  ocr_text?: string;
  extracted_data?: any;
  summary?: string;
  confidence_score?: number;
  error?: string;
}

export interface InvoiceUploadResponse {
  invoice_id: number;
  ocr_result: OCRResult;
  message: string;
}

export interface InvoiceFilter {
  page?: number;
  size?: number;
  status?: string;
  department?: string;
  seller_name?: string;
  invoice_number?: string;
  search?: string;
}

export interface InvoicePaginatedResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface DepartmentExpense {
  department: string;
  total_amount: number;
  invoice_count: number;
}

export interface VendorExpense {
  vendor_name: string;
  total_amount: number;
  invoice_count: number;
}

export interface MonthlyExpense {
  month: string;
  total_amount: number;
  invoice_count: number;
}

export interface InvoiceAnalytics {
  total_invoices: number;
  total_amount: number;
  pending_approvals: number;
  this_month_amount: number;
  department_expenses: DepartmentExpense[];
  vendor_expenses: VendorExpense[];
  monthly_expenses: MonthlyExpense[];
}

export const invoiceAPI = {
  // Upload and process invoice with OCR
  uploadInvoice: async (file: File, department?: string): Promise<InvoiceUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (department) {
      formData.append('department', department);
    }
    
    return await apiClient.postFormData('/invoices/upload', formData);
  },

  // Get paginated list of invoices
  getInvoices: async (filters?: InvoiceFilter): Promise<InvoicePaginatedResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.seller_name) params.append('seller_name', filters.seller_name);
      if (filters.invoice_number) params.append('invoice_number', filters.invoice_number);
      if (filters.search) params.append('search', filters.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/invoices?${queryString}` : '/invoices';
    
    return await apiClient.get(endpoint);
  },

  // Get specific invoice by ID
  getInvoiceById: async (invoiceId: number): Promise<Invoice> => {
    return await apiClient.get(`/invoices/${invoiceId}`);
  },

  // Update invoice
  updateInvoice: async (invoiceId: number, data: Partial<Invoice>): Promise<Invoice> => {
    return await apiClient.put(`/invoices/${invoiceId}`, data);
  },

  // Delete invoice
  deleteInvoice: async (invoiceId: number): Promise<void> => {
    await apiClient.delete(`/invoices/${invoiceId}`);
  },

  // Submit invoice for verification
  submitForVerification: async (invoiceId: number): Promise<Invoice> => {
    return await apiClient.post(`/invoices/${invoiceId}/submit`);
  },

  // Approve invoice (Manager/Controller)
  approveInvoice: async (invoiceId: number, comments?: string): Promise<Invoice> => {
    return await apiClient.post(`/invoices/${invoiceId}/approve`, { comments });
  },

  // Reject invoice (Manager/Controller)
  rejectInvoice: async (invoiceId: number, comments: string): Promise<Invoice> => {
    return await apiClient.post(`/invoices/${invoiceId}/reject`, { comments });
  },

  // Mark invoice as paid (Controller)
  markAsPaid: async (invoiceId: number, paymentMethod: string, transactionId?: string): Promise<Invoice> => {
    return await apiClient.post(`/invoices/${invoiceId}/mark-paid`, {
      payment_method: paymentMethod,
      transaction_id: transactionId
    });
  },

  // Get analytics for dashboard
  getAnalytics: async (): Promise<InvoiceAnalytics> => {
    return await apiClient.get('/invoices/analytics/dashboard');
  }
};

// React Query hooks for easy usage
export const useInvoices = (filters?: InvoiceFilter) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceAPI.getInvoices(filters),
  });
};

export const useInvoice = (invoiceId: number) => {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceAPI.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  });
};

export const useInvoiceAnalytics = () => {
  return useQuery({
    queryKey: ['invoice-analytics'],
    queryFn: () => invoiceAPI.getAnalytics(),
  });
};

export const useUploadInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, department }: { file: File; department?: string }) =>
      invoiceAPI.uploadInvoice(file, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data: Partial<Invoice> }) =>
      invoiceAPI.updateInvoice(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
};

export const useSubmitInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoiceId: number) => invoiceAPI.submitForVerification(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useApproveInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, comments }: { invoiceId: number; comments?: string }) =>
      invoiceAPI.approveInvoice(invoiceId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useRejectInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, comments }: { invoiceId: number; comments: string }) =>
      invoiceAPI.rejectInvoice(invoiceId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};
