import { apiClient } from './client'

// Auth API types
export interface LoginRequest {
  username: string // FastAPI OAuth2 uses 'username' field
  password: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'clerk' | 'manager' | 'controller'
  department?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// Auth API functions
export const authAPI = {
  // User login (OAuth2 form format)
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData()
    formData.append('username', email) // OAuth2 expects 'username'
    formData.append('password', password)
    
    const response = await apiClient.postFormData<LoginResponse>('/auth/login', formData)
    
    // Set token in client
    apiClient.setToken(response.access_token)
    
    return response
  },

  // Admin login (JSON format)
  adminLogin: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/admin-login', {
      email,
      password
    })
    
    // Set token in client
    apiClient.setToken(response.access_token)
    
    return response
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me')
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
    apiClient.setToken(null)
  }
}

// Admin API functions
export interface CreateUserRequest {
  email: string
  name: string
  role: 'clerk' | 'manager' | 'controller'
  department?: string
  password: string
}

export interface UpdateUserRequest {
  email?: string
  name?: string
  role?: 'clerk' | 'manager' | 'controller'
  department?: string
  is_active?: boolean
}

export const adminAPI = {
  // Get all users
  getUsers: async (skip = 0, limit = 100): Promise<User[]> => {
    return apiClient.get<User[]>(`/admin/users?skip=${skip}&limit=${limit}`)
  },

  // Get user by ID
  getUser: async (userId: number): Promise<User> => {
    return apiClient.get<User>(`/admin/users/${userId}`)
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    return apiClient.post<User>('/admin/users', userData)
  },

  // Update user
  updateUser: async (userId: number, userData: UpdateUserRequest): Promise<User> => {
    return apiClient.put<User>(`/admin/users/${userId}`, userData)
  },

  // Delete user
  deleteUser: async (userId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/admin/users/${userId}`)
  }
}
