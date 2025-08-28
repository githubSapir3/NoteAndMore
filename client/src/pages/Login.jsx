import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (error) {
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'var(--spacing-lg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'pulse 6s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: '150px',
        height: '150px',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        borderRadius: '50%',
        filter: 'blur(30px)',
        animation: 'pulse 8s ease-in-out infinite'
      }} />

      <div className="login-card glass" style={{
        width: '100%',
        maxWidth: '450px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-2xl)',
        padding: 'var(--spacing-3xl)',
        position: 'relative',
        zIndex: 10,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        {/* Logo/Brand section */}
        <div className="login-header" style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--spacing-2xl)',
          position: 'relative'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-xl)',
            margin: '0 auto var(--spacing-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-lg)'
          }}>
            NM
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 'var(--spacing-sm)',
            letterSpacing: '-0.02em'
          }}>
            Welcome Back
          </h1>
          
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.1rem',
            fontWeight: '500',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            Sign in to your NoteAndMore account and continue your productivity journey
          </p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="alert alert-error" style={{ 
            marginBottom: 'var(--spacing-xl)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span style={{ fontWeight: '600' }}>{apiError}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="Enter your email address"
                disabled={isLoading}
                style={{
                  paddingLeft: 'var(--spacing-xl)',
                  fontSize: '1rem',
                  height: '56px'
                }}
              />
              <span style={{
                position: 'absolute',
                left: 'var(--spacing-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '1.2rem'
              }}>
                📧
              </span>
            </div>
            {errors.email && (
              <div className="form-error" style={{ 
                marginTop: 'var(--spacing-sm)',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                placeholder="Enter your password"
                disabled={isLoading}
                style={{
                  paddingLeft: 'var(--spacing-xl)',
                  fontSize: '1rem',
                  height: '56px'
                }}
              />
              <span style={{
                position: 'absolute',
                left: 'var(--spacing-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '1.2rem'
              }}>
                🔒
              </span>
            </div>
            {errors.password && (
              <div className="form-error" style={{ 
                marginTop: 'var(--spacing-sm)',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              marginTop: 'var(--spacing-lg)',
              height: '56px',
              fontSize: '1.1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 'var(--spacing-2xl)',
          color: 'var(--text-muted)'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 var(--spacing-md)', fontSize: '0.875rem', fontWeight: '500' }}>
            New to NoteAndMore?
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/register"
            className="btn btn-outline"
            style={{ 
              width: '100%',
              height: '56px',
              fontSize: '1.1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderWidth: '2px',
              background: 'transparent',
              color: 'var(--primary-color)',
              borderColor: 'var(--primary-color)'
            }}
          >
            Create New Account
          </Link>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-2xl)',
          paddingTop: 'var(--spacing-xl)',
          borderTop: '1px solid var(--border-light)',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          <p style={{ marginBottom: 'var(--spacing-sm)' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            © 2024 NoteAndMore. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
