import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { storeDashboardAPI } from './storeDashboardApi';
import { getCustomerReports } from './reports/reportsApi';

interface StoreDashboardProps {
  storeId?: string;
}

interface StoreStats {
  todaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  outOfStockProducts: number;
  totalCustomers: number;
}

interface SalesPoint {
  label: string;
  value: number;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(amount || 0);

const StoreDashboard: React.FC<StoreDashboardProps> = ({ storeId }) => {
  const [stats, setStats] = useState<StoreStats>({
    todaySales: 0,
    thisWeekSales: 0,
    thisMonthSales: 0,
    outOfStockProducts: 0,
    totalCustomers: 0
  });
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [monthlySales, setMonthlySales] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentSplit, setPaymentSplit] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const canQuery = Boolean(storeId);

  const fetchAll = async () => {
    if (!canQuery) return;
    try {
      setLoading(true);
      const [statsRes, monthlyRes, paymentRes, topRes, customerRes] = await Promise.all([
        storeDashboardAPI.getStats(storeId!),
        storeDashboardAPI.getMonthlySales(storeId!),
        storeDashboardAPI.getPaymentSplit(storeId!),
        storeDashboardAPI.getTopProducts(storeId!),
        getCustomerReports(storeId!)
      ]);
      setStats(statsRes.data || stats);
      setMonthlySales(monthlyRes.data || []);
      setPaymentSplit(paymentRes.data || []);
      setTopProducts(topRes.data || []);
      setCustomerCount(customerRes.totalCustomers ?? null);
    } catch (err) {
      setStats(prev => ({ ...prev }));
      setMonthlySales([]);
      setCustomerCount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const salesChartData = useMemo(() => (
    (monthlySales || []).map(p => ({ name: p.label, Sales: p.value }))
  ), [monthlySales]);

  const paymentChartData = useMemo(() => (
    (paymentSplit || []).map(p => ({ name: p.method || 'Other', value: p.total || 0 }))
  ), [paymentSplit]);

  const COLORS = ['#6c3fc5', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', padding: 16, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#333' }}>Store Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {storeId && (
            <span style={{ background: '#edf2ff', color: '#2d3a8c', border: '1px solid #cdd4ff', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Store ID: {storeId}</span>
          )}
          <button onClick={fetchAll} style={{ padding: '8px 16px', background: '#6c3fc5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>🔄 Refresh</button>
        </div>
      </div>

      {/* Stats (responsive) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
        <div style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
          border: '1px solid #f472b6',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 6px 16px rgba(244, 114, 182, 0.16)'
        }}>
          <div style={{ color: '#be185d', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>⚡ Today Sales</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#831843' }}>{formatCurrency(stats.todaySales)}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #60a5fa',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 6px 16px rgba(96, 165, 250, 0.16)'
        }}>
          <div style={{ color: '#1e40af', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📅 This Week</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#1e3a8a' }}>{formatCurrency(stats.thisWeekSales)}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '1px solid #34d399',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 6px 16px rgba(52, 211, 153, 0.16)'
        }}>
          <div style={{ color: '#065f46', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📈 This Month</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#064e3b' }}>{formatCurrency(stats.thisMonthSales)}</div>
        </div>
        {/* Out of stock card temporarily hidden per request */}
        {false && (
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1px solid #fb923c',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 6px 16px rgba(251, 146, 60, 0.16)'
          }}>
            <div style={{ color: '#9a3412', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>⚠️ Out of stock</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#7c2d12' }}>{stats.outOfStockProducts}</div>
          </div>
        )}
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          border: '1px solid #a78bfa',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 6px 16px rgba(167, 139, 250, 0.16)'
        }}>
          <div style={{ color: '#5b21b6', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🧑‍🤝‍🧑 Total Customers</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#4c1d95' }}>{customerCount !== null ? customerCount : '...'}</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', height: 380, border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 800, color: '#333' }}>Monthly Sales</div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesChartData} barCategoryGap={20} barGap={4} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickMargin={8} />
            <YAxis tickMargin={8} />
            <Tooltip />
            <Bar dataKey="Sales" fill="#6c3fc5" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary row: Payment split + Top products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', border: '1px solid #eee', minHeight: 360 }}>
          <div style={{ fontWeight: 800, color: '#333', marginBottom: 8 }}>Payment Method Split</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={paymentChartData} dataKey="value" nameKey="name" outerRadius={110} label>
                {paymentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>
          <div style={{ fontWeight: 800, color: '#333', marginBottom: 12 }}>Top Products</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {topProducts.map((p, i) => (
              <div key={p.sku || i} style={{ background: '#f9fafb', border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>#{i + 1} • {p.sku}</div>
                <div style={{ fontWeight: 800, color: '#111827', marginTop: 4, minHeight: 20 }}>{p.itemName || '-'}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <div style={{ color: '#6c3fc5', fontWeight: 700 }}>{p.quantity} pcs</div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div style={{ color: '#6b7280', fontSize: 13 }}>No data available.</div>
            )}
          </div>
        </div>
      </div>

      {!canQuery && (
        <div style={{ marginTop: 16, color: '#c53030', fontSize: 13 }}>No store selected. Please log in as a store user.</div>
      )}
    </div>
  );
};

export default StoreDashboard;


