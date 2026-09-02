import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { Eye } from 'lucide-react';
import { SquarePen } from 'lucide-react';
import { ToggleRight, ToggleLeft } from 'lucide-react';
import { getCatalogues, deleteCatalogue, getCatalogueById, searchCatalogues, updateCatalogue } from './catalogueApi';
import { searchCategories } from '../category/categoryApi';
import { Catalogue } from './types';
import AddCataloguePage from './AddCataloguePage';
import BarcodeDisplay from '../../../components/BarcodeDisplay';
import { Category } from '../category/types';

const CatalogueModule: React.FC = () => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewCatalogue, setViewCatalogue] = useState<Catalogue | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  // Filter/sort modal state (local to modal)
  const [showFilters, setShowFilters] = useState(false);
  const [modalStatusFilter, setModalStatusFilter] = useState('');
  const [modalMinVolume, setModalMinVolume] = useState('');
  const [modalMaxVolume, setModalMaxVolume] = useState('');
  const [modalMinPrice, setModalMinPrice] = useState('');
  const [modalMaxPrice, setModalMaxPrice] = useState('');
  const [modalMinStock, setModalMinStock] = useState('');
  const [modalMaxStock, setModalMaxStock] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState('');
  // Applied filter/sort state (used for fetching)
  const [statusFilter, setStatusFilter] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [maxVolume, setMaxVolume] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState(-1);
  const [categoryId, setCategoryId] = useState('');
  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    // Fetch categories for dropdown
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await searchCategories({ status: 'active', sortBy: 'categoryName', sortOrder: 1 });
        setCategories(res.data.data || []);
      } catch (e) {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleView = async (cat: Catalogue) => {
    setViewLoading(true);
    setViewModalOpen(true);
    try {
      const res = await getCatalogueById(cat._id!);
      setViewCatalogue(res.data as Catalogue);
    } catch (error) {
      setViewCatalogue(null);
    } finally {
      setViewLoading(false);
    }
  };
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const handleToggleStatus = async (cat: Catalogue) => {
    // Optimistically update UI
    setCatalogues(prev => prev.map(c => c._id === cat._id ? { ...c, status: cat.status === 'active' ? 'inactive' : 'active' } : c));
    updateCatalogue(cat._id!, { status: cat.status === 'active' ? 'inactive' : 'active' })
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
      if (minVolume) params.minVolume = minVolume;
      if (maxVolume) params.maxVolume = maxVolume;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minStock) params.minStock = minStock;
      if (maxStock) params.maxStock = maxStock;
      if (categoryId) params.categoryId = categoryId;
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
  }, [searchTerm, statusFilter, minVolume, maxVolume, minPrice, maxPrice, minStock, maxStock, sortBy, sortOrder, categoryId]);

  const handleDelete = async (id: string) => {
    await deleteCatalogue(id);
    fetchCatalogues();
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>Product</h1>
            <div style={{ color: '#6c6c6c', fontSize: 16 }}>Manage your products</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search catalogue..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
                minWidth: 200,
                background: '#fff'
              }}
            />
            <button
              onClick={() => setShowFilters(v => !v)}
              title="Filters"
              style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 18 }}>☰</span>
            </button>
            <button
              style={{
                height: 40,
                minWidth: 200,
                background: '#1a2c7f',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onClick={() => setShowAdd(true)}
            >
              + Add Catalogue
            </button>
          </div>
          {showFilters && (
            <div style={{ position: 'absolute', right: 0, top: 72, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 16, zIndex: 10, width: 420, maxWidth: '95vw' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Min Volume" value={modalMinVolume} onChange={e => setModalMinVolume(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <input type="number" placeholder="Max Volume" value={modalMaxVolume} onChange={e => setModalMaxVolume(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Min Price" value={modalMinPrice} onChange={e => setModalMinPrice(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <input type="number" placeholder="Max Price" value={modalMaxPrice} onChange={e => setModalMaxPrice(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Min Stock" value={modalMinStock} onChange={e => setModalMinStock(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <input type="number" placeholder="Max Stock" value={modalMaxStock} onChange={e => setModalMaxStock(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </div>
                <select value={modalCategoryId} onChange={e => setModalCategoryId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <option value="">Category</option>
                  {categoriesLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                    ))
                  )
                }
                </select>
                <select value={modalStatusFilter} onChange={e => setModalStatusFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <option value="">Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => {
                    setStatusFilter(modalStatusFilter);
                    setMinVolume(modalMinVolume);
                    setMaxVolume(modalMaxVolume);
                    setMinPrice(modalMinPrice);
                    setMaxPrice(modalMaxPrice);
                    setMinStock(modalMinStock);
                    setMaxStock(modalMaxStock);
                    setCategoryId(modalCategoryId);
                    setShowFilters(false);
                  }}
                  style={{ padding: '10px 16px', background: '#6c3fc5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >Apply</button>
                <button
                  onClick={() => {
                    setModalStatusFilter('');
                    setModalMinVolume('');
                    setModalMaxVolume('');
                    setModalMinPrice('');
                    setModalMaxPrice('');
                    setModalMinStock('');
                    setModalMaxStock('');
                    setModalCategoryId('');
                    setStatusFilter('');
                    setMinVolume('');
                    setMaxVolume('');
                    setMinPrice('');
                    setMaxPrice('');
                    setMinStock('');
                    setMaxStock('');
                    setCategoryId('');
                    setShowFilters(false);
                  }}
                  style={{ padding: '10px 16px', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >Reset</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', padding: 0 }}>
          <div style={{ width: '100%', height: 520, overflowY: 'auto', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 15, letterSpacing: 0.2, position: 'sticky', top: 0, height: 56 }}>
                  <th style={{ padding: '14px 8px', textAlign: 'left', borderTopLeftRadius: 8, width: 80 }}>Thumbnail</th>
                  <th style={{ padding: '14px 8px', textAlign: 'left', width: 180 }}>Item Name</th>
                  <th style={{ padding: '14px 8px', textAlign: 'left', width: 100 }}>Volume</th>
                  <th style={{ padding: '14px 8px', textAlign: 'right', width: 100 }}>Price</th>
                  <th style={{ padding: '14px 8px', textAlign: 'center', width: 100 }}>Stock</th>
                  <th style={{ padding: '14px 8px', textAlign: 'left', width: 120 }}>Status</th>
                  <th style={{ padding: '14px 8px', textAlign: 'right', borderTopRightRadius: 8, width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogues.map(cat => (
                  <tr key={cat._id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 15, height: 56 }}>
                    <td style={{ padding: 8 }}>
                      {cat.thumbnail ? (
                        <img 
                          key={`${cat._id}-${cat.thumbnail}`}
                          src={cat.thumbnail.startsWith('data:image') ? cat.thumbnail : `http://localhost:5000${cat.thumbnail}`} 
                          alt={cat.itemName}
                          style={{ 
                            width: 50, 
                            height: 50, 
                            objectFit: 'cover', 
                            borderRadius: 6, 
                            border: '1px solid #ddd' 
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: 50, 
                          height: 50, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 6, 
                          border: '1px solid #ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: 12
                        }}>
                          No Image
                        </div>
                      )}
                    </td>
                    {/* <td style={{ padding: 14, color: '#111827', fontWeight: 500 }}>{cat.sku}</td> */}
                    <td style={{ padding: 8, color: '#111827', fontWeight: 500 }}>{cat.itemName}</td>
                    <td style={{ padding: 6, color: '#6b7280' }}>{cat.volumeOfMeasurement}</td>
                    <td style={{ padding: 6, textAlign: 'right', color: '#374151' }}>{cat.price}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#374151' }}>{cat.stock}</td>
                    <td style={{ padding: 6 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: 44,
                      }}>
                        <span style={{
                          padding: '7px 16px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          border: `2px solid ${cat.status === 'active' ? '#22c55e' : '#ef4444'}`,
                          color: cat.status === 'active' ? '#22c55e' : '#ef4444',
                          background: '#fff',
                          display: 'inline-block',
                          letterSpacing: 1,
                          minWidth: 80,
                          textAlign: 'center',
                          userSelect: 'none',
                          pointerEvents: 'none',
                        }}>
                          {cat.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: 6,
                      textAlign: 'right',
                      display: 'flex',
                      gap: 6,
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      height: 44,
                    }}>
                      <button 
                        onClick={() => handleToggleStatus(cat)} 
                        title="Toggle Status" 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#000' }}
                        disabled={statusLoading === cat._id}
                      >
                        {statusLoading === cat._id ? (
                          <div style={{ width: 16, height: 16, border: '2px solid #e5e7eb', borderTop: '2px solid #7c4dff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : cat.status === 'active' ? (
                          <ToggleRight size={26} color={'#000'} style={{ opacity: 1 }} />
                        ) : (
                          <ToggleLeft size={26} color={'#000'} style={{ opacity: 1 }} />
                        )}
                      </button>
                      <button 
                        onClick={() => handleView(cat)} 
                        title="View" 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#000' }}
                      >
                        <Eye size={22} />
                      </button>
                      <button 
                        onClick={() => handleEdit(cat._id!)} 
                        title="Edit" 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#000' }}
                      >
                        <SquarePen size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            minWidth: 400,
            boxShadow: '0 2px 12px #e6e6e6',
            position: 'relative',
            maxWidth: 900,
            width: '100%',
          }}>
            <button onClick={() => setViewModalOpen(false)} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888' }}>×</button>
            {viewLoading ? (
              <div>Loading...</div>
            ) : viewCatalogue ? (
              <div style={{ width: '100%' }}>
                <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 32, marginBottom: 24 }}>Product Details</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}>
                  <div>
                    {/* <div><strong>SKU ID:</strong> {viewCatalogue.sku}</div> */}
                    {/* <div><strong>Item ID:</strong> {viewCatalogue.itemId}</div> */}
                    <div><strong>Item Name:</strong> {viewCatalogue.itemName}</div>
                    <div><strong>Volume:</strong> {viewCatalogue.volumeOfMeasurement}</div>
                    <div><strong>Source of Origin:</strong> {viewCatalogue.sourceOfOrigin}</div>
                    {(viewCatalogue as any).cutType && (
                      <div><strong>Cut Type:</strong> {(viewCatalogue as any).cutType}</div>
                    )}
                    <div><strong>Certification:</strong> {viewCatalogue.certification}</div>
                    {viewCatalogue.certificationImage && (
                      <div style={{ marginTop: 8 }}>
                        <strong>Certification Image:</strong>
                        <div style={{ marginTop: 6 }}>
                          <img src={viewCatalogue.certificationImage} alt="Certification" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, border: '1px solid #ccc' }} />
                        </div>
                      </div>
                    )}
                    <div><strong>Price:</strong> ₹{viewCatalogue.price}</div>
                    <div><strong>Stock:</strong> {viewCatalogue.stock}</div>
                    <div>
                      <strong>Barcode:</strong> {viewCatalogue.barcode}
                      {viewCatalogue.barcode && (
                        <div style={{ marginTop: 8 }}>
                          <BarcodeDisplay barcodeNumber={viewCatalogue.barcode} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div><strong>Status:</strong> {viewCatalogue.status.toUpperCase()}</div>
                    <div><strong>Category ID:</strong> {viewCatalogue.categoryId}</div>
                    <div><strong>Organization ID:</strong> {viewCatalogue.organizationId}</div>
                    <div><strong>Expiry:</strong> {viewCatalogue.expiry}</div>
                    {/* <div><strong>Created At:</strong> {viewCatalogue.createdAt}</div>
                    <div><strong>Updated At:</strong> {viewCatalogue.updatedAt}</div> */}
                    <div style={{ margin: '16px 0' }}>
                      <strong>Nutrition Value:</strong>
                      {viewCatalogue.nutritionValue ? (
                        <ul style={{ marginLeft: 16 }}>
                          <li>Calories: {viewCatalogue.nutritionValue.calories}</li>
                          <li>Protein: {viewCatalogue.nutritionValue.protein}g</li>
                          <li>Fat: {viewCatalogue.nutritionValue.fat}g</li>
                          <li>Carbs: {viewCatalogue.nutritionValue.carbs}g</li>
                          <li>Fiber: {viewCatalogue.nutritionValue.fiber}g</li>
                          <li>Sugar: {viewCatalogue.nutritionValue.sugar}g</li>
                          <li>Sodium: {viewCatalogue.nutritionValue.sodium}mg</li>
                        </ul>
                      ) : <span>Not available</span>}
                    </div>
                    {/* Show all images and highlight thumbnail */}
                    {viewCatalogue.images && Array.isArray(viewCatalogue.images) && viewCatalogue.images.length > 0 && (
                      <div style={{ margin: '16px 0' }}>
                        <strong>Images:</strong><br />
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                          {viewCatalogue.images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={img} alt={`Catalogue ${idx + 1}`} style={{ maxWidth: 80, maxHeight: 80, borderRadius: 8, border: img === viewCatalogue.thumbnail ? '2px solid #6c3fc5' : '1px solid #ccc' }} />
                              {img === viewCatalogue.thumbnail && (
                                <span style={{ position: 'absolute', top: 4, right: 4, background: '#6c3fc5', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#6c3fc5' }}>✓ indicates selected thumbnail</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>Unable to load catalogue details.</div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CatalogueModule;
