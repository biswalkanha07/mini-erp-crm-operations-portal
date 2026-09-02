import React from 'react';

interface ErpLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ErpLogoIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 48, style }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 128 128" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', flexShrink: 0, ...style }}
  >
    <defs>
      <linearGradient id="erpGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="erpGradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>

    {/* Background Rounded Square Base */}
    <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#erpGradPrimary)" />

    {/* Layer 1: Top Platform */}
    <path d="M64 28 L94 44 L64 60 L34 44 Z" fill="#FFFFFF" opacity="0.95" />
    
    {/* Layer 2: Middle Platform */}
    <path d="M34 56 L64 72 L94 56 L94 66 L64 82 L34 66 Z" fill="url(#erpGradAccent)" opacity="0.9" />
    
    {/* Layer 3: Base Platform */}
    <path d="M34 78 L64 94 L94 78 L94 88 L64 104 L34 88 Z" fill="#93C5FD" opacity="0.9" />
    
    {/* Center Core Light */}
    <circle cx="64" cy="44" r="5" fill="#1E3A8A" />
  </svg>
);

const ErpLogo: React.FC<ErpLogoProps> = ({
  size = 48,
  showText = true,
  textColor = '#0F172A',
  subtextColor = '#2563EB',
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={className}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '12px',
        ...style 
      }}
    >
      <ErpLogoIcon size={size} />
      {showText && (
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ 
            fontSize: `${Math.max(15, size * 0.42)}px`, 
            fontWeight: 800, 
            color: textColor,
            letterSpacing: '-0.3px'
          }}>
            ERP&CRM portal
          </div>
          <div style={{ 
            fontSize: `${Math.max(10, size * 0.24)}px`, 
            fontWeight: 700, 
            color: subtextColor,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginTop: '2px'
          }}>
            Operations Portal
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpLogo;
