import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({ 
  onLocationSelect, 
  onClose, 
  initialLat = 20.5937, 
  initialLng = 78.9629 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat || null);
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng || null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Initialize the map
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Initialize the map
        const map = L.map(mapRef.current).setView([selectedLat || initialLat, selectedLng || initialLng], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add initial marker if we have coordinates
        if (selectedLat && selectedLng) {
          markerRef.current = L.marker([selectedLat, selectedLng])
            .addTo(map)
            .bindPopup('Selected Location')
            .openPopup();
        }

        // Handle map clicks
        map.on('click', async (e: L.LeafletMouseEvent) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          
          setSelectedLat(lat);
          setSelectedLng(lng);

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Add new marker
          markerRef.current = L.marker([lat, lng])
            .addTo(map)
            .bindPopup('Selected Location')
            .openPopup();

          // Get address for this location
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(addr);
          } catch (error) {
            console.error('Geocoding error:', error);
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        });

        mapInstanceRef.current = map;
        setMapLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapLoading(false);
      }
    };

    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(initMap, 100);
    
    // Cleanup
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng, selectedLat, selectedLng]);

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setSelectedLat(lat);
        setSelectedLng(lng);
        
        // Update map view and marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          
          // Remove existing marker
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }
          
          // Add new marker
          markerRef.current = L.marker([lat, lng])
            .addTo(mapInstanceRef.current)
            .bindPopup('Current Location')
            .openPopup();
        }
        
        // Get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          const data = await response.json();
          const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(addr);
        } catch (error) {
          console.error('Geocoding error:', error);
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
        
        let errorMessage = 'Could not get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
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
        alert(errorMessage);
      }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLat && selectedLng) {
      onLocationSelect(selectedLat, selectedLng, address);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 800,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 16
          }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              🗺️ Select Store Location
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#6b7280',
                padding: 4
              }}
            >
              ✕
            </button>
          </div>

          {/* Instructions */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>
              🗺️ Click on the map to select a location
            </div>
            <div style={{ fontSize: 14, color: '#075985' }}>
              Click anywhere on the map to select your store location, or use the GPS button to get your current position
            </div>
          </div>

          {/* Map Container */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div 
              ref={mapRef}
              style={{
                height: '350px',
                width: '100%',
                borderRadius: 8,
                border: '2px solid #e5e7eb',
                background: '#f8f9fa'
              }}
            />
            
            {mapLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(248, 249, 250, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                zIndex: 1000
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }}></div>
                  <div style={{ color: '#6b7280', fontWeight: 500 }}>Loading Interactive Map...</div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Please wait while we load the map interface</div>
                </div>
              </div>
            )}
          </div>

          {/* Location Info & GPS Button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Location Info */}
            {selectedLat && selectedLng && (
              <div style={{
                flex: 1,
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
                padding: 16
              }}>
                <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>
                  📍 Selected Location
                </div>
                <div style={{ fontSize: 13, color: '#075985', marginBottom: 4 }}>
                  <strong>Coordinates:</strong> {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                </div>
                <div style={{ fontSize: 13, color: '#075985' }}>
                  <strong>Address:</strong> {address || 'Getting address...'}
                </div>
              </div>
            )}

            {/* GPS Button */}
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              style={{
                background: loading ? '#f3f4f6' : '#22c55e',
                color: loading ? '#6b7280' : '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 160,
                justifyContent: 'center'
              }}
            >
              {loading ? (
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
                <>
                  📍 Use GPS Location
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <button
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLocation}
              disabled={!selectedLat || !selectedLng}
              style={{
                background: selectedLat && selectedLng ? '#6366f1' : '#d1d5db',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                cursor: selectedLat && selectedLng ? 'pointer' : 'not-allowed',
                fontWeight: 500
              }}
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapPicker;
