import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, type User } from '@/api/auth';

type UserRole = 'admin' | 'clerk' | 'manager' | 'controller';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canApproveInvoices: () => boolean;
  canManageVendors: () => boolean;
  canMarkPaid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(email, password);
          
          set({ 
            user: response.user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          console.log('Login successful:', response.user);
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false 
          });
          return false;
        }
      },

      adminLogin: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.adminLogin(email, password);
          
          set({ 
            user: response.user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          console.log('Admin login successful:', response.user);
          return true;
        } catch (error) {
          console.error('Admin login failed:', error);
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false 
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const user = await authAPI.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid, clear it
          localStorage.removeItem('access_token');
          set({ user: null, isAuthenticated: false });
        }
      },

      hasRole: (roles: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      canApproveInvoices: () => {
        const { user } = get();
        return user?.role === 'manager' || user?.role === 'controller' || user?.role === 'admin';
      },

      canManageVendors: () => {
        const { user } = get();
        return user?.role === 'controller' || user?.role === 'admin';
      },

      canMarkPaid: () => {
        const { user } = get();
        return user?.role === 'controller' || user?.role === 'admin';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);