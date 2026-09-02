import React, { useState } from 'react';
import { authAPI } from '../api';
import SignupSelector from './SignupSelector';
import ForgotPassword from './ForgotPassword';
import { ErpLogoIcon } from './common/ErpLogo';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

interface LoginSelectorProps {
  onLogin: (user: any, token: string) => void;
}

const LoginSelector: React.FC<LoginSelectorProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });

  const validateForm = () => {
    setError('');
    const newFieldErrors = {
      email: '',
      password: ''
    };
    let isValid = true;

    if (!email.trim()) {
      newFieldErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password.trim()) {
      newFieldErrors.password = 'Password is required';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login({
        email: email.trim().toLowerCase(),
        password
      });

      const data = response.data?.data || response.data;
      const token = data?.token;
      const user = data?.user;

      if (!token || !user) {
        throw new Error('Invalid authentication response');
      }

      localStorage.setItem('token', token);
      onLogin(user, token);
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Invalid email or password';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showSignup) {
    return <SignupSelector onBackToLogin={() => setShowSignup(false)} />;
  }

  if (showForgotPassword) {
    return (
      <ForgotPassword 
        onBackToLogin={() => setShowForgotPassword(false)} 
        onRedirectToReset={() => {}}
      />
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0a174e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        background: '#ffffff', 
        padding: '44px 36px', 
        borderRadius: '20px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
        maxWidth: '460px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Portal Branding Header with ERP Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <ErpLogoIcon size={56} />
          </div>
          
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            color: '#0f172a', 
            margin: '0 0 4px 0',
            letterSpacing: '-0.5px'
          }}>
            ERP&CRM portal
          </h1>
          
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: '#2563eb', 
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            Operations Portal
          </div>

          <p style={{ 
            fontSize: '13px', 
            color: '#64748b', 
            margin: '0 auto',
            lineHeight: '1.5',
            maxWidth: '360px'
          }}>
            Wholesale & Distribution Management System
          </p>
        </div>

        {/* Quick Test Accounts Selector (All 4 roles under Admin) */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '20px',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Test Accounts (Org ORG001)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              Pass: <code style={{ color: '#2563eb', fontWeight: '600' }}>password123</code>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { label: 'Admin', email: 'admin@test.com', bg: '#fee2e2', border: '#fca5a5', color: '#991b1b' },
              { label: 'Sales', email: 'sales@test.com', bg: '#dbeafe', border: '#93c5fd', color: '#1e40af' },
              { label: 'Warehouse', email: 'warehouse@test.com', bg: '#fef3c7', border: '#fcd34d', color: '#92400e' },
              { label: 'Accounts', email: 'accounts@test.com', bg: '#dcfce7', border: '#86efac', color: '#166534' }
            ].map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('password123');
                  setFieldErrors({ email: '', password: '' });
                  setError('');
                }}
                style={{
                  padding: '7px 4px',
                  background: email === acc.email ? acc.bg : '#ffffff',
                  border: `1.5px solid ${email === acc.email ? acc.border : '#e2e8f0'}`,
                  color: email === acc.email ? acc.color : '#475569',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={`Click to fill ${acc.email} / password123`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '600', 
              color: '#334155',
              fontSize: '13px'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}>
                <FiMail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  border: fieldErrors.email ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1', 
                  borderRadius: '10px', 
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = fieldErrors.email ? '#ef4444' : '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = fieldErrors.email ? '#ef4444' : '#cbd5e1'}
              />
            </div>
            {fieldErrors.email && (
              <div style={{ 
                fontSize: '12px', 
                color: '#ef4444', 
                marginTop: '5px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FiAlertCircle size={13} /> {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ 
                fontWeight: '600', 
                color: '#334155',
                fontSize: '13px'
              }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}>
                <FiLock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  border: fieldErrors.password ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1', 
                  borderRadius: '10px', 
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = fieldErrors.password ? '#ef4444' : '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = fieldErrors.password ? '#ef4444' : '#cbd5e1'}
              />
            </div>
            {fieldErrors.password && (
              <div style={{ 
                fontSize: '12px', 
                color: '#ef4444', 
                marginTop: '5px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FiAlertCircle size={13} /> {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fee2e2',
              color: '#dc2626', 
              padding: '12px 14px', 
              borderRadius: '10px', 
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Operations Portal'}
          </button>
        </form>

        {/* First Time Organization Setup / Register Link */}
        <div style={{ 
          marginTop: '28px', 
          paddingTop: '20px', 
          borderTop: '1px solid #f1f5f9', 
          textAlign: 'center' 
        }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>
            Need an initial setup?{' '}
          </span>
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            style={{
              background: 'transparent',
              color: '#2563eb',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '600',
              padding: 0
            }}
          >
            Create Initial Admin Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;
