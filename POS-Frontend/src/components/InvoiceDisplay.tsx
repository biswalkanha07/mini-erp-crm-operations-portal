import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
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

interface InvoiceData {
  invoiceNo: string;
  transactionId: string;
  items: InvoiceItem[];
  totalAmount: number;
  gstTotal?: number;
  paymentMode: 'cash' | 'card' | 'UPI';
  dateTime: string;
  customerDetails: CustomerDetails;
  storeName?: string;
  organizationName?: string;
  storeAddress?: string;
  organizationAddress?: string;
  gstNumber?: string;
  phoneNumber?: string;
  status?: string;
  dueDate?: string;
}

interface InvoiceDisplayProps {
  invoiceData: InvoiceData;
  onClose: () => void;
}

const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({ invoiceData, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  // Send SMS handler
  const handleSendSMS = async () => {
    setSmsStatus('Sending...');
    try {
      // Use a valid invoice identifier for the API call
      // Prefer invoiceData.invoiceNo, or add _id to InvoiceData type if available
      const invoiceId = (invoiceData as any)._id;
      console.log('Sending SMS for invoiceId:', invoiceId);
      const token = localStorage.getItem('token');
      const res = await fetch('https://apis.pos.hutechsolutions.in/api/invoices/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus('SMS sent successfully!');
      } else {
        setSmsStatus(data.error || 'Failed to send SMS');
      }
    } catch (err) {
      setSmsStatus('Failed to send SMS');
    }
    setTimeout(() => setSmsStatus(null), 3000);
  };

  // // Debug logging
  // console.log('InvoiceDisplay received data:', {
  //   storeName: invoiceData?.storeName,
  //   storeAddress: invoiceData?.storeAddress,
  //   organizationName: invoiceData?.organizationName,
  //   gstNumber: invoiceData?.gstNumber,
  //   phoneNumber: invoiceData?.phoneNumber
  // });

  // Safety check for invoiceData
  if (!invoiceData) {
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p>No invoice data available</p>
          <button onClick={onClose} style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    );
  }

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
    if (!invoiceData.items || !Array.isArray(invoiceData.items)) return 0;
    return invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
  };

  const calculateGSTTotal = () => {
    if (!invoiceData.items || !Array.isArray(invoiceData.items)) return 0;
    return invoiceData.items.reduce((sum, item) => sum + item.gst, 0);
  };

  const calculateDiscountTotal = () => {
    if (!invoiceData.items || !Array.isArray(invoiceData.items)) return 0;
    return invoiceData.items.reduce((sum, item) => sum + item.discount, 0);
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
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

      pdf.save(`Invoice-${invoiceData.invoiceNo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const printInvoice = () => {
    if (!invoiceRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoiceData.invoiceNo}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
              }
              .invoice-container {
                max-width: 500px;
                margin: 0 auto;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
              }
              .header { text-align: center; margin-bottom: 20px; }
              .company-name { 
                margin: 0 0 8px 0; 
                color: #e53e3e; 
                font-size: 24px;
                font-weight: bold;
              }
              .company-details { 
                margin: 0 0 4px 0; 
                color: #666; 
                font-size: 14px; 
              }
              .invoice-details { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 20px;
                font-size: 14px;
              }
              .customer-details { 
                margin-bottom: 20px; 
                font-size: 14px; 
              }
              .items-table { 
                width: 100%; 
                border-collapse: collapse;
                font-size: 12px;
                margin-bottom: 20px;
              }
              .items-table th, .items-table td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              .items-table th { background: #f8f9fa; }
              .items-table .text-right { text-align: right; }
              .items-table .text-center { text-align: center; }
              .totals { 
                border-top: 2px solid #e53e3e; 
                padding-top: 10px;
                font-size: 14px;
              }
              .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 4px; 
              }
              .grand-total { 
                display: flex; 
                justify-content: space-between; 
                font-weight: bold;
                font-size: 16px;
                color: #e53e3e;
                border-top: 1px solid #ddd;
                padding-top: 8px;
              }
              .footer { 
                text-align: center; 
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .invoice-container { border: none; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            ${invoiceRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
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
            🧾 Invoice Generated Successfully
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

        {/* Invoice Content */}
        <div style={{ padding: '24px' }}>
          <div ref={invoiceRef} style={{
            background: 'white',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {/* Invoice Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                color: '#e53e3e', 
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                SUGUNA CHICKEN
              </h1>
              <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>
                {invoiceData.storeName || 'Store Name'}
              </p>
              <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>
                {invoiceData.storeAddress || 'Store Address'}
              </p>
              {invoiceData.gstNumber && (
                <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>
                  GST: {invoiceData.gstNumber}
                </p>
              )}
              {invoiceData.phoneNumber && (
                <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                  Phone: {invoiceData.phoneNumber}
                </p>
              )}
            </div>

            {/* Invoice Details */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0' }}><strong>Invoice No:</strong> {invoiceData.invoiceNo}</p>
                <p style={{ margin: '0' }}><strong>Date:</strong> {formatDateTime(invoiceData.dateTime)}</p>
                {invoiceData.dueDate && (
                  <p style={{ margin: '0' }}><strong>Due Date:</strong> {formatDateTime(invoiceData.dueDate)}</p>
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0' }}><strong>Transaction ID:</strong> {invoiceData.transactionId}</p>
                <p style={{ margin: '0 0 4px 0' }}><strong>Payment:</strong> {getPaymentMethodIcon(invoiceData.paymentMode)} {invoiceData.paymentMode?.toUpperCase() || 'N/A'}</p>
                {invoiceData.status && (
                  <p style={{ margin: '0' }}><strong>Status:</strong> {invoiceData.status.toUpperCase()}</p>
                )}
              </div>
            </div>

            {/* Customer Details */}
            {invoiceData.customerDetails?.name && (
              <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Bill To:</h3>
                <p style={{ margin: '0 0 4px 0' }}><strong>Name:</strong> {invoiceData.customerDetails.name}</p>
                {invoiceData.customerDetails.phone && (
                  <p style={{ margin: '0 0 4px 0' }}><strong>Phone:</strong> {invoiceData.customerDetails.phone}</p>
                )}
                {invoiceData.customerDetails.email && (
                  <p style={{ margin: '0' }}><strong>Email:</strong> {invoiceData.customerDetails.email}</p>
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
                  {invoiceData.items && Array.isArray(invoiceData.items) ? invoiceData.items.map((item, index) => (
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
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No items found
                      </td>
                    </tr>
                  )}
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
                <span>{formatCurrency(invoiceData.gstTotal ?? calculateGSTTotal())}</span>
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
                <span>{formatCurrency(invoiceData.totalAmount)}</span>
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
            marginTop: '20px',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={printInvoice}
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
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
                🖨️ Print Invoice
              </button>
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
            <button
              onClick={handleSendSMS}
              style={{
                padding: '12px 24px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '8px'
              }}
            >
              Send on SMS
            </button>
            {smsStatus && <div style={{ color: smsStatus.includes('success') ? '#22c55e' : '#c53030', fontSize: 13, marginTop: 2 }}>{smsStatus}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDisplay;
