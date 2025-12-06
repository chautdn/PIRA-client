import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import ShipmentService from '../../services/shipment';
import { formatCurrency } from '../../utils/constants';
import chatService from '../../services/chat';
import useChatSocket from '../../hooks/useChatSocket';
import ShipmentManagementModal from '../../components/shipper/ShipmentManagementModal';

export default function ShipmentsPage() {
  const { user } = useAuth();
  const { socket, connected } = useChatSocket();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null); // Single date selection
  const [selectedShipmentType, setSelectedShipmentType] = useState('DELIVERY'); // Filter by type
  const [proofs, setProofs] = useState({}); // Cache proofs by shipmentId
  
  // Customer info modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Lightbox state and helpers (must be declared before any early returns)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedFilesForUpload, setSelectedFilesForUpload] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalShipment, setUploadModalShipment] = useState(null);
  const [managementModalOpen, setManagementModalOpen] = useState(false);
  const [selectedShipmentForManagement, setSelectedShipmentForManagement] = useState(null);
  const [uploadAction, setUploadAction] = useState(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofModalShipment, setProofModalShipment] = useState(null);

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
        const shipmentsData = Array.isArray(data) ? data : (data.data || data);
        setShipments(shipmentsData);

        // Load proofs for all shipments
        const proofsMap = {};
        for (const shipment of shipmentsData) {
          try {
            const proofData = await ShipmentService.getProof(shipment._id);
            proofsMap[shipment._id] = proofData.data || proofData;
          } catch (err) {
          }
        }
        setProofs(proofsMap);
      } catch (err) {
        console.error('Failed to load shipments', err.message || err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Listen for real-time shipment creation
  useEffect(() => {
    if (!socket || !connected) return;

    const handleShipmentCreated = (data) => {
      
      // Show toast notification immediately
      const typeLabel = data.shipment.type === 'DELIVERY' ? '📦 Giao hàng' : '🔄 Trả hàng';
      const toast = require('react-hot-toast').default;
      toast.success(`✅ ${typeLabel} mới: ${data.shipment.shipmentId}`);
      
      // Reload full shipment list from server to get all populated data
      const reloadShipments = async () => {
        try {
          const resp = await ShipmentService.listMyShipments();
          const data = resp.data || resp;
          const shipmentsData = Array.isArray(data) ? data : (data.data || data);
          setShipments(shipmentsData);
        } catch (err) {
          console.error('Failed to reload shipments after socket event:', err.message);
        }
      };
      
      reloadShipments();
    };

    socket.on('shipment:created', handleShipmentCreated);

    return () => {
      socket.off('shipment:created', handleShipmentCreated);
    };
  }, [socket, connected]);

  // Format date to Vietnamese format DD/MM/YYYY
  const formatDateVN = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Get all unique scheduled dates from shipments - organized by type and date
  const getAllRentalDatesWithType = () => {
    const datesMap = {}; // { 'DD/MM/YYYY-DELIVERY': [...], 'DD/MM/YYYY-RETURN': [...] }
    
    shipments.forEach((s) => {
      const shipmentType = s.type; // 'DELIVERY' or 'RETURN'
      let dateStr = null;
      
      // Use scheduledAt from shipment - đây là ngày dự kiến thực tế
      if (s.scheduledAt) {
        dateStr = formatDateVN(s.scheduledAt);
      }
      // Fallback to rental period
      else {
        let rentalPeriod = null;
        if (s.subOrder?.rentalPeriod) {
          rentalPeriod = s.subOrder.rentalPeriod;
        }
        else if (s.subOrder?.masterOrder?.rentalPeriod) {
          rentalPeriod = s.subOrder.masterOrder.rentalPeriod;
        }
        
        // For DELIVERY: use startDate
        if (shipmentType === 'DELIVERY' && rentalPeriod?.startDate) {
          dateStr = formatDateVN(rentalPeriod.startDate);
        }
        // For RETURN: use endDate
        else if (shipmentType === 'RETURN' && rentalPeriod?.endDate) {
          dateStr = formatDateVN(rentalPeriod.endDate);
        }
      }
      
      if (dateStr) {
        const key = `${dateStr}-${shipmentType}`;
        if (!datesMap[key]) {
          datesMap[key] = [];
        }
        datesMap[key].push(s);
      } else {
        console.warn('⚠️ Shipment without date:', s.shipmentId, { 
          scheduledAt: s.scheduledAt, 
          rentalPeriod: s.subOrder?.rentalPeriod,
          masterOrderRentalPeriod: s.subOrder?.masterOrder?.rentalPeriod,
          subOrderId: s.subOrder?._id,
          hasSubOrder: !!s.subOrder
        });
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

  // Get files directly from input and show preview modal
  const promptForFilesWithPreview = (shipment, action) => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
          // Add to existing files
          setSelectedFilesForUpload(prev => prev ? [...prev, ...files] : files);
          setUploadModalShipment(shipment);
          setUploadAction(action);
          setUploadModalOpen(true);
        }
        resolve(files);
      };
      input.click();
    });
  };

  // Add more files
  const addMoreFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        setSelectedFilesForUpload(prev => [...(prev || []), ...files]);
      }
    };
    input.click();
  };

  // Remove file from preview
  const removeFile = (index) => {
    setSelectedFilesForUpload(prev => prev.filter((_, i) => i !== index));
  };

  // Actually upload the files
  const confirmUpload = async () => {
    try {
      if (!selectedFilesForUpload || !uploadModalShipment) {
        alert('No files selected');
        return;
      }

      const formData = new FormData();
      selectedFilesForUpload.forEach(file => {
        formData.append('images', file);
      });

      await ShipmentService.uploadProof(uploadModalShipment._id, formData);

      // Only after successful upload, mark shipment as pickup/delivered
      if (uploadAction === 'pickup') {
        await ShipmentService.pickupShipment(uploadModalShipment._id);
      } else if (uploadAction === 'deliver') {
        await ShipmentService.deliverShipment(uploadModalShipment._id);
      }

      const resp = await ShipmentService.listMyShipments();
      const data = resp.data || resp;
      setShipments(Array.isArray(data) ? data : (data.data || data));

      // Load proof after successful upload
      await loadProof(uploadModalShipment._id);

      // Close modal and reset
      setUploadModalOpen(false);
      setSelectedFilesForUpload(null);
      setUploadModalShipment(null);
      setUploadAction(null);
    } catch (err) {
      console.error('Upload failed', err.message || err);
      alert(err.message || 'Upload failed');
    }
  };

  // Load proof for a specific shipment
  const loadProof = async (shipmentId) => {
    try {
      const proofData = await ShipmentService.getProof(shipmentId);
      setProofs(prev => ({
        ...prev,
        [shipmentId]: proofData.data || proofData
      }));
    } catch (err) {
      // Not critical, just won't show images
    }
  };

  // Open proof modal
  const openProofModal = (shipment) => {
    setProofModalShipment(shipment);
    setProofModalOpen(true);
  };

  const handleUploadAction = async (s, action) => {
    await promptForFilesWithPreview(s, action);
  };

  const handleOpenManagementModal = (shipment) => {
    setSelectedShipmentForManagement(shipment);
    setManagementModalOpen(true);
  };

  const handleManagementSuccess = async () => {
    // Refresh shipments after successful management
    try {
      const resp = await ShipmentService.listMyShipments();
      const data = resp.data || resp;
      setShipments(Array.isArray(data) ? data : (data.data || data));
    } catch (err) {
      console.error('Failed to refresh shipments', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="p-6 text-center">
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
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
                onClick={() => setSelectedShipmentType('DELIVERY')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedShipmentType === 'DELIVERY'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                📦 Giao hàng
              </button>
              <button
                onClick={() => setSelectedShipmentType('RETURN')}
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
                    const isSelected = selectedDate === pair;
                    
                    return (
                      <button
                        key={pair}
                        onClick={() => setSelectedDate(isSelected ? null : pair)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                          isSelected
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
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã shipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SubOrder</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Phí vận chuyển</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipmentsForSelectedDate.map((s) => (
                      <motion.tr
                        key={s._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-blue-50 transition-colors ${s.status !== 'PENDING' ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (s.status !== 'PENDING') {
                            handleOpenManagementModal(s);
                          }
                        }}
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
                          {s.status === 'DELIVERED' && s.type === 'RETURN' && (
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
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {s.status === 'PENDING' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(s);
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                            >
                              ✓ Nhận đơn
                            </button>
                          )}

                          {s.status === 'SHIPPER_CONFIRMED' && (
                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium text-sm inline-block">
                              ✓ Đã nhận đơn
                            </span>
                          )}

                          {(s.status === 'IN_TRANSIT' || s.status === 'DELIVERED') && (
                            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-sm inline-block">
                              ✓ Đang xử lý
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {shipmentsForSelectedDate.map((s) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                  >
                    {/* Top Bar - Type & Status */}
                    <div className={`px-4 py-3 ${
                      s.type === 'DELIVERY' 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500' 
                        : 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.type === 'DELIVERY' ? '📦' : '🔄'}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {s.type === 'DELIVERY' ? 'Giao Hàng' : 'Nhận Trả'}
                            </p>
                            <p className="text-xs text-gray-600">{s.shipmentId}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.status === 'PENDING' ? 'bg-yellow-200 text-yellow-900' :
                          s.status === 'SHIPPER_CONFIRMED' ? 'bg-blue-200 text-blue-900' :
                          s.status === 'IN_TRANSIT' ? 'bg-purple-200 text-purple-900' :
                          s.status === 'DELIVERED' ? 'bg-green-200 text-green-900' :
                          'bg-gray-200 text-gray-900'
                        }`}>
                          {s.status === 'PENDING' ? '⏳' :
                           s.status === 'SHIPPER_CONFIRMED' ? '✓' :
                           s.status === 'IN_TRANSIT' ? '🚚' :
                           s.status === 'DELIVERED' ? '✓✓' :
                           '❓'} {s.status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3 space-y-2">
                      {/* Fee & Tracking */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-xs text-gray-600">Phí vận chuyển</p>
                          <p className="font-bold text-green-600 text-sm">{formatCurrency(s.fee || 0)}</p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          {s.tracking?.pickedUpAt && (
                            <p>🕐 {new Date(s.tracking.pickedUpAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                          {s.tracking?.deliveredAt && (
                            <p>✓ {new Date(s.tracking.deliveredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                          {!s.tracking?.pickedUpAt && !s.tracking?.deliveredAt && (
                            <p className="text-gray-500">Chưa cập nhật</p>
                          )}
                        </div>
                      </div>

                      {/* Confirmation Message */}
                      {s.status === 'DELIVERED' && s.type === 'RETURN' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          <p className="text-xs text-green-800 font-medium">Sẽ được chuyển khoản</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 py-3 border-t border-gray-200 space-y-2">
                      <button 
                        onClick={() => {
                          const customer = s.customerInfo || {};
                          const renter = s.subOrder?.masterOrder?.renter;
                          const name = customer.name || renter?.profile?.fullName || renter?.profile?.firstName || 'N/A';
                          const phone = customer.phone || renter?.phone || 'N/A';
                          const email = customer.email || renter?.email || 'N/A';
                          
                          setSelectedCustomer({
                            name: name,
                            phone: phone,
                            email: email,
                            address: s.type === 'DELIVERY' ? s.toAddress : s.fromAddress,
                            type: s.type
                          });
                          setIsCustomerModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        👤 Thông tin khách hàng
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        {s.status === 'PENDING' && (
                          <button 
                            onClick={() => handleAccept(s)}
                            className="px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                          >
                            ✓ Nhận
                          </button>
                        )}

                        {s.status === 'SHIPPER_CONFIRMED' && (
                          <button 
                            onClick={() => handleUploadAction(s, 'pickup')}
                            className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                          >
                            📸 Pickup
                          </button>
                        )}

                        {proofs[s._id] && (proofs[s._id].imagesBeforeDelivery?.length > 0 || proofs[s._id].imagesAfterDelivery?.length > 0) && (
                          <button
                            onClick={() => openProofModal(s)}
                            className="px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                          >
                            🖼️ Proof
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
              <p className="text-gray-500 text-sm">
                Tổng cộng: {shipments.filter(s => s.type === selectedShipmentType).length} đơn hàng {selectedShipmentType === 'DELIVERY' ? 'giao hàng' : 'nhận trả'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Customer Info Modal */}
      <AnimatePresence>
        {isCustomerModalOpen && selectedCustomer && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCustomerModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedCustomer.type === 'DELIVERY' ? '👤 Chủ hàng' : '👤 Người thuê'}
                </h2>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Tên khách hàng</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedCustomer.name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Số điện thoại</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    <a href={`tel:${selectedCustomer.phone}`} className="text-blue-600 hover:underline">
                      {selectedCustomer.phone}
                    </a>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Email</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline">
                      {selectedCustomer.email}
                    </a>
                  </p>
                </div>

                {selectedCustomer.address && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Địa chỉ</label>
                    <p className="text-sm text-gray-900 mt-1 leading-relaxed">
                      {selectedCustomer.address.streetAddress && <div>{selectedCustomer.address.streetAddress}</div>}
                      {selectedCustomer.address.ward && <div>{selectedCustomer.address.ward}</div>}
                      {selectedCustomer.address.district && <div>{selectedCustomer.address.district}</div>}
                      {selectedCustomer.address.city && <div>{selectedCustomer.address.city}</div>}
                      {selectedCustomer.address.province && <div>{selectedCustomer.address.province}</div>}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Modal */}
      <AnimatePresence>
        {proofModalOpen && proofModalShipment && proofs[proofModalShipment._id] && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProofModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📸 Shipment Proof</h2>
                <button
                  onClick={() => setProofModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Upload new proof button */}
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <button
                    onClick={() => {
                      setProofModalOpen(false);
                      promptForFilesWithPreview(proofModalShipment, proofModalShipment.status === 'SHIPPER_CONFIRMED' ? 'pickup' : 'deliver');
                    }}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    📤 Upload Proof Image
                  </button>
                </div>

                {/* Before Delivery Images */}
                {proofs[proofModalShipment._id].imagesBeforeDelivery?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">B</span>
                      Ảnh Pickup ({proofs[proofModalShipment._id].imagesBeforeDelivery.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {proofs[proofModalShipment._id].imagesBeforeDelivery.map((img, idx) => (
                        <img
                          key={`before-${idx}`}
                          src={img}
                          alt={`pickup-${idx}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => openLightbox(proofs[proofModalShipment._id].imagesBeforeDelivery, idx)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* After Delivery Images */}
                {proofs[proofModalShipment._id].imagesAfterDelivery?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">A</span>
                      Ảnh Delivered ({proofs[proofModalShipment._id].imagesAfterDelivery.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {proofs[proofModalShipment._id].imagesAfterDelivery.map((img, idx) => (
                        <img
                          key={`after-${idx}`}
                          src={img}
                          alt={`delivered-${idx}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => openLightbox(proofs[proofModalShipment._id].imagesAfterDelivery, idx)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!proofs[proofModalShipment._id].imagesBeforeDelivery?.length && !proofs[proofModalShipment._id].imagesAfterDelivery?.length && (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có ảnh proof nào
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && selectedFilesForUpload && uploadModalShipment && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUploadModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📸 Preview Ảnh ({selectedFilesForUpload.length} file)
                </h2>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {selectedFilesForUpload.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => removeFile(idx)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded truncate max-w-[90%]">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addMoreFiles}
                  className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  ➕ Chọn thêm
                </button>
                <button
                  onClick={confirmUpload}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  ✅ Upload ({selectedFilesForUpload.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        </>
      )}

      {/* Shipment Management Modal */}
      <ShipmentManagementModal
        shipment={selectedShipmentForManagement}
        isOpen={managementModalOpen}
        onClose={() => setManagementModalOpen(false)}
        onSuccess={handleManagementSuccess}
      />
    </div>
  );
}
