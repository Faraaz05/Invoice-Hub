import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const Index = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to user's default page based on role
  const defaultRoute = (() => {
    switch (user?.role) {
      case 'clerk': return '/invoices/new';
      case 'manager': return '/approvals';
      case 'controller': return '/dashboard';
      default: return '/dashboard';
    }
  })();

  return <Navigate to={defaultRoute} replace />;
};

export default Index;
