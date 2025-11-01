import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Check, X } from 'lucide-react';

// Sử dụng Leaflet với OpenStreetMap (miễn phí)
const MapSelector = ({ 
  onLocationSelect, 
  initialAddress = '', 
  placeholder = 'Nhập địa chỉ hoặc chọn trên bản đồ...',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (isOpen && !window.L) {
      const loadLeaflet = async () => {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initializeMap();
        document.body.appendChild(script);
      };
      loadLeaflet();
    } else if (isOpen && window.L) {
      initializeMap();
    }
  }, [isOpen]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Khởi tạo map với tọa độ Việt Nam
    const map = window.L.map(mapRef.current).setView([10.8231, 106.6297], 13);

    // Thêm tile layer OpenStreetMap
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Thêm marker có thể kéo được
    const marker = window.L.marker([10.8231, 106.6297], { draggable: true }).addTo(map);

    // Xử lý khi kéo marker
    marker.on('dragend', async (e) => {
      const latlng = e.target.getLatLng();
      await reverseGeocode(latlng.lat, latlng.lng);
    });

    // Xử lý khi click vào map
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      await reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  };

  // Tìm kiếm địa chỉ
  const searchAddress = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Sử dụng Nominatim API (miễn phí)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Vietnam')}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      const results = data.map(item => ({
        id: item.place_id,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: {
          streetAddress: item.address?.house_number ? `${item.address.house_number} ${item.address.road || ''}`.trim() : (item.address?.road || ''),
          ward: item.address?.suburb || item.address?.quarter || '',
          district: item.address?.city_district || item.address?.county || '',
          city: item.address?.city || item.address?.town || item.address?.village || '',
          province: item.address?.state || 'Việt Nam'
        }
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Lỗi tìm kiếm địa chỉ:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Chuyển đổi tọa độ thành địa chỉ
  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const location = {
          lat,
          lon,
          display_name: data.display_name,
          address: {
            streetAddress: data.address?.house_number ? `${data.address.house_number} ${data.address.road || ''}`.trim() : (data.address?.road || ''),
            ward: data.address?.suburb || data.address?.quarter || '',
            district: data.address?.city_district || data.address?.county || '',
            city: data.address?.city || data.address?.town || data.address?.village || '',
            province: data.address?.state || 'Việt Nam'
          }
        };
        
        setSelectedLocation(location);
        setSearchQuery(location.display_name);
      }
    } catch (error) {
      console.error('Lỗi reverse geocoding:', error);
    }
  };

  // Chọn địa chỉ từ kết quả tìm kiếm
  const selectAddress = (result) => {
    setSelectedLocation(result);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    
    // Di chuyển map và marker đến vị trí được chọn
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([result.lat, result.lon], 15);
      markerRef.current.setLatLng([result.lat, result.lon]);
    }
  };

  // Xác nhận chọn địa chỉ
  const confirmSelection = () => {
    if (selectedLocation) {
      onLocationSelect({
        ...selectedLocation.address,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
        fullAddress: selectedLocation.display_name
      });
      setIsOpen(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery !== selectedLocation?.display_name) {
        searchAddress(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <span className="text-gray-700">
          {selectedLocation ? selectedLocation.display_name : placeholder}
        </span>
        <MapPin className="w-4 h-4 text-gray-400" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chọn địa chỉ trên bản đồ</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm địa chỉ..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => selectAddress(result)}
                      className="w-full p-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.address.streetAddress && `${result.address.streetAddress}, `}
                        {result.address.ward && `${result.address.ward}, `}
                        {result.address.district && `${result.address.district}, `}
                        {result.address.city}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {result.display_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="w-full h-full"></div>
              {!window.L && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600">Đang tải bản đồ...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedLocation ? (
                  <span>📍 {selectedLocation.display_name}</span>
                ) : (
                  <span>💡 Nhập địa chỉ hoặc click vào bản đồ để chọn vị trí</span>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmSelection}
                  disabled={!selectedLocation}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Chọn địa chỉ này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSelector;