import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import ShipmentService from '../../services/shipment';
import { formatCurrency } from '../../utils/constants';
import chatService from '../../services/chat';

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShipmentType, setSelectedShipmentType] = useState('DELIVERY'); // Filter by type
  // Lightbox state and helpers (must be declared before any early returns)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images = [], index = 0) => {
    setLightboxImages(images || []);
    setLightboxIndex(index || 0);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  useEffect(() => {
    if (isLightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLightboxOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setLightboxIndex(i => (i > 0 ? i - 1 : (lightboxImages.length - 1)));
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i < lightboxImages.length - 1 ? i + 1 : 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, lightboxImages.length]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await ShipmentService.listMyShipments();
        const data = resp.data || resp;
        setShipments(Array.isArray(data) ? data : (data.data || data));
      } catch (err) {
        console.error('Failed to load shipments', err.message || err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div className="p-6">Loading shipments...</div>;

  // Format date to Vietnamese format DD/MM/YYYY
  const formatDateVN = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Get all unique rental dates from shipments - organized by type and date
  const getAllRentalDatesWithType = () => {
    const datesMap = {}; // { 'DD/MM/YYYY-DELIVERY': [...], 'DD/MM/YYYY-RETURN': [...] }
    
    shipments.forEach((s) => {
      // Try multiple ways to get rental period
      let rentalPeriod = null;
      
      if (s.subOrder?.rentalPeriod) {
        rentalPeriod = s.subOrder.rentalPeriod;
      }
      else if (s.subOrder?.masterOrder?.rentalPeriod) {
        rentalPeriod = s.subOrder.masterOrder.rentalPeriod;
      }
      else if (s.subOrder?.products?.[0]?.rentalPeriod) {
        rentalPeriod = s.subOrder.products[0].rentalPeriod;
      }
      else if (s.masterOrder?.rentalPeriod) {
        rentalPeriod = s.masterOrder.rentalPeriod;
      }
      
      const shipmentType = s.type; // 'DELIVERY' or 'RETURN'
      let dateStr = null;
      
      // For DELIVERY: use startDate
      if (shipmentType === 'DELIVERY' && rentalPeriod?.startDate) {
        dateStr = formatDateVN(rentalPeriod.startDate);
      }
      // For RETURN: use endDate
      else if (shipmentType === 'RETURN' && rentalPeriod?.endDate) {
        dateStr = formatDateVN(rentalPeriod.endDate);
      }
      // Fallback to createdAt if no rental period
      else if (!rentalPeriod && s.subOrder?.createdAt) {
        dateStr = formatDateVN(s.subOrder.createdAt);
      }
      
      if (dateStr) {
        const key = `${dateStr}-${shipmentType}`;
        if (!datesMap[key]) {
          datesMap[key] = [];
        }
        datesMap[key].push(s);
      }
    });
    
    return datesMap;
  };

  const datesMapByType = getAllRentalDatesWithType();
  
  // Extract and sort unique date-type combinations
  const getUniqueDateTypePairs = () => {
    const pairs = Object.keys(datesMapByType);
    return pairs.sort((a, b) => {
      const parseDate = (str) => {
        const datePart = str.split('-')[0]; // Extract DD/MM/YYYY
        const [day, month, year] = datePart.split('/').map(Number);
        return new Date(year, month - 1, day);
      };
      return parseDate(b) - parseDate(a);
    });
  };

  const dateTypePairs = getUniqueDateTypePairs();
  
  // Get shipments for selected date-type pair
  const shipmentsForSelectedDate = selectedDate ? datesMapByType[selectedDate] : [];

  const handleAccept = async (s) => {
    try {
      await ShipmentService.acceptShipment(s._id);
      // refresh
      const resp = await ShipmentService.listMyShipments();
      const data = resp.data || resp;
      setShipments(Array.isArray(data) ? data : (data.data || data));
    } catch (err) {
      console.error('Accept failed', err.message || err);
      alert(err.message || 'Accept failed');
    }
  };

  // Generic uploader: prompts for files, uploads them and returns array of urls
  const promptAndUpload = () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return resolve([]);
        try {
          const uploads = await Promise.all(files.map(f => chatService.uploadImage(f)));
          // chatService.uploadImage returns response.data (server shape). Try to extract url(s)
          const urls = uploads.map(r => (r.data ? (r.data.url || r.data.path || r.data) : (r.url || r.path || r)) ).filter(Boolean);
          resolve(urls);
        } catch (err) {
          reject(err);
        }
      };
      input.click();
    });
  };

  const handleUploadAction = async (s, action) => {
    try {
      const urls = await promptAndUpload();
      if (!urls || urls.length === 0) {
        alert('No photos selected');
        return;
      }

      if (action === 'pickup') {
        await ShipmentService.pickupShipment(s._id, { photos: urls });
      } else if (action === 'deliver') {
        await ShipmentService.deliverShipment(s._id, { photos: urls });
      }

      const resp = await ShipmentService.listMyShipments();
      const data = resp.data || resp;
      setShipments(Array.isArray(data) ? data : (data.data || data));
    } catch (err) {
      console.error('Upload action failed', err.message || err);
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Quản lí vận chuyển</h1>
      
      {shipments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">Không có shipment nào</p>
        </div>
      ) : (
        <div>
          {/* Type Filter Buttons */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Loại đơn hàng</h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedShipmentType('DELIVERY');
                  setSelectedDate(null);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedShipmentType === 'DELIVERY'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                📦 Giao hàng
              </button>
              <button
                onClick={() => {
                  setSelectedShipmentType('RETURN');
                  setSelectedDate(null);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedShipmentType === 'RETURN'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-600 hover:bg-orange-50'
                }`}
              >
                🔄 Nhận trả
              </button>
            </div>
          </div>

          {/* Date Buttons Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Chọn ngày xử lý đơn</h2>
            {(() => {
              // Filter dates by selected type
              const filteredPairs = dateTypePairs.filter(pair => pair.endsWith(`-${selectedShipmentType}`));
              
              if (filteredPairs.length === 0) {
                return (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">Không có đơn hàng loại này</p>
                  </div>
                );
              }
              
              return (
                <div className="flex flex-wrap gap-3">
                  {filteredPairs.map((pair) => {
                    const [dateStr] = pair.split('-');
                    const count = datesMapByType[pair]?.length || 0;
                    const isDelivery = selectedShipmentType === 'DELIVERY';
                    
                    return (
                      <button
                        key={pair}
                        onClick={() => setSelectedDate(selectedDate === pair ? null : pair)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                          selectedDate === pair
                            ? isDelivery
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-orange-600 text-white shadow-lg'
                            : isDelivery
                            ? 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        <span className="block text-sm">Đơn ngày {dateStr}</span>
                        <span className="text-xs opacity-75">({count} đơn)</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Shipments Details Section */}
          {selectedDate && shipmentsForSelectedDate.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                {(() => {
                  const [dateStr, shipmentType] = selectedDate.split('-');
                  const typeLabel = shipmentType === 'DELIVERY' ? '📦 Giao hàng' : '🔄 Nhận trả';
                  return (
                    <h3 className="text-lg font-semibold text-gray-800">
                      {typeLabel} - Danh sách đơn hàng ngày {dateStr}
                    </h3>
                  );
                })()}
              </div>
              
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã shipment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SubOrder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Phí vận chuyển</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shipmentsForSelectedDate.map((s) => (
                    <motion.tr
                      key={s._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.shipmentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.subOrder?._id || s.subOrder}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          s.type === 'DELIVERY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {s.type === 'DELIVERY' ? '📦 Giao hàng' : '🔄 Nhận trả'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          s.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          s.status === 'SHIPPER_CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          s.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-800' :
                          s.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="font-semibold text-green-600">{formatCurrency(s.fee || 0)}</div>
                        {s.status === 'DELIVERED' && (
                          <div className="text-xs text-green-500 mt-1">✅ Sẽ được chuyển</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="text-xs text-gray-500">
                          {s.tracking?.pickedUpAt ? (
                            <div>Pickup: {new Date(s.tracking.pickedUpAt).toLocaleTimeString('vi-VN')}</div>
                          ) : null}
                          {s.tracking?.deliveredAt ? (
                            <div>Deliver: {new Date(s.tracking.deliveredAt).toLocaleTimeString('vi-VN')}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {s.status === 'PENDING' && (
                              <button 
                                onClick={() => handleAccept(s)}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                              >
                                Nhận
                              </button>
                            )}

                            {s.status === 'SHIPPER_CONFIRMED' && (
                              <button 
                                onClick={() => handleUploadAction(s, 'pickup')}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                              >
                                📸 Pickup
                              </button>
                            )}

                            {s.status === 'IN_TRANSIT' && (
                              <button 
                                onClick={() => handleUploadAction(s, 'deliver')}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
                              >
                                📸 Deliver
                              </button>
                            )}
                          </div>

                          {/* Show uploaded photos preview */}
                          {Array.isArray(s.tracking?.photos) && s.tracking.photos.length > 0 && (
                            <div className="flex gap-2">
                              {s.tracking.photos.slice(0, 3).map((p, i) => (
                                <img
                                  key={i}
                                  src={p}
                                  alt={`proof-${i}`}
                                  className="w-12 h-12 object-cover rounded cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => openLightbox(s.tracking.photos, i)}
                                />
                              ))}
                              {s.tracking.photos.length > 3 && (
                                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                  +{s.tracking.photos.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedDate && shipmentsForSelectedDate.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">Không có dữ liệu cho ngày này</p>
            </div>
          )}

          {!selectedDate && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 text-lg mb-2">👆 Chọn một ngày để xem danh sách đơn hàng</p>
              <p className="text-gray-500 text-sm">Tổng cộng: {shipments.length} đơn hàng</p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && lightboxImages && lightboxImages.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeLightbox()}
          >
            <motion.button
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={lightboxIndex}
                src={lightboxImages[lightboxIndex]}
                alt={`img-${lightboxIndex}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              />

              {/* Prev / Next */}
              {lightboxImages.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex(i => i > 0 ? i - 1 : lightboxImages.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setLightboxIndex(i => i < lightboxImages.length - 1 ? i + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Thumbnails */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 overflow-x-auto px-2">
                  {lightboxImages.map((img, idx) => (
                    <button key={idx} onClick={() => setLightboxIndex(idx)} className={`w-20 h-20 rounded overflow-hidden ${idx === lightboxIndex ? 'ring-4 ring-white' : 'ring-2 ring-white/30'}`}>
                      <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
