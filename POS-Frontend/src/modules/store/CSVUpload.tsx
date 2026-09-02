import React, { useState, useRef } from 'react';
import { FiUpload, FiDownload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface CSVUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  success: boolean;
  message: string;
  errors?: string[];
  createdStores?: any[];
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setResult(null);
      } else {
        setResult({
          success: false,
          message: 'Please upload a CSV file',
          errors: ['Invalid file type. Only CSV files are allowed.']
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        setResult({
          success: false,
          message: 'Please upload a CSV file',
          errors: ['Invalid file type. Only CSV files are allowed.']
        });
      }
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = 'https://apis.pos.hutechsolutions.in/public/store-template.csv';
    link.download = 'store-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadCSV = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('https://apis.pos.hutechsolutions.in/api/stores/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully created ${data.createdStores?.length || 0} stores`,
          createdStores: data.createdStores
        });
        if (data.createdStores?.length > 0) {
          onSuccess();
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Upload failed',
          errors: data.errors || ['Unknown error occurred']
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Upload failed',
        errors: ['Network error. Please try again.']
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        width: '90%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Bulk Upload Stores</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6c6c6c',
              padding: 4
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1a1a1a' }}>Instructions:</h3>
          <ul style={{ fontSize: 14, color: '#6c6c6c', margin: 0, paddingLeft: 20 }}>
            <li>Download the template CSV file below</li>
            <li>Fill in the store details following the template format</li>
            <li>Upload the completed CSV file</li>
            <li>Required fields: storeName, storeLocation, contactPersonName, contactNumber, email</li>
          </ul>
        </div>

        {/* Download Template Button */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={downloadTemplate}
            style={{
              padding: '12px 24px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FiDownload size={16} />
            Download Template
          </button>
        </div>

        {/* Upload Area */}
        <div
          style={{
            border: `2px dashed ${dragActive ? '#7c4dff' : '#ddd'}`,
            borderRadius: 8,
            padding: 32,
            textAlign: 'center',
            background: dragActive ? '#f8f9ff' : '#fafafa',
            marginBottom: 24,
            transition: 'all 0.2s ease'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {file ? (
            <div>
              <FiCheck size={48} color="#28a745" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#28a745', marginBottom: 8 }}>
                File Selected
              </div>
              <div style={{ fontSize: 14, color: '#6c6c6c', marginBottom: 16 }}>
                {file.name}
              </div>
              <button
                onClick={resetUpload}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Remove File
              </button>
            </div>
          ) : (
            <div>
              <FiUpload size={48} color="#6c6c6c" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                Drop CSV file here or click to browse
              </div>
              <div style={{ fontSize: 14, color: '#6c6c6c', marginBottom: 16 }}>
                Only CSV files are allowed
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '12px 24px',
                  background: '#7c4dff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Choose File
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {file && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={uploadCSV}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: uploading ? '#6c757d' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {uploading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload size={16} />
                  Upload Stores
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            padding: 16,
            borderRadius: 8,
            background: result.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: result.errors ? 8 : 0 }}>
              {result.success ? (
                <FiCheck size={16} color="#155724" />
              ) : (
                <FiAlertCircle size={16} color="#721c24" />
              )}
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: result.success ? '#155724' : '#721c24' 
              }}>
                {result.message}
              </div>
            </div>
            
            {result.errors && result.errors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#721c24' }}>
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}

            {result.success && result.createdStores && result.createdStores.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#155724', marginBottom: 8 }}>
                  Created Stores:
                </div>
                <div style={{ maxHeight: 100, overflowY: 'auto', fontSize: 11, color: '#155724' }}>
                  {result.createdStores.map((store, index) => (
                    <div key={index} style={{ marginBottom: 4 }}>
                      • {store.storeName} - {store.storeLocation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CSVUpload;
