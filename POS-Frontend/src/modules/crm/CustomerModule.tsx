import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { Customer, CustomerFollowUp, CustomerType, CustomerStatus } from './types';
import { customerApi } from './customerApi';
import { normalizeRole } from '../../utils/roleUtils';

interface CustomerModuleProps {
  userRole?: string;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({ userRole = 'Admin' }) => {
  const canonicalRole = normalizeRole(userRole || localStorage.getItem('userRole'));
  const canEdit = canonicalRole === 'Admin' || canonicalRole === 'Sales';
  const canDelete = canonicalRole === 'Admin';

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Follow-ups state inside details modal
  const [followups, setFollowups] = useState<CustomerFollowUp[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newFollowUpNotes, setNewFollowUpNotes] = useState('');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'Retail' as CustomerType,
    address: '',
    status: 'Active' as CustomerStatus,
    followUpDate: '',
    notes: ''
  });

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await customerApi.getCustomers({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined
      });
      if (resp.data && resp.data.success) {
        setCustomers(resp.data.data);
        setTotalPages(resp.data.pagination.totalPages);
        setTotalCount(resp.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Load Follow-ups for selected customer
  const loadFollowups = async (customerId: string) => {
    setLoadingFollowups(true);
    try {
      const resp = await customerApi.getFollowUps(customerId);
      if (resp.data && resp.data.success) {
        setFollowups(resp.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load followups:', err);
    } finally {
      setLoadingFollowups(false);
    }
  };

  // Open Details Modal
  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    setNewFollowUpDate('');
    setNewFollowUpNotes('');
    loadFollowups(customer.id);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      type: 'Retail',
      address: '',
      status: 'Active',
      followUpDate: '',
      notes: ''
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      mobile: customer.mobile || customer.phone || '',
      email: customer.email || '',
      businessName: customer.businessName || '',
      gstNumber: customer.gstNumber || '',
      type: customer.type || 'Retail',
      address: customer.address || '',
      status: customer.status || 'Active',
      followUpDate: customer.followUpDate || '',
      notes: customer.notes || ''
    });
    setShowAddEditModal(true);
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.mobile.trim()) {
      setError('Mobile number is required');
      return;
    }

    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, formData);
        setSuccessMsg('Customer updated successfully');
      } else {
        await customerApi.createCustomer(formData);
        setSuccessMsg('Customer created successfully');
      }
      setShowAddEditModal(false);
      fetchCustomers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save customer');
    }
  };

  // Deactivate Customer
  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate customer "${name}"?`)) {
      return;
    }
    try {
      await customerApi.deleteCustomer(id);
      setSuccessMsg('Customer deactivated successfully');
      fetchCustomers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deactivate customer');
    }
  };

  // Add Follow-up
  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!newFollowUpDate) {
      alert('Please select a follow-up date');
      return;
    }
    if (!newFollowUpNotes.trim()) {
      alert('Please enter follow-up notes');
      return;
    }

    setFollowUpSubmitting(true);
    try {
      await customerApi.addFollowUp(selectedCustomer.id, {
        followUpDate: newFollowUpDate,
        notes: newFollowUpNotes.trim()
      });
      // Refresh follow-ups and update selected customer's follow-up date
      loadFollowups(selectedCustomer.id);
      setSelectedCustomer({
        ...selectedCustomer,
        followUpDate: newFollowUpDate
      });
      setNewFollowUpDate('');
      setNewFollowUpNotes('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add follow-up');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#333' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a202c',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 0 4px 0'
          }}>
            <FiUsers style={{ color: '#e53e3e' }} /> CRM & Customers
          </h1>
          <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
            Manage wholesale, distributor & retail clients and track customer follow-up notes.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#e53e3e',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(229, 62, 62, 0.2)'
            }}
          >
            <FiPlus size={18} /> Add Customer
          </button>
        )}
      </div>

      {/* Success & Error Banners */}
      {successMsg && (
        <div style={{
          backgroundColor: '#c6f6d5',
          color: '#22543d',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FiCheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fed7d7',
          color: '#742a2a',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiAlertCircle size={18} /> {error}
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#742a2a' }}
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#fff',
        padding: '16px',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <FiSearch style={{ position: 'absolute', left: '12px', top: '11px', color: '#a0aec0' }} />
          <input
            type="text"
            placeholder="Search by name, mobile, email, or business..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#4a5568' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Lead">Lead</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#4a5568' }}>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc', borderBottom: '1px solid #edf2f7', color: '#4a5568' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Customer Name</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Contact / Mobile</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Business / GST</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Next Follow-up</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#718096' }}>
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
                    <FiUsers size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: '500' }}>No customers found</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #edf2f7',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>{c.name}</div>
                      {c.email && (
                        <div style={{ fontSize: '12px', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiMail size={11} /> {c.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2d3748' }}>
                        <FiPhone size={12} color="#718096" />
                        <span>{c.mobile || c.phone || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#2d3748' }}>{c.businessName || '—'}</div>
                      {c.gstNumber && (
                        <div style={{ fontSize: '11px', color: '#718096' }}>GST: {c.gstNumber}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: c.type === 'Wholesale' ? '#ebf8ff' : c.type === 'Distributor' ? '#faf5ff' : '#f0fff4',
                        color: c.type === 'Wholesale' ? '#2b6cb0' : c.type === 'Distributor' ? '#6b46c1' : '#276749'
                      }}>
                        {c.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: c.status === 'Active' ? '#c6f6d5' : c.status === 'Lead' ? '#feebc8' : '#edf2f7',
                        color: c.status === 'Active' ? '#22543d' : c.status === 'Lead' ? '#744210' : '#4a5568'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.followUpDate ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#fefcbf',
                          color: '#744210',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          <FiCalendar size={12} /> {c.followUpDate}
                        </span>
                      ) : (
                        <span style={{ color: '#a0aec0', fontSize: '12px' }}>None scheduled</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenDetails(c)}
                          title="View Details & Follow-ups"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#edf2f7',
                            color: '#2d3748',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FiEye size={14} /> Details
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e0',
                              backgroundColor: '#fff',
                              color: '#2b6cb0',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FiEdit2 size={13} />
                          </button>
                        )}
                        {canDelete && c.status !== 'Inactive' && (
                          <button
                            onClick={() => handleDeactivate(c.id, c.name)}
                            title="Deactivate Customer"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #feb2b2',
                              backgroundColor: '#fff',
                              color: '#e53e3e',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          borderTop: '1px solid #edf2f7',
          color: '#718096',
          fontSize: '13px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            Showing <b>{customers.length}</b> of <b>{totalCount}</b> customers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: page <= 1 ? '#f7fafc' : '#fff',
                color: page <= 1 ? '#cbd5e0' : '#4a5568',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <FiChevronLeft size={16} /> Previous
            </button>
            <span>
              Page <b>{page}</b> of <b>{totalPages}</b>
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: page >= totalPages ? '#f7fafc' : '#fff',
                color: page >= totalPages ? '#cbd5e0' : '#4a5568',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {showAddEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a202c' }}>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Customer Name <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Mobile Number <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. client@domain.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Sharma Traders"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Customer Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomerType })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Lead">Lead</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, city, state"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e0',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>
                  Notes / Requirements
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes about client requirements or terms..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e0',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e0',
                    backgroundColor: '#fff',
                    color: '#4a5568',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#e53e3e',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS & FOLLOW-UPS MODAL */}
      {showDetailModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid #edf2f7',
              paddingBottom: '14px',
              marginBottom: '18px'
            }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#1a202c' }}>
                  {selectedCustomer.name}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: selectedCustomer.status === 'Active' ? '#c6f6d5' : '#feebc8',
                    color: selectedCustomer.status === 'Active' ? '#22543d' : '#744210'
                  }}>
                    {selectedCustomer.status}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#ebf8ff',
                    color: '#2b6cb0'
                  }}>
                    {selectedCustomer.type}
                  </span>
                  {selectedCustomer.businessName && (
                    <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>
                      • {selectedCustomer.businessName}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096' }}
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Customer Information Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '22px',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Mobile</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>{selectedCustomer.mobile || selectedCustomer.phone || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Email</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>{selectedCustomer.email || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>GST Number</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>{selectedCustomer.gstNumber || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Address</span>
                <span style={{ fontWeight: '500', color: '#2d3748' }}>{selectedCustomer.address || '—'}</span>
              </div>
            </div>

            {/* Follow-up Management Section */}
            <div style={{ marginTop: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2d3748',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FiClock style={{ color: '#e53e3e' }} /> Follow-up History
                </h3>
              </div>

              {/* Add Follow-up Form (for Admin / Sales) */}
              {canEdit && (
                <form
                  onSubmit={handleAddFollowUp}
                  style={{
                    backgroundColor: '#fffaf0',
                    border: '1px solid #feebc8',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '18px'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#744210', marginBottom: '8px' }}>
                    + Record Next Follow-up
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '10px', alignItems: 'flex-start' }}>
                    <div>
                      <input
                        type="date"
                        required
                        value={newFollowUpDate}
                        onChange={(e) => setNewFollowUpDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e0',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Enter follow-up notes (e.g. called client, discussed bulk price)..."
                        value={newFollowUpNotes}
                        onChange={(e) => setNewFollowUpNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e0',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={followUpSubmitting}
                      style={{
                        padding: '7px 16px',
                        backgroundColor: '#dd6b20',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: followUpSubmitting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {followUpSubmitting ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </form>
              )}

              {/* Append-Only Follow-up History Timeline */}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {loadingFollowups ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718096', fontSize: '13px' }}>
                    Loading follow-up history...
                  </div>
                ) : followups.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#a0aec0',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    No follow-ups recorded yet for this customer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {followups.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          backgroundColor: '#f7fafc',
                          borderLeft: '4px solid #dd6b20',
                          padding: '10px 14px',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiCalendar size={13} color="#dd6b20" /> Next Follow-up: {f.followUpDate}
                          </span>
                          <span style={{ fontSize: '11px', color: '#718096' }}>
                            {f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <div style={{ color: '#4a5568', whiteSpace: 'pre-wrap' }}>
                          {f.notes || f.note}
                        </div>
                        {f.createdByName && (
                          <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>
                            Recorded by: <b>{f.createdByName}</b>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  backgroundColor: '#edf2f7',
                  color: '#2d3748',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerModule;
