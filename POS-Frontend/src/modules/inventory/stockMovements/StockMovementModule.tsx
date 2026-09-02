import React, { useState, useEffect, useCallback } from 'react';
import {
  FiTrendingUp,
  FiSearch,
  FiPlus,
  FiArrowUpRight,
  FiArrowDownRight,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiUser
} from 'react-icons/fi';
import { StockMovement, MovementType } from './types';
import { getStockMovements, createStockMovement } from './stockMovementApi';
import { getCatalogues } from '../catalogue/catalogueApi';
import { Catalogue } from '../catalogue/types';
import { normalizeRole } from '../../../utils/roleUtils';

interface StockMovementModuleProps {
  userRole?: string;
}

export const StockMovementModule: React.FC<StockMovementModuleProps> = ({ userRole }) => {
  // Determine user role and permissions
  const storedUser = localStorage.getItem('user');
  let currentRole = userRole || localStorage.getItem('userRole') || 'Admin';
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      currentRole = u.role || currentRole;
    } catch (_) {}
  }
  const canonicalRole = normalizeRole(userRole || currentRole);
  const canCreate = canonicalRole === 'Admin' || canonicalRole === 'Warehouse';

  // State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [modalMovementType, setModalMovementType] = useState<MovementType>('IN');
  const [modalQuantity, setModalQuantity] = useState<number | ''>('');
  const [modalReasonPreset, setModalReasonPreset] = useState('Restock');
  const [modalCustomReason, setModalCustomReason] = useState('');
  const [modalReferenceId, setModalReferenceId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load products list for dropdown and real-time stock calculation
  const fetchProducts = useCallback(async () => {
    try {
      const res = await getCatalogues();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProducts(list);
    } catch (e) {
      console.error('Failed to load products for stock movements:', e);
    }
  }, []);

  // Fetch stock movements with filters
  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (movementTypeFilter !== 'All') params.movementType = movementTypeFilter;
      if (productFilter) params.productId = productFilter;

      const res = await getStockMovements(params);
      if (res.data && res.data.data) {
        setMovements(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.total || 0);
        } else {
          setTotalPages(1);
          setTotalCount(res.data.data.length);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stock movements');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, movementTypeFilter, productFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Selected product in modal for real-time stock feedback
  const selectedProduct = products.find(p => (p.id || p._id || p.itemId) === selectedProductId || p.sku === selectedProductId);
  const currentAvailableStock = selectedProduct ? (selectedProduct.currentStock ?? selectedProduct.stock ?? 0) : 0;
  const numQuantity = typeof modalQuantity === 'number' ? modalQuantity : 0;

  let calculatedStock = currentAvailableStock;
  let isInsufficientStock = false;
  if (selectedProduct && numQuantity > 0) {
    if (modalMovementType === 'IN') {
      calculatedStock = currentAvailableStock + numQuantity;
    } else {
      calculatedStock = currentAvailableStock - numQuantity;
      if (calculatedStock < 0) {
        isInsufficientStock = true;
      }
    }
  }

  const handleOpenAddModal = () => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id || products[0]._id || products[0].itemId);
    }
    setModalMovementType('IN');
    setModalQuantity('');
    setModalReasonPreset('Restock');
    setModalCustomReason('');
    setModalReferenceId('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }
    if (!modalQuantity || numQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (modalMovementType === 'OUT' && isInsufficientStock) {
      setError('Insufficient stock for this deduction');
      return;
    }

    const finalReason = modalReasonPreset === 'Other'
      ? modalCustomReason.trim()
      : modalReasonPreset;

    if (!finalReason) {
      setError('Please provide a reason for the stock movement');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createStockMovement({
        productId: selectedProductId,
        quantity: numQuantity,
        movementType: modalMovementType,
        reason: finalReason,
        referenceId: modalReferenceId.trim() || undefined
      });

      setSuccessMsg(`Stock movement recorded successfully. Updated stock: ${calculatedStock}`);
      setShowAddModal(false);
      fetchMovements();
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiTrendingUp size={28} color="#1a2c7f" />
              <h1 style={{ fontWeight: 700, fontSize: 30, color: '#1a1a1a', margin: 0 }}>Stock Movement & Audit Log</h1>
            </div>
            <div style={{ color: '#6c6c6c', fontSize: 14, marginTop: 4 }}>
              Immutable audit history of all inventory receipts, deductions, adjustments, and POS sales
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { fetchMovements(); fetchProducts(); }}
              title="Refresh"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#4a5568',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <FiRefreshCw size={14} />
              Refresh
            </button>

            {canCreate && (
              <button
                onClick={handleOpenAddModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: '#1a2c7f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <FiPlus size={16} />
                Add Stock Movement
              </button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14
          }}>
            <FiCheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            color: '#c53030',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14
          }}>
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div style={{
          backgroundColor: '#fff',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
            <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input
              type="text"
              placeholder="Search product, SKU, or reason..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#718096', marginRight: 4 }}>Type:</span>
            {['All', 'IN', 'OUT'].map(t => (
              <button
                key={t}
                onClick={() => { setMovementTypeFilter(t); setPage(1); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: movementTypeFilter === t ? '1px solid #1a2c7f' : '1px solid #e2e8f0',
                  backgroundColor: movementTypeFilter === t ? '#1a2c7f' : '#fff',
                  color: movementTypeFilter === t ? '#fff' : '#4a5568',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t === 'IN' ? '↑ IN (Inbound)' : t === 'OUT' ? '↓ OUT (Outbound)' : 'All'}
              </button>
            ))}
          </div>

          {/* Product Dropdown Filter */}
          <div style={{ minWidth: 200 }}>
            <select
              value={productFilter}
              onChange={e => { setProductFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 13,
                color: '#2d3748',
                backgroundColor: '#fff'
              }}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id || p._id || p.itemId} value={p.id || p._id || p.itemId}>
                  {p.itemName || p.productName} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', overflow: 'hidden' }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #edf2f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Date & Time</th>
                  <th style={{ padding: '14px 16px' }}>Product</th>
                  <th style={{ padding: '14px 16px' }}>SKU</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Movement Type</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '14px 16px' }}>Reason</th>
                  <th style={{ padding: '14px 16px' }}>Reference</th>
                  <th style={{ padding: '14px 16px' }}>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                      Loading stock movements...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                      No stock movement records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  movements.map(m => {
                    const isIn = m.movementType === 'IN';
                    return (
                      <tr
                        key={m.id || m._id}
                        style={{
                          borderBottom: '1px solid #edf2f7',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                          {formatDate(m.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a202c' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiPackage size={14} color="#718096" />
                            <span>{m.productName || m.productId}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4a5568', fontFamily: 'monospace', fontSize: 12 }}>
                          {m.sku || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: isIn ? '#dcfce7' : '#fee2e2',
                            color: isIn ? '#166534' : '#991b1b'
                          }}>
                            {isIn ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: isIn ? '#16a34a' : '#dc2626' }}>
                          {isIn ? `+${m.quantity || m.quantityChanged}` : `-${m.quantity || m.quantityChanged}`}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#2d3748' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 12
                          }}>
                            {m.reason}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#718096', fontFamily: 'monospace', fontSize: 11 }}>
                          {m.referenceId || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4a5568' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiUser size={13} color="#a0aec0" />
                            <span>{m.createdByName || m.createdByEmail || m.createdBy || 'System'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid #edf2f7',
            background: '#fafafa',
            fontSize: 13,
            color: '#718096'
          }}>
            <div>
              Showing {movements.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} movements
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  backgroundColor: page <= 1 ? '#f7fafc' : '#fff',
                  color: page <= 1 ? '#a0aec0' : '#4a5568',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <FiChevronLeft size={14} /> Previous
              </button>
              <span style={{ padding: '0 8px', fontWeight: 600, color: '#2d3748' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  backgroundColor: page >= totalPages ? '#f7fafc' : '#fff',
                  color: page >= totalPages ? '#a0aec0' : '#4a5568',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Add Stock Movement Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 28,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiTrendingUp color="#1a2c7f" />
                  Record Stock Movement
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit}>
                {/* Product Select */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Product <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e0',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  >
                    {products.map(p => (
                      <option key={p.id || p._id || p.itemId} value={p.id || p._id || p.itemId}>
                        {p.itemName || p.productName} ({p.sku}) — Current Stock: {p.currentStock ?? p.stock ?? 0}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Movement Type Toggle */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Movement Type <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setModalMovementType('IN')}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: modalMovementType === 'IN' ? '2px solid #16a34a' : '1px solid #cbd5e0',
                        backgroundColor: modalMovementType === 'IN' ? '#f0fdf4' : '#fff',
                        color: modalMovementType === 'IN' ? '#166534' : '#4a5568',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <FiArrowUpRight size={16} /> IN (Inbound / Receipt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMovementType('OUT')}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: modalMovementType === 'OUT' ? '2px solid #dc2626' : '1px solid #cbd5e0',
                        backgroundColor: modalMovementType === 'OUT' ? '#fef2f2' : '#fff',
                        color: modalMovementType === 'OUT' ? '#991b1b' : '#4a5568',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <FiArrowDownRight size={16} /> OUT (Outbound / Deduction)
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Quantity <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter positive whole quantity..."
                    value={modalQuantity}
                    onChange={e => setModalQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e0',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Live Stock Calculation Preview */}
                {selectedProduct && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                    backgroundColor: isInsufficientStock ? '#fef2f2' : '#f8fafc',
                    border: isInsufficientStock ? '1px solid #fecaca' : '1px solid #e2e8f0',
                    fontSize: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#718096' }}>Current Stock:</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{currentAvailableStock}</span>
                    </div>
                    {numQuantity > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#718096' }}>Adjustment:</span>
                        <span style={{ fontWeight: 700, color: modalMovementType === 'IN' ? '#16a34a' : '#dc2626' }}>
                          {modalMovementType === 'IN' ? `+${numQuantity}` : `-${numQuantity}`}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e0', paddingTop: 6, marginTop: 4 }}>
                      <span style={{ fontWeight: 700, color: '#2d3748' }}>Expected Resulting Stock:</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: isInsufficientStock ? '#dc2626' : '#1a2c7f' }}>
                        {calculatedStock}
                      </span>
                    </div>
                    {isInsufficientStock && (
                      <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiAlertCircle size={14} /> Insufficient stock! Cannot deduct more than {currentAvailableStock} units.
                      </div>
                    )}
                  </div>
                )}

                {/* Reason Select / Preset */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Reason <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <select
                    value={modalReasonPreset}
                    onChange={e => setModalReasonPreset(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e0',
                      fontSize: 13,
                      marginBottom: modalReasonPreset === 'Other' ? 8 : 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Restock">Restock / Purchase Inbound</option>
                    <option value="Damaged Stock">Damaged Stock Disposal</option>
                    <option value="Stock Adjustment">Physical Count / Stock Adjustment</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Internal Transfer">Internal Warehouse Transfer</option>
                    <option value="Initial Stock">Initial Stock Setup</option>
                    <option value="Correction">Audit Correction</option>
                    <option value="Other">Other (Custom Reason)</option>
                  </select>

                  {modalReasonPreset === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom reason..."
                      value={modalCustomReason}
                      onChange={e => setModalCustomReason(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e0',
                        fontSize: 13,
                        boxSizing: 'border-box'
                      }}
                    />
                  )}
                </div>

                {/* Reference ID (Optional) */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Reference / PO / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8921, INV-4432"
                    value={modalReferenceId}
                    onChange={e => setModalReferenceId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e0',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e0',
                      backgroundColor: '#edf2f7',
                      color: '#4a5568',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (modalMovementType === 'OUT' && isInsufficientStock)}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: (modalMovementType === 'OUT' && isInsufficientStock) ? '#cbd5e0' : '#1a2c7f',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: (modalMovementType === 'OUT' && isInsufficientStock) ? 'not-allowed' : 'pointer',
                      fontSize: 13
                    }}
                  >
                    {submitting ? 'Recording...' : 'Confirm Movement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovementModule;
