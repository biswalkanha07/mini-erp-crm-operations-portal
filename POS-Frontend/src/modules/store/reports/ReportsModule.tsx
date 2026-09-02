import React, { useEffect, useState, ChangeEvent } from 'react';
import { FiUsers, FiShoppingBag, FiDollarSign, FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getCustomerReports, getCustomerReportsByDateRange } from './reportsApi';
import { CustomerReport, CustomerReportsResponse } from './types';

interface ReportsModuleProps {
  storeId?: string;
}

const ReportsModule: React.FC<ReportsModuleProps> = ({ storeId }) => {
  const [reports, setReports] = useState<CustomerReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch reports with searchTerm and date range
  // Use Axios-based API functions for fetching reports (handles auth/cookies)
  const fetchReports = async (searchValue: string = searchTerm) => {
    if (!storeId) return;
    setLoading(true);
    try {
      let data: CustomerReportsResponse;
      if (dateRange.startDate && dateRange.endDate) {
        // Pass searchTerm to getCustomerReportsByDateRange if present
        data = await getCustomerReportsByDateRange(storeId, dateRange.startDate, dateRange.endDate, searchValue);
      } else {
        data = await getCustomerReports(storeId, searchValue);
      }
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReports(searchTerm);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm, dateRange, storeId]);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
    setSearchTerm(event.target.value);
  }

  const handleDateRangeApply = () => {
    fetchReports();
    setShowDateFilter(false);
  };

  const handleClearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    setShowDateFilter(false);
  };

  const exportToCSV = () => {
    if (!reports || !reports.customers.length) return;

    const headers = ['Customer Name', 'Phone', 'Total Visits', 'Total Purchases', 'Total Spent', 'Average Order Value', 'First Visit', 'Last Visit'];
    const csvContent = [
      headers.join(','),
      ...reports.customers.map(customer => [
        customer.name || 'N/A',
        customer.phone || 'N/A',
        customer.totalVisits,
        customer.totalPurchases,
        `₹${customer.totalSpent.toFixed(2)}`,
        `₹${customer.averageOrderValue.toFixed(2)}`,
        new Date(customer.firstVisit).toLocaleDateString(),
        new Date(customer.lastVisit).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!storeId) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6c6c6c' }}>
          <h2>Access Denied</h2>
          <p>Store ID is required to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>Customer Reports</h1>
            <div style={{ color: '#6c6c6c', fontSize: 16 }}>View customer analytics and purchase patterns</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Search Field left to Date Filter */}
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name or phone ..."
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                width: 225,
                outline: 'none',
                marginRight: 8
              }}
            />
            <button 
              style={{ 
                padding: '10px 20px', 
                background: showDateFilter ? '#e53e3e' : '#fff', 
                color: showDateFilter ? '#fff' : '#7c4dff',
                border: '2px solid #7c4dff', 
                borderRadius: 8, 
                fontWeight: 600, 
                fontSize: 14, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }} 
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <FiCalendar size={16} />
              Date Filter
            </button>
            <button 
              style={{ 
                padding: '10px 20px', 
                background: '#28a745', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 600, 
                fontSize: 14, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }} 
              onClick={exportToCSV}
              disabled={!reports || !reports.customers.length}
            >
              <FiDownload size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Filter */}
        {showDateFilter && (
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            boxShadow: '0 2px 12px #e6e6e6', 
            padding: 24, 
            marginBottom: 24 
          }}>
            <h3 style={{ marginBottom: 16, color: '#1a1a1a' }}>Filter by Date Range</h3>
            <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #ddd', 
                    borderRadius: 6, 
                    fontSize: 14 
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #ddd', 
                    borderRadius: 6, 
                    fontSize: 14 
                  }}
                />
              </div>
              <button
                onClick={handleDateRangeApply}
                style={{ 
                  padding: '8px 16px', 
                  background: '#7c4dff', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  cursor: 'pointer' 
                }}
              >
                Apply
              </button>
              <button
                onClick={handleClearDateRange}
                style={{ 
                  padding: '8px 16px', 
                  background: '#6c757d', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  cursor: 'pointer' 
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}


        {/* Summary Cards */}
        {reports && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 24 }}>
            <div style={{ 
              background: '#fff', 
              borderRadius: 12, 
              boxShadow: '0 2px 12px #e6e6e6', 
              padding: 24,
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  background: '#e3f2fd', 
                  padding: 12, 
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiUsers size={24} color="#1976d2" />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#6c6c6c', marginBottom: 4 }}>Total Customers</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{reports.totalCustomers}</div>
                </div>
              </div>
            </div>

            <div style={{ 
              background: '#fff', 
              borderRadius: 12, 
              boxShadow: '0 2px 12px #e6e6e6', 
              padding: 24,
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  background: '#f3e5f5', 
                  padding: 12, 
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiShoppingBag size={24} color="#7b1fa2" />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#6c6c6c', marginBottom: 4 }}>Total Visits</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{reports.totalVisits}</div>
                </div>
              </div>
            </div>

            <div style={{ 
              background: '#fff', 
              borderRadius: 12, 
              boxShadow: '0 2px 12px #e6e6e6', 
              padding: 24,
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  background: '#e8f5e8', 
                  padding: 12, 
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiDollarSign size={24} color="#2e7d32" />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#6c6c6c', marginBottom: 4 }}>Total Revenue</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>₹{reports.totalRevenue.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', padding: 0 }}>
          <div style={{ padding: '24px 24px 0 24px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#1a1a1a' }}>Customer Details</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6c6c6c' }}>
              <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #e0e0e0', borderTop: '3px solid #7c4dff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ marginTop: 16 }}>Loading customer reports...</div>
            </div>
          ) : reports && reports.customers.length > 0 ? (
            <div style={{ width: '100%', height: 600, overflowY: 'auto', borderRadius: '0 0 12px 12px' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 13, letterSpacing: 0.2, position: 'sticky', top: 0 }}>
                    <th style={{ padding: 16, textAlign: 'left', width: 200 }}>Customer Name</th>
                    <th style={{ padding: 16, textAlign: 'left', width: 140 }}>Phone</th>
                    <th style={{ padding: 16, textAlign: 'center', width: 100 }}>Visits</th>
                    <th style={{ padding: 16, textAlign: 'center', width: 100 }}>Purchases</th>
                    <th style={{ padding: 16, textAlign: 'right', width: 120 }}>Total Spent</th>
                    <th style={{ padding: 16, textAlign: 'right', width: 120 }}>Avg Order</th>
                    <th style={{ padding: 16, textAlign: 'center', width: 120 }}>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.customers.map((customer) => (
                    <tr key={customer._id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
                      <td style={{ padding: 16, color: '#111827', fontWeight: 500 }}>
                        {customer.name || 'Anonymous Customer'}
                      </td>
                      <td style={{ padding: 16, color: '#6b7280' }}>
                        {customer.phone || 'N/A'}
                      </td>
                      <td style={{ padding: 16, textAlign: 'center', color: '#111827', fontWeight: 600 }}>
                        {customer.totalVisits}
                      </td>
                      <td style={{ padding: 16, textAlign: 'center', color: '#111827', fontWeight: 600 }}>
                        {customer.totalPurchases}
                      </td>
                      <td style={{ padding: 16, textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                        ₹{customer.totalSpent.toFixed(2)}
                      </td>
                      <td style={{ padding: 16, textAlign: 'right', color: '#6b7280' }}>
                        ₹{customer.averageOrderValue.toFixed(2)}
                      </td>
                      <td style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
                        {new Date(customer.lastVisit).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: '#6c6c6c' }}>
              <FiUsers size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <h3 style={{ marginBottom: 8 }}>No Customer Data</h3>
              <p>No customer reports found for the selected period.</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReportsModule;
