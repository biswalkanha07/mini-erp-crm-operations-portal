import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFileText,
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiX,
  FiEye,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCheck
} from 'react-icons/fi';
import { Challan, ChallanStatus } from './types';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateDraftChallan,
  confirmChallan,
  cancelChallan
} from './challanApi';
import { customerApi } from '../crm/customerApi';
import { getCatalogues } from '../inventory/catalogue/catalogueApi';
import { Customer } from '../crm/types';
import { Catalogue } from '../inventory/catalogue/types';
import { normalizeRole } from '../../utils/roleUtils';

interface ChallanModuleProps {
  userRole?: string;
}

interface ItemRow {
  productId: string;
  quantity: number | '';
}

export const ChallanModule: React.FC<ChallanModuleProps> = ({ userRole }) => {
  const storedUser = localStorage.getItem('user');
  let currentRole = userRole || localStorage.getItem('userRole') || 'Admin';
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      currentRole = u.role || currentRole;
    } catch (_) {}
  }
  const canonicalRole = normalizeRole(userRole || currentRole);
  const canMutate = canonicalRole === 'Admin' || canonicalRole === 'Sales';

  // State
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientItems, setInsufficientItems] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChallanId, setEditingChallanId] = useState<string | null>(null);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<ItemRow[]>([{ productId: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Confirm Confirmation Dialog Modal
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [challanToConfirm, setChallanToConfirm] = useState<Challan | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Fetch Customers and Products for Form Selectors
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerApi.getCustomers({ limit: 100 }),
        getCatalogues()
      ]);
      const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.data || []);
      const prodList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
      setCustomers(custList);
      setProducts(prodList);
    } catch (e) {
      console.error('Failed to load auxiliary data:', e);
    }
  }, []);

  // Fetch Challans
  const fetchChallans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.status = statusFilter;
      if (customerFilter) params.customerId = customerFilter;

      const res = await getChallans(params);
      if (res.data && res.data.data) {
        setChallans(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.total || 0);
        } else {
          setTotalPages(1);
          setTotalCount(res.data.data.length);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sales challans');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, customerFilter]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingChallanId(null);
    setFormCustomerId(customers.length > 0 ? (customers[0].id || customers[0]._id!) : '');
    setFormNotes('');
    setFormItems([{ productId: products.length > 0 ? (products[0].id || products[0]._id || products[0].itemId!) : '', quantity: 1 }]);
    setError(null);
    setInsufficientItems([]);
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (challan: Challan) => {
    if (challan.status !== 'DRAFT') {
      setError(`Cannot edit challan with status '${challan.status}'. Only DRAFT challans can be edited.`);
      return;
    }
    setEditingChallanId(challan.id || challan._id!);
    setFormCustomerId(challan.customerId);
    setFormNotes(challan.notes || '');
    setError(null);
    setInsufficientItems([]);

    try {
      const detail = await getChallanById(challan.id || challan._id!);
      const items = detail.data.data.items || [];
      if (items.length > 0) {
        setFormItems(items.map(it => ({
          productId: it.productId,
          quantity: it.quantity
        })));
      } else {
        setFormItems([{ productId: products.length > 0 ? (products[0].id || products[0]._id || products[0].itemId!) : '', quantity: 1 }]);
      }
      setShowFormModal(true);
    } catch (e: any) {
      setError('Failed to load challan details for editing');
    }
  };

  // Open Details Modal
  const handleViewDetail = async (challan: Challan) => {
    setSelectedChallan(challan);
    setShowDetailModal(true);
    setLoadingDetail(true);
    setError(null);
    setInsufficientItems([]);
    try {
      const res = await getChallanById(challan.id || challan._id!);
      setSelectedChallan(res.data.data);
    } catch (e: any) {
      console.error('Failed to load full challan detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const defaultProdId = products.length > 0 ? (products[0].id || products[0]._id || products[0].itemId!) : '';
    setFormItems(prev => [...prev, { productId: defaultProdId, quantity: 1 }]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update Item Row
  const handleUpdateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    setFormItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Calculate live totals in form
  let calculatedFormTotal = 0;
  formItems.forEach(it => {
    const prod = products.find(p => (p.id || p._id || p.itemId) === it.productId || p.sku === it.productId);
    const price = prod ? (Number(prod.price || prod.unitPrice) || 0) : 0;
    const qty = typeof it.quantity === 'number' ? it.quantity : 0;
    calculatedFormTotal += price * qty;
  });

  // Handle Form Submit (Create or Edit Draft)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId) {
      setError('Please select a customer');
      return;
    }
    if (formItems.length === 0) {
      setError('Please add at least one product item');
      return;
    }

    // Check for duplicate products in items
    const prodSet = new Set<string>();
    for (const it of formItems) {
      if (!it.productId) {
        setError('Please select a product for all item rows');
        return;
      }
      if (prodSet.has(it.productId)) {
        const dupProd = products.find(p => (p.id || p._id || p.itemId) === it.productId);
        setError(`Duplicate product '${dupProd?.itemName || it.productId}' in challan is not allowed. Please consolidate quantity.`);
        return;
      }
      prodSet.add(it.productId);

      if (!it.quantity || Number(it.quantity) <= 0) {
        setError('Quantity for all items must be a positive integer');
        return;
      }
    }

    const payload = {
      customerId: formCustomerId,
      items: formItems.map(it => ({
        productId: it.productId,
        quantity: Number(it.quantity)
      })),
      notes: formNotes.trim() || undefined
    };

    setSubmitting(true);
    setError(null);
    try {
      if (editingChallanId) {
        await updateDraftChallan(editingChallanId, payload);
        setSuccessMsg('Sales Challan updated successfully');
      } else {
        const res = await createChallan(payload);
        setSuccessMsg(`Sales Challan ${res.data.data.challanNumber} created as DRAFT`);
      }
      setShowFormModal(false);
      fetchChallans();
      fetchAuxiliaryData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Confirmation Modal
  const handlePromptConfirm = (challan: Challan) => {
    setChallanToConfirm(challan);
    setShowConfirmDialog(true);
    setError(null);
    setInsufficientItems([]);
  };

  // Execute Confirmation
  const handleExecuteConfirm = async () => {
    if (!challanToConfirm) return;
    setConfirming(true);
    setError(null);
    setInsufficientItems([]);
    try {
      const res = await confirmChallan(challanToConfirm.id || challanToConfirm._id!);
      setSuccessMsg(`Sales Challan ${res.data.data.challanNumber} CONFIRMED. Stock deducted and audit logged.`);
      setShowConfirmDialog(false);
      setShowDetailModal(false);
      fetchChallans();
      fetchAuxiliaryData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Confirmation failed';
      setError(msg);
      if (err.response?.data?.insufficientItems) {
        setInsufficientItems(err.response.data.insufficientItems);
      }
    } finally {
      setConfirming(false);
    }
  };

  // Handle Cancel Challan
  const handleCancelChallan = async (challan: Challan) => {
    if (!window.confirm(`Are you sure you want to cancel Sales Challan ${challan.challanNumber}?`)) {
      return;
    }
    setError(null);
    try {
      await cancelChallan(challan.id || challan._id!);
      setSuccessMsg(`Sales Challan ${challan.challanNumber} CANCELLED`);
      setShowDetailModal(false);
      fetchChallans();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel sales challan');
    }
  };

  const formatDate = (dateStr?: string) => {
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

  const renderStatusBadge = (status: ChallanStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: '#dcfce7',
            color: '#166534'
          }}>
            <FiCheckCircle size={13} /> CONFIRMED
          </span>
        );
      case 'CANCELLED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: '#fee2e2',
            color: '#991b1b'
          }}>
            <FiXCircle size={13} /> CANCELLED
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: '#fef3c7',
            color: '#92400e'
          }}>
            <FiAlertCircle size={13} /> DRAFT
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiFileText size={28} color="#1a2c7f" />
              <h1 style={{ fontWeight: 700, fontSize: 30, color: '#1a1a1a', margin: 0 }}>Sales Challans</h1>
            </div>
            <div style={{ color: '#6c6c6c', fontSize: 14, marginTop: 4 }}>
              Manage multi-item wholesale dispatch challans, verify stock allocations, and execute atomic inventory dispatches
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { fetchChallans(); fetchAuxiliaryData(); }}
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

            {canMutate && (
              <button
                onClick={handleOpenCreateModal}
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
                Create Sales Challan
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
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            color: '#c53030',
            padding: '14px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
            {insufficientItems.length > 0 && (
              <ul style={{ margin: '8px 0 0 26px', padding: 0, fontSize: 13 }}>
                {insufficientItems.map((item, idx) => (
                  <li key={idx} style={{ marginTop: 2 }}>{item}</li>
                ))}
              </ul>
            )}
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
              placeholder="Search by challan #, customer name, or company..."
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

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#718096', marginRight: 4 }}>Status:</span>
            {['All', 'DRAFT', 'CONFIRMED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: statusFilter === st ? '1px solid #1a2c7f' : '1px solid #e2e8f0',
                  backgroundColor: statusFilter === st ? '#1a2c7f' : '#fff',
                  color: statusFilter === st ? '#fff' : '#4a5568',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Customer Dropdown Filter */}
          <div style={{ minWidth: 200 }}>
            <select
              value={customerFilter}
              onChange={e => { setCustomerFilter(e.target.value); setPage(1); }}
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
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Challans Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', overflow: 'hidden' }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #edf2f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Challan #</th>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Items / Qty</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Created By</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                      Loading sales challans...
                    </td>
                  </tr>
                ) : challans.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                      No sales challans found matching criteria.
                    </td>
                  </tr>
                ) : (
                  challans.map(ch => {
                    const isDraft = ch.status === 'DRAFT';
                    return (
                      <tr
                        key={ch.id || ch._id}
                        style={{
                          borderBottom: '1px solid #edf2f7',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1a2c7f', fontFamily: 'monospace', fontSize: 13 }}>
                          {ch.challanNumber}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                          {formatDate(ch.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1a202c' }}>
                          <div style={{ fontWeight: 600 }}>{ch.customerName || '—'}</div>
                          {ch.customerCompany && (
                            <div style={{ fontSize: 11, color: '#718096' }}>{ch.customerCompany}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#4a5568' }}>
                          <span style={{ fontWeight: 600 }}>{ch.itemCount || (ch.items ? ch.items.length : 0)} items</span>
                          <span style={{ color: '#718096', fontSize: 11, display: 'block' }}>({ch.totalQuantity || 0} units)</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#1a202c' }}>
                          ₹{ch.totalAmount?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {renderStatusBadge(ch.status)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4a5568' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiUser size={13} color="#a0aec0" />
                            <span>{ch.createdByName || ch.createdByEmail || 'Staff'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              onClick={() => handleViewDetail(ch)}
                              title="View Details"
                              style={{
                                padding: '6px 8px',
                                background: '#edf2f7',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                color: '#4a5568'
                              }}
                            >
                              <FiEye size={14} />
                            </button>

                            {isDraft && canMutate && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(ch)}
                                  title="Edit Draft"
                                  style={{
                                    padding: '6px 8px',
                                    background: '#e0f2fe',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    color: '#0369a1'
                                  }}
                                >
                                  <FiEdit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handlePromptConfirm(ch)}
                                  title="Confirm Challan"
                                  style={{
                                    padding: '6px 8px',
                                    background: '#dcfce7',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    color: '#166534'
                                  }}
                                >
                                  <FiCheck size={14} />
                                </button>
                                <button
                                  onClick={() => handleCancelChallan(ch)}
                                  title="Cancel Draft"
                                  style={{
                                    padding: '6px 8px',
                                    background: '#fee2e2',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    color: '#991b1b'
                                  }}
                                >
                                  <FiX size={14} />
                                </button>
                              </>
                            )}
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
              Showing {challans.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} challans
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

        {/* Create / Edit Challan Modal */}
        {showFormModal && (
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
              maxWidth: 750,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiFileText color="#1a2c7f" />
                  {editingChallanId ? 'Edit Sales Challan (DRAFT)' : 'Create New Sales Challan'}
                </h2>
                <button
                  onClick={() => setShowFormModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                {/* Customer Select */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Customer <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={e => setFormCustomerId(e.target.value)}
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
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.name} {c.businessName ? `— ${c.businessName}` : ''} ({c.phone || c.mobile || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#1a202c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Challan Items <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e0',
                      backgroundColor: '#f8fafc',
                      color: '#1a2c7f',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <FiPlus size={14} /> Add Product
                  </button>
                </div>

                {/* Items List */}
                <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 18 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: 110 }}>Available Stock</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: 90 }}>Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: 100 }}>Quantity</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: 100 }}>Line Total</th>
                        <th style={{ padding: '8px 8px', textAlign: 'center', width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.map((item, idx) => {
                        const prod = products.find(p => (p.id || p._id || p.itemId) === item.productId || p.sku === item.productId);
                        const availableStock = prod ? (prod.currentStock ?? prod.stock ?? 0) : 0;
                        const price = prod ? (Number(prod.price || prod.unitPrice) || 0) : 0;
                        const qty = typeof item.quantity === 'number' ? item.quantity : 0;
                        const lineTotal = price * qty;
                        const isStockLow = qty > availableStock;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <select
                                value={item.productId}
                                onChange={e => handleUpdateItemRow(idx, 'productId', e.target.value)}
                                required
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #cbd5e0',
                                  fontSize: 12
                                }}
                              >
                                {products.map(p => (
                                  <option key={p.id || p._id || p.itemId} value={p.id || p._id || p.itemId}>
                                    {p.itemName || p.productName} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: isStockLow ? '#dc2626' : '#4a5568' }}>
                              {availableStock}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4a5568' }}>
                              ₹{price}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={e => handleUpdateItemRow(idx, 'quantity', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                                required
                                style={{
                                  width: '70px',
                                  padding: '6px 8px',
                                  borderRadius: 4,
                                  border: isStockLow ? '1px solid #f87171' : '1px solid #cbd5e0',
                                  textAlign: 'center',
                                  fontSize: 12
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1a2c7f' }}>
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                              {formItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}
                                  title="Remove item"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Preview */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  marginBottom: 18,
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4a5568' }}>Total Challan Amount:</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1a2c7f' }}>
                    ₹{calculatedFormTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Notes / Delivery Remarks */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                    Notes / Dispatch Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Delivery via Route 4 Truck, Dispatch after 2 PM..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
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

                {/* Form Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
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
                    disabled={submitting}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#1a2c7f',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: 13
                    }}
                  >
                    {submitting ? 'Saving...' : editingChallanId ? 'Update Draft' : 'Save as DRAFT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Challan Detail Modal */}
        {showDetailModal && selectedChallan && (
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
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiFileText color="#1a2c7f" />
                    Challan: {selectedChallan.challanNumber}
                  </h2>
                  <div style={{ marginTop: 4 }}>{renderStatusBadge(selectedChallan.status)}</div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
                >
                  <FiX size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Loading challan details...</div>
              ) : (
                <div>
                  {/* Meta Information Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    backgroundColor: '#f8fafc',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13
                  }}>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Customer</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{selectedChallan.customerName || '—'}</span>
                      {selectedChallan.customerCompany && (
                        <div style={{ fontSize: 11, color: '#4a5568' }}>{selectedChallan.customerCompany}</div>
                      )}
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Contact</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{selectedChallan.customerPhone || selectedChallan.customerEmail || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Created By / Date</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>
                        {selectedChallan.createdByName || 'Staff'} ({formatDate(selectedChallan.createdAt)})
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>
                        {selectedChallan.status === 'CONFIRMED' ? 'Confirmed At' : selectedChallan.status === 'CANCELLED' ? 'Cancelled At' : 'Last Updated'}
                      </span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>
                        {formatDate(selectedChallan.confirmedAt || selectedChallan.cancelledAt || selectedChallan.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {selectedChallan.notes && (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 12, color: '#92400e' }}>
                      <strong>Remarks:</strong> {selectedChallan.notes}
                    </div>
                  )}

                  {/* Items Snapshot Table */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a202c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      Challan Items Snapshot
                    </div>
                    <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 12px' }}>Product</th>
                            <th style={{ padding: '8px 12px' }}>SKU</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedChallan.items || []).map(it => (
                            <tr key={it.id || it._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1a202c' }}>
                                {it.productName}
                              </td>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#4a5568' }}>
                                {it.sku}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4a5568' }}>
                                ₹{it.unitPrice}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#1a202c' }}>
                                {it.quantity}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1a2c7f' }}>
                                ₹{it.totalAmount?.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: 8,
                    marginBottom: 20,
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>Grand Total</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1a2c7f' }}>
                      ₹{selectedChallan.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Modal Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {selectedChallan.status === 'DRAFT' && canMutate && (
                        <button
                          onClick={() => handleCancelChallan(selectedChallan)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 6,
                            border: '1px solid #fca5a5',
                            backgroundColor: '#fff',
                            color: '#dc2626',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Cancel Challan
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e0',
                          backgroundColor: '#edf2f7',
                          color: '#4a5568',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        Close
                      </button>

                      {selectedChallan.status === 'DRAFT' && canMutate && (
                        <>
                          <button
                            onClick={() => { setShowDetailModal(false); handleOpenEditModal(selectedChallan); }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 6,
                              border: '1px solid #bae6fd',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 13
                            }}
                          >
                            Edit Draft
                          </button>
                          <button
                            onClick={() => handlePromptConfirm(selectedChallan)}
                            style={{
                              padding: '8px 20px',
                              borderRadius: 6,
                              border: 'none',
                              backgroundColor: '#16a34a',
                              color: '#fff',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 13
                            }}
                          >
                            Confirm Challan
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirm Action Confirmation Modal */}
        {showConfirmDialog && challanToConfirm && (
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
            zIndex: 1100,
            padding: 20
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <FiCheckCircle size={24} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a202c' }}>
                  Confirm Sales Challan {challanToConfirm.challanNumber}?
                </h3>
              </div>
              <p style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5, marginBottom: 20 }}>
                Confirming this challan will atomically validate inventory for all items, deduct product stock in the database, and generate append-only stock movement audit records. This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setShowConfirmDialog(false)}
                  style={{
                    padding: '8px 16px',
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
                  type="button"
                  disabled={confirming}
                  onClick={handleExecuteConfirm}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: confirming ? 'not-allowed' : 'pointer',
                    fontSize: 13
                  }}
                >
                  {confirming ? 'Confirming...' : 'Yes, Confirm & Deduct Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallanModule;
