import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BillItem {
  sku: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  gst: number;
  discount: number;
  totalAmount: number;
}

interface CustomerDetails {
  name?: string;
  phone?: string;
  email?: string;
}

interface BillData {
  billNo: string;
  transactionId: string;
  items: BillItem[];
  totalAmount: number;
  paymentMode: 'cash' | 'card' | 'UPI';
  dateTime: string;
  customerDetails: CustomerDetails;
  storeName?: string;
  organizationName?: string;
  storeAddress?: string;
  organizationAddress?: string;
  gstNumber?: string;
  phoneNumber?: string;
}

interface BillDisplayProps {
  billData: BillData;
  onClose: () => void;
}

const BillDisplay: React.FC<BillDisplayProps> = ({ billData, onClose }) => {
  const billRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return 'N/A';
    try {
      return new Date(dateTime).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'UPI': return '📱';
      default: return '💰';
    }
  };

  const calculateSubTotal = () => {
    return billData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
  };

  const calculateGSTTotal = () => {
    return billData.items.reduce((sum, item) => sum + item.gst, 0);
  };

  const calculateDiscountTotal = () => {
    return billData.items.reduce((sum, item) => sum + item.discount, 0);
  };

  const downloadPDF = async () => {
    if (!billRef.current) return;

    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Bill-${billData.billNo}.pdf`);
    } catch (error) {
      // console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

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
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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

        {/* Bill Content */}
        <div style={{ padding: '24px' }}>
          <div ref={billRef} style={{
            background: 'white',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {/* Bill Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                color: '#e53e3e', 
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                SUGUNA CHICKEN
              </h1>
              <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                {billData.organizationName || 'Organization Name'}
              </p>
              <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>
                {billData.storeName || 'Store Name'}
              </p>
              <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>
                {billData.storeAddress || 'Store Address'}
              </p>
              {billData.gstNumber && (
                <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>
                  GST: {billData.gstNumber}
                </p>
              )}
              {billData.phoneNumber && (
                <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                  Phone: {billData.phoneNumber}
                </p>
              )}
            </div>

            {/* Bill Details */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0' }}><strong>Bill No:</strong> {billData.billNo}</p>
                <p style={{ margin: '0' }}><strong>Date:</strong> {formatDateTime(billData.dateTime)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0' }}><strong>Transaction ID:</strong> {billData.transactionId}</p>
                <p style={{ margin: '0' }}><strong>Payment:</strong> {getPaymentMethodIcon(billData.paymentMode)} {billData.paymentMode.toUpperCase()}</p>
              </div>
            </div>

            {/* Customer Details */}
            {billData.customerDetails?.name && (
              <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Customer Details</h3>
                <p style={{ margin: '0 0 4px 0' }}><strong>Name:</strong> {billData.customerDetails.name}</p>
                {billData.customerDetails.phone && (
                  <p style={{ margin: '0 0 4px 0' }}><strong>Phone:</strong> {billData.customerDetails.phone}</p>
                )}
                {billData.customerDetails.email && (
                  <p style={{ margin: '0' }}><strong>Email:</strong> {billData.customerDetails.email}</p>
                )}
              </div>
            )}

            {/* Items Table */}
            <div style={{ marginBottom: '20px' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Price</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>GST</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{item.itemName}</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>SKU: {item.sku}</div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        {item.quantity}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                        {formatCurrency(item.pricePerUnit)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                        {formatCurrency(item.gst)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ 
              borderTop: '2px solid #e53e3e', 
              paddingTop: '10px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Sub Total:</span>
                <span>{formatCurrency(calculateSubTotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>GST:</span>
                <span>{formatCurrency(calculateGSTTotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Discount:</span>
                <span>-{formatCurrency(calculateDiscountTotal())}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#e53e3e',
                borderTop: '1px solid #ddd',
                paddingTop: '8px'
              }}>
                <span>Grand Total:</span>
                <span>{formatCurrency(billData.totalAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              fontSize: '12px',
              color: '#666'
            }}>
              <p style={{ margin: '0 0 4px 0' }}>Thank you for your business!</p>
              <p style={{ margin: '0' }}>Visit us again soon</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            <button
              onClick={downloadPDF}
              style={{
                padding: '12px 24px',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📄 Download PDF
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
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

export default BillDisplay;
