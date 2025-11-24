import React, { useEffect, useRef, useState } from "react";
import { MapPin, Search, Check, X, AlertCircle } from "lucide-react";

/**
 * MapSelector.jsx
 * - Refactor version (B): clean, robust, avoids white screen in modal
 * - Uses VietMap REST APIs for search & reverse geocoding.
 *
 * Props:
 *  - onLocationSelect(locationObject)  // gọi khi xác nhận vị trí
 *  - initialLocation (optional) {
 *       latitude, longitude, fullAddress (optional)
 *    }
 *  - placeholder (string)
 *  - className (string)
 *
 * Returns:
 *  - locationObject passed to onLocationSelect:
 *    {
 *      latitude, longitude,
 *      fullAddress,
 *      streetAddress, ward, district, city, province
 *    }
 *
 * NOTE: set env var VITE_VIETMAP_API_KEY hoặc fallback key được dùng.
 */

/* ------------------- Config ------------------- */
const VIETMAP_API_KEY =
  import.meta.env.VITE_VIETMAP_API_KEY ||
  "6e0f9ec74dcf745f6a0a071f50c2479030322f17f879d547";
const VIETMAP_BASE_URL = "https://maps.vietmap.vn/api";
const DEFAULT_CENTER = { lat: 16.0471, lng: 108.2067 }; // Đà Nẵng center
const DEFAULT_ZOOM = 13;

/* ------------------- Helpers ------------------- */
const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const buildDisplayFromProps = (props, lat, lon) => {
  // props = feature.properties from VietMap
  // We attempt to build a friendly vietnamese address string
  const house = props.housenumber || "";
  
  // Kiểm tra và loại bỏ Plus Code từ street name
  let street = "";
  if (props.street && props.street.length > 0 && !isLikelyPlusCode(props.street)) {
    street = props.street;
  } else if (props.name && props.name.length > 0 && !isLikelyPlusCode(props.name)) {
    street = props.name;
  }
  
  const ward = props.locality || "";
  const district = props.county || "";
  const city = props.region || "Đà Nẵng";
  
  // Xây dựng địa chỉ
  const addressParts = [];
  
  // Số nhà + tên đường
  const streetParts = [];
  if (house) streetParts.push(house);
  if (street) streetParts.push(street);
  if (streetParts.length > 0) {
    addressParts.push(streetParts.join(" "));
  }
  
  // Phường/Xã
  if (ward) {
    const wardName = ward.toLowerCase().includes("phường") || ward.toLowerCase().includes("xã")
      ? ward
      : `Phường ${ward}`;
    addressParts.push(wardName);
  }
  
  // Quận/Huyện
  if (district) {
    const d = district.toLowerCase();
    let districtName;
    if (d.includes("quận") || d.includes("huyện") || d.includes("thị xã")) {
      districtName = district;
    } else {
      // Các quận nội thành Đà Nẵng
      if (["hải châu", "thanh khê", "sơn trà", "ngũ hành sơn", "liên chiểu", "cẩm lệ"].some(q => d.includes(q))) {
        districtName = `Quận ${district}`;
      } else {
        districtName = `Huyện ${district}`;
      }
    }
    addressParts.push(districtName);
  }
  
  // Thành phố
  if (city) {
    const cn = city.toLowerCase();
    const cityName = cn.includes("thành phố") || cn.includes("tp.")
      ? city
      : `Thành phố ${city}`;
    addressParts.push(cityName);
  }

  // Nếu không có địa chỉ hợp lệ, dùng vị trí ước tính
  if (addressParts.length === 0 || (addressParts.length === 1 && addressParts[0] === "Thành phố Đà Nẵng")) {
    return `Vị trí gần (${lat.toFixed(6)}, ${lon.toFixed(6)}), Thành phố Đà Nẵng`;
  }

  return addressParts.join(", ");
};

const isLikelyPlusCode = (s) => {
  if (!s) return false;
  // Plus codes chắc chắn có dấu '+'
  if (s.includes("+")) return true;
  // Hoặc chỉ toàn chữ hoa và số với độ dài 6-10 ký tự
  if (/^[A-Z0-9]{6,10}$/.test(s)) return true;
  // Các pattern Plus Code phổ biến khác
  if (s === "6FG22222+22" || s.match(/^[0-9A-Z]{4,8}\+[0-9A-Z]{2,4}$/)) return true;
  // Nếu chỉ có số và chữ không có khoảng trắng hoặc ký tự đặc biệt
  if (s.length <= 12 && /^[A-Z0-9]+$/.test(s) && !/[aeiouAEIOU]/.test(s)) return true;
  return false;
};

/* ------------------- Component ------------------- */
const MapSelector = ({
  onLocationSelect,
  initialLocation = null, // {latitude, longitude, fullAddress}
  placeholder = "Nhập địa chỉ hoặc chọn trên bản đồ...",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    initialLocation?.fullAddress || ""
  );
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(
    initialLocation
      ? {
          lat: initialLocation.latitude,
          lon: initialLocation.longitude,
          fullAddress: initialLocation.fullAddress || "",
          streetAddress: "",
          ward: "",
          district: "",
          city: "",
          province: "",
        }
      : null
  );

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const initializedRef = useRef(false);

  /* ------------------- Load VietMap SDK when modal opens ------------------- */
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      if (window.vietmapgl) {
        return;
      }
      setSdkLoading(true);
      try {
        // CSS
        if (!document.getElementById("vietmap-css")) {
          const link = document.createElement("link");
          link.id = "vietmap-css";
          link.rel = "stylesheet";
          link.href =
            "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css";
          document.head.appendChild(link);
        }
        // JS
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src =
            "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js";
          s.async = true;
          s.onload = resolve;
          s.onerror = () =>
            reject(new Error("Không thể tải VietMap SDK. Kiểm tra kết nối."));
          document.body.appendChild(s);
        });
      } catch (e) {
        console.error(e);
        setError(e.message || "Lỗi tải SDK");
      } finally {
        setSdkLoading(false);
      }
    };

    load();
  }, [open]);

  /* ------------------- Initialize or re-init map safely ------------------- */
  useEffect(() => {
    if (!open) return;
    // Wait until SDK loaded
    if (!window.vietmapgl) return;

    // If map already exists, remove first to avoid white screen / duplication
    const safeInit = () => {
      // Remove previous instance if any
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapRef.current = null;
        markerRef.current = null;
      }

      // Ensure container exists & has size: use small timeout to allow modal render
      setTimeout(() => {
        try {
          // initial center: use selected or default
          const center = selected
            ? [selected.lon, selected.lat]
            : [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];
          const zoom = selected ? 16 : DEFAULT_ZOOM;

          const map = new window.vietmapgl.Map({
            container: mapContainerRef.current,
            style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`,
            center,
            zoom,
            attributionControl: true,
          });

          map.on("load", () => {
            // resize twice to be safe (modal + animations)
            map.resize();
            setTimeout(() => map.resize(), 200);
          });

          // Add marker
          const marker = new window.vietmapgl.Marker({
            draggable: true,
            color: "#e11d48",
          })
            .setLngLat(center)
            .addTo(map);

          // Drag end => reverse geocode and update selected
          marker.on("dragend", async () => {
            const lngLat = marker.getLngLat();
            await performReverse(lngLat.lat, lngLat.lng, map, marker);
          });

          // Map click => move marker + reverse
          map.on("click", async (e) => {
            const { lat, lng } = e.lngLat ? e.lngLat : { lat: e.lat, lng: e.lng };
            marker.setLngLat([lng, lat]);
            await performReverse(lat, lng, map, marker);
          });

          mapRef.current = map;
          markerRef.current = marker;
          initializedRef.current = true;
        } catch (err) {
          console.error("Init map error:", err);
          setError("Lỗi khởi tạo bản đồ: " + (err.message || err));
        }
      }, 120); // small delay to allow modal to layout
    };

    safeInit();

    // cleanup when modal closes (handled by separate effect)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, window.vietmapgl, selected]);

  // Cleanup on unmount or when modal closed
  useEffect(() => {
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch (e) {
        // ignore
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  /* ------------------- Reverse geocoding ------------------- */
  const performReverse = async (lat, lon, mapInstance = mapRef.current, marker = markerRef.current) => {
    setError(null);
    try {
      const url = `${VIETMAP_BASE_URL}/reverse/v4?apikey=${VIETMAP_API_KEY}&lng=${lon}&lat=${lat}&display_type=1`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const fullAddress = item.display || `${item.name || ""}, ${item.address || "Đà Nẵng"}`.trim();
        const boundaries = item.boundaries || [];
        const wardObj = boundaries.find(b => b.type === 2) || {};
        const cityObj = boundaries.find(b => b.type === 0) || {};
        const districtObj = boundaries.find(b => b.type === 1) || {}; // Assuming type 1 is district

        const newSel = {
          lat,
          lon,
          fullAddress,
          streetAddress: item.name || "",
          ward: wardObj.full_name || wardObj.name || "",
          district: districtObj.full_name || districtObj.name || "",
          city: cityObj.full_name || cityObj.name || "Đà Nẵng",
          province: cityObj.full_name || cityObj.name || "Đà Nẵng",
          rawFeature: item,
        };
        setSelected(newSel);
        setSearchQuery(newSel.fullAddress);
        // ensure marker and map are synced
        try {
          if (marker && typeof marker.setLngLat === "function") {
            marker.setLngLat([lon, lat]);
          }
          if (mapInstance && typeof mapInstance.flyTo === "function") {
            mapInstance.flyTo({ center: [lon, lat], zoom: 16, duration: 700 });
          }
        } catch (e) {}
        return newSel;
      }

      // fallback: không tìm được -> dùng địa chỉ cụ thể
      console.log('⚠️ No data found, using simple fallback');
      const fallbackAddress = `Vị trí gần (${lat.toFixed(6)}, ${lon.toFixed(6)}), Thành phố Đà Nẵng`;
      const fallbackSel = {
        lat,
        lon,
        fullAddress: fallbackAddress,
        streetAddress: "",
        ward: "",
        district: "",
        city: "Đà Nẵng",
        province: "Đà Nẵng",
      };
      setSelected(fallbackSel);
      setSearchQuery(fallbackSel.fullAddress);
      console.log('🏠 Using fallback address:', fallbackAddress);
      return fallbackSel;
    } catch (err) {
      console.error("Reverse geocode error:", err);
      setError("Không thể lấy địa chỉ từ server.");
      const fallbackAddress = `Vị trí gần (${lat.toFixed(6)}, ${lon.toFixed(6)}), Đà Nẵng`;
      const fallbackSel = {
        lat,
        lon,
        fullAddress: fallbackAddress,
        streetAddress: "",
        ward: "",
        district: "",
        city: "Đà Nẵng",
        province: "Đà Nẵng",
      };
      setSelected(fallbackSel);
      setSearchQuery(fallbackSel.fullAddress);
      return fallbackSel;
    }
  };

  /* ------------------- Search (geocoding) ------------------- */
  const doSearch = async (q) => {
    const trimmed = (q || "").trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      // prioritize da nang with focus point
      const url =
        `${VIETMAP_BASE_URL}/search?api-version=1.1&apikey=${VIETMAP_API_KEY}` +
        `&text=${encodeURIComponent(trimmed)}` +
        `&focus.point.lat=${DEFAULT_CENTER.lat}&focus.point.lon=${DEFAULT_CENTER.lng}` +
        `&layers=address,venue,street&limit=6&country=vn`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data?.code === "OK" && Array.isArray(data.data?.features) && data.data.features.length > 0) {
        const results = data.data.features
          .filter((f) => {
            const p = f.properties || {};
            // drop pure plus code results
            if (isLikelyPlusCode(p.name) || isLikelyPlusCode(p.label)) return false;
            return true;
          })
          .map((f) => {
            const p = f.properties || {};
            return {
              id: p.id || `${f.geometry.coordinates[0]}_${f.geometry.coordinates[1]}`,
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              display_name: p.label || buildDisplayFromProps(p, f.geometry.coordinates[1], f.geometry.coordinates[0]),
              streetAddress: p.housenumber ? `${p.housenumber} ${p.street || ""}`.trim() : (p.street || p.name || ""),
              ward: p.locality || "",
              district: p.county || "",
              city: p.region || "Đà Nẵng",
              rawFeature: f,
            };
          });
        setSearchResults(results);
      } else {
        setSearchResults([]);
        setError("Không tìm thấy địa chỉ phù hợp.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
      setError("Lỗi tìm kiếm địa chỉ.");
    } finally {
      setIsSearching(false);
    }
  };

  // debounce wrapper
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = React.useCallback(debounce(doSearch, 600), []);

  useEffect(() => {
    if (searchQuery && searchQuery !== selected?.fullAddress) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selected, debouncedSearch]);

  /* ------------------- Select from search results ------------------- */
  const applySearchResult = async (res) => {
    // res expected: {lat, lon, display_name, ...}
    setSelected({
      lat: res.lat,
      lon: res.lon,
      fullAddress: res.display_name,
      streetAddress: res.streetAddress,
      ward: res.ward,
      district: res.district,
      city: res.city,
      province: res.city || "Đà Nẵng",
      rawFeature: res.rawFeature,
    });
    setSearchQuery(res.display_name);
    setSearchResults([]);
    // move map & marker
    try {
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [res.lon, res.lat], zoom: 16, duration: 700 });
      }
      if (markerRef.current) {
        markerRef.current.setLngLat([res.lon, res.lat]);
      }
    } catch (e) {}
  };

  /* ------------------- Confirm selection ------------------- */
  const confirm = () => {
    if (!selected) return;
    const out = {
      latitude: selected.lat,
      longitude: selected.lon,
      fullAddress: selected.fullAddress,
      streetAddress: selected.streetAddress,
      ward: selected.ward,
      district: selected.district,
      city: selected.city,
      province: selected.province,
    };
    onLocationSelect && onLocationSelect(out);
    setOpen(false);
  };

  /* ------------------- UI ------------------- */
  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 shadow-sm hover:shadow"
      >
        <span className="text-gray-700 truncate pr-2">
          {selected?.fullAddress || placeholder}
        </span>
        <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] max-h-[800px] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">Chọn địa chỉ</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm: 185 Huỳnh Văn Nghệ, Hòa Hải..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Results */}
              {isSearching ? (
                <div className="mt-3 p-4 bg-white border rounded-lg shadow-sm flex justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="mt-3 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => applySearchResult(r)}
                      className="w-full p-3 text-left hover:bg-blue-50 transition-colors flex flex-col space-y-1"
                    >
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {r.display_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {r.streetAddress && `${r.streetAddress}, `}
                        {r.ward && `${r.ward}, `}
                        {r.district && `${r.district}, `}
                        {r.city || "Đà Nẵng"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Map */}
            <div className="flex-1 relative min-h-0">
              <div ref={mapContainerRef} className="w-full h-full" />
              {sdkLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-700 font-medium">Đang tải bản đồ...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600 truncate max-w-[55%]">
                {selected ? (
                  <span className="flex items-center">
                    <span className="mr-2 font-medium">Địa chỉ:</span>
                    <span className="truncate">{selected.fullAddress}</span>
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500">
                    <span className="mr-2">Hướng dẫn:</span>Tìm kiếm hoặc click vào bản đồ
                  </span>
                )}
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={confirm}
                  disabled={!selected}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all font-medium shadow-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Xác nhận</span>
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