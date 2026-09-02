import React, { useState } from 'react';
import SignupForm from './SignupForm';

interface SignupSelectorProps {
  onBackToLogin: () => void;
  storeId?: string | null;
  email?: string | null;
  token?: string | null;
}

const SignupSelector: React.FC<SignupSelectorProps> = ({ onBackToLogin, storeId, email, token }) => {
  const [signupType, setSignupType] = useState<'organization' | 'store' | null>(null);

  // Auto-select store signup if storeId is provided
  React.useEffect(() => {
    if (storeId) {
      setSignupType('store');
    }
  }, [storeId]);

  if (signupType) {
    return (
      <SignupForm
        signupType={signupType}
        onBackToLogin={onBackToLogin}
        onBackToSignupSelector={() => setSignupType(null)}
        storeId={storeId}
        emailFromLink={email}
        tokenFromLink={token}
      />
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
        maxWidth: '600px', 
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
            Create Account
          </h2>
          <p style={{ color: '#666', fontSize: '16px', margin: '0' }}>
            Choose your account type
          </p>
        </div>

        {/* Signup Type Selection */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => setSignupType('organization')}
              style={{
                width: '100%',
                padding: '30px 25px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '20px',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(-3px)';
                target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.3)';
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0
              }}>
                🏢
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Organization Admin</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Manage multiple stores and oversee operations</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSignupType('store')}
              style={{
                width: '100%',
                padding: '30px 25px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '20px',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(-3px)';
                target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0
              }}>
                🏪
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Store User</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Handle POS operations and daily sales</div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px', 
          fontSize: '13px',
          color: '#666',
          marginBottom: '20px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>
            Account Types:
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Organization Admin:</strong> Full access to manage organizations, stores, inventory, and view reports
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Store User:</strong> Access to POS interface for sales transactions
          </div>
          <div style={{ 
            background: '#e6fffa', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#38a169',
            marginTop: '8px'
          }}>
            <strong>Note:</strong> You'll need the Organization ID or Store ID provided by your administrator to create an account.
          </div>
        </div>

        {/* Back to Login */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToLogin}
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

export default SignupSelector;
