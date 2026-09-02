import React, { useState } from 'react';
import { authAPI } from '../api';
import { ErpLogoIcon } from './common/ErpLogo';
import { FiMail, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onRedirectToReset: (token: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: ''
  });

  const validateForm = () => {
    setError('');
    const newFieldErrors = { email: '' };
    let isValid = true;

    if (!email.trim()) {
      newFieldErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors({ email: '' });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      if (response.data.status === 'success') {
        setSuccess(true);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          background: '#fff', 
          padding: '40px 36px', 
          borderRadius: '20px', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
          maxWidth: '460px', 
          width: '100%',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
            <ErpLogoIcon size={54} />
          </div>

          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: '#ecfdf5', 
            color: '#10b981',
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <FiCheckCircle size={32} />
          </div>

          <h2 style={{ 
            color: '#0f172a', 
            fontSize: '20px', 
            margin: '0 0 10px 0',
            fontWeight: '700'
          }}>
            Check Your Email
          </h2>
          
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px', 
            margin: '0 0 28px 0',
            lineHeight: '1.5'
          }}>
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and click the link to reset your password.
          </p>

          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
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
        background: '#fff', 
        padding: '40px 36px', 
        borderRadius: '20px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
        maxWidth: '460px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
            <ErpLogoIcon size={54} />
          </div>

          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: '800', 
            color: '#0f172a', 
            margin: '0 0 4px 0',
            letterSpacing: '-0.5px'
          }}>
            ERP&CRM portal
          </h1>

          <div style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            color: '#2563eb', 
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            Operations Portal
          </div>

          <p style={{ color: '#64748b', fontSize: '13px', margin: '0' }}>
            Enter your email to receive password reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <FiMail size={15} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="name@company.com"
                style={{ 
                  width: '100%', 
                  padding: '11px 14px 11px 38px', 
                  border: fieldErrors.email ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1', 
                  borderRadius: '10px', 
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {fieldErrors.email && (
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                {fieldErrors.email}
              </div>
            )}
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fee2e2',
              color: '#dc2626', 
              padding: '10px 14px', 
              borderRadius: '10px', 
              marginBottom: '18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}>
              <FiAlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div style={{ 
          marginTop: '22px', 
          paddingTop: '16px', 
          borderTop: '1px solid #f1f5f9', 
          textAlign: 'center' 
        }}>
          <button
            type="button"
            onClick={onBackToLogin}
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
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
