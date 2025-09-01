import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

// Types matching backend response
export interface InvoiceAnalytics {
  total_invoices: number;
  total_amount: number;
  pending_approvals: number;
  this_month_amount: number;
  department_expenses: {
    department: string;
    total_amount: number;
    invoice_count: number;
  }[];
  vendor_expenses: {
    vendor_name: string;
    total_amount: number;
    invoice_count: number;
  }[];
  monthly_expenses: {
    month: string;
    total_amount: number;
    invoice_count: number;
  }[];
}

export const dashboardApi = {
  getAnalytics: async (): Promise<InvoiceAnalytics> => {
    const response = await apiClient.get('/analytics');
    return response.data as InvoiceAnalytics;
  }
};

export const useInvoiceAnalytics = () => {
  return useQuery({
    queryKey: ['invoice-analytics'],
    queryFn: dashboardApi.getAnalytics
  });
};