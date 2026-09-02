
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const RECEIPT_WIDTH = 320;

const InvoicePublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      try {
        const res = await fetch(`https://apis.pos.hutechsolutions.in/api/invoices/${id}`);
        const data = await res.json();
        if (res.ok) {
          setInvoice(data);
        } else {
          setError(data.error || 'Invoice not found');
        }
      } catch (err) {
        setError('Failed to fetch invoice');
      }
      setLoading(false);
    }
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading invoice...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!invoice) return null;

  // Print CSS for receipt
  const printStyle = `
    @media print {
      body * { visibility: hidden; }
      #receipt-print, #receipt-print * { visibility: visible; }
      #receipt-print { position: absolute; left: 0; top: 0; width: ${RECEIPT_WIDTH}px !important; }
    }
  `;

  return (
    <>
      <style>{printStyle}</style>
      <div id="receipt-print" style={{
        width: RECEIPT_WIDTH,
        margin: '40px auto',
        padding: '16px',
        border: '1px solid #eee',
        borderRadius: 8,
        background: '#fff',
        fontFamily: 'monospace',
        fontSize: 14
      }}>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>TAX INVOICE / BILL OF SUPPLY</div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{invoice.organizationName || 'SUGUNA FOODS PVT LTD'}</div>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>{invoice.storeAddress || invoice.organizationAddress || 'No.101, 3rd Floor, Amara Jyothi HBCS Layout, Domlur I Stage, Serenity Layout, Domlur, Bengaluru, Karnataka 560071'}</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>TEL NO: {invoice.phoneNumber || '080-27933001'}</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>HELPLINE: 1800 266 2255</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>GSTIN: {invoice.gstNumber || '07AADCB1093N1ZI'}</div>
        <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 2 }}>CIN NO: L51909MH2007PLC268269</div>
        <hr style={{ margin: '8px 0', borderTop: '1px dashed #888' }} />
        <table style={{ width: '100%', fontSize: 13, marginBottom: 8 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #888' }}>
              <th style={{ textAlign: 'left' }}>ITEM DESC</th>
              <th>QTY</th>
              <th>DISC AMT</th>
              <th>NET AMT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td>{item.itemName}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{item.discount?.toFixed(2) || '0.00'}</td>
                <td style={{ textAlign: 'right' }}>{(item.totalAmount - (item.gst || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={{ margin: '8px 0', borderTop: '1px dashed #888' }} />
  <div style={{ fontSize: 13, marginBottom: 2 }}>Sub Total: <span style={{ float: 'right' }}>₹{invoice.items.reduce((sum: number, i: any) => sum + (i.pricePerUnit * i.quantity), 0).toFixed(2)}</span></div>
  <div style={{ fontSize: 13, marginBottom: 2 }}>GST: <span style={{ float: 'right' }}>₹{(typeof invoice.gstTotal === 'number' && !isNaN(invoice.gstTotal) ? invoice.gstTotal : invoice.items.reduce((sum: number, i: any) => sum + (i.gst || 0), 0)).toFixed(2)}</span></div>
  <div style={{ fontSize: 13, marginBottom: 2 }}>Total Due: <span style={{ float: 'right' }}>₹{invoice.totalAmount?.toFixed(2)}</span></div>
  <div style={{ fontSize: 13, marginBottom: 2 }}>Change Due: <span style={{ float: 'right' }}>₹0.00</span></div>
        <hr style={{ margin: '8px 0', borderTop: '1px dashed #888' }} />
        <div style={{ textAlign: 'center', fontSize: 13, marginTop: 8 }}>
          Your mobile number<br />
          <b>{invoice.customerDetails?.phone?.replace('+91', '') || '-'}</b><br />
          has been Register with Suguna Foods
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={handlePrint} style={{ padding: '8px 18px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Print / Download</button>
      </div>
    </>
  );
};

export default InvoicePublicView;
