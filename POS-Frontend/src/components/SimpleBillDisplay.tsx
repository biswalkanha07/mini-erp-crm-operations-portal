import React from 'react';

interface BillData {
  billNo: string;
  transactionId: string;
  totalAmount: number;
  paymentMode: string;
  dateTime: string;
}

interface SimpleBillDisplayProps {
  billData: BillData;
  onClose: () => void;
}

const SimpleBillDisplay: React.FC<SimpleBillDisplayProps> = ({ billData, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#1a1a1a' }}>
            🧾 Bill Generated Successfully
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h3>Bill Details</h3>
          <p><strong>Bill No:</strong> {billData.billNo}</p>
          <p><strong>Transaction ID:</strong> {billData.transactionId}</p>
          <p><strong>Total Amount:</strong> ₹{billData.totalAmount}</p>
          <p><strong>Payment Mode:</strong> {billData.paymentMode}</p>
          <p><strong>Date:</strong> {new Date(billData.dateTime).toLocaleString()}</p>
          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBillDisplay;
