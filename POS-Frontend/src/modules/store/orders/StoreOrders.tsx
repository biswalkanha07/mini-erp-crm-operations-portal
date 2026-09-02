
import React, { useEffect, useState } from 'react';
import InvoiceView from '../../../components/InvoiceView';
import { orderAPI } from '../../../api/orderApi';
import { getCatalogues } from '../../inventory/catalogue/catalogueApi';
import { Catalogue } from '../../inventory/catalogue/types';


const StoreOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogue, setCatalogue] = useState<Catalogue[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderModal, setOrderModal] = useState<{ item: Catalogue; quantity: number } | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ invoice: any } | null>(null);

  useEffect(() => {
    fetchCatalogue();
    fetchOrders();
  }, []);

  const fetchCatalogue = async () => {
    try {
      const res = await getCatalogues();
      setCatalogue(res.data.filter((item: Catalogue) => item.status === 'active'));
    } catch (err) {
      setCatalogue([]);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = (item: Catalogue) => {
    setOrderModal({ item, quantity: 1 });
  };

  const handleOrderModalSubmit = async () => {
    if (!orderModal) return;
    const { item, quantity } = orderModal;
    if (!quantity || isNaN(quantity) || quantity < 1) {
      alert('Invalid quantity');
      return;
    }
    setPlacingOrder(true);
    try {
      await orderAPI.createOrder({ items: [{ sku: item.sku, itemName: item.itemName, quantity }] });
      fetchOrders();
      setOrderModal(null);
      alert('Order placed!');
    } catch (err) {
      alert('Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Catalogue Items</h2>
      {catalogue.length === 0 ? (
        <div>No catalogue items available.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginBottom: 32, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f6fa' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Image</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Item Name</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>SKU</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Price</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600, color: '#333' }}>Order</th>
              </tr>
            </thead>
            <tbody>
              {catalogue.map((item, idx) => (
                <tr key={item.sku} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail.startsWith('data:image') ? item.thumbnail : `http://localhost:5000${item.thumbnail}`} alt={item.itemName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
                    ) : item.images && item.images.length > 0 ? (
                      <img src={item.images[0].startsWith('data:image') ? item.images[0] : `http://localhost:5000${item.images[0]}`} alt={item.itemName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, backgroundColor: '#f5f5f5', borderRadius: 6, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>No Image</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{item.itemName}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{item.sku}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{item.price}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOrder(item)}
                      disabled={placingOrder}
                      style={{ padding: '6px 18px', background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 14, boxShadow: '0 1px 2px #eee' }}
                    >
                      Order
                    </button>
                  </td>
      {/* Order Quantity Modal */}
      {orderModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: '0 2px 16px #0002', position: 'relative', backdropFilter: 'blur(2px)' }}>
            <button onClick={() => setOrderModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            <h3 style={{ marginBottom: 16 }}>Order: {orderModal.item.itemName}</h3>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="order-quantity" style={{ fontWeight: 500 }}>Enter quantity:</label>
              <input
                id="order-quantity"
                type="number"
                min={1}
                value={orderModal.quantity}
                onChange={e => setOrderModal({ ...orderModal, quantity: parseInt(e.target.value, 10) || 1 })}
                style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', width: 80 }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setOrderModal(null)}
                style={{ padding: '8px 18px', background: '#eee', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                disabled={placingOrder}
              >Cancel</button>
              <button
                onClick={handleOrderModalSubmit}
                style={{ padding: '8px 18px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                disabled={placingOrder}
              >Place Order</button>
            </div>
          </div>
        </div>
      )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h3 style={{ marginTop: 40 }}>My Orders</h3>
      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginTop: 12 }}>
          <thead style={{ background: '#f5f6fa' }}>
            <tr>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Thumbnail</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>Item Name</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'left', fontWeight: 600, color: '#333' }}>SKU</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 600, color: '#333' }}>Quantity</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600, color: '#333' }}>Status</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600, color: '#333' }}>Created</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600, color: '#333' }}>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {orders.flatMap(order =>
              order.items.map((item: any, idx: number) => (
                <tr key={order._id + '-' + idx} style={{ background: '#fff' }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    {(() => {
                      const cat = catalogue.find(c => c.sku === item.sku);
                      if (cat && cat.thumbnail) {
                        return <img src={cat.thumbnail.startsWith('data:image') ? cat.thumbnail : `http://localhost:5000${cat.thumbnail}`} alt={item.itemName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />;
                      } else if (cat && cat.images && cat.images.length > 0) {
                        return <img src={cat.images[0].startsWith('data:image') ? cat.images[0] : `http://localhost:5000${cat.images[0]}`} alt={item.itemName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />;
                      } else {
                        return <div style={{ width: 40, height: 40, backgroundColor: '#f5f5f5', borderRadius: 6, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>No Image</div>;
                      }
                    })()}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{item.itemName}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{item.sku}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>{order.status}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>{new Date(order.createdAt).toLocaleString()}</td>
                  {idx === 0 && (
                    <td rowSpan={order.items.length} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', verticalAlign: 'middle' }}>
                      {order.invoice ? (
                        <button
                          onClick={() => setInvoiceModal({ invoice: order.invoice })}
                          style={{ padding: '6px 14px', background: '#f6ad55', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                        >View Invoice</button>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: 13 }}>No Invoice</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
      {/* Invoice Modal */}
      {invoiceModal && (
        <InvoiceView invoice={invoiceModal.invoice} onClose={() => setInvoiceModal(null)} />
      )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StoreOrders;
