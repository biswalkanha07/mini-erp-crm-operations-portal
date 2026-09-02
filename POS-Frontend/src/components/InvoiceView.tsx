import React, { useState } from 'react';

interface InvoiceViewProps {
  invoice: any;
  onClose: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onClose }) => {
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  if (!invoice) return null;

  // Send SMS handler
  const handleSendSMS = async () => {
    setSmsStatus('Sending...');
    try {
        const token = localStorage.getItem('token');
    console.log('Sending SMS for invoiceId:', invoice._id);
    const res = await fetch('http://apis.pos.hutechsolutions.in/api/store-order-invoices/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ invoiceId: invoice._id }),
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

  // FIX: Add missing return statement for JSX
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div id="print-bill" style={{ background: '#fff', borderRadius: 8, padding: 10, minWidth: 220, maxWidth: 80 * 3.78, boxShadow: '0 2px 16px #0002', position: 'relative', fontFamily: 'monospace', fontSize: 12 }}>
        <button className="no-print" onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>TAX INVOICE / BILL OF SUPPLY</div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{invoice.organizationName}</div>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>{invoice.storeAddress || invoice.organizationAddress}</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>TEL NO: {invoice.phoneNumber || '-'}</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>HELPLINE: 1800 266 2255</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>GSTIN: {invoice.gstNumber || '-'}</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>CIN NO: L51909MH2007PLC268269</div>
        <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px dashed #888' }} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #888' }}>
              <th style={{ textAlign: 'left', padding: '2px 0' }}>ITEM</th>
              <th style={{ textAlign: 'right', padding: '2px 0' }}>QTY</th>
              <th style={{ textAlign: 'right', padding: '2px 0' }}>DISC</th>
              <th style={{ textAlign: 'right', padding: '2px 0' }}>AMT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ padding: '2px 0' }}>{item.itemName}</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.discount?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.totalAmount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px dashed #888' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1, fontSize: 11 }}>
          <span>Sub Total</span>
          <span>{invoice.items.reduce((sum: number, i: any) => sum + (i.pricePerUnit * i.quantity), 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1, fontSize: 11 }}>
          <span>GST ({invoice.gstRate || 0}%)</span>
          <span>{invoice.items.reduce((sum: number, i: any) => sum + (i.gst || 0), 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1, fontSize: 11 }}>
          <span>Total Due</span>
          <span>{invoice.totalAmount?.toFixed(2)}</span>
        </div>
        <div style={{ margin: '6px 0', textAlign: 'center', fontSize: 11 }}>
          Your mobile number<br />
          <b>{invoice.customerMobile || '-'}</b><br />
          has been Register with {invoice.organizationName}
        </div>
        <div className="no-print" style={{ marginTop: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => window.print()} style={{ padding: '6px 14px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Print</button>
          <button onClick={handleSendSMS} style={{ padding: '6px 14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Send on SMS</button>
          {smsStatus && <div style={{ color: smsStatus.includes('success') ? '#22c55e' : '#c53030', fontSize: 12, marginTop: 2 }}>{smsStatus}</div>}
        </div>
        {/* Print CSS for 80mm till bill size */}
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              width: 80mm !important;
              margin: 0 !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
            }
            #print-bill {
              width: 80mm !important;
              min-width: 80mm !important;
              max-width: 80mm !important;
              padding: 0 !important;
              font-size: 12px !important;
              box-shadow: none !important;
              background: #fff !important;
            }
            .no-print, #print-bill button {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default InvoiceView;
