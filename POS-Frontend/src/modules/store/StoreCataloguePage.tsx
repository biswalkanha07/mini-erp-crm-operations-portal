
import React, { useEffect, useState } from 'react';
import { catalogueAPI } from '../../api';
import { FaEye } from 'react-icons/fa';
import storePriceAPI from '../../api/storePriceApi';

interface StoreCataloguePageProps {
  storeId: string;
}

interface CatalogueItem {
  _id: string;
  itemName: string;
  sku: string;
  price: number;
  categoryName?: string;
  stock?: number;
  thumbnail?: string;
  volumeOfMeasurement?: string;
  status?: string;
  barcode?: string;
  expiry?: string;
  createdAt?: string;
  updatedAt?: string;
  marginType?: 'percent' | 'absolute';
  marginValue?: number;
}

const StoreCataloguePage: React.FC<StoreCataloguePageProps> = ({ storeId }) => {
  const [catalogues, setCatalogues] = useState<CatalogueItem[]>([]);
  const [storePrices, setStorePrices] = useState<Record<string, { marginType: 'percent' | 'absolute'; marginValue: number }>>({});
  const [editingMargin, setEditingMargin] = useState<Record<string, boolean>>({});
  const [marginInputs, setMarginInputs] = useState<Record<string, { marginType: 'percent' | 'absolute'; marginValue: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewCatalogue, setViewCatalogue] = useState<CatalogueItem | null>(null);

  useEffect(() => {
    const fetchCatalogues = async () => {
      setLoading(true);
      try {
        const res = await catalogueAPI.getAll({ params: { storeId } });
        console.log('Catalogue API response:', res);
        if (res.status === 304) {
          // Try to load cached catalogue data from localStorage
          const cached = localStorage.getItem(`catalogue_${storeId}`);
          if (cached) {
            setCatalogues(JSON.parse(cached));
            setError('Loaded cached catalogue data');
          } else {
            setError('No new catalogue data (cached)');
          }
          setLoading(false);
          return;
        }
        // Accept array directly or { data: [...] }
        let items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCatalogues(items);
        // Save catalogue data to localStorage for future 304 responses
        localStorage.setItem(`catalogue_${storeId}`, JSON.stringify(items));
        // Fetch store prices
        const priceRes = await storePriceAPI.getAll(storeId);
        let priceArr = Array.isArray(priceRes.data)
          ? priceRes.data
          : Array.isArray(priceRes.data?.data)
            ? priceRes.data.data
            : [];
        const prices: Record<string, { marginType: 'percent' | 'absolute'; marginValue: number }> = {};
        priceArr.forEach((p: any) => {
          prices[p.sku] = { marginType: p.marginType, marginValue: p.marginValue };
        });
        setStorePrices(prices);
        // Initialize marginInputs
        const inputs: Record<string, { marginType: 'percent' | 'absolute'; marginValue: number }> = {};
        priceArr.forEach((p: any) => {
          inputs[p.sku] = { marginType: p.marginType, marginValue: p.marginValue };
        });
        setMarginInputs(inputs);
        setError('');
      } catch (e) {
        console.error('Catalogue fetch error:', e);
        setError('Failed to load catalogue data');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogues();
  }, [storeId]);

  const handleView = (cat: CatalogueItem) => {
    setViewCatalogue(cat);
    setViewModalOpen(true);
  };

  const handleEditMargin = (sku: string) => {
    setEditingMargin(prev => ({ ...prev, [sku]: true }));
  };

  const handleMarginInputChange = (sku: string, field: 'marginType' | 'marginValue', value: any) => {
    setMarginInputs(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: value
      }
    }));
  };

  const handleSaveMargin = async (sku: string) => {
    const margin = marginInputs[sku];
    await storePriceAPI.updateMargin(storeId, sku, margin.marginType, margin.marginValue);
    setStorePrices(prev => ({ ...prev, [sku]: { ...margin } }));
    setEditingMargin(prev => ({ ...prev, [sku]: false }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, color: '#1a1a1a' }}>Store Catalogue</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e6e6e6', padding: 24, border: '1px solid #e5e7eb' }}>
          {catalogues.length === 0 ? (
            <div>No catalogue items found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#374151', fontWeight: 700, fontSize: 15 }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Thumbnail</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Item Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Volume</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Price</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Profit Margin (%)</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogues.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
                    <td style={{ padding: 12 }}>
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail.startsWith('data:image') ? item.thumbnail : `http://localhost:5000${item.thumbnail}`} 
                          alt={item.itemName}
                          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: 50, height: 50, backgroundColor: '#f5f5f5', borderRadius: 6, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>No Image</div>
                      )}
                    </td>
                    <td style={{ padding: 12, color: '#111827', fontWeight: 500 }}>{item.itemName}</td>
                    <td style={{ padding: 12 }}>{item.sku}</td>
                    <td style={{ padding: 12 }}>{item.volumeOfMeasurement ?? '-'}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#059669', fontWeight: 600 }}>₹{item.price}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {editingMargin[item.sku] ? (
                        <span>
                          <input type="number" value={marginInputs[item.sku]?.marginValue ?? 0} style={{ width: 60 }} onChange={e => handleMarginInputChange(item.sku, 'marginValue', Number(e.target.value))} />
                          <button style={{ marginLeft: 8 }} onClick={() => handleSaveMargin(item.sku)}>Save</button>
                        </span>
                      ) : (
                        <span>
                          {`${storePrices[item.sku]?.marginValue ?? 0}%`}
                          <button style={{ marginLeft: 8 }} onClick={() => handleEditMargin(item.sku)}>Edit</button>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button 
                        onClick={() => handleView(item)} 
                        title="View" 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#7c4dff' }}
                      >
                        <FaEye size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewModalOpen && viewCatalogue && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 400, boxShadow: '0 2px 12px #e6e6e6', position: 'relative', maxWidth: 900, width: '100%' }}>
            <button onClick={() => setViewModalOpen(false)} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888' }}>×</button>
            <div style={{ width: '100%' }}>
              <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 32, marginBottom: 24 }}>Catalogue Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div><strong>SKU ID:</strong> {viewCatalogue.sku}</div>
                  <div><strong>Item Name:</strong> {viewCatalogue.itemName}</div>
                  <div><strong>Volume:</strong> {viewCatalogue.volumeOfMeasurement ?? '-'}</div>
                  <div><strong>Price:</strong> ₹{viewCatalogue.price}</div>
                  <div><strong>Stock:</strong> {viewCatalogue.stock ?? '-'}</div>
                  <div><strong>Barcode:</strong> {viewCatalogue.barcode ?? '-'}</div>
                  <div><strong>Expiry:</strong> {viewCatalogue.expiry ?? '-'}</div>
                </div>
                <div>
                  <div><strong>Status:</strong> {viewCatalogue.status?.toUpperCase() ?? '-'}</div>
                  {/* Category, Created At, and Updated At fields removed */}
                  {viewCatalogue.thumbnail && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Thumbnail:</strong>
                      <div style={{ marginTop: 6 }}>
                        <img src={viewCatalogue.thumbnail.startsWith('data:image') ? viewCatalogue.thumbnail : `http://localhost:5000${viewCatalogue.thumbnail}`} alt="Thumbnail" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, border: '1px solid #ccc' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCataloguePage;
