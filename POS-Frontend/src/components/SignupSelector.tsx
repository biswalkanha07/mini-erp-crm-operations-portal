import React, { useState } from 'react';
import { authAPI } from '../api';
import { ErpLogoIcon } from './common/ErpLogo';
import { FiUser, FiBriefcase, FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface SignupSelectorProps {
  onBackToLogin: () => void;
  storeId?: string | null;
  email?: string | null;
  token?: string | null;
}

const SignupSelector: React.FC<SignupSelectorProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    setError('');
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
      isValid = false;
    }

    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await authAPI.registerAdmin({
        name: formData.name.trim(),
        organizationName: formData.organizationName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      setSuccess(true);
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Failed to create initial admin account';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
        padding: '40px 36px', 
        borderRadius: '20px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
        maxWidth: '480px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header with ERP Logo */}
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

          <div style={{
            display: 'inline-block',
            background: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #dbeafe',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Create Initial Admin Account
          </div>
        </div>

        {/* Success Alert */}
        {success ? (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <FiCheckCircle size={36} color="#10b981" style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700' }}>Admin Account Created!</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#047857' }}>
              Redirecting to sign in screen...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '13px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <FiUser size={15} />
                </span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    border: fieldErrors.name ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {fieldErrors.name && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                  {fieldErrors.name}
                </div>
              )}
            </div>

            {/* Organization Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '13px' }}>
                Organization Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <FiBriefcase size={15} />
                </span>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  placeholder="e.g. Apex Wholesale Distributors"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    border: fieldErrors.organizationName ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {fieldErrors.organizationName && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                  {fieldErrors.organizationName}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '13px' }}>
                Business Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <FiMail size={15} />
                </span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@company.com"
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

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '13px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <FiLock size={15} />
                </span>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    border: fieldErrors.password ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {fieldErrors.password && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '13px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <FiLock size={15} />
                </span>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    border: fieldErrors.confirmPassword ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                  {fieldErrors.confirmPassword}
                </div>
              )}
            </div>

            {/* General Error */}
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
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>
        )}

        {/* Back to Login */}
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

export default SignupSelector;

