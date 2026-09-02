import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers,
  FiPackage,
  FiAlertTriangle,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiRefreshCw,
  FiArrowRight,
  FiAlertCircle,
  FiInfo,
  FiLayers
} from 'react-icons/fi';
import { dashboardAPI, ERPOverviewData } from './dashboardApi';
import { normalizeRole } from '../../utils/roleUtils';

interface AdminDashboardProps {
  userRole?: string;
  onNavigate?: (page: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userRole, onNavigate }) => {
  const storedUser = localStorage.getItem('user');
  let currentRole = userRole || localStorage.getItem('userRole') || 'Admin';
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      currentRole = u.role || currentRole;
    } catch (_) {}
  }
  const canonicalRole = normalizeRole(userRole || currentRole);
  const role = canonicalRole.toLowerCase();

  const [data, setData] = useState<ERPOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getERPOverview();
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        setError('Failed to load ERP overview data');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleNav = (targetPage: string) => {
    if (onNavigate) {
      onNavigate(targetPage);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#4a5568' }}>
          <FiRefreshCw size={28} className="spin-animation" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Loading ERP Operations Dashboard...</div>
        </div>
      </div>
    );
  }

  const d = data || {
    customers: { total: 0, active: 0, leads: 0, inactive: 0 },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, totalStockQuantity: 0, estimatedInventoryValue: 0 },
    challans: { total: 0, today: 0, draft: 0, confirmed: 0, cancelled: 0, todayConfirmedAmount: 0 },
    followUps: { due: 0, upcoming: 0 },
    alerts: [],
    lowStockProducts: [],
    recentChallans: [],
    recentStockMovements: [],
    upcomingFollowUps: []
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiLayers size={28} color="#1a2c7f" />
              <h1 style={{ fontWeight: 700, fontSize: 28, color: '#1a1a1a', margin: 0 }}>
                ERP Operations Dashboard
              </h1>
              <span style={{
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                textTransform: 'uppercase'
              }}>
                {currentRole} Mode
              </span>
            </div>
            <div style={{ color: '#6c6c6c', fontSize: 13, marginTop: 4 }}>
              Real-time operational overview across CRM, Inventory, Stock Movements, and Sales Challans
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {role === 'admin' && (
              <button
                onClick={() => handleNav('users')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                <FiUsers size={14} /> User Management
              </button>
            )}
            <button
              onClick={fetchOverview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#4a5568',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14
          }}>
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Operational Alerts Banner */}
        {d.alerts && d.alerts.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Operational Alerts ({d.alerts.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {d.alerts.map(alt => (
                <div
                  key={alt.id}
                  onClick={() => handleNav(alt.actionUrl)}
                  style={{
                    backgroundColor: alt.severity === 'error' ? '#fef2f2' : alt.severity === 'warning' ? '#fffbeb' : '#f0f9ff',
                    border: `1px solid ${alt.severity === 'error' ? '#fecaca' : alt.severity === 'warning' ? '#fde68a' : '#bae6fd'}`,
                    padding: '12px 16px',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {alt.severity === 'error' ? (
                      <FiAlertCircle color="#dc2626" size={18} />
                    ) : alt.severity === 'warning' ? (
                      <FiAlertTriangle color="#d97706" size={18} />
                    ) : (
                      <FiInfo color="#0284c7" size={18} />
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: alt.severity === 'error' ? '#991b1b' : alt.severity === 'warning' ? '#92400e' : '#075985' }}>
                        {alt.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{alt.message}</div>
                    </div>
                  </div>
                  <FiArrowRight size={14} color="#6b7280" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 24,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FiCheckCircle size={16} />
            <span>All operational metrics are within normal parameters. Everything looks good.</span>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          {/* Total Customers */}
          {(role === 'admin' || role === 'sales' || role === 'accounts') && (
            <div
              onClick={() => handleNav('crm-customers')}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Customers</span>
                <FiUsers size={18} color="#3b82f6" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
                {d.customers.total}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{d.customers.active} Active</span> • {d.customers.leads} Leads
              </div>
            </div>
          )}

          {/* Total Products / Inventory */}
          {(role === 'admin' || role === 'warehouse' || role === 'accounts') && (
            <div
              onClick={() => handleNav('product')}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Products</span>
                <FiPackage size={18} color="#8b5cf6" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
                {d.inventory.totalProducts}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {d.inventory.totalStockQuantity} total units in stock
              </div>
            </div>
          )}

          {/* Low Stock Items */}
          {(role === 'admin' || role === 'warehouse') && (
            <div
              onClick={() => handleNav('product')}
              style={{
                background: d.inventory.lowStock > 0 ? '#fffbeb' : '#fff',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: d.inventory.lowStock > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: d.inventory.lowStock > 0 ? '#92400e' : '#64748b', textTransform: 'uppercase' }}>Low Stock</span>
                <FiAlertTriangle size={18} color={d.inventory.lowStock > 0 ? '#d97706' : '#64748b'} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: d.inventory.lowStock > 0 ? '#b45309' : '#0f172a', marginTop: 8 }}>
                {d.inventory.lowStock}
              </div>
              <div style={{ fontSize: 12, color: d.inventory.lowStock > 0 ? '#92400e' : '#64748b', marginTop: 4 }}>
                {d.inventory.outOfStock} items out of stock
              </div>
            </div>
          )}

          {/* Today's Challans */}
          {(role === 'admin' || role === 'sales' || role === 'accounts' || role === 'warehouse') && (
            <div
              onClick={() => handleNav('sales-challans')}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Today's Challans</span>
                <FiFileText size={18} color="#0284c7" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
                {d.challans.today}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {d.challans.draft} Draft • <span style={{ color: '#16a34a', fontWeight: 600 }}>{d.challans.confirmed} Confirmed</span>
              </div>
            </div>
          )}

          {/* Confirmed Operations / Revenue */}
          {(role === 'admin' || role === 'accounts') && (
            <div
              onClick={() => handleNav('sales-challans')}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Today's Confirmed Dispatches</span>
                <FiCheckCircle size={18} color="#16a34a" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a', marginTop: 8 }}>
                ₹{d.challans.todayConfirmedAmount?.toLocaleString('en-IN') || '0'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Estimated Inv Value: ₹{d.inventory.estimatedInventoryValue?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
          )}

          {/* Follow-ups Due */}
          {(role === 'admin' || role === 'sales') && (
            <div
              onClick={() => handleNav('crm-customers')}
              style={{
                background: d.followUps.due > 0 ? '#eff6ff' : '#fff',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: d.followUps.due > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: d.followUps.due > 0 ? '#1e40af' : '#64748b', textTransform: 'uppercase' }}>Follow-ups Due</span>
                <FiClock size={18} color={d.followUps.due > 0 ? '#2563eb' : '#64748b'} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: d.followUps.due > 0 ? '#1d4ed8' : '#0f172a', marginTop: 8 }}>
                {d.followUps.due}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {d.followUps.upcoming} upcoming follow-ups scheduled
              </div>
            </div>
          )}
        </div>

        {/* Operational Lists 2x2 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20 }}>
          {/* Panel 1: Low-Stock Products Table */}
          {(role === 'admin' || role === 'warehouse') && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiAlertTriangle color="#d97706" size={16} />
                  Low Stock Products
                </div>
                <button
                  onClick={() => handleNav('product')}
                  style={{ background: 'none', border: 'none', color: '#1a2c7f', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View Inventory <FiArrowRight size={12} />
                </button>
              </div>

              {d.lowStockProducts && d.lowStockProducts.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px' }}>Product</th>
                        <th style={{ padding: '8px 10px' }}>SKU</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Stock</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Min</th>
                        <th style={{ padding: '8px 10px' }}>Warehouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.lowStockProducts.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{p.productName}</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748b' }}>{p.sku}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: p.currentStock === 0 ? '#dc2626' : '#d97706' }}>
                            {p.currentStock}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{p.minimumStock}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{p.warehouseLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No low-stock products. All inventory levels healthy.
                </div>
              )}
            </div>
          )}

          {/* Panel 2: Recent Sales Challans */}
          {(role === 'admin' || role === 'sales' || role === 'accounts' || role === 'warehouse') && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiFileText color="#1a2c7f" size={16} />
                  Recent Sales Challans
                </div>
                <button
                  onClick={() => handleNav('sales-challans')}
                  style={{ background: 'none', border: 'none', color: '#1a2c7f', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View All Challans <FiArrowRight size={12} />
                </button>
              </div>

              {d.recentChallans && d.recentChallans.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px' }}>Challan #</th>
                        <th style={{ padding: '8px 10px' }}>Customer</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.recentChallans.map(ch => (
                        <tr key={ch.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1a2c7f', fontFamily: 'monospace' }}>
                            {ch.challanNumber}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#0f172a' }}>
                            <div style={{ fontWeight: 600 }}>{ch.customerName}</div>
                            {ch.customerCompany && <div style={{ fontSize: 10, color: '#64748b' }}>{ch.customerCompany}</div>}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              backgroundColor: ch.status === 'CONFIRMED' ? '#dcfce7' : ch.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                              color: ch.status === 'CONFIRMED' ? '#166534' : ch.status === 'CANCELLED' ? '#991b1b' : '#92400e'
                            }}>
                              {ch.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            ₹{ch.totalAmount?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {formatDate(ch.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No recent sales challans recorded.
                </div>
              )}
            </div>
          )}

          {/* Panel 3: Recent Stock Movements Activity */}
          {(role === 'admin' || role === 'warehouse' || role === 'sales' || role === 'accounts') && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiTrendingUp color="#16a34a" size={16} />
                  Recent Stock Movements
                </div>
                <button
                  onClick={() => handleNav('stock-movements')}
                  style={{ background: 'none', border: 'none', color: '#1a2c7f', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View Stock Movements <FiArrowRight size={12} />
                </button>
              </div>

              {d.recentStockMovements && d.recentStockMovements.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px' }}>Product</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Type</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 10px' }}>Reason</th>
                        <th style={{ padding: '8px 10px' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.recentStockMovements.map(sm => (
                        <tr key={sm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                            {sm.productName}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              backgroundColor: sm.movementType === 'IN' ? '#dcfce7' : '#fee2e2',
                              color: sm.movementType === 'IN' ? '#166534' : '#991b1b'
                            }}>
                              {sm.movementType}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                            {sm.quantityChanged}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>
                            {sm.reason} {sm.referenceId ? `(${sm.referenceId})` : ''}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {formatDateTime(sm.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No recent inventory stock movements logged.
                </div>
              )}
            </div>
          )}

          {/* Panel 4: Upcoming Customer Follow-ups */}
          {(role === 'admin' || role === 'sales') && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiClock color="#2563eb" size={16} />
                  Upcoming Customer Follow-ups
                </div>
                <button
                  onClick={() => handleNav('crm-customers')}
                  style={{ background: 'none', border: 'none', color: '#1a2c7f', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View Customers <FiArrowRight size={12} />
                </button>
              </div>

              {d.upcomingFollowUps && d.upcomingFollowUps.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px' }}>Customer</th>
                        <th style={{ padding: '8px 10px' }}>Business</th>
                        <th style={{ padding: '8px 10px' }}>Follow-up Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.upcomingFollowUps.map(f => (
                        <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{f.name}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{f.businessName || '—'}</td>
                          <td style={{ padding: '8px 10px', color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatDate(f.followUpDate)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              backgroundColor: f.status === 'Active' ? '#dcfce7' : f.status === 'Lead' ? '#dbeafe' : '#f1f5f9',
                              color: f.status === 'Active' ? '#166534' : f.status === 'Lead' ? '#1e40af' : '#64748b'
                            }}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No upcoming customer follow-ups scheduled.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
