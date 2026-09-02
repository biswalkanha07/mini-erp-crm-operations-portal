import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [fieldErrors, setFieldErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('ResetPassword component loaded with token:', token);
    if (!token) {
      console.error('No token provided to ResetPassword component');
      setTokenValid(false);
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    setError('');
    setFieldErrors({
      password: '',
      confirmPassword: ''
    });

    let isValid = true;
    const newFieldErrors = {
      password: '',
      confirmPassword: ''
    };

    // Check password
    if (!formData.password.trim()) {
      newFieldErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    // Check confirm password
    if (!formData.confirmPassword.trim()) {
      newFieldErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    
    if (!isValid) {
      setError('Please fix the errors below to continue');
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Sending reset password request with token:', token);
      const response = await authAPI.resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      console.log('Reset password response:', response.data);

      if (response.data.status === 'success') {
        console.log('Password reset successful, setting success state');
        setLoading(false); // Clear loading state first
        setSuccess(true);
        
        // Start countdown
        let timeLeft = 3;
        setCountdown(timeLeft);
        
        const countdownInterval = setInterval(() => {
          timeLeft--;
          setCountdown(timeLeft);
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            console.log('Redirecting to login...');
            onSuccess();
          }
        }, 1000);
      } else {
        console.log('Password reset failed:', response.data);
        setError('Failed to reset password. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.response?.data?.message?.includes('Invalid or expired')) {
        setTokenValid(false);
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      }
      setLoading(false);
    }
  };

  if (!tokenValid) {
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
          {/* Error Icon */}
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(45deg, #e53e3e, #c53030)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 30px auto'
          }}>
            <span style={{ fontSize: '40px', color: '#fff' }}>⚠</span>
          </div>

          {/* Error Message */}
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            margin: '0 0 15px 0',
            fontWeight: '600'
          }}>
            Invalid Reset Link
          </h2>
          
          <p style={{ 
            color: '#666', 
            fontSize: '16px', 
            margin: '0 0 30px 0',
            lineHeight: '1.5'
          }}>
            This password reset link is invalid or has expired. 
            Please request a new password reset link.
          </p>

          {/* Back to Login Button */}
          <button
            type="button"
            onClick={onSuccess}
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
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    console.log('Rendering success state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          {/* Success Icon */}
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

          {/* Success Message */}
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px', 
            margin: '0 0 15px 0',
            fontWeight: '600'
          }}>
            Password Reset Successful!
          </h2>
          
          <p style={{ 
            color: '#666', 
            fontSize: '16px', 
            margin: '0 0 30px 0',
            lineHeight: '1.5'
          }}>
            Your password has been successfully reset. 
            You can now login with your new password.
          </p>

          {/* Info Box */}
          <div style={{ 
            background: '#f0fff4', 
            border: '1px solid #9ae6b4',
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '30px',
            fontSize: '14px',
            color: '#2f855a'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              🔄 Redirecting to login in {countdown} seconds...
            </div>
            <div>
              You will be automatically redirected to the login page.
            </div>
          </div>

          {/* Manual Login Button */}
          <button
            type="button"
            onClick={onSuccess}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            Go to Login Now
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '15px' 
          }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              background: 'linear-gradient(45deg, #e53e3e, #38a169)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '15px'
            }}>
              <span style={{ fontSize: '24px' }}>🐔</span>
            </div>
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#e53e3e', 
                margin: '0',
                lineHeight: '1.2'
              }}>
                SUGUNA CHICKEN
              </h1>
              <p style={{ 
                fontSize: '12px', 
                color: '#38a169', 
                margin: '0',
                fontWeight: '600'
              }}>
                Safer • Tender • Makes you stronger
              </p>
            </div>
          </div>
          <h2 style={{ 
            color: '#333', 
            fontSize: '20px', 
            margin: '0 0 8px 0',
            fontWeight: '600'
          }}>
            Reset Your Password
          </h2>
          <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#333',
              fontSize: '14px'
            }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your new password (min 8 characters)"
                style={{ 
                  width: '100%', 
                  padding: '14px 50px 14px 16px', 
                  border: fieldErrors.password ? '2px solid #dc2626' : '2px solid #e1e5e9', 
                  borderRadius: '8px', 
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = fieldErrors.password ? '#dc2626' : '#6c3fc5'}
                onBlur={(e) => e.target.style.borderColor = fieldErrors.password ? '#dc2626' : '#e1e5e9'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666',
                  padding: '4px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && (
              <div style={{ 
                fontSize: '12px', 
                color: '#dc2626', 
                marginTop: '4px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⚠️ {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#333',
              fontSize: '14px'
            }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                style={{ 
                  width: '100%', 
                  padding: '14px 50px 14px 16px', 
                  border: fieldErrors.confirmPassword ? '2px solid #dc2626' : '2px solid #e1e5e9', 
                  borderRadius: '8px', 
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = fieldErrors.confirmPassword ? '#dc2626' : '#6c3fc5'}
                onBlur={(e) => e.target.style.borderColor = fieldErrors.confirmPassword ? '#dc2626' : '#e1e5e9'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666',
                  padding: '4px'
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div style={{ 
                fontSize: '12px', 
                color: '#dc2626', 
                marginTop: '4px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⚠️ {fieldErrors.confirmPassword}
              </div>
            )}
          </div>

          {/* Error Message */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(-2px)';
                target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSuccess}
            style={{
              background: 'transparent',
              color: '#6c3fc5',
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

export default ResetPassword;
