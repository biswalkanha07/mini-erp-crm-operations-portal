import React, { useEffect, useState } from 'react';
// @ts-ignore: lucide-react has no type declarations but works fine
import { SquarePen, ToggleLeft, ToggleRight, ListFilter } from 'lucide-react';
import { getStores, updateStore, searchStores } from './storeApi';
import { Store } from './types';
import AddStorePage from './AddStorePage';
import { getOrganizations } from '../organization/organizationApi';
import { Organization } from '../organization/types';
import { FiUpload } from 'react-icons/fi';
import CSVUpload from './CSVUpload';

interface StoreModuleProps {
  user?: any; // User object from App.tsx
}

const StoreModule: React.FC<StoreModuleProps> = ({ user }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Store | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    organizationId: '',
    theme: '',
    minGst: '',
    maxGst: '',
    fromDate: '',
    toDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      setError('');
      // Use the same backend route as filters so behavior is consistent
      const res = await searchStores({});
      const d: any = res.data;
      const payload = d?.data ?? d?.stores ?? d?.results ?? d;
      if (!Array.isArray(payload)) {
        console.warn('Unexpected stores payload shape:', d);
        setStores([]);
      } else {
        setStores(payload as Store[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      setError('');
      const params: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) params[key] = value;
      });
      const res = await searchStores(params);
      const d: any = res.data;
      const payload = d?.data ?? d?.stores ?? d?.results ?? d; // support common shapes
      if (!Array.isArray(payload)) {
        console.warn('Unexpected stores search payload shape:', d);
        setStores([]);
      } else {
        setStores(payload as Store[]);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const [showCSVUpload, setShowCSVUpload] = useState(false);

  useEffect(() => {
    fetchStores();
    // Load organizations for filter dropdown
    (async () => {
      try {
        const res = await getOrganizations();
        const list = ((res as any).data?.data ?? res.data) as Organization[];
        setOrgs(Array.isArray(list) ? list : []);
      } catch (e: any) {}
    })();
  }, []);

  // Auto-search as user types in the header search box; clear restores list
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = (filters.search || '').trim();
      if (q.length > 0) {
        applyFilters();
      } else {
        fetchStores();
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const handleEdit = (store: Store) => {
    setEditData(store);
    setEditingId(store._id!);
  };


  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleStatus = async (store: Store) => {
    if (!store._id) return;
    setTogglingId(store._id);
    try {
      const newStatus = store.status === 'active' ? 'inactive' : 'active';
      await updateStore(store._id, { status: newStatus } as any);
      setStores(prev => prev.map(s => s._id === store._id ? { ...s, status: newStatus } as Store : s));
    } finally {
      setTogglingId(null);
    }
  };

  const handleEmailClick = (email: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `mailto:${email}`;
  };

  if (showAdd) {
    return <AddStorePage onBack={() => { setShowAdd(false); fetchStores(); }} user={user} />;
  }
  if (editingId && editData) {
    return <AddStorePage onBack={() => { setEditingId(null); setEditData(null); fetchStores(); }} editId={editingId} editData={editData} user={user} />;
  }
  if (showCSVUpload) {
    return <CSVUpload onClose={() => setShowCSVUpload(false)} onSuccess={() => { setShowCSVUpload(false); fetchStores(); }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>Stores</h1>
            <div style={{ color: '#6c6c6c', fontSize: 16 }}>Manage your store locations and details</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input
              placeholder="Search stores (name, id, location, contact...)"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 320, maxWidth: '60vw', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <button onClick={() => setShowFilters(v => !v)} title="Filters" style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ListFilter size={22} />
            </button>
            <button 
              style={{ 
                height: 44,
                padding: '0 20px',
                minWidth: 180,
                background: '#1a2c7fff',
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 600, 
                fontSize: 16, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px #e6e6e6'
              }} 
              onClick={() => setShowCSVUpload(true)}
            >
              <FiUpload size={16} />
              Bulk Upload
            </button>
            <button style={{ height: 44, padding: '0 28px', minWidth: 180, background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onClick={() => setShowAdd(true)}>+ Add Store</button>
          </div>
        </div>

          {showFilters && (
            <div style={{ position: 'absolute', right: 0, top: 72, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 16, zIndex: 10, width: 420, maxWidth: '95vw' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <option value="">Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select value={filters.organizationId} onChange={(e) => setFilters({ ...filters, organizationId: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <option value="">Organization</option>
                  {orgs.map(o => (
                    <option key={o._id} value={o._id}>{o.organizationName} ({o.organizationId})</option>
                  ))}
                </select>
                <select value={filters.theme} onChange={(e) => setFilters({ ...filters, theme: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <option value="">Theme</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <input type="number" placeholder="Min GST" value={filters.minGst} onChange={(e) => setFilters({ ...filters, minGst: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <input type="number" placeholder="Max GST" value={filters.maxGst} onChange={(e) => setFilters({ ...filters, maxGst: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button onClick={() => { setShowFilters(false); applyFilters(); }} style={{ padding: '10px 16px', background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
                <button onClick={() => { setFilters({ search: '', status: '', organizationId: '', theme: '', minGst: '', maxGst: '', fromDate: '', toDate: '' }); setShowFilters(false); fetchStores(); }} style={{ padding: '10px 16px', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>Search: name, id, location, address, contact name/number, email</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            {/* <button 
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
                gap: 8,
                boxShadow: '0 2px 8px #e6e6e6'
              }} 
              onClick={() => setShowCSVUpload(true)}
            >
              <FiUpload size={16} />
              Bulk Upload
            </button> */}
          </div>
        </div>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>⚠️ {error}</div>
        )}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', padding: 0 }}>
          <div style={{ width: '100%', height: 520, overflowY: 'auto', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>
                  <th style={{ padding: 14, textAlign: 'left', borderTopLeftRadius: 8, width: 110 }}>Store Image</th>
                  <th style={{ padding: 14, textAlign: 'left', width: 260 }}>Store Name</th>
                  <th style={{ padding: 14, textAlign: 'left', width: 120 }}>Store ID</th>
                  <th style={{ padding: 14, textAlign: 'left', width: 220 }}>Location / Address</th>
                  <th style={{ padding: 14, textAlign: 'left', width: 260 }}>Contact Person</th>
                  <th style={{ padding: 14, textAlign: 'left', width: 120 }}>Status</th>
                  <th style={{ padding: 14, textAlign: 'right', borderTopRightRadius: 8, width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center' }}>Loading...</td></tr>
                ) : stores.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center' }}>No stores found</td></tr>
                ) : stores.map(store => {
                  const defaultImg = '/suguna.png';
                  let imageSrc: string = defaultImg;
                  if (store.storePicture) {
                    if (
                      store.storePicture.startsWith('data:image') ||
                      store.storePicture.startsWith('http') ||
                      store.storePicture.startsWith('/')
                    ) {
                      imageSrc = store.storePicture;
                    } else {
                      imageSrc = `http://localhost:5000${store.storePicture}`;
                    }
                  }
                  return (
                    <tr key={store._id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
                      <td style={{ padding: 14 }}>
                        <img
                          key={`${store._id}-${store.storePicture || 'default'}`}
                          src={imageSrc}
                          alt={store.storeName}
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = defaultImg;
                          }}
                        />
                      </td>
                      <td style={{ padding: 14, color: '#111827' }}>{store.storeName}</td>
                      <td style={{ padding: 14 }}>{store.storeId}</td>
                      <td style={{ padding: 14 }}>
                        <div>{store.storeLocation}</div>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>
                          {(store as any).storeAddress || [store.address?.addressLine1, store.address?.city].filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: 14 }}>
                        <div style={{ color: '#111827' }}>{store.contactPersonName}</div>
                        <a href={`mailto:${store.email}`} onClick={e => handleEmailClick(store.email, e)} style={{ color: '#2563eb', textDecoration: 'none' }}>{store.email}</a><br />
                        <span style={{ color: '#6b7280' }}>{store.contactNumber}</span>
                      </td>
                      {/* <td style={{ padding: 14 }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: 999, 
                          fontSize: 12,
                          fontWeight: 700,
                          background: store.status === 'active' ? '#a7f3d0' : '#fecaca', // light green or light red
                          color: store.status === 'active' ? '#047857' : '#b91c1c', // dark green or dark red text
                          display: 'inline-block',
                          letterSpacing: 1,
                        }}>
                          {store.status.toUpperCase()}
                        </span>
                      </td> */}
                      <td style={{ padding: '6px 4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', height: 44 }}>
                        <span
                          style={{
                            padding: '7px 16px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            border: `2px solid ${store.status === 'active' ? '#22C55E' : '#EF4444'}`,
                            color: store.status === 'active' ? '#22C55E' : '#EF4444',
                            background: '#fff',
                            display: 'inline-block',
                            letterSpacing: 1,
                            minWidth: 80,
                            textAlign: 'center',
                            userSelect: 'none',
                            pointerEvents: 'none'
                          }}
                        >
                          {store.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                      <td style={{ padding: 14, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', height: 40 }}>
                          <button onClick={() => handleToggleStatus(store)} title="Toggle Status" style={{ background: 'none', border: 'none', cursor: togglingId === store._id ? 'not-allowed' : 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            {togglingId === store._id ? (
                              <div style={{ width: 16, height: 16, border: '2px solid #e5e7eb', borderTop: '2px solid #7c4dff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            ) : (
                              store.status === 'active' ? <ToggleRight size={28} color="#222" strokeWidth={2.2} /> : <ToggleLeft size={28} color="#222" strokeWidth={2.2} />
                            )}
                          </button>
                          <button onClick={() => handleEdit(store)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <SquarePen size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

  );
};

export default StoreModule;
