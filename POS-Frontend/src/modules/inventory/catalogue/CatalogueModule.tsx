import React, { useEffect, useState } from 'react';
import { Eye, SquarePen, AlertTriangle, Barcode as BarcodeIcon, Printer, X } from 'lucide-react';
import { deleteCatalogue, getCatalogueById, searchCatalogues, updateCatalogue } from './catalogueApi';
import { searchCategories } from '../category/categoryApi';
import { Catalogue } from './types';
import AddCataloguePage from './AddCataloguePage';
import BarcodeDisplay from '../../../components/BarcodeDisplay';
import { Category } from '../category/types';
import { getStockMovements } from '../stockMovements/stockMovementApi';
import { StockMovement } from '../stockMovements/types';
import { normalizeRole } from '../../../utils/roleUtils';

interface CatalogueModuleProps {
  userRole?: string;
}

const CatalogueModule: React.FC<CatalogueModuleProps> = ({ userRole: initialUserRole }) => {
  // User role for RBAC
  const userStr = localStorage.getItem('user');
  let fallbackRole = initialUserRole || localStorage.getItem('userRole') || 'Admin';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      fallbackRole = u.role || fallbackRole;
    } catch (_) {}
  }
  const canonicalRole = normalizeRole(initialUserRole || fallbackRole);
  const canEdit = canonicalRole === 'Admin' || canonicalRole === 'Warehouse';
  const [barcodeModalCat, setBarcodeModalCat] = useState<Catalogue | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewCatalogue, setViewCatalogue] = useState<Catalogue | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalStatusFilter, setModalStatusFilter] = useState('');
  const [modalMinPrice, setModalMinPrice] = useState('');
  const [modalMaxPrice, setModalMaxPrice] = useState('');
  const [modalMinStock, setModalMinStock] = useState('');
  const [modalMaxStock, setModalMaxStock] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [modalWarehouseFilter, setModalWarehouseFilter] = useState('');

  // Applied filter/sort state
  const [statusFilter, setStatusFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState(-1);
  const [categoryId, setCategoryId] = useState('');

  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await searchCategories({ status: 'active', sortBy: 'categoryName', sortOrder: 1 });
        setCategories(res.data.data || []);
      } catch (e) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);

  const handleView = async (cat: Catalogue) => {
    setViewLoading(true);
    setViewModalOpen(true);
    setProductMovements([]);
    try {
      const pId = cat._id || cat.id || cat.sku;
      const res = await getCatalogueById(cat._id || cat.id!);
      setViewCatalogue(res.data as Catalogue);
      getStockMovements({ productId: pId, limit: 5 })
        .then(smRes => {
          if (smRes.data && smRes.data.data) {
            setProductMovements(smRes.data.data);
          }
        })
        .catch(() => {});
    } catch (error) {
      setViewCatalogue(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleToggleStatus = async (cat: Catalogue) => {
    if (!canEdit) return;
    const newStatus = cat.status === 'active' ? 'inactive' : 'active';
    setCatalogues(prev => prev.map(c => (c._id === cat._id || c.id === cat.id) ? { ...c, status: newStatus } : c));
    updateCatalogue(cat._id || cat.id!, { status: newStatus })
      .then(() => fetchCatalogues())
      .catch(() => fetchCatalogues());
  };

  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Catalogue | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCatalogues = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minStock) params.minStock = minStock;
      if (maxStock) params.maxStock = maxStock;
      if (categoryId) params.categoryId = categoryId;
      if (warehouseFilter) params.warehouseLocation = warehouseFilter;
      if (lowStockOnly) params.lowStock = 'true';
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res = await searchCatalogues(params);
      setCatalogues(res.data.data || []);
    } catch (error) {
      console.error('Error fetching catalogues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogues();
    // eslint-disable-next-line
  }, [searchTerm, statusFilter, minPrice, maxPrice, minStock, maxStock, sortBy, sortOrder, categoryId, lowStockOnly, warehouseFilter]);

  const handleEdit = async (id: string) => {
    const res = await getCatalogueById(id);
    setEditData(res.data as Catalogue);
    setEditId(id);
  };

  if (showAdd) {
    return <AddCataloguePage onBack={() => {
      setShowAdd(false);
      setTimeout(() => {
        fetchCatalogues();
      }, 200);
    }} />;
  }

  if (editId && editData) {
    return <AddCataloguePage onBack={() => { 
      setEditId(null); 
      setEditData(null); 
      setTimeout(() => {
        fetchCatalogues();
      }, 200);
    }} editId={editId} editData={editData} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 4, color: '#1a1a1a' }}>Inventory & Catalogue</h1>
            <div style={{ color: '#6c6c6c', fontSize: 15 }}>
              Track products, minimum stock alert quantities, and warehouse locations
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
                minWidth: 220,
                background: '#fff'
              }}
            />

            {/* Quick Low Stock Toggle */}
            <button
              onClick={() => setLowStockOnly(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                border: lowStockOnly ? '1px solid #e53e3e' : '1px solid #e2e8f0',
                backgroundColor: lowStockOnly ? '#fff5f5' : '#fff',
                color: lowStockOnly ? '#c53030' : '#4a5568',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <AlertTriangle size={15} color={lowStockOnly ? '#e53e3e' : '#718096'} />
              {lowStockOnly ? 'Low Stock Filter (ON)' : 'Low Stock Only'}
            </button>

            {/* Filters Dropdown Trigger */}
            <button
              onClick={() => setShowFilters(v => !v)}
              title="Filters"
              style={{
                height: 38,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 500
              }}
            >
              <span>☰ Filters</span>
            </button>

            {canEdit && (
              <button
                style={{
                  height: 38,
                  padding: '0 20px',
                  background: '#1a2c7f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
                onClick={() => setShowAdd(true)}
              >
                + Add Product
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div style={{
              position: 'absolute',
              right: 32,
              top: 100,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: 20,
              zIndex: 100,
              width: 420,
              maxWidth: '95vw'
            }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 16, fontWeight: 700, color: '#1a202c' }}>Filter Products</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={modalCategoryId}
                    onChange={e => setModalCategoryId(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13 }}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c._id || c.categoryId} value={c._id || c.categoryId}>{c.categoryName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Warehouse / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Warehouse"
                    value={modalWarehouseFilter}
                    onChange={e => setModalWarehouseFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Min Price</label>
                    <input type="number" placeholder="Min Price" value={modalMinPrice} onChange={e => setModalMinPrice(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Max Price</label>
                    <input type="number" placeholder="Max Price" value={modalMaxPrice} onChange={e => setModalMaxPrice(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Min Stock</label>
                    <input type="number" placeholder="Min Stock" value={modalMinStock} onChange={e => setModalMinStock(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Max Stock</label>
                    <input type="number" placeholder="Max Stock" value={modalMaxStock} onChange={e => setModalMaxStock(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4 }}>Status</label>
                  <select
                    value={modalStatusFilter}
                    onChange={e => setModalStatusFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 13 }}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button
                  onClick={() => {
                    setModalStatusFilter('');
                    setModalMinPrice('');
                    setModalMaxPrice('');
                    setModalMinStock('');
                    setModalMaxStock('');
                    setModalCategoryId('');
                    setModalWarehouseFilter('');
                    setStatusFilter('');
                    setMinPrice('');
                    setMaxPrice('');
                    setMinStock('');
                    setMaxStock('');
                    setCategoryId('');
                    setWarehouseFilter('');
                    setShowFilters(false);
                  }}
                  style={{ padding: '8px 14px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setStatusFilter(modalStatusFilter);
                    setMinPrice(modalMinPrice);
                    setMaxPrice(modalMaxPrice);
                    setMinStock(modalMinStock);
                    setMaxStock(modalMaxStock);
                    setCategoryId(modalCategoryId);
                    setWarehouseFilter(modalWarehouseFilter);
                    setShowFilters(false);
                  }}
                  style={{ padding: '8px 18px', background: '#1a2c7f', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', overflow: 'hidden' }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #edf2f7', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 12px', width: 70 }}>Image</th>
                  <th style={{ padding: '14px 12px' }}>Product Name</th>
                  <th style={{ padding: '14px 12px' }}>SKU</th>
                  <th style={{ padding: '14px 12px' }}>Category</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center' }}>Min Stock</th>
                  <th style={{ padding: '14px 12px' }}>Warehouse / Location</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center' }}>Barcode</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center' }}>Stock Status</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                      Loading inventory products...
                    </td>
                  </tr>
                ) : catalogues.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                      No products found. Adjust your search or filter settings.
                    </td>
                  </tr>
                ) : (
                  catalogues.map(cat => {
                    const currentStock = cat.currentStock !== undefined ? cat.currentStock : (cat.stock || 0);
                    const minStockVal = cat.minimumStock !== undefined ? cat.minimumStock : 0;
                    const isLow = cat.isLowStock !== undefined ? cat.isLowStock : (minStockVal > 0 && currentStock <= minStockVal);
                    const location = cat.warehouseLocation || 'Main Warehouse';

                    return (
                      <tr
                        key={cat._id || cat.id}
                        style={{
                          borderBottom: '1px solid #edf2f7',
                          backgroundColor: isLow ? '#fffaf0' : '#fff',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          {cat.thumbnail ? (
                            <img 
                              src={cat.thumbnail.startsWith('data:image') ? cat.thumbnail : `http://localhost:5050${cat.thumbnail}`} 
                              alt={cat.itemName || cat.productName}
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 44, backgroundColor: '#edf2f7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: 10 }}>
                              No Image
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#1a202c' }}>{cat.itemName || cat.productName}</div>
                          {cat.volumeOfMeasurement && (
                            <div style={{ fontSize: 11, color: '#718096' }}>{cat.volumeOfMeasurement}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#4a5568', fontFamily: 'monospace', fontSize: 13 }}>
                          {cat.sku}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#4a5568' }}>
                          {cat.categoryName || cat.categoryId || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#2d3748' }}>
                          ₹{(cat.unitPrice !== undefined ? cat.unitPrice : cat.price).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: isLow ? '#c53030' : '#2d3748'
                          }}>
                            {currentStock}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#718096' }}>
                          {minStockVal}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#4a5568' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 12
                          }}>
                            {location}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {cat.barcode ? (
                            <span 
                              onClick={() => setBarcodeModalCat(cat)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 4,
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                fontFamily: 'monospace',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#1e293b',
                                cursor: 'pointer'
                              }}
                              title="Click to view barcode"
                            >
                              <BarcodeIcon size={13} color="#475569" />
                              {cat.barcode}
                            </span>
                          ) : (
                            <span style={{ color: '#a0aec0', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: isLow ? '#fed7d7' : '#c6f6d5',
                            color: isLow ? '#9b2c2c' : '#22543d'
                          }}>
                            {isLow && <AlertTriangle size={11} />}
                            {isLow ? 'LOW STOCK' : 'NORMAL'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            onClick={() => handleToggleStatus(cat)}
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              border: `1px solid ${cat.status === 'active' ? '#22c55e' : '#cbd5e0'}`,
                              color: cat.status === 'active' ? '#166534' : '#718096',
                              backgroundColor: cat.status === 'active' ? '#f0fdf4' : '#f7fafc',
                              cursor: canEdit ? 'pointer' : 'default'
                            }}
                            title={canEdit ? 'Click to toggle active/inactive' : ''}
                          >
                            {cat.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleView(cat)}
                              title="View Details"
                              style={{
                                padding: '6px 8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                background: '#fff',
                                color: '#4a5568',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={15} />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleEdit(cat._id || cat.id!)}
                                title="Edit Product"
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #cbd5e0',
                                  borderRadius: 6,
                                  background: '#fff',
                                  color: '#2b6cb0',
                                  cursor: 'pointer'
                                }}
                              >
                                <SquarePen size={15} />
                              </button>
                            )}
                            {cat.barcode && (
                              <button
                                onClick={() => setBarcodeModalCat(cat)}
                                title="View / Print Barcode"
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #cbd5e0',
                                  borderRadius: 6,
                                  background: '#fff',
                                  color: '#334155',
                                  cursor: 'pointer'
                                }}
                              >
                                <BarcodeIcon size={15} />
                              </button>
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
        </div>

        {/* View Modal */}
        {viewModalOpen && (
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
              padding: 24,
              maxWidth: 650,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}>
              <button
                onClick={() => setViewModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                ×
              </button>

              {viewLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Loading details...</div>
              ) : viewCatalogue ? (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', color: '#1a202c' }}>
                    {viewCatalogue.itemName || viewCatalogue.productName}
                  </h2>

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
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>SKU</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{viewCatalogue.sku}</span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Category</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{viewCatalogue.categoryName || viewCatalogue.categoryId || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Unit Price</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>₹{viewCatalogue.price}</span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Current Stock</span>
                      <span style={{ fontWeight: 700, color: viewCatalogue.isLowStock ? '#c53030' : '#1a202c' }}>
                        {viewCatalogue.stock}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Minimum Stock Alert</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{viewCatalogue.minimumStock ?? 0}</span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Warehouse / Location</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{viewCatalogue.warehouseLocation || 'Main Warehouse'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Stock Status</span>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: viewCatalogue.isLowStock ? '#fed7d7' : '#c6f6d5',
                        color: viewCatalogue.isLowStock ? '#9b2c2c' : '#22543d'
                      }}>
                        {viewCatalogue.isLowStock ? 'LOW STOCK' : 'NORMAL'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Status</span>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{viewCatalogue.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {viewCatalogue.barcode && (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ color: '#718096', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Barcode</span>
                      <BarcodeDisplay barcodeNumber={viewCatalogue.barcode} />
                    </div>
                  )}

                  {/* Product Stock Movement History */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a202c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Recent Stock Movements
                      </span>
                      <span style={{ fontSize: 11, color: '#718096' }}>Last {productMovements.length} records</span>
                    </div>

                    {productMovements.length === 0 ? (
                      <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#718096', textAlign: 'center' }}>
                        No stock movement history recorded for this product yet.
                      </div>
                    ) : (
                      <div style={{ borderRadius: 6, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '8px 10px' }}>Date</th>
                              <th style={{ padding: '8px 10px' }}>Type</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                              <th style={{ padding: '8px 10px' }}>Reason</th>
                              <th style={{ padding: '8px 10px' }}>User</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productMovements.map(m => {
                              const isIn = m.movementType === 'IN';
                              return (
                                <tr key={m.id || m._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                  <td style={{ padding: '8px 10px', color: '#718096' }}>
                                    {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <span style={{
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      backgroundColor: isIn ? '#dcfce7' : '#fee2e2',
                                      color: isIn ? '#166534' : '#991b1b'
                                    }}>
                                      {m.movementType}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: isIn ? '#16a34a' : '#dc2626' }}>
                                    {isIn ? `+${m.quantity || m.quantityChanged}` : `-${m.quantity || m.quantityChanged}`}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#4a5568' }}>{m.reason}</td>
                                  <td style={{ padding: '8px 10px', color: '#718096' }}>{m.createdByName || 'System'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e0',
                        backgroundColor: '#edf2f7',
                        color: '#2d3748',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Quick Barcode Preview / Print Modal */}
        {barcodeModalCat && (
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
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                  Product Barcode
                </div>
                <button
                  onClick={() => setBarcodeModalCat(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
                {barcodeModalCat.itemName || barcodeModalCat.productName}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, fontFamily: 'monospace' }}>
                SKU: {barcodeModalCat.sku}
              </div>
              <div style={{ backgroundColor: '#fff', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                {barcodeModalCat.barcode ? (
                  <BarcodeDisplay barcodeNumber={barcodeModalCat.barcode} />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>No barcode registered</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setBarcodeModalCat(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} /> Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogueModule;
