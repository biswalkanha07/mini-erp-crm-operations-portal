import React, { useEffect, useState } from 'react';
import { api } from '../api'; 
interface PromoCode {
  _id?: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive?: boolean;
}

const PromoCodeManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [form, setForm] = useState<PromoCode>({ code: '', discountType: 'percentage', discountValue: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPromoCodes = async () => {
    setLoading(true);
    const res = await api.get('/promo-codes');
    setPromoCodes(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchPromoCodes(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/promo-codes/${editingId}`, form);
    } else {
      await api.post('/promo-codes', form);
    }
    setForm({ code: '', discountType: 'percentage', discountValue: 0 });
    setEditingId(null);
    fetchPromoCodes();
  };

  const handleEdit = (promo: PromoCode) => {
    setForm(promo);
    setEditingId(promo._id || null);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/promo-codes/${id}`);
    fetchPromoCodes();
  };

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Promo Code Management</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28 }}>
        <input name="code" placeholder="Code" value={form.code} onChange={handleChange} required style={{ minWidth: 120, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
        <select name="discountType" value={form.discountType} onChange={handleChange} style={{ minWidth: 120, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <input name="discountValue" type="number" placeholder="Value" value={form.discountValue} onChange={handleChange} required style={{ minWidth: 100, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
        <input name="description" placeholder="Description" value={form.description || ''} onChange={handleChange} style={{ minWidth: 160, flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
        <input name="expiryDate" type="date" value={form.expiryDate ? form.expiryDate.slice(0,10) : ''} onChange={handleChange} style={{ minWidth: 140, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
        <input name="usageLimit" type="number" placeholder="Usage Limit" value={form.usageLimit || ''} onChange={handleChange} style={{ minWidth: 120, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
        <button type="submit" style={{ background: '#6c3fc5', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{editingId ? 'Update' : 'Add'} Promo Code</button>
        {editingId && <button type="button" onClick={() => { setForm({ code: '', discountType: 'percentage', discountValue: 0 }); setEditingId(null); }} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '10px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Cancel</button>}
      </form>
      <div style={{ marginBottom: 18 }} />
      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Value</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Expiry</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Usage</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Active</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map(promo => (
                <tr key={promo._id} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                  <td style={{ padding: '10px 8px' }}>{promo.code}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{promo.discountType}</td>
                  <td style={{ padding: '10px 8px' }}>{promo.discountValue}</td>
                  <td style={{ padding: '10px 8px' }}>{promo.description}</td>
                  <td style={{ padding: '10px 8px' }}>{promo.expiryDate ? promo.expiryDate.slice(0,10) : ''}</td>
                  <td style={{ padding: '10px 8px' }}>{promo.usedCount || 0}/{promo.usageLimit || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{promo.isActive ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <button onClick={() => handleEdit(promo)} style={{ background: '#6c3fc5', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 14px', fontWeight: 500, fontSize: 14, marginRight: 6, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(promo._id!)} style={{ background: '#ff5252', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 14px', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManagement;
