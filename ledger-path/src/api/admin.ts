import { apiClient } from './client';
import type { User } from '@/types';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'clerk' | 'manager' | 'controller';
  department?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'clerk' | 'manager' | 'controller';
  department?: string;
}

export const adminAPI = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    return await apiClient.get('/admin/users');
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    return await apiClient.get(`/admin/users/${userId}`);
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    return await apiClient.post('/admin/users', userData);
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<User> => {
    return await apiClient.put(`/admin/users/${userId}`, userData);
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  }
};
