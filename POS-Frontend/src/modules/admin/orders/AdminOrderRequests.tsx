import React, { useEffect, useState } from 'react';
import { orderAPI } from '../../../api/orderApi';
import InvoiceView from '../../../components/InvoiceView';
import axios from 'axios';

const AdminOrderRequests: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceModal, setInvoiceModal] = useState<{ invoice: any } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAllOrders(statusFilter);
      setOrders(res.data);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await orderAPI.updateOrderStatus(id, { status });
    fetchOrders();
  };

  const handleShowInvoice = async (order: any) => {
    if (order.invoiceId && !order.invoice) {
      // Fetch store order invoice from backend (use backend base URL and auth token)
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`https://apis.pos.hutechsolutions.in/api/store-order-invoices/${order.invoiceId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        setInvoiceModal({ invoice: res.data });
      } catch (err) {
        alert('Failed to fetch invoice');
      }
    } else if (order.invoice) {
      setInvoiceModal({ invoice: order.invoice });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Order Requests</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Status Filter: </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginBottom: 32, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f6fa' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Store</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Items</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Status</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Created</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600, color: '#333' }}>Invoice</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600, color: '#333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={order._id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{order.storeId?.storeName || order.storeId}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx}>{item.itemName} x {item.quantity}</div>
                    ))}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', textTransform: 'capitalize' }}>{order.status}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>{new Date(order.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                    {order.invoiceId ? (
                      <button onClick={() => handleShowInvoice(order)} style={{ padding: '6px 14px', background: '#f6ad55', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>View Invoice</button>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: 13 }}>No Invoice</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusChange(order._id, 'approved')} style={{ marginRight: 8, padding: '6px 14px', background: '#38a169', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Approve</button>
                        <button onClick={() => handleStatusChange(order._id, 'rejected')} style={{ padding: '6px 14px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Reject</button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <button onClick={() => handleStatusChange(order._id, 'fulfilled')} style={{ padding: '6px 14px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Mark Fulfilled</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {invoiceModal && (
        <InvoiceView invoice={invoiceModal.invoice} onClose={() => setInvoiceModal(null)} />
      )}
    </div>
  );
};

export default AdminOrderRequests;
