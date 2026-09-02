import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import InvoiceDisplay from './InvoiceDisplay';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentComplete: (paymentMethod: string, transactionId?: string) => void;
  customerDetails?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  cartItems?: Array<{
    sku: string;
    itemName: string;
    quantity: number;
    pricePerUnit: number;
    gst: number;
    discount: number;
    totalAmount: number;
  }>;
  invoiceData?: any;
  showInvoice?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentComplete,
  customerDetails,
  cartItems = [],
  invoiceData,
  showInvoice = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'UPI'>('cash');
  const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'complete' | 'invoice'>('method');
  const [upiQRCode, setUpiQRCode] = useState<string>('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');

  // Generate transaction ID
  useEffect(() => {
    if (isOpen) {
      const id = 'TXN' + Date.now().toString().slice(-8);
      setTransactionId(id);
    }
  }, [isOpen]);

  // Generate UPI QR Code
  useEffect(() => {
    if (selectedMethod === 'UPI' && totalAmount > 0) {
      generateUPIQRCode();
    }
  }, [selectedMethod, totalAmount]);

  // Handle invoice display when invoice data is provided
  useEffect(() => {
    if (showInvoice && invoiceData && paymentStep === 'complete') {
      setPaymentStep('invoice');
    }
  }, [showInvoice, invoiceData, paymentStep]);

  const generateUPIQRCode = async () => {
    try {
      // UPI payment URL format
      const upiId = 'aniketkuanar2001@oksbi'; // Replace with your actual UPI ID
      const merchantName = 'Suguna Chicken Store';
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Payment for Order ${transactionId}`)}`;
      
      const qrCodeDataURL = await QRCode.toDataURL(upiUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setUpiQRCode(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'card' | 'UPI') => {
    setSelectedMethod(method);
    setPaymentStep('processing');
  };

  const handlePaymentComplete = () => {
    setPaymentCompleted(true);
    setPaymentStep('complete');
    
    // Call the parent callback to handle transaction creation and invoice generation
    onPaymentComplete(selectedMethod, transactionId);
  };

  const handleClose = () => {
    // Reset state when closing
    setPaymentStep('method');
    setPaymentCompleted(false);
    setUpiQRCode('');
    onClose();
  };

  const handleInvoiceClose = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
            Payment Processing
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Transaction Details */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Transaction ID:</span>
            <span style={{ fontFamily: 'monospace' }}>{transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Total Amount:</span>
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#28a745' }}>
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
          {customerDetails?.name && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600' }}>Customer:</span>
              <span>{customerDetails.name}</span>
            </div>
          )}
        </div>

        {/* Payment Steps */}
        {paymentStep === 'method' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: '#333' }}>Select Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handlePaymentMethodSelect('cash')}
                style={{
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#6c3fc5';
                  e.currentTarget.style.backgroundColor = '#f8f6ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '24px' }}>💵</span>
                <div style={{ textAlign: 'left' }}>
                  <div>Cash Payment</div>
                  <div style={{ fontSize: '14px', color: '#666', fontWeight: '400' }}>
                    Pay with cash at counter
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('card')}
                style={{
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#6c3fc5';
                  e.currentTarget.style.backgroundColor = '#f8f6ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '24px' }}>💳</span>
                <div style={{ textAlign: 'left' }}>
                  <div>Card Payment</div>
                  <div style={{ fontSize: '14px', color: '#666', fontWeight: '400' }}>
                    Debit/Credit card payment
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('UPI')}
                style={{
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#6c3fc5';
                  e.currentTarget.style.backgroundColor = '#f8f6ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '24px' }}>📱</span>
                <div style={{ textAlign: 'left' }}>
                  <div>UPI Payment</div>
                  <div style={{ fontSize: '14px', color: '#666', fontWeight: '400' }}>
                    Scan QR code with UPI app
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Payment Processing */}
        {paymentStep === 'processing' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              {selectedMethod === 'cash' && 'Cash Payment'}
              {selectedMethod === 'card' && 'Card Payment'}
              {selectedMethod === 'UPI' && 'UPI Payment'}
            </h3>

            {selectedMethod === 'UPI' && upiQRCode && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  Scan QR Code with UPI App
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <img src={upiQRCode} alt="UPI QR Code" style={{ maxWidth: '200px' }} />
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                  Amount: ₹{totalAmount.toFixed(2)}
                </div>
              </div>
            )}

            {selectedMethod === 'cash' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', marginBottom: '12px' }}>
                  Please collect ₹{totalAmount.toFixed(2)} from customer
                </div>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', marginBottom: '12px' }}>
                  Please process card payment for ₹{totalAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Use your card terminal to process the payment
                </div>
              </div>
            )}

            <button
              onClick={handlePaymentComplete}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Payment Completed
            </button>
          </div>
        )}

        {/* Payment Complete */}
        {paymentStep === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ marginBottom: '16px', color: '#28a745' }}>
              Payment Successful!
            </h3>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
              Transaction ID: {transactionId}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Generating invoice...
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #e53e3e',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </div>
        )}

        {/* Invoice Display */}
        {paymentStep === 'invoice' && invoiceData && (
          <InvoiceDisplay 
            invoiceData={invoiceData} 
            onClose={handleInvoiceClose}
          />
        )}
      </div>
    </div>
    </>
  );
};

export default PaymentModal;

