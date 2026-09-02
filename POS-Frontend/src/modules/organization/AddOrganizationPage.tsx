
import React, { useState, useEffect } from 'react';
import { createOrganization, updateOrganization } from './organizationApi';
import { compressImage } from '../../utils/imageCompression';
import { Organization } from './types';

const initialState: Organization = {
  organizationId: '',
  organizationName: '',
  address: {
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  },
  contactPersonName: '',
  contactNumber: '',
  email: '',
  gstNumber: '',
  panNumber: '',
  logo: '',
};

interface AddOrganizationPageProps {
  onBack: () => void;
  editId?: string;
  editData?: Organization;
}

const AddOrganizationPage: React.FC<AddOrganizationPageProps> = ({ onBack, editId, editData }) => {
  const [form, setForm] = useState<Organization>(initialState);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    let errorMsg = '';

    // Address fields
    if (name.startsWith('address.')) {
      const addrField = name.split('.')[1];
      setForm({ ...form, address: { ...(form.address || {} as any), [addrField]: newValue } as Organization['address'] });
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
      return;
    }

    if (name === 'organizationId') {
      if (/[^a-zA-Z0-9]/.test(value)) {
        errorMsg = 'Special characters not allowed';
        newValue = value.replace(/[^a-zA-Z0-9]/g, '');
      }
    }
    if (name === 'contactNumber') {
      if (/[^0-9]/.test(value)) {
        errorMsg = 'Only integers allowed';
        newValue = value.replace(/[^0-9]/g, '');
      }
      newValue = newValue.slice(0, 10);
    }
    if (name === 'contactPersonName') {
      if (/[^a-zA-Z\s]/.test(value)) {
        errorMsg = 'Only alphabets allowed';
        newValue = value.replace(/[^a-zA-Z\s]/g, '');
      }
    }
    if (name === 'panNumber') {
      if (/[^A-Z0-9]/.test(value) || /[a-z]/.test(value)) {
        errorMsg = 'Special character and lowercase letters are not allowed';
        newValue = value.replace(/[^A-Z0-9]/g, '').replace(/[a-z]/g, '');
      }
    }
    if (name === 'gstNumber') {
      if (/[^A-Z0-9]/.test(value) || /[a-z]/.test(value)) {
        errorMsg = 'Special character and lowercase letters are not allowed';
        newValue = value.replace(/[^A-Z0-9]/g, '').replace(/[a-z]/g, '');
      }
    }
    if (name === 'email') {
      if (/[^a-z0-9@\-_.+]/.test(value) || /[A-Z]/.test(value)) {
        errorMsg = 'Only lowercase letters, numbers, and @  -  _  +  . are allowed';
        newValue = value.replace(/[^a-z0-9@\-_.+]/g, '').replace(/[A-Z]/g, '');
      }
    }

    setForm({ ...form, [name]: newValue });
    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Logo file selected:', file.name, file.size, file.type);
      
      setLogoFile(file);
      
      try {
        console.log(`Compressing logo: ${file.name}, original size: ${(file.size / 1024).toFixed(2)}KB`);
        const compressedBase64 = await compressImage(file, 100);
        console.log(`Compressed logo size: ${(compressedBase64.length * 0.75 / 1024).toFixed(2)}KB`);
        setForm(prev => ({ ...prev, logo: compressedBase64 }));
      } catch (error) {
        console.error('Error compressing logo:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm(prev => ({ ...prev, logo: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const requiredMessages: Record<string, string> = {
    organizationName: 'Organization name is required',
    organizationId: 'Organization ID is required',
    'address.addressLine1': 'Address Line 1 is required',
    'address.city': 'City is required',
    'address.state': 'State is required',
    'address.country': 'Country is required',
    'address.pincode': 'Pincode is required',
    contactPersonName: 'Contact person name is required',
    contactNumber: 'Contact number is required',
    email: 'Email is required',
    gstNumber: 'GST number is required',
    panNumber: 'PAN number is required',
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let msg = '';
    if (!value || value.trim() === '') {
      msg = requiredMessages[name] || 'Required';
    } else {
      if (name === 'organizationId' && !/^[a-zA-Z0-9]+$/.test(value)) msg = 'Special characters not allowed';
      if (name === 'contactNumber' && !/^\d{10}$/.test(value)) msg = 'Phone must be 10 digits';
      if (name === 'contactPersonName' && !/^[a-zA-Z\s]+$/.test(value)) msg = 'Only alphabets allowed';
      if (name === 'panNumber' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) msg = 'PAN Number must be in valid format (e.g., AAAAA0000A)';
      if (name === 'gstNumber' && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) msg = 'GST Number must be in valid format (e.g., 22AAAAA0000A1Z5)';
      if (name === 'email' && !/^[a-z0-9@\-_.+]+$/.test(value)) msg = 'Only lowercase letters, numbers, and @ - _ + . allowed';
      if (name.startsWith('address.') && !value.trim()) msg = requiredMessages[name] || 'Required';
    }
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
  };

  // Step validation
  const validateStep = (stepNum: number) => {
    const errors: Record<string, string> = {};
    if (stepNum === 1) {
      // Company + Address
      ['organizationName', 'organizationId', 'address.addressLine1', 'address.city', 'address.state', 'address.country', 'address.pincode'].forEach((field) => {
        let value;
        if (field.startsWith('address.')) {
          value = (form.address as any)[field.split('.')[1]];
        } else {
          value = (form as any)[field];
        }
        if (!value || String(value).trim() === '') {
          errors[field] = requiredMessages[field];
        }
      });
    } else if (stepNum === 2) {
      // Contact + Tax
      ['contactPersonName', 'contactNumber', 'email', 'gstNumber', 'panNumber'].forEach((field) => {
        const value = (form as any)[field];
        if (!value || String(value).trim() === '') {
          errors[field] = requiredMessages[field];
        }
      });
    }
    setFieldErrors(errors);
    setError('');
    return Object.keys(errors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(1)) {
      setStep(2);
    }
  };

  const handlePrev = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await updateOrganization(editId, form);
        setSuccess('Organization updated successfully!');
      } else {
        await createOrganization(form);
        setSuccess('Organization added successfully!');
      }
      setTimeout(() => {
        setForm(initialState);
        setLogoFile(null);
        onBack();
      }, 2000);
    } catch (error) {
      setError('Failed to save organization. Please try again.');
    }
  };

  return (
    <div style={{ padding: '32px 0', background: '#f8f9fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 15, color: '#6c6c6c', marginBottom: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={onBack}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{'←'}</span> Back to Organization
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>{editId ? 'Edit Organization' : 'Add Organization'}</h1>
        <div style={{ color: '#6c6c6c', marginBottom: 32 }}>{editId ? 'Edit the organization details' : 'Add a new organization to your POS system'}</div>
        
        {success && (
          <div style={{ 
            background: '#f0f9f0', 
            border: '1px solid #4caf50', 
            borderRadius: 8, 
            padding: '12px 16px', 
            marginBottom: 24, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            maxWidth: 900,
            margin: '0 auto 24px auto'
          }}>
            <div style={{ 
              width: 20, 
              height: 20, 
              background: '#4caf50', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
              </svg>
            </div>
            <span style={{ color: '#2e7d32', fontWeight: 500 }}>{success}</span>
          </div>
        )}
        
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px #e6e6e6', padding: 40, maxWidth: 900, margin: '0 auto' }}>
          {step === 1 && (
            <form onSubmit={handleNext}>
              {/* Defensive: ensure address is always defined */}
              {form.address == null && (setForm(f => ({ ...f, address: { addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', country: '', pincode: '' } })), null)}
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 32 }}>Company Information</div>
              <div style={{ display: 'flex', gap: 42, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Organization Name <span style={{ color: 'red' }}>*</span></label>
                  <input name="organizationName" placeholder="Enter organization name" value={form.organizationName} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors.organizationName && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.organizationName}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Organization ID <span style={{ color: 'red' }}>*</span></label>
                  <input name="organizationId" placeholder="Enter organization ID" value={form.organizationId} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors.organizationId && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.organizationId}</div>}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 32 }}>Address Information</div>
              <div style={{ display: 'flex', gap: 42, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Address Line 1 <span style={{ color: 'red' }}>*</span></label>
                  <input name="address.addressLine1" placeholder="Address Line 1" value={form.address?.addressLine1 || ''} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors['address.addressLine1'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.addressLine1']}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Address Line 2</label>
                  <input name="address.addressLine2" placeholder="Address Line 2" value={form.address?.addressLine2 || ''} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 42, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Landmark</label>
                  <input name="address.landmark" placeholder="Landmark" value={form.address?.landmark || ''} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>City <span style={{ color: 'red' }}>*</span></label>
                  <input name="address.city" placeholder="City" value={form.address?.city || ''} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors['address.city'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.city']}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 42, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>State <span style={{ color: 'red' }}>*</span></label>
                  <input name="address.state" placeholder="State" value={form.address?.state || ''} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors['address.state'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.state']}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Country <span style={{ color: 'red' }}>*</span></label>
                  <input name="address.country" placeholder="Country" value={form.address?.country || ''} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors['address.country'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.country']}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 42, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Pincode <span style={{ color: 'red' }}>*</span></label>
                  <input name="address.pincode" placeholder="Pincode (6 digits)" value={form.address?.pincode || ''} onChange={handleChange} onBlur={handleBlur} required maxLength={6} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 16 }} />
                  {fieldErrors['address.pincode'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.pincode']}</div>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <label style={{ fontWeight: 500 }}>Logo</label>
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'block', marginTop: 6 }} />
                  {form.logo && (
                    <img 
                      src={form.logo} 
                      alt="Logo Preview" 
                      style={{ 
                        width: 100, 
                        height: 100, 
                        objectFit: 'cover', 
                        marginTop: 12, 
                        borderRadius: 8,
                        border: '1px solid #ddd'
                      }} 
                    />
                  )}
                </div>
              </div>
              {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 40 }}>
                <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#1a2c7fff', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 17, padding: '12px 40px', cursor: 'pointer' }}>Next</button>
              </div>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Contact Information</div>
              <div style={{ display: 'flex', gap: 34, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Contact Person Name <span style={{ color: 'red' }}>*</span></label>
                  <input name="contactPersonName" placeholder="Enter contact person name" value={form.contactPersonName} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  {fieldErrors.contactPersonName && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.contactPersonName}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Contact Number <span style={{ color: 'red' }}>*</span></label>
                  <input name="contactNumber" placeholder="Phone (10 digits)" value={form.contactNumber} onChange={handleChange} onBlur={handleBlur} required maxLength={10} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  {fieldErrors.contactNumber && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.contactNumber}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 34, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>Email <span style={{ color: 'red' }}>*</span></label>
                  <input name="email" placeholder="Enter organization email" value={form.email} onChange={handleChange} onBlur={handleBlur} required type="text" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  {fieldErrors.email && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.email}</div>}
                </div>
                <div style={{ flex: 1 }}></div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Tax Information</div>
              <div style={{ display: 'flex', gap: 34, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>GST Number <span style={{ color: 'red' }}>*</span></label>
                  <input name="gstNumber" placeholder="e.g., 22AAAAA0000A1Z5" value={form.gstNumber} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  {fieldErrors.gstNumber && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.gstNumber}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500 }}>PAN Number <span style={{ color: 'red' }}>*</span></label>
                  <input name="panNumber" placeholder="e.g., AAAAA0000A" value={form.panNumber} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  {fieldErrors.panNumber && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.panNumber}</div>}
                </div>
              </div>
              {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 32 }}>
                <button type="button" onClick={handlePrev} style={{ background: 'none', border: 'none', color: '#1a2c7fff', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Back</button>
                <div>
                  <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#1a2c7fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginRight: 16 }}>Cancel</button>
                  <button type="submit" style={{ background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '10px 32px', cursor: 'pointer' }}>{editId ? 'Update Organization' : 'Add Organization'}</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOrganizationPage;
