
import React, { useState, useEffect } from 'react';
import { createStore, updateStore } from './storeApi';
// import storeApi from './storeApi';
import { getOrganizations } from '../organization/organizationApi';
import { compressImage } from '../../utils/imageCompression';
import { Store, StoreCreationResponse } from './types';
import { Organization } from '../organization/types';
import MapPicker from '../../components/MapPicker';
import ImageCropper from '../../components/ImageCropper';

const initialState: Store = {
  storeName: '',
  storeLocation: '',
  latitude: null,
  longitude: null,
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
  storePicture: null,
  status: 'active',
  organizationId: '',
  // gstRate removed - GST is now per product
  bankDetails: {
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',
  },
};


interface AddStorePageProps {
  onBack: () => void;
  editId?: string;
  editData?: Store;
  user?: any; // User object from App.tsx
}

const AddStorePage: React.FC<AddStorePageProps> = ({ onBack, editId, editData, user }) => {
  const [form, setForm] = useState<Store>(initialState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [storePicture, setStorePicture] = useState<File | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  

  useEffect(() => {
    if (editData) {
      console.log('Setting form data from editData:', editData);
      setForm(editData);
      // Always start on Step 1 when entering edit mode
      setStep(1);
    } else if (user && user.userType === 'organization' && user.organization) {
      // Set default organizationId for organization users
      console.log('Setting default organizationId from user:', user.organization._id);
      setForm(prev => ({ ...prev, organizationId: user.organization._id }));
    }
  }, [editData, user]);

  // Debug form state changes
  useEffect(() => {
    console.log('Form state changed:', form);
  }, [form]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        console.log('Fetching organizations...');
        setLoadingOrganizations(true);
        const res = await getOrganizations();
        console.log('Organizations response:', res);
        console.log('Organizations data:', res.data);
        setOrganizations(res.data as Organization[]);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setError('Failed to load organizations. Please refresh the page.');
      } finally {
        setLoadingOrganizations(false);
      }
    };
    fetchOrganizations();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    let errorMsg = '';

    

    // if (name === 'storeId') {
    //   // Only allow alphanumeric
    //   if (/[^a-zA-Z0-9]/.test(value)) {
    //     errorMsg = 'Special characters not allowed';
    //     newValue = value.replace(/[^a-zA-Z0-9]/g, '');
    //   }
    // }


    if (name === 'contactPersonName') {
      // Only allow alphabets and spaces
      if (/[^a-zA-Z\s]/.test(value)) {
        errorMsg = 'Only alphabets allowed';
        newValue = value.replace(/[^a-zA-Z\s]/g, '');
      }
    }
    if (name === 'contactNumber') {
      // Only allow digits, max 10
      if (/[^0-9]/.test(value)) {
        errorMsg = 'Only integers allowed';
        newValue = value.replace(/[^0-9]/g, '');
      }
      newValue = newValue.slice(0, 10);
    }
    if (name === 'email') {
      // Only allow lowercase, @ - _ + .
      if (/[^a-z0-9@\-_.+]/.test(value) || /[A-Z]/.test(value)) {
        errorMsg = 'Only lowercase letters, numbers, and @ - _ + . allowed';
        newValue = value.replace(/[^a-z0-9@\-_.+]/g, '').replace(/[A-Z]/g, '');
      }
    }
    // gstRate removed

    // Nested structures
    if (name.startsWith('address.')) {
      const key = name.split('.')[1] as keyof NonNullable<Store['address']>;
      setForm({ ...form, address: { ...(form.address || {} as any), [key]: newValue } as Store['address'] });
      setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
      return;
    }
    if (name.startsWith('bankDetails.')) {
      const key = name.split('.')[1] as keyof NonNullable<Store['bankDetails']>;
      const v = key === 'ifscCode' ? newValue.toUpperCase() : newValue;
      setForm({ ...form, bankDetails: { ...(form.bankDetails || {} as any), [key]: v } as Store['bankDetails'] });
      setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
      return;
    }

    setForm({ ...form, [name]: newValue });
    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const requiredMessages: Record<string, string> = {
    storeName: 'Store name is required',
    storeLocation: 'Location is required',
    'address.addressLine1': 'Address line 1 is required',
    'address.city': 'City is required',
    'address.state': 'State is required',
    'address.country': 'Country is required',
    'address.pincode': 'Pincode is required',
    contactPersonName: 'Contact name is required',
    contactNumber: 'Contact number is required',
    email: 'Email is required',
    organizationId: 'Organization is required',
    // gstRate removed
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Store picture file selected:', file.name, file.size, file.type);
      
      setStorePicture(file);
      
      // Create object URL for cropping
      const imageUrl = URL.createObjectURL(file);
      setImageToCrop(imageUrl);
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      // Convert the cropped image URL to a File object
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      // Compress the cropped image
      console.log(`Compressing cropped store image: ${file.name}, original size: ${(file.size / 1024).toFixed(2)}KB`);
      const compressedBase64 = await compressImage(file, 100);
      console.log(`Compressed store image size: ${(compressedBase64.length * 0.75 / 1024).toFixed(2)}KB`);
      
      setForm(prev => ({ ...prev, storePicture: compressedBase64 }));
      setShowCropper(false);
      
      // Clean up the object URL
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop('');
    } catch (error) {
      console.error('Error processing cropped image:', error);
      setError('Failed to process the cropped image. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // Clean up the object URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop('');
    }
    // Reset the file input
    setStorePicture(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let msg = '';
    if (!value || String(value).trim() === '') {
      msg = requiredMessages[name] || 'Required';
    } else {
      if (name === 'contactPersonName' && !/^[a-zA-Z\s]+$/.test(value)) msg = 'Only alphabets allowed';
      if (name === 'contactNumber' && !/^\d{10}$/.test(value)) msg = 'Contact number must be 10 digits';
      if (name === 'email' && !/^[a-z0-9@\-_.+]+$/.test(value)) msg = 'Only lowercase letters, numbers, and @ - _ + . allowed';
      // gstRate removed
      if (name === 'address.pincode' && !/^\d{6}$/.test(value)) msg = 'Pincode must be 6 digits';
      if (name === 'bankDetails.ifscCode' && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) msg = 'Invalid IFSC code';
    }
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    Object.keys(requiredMessages).forEach((field) => {
      let value: any;
      if (field.startsWith('address.')) {
        const key = field.split('.')[1] as keyof NonNullable<Store['address']>;
        value = form.address ? (form.address as any)[key] : '';
      } else {
        value = (form as any)[field];
      }
      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field] = requiredMessages[field];
      }
    });
    if (form.contactPersonName && !/^[a-zA-Z\s]+$/.test(form.contactPersonName)) errors.contactPersonName = 'Only alphabets allowed';
    if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber)) errors.contactNumber = 'Contact number must be 10 digits';
    if (form.email && !/^[a-z0-9@\-_.+]+$/.test(form.email)) errors.email = 'Only lowercase letters, numbers, and @ - _ + . allowed';
    // gstRate removed
    if (form.address?.pincode && !/^\d{6}$/.test(form.address.pincode)) errors['address.pincode'] = 'Pincode must be 6 digits';
    if (form.bankDetails?.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankDetails.ifscCode)) errors['bankDetails.ifscCode'] = 'Invalid IFSC code';

    setFieldErrors(errors);
    setError('');
    return Object.keys(errors).length === 0;
  };

  const validateStep = (currentStep: 1 | 2) => {
    const stepFields: Record<1 | 2, string[]> = {
      1: ['storeName','storeLocation','address.addressLine1','address.city','address.state','address.country','address.pincode','organizationId'],
      2: ['contactPersonName','contactNumber','email'],
    };
    const errors: Record<string, string> = {};
    stepFields[currentStep].forEach((field) => {
      let value: any;
      if (field.startsWith('address.')) {
        const key = field.split('.')[1] as keyof NonNullable<Store['address']>;
        value = form.address ? (form.address as any)[key] : '';
      } else {
        value = (form as any)[field];
      }
      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field] = requiredMessages[field] || 'Required';
      }
    });
    if (currentStep === 1) {
      // gstRate removed
      if (form.address?.pincode && !/^\d{6}$/.test(form.address.pincode)) errors['address.pincode'] = 'Pincode must be 6 digits';
    }
    if (currentStep === 2) {
      if (form.contactPersonName && !/^[a-zA-Z\s]+$/.test(form.contactPersonName)) errors.contactPersonName = 'Only alphabets allowed';
      if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber)) errors.contactNumber = 'Contact number must be 10 digits';
      if (form.email && !/^[a-z0-9@\-_.+]+$/.test(form.email)) errors.email = 'Only lowercase letters, numbers, and @ - _ + . allowed';
      if (form.bankDetails?.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankDetails.ifscCode)) errors['bankDetails.ifscCode'] = 'Invalid IFSC code';
    }
    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Only save on step 2
    if (step !== 2) return;
    if (!validate()) return;

    setError('');
    setSuccess('');

    try {
      if (editId) {
        await updateStore(editId, form);
        setSuccess('Store updated successfully!');
      } else {
        const response = await createStore(form);
        const data: StoreCreationResponse = response.data;

        if (data.success) {
          setSuccess(`Store created successfully! Store ID: ${data.store.storeId}. ${data.emailSent ? 'Signup email sent to contact person.' : 'Email notification failed, but store was created.'}`);
        } else {
          setError(data.message || 'Failed to create store');
        }
      }

      setTimeout(() => {
        setForm(initialState);
        setStorePicture(null);
        onBack();
      }, 2000);
    } catch (err: any) {
      console.error('Store operation error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred');
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 1) {
        if (validateStep(1)) setStep(2);
      }
      // On step 2, Enter should not trigger submit - only the Update button should
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setGettingLocation(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location obtained:', { latitude, longitude });
        
        setForm(prev => ({
          ...prev,
          latitude,
          longitude
        }));

        // Reverse geocode to get address
        try {
          await reverseGeocode(latitude, longitude);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setSuccess(`Location captured successfully! (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        setError(errorMessage);
        setGettingLocation(false);
      },
      options
    );
  };

  // Map geocoding API response to address fields
  const mapGeocodeToAddress = (components: any) => {
    return {
      addressLine1: (components.road || components.street || components.house_number || '') + (components.road || components.street ? (components.house_number ? ', ' + components.house_number : '') : ''),
      addressLine2: components.neighbourhood || components.suburb || components.locality || '',
      landmark: components.point_of_interest || components.attraction || components.building || '',
      city: components.city || components.town || components.village || components.locality || '',
      state: components.state || components.region || components.administrative_area_level_1 || '',
      country: components.country || '',
      pincode: components.postcode || components.postal_code || ''
    };
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY&limit=1`
      );
      if (!response.ok) {
        // Fallback to a simpler service
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const addr = mapGeocodeToAddress(data.address || {});
          updateAddressFromGeocode(addr, data.display_name);
        }
        return;
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addr = mapGeocodeToAddress(result.components || {});
        updateAddressFromGeocode(addr, result.formatted);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Accepts already mapped address object
  const updateAddressFromGeocode = (addressObj: any, formatted: string) => {
    setForm(prev => ({
      ...prev,
      storeLocation: formatted || `${prev.latitude?.toFixed(6)}, ${prev.longitude?.toFixed(6)}`,
      address: {
        ...prev.address,
        ...addressObj
      } as Store['address']
    }));
    setSuccess(`Location and address updated successfully!`);
  };

  const openMapPicker = () => {
    setShowMap(true);
  };

  const handleMapLocationSelect = async (lat: number, lng: number, address: string) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      storeLocation: address
    }));
    setShowMap(false);
    try {
      await reverseGeocode(lat, lng);
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      setSuccess(`Location selected from map! (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    }
  };

  return (
    <>
      {/* Spinning animation CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Map Picker */}
      {showMap && (
        <MapPicker
          onLocationSelect={handleMapLocationSelect}
          onClose={() => setShowMap(false)}
          initialLat={form.latitude || undefined}
          initialLng={form.longitude || undefined}
        />
      )}

    <div style={{ padding: '32px 0', background: '#f8f9fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 15, color: '#6c6c6c', marginBottom: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={onBack}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{'←'}</span> Back to Store
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>{editId ? 'Edit Store' : 'Add Store'}</h1>
        <div style={{ color: '#6c6c6c', marginBottom: 32 }}>{editId ? 'Edit the store details' : 'Add a new store to your POS system'}</div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px #e6e6e6', padding: 40, maxWidth: 900, margin: '0 auto' }}>
          <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleFormKeyDown}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ padding: '8px 16px', borderRadius: 8, background: step === 1 ? '#1a2c7fff' : '#f3f4f6', color: step === 1 ? '#fff' : '#111827', fontWeight: 600, fontSize: 14 }}>1. Store & Address</div>
              <div style={{ padding: '8px 16px', borderRadius: 8, background: step === 2 ? '#1a2c7fff' : '#f3f4f6', color: step === 2 ? '#fff' : '#111827', fontWeight: 600, fontSize: 14 }}>2. Point of Contact & Bank</div>
            </div>

            {step === 1 && (
              <>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Store Information</div>
            <div style={{ display: 'flex', gap: 34, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Store Name <span style={{ color: 'red' }}>*</span></label>
                <input name="storeName" placeholder="Enter store name" value={form.storeName} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                {fieldErrors.storeName && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.storeName}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Store ID</label>
                <input disabled placeholder="Auto-generated (STORE0001, STORE0002...)" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e0e0e0', marginTop: 4, background: '#f5f5f5', color: '#666' }} />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Store ID will be automatically generated</div>
              </div>
            </div>
            </>
            )}

            {step === 2 && (
              <>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Point of Contact</div>
            <div style={{ display: 'flex', gap: 34, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Contact Name <span style={{ color: 'red' }}>*</span></label>
                    <input name="contactPersonName" placeholder="Enter contact name" value={form.contactPersonName} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                {fieldErrors.contactPersonName && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.contactPersonName}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Contact Number <span style={{ color: 'red' }}>*</span></label>
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}> */}
                  {/* <span style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, background: '#f5f5f5', color: '#6c3fc5', fontWeight: 600 }}></span> */}
                      <input name="contactNumber" placeholder="Enter contact number" value={form.contactNumber} onChange={handleChange} onBlur={handleBlur} required maxLength={10} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                {/* </div> */}
                {fieldErrors.contactNumber && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.contactNumber}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600 }}>Email <span style={{ color: 'red' }}>*</span></label>
                    <input name="email" placeholder="Enter email" value={form.email} onChange={handleChange} onBlur={handleBlur} required type="text" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                {fieldErrors.email && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.email}</div>}
              </div>
            </div>

                <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Bank Details</div>
                <div style={{ display: 'flex', gap: 34, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontWeight: 500 }}>Bank Name</label>
                    <input name="bankDetails.bankName" value={form.bankDetails?.bankName || ''} onChange={handleChange} placeholder="Bank name" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontWeight: 500 }}>Account Holder Name</label>
                    <input name="bankDetails.accountHolderName" value={form.bankDetails?.accountHolderName || ''} onChange={handleChange} placeholder="Account holder name" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontWeight: 500 }}>Account Number</label>
                    <input name="bankDetails.accountNumber" value={form.bankDetails?.accountNumber || ''} onChange={handleChange} placeholder="Account number" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontWeight: 500 }}>IFSC Code</label>
                    <input name="bankDetails.ifscCode" value={form.bankDetails?.ifscCode || ''} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. HDFC0001234" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4, textTransform: 'uppercase' }} />
                    {fieldErrors['bankDetails.ifscCode'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['bankDetails.ifscCode']}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontWeight: 500 }}>Branch Name</label>
                    <input name="bankDetails.branchName" value={form.bankDetails?.branchName || ''} onChange={handleChange} placeholder="Branch" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontWeight: 500 }}>UPI ID</label>
                    <input name="bankDetails.upiId" value={form.bankDetails?.upiId || ''} onChange={handleChange} placeholder="name@bank" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                </div>
              </>
            )}
            {step === 1 && (
              <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Location & Coordinates</div>
              
            {/* Location Input with Action Buttons */}
<div style={{ marginBottom: 16 }}>
  {/* Label */}
  <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>
    Store Location <span style={{ color: 'red' }}>*</span>
  </label>

  {/* Input + Buttons in one row */}
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <input 
      name="storeLocation" 
      placeholder="Enter store location or use GPS/Map" 
      value={form.storeLocation} 
      onChange={handleChange} 
      onBlur={handleBlur} 
      required 
      style={{ 
        flex: 1, 
        padding: 12, 
        borderRadius: 8, 
        border: '1px solid #ccc', 
        fontSize: 14 
      }} 
    />

    {/* GPS Button */}
    <button
      type="button"
      onClick={getCurrentLocation}
      disabled={gettingLocation}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '12px 16px',
        background: gettingLocation ? '#f3f4f6' : '#22c55e',
        color: gettingLocation ? '#6b7280' : '#ffffff',
        border: 'none',
        borderRadius: 8,
        cursor: gettingLocation ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        fontSize: 14,
        minWidth: 120,
        transition: 'all 0.2s ease',
        height: 46
      }}
    >
      {gettingLocation ? (
        <>
          <span style={{ 
            width: 14, 
            height: 14, 
            border: '2px solid #9ca3af', 
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></span>
          Getting...
        </>
      ) : (
        <>📍 Use GPS</>
      )}
    </button>

    {/* Map Picker Button */}
    <button
      type="button"
      onClick={openMapPicker}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '12px 16px',
        background: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: 14,
        minWidth: 120,
        transition: 'all 0.2s ease',
        height: 46
      }}
    >
      🗺️ Pick on Map
    </button>
  </div>

  {/* Validation error */}
  {fieldErrors.storeLocation && (
    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>
      {fieldErrors.storeLocation}
    </div>
  )}
</div>


              {/* Coordinates Display */}
              {form.latitude && form.longitude && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 4 }}>
                      📍 Location Coordinates
                    </div>
                    <div style={{ fontSize: 14, color: '#075985' }}>
                      <strong>Latitude:</strong> {form.latitude.toFixed(6)} | <strong>Longitude:</strong> {form.longitude.toFixed(6)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, latitude: null, longitude: null, storeLocation: '' }))}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Location Instructions */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: '#92400e'
              }}>
                <strong>💡 Pro Tips:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
                  <li>Use <strong>GPS</strong> for accurate current location</li>
                  <li>Use <strong>Map</strong> to pick precise location by clicking</li>
                  <li>Address fields below will auto-fill when using GPS</li>
                </ul>
              </div>
            </div>

                <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Address</div>
                <div style={{ display: 'flex', gap: 34, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <label style={{ fontWeight: 500 }}>Address Line 1 <span style={{ color: 'red' }}>*</span></label>
                    <input name="address.addressLine1" placeholder="Flat/House, Street" value={form.address?.addressLine1 || ''} onChange={handleChange} onBlur={handleBlur} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                    {fieldErrors['address.addressLine1'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.addressLine1']}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <label style={{ fontWeight: 500 }}>Address Line 2</label>
                    <input name="address.addressLine2" placeholder="Area, Locality" value={form.address?.addressLine2 || ''} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ fontWeight: 500 }}>Landmark</label>
                    <input name="address.landmark" placeholder="Nearby place" value={form.address?.landmark || ''} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontWeight: 500 }}>City <span style={{ color: 'red' }}>*</span></label>
                    <input name="address.city" value={form.address?.city || ''} onChange={handleChange} onBlur={handleBlur} required placeholder="City" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                    {fieldErrors['address.city'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.city']}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontWeight: 500 }}>State <span style={{ color: 'red' }}>*</span></label>
                    <input name="address.state" value={form.address?.state || ''} onChange={handleChange} onBlur={handleBlur} required placeholder="State" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                    {fieldErrors['address.state'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.state']}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontWeight: 500 }}>Country <span style={{ color: 'red' }}>*</span></label>
                    <input name="address.country" value={form.address?.country || ''} onChange={handleChange} onBlur={handleBlur} required placeholder="Country" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                    {fieldErrors['address.country'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.country']}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontWeight: 500 }}>Pincode <span style={{ color: 'red' }}>*</span></label>
                    <input name="address.pincode" value={form.address?.pincode || ''} onChange={handleChange} onBlur={handleBlur} required placeholder="6 digits" maxLength={6} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                    {fieldErrors['address.pincode'] && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors['address.pincode']}</div>}
                  </div>
                </div>
              </>
            )}
            {step === 1 && (
              <div style={{ display: 'flex', gap: 34, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative' }}>
    <label style={{ fontWeight: 500 }}>Store Picture</label>
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      style={{ display: 'block', marginTop: 4 }}
    />
    {form.storePicture && (
      <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
                       <img src={form.storePicture} alt="Store Preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
                       <button type="button" onClick={() => setForm({ ...form, storePicture: null })} style={{ position: 'absolute', top: -8, right: -8, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, lineHeight: '20px', textAlign: 'center' }}>×</button>
      </div>
    )}
  </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Organization *</label>
                {user && user.userType === 'organization' ? (
                  // Show read-only organization field for organization users
                  <div style={{ 
                    width: '100%', 
                    padding: 10, 
                    borderRadius: 6, 
                    border: '1px solid #e0e0e0', 
                    marginTop: 4,
                    background: '#f5f5f5',
                    color: '#666'
                  }}>
                    {user.organization?.organizationName} ({user.organization?.organizationId})
                  </div>
                ) : (
                  // Show select dropdown for other users
                  <select 
                    name="organizationId" 
                    value={form.organizationId} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    required 
                    disabled={loadingOrganizations}
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      borderRadius: 6, 
                      border: '1px solid #ccc', 
                      marginTop: 4,
                      background: loadingOrganizations ? '#f5f5f5' : 'white',
                      color: loadingOrganizations ? '#666' : 'black'
                    }}
                  >
                    <option value="">
                      {loadingOrganizations ? 'Loading organizations...' : 'Select an organization'}
                    </option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>
                        {org.organizationName} ({org.organizationId})
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.organizationId && <div style={{ color: 'red', fontSize: 13 }}>{fieldErrors.organizationId}</div>}
                {loadingOrganizations && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Loading organizations...
                  </div>
                )}
                {!loadingOrganizations && organizations.length === 0 && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                    No organizations found. Please create an organization first.
                  </div>
                )}
                {user && user.userType === 'organization' && (
                  <div style={{ fontSize: 12, color: '#6c6c6c', marginTop: 4 }}>
                    Organization is set to your logged-in organization and cannot be changed.
                  </div>
                )}
              </div>
              {/* GST input removed - GST is per product now */}
            </div>
            )}
            {error && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca',
                color: '#dc2626', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ 
                background: '#f0fff4', 
                border: '1px solid #bbf7d0',
                color: '#16a34a', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ✅ {success}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 32 }}>
              <div>
                {step > 1 && (
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '10px 24px', cursor: 'pointer' }}>Previous</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#1a2c7fff', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
                {step < 2 ? (
                  <button type="button" onClick={() => { if (validateStep(1)) setStep(2); }} style={{ background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '10px 32px', cursor: 'pointer' }}>Next</button>
                ) : (
                  <button type="button" onClick={handleSave} style={{ background: '#1a2c7fff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '10px 32px', cursor: 'pointer' }}>{editId ? 'Update Store' : 'Add Store'}</button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          src={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          circularCrop={false}
        />
      )}
    </div>
    </>
  );
};

export default AddStorePage;
