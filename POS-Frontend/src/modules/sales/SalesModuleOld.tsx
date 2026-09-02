import React, { useState, useEffect } from 'react';
import salesAPI, { Sale } from './salesApi';
import { storeAPI } from '../../api';

interface SalesModuleProps {
  storeId?: string;
}

// ✅ Helper: get storeId safely from localStorage
const getStoreIdFromStorage = (): string | undefined => {
  const id = localStorage.getItem('storeId');
  return id ?? undefined;
};

const SalesModule: React.FC<SalesModuleProps> = ({ storeId }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvedStoreId, setResolvedStoreId] = useState<string | undefined>(
    storeId || getStoreIdFromStorage()
  );
  const [filter, setFilter] = useState<'all' | 'today' | 'cash' | 'card' | 'UPI' | 'date' | 'day'>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [stores, setStores] = useState<Array<{ _id: string; storeName: string; storeId?: string }>>([]);
  const [adminSelectedStoreId, setAdminSelectedStoreId] = useState<string>('');

  //const [selectedStore, setSelectedStore] = useState<string | undefined>(storeId || getStoreIdFromStorage());
  // ✅ Fetch stores once
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await storeAPI.getAll();
        setStores(response.data || []);
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };
    fetchStores();
  }, []);

  // ✅ Ensure storeId is available (from props or localStorage or API)
  useEffect(() => {
    const ensureStoreId = async () => {
      if (!resolvedStoreId) {
        try {
          const response = await salesAPI.getAll(); // get all sales without store filter
          if (response.data.length > 0 && response.data[0].storeId?.storeId) {
            const id = response.data[0].storeId.storeId;
            localStorage.setItem('storeId', id);
            setResolvedStoreId(id);
          }
        } catch (err) {
          console.error('Error fetching storeId:', err);
        }
      }
    };
    ensureStoreId();
  }, [resolvedStoreId]);

  const fetchSales = async () => {
    try {
      setLoading(true);

      // Determine which store scope to use:
      // - If SalesModule is rendered with a storeId prop (store user), always use it
      // - If org admin selected a store, use that
      // - Otherwise, query all stores (undefined storeId)
      const targetStoreId = storeId ? storeId : (adminSelectedStoreId ? adminSelectedStoreId : undefined);

      let response;

      switch (filter) {
        case 'today':
          response = await salesAPI.getTodaysSales(targetStoreId);
          break;
        case 'cash':
        case 'card':
        case 'UPI':
          response = await salesAPI.getByPaymentMethod(filter, targetStoreId);
          break;
        case 'date':
          if (selectedDate) {
            response = await salesAPI.getByDate(selectedDate, targetStoreId);
          } else {
            setSales([]);
            setError('Please select a date');
            setLoading(false);
            return;
          }
          break;
        case 'day':
          if (selectedDay) {
            response = await salesAPI.getByDay(selectedDay, targetStoreId);
          } else {
            setSales([]);
            setError('Please select a day');
            setLoading(false);
            return;
          }
          break;
        default:
          response = await salesAPI.getAll(targetStoreId);
      }
      const salesData = Array.isArray(response.data) ? response.data.map((sale: Sale) => ({
        ...sale,
        customerDetails: sale.customerDetails || {},
        items: sale.items || [],
        paymentMethod: sale.paymentMethod || 'cash',
        grandTotal: sale.grandTotal || 0,
        subTotal: sale.subTotal || 0,
        gstTotal: sale.gstTotal || 0,
        discountTotal: sale.discountTotal || 0
      })) : [];
      setSales(salesData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sales');
      console.error('Error fetching sales:', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Re-fetch whenever filter, resolvedStoreId, date/day changes
  useEffect(() => {
    fetchSales();
  }, [filter, storeId, selectedDate, selectedDay, adminSelectedStoreId]);

  // Load stores for org admins (no storeId prop)
  useEffect(() => {
    const loadStores = async () => {
      if (!storeId) {
        try {
          const res = await storeAPI.getAll();
          setStores(res.data || []);
        } catch (e) {
          setStores([]);
        }
      }
    };
    loadStores();
  }, [storeId]);

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

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return '#38a169';
      case 'card': return '#3182ce';
      case 'UPI': return '#805ad5';
      default: return '#718096';
    }
  };

  const getPaymentPillStyle = (method: string) => {
    switch (method) {
      case 'UPI':
        return { background: '#22c55e', color: 'white' };
      case 'card':
        return { background: '#dbeafe', color: '#1d4ed8' };
      case 'cash':
      default:
        return { background: '#f1f5f9', color: '#334155' };
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fb',
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading sales data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fb',
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#e53e3e'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
          <div>{error}</div>
          <button
            onClick={fetchSales}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>
            Sales
          </h1>
          <div style={{ color: '#6c6c6c', fontSize: 16 }}>
            View and manage all completed sales transactions
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Org Admin store selector */}
          {!storeId && (
            <select
              value={adminSelectedStoreId}
              onChange={(e) => setAdminSelectedStoreId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s._id} value={s._id}>{s.storeName}{s.storeId ? ` (${s.storeId})` : ''}</option>
              ))}
            </select>
          )}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Sales</option>
            <option value="today">Today's Sales</option>
            <option value="cash">Cash Payments</option>
            <option value="card">Card Payments</option>
            <option value="UPI">UPI Payments</option>
            {/* <option value="date">By Date</option> 
            <option value="day">By Day</option>    */}
          </select>

          {/* Date Picker */}
          {filter === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          )}

          {/* Day Selector */}
          {filter === 'day' && (
            <select
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Day</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          )}

          <button
            onClick={fetchSales}
            style={{
              padding: '8px 16px',
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {sales.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>No sales found</h3>
          <p style={{ color: '#999' }}>
            {filter === 'today' ? "No sales completed today" : "No sales available for the selected filter"}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 0.8fr 1.2fr 1.2fr 1fr',
            background: '#f8f9fa',
            padding: '16px 20px',
            borderBottom: '1px solid #e9ecef',
            fontWeight: '600',
            fontSize: '14px',
            color: '#495057'
          }}>
            <div>Transaction ID</div>
            <div>Date & Time</div>
            <div>Items</div>
            <div style={{ textAlign: 'center' }}>Payment Method</div>
            <div>Customer</div>
            <div style={{ textAlign: 'right' }}>Total Amount</div>
          </div>

          {sales.map((sale, index) => (
            <div
              key={sale._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 0.8fr 1.2fr 1.2fr 1fr',
                padding: '16px 20px',
                borderBottom: '1px solid #f1f3f4',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                alignItems: 'center',
                background: index % 2 === 0 ? 'white' : '#fcfcfd'
              }}
              onClick={() => setSelectedSale(sale)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fcfcfd';
              }}
            >
              <div style={{ fontWeight: '500', color: '#e53e3e' }}>
                {sale.transactionId || 'N/A'}
              </div>
              <div style={{ color: '#666', fontSize: 13, lineHeight: 1.2 }}>
                <div>{new Date(sale.dateTime || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style={{ fontSize: 12, color: '#9aa0a6' }}>{new Date(sale.dateTime || '').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ color: '#666' }}>
                {(sale.items || []).length} item{(sale.items || []).length !== 1 ? 's' : ''}
              </div>
              {(() => {
                const method = sale.paymentMethod || 'cash';
                const pill = getPaymentPillStyle(method);
                return (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6,
                    color: pill.color,
                    background: pill.background,
                    padding: '4px 10px',
                    borderRadius: 999,
                    justifySelf: 'center'
                  }}>
                    <span style={{ fontSize: 12 }}>{getPaymentMethodIcon(method)}</span>
                    <span style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>
                      {method}
                    </span>
                  </div>
                );
              })()}
              <div style={{ color: '#666', fontSize: '13px' }}>
                {sale.customerDetails?.name || 'Walk-in Customer'}
              </div>
              <div style={{ fontWeight: '600', color: '#38a169', textAlign: 'right' }}>
                {formatCurrency(sale.grandTotal || 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
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
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: '#1a1a1a' }}>
                Sale Details - {selectedSale.transactionId || 'N/A'}
              </h2>
              <button
                onClick={() => setSelectedSale(null)}
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

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>Transaction Info</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px'
                }}>
                  <div><strong>Date:</strong> {formatDateTime(selectedSale.dateTime || '')}</div>
                  <div><strong>Payment:</strong> {getPaymentMethodIcon(selectedSale.paymentMethod || 'cash')} {(selectedSale.paymentMethod || 'cash').toUpperCase()}</div>
                  <div><strong>Sub Total:</strong> {formatCurrency(selectedSale.subTotal || 0)}</div>
                  <div><strong>GST:</strong> {formatCurrency(selectedSale.gstTotal || 0)}</div>
                  <div><strong>Discount:</strong> {formatCurrency(selectedSale.discountTotal || 0)}</div>
                  <div><strong>Grand Total:</strong> {formatCurrency(selectedSale.grandTotal || 0)}</div>
                </div>
              </div>

              {selectedSale.customerDetails?.name && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>Customer Details</h3>
                  <div style={{ fontSize: '14px' }}>
                    <div><strong>Name:</strong> {selectedSale.customerDetails.name}</div>
                    {selectedSale.customerDetails.phone && (
                      <div><strong>Phone:</strong> {selectedSale.customerDetails.phone}</div>
                    )}
                    {selectedSale.customerDetails.email && (
                      <div><strong>Email:</strong> {selectedSale.customerDetails.email}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>Items Sold</h3>
                <div style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    background: '#f8f9fa',
                    padding: '12px 16px',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#495057'
                  }}>
                    <div>Item</div>
                    <div>Qty</div>
                    <div>Price</div>
                    <div>GST</div>
                    <div>Total</div>
                  </div>
                  {(selectedSale.items || []).map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                        padding: '12px 16px',
                        borderBottom: index < (selectedSale.items || []).length - 1 ? '1px solid #f1f3f4' : 'none',
                        fontSize: '14px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.itemName || 'Unknown Item'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>SKU: {item.sku || 'N/A'}</div>
                      </div>
                      <div>{item.quantity || 0}</div>
                      <div>{formatCurrency(item.pricePerUnit || 0)}</div>
                      <div>{formatCurrency(item.gst || 0)}</div>
                      <div style={{ fontWeight: '500' }}>{formatCurrency(item.totalAmount || 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;