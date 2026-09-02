
import React, { useEffect, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { getOrganizations, updateOrganization } from './organizationApi';
import { Organization } from './types';
import AddOrganizationPage from './AddOrganizationPage';
import { SquarePen } from 'lucide-react';

const OrganizationModule: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Organization | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await getOrganizations();
      setOrganizations(res.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleEdit = (org: Organization) => {
    setEditData(org);
    setEditingId(org._id!);
  };

  // No status toggle for Organization (no status field)

  const handleEmailClick = (email: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `mailto:${email}`;
  };

  if (showAdd) {
    return <AddOrganizationPage onBack={() => { setShowAdd(false); fetchOrganizations(); }} />;
  }
  if (editingId && editData) {
    return <AddOrganizationPage onBack={() => { setEditingId(null); setEditData(null); fetchOrganizations(); }} editId={editingId} editData={editData} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32 }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>Organizations</h1>
          <div style={{ color: '#6c6c6c', fontSize: 16 }}>Manage your organization data and settings</div>
        </div>
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
          + Add Organization
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e6e6e6', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', color: '#374151', fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
                <th style={{ padding: 16, textAlign: 'left', borderTopLeftRadius: 8 }}>Organization Name</th>
                <th style={{ padding: 16, textAlign: 'left' }}>Organization ID</th>
                <th style={{ padding: 16, textAlign: 'left' }}>Contact Person</th>
                <th style={{ padding: 16, textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 16, textAlign: 'left' }}>Email</th>
                <th style={{ padding: 16, textAlign: 'left' }}>GST Number</th>
                <th style={{ padding: 16, textAlign: 'right', borderTopRightRadius: 8, width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6c6c6c' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTop: '2px solid #1a2c7fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Loading organizations...
                    </div>
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6c6c6c' }}>
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations.map(org => (
                  <tr key={org._id} style={{ borderBottom: '1px solid #f1f3f4', fontSize: 14 }}>
                    <td style={{ padding: 14 }}>{org.organizationName}</td>
                    <td style={{ padding: 14 }}>{org.organizationId}</td>
                    <td style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#1a2c7fff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {(() => {
                            const name = (org.contactPersonName || '').trim();
                            const parts = name.split(/\s+/).filter(Boolean);
                            const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
                            return initials.toUpperCase();
                          })()}
                        </div>
                        <span>{org.contactPersonName}</span>
                      </div>
                    </td>
                    <td style={{ padding: 14 }}>{org.contactNumber}</td>
                    <td style={{ padding: 14 }}>
                      <a href={`mailto:${org.email}`} onClick={e => handleEmailClick(org.email, e)} style={{ color: '#2563eb', textDecoration: 'none' }}>{org.email}</a>
                    </td>
                    <td style={{ padding: 14 }}>{org.gstNumber}</td>
                    <td style={{ padding: 14, textAlign: 'right', width: 120 }}>
                      <button onClick={() => handleEdit(org)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <SquarePen size={22} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrganizationModule;
