import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { Eye, SquarePen, ToggleRight, ToggleLeft } from 'lucide-react';
import { getCategories, deleteCategory, getCategoryById, updateCategory, searchCategories } from './categoryApi';
import { Category } from './types';
import AddCategoryPage from './AddCategoryPage';

// Constants for styling
const CONTAINER_STYLES = {
  minHeight: '100vh',
  background: '#f8f9fb',
  padding: 32,
};

const TABLE_STYLES = {
  width: '100%',
  borderCollapse: 'separate' as 'separate',
  borderSpacing: 0 as number,
};

const HEADER_STYLES = {
  background: '#f8fafc',
  color: '#374151',
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 0.2,
  position: 'sticky' as const,
  top: 0,
};

const STATUS_BADGE_STYLES = (status: string) => ({
  padding: '6px 16px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: `2px solid ${status === 'active' ? '#22c55e' : '#ef4444'}`,
  color: status === 'active' ? '#22c55e' : '#ef4444',
  background: '#fff',
  display: 'inline-block',
  letterSpacing: 1,
  minWidth: 80,
  textAlign: 'center' as const,
  userSelect: 'none' as const,
  pointerEvents: 'none' as const,
});

const CategoryModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Category | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);
  const [modalCatalogues, setModalCatalogues] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  // Filter modal and status filter
  const [showFilters, setShowFilters] = useState(false);
  // Modal filter state
  const [modalStatusFilter, setModalStatusFilter] = useState('');
  // Applied filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState(-1);

  const fetchCategories = async () => {
    setSearchLoading(true);
    try {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      const res = await searchCategories(params);
      setCategories(res.data.data || []);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    const newStatus = cat.status === 'active' ? 'inactive' : 'active';
    await updateCategory(cat._id!, { status: newStatus });
    await fetchCategories();
  };

  const openCatalogueModal = async (categoryId: string) => {
    setModalLoading(true);
    setModalOpen(true);
    setModalCategoryId(categoryId);
    try {
      const { getCatalogues } = await import('../catalogue/catalogueApi');
      const res = await getCatalogues();
      setModalCatalogues(res.data.filter((item: any) => item.categoryId === categoryId));
    } catch {
      setModalCatalogues([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    await fetchCategories();
  };

  const handleEdit = async (id: string) => {
    const res = await getCategoryById(id);
    setEditData(res.data as Category);
    setEditId(id);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  // Sync modal state with applied state when opening filter modal
  useEffect(() => {
    if (showFilters) {
      setModalStatusFilter(statusFilter);
    }
    // eslint-disable-next-line
  }, [showFilters]);

  if (showAdd) {
    return <AddCategoryPage onBack={() => { setShowAdd(false); fetchCategories(); }} />;
  }

  if (editId && editData) {
    return <AddCategoryPage onBack={() => { setEditId(null); setEditData(null); fetchCategories(); }} editId={editId} editData={editData} />;
  }

  return (
    <div style={CONTAINER_STYLES}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>Categories</h1>
            <div style={{ color: '#6c6c6c', fontSize: 16 }}>Manage your product categories</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
                minWidth: 200,
                background: '#fff',
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
              + Add Category
            </button>
          </div>
          {showFilters && (
            <div style={{ position: 'absolute', right: 0, top: 72, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 16, zIndex: 10, width: 320, maxWidth: '95vw' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    setShowFilters(false);
                  }}
                  style={{ padding: '10px 16px', background: '#6c3fc5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >Apply</button>
                <button
                  onClick={() => {
                    setModalStatusFilter('');
                    setStatusFilter('');
                    setShowFilters(false);
                  }}
                  style={{ padding: '10px 16px', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >Reset</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6' }}>
          <div style={{ width: '100%', height: 520, overflowY: 'auto', borderRadius: 12 }}>
            <table style={TABLE_STYLES}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 15, letterSpacing: 0.2, position: 'sticky', top: 0, height: 56 }}>
                  <th style={{ padding: '14px 8px', textAlign: 'left', borderTopLeftRadius: 8, width: 220 }}>Category Name</th>
                  <th style={{ padding: '14px 8px', textAlign: 'left', width: 420 }}>Description</th>
                  <th style={{ padding: '14px 8px', textAlign: 'left', width: 120 }}>Status</th>
                  <th style={{ padding: '14px 8px', textAlign: 'right', borderTopRightRadius: 8, width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat._id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 15, height: 56 }}>
                    <td style={{ padding: 14, color: '#111827', fontWeight: 500 }}>{cat.categoryName}</td>
                    <td style={{
                      padding: 14,
                      color: '#6b7280',
                      wordBreak: 'break-word' as const,
                      whiteSpace: 'pre-line' as const,
                      maxWidth: 280,
                      overflowWrap: 'break-word' as const,
                    }}>{cat.categoryDescription || '-'}</td>
                    <td style={{ padding: 14 }}>
                      <span style={STATUS_BADGE_STYLES(cat.status)}>{cat.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: 14, textAlign: 'right' as const, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        title="Toggle Status"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#000' }}
                      >
                        {cat.status === 'active' ? (
                          <ToggleRight size={26} color="#000" style={{ opacity: 1 }} />
                        ) : (
                          <ToggleLeft size={26} color="#b0b0b0" style={{ opacity: 1 }} />
                        )}
                      </button>
                      <button
                        onClick={() => openCatalogueModal(cat.categoryId)}
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

      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', padding: 32, minWidth: 700, maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#7c4dff', cursor: 'pointer' }}
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Catalogue Items</h3>
            {modalLoading ? (
              <div>Loading...</div>
            ) : modalCatalogues.length === 0 ? (
              <div>No catalogue items found for this category.</div>
            ) : (
              <table style={TABLE_STYLES}>
                <thead>
                  <tr style={{ background: '#f5f6fa', color: '#222', fontWeight: 700, fontSize: 16 }}>
                    <th style={{ padding: 12, textAlign: 'left' as const }}>Item Name</th>
                    <th style={{ padding: 12, textAlign: 'left' as const }}>Price</th>
                    <th style={{ padding: 12, textAlign: 'left' as const }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {modalCatalogues.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 15 }}>
                      <td style={{ padding: 10 }}>{item.itemName}</td>
                      <td style={{ padding: 10 }}>₹{item.price}</td>
                      <td style={{ padding: 10 }}>{item.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryModule;