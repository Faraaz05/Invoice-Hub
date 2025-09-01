import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vendor } from '@/types';

const API_BASE = '/api';

export const vendorApi = {
  getAll: async (): Promise<Vendor[]> => {
    const response = await fetch(`${API_BASE}/vendors`);
    if (!response.ok) throw new Error('Failed to fetch vendors');
    return response.json();
  },

  create: async (data: Omit<Vendor, 'id'>): Promise<Vendor> => {
    const response = await fetch(`${API_BASE}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create vendor');
    return response.json();
  }
};

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: vendorApi.getAll
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: vendorApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    }
  });
};