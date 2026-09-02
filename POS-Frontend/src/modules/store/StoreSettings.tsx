import React, { useEffect, useState } from 'react';
import { storeAPI } from '../../api';
import { Store } from './types';

interface StoreSettingsProps {
  storeId: string;
}

const StoreSettings: React.FC<StoreSettingsProps> = ({ storeId }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await storeAPI.getById(storeId);
        setStore(res.data as Store);
      } catch (err: any) {
        setMessage(err.response?.data?.error || 'Failed to load store');
      }
    };
    if (storeId) load();
  }, [storeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!store) return;
    const { name, value } = e.target;
    if (name === 'discountRate') {
      setStore({ ...store, discountRate: Number(value) });
      return;
    }
    setStore({ ...store, [name]: value } as Store);
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    setMessage('');
    try {
      const id = store._id || store.storeId || storeId;
      if (!id) throw new Error('Store id missing');
      await storeAPI.update(id, {
        discountRate: store.discountRate ?? 0,
        profitMarginPercent: (store as any).profitMarginPercent ?? 0,
        theme: store.theme || 'light'
      });
      setMessage('Settings saved');
      // Reload to reflect server values
      const res = await storeAPI.getById(id);
      setStore(res.data as Store);
      // Persist to localStorage for app-wide theme and notify app
      try {
        localStorage.setItem('store', JSON.stringify(res.data));
      } catch {}
      window.dispatchEvent(new CustomEvent('storeThemeUpdated', { detail: { theme: res.data.theme || 'light' } }));
      // Broadcast full store settings update (includes profitMarginPercent)
      window.dispatchEvent(new CustomEvent('storeSettingsUpdated', { detail: { store: res.data } }));
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };


  if (!store) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>Store Settings</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>Store Settings</h1>
      <div style={{ color: '#6c6c6c', marginBottom: 24 }}>Configure discount and theme.</div>

      {message && (
        <div style={{
          marginBottom: 16,
          padding: '10px 12px',
          borderRadius: 6,
          background: message.includes('fail') || message.includes('error') ? '#ffe8e8' : '#e8f5e8',
          color: message.includes('fail') || message.includes('error') ? '#b71c1c' : '#2e7d32'
        }}>{message}</div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', padding: 24, maxWidth: 600 }}>
  <div style={{ display: 'flex', gap: 40, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>Discount (%)</label>
            <input name="discountRate" type="number" min={0} max={100} step={0.01} value={store.discountRate ?? 0} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
            <div style={{ fontSize: 12, color: '#6c6c6c', marginTop: 6 }}>Optional global discount applied at POS.</div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>Theme</label>
            <select name="theme" value={store.theme || 'light'} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <div style={{ fontSize: 12, color: '#6c6c6c', marginTop: 6 }}>Personalize the POS look & feel.</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', background: '#6c3fc5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreSettings;


