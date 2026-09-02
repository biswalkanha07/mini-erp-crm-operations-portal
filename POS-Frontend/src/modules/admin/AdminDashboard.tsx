import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { dashboardAPI } from './dashboardApi';
import axios from 'axios';
import { getCustomerReports } from '../store/reports/reportsApi';

interface DashboardStats {
  todaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  outOfStockProducts: number;
  totalCustomers: number;
  monthlyProfit: number;
}

interface SalesData {
  month: string;
  sales: number;
  transactions: number;
}

interface ProductData {
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
}

const AdminDashboard: React.FC = () => {
  const [salesByStore, setSalesByStore] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    thisWeekSales: 0,
    thisMonthSales: 0,
    outOfStockProducts: 0,
    totalCustomers: 0,
    monthlyProfit: 0
  });
  const [allCustomersCount, setAllCustomersCount] = useState<number | null>(null);
  const [monthlySalesData, setMonthlySalesData] = useState<SalesData[]>([]);
  const [mostSoldProducts, setMostSoldProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchDashboardData();
    fetchSalesByStore();
    fetchAllCustomersCount();
  }, []);

  const fetchAllCustomersCount = async () => {
    try {
      // Get all stores
      const storesRes = await axios.get('https://apis.pos.hutechsolutions.in/api/stores');
      const stores = storesRes.data?.data || storesRes.data;
      if (!Array.isArray(stores)) return setAllCustomersCount(0);
      let total = 0;
      for (const store of stores) {
        try {
          const report = await getCustomerReports(store._id);
          total += report.totalCustomers || 0;
        } catch (e) {}
      }
      setAllCustomersCount(total);
    } catch (e) {
      setAllCustomersCount(0);
    }
  };

  const fetchSalesByStore = async () => {
    try {
      const res = await dashboardAPI.getSalesByStore();
      setSalesByStore(res.data);
    } catch (err) {
      setSalesByStore([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, salesResponse, productsResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getMonthlySales(),
        dashboardAPI.getMostSoldProducts()
      ]);

      console.log('Dashboard API Responses:', {
        stats: statsResponse.data,
        monthlySales: salesResponse.data,
        mostSoldProducts: productsResponse.data
      });
      
      setStats(statsResponse.data);
      setMonthlySalesData(salesResponse.data);
      setMostSoldProducts(productsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f6fa', 
      padding: '16px',
      fontFamily: 'Arial, sans-serif',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#333',
          margin: 0
        }}>
          Admin Dashboard
        </h1>
        <button
          onClick={fetchDashboardData}
          style={{
            padding: '8px 16px',
            background: '#6c3fc5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '12px',
        marginBottom: '24px',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Today Sales */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: '90px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Today Sales</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {loading ? '...' : formatCurrency(stats.todaySales)}
              </div>
            </div>
            <div style={{ fontSize: '24px' }}>📊</div>
          </div>
        </div>

        {/* This Week Sales */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: '90px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>This Week Sales</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {loading ? '...' : formatCurrency(stats.thisWeekSales)}
              </div>
            </div>
            <div style={{ fontSize: '24px' }}>📈</div>
          </div>
        </div>

        {/* This Month Sales */}
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: '90px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>This Month Sales</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {loading ? '...' : formatCurrency(stats.thisMonthSales)}
              </div>
            </div>
            <div style={{ fontSize: '24px' }}>💰</div>
          </div>
        </div>

        {/* Out of Stock Products */}
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          padding: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: '90px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Out of Stock</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {loading ? '...' : stats.outOfStockProducts}
              </div>
            </div>
            <div style={{ fontSize: '24px' }}>📦</div>
          </div>
        </div>

        {/* Total Customers (all stores) */}
        <div style={{
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          color: '#333',
          padding: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minHeight: '90px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>Total Customers (All Stores)</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {allCustomersCount === null ? '...' : allCustomersCount}
              </div>
            </div>
            <div style={{ fontSize: '24px' }}>👥</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px',
        marginBottom: '16px',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Sales Per Store Bar Chart */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          minHeight: '350px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0, marginBottom: '16px' }}>
            Sales Per Store
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {salesByStore.length === 0 ? (
              <div style={{ color: '#dc3545', fontWeight: 500, textAlign: 'center', marginTop: '40px' }}>No Data Available</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesByStore} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="storeName" tick={false} axisLine={false} />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="totalSales" fill="#8884d8" name="Total Sales" />
                  <Bar dataKey="transactionCount" fill="#82ca9d" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {/* Monthly Sales Panel */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#333',
              margin: 0
            }}>
              Monthly Sales
            </h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button style={{
                padding: '4px 8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}>
                🔄
              </button>
              <button style={{
                padding: '4px 8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}>
                📊
              </button>
              <button style={{
                padding: '4px 8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}>
                📋
              </button>
              <button style={{
                padding: '4px 8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}>
                🔽
              </button>
            </div>
          </div>
          
          <div style={{ 
            height: '250px', 
            overflowY: 'auto',
            padding: '8px'
          }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                color: '#6c757d',
                fontSize: '16px'
              }}>
                Loading...
              </div>
            ) : monthlySalesData.length > 0 ? (
              <div>
                {monthlySalesData.map((month, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: '8px',
                    background: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>{month.month}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {month.transactions} transactions
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>
                        {formatCurrency(month.sales)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                color: '#dc3545',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                No Data Available
                
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Most Sold Products Panel */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#333',
            margin: 0
          }}>
            Most Sold Products
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button style={{
              padding: '4px 8px',
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              whiteSpace: 'nowrap'
            }}>
              🔄
            </button>
            <button style={{
              padding: '4px 8px',
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              whiteSpace: 'nowrap'
            }}>
              📊
            </button>
            <button style={{
              padding: '4px 8px',
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              whiteSpace: 'nowrap'
            }}>
              📋
            </button>
            <button style={{
              padding: '4px 8px',
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              whiteSpace: 'nowrap'
            }}>
              🔽
            </button>
          </div>
        </div>
        
        <div style={{ 
          height: '250px', 
          overflowY: 'auto',
          padding: '8px'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6c757d',
              fontSize: '16px'
            }}>
              Loading...
            </div>
          ) : mostSoldProducts.length > 0 ? (
            <div>
              {mostSoldProducts.map((product, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  background: index % 2 === 0 ? '#f8f9fa' : 'white',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                      {product.productName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      SKU: {product.sku} • Qty: {product.quantitySold}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#dc3545',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              No Data Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
