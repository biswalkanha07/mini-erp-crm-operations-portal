import React from 'react';
import CategoryModule from './category/CategoryModule';
import CatalogueModule from './catalogue/CatalogueModule';

const InventoryModule: React.FC = () => {
  const [tab, setTab] = React.useState<'category' | 'catalogue'>('category');
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>Inventory Management</h1>
      <div style={{ color: '#6c6c6c', marginBottom: 32 }}>Manage your categories and catalogue</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <button onClick={() => setTab('category')} style={{ padding: '12px 32px', background: tab==='category' ? '#7c4dff' : '#fff', color: tab==='category' ? '#fff' : '#7c4dff', border: '1px solid #7c4dff', borderRadius: 8, fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Category</button>
        <button onClick={() => setTab('catalogue')} style={{ padding: '12px 32px', background: tab==='catalogue' ? '#7c4dff' : '#fff', color: tab==='catalogue' ? '#fff' : '#7c4dff', border: '1px solid #7c4dff', borderRadius: 8, fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Catalogue</button>
      </div>
      {tab === 'category' ? <CategoryModule /> : <CatalogueModule />}
    </div>
  );
};

export default InventoryModule;
