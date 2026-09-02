import React, { useState, useEffect, useCallback } from 'react';
import salesAPI from './salesApi';
import { storeAPI } from '../../api';

interface SalesModuleProps {
  storeId?: string;
}

interface SearchFilters {
  searchTerm: string; // Combined search for both name and phone
  paymentMethod: string;
  startDate: string;
  endDate: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const SalesModuleAdvanced: React.FC<SalesModuleProps> = ({ storeId }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stores, setStores] = useState<Array<{ _id: string; storeName: string; storeId?: string }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(storeId || '');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Search and Filter State
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    sortField: 'dateTime',
    sortOrder: 'desc'
  });

  // Pagination State
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    recordsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load stores for org admins
  useEffect(() => {
    const loadStores = async () => {
      if (!storeId) {
        try {
          const res = await storeAPI.getAll();
          setStores(res.data || []);
        } catch (e) {
          console.error('Error loading stores:', e);
          setStores([]);
        }
      }
    };
    loadStores();
  }, [storeId]);

  // Advanced search function
  const fetchTransactions = useCallback(async (page = 1, resetFilters = false) => {
    try {
      setLoading(true);
      setError('');

      const searchParams = {
        ...filters,
        storeId: storeId || selectedStoreId,
        page,
        limit: pagination.recordsPerPage
      };

      // Reset filters if requested
      if (resetFilters) {
        searchParams.searchTerm = '';
        searchParams.paymentMethod = '';
        searchParams.startDate = '';
        searchParams.endDate = '';
      }

      const response = await salesAPI.advancedSearch(searchParams);

      if (response.data.success) {
        setTransactions(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, storeId, selectedStoreId, pagination.recordsPerPage]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Auto-search when searchTerm changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm !== undefined) {
        fetchTransactions(1);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm, filters.paymentMethod, selectedStoreId]);

  // Handle filter changes
  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      sortField: 'dateTime',
      sortOrder: 'desc'
    });
    fetchTransactions(1, true);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage);
    }
  };

  // Handle sort change
  const handleSort = (field: string) => {
    const newOrder = filters.sortField === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({ ...prev, sortField: field, sortOrder: newOrder }));
    setTimeout(() => fetchTransactions(1), 100);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
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

  // Payment method styling
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'UPI': return '📱';
      default: return '💰';
    }
  };

  const getPaymentPillStyle = (method: string) => {
    switch (method) {
      case 'UPI': return { background: '#22c55e', color: 'white' };
      case 'card': return { background: '#dbeafe', color: '#1d4ed8' };
      case 'cash':
      default: return { background: '#f1f5f9', color: '#334155' };
    }
  };

  const getSortIcon = (field: string) => {
    if (filters.sortField !== field) return '↕️';
    return filters.sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading && transactions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>
            Sales Transactions
          </h1>
          <div style={{ color: '#6c6c6c', fontSize: 16 }}>
            Advanced search, filter, and manage all sales transactions
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 24, marginBottom: 24 }}>
        {/* Quick Search Row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 300 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#374151' }}>
              🔍 Search Customer Name or Phone Number
            </label>
            <input
              type="text"
              placeholder="Search by customer name or phone number..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              style={{
                width: '40%',
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: 14,
                background: '#fdfdfd'
              }}
            />
          </div>

          <div style={{ minWidth: 140 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#374151' }}>
              Payment Method
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {!storeId && (
            <div style={{ minWidth: 180 }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#374151' }}>
                Store
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: 14,
                  background: 'white'
                }}
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store._id} value={store._id}>
                    {store.storeName} {store.storeId && `(${store.storeId})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                padding: '10px 16px',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {showAdvancedFilters ? '🔽' : '🔼'} More Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#374151' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#374151' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#374151' }}>
                  Records per page
                </label>
                <select
                  value={pagination.recordsPerPage}
                  onChange={(e) => {
                    setPagination(prev => ({ ...prev, recordsPerPage: Number(e.target.value) }));
                    setTimeout(() => fetchTransactions(1), 100);
                  }}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                onClick={handleClearFilters}
                style={{
                  padding: '10px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>
          Showing {transactions.length} of {pagination.totalRecords} transactions
          {pagination.totalPages > 0 && (
            <span> (Page {pagination.currentPage} of {pagination.totalPages})</span>
          )}
        </div>
        
        {error && (
          <div style={{ color: '#dc2626', fontSize: 14, background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {transactions.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ color: '#666', marginBottom: '8px' }}>No transactions found</h3>
            <p style={{ color: '#999' }}>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1.2fr 1fr 1fr 1.2fr 1fr 0.5fr',
              background: '#f8f9fa',
              padding: '16px 20px',
              borderBottom: '1px solid #e9ecef',
              fontWeight: '600',
              fontSize: '14px',
              color: '#495057'
            }}>
              <div 
                onClick={() => handleSort('transactionId')} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Transaction ID {getSortIcon('transactionId')}
              </div>
              <div 
                onClick={() => handleSort('dateTime')} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Date & Time {getSortIcon('dateTime')}
              </div>
              <div 
                onClick={() => handleSort('customerDetails.name')} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Customer {getSortIcon('customerDetails.name')}
              </div>
              <div>Phone</div>
              <div>Payment</div>
              <div 
                onClick={() => handleSort('grandTotal')} 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}
              >
                Amount {getSortIcon('grandTotal')}
              </div>
              <div style={{ textAlign: 'center' }}>Items</div>
            </div>

            {/* Table Rows */}
            {transactions.map((transaction, index) => (
              <div
                key={transaction._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1.2fr 1fr 1fr 1.2fr 1fr 0.5fr',
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f3f4',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  alignItems: 'center',
                  background: index % 2 === 0 ? 'white' : '#fcfcfd'
                }}
                onClick={() => setSelectedTransaction(transaction)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fcfcfd';
                }}
              >
                <div style={{ fontWeight: '500', color: '#3b82f6' }}>
                  {transaction.transactionId}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>
                  {formatDateTime(transaction.dateTime)}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>
                  {transaction.customerName}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>
                  {transaction.phoneNumber || '-'}
                </div>
                <div>
                  {(() => {
                    const pill = getPaymentPillStyle(transaction.paymentMethod);
                    return (
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 6,
                        color: pill.color,
                        background: pill.background,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        <span>{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                        <span>{transaction.paymentMethod.toUpperCase()}</span>
                      </div>
                    );
                  })()}
                </div>
                <div style={{ fontWeight: '600', color: '#16a34a', textAlign: 'right' }}>
                  {formatCurrency(transaction.amount)}
                </div>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  {transaction.itemsCount}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 }}>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            style={{
              padding: '8px 12px',
              background: pagination.hasPrevPage ? 'white' : '#f3f4f6',
              color: pagination.hasPrevPage ? '#374151' : '#9ca3af',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
              fontSize: 14
            }}
          >
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + Math.max(1, pagination.currentPage - 2);
              if (pageNum > pagination.totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    padding: '8px 12px',
                    background: pageNum === pagination.currentPage ? '#3b82f6' : 'white',
                    color: pageNum === pagination.currentPage ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 14,
                    minWidth: 40
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            style={{
              padding: '8px 12px',
              background: pagination.hasNextPage ? 'white' : '#f3f4f6',
              color: pagination.hasNextPage ? '#374151' : '#9ca3af',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
              fontSize: 14
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
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
            maxWidth: '700px',
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
                Transaction Details - {selectedTransaction.transactionId}
              </h2>
              <button
                onClick={() => setSelectedTransaction(null)}
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
                  <div><strong>Date:</strong> {formatDateTime(selectedTransaction.dateTime)}</div>
                  <div><strong>Payment:</strong> {getPaymentMethodIcon(selectedTransaction.paymentMethod)} {selectedTransaction.paymentMethod.toUpperCase()}</div>
                  <div><strong>Store:</strong> {selectedTransaction.storeName}</div>
                  <div><strong>Cashier:</strong> {selectedTransaction.cashier}</div>
                  <div><strong>Sub Total:</strong> {formatCurrency(selectedTransaction.subTotal || 0)}</div>
                  <div><strong>GST:</strong> {formatCurrency(selectedTransaction.gstTotal || 0)}</div>
                  <div><strong>Discount:</strong> {formatCurrency(selectedTransaction.discountTotal || 0)}</div>
                  <div><strong>Grand Total:</strong> {formatCurrency(selectedTransaction.amount)}</div>
                </div>
              </div>

              {selectedTransaction.customerDetails?.name && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>Customer Details</h3>
                  <div style={{ fontSize: '14px' }}>
                    <div><strong>Name:</strong> {selectedTransaction.customerDetails.name}</div>
                    {selectedTransaction.customerDetails.phone && (
                      <div><strong>Phone:</strong> {selectedTransaction.customerDetails.phone}</div>
                    )}
                    {selectedTransaction.customerDetails.email && (
                      <div><strong>Email:</strong> {selectedTransaction.customerDetails.email}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#495057' }}>Items ({selectedTransaction.itemsCount})</h3>
                <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
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
                  {(selectedTransaction.items || []).map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                        padding: '12px 16px',
                        borderBottom: index < (selectedTransaction.items || []).length - 1 ? '1px solid #f1f3f4' : 'none',
                        fontSize: '14px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.itemName}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>SKU: {item.sku}</div>
                      </div>
                      <div>{item.quantity}</div>
                      <div>{formatCurrency(item.pricePerUnit)}</div>
                      <div>{formatCurrency(item.gst || 0)}</div>
                      <div style={{ fontWeight: '500' }}>{formatCurrency(item.totalAmount)}</div>
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

export default SalesModuleAdvanced;
