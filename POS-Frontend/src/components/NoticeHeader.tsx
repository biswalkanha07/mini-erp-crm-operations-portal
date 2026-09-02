import React, { useState, useEffect } from 'react';

interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'discount' | 'sale' | 'promotion' | 'announcement';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface NoticeHeaderProps {
  notices?: Notice[];
  autoScroll?: boolean;
  scrollSpeed?: number;
  showCloseButton?: boolean;
  onClose?: (noticeId: string) => void;
}

const NoticeHeader: React.FC<NoticeHeaderProps> = ({
  notices = [],
  autoScroll = true,
  scrollSpeed = 50,
  showCloseButton = true,
  onClose
}) => {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Default notices if none provided
  const defaultNotices: Notice[] = [
    {
      id: '1',
      title: 'Special Discount',
      message: 'Get 20% OFF on all chicken products this week! Limited time offer.',
      type: 'discount',
      isActive: true
    },
    {
      id: '2',
      title: 'Flash Sale',
      message: 'Buy 2 Get 1 FREE on selected items. Hurry up, offer ends soon!',
      type: 'sale',
      isActive: true
    },
    {
      id: '3',
      title: 'New Arrival',
      message: 'Fresh organic chicken now available at all our stores.',
      type: 'announcement',
      isActive: true
    }
  ];

  const activeNotices = notices.length > 0 ? notices.filter(n => n.isActive) : defaultNotices;

  // Auto-scroll through notices
  useEffect(() => {
    if (!autoScroll || isPaused || activeNotices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNoticeIndex((prev) => (prev + 1) % activeNotices.length);
    }, 3000); // Change notice every 3 seconds

    return () => clearInterval(interval);
  }, [autoScroll, isPaused, activeNotices.length]);

  const getNoticeStyle = (type: string) => {
    switch (type) {
      case 'discount':
        return {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          color: 'white'
        };
      case 'sale':
        return {
          background: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
          color: 'white'
        };
      case 'promotion':
        return {
          background: 'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)',
          color: 'white'
        };
      case 'announcement':
        return {
          background: 'linear-gradient(135deg, #1dd1a1 0%, #55a3ff 100%)',
          color: 'white'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
          color: 'white'
        };
    }
  };

  const handleClose = (noticeId: string) => {
    // console.log('Close button clicked for notice:', noticeId);
    if (onClose) {
      onClose(noticeId);
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible || activeNotices.length === 0) {
    return null;
  }

  const currentNotice = activeNotices[currentNoticeIndex];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        background: getNoticeStyle(currentNotice.type).background,
        color: getNoticeStyle(currentNotice.type).color,
        padding: '8px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        overflow: 'hidden',
        height: '50px'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
          animation: autoScroll ? `slide ${scrollSpeed}s linear infinite` : 'none'
        }}
      />

      {/* Moving text container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Scrolling text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            whiteSpace: 'nowrap',
            animation: isPaused ? 'none' : `scrollText ${scrollSpeed}s linear infinite`,
            fontSize: '14px',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          <span style={{ fontSize: '16px' }}>
            {currentNotice.type === 'discount' && '🎉'}
            {currentNotice.type === 'sale' && '🔥'}
            {currentNotice.type === 'promotion' && '📢'}
            {currentNotice.type === 'announcement' && '📢'}
          </span>
          <span>{currentNotice.title}: {currentNotice.message}</span>
          {/* Repeat the text for seamless scrolling */}
          <span style={{ fontSize: '16px' }}>
            {currentNotice.type === 'discount' && '🎉'}
            {currentNotice.type === 'sale' && '🔥'}
            {currentNotice.type === 'promotion' && '📢'}
            {currentNotice.type === 'announcement' && '📢'}
          </span>
          <span>{currentNotice.title}: {currentNotice.message}</span>
        </div>
      </div>

      {/* Close button - positioned absolutely */}
      {showCloseButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // console.log('Close button clicked!');
            handleClose(currentNotice.id);
          }}
          style={{
            position: 'absolute',
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.3)',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255,255,255,0.5)';
            target.style.borderColor = 'rgba(255,255,255,0.8)';
            target.style.transform = 'translateY(-50%) scale(1.1)';
            target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255,255,255,0.3)';
            target.style.borderColor = 'rgba(255,255,255,0.5)';
            target.style.transform = 'translateY(-50%) scale(1)';
            target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }}
        >
          ×
        </button>
      )}

      <style>
        {`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes scrollText {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
};

export default NoticeHeader;
