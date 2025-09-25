import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { authUtils } from '../utils/auth';
import '../styles/login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      const currentUser = authUtils.getCurrentUser();
      let redirectPath = location.state?.from?.pathname;
      
      if (!redirectPath) {
        // Default redirect based on role
        switch (currentUser?.role) {
          case 'admin':
            redirectPath = '/users';
            break;
          case 'manager':
            redirectPath = '/approvals';
            break;
          default:
            redirectPath = '/dashboard';
        }
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email: formData.email });
      
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Login response:', response.data);

      // Handle the backend response structure: { success, message, data: { token, ...userInfo } }
      const { data } = response.data;
      
      if (!data || !data.token) {
        throw new Error('Invalid response: missing token');
      }
      
      const { token, ...user } = data;

      console.log('Extracted token and user:', { token: token ? 'present' : 'missing', user });

      // Store authentication data using auth utils
      authUtils.setAuth(token, user);

      console.log('Auth data stored, redirecting...');

      // Determine redirect path based on user role
      let redirectPath = location.state?.from?.pathname;
      
      if (!redirectPath) {
        // Default redirect based on role
        switch (user.role) {
          case 'admin':
            redirectPath = '/users';
            break;
          case 'manager':
            redirectPath = '/approvals';
            break;
          default:
            redirectPath = '/dashboard';
        }
      }
      
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">InvoiceHub</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="form-input-wrapper">
              <Mail size={18} className="form-input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="      Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="      Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading || !formData.email || !formData.password}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-demo-info">
            Demo credentials: <strong>admin@invoicehub.com</strong> / <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;