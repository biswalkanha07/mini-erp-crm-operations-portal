import React, { useState } from 'react';
import { authAPI } from '../api';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onRedirectToReset: (token: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin, onRedirectToReset }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: ''
  });

  // Function to validate form
  const validateForm = () => {
    setError('');
    setFieldErrors({
      email: ''
    });

    let isValid = true;
    const newFieldErrors = {
      email: ''
    };

    // Check email
    if (!email.trim()) {
      newFieldErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    
    if (!isValid) {
      setError('Please fix the errors below to continue');
    }
    
    return isValid;
  };

  // Function to handle input changes
  const handleInputChange = (value: string) => {
    setEmail(value);

    // Clear field error when user starts typing
    if (fieldErrors.email) {
      setFieldErrors(prev => ({
        ...prev,
        email: ''
      }));
    }

    // Clear general error when user starts typing
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
        background: 'linear-gradient(135deg, #1a2c7fff 0%, #0a174e 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '40px', 
          borderRadius: '16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
          maxWidth: '500px', 
          width: '100%',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(45deg, #38a169, #2f855a)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 30px auto'
          }}>
            <span style={{ fontSize: '40px', color: '#fff' }}>✓</span>
          </div>

          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            margin: '0 0 15px 0',
            fontWeight: '600'
          }}>
            Check Your Email
          </h2>
          
          <p style={{ 
            color: '#666', 
            fontSize: '16px', 
            margin: '0 0 30px 0',
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
              padding: '16px',
              background: 'linear-gradient(135deg, #1a2c7fff 0%, #0a174e 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Back to Login
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
      background: 'linear-gradient(135deg, #1a2c7fff 0%, #0a174e 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        background: '#fff', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
        maxWidth: '500px', 
        width: '100%',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '20px', 
            margin: '0 0 8px 0',
            fontWeight: '600'
          }}>
            Forgot Password?
          </h2>
          <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#333',
              fontSize: '14px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter your email address"
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                border: fieldErrors.email ? '2px solid #dc2626' : '2px solid #e1e5e9', 
                borderRadius: '8px', 
                fontSize: '16px',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = fieldErrors.email ? '#dc2626' : '#6c3fc5'}
              onBlur={(e) => e.target.style.borderColor = fieldErrors.email ? '#dc2626' : '#e1e5e9'}
            />
            {fieldErrors.email && (
              <div style={{ 
                fontSize: '12px', 
                color: '#dc2626', 
                marginTop: '4px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⚠️ {fieldErrors.email}
              </div>
            )}
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca',
              color: '#dc2626', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #1a2c7fff 0%, #0a174e 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              background: 'transparent',
              color: '#1a2c7fff',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '8px'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
