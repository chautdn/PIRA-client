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

  // Get all unique scheduled dates from shipments - group by date only (all types together)
  const getAllRentalDatesByDate = () => {
    const datesMap = {}; // { 'DD/MM/YYYY': [...all shipments for this date...] }
    
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
        if (!datesMap[dateStr]) {
          datesMap[dateStr] = [];
        }
        datesMap[dateStr].push(s);
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

  const datesMap = getAllRentalDatesByDate();
  
  // Extract and sort unique dates
  const getUniqueDates = () => {
    const dates = Object.keys(datesMap);
    return dates.sort((a, b) => {
      const parseDate = (str) => {
        const [day, month, year] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
      };
      return parseDate(b) - parseDate(a); // Newest first
    });
  };

  const uniqueDates = getUniqueDates();
  
  // Get shipments for selected date
  const shipmentsForSelectedDate = selectedDate ? datesMap[selectedDate] : [];
  
  // Count by type for the selected date
  const deliveryCount = shipmentsForSelectedDate.filter(s => s.type === 'DELIVERY').length;
  const returnCount = shipmentsForSelectedDate.filter(s => s.type === 'RETURN').length;

  // Check if shipment can be accepted (must be on or after scheduled date)
  const canAcceptShipment = (shipment) => {
    if (!shipment) return false;
    
    let scheduledDate = null;
    
    // Get scheduled date from shipment
    if (shipment.scheduledAt) {
      scheduledDate = new Date(shipment.scheduledAt);
    } else {
      // Fallback to rental period dates
      const rentalPeriod = shipment.subOrder?.rentalPeriod || shipment.subOrder?.masterOrder?.rentalPeriod;
      if (rentalPeriod) {
        if (shipment.type === 'DELIVERY' && rentalPeriod.startDate) {
          scheduledDate = new Date(rentalPeriod.startDate);
        } else if (shipment.type === 'RETURN' && rentalPeriod.endDate) {
          scheduledDate = new Date(rentalPeriod.endDate);
        }
      }
    }

    if (!scheduledDate) return true; // Allow if no date found (edge case)

    // Set scheduled date to start of day (00:00:00)
    scheduledDate.setHours(0, 0, 0, 0);
    
    // Get current date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can accept if today >= scheduled date
    return today >= scheduledDate;
  };

  const handleAccept = async (s) => {
    // Validate date before accepting
    if (!canAcceptShipment(s)) {
      const toast = require('react-hot-toast').default;
      toast.error('⏰ Chưa đến ngày giao hàng! Bạn chỉ có thể nhận đơn từ 00:00 ngày ' + formatDateVN(s.scheduledAt || (s.type === 'DELIVERY' ? s.subOrder?.rentalPeriod?.startDate : s.subOrder?.rentalPeriod?.endDate)));
      return;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden max-w-full">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6 max-w-7xl overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header with sticky position on mobile */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-4 sm:py-5 mb-4 sm:mb-6 shadow-lg">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">🚚</span>
                <span>Quản lí vận chuyển</span>
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">Theo dõi và quản lý các đơn hàng của bạn</p>
            </div>
            
            {shipments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-700 text-lg sm:text-xl font-semibold mb-2">Không có shipment nào</p>
                <p className="text-gray-500 text-sm">Đơn hàng mới sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div>
          {/* Date Selection - Show all dates with all types */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-2xl shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <span>Lịch giao hàng</span>
                </h2>
                <div className="text-xs sm:text-sm bg-gradient-to-r from-blue-50 to-purple-50 px-2.5 sm:px-3 py-1.5 rounded-full border-2 border-blue-300">
                  <span className="text-gray-700 font-medium">Tổng:</span> <span className="font-extrabold text-blue-700">{shipments.length}</span>
                </div>
              </div>
            </div>
            
            {uniqueDates.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center">
                <p className="text-4xl sm:text-5xl mb-3">📦</p>
                <p className="text-base sm:text-lg text-gray-700 font-semibold mb-1">Chưa có đơn hàng nào</p>
                <p className="text-xs sm:text-sm text-gray-500">Đơn hàng mới sẽ hiển thị tại đây</p>
              </div>
            ) : (
              <>
                {/* Scroll indicator for mobile */}
                <div className="md:hidden text-center mb-2">
                  <p className="text-xs text-gray-500 italic">👈 Vuốt sang để xem thêm 👉</p>
                </div>
                
                <div className="flex md:flex-wrap gap-2 sm:gap-3 overflow-x-auto md:overflow-visible pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                  {uniqueDates.map((dateStr) => {
                    const shipmentsOnDate = datesMap[dateStr] || [];
                    const deliveryCountForDate = shipmentsOnDate.filter(s => s.type === 'DELIVERY').length;
                    const returnCountForDate = shipmentsOnDate.filter(s => s.type === 'RETURN').length;
                    const isSelected = selectedDate === dateStr;
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        className={`flex-shrink-0 md:flex-shrink px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold transition-all duration-200 touch-manipulation text-sm sm:text-base border-2 min-w-[140px] sm:min-w-[160px] ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-transparent scale-105 shadow-xl'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 active:scale-95 shadow-md'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                        <span className="font-extrabold flex items-center gap-1.5 text-[15px] sm:text-base">
                          <span className="text-lg sm:text-xl">📆</span>
                          <span>{dateStr}</span>
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs font-extrabold mt-0.5">
                          {deliveryCountForDate > 0 && (
                            <span className={`flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                              isSelected ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              <span className="text-xs sm:text-sm">📦</span> <span>{deliveryCountForDate}</span>
                            </span>
                          )}
                          {returnCountForDate > 0 && (
                            <span className={`flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                              isSelected ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-800 border border-orange-300'
                            }`}>
                              <span className="text-xs sm:text-sm">🔄</span> <span>{returnCountForDate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              </>
            )}
          </div>

          {/* Shipments Details Section */}
          {selectedDate && shipmentsForSelectedDate.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">📋</span>
                    <span>Đơn hàng {selectedDate}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    {deliveryCount > 0 && (
                      <span className="px-2 sm:px-3 py-1 bg-white/30 text-white rounded-full font-bold border border-white/50">
                        📦 {deliveryCount}
                      </span>
                    )}
                    {returnCount > 0 && (
                      <span className="px-2 sm:px-3 py-1 bg-white/30 text-white rounded-full font-bold border border-white/50">
                        🔄 {returnCount}
                      </span>
                    )}
                  </div>
                </div>
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
                            <div className="relative group">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(s);
                                }}
                                disabled={!canAcceptShipment(s)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                                  canAcceptShipment(s)
                                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                                }`}
                              >
                                {canAcceptShipment(s) ? '✓ Nhận đơn' : '🔒 Chưa đến ngày'}
                              </button>
                              {!canAcceptShipment(s) && (
                                <div className="hidden group-hover:block absolute z-10 top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                                  ⏰ Chỉ nhận đơn từ 00:00 ngày {formatDateVN(s.scheduledAt || (s.type === 'DELIVERY' ? s.subOrder?.rentalPeriod?.startDate : s.subOrder?.rentalPeriod?.endDate))}
                                </div>
                              )}
                            </div>
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
              <div className="md:hidden space-y-3 sm:space-y-4 p-2 sm:p-3">
                {shipmentsForSelectedDate.map((s) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleOpenManagementModal(s)}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 overflow-hidden active:scale-[0.99] cursor-pointer touch-manipulation"
                  >
                    {/* Top Bar - Type & Status */}
                    <div className={`px-3 sm:px-4 py-2.5 sm:py-3 ${
                      s.type === 'DELIVERY' 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500' 
                        : 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xl shrink-0">{s.type === 'DELIVERY' ? '📦' : '🔄'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                              {s.type === 'DELIVERY' ? 'Giao Hàng' : 'Nhận Trả'}
                            </p>
                            <p className="text-xs text-gray-600 font-mono truncate">{s.shipmentId}</p>
                          </div>
                        </div>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                          s.status === 'PENDING' ? 'bg-yellow-200 text-yellow-900' :
                          s.status === 'SHIPPER_CONFIRMED' ? 'bg-blue-200 text-blue-900' :
                          s.status === 'IN_TRANSIT' ? 'bg-purple-200 text-purple-900' :
                          s.status === 'DELIVERED' ? 'bg-green-200 text-green-900' :
                          'bg-gray-200 text-gray-900'
                        }`}>
                          <span className="hidden xs:inline">
                            {s.status === 'PENDING' ? '⏳ ' :
                             s.status === 'SHIPPER_CONFIRMED' ? '✓ ' :
                             s.status === 'IN_TRANSIT' ? '🚚 ' :
                             s.status === 'DELIVERED' ? '✓✓ ' :
                             '❓ '}
                          </span>
                          <span className="text-[10px] xs:text-xs">
                            {s.status === 'PENDING' ? 'CHỜ' :
                             s.status === 'SHIPPER_CONFIRMED' ? 'ĐÃ NHẬN' :
                             s.status === 'IN_TRANSIT' ? 'ĐANG GIAO' :
                             s.status === 'DELIVERED' ? 'HOÀN TẤT' :
                             s.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 space-y-2.5">
                      {/* Fee & Tracking */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2.5 sm:p-3 border border-gray-200">
                        <div>
                          <p className="text-[10px] xs:text-xs text-gray-600 font-medium mb-0.5">💰 Phí vận chuyển</p>
                          <p className="font-extrabold text-green-600 text-base sm:text-lg">{formatCurrency(s.fee || 0)}</p>
                        </div>
                        <div className="text-right text-[10px] xs:text-xs text-gray-600 space-y-0.5">
                          {s.tracking?.pickedUpAt && (
                            <p className="font-medium">🕐 Lấy: {new Date(s.tracking.pickedUpAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                          {s.tracking?.deliveredAt && (
                            <p className="font-medium text-green-600">✓ Giao: {new Date(s.tracking.deliveredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                          {!s.tracking?.pickedUpAt && !s.tracking?.deliveredAt && (
                            <p className="text-gray-400 italic">Chưa cập nhật</p>
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
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t-2 border-gray-200">
                      <div className="space-y-2">
                        {s.status === 'PENDING' && (
                          <div className="col-span-2">
                            <button 
                              onClick={() => handleAccept(s)}
                              disabled={!canAcceptShipment(s)}
                              className={`w-full px-4 py-3.5 rounded-xl font-bold transition-all text-sm shadow-md touch-manipulation flex items-center justify-center gap-2 ${
                                canAcceptShipment(s)
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 active:from-green-700 active:to-emerald-700 text-white active:shadow-lg'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
              }`}
                            >
                              <span className="text-lg">{canAcceptShipment(s) ? '✓' : '🔒'}</span>
                              <span>{canAcceptShipment(s) ? 'Nhận đơn ngay' : 'Chưa đến ngày giao'}</span>
                            </button>
                            {!canAcceptShipment(s) && (
                              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-[10px] xs:text-xs text-orange-700 text-center font-semibold">
                                  ⏰ Chỉ nhận từ 00:00 ngày {formatDateVN(s.scheduledAt || (s.type === 'DELIVERY' ? s.subOrder?.rentalPeriod?.startDate : s.subOrder?.rentalPeriod?.endDate))}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {s.status === 'SHIPPER_CONFIRMED' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadAction(s, 'pickup');
                            }}
                            className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 active:from-blue-700 active:to-indigo-700 text-white rounded-xl font-bold transition-all text-sm shadow-md active:shadow-lg touch-manipulation flex items-center justify-center gap-2"
                          >
                            <span className="text-lg">📸</span>
                            <span>Chụp ảnh Pickup</span>
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
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-700 text-base sm:text-lg font-bold mb-1">Không có đơn hàng</p>
              <p className="text-gray-500 text-sm">Chưa có đơn hàng nào cho ngày này</p>
            </div>
          )}

          {!selectedDate && uniqueDates.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl p-8 sm:p-12 text-center border-2 border-blue-200">
              <div className="text-6xl sm:text-7xl mb-4 animate-bounce">👆</div>
              <p className="text-gray-800 text-lg sm:text-xl font-bold mb-2">Chọn ngày để xem đơn hàng</p>
              <p className="text-gray-600 text-sm sm:text-base">
                Bạn có <span className="font-extrabold text-blue-600 text-lg">{shipments.length}</span> đơn hàng cần xử lý
              </p>
            </div>
          )}
        </div>
      )}

      {/* Customer Info Modal */}
      <AnimatePresence>
        {isCustomerModalOpen && selectedCustomer && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCustomerModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5 sm:mb-6 pb-4 border-b-2 border-gray-200">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl">{selectedCustomer.type === 'DELIVERY' ? '👤' : '🙋'}</span>
                  <span>{selectedCustomer.type === 'DELIVERY' ? 'Chủ hàng' : 'Người thuê'}</span>
                </h2>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 active:bg-red-300 flex items-center justify-center text-red-600 font-bold text-xl shadow-md touch-manipulation transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border-2 border-blue-200">
                  <label className="text-[10px] xs:text-xs font-bold text-blue-700 uppercase mb-1 block">👤 Tên khách hàng</label>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{selectedCustomer.name}</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-5 border-2 border-green-200">
                  <label className="text-[10px] xs:text-xs font-bold text-green-700 uppercase mb-1 block">📱 Số điện thoại</label>
                  <a 
                    href={`tel:${selectedCustomer.phone}`} 
                    className="text-base sm:text-lg font-bold text-blue-600 hover:text-blue-800 active:text-blue-900 flex items-center gap-2 touch-manipulation"
                  >
                    <span>📞</span>
                    <span className="underline">{selectedCustomer.phone}</span>
                  </a>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border-2 border-purple-200">
                  <label className="text-[10px] xs:text-xs font-bold text-purple-700 uppercase mb-1 block">📧 Email</label>
                  <a 
                    href={`mailto:${selectedCustomer.email}`} 
                    className="text-sm sm:text-base font-bold text-blue-600 hover:text-blue-800 active:text-blue-900 break-all touch-manipulation underline"
                  >
                    {selectedCustomer.email}
                  </a>
                </div>

                {selectedCustomer.address && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 sm:p-5 border-2 border-orange-200">
                    <label className="text-[10px] xs:text-xs font-bold text-orange-700 uppercase mb-2 block flex items-center gap-1">
                      <span>📍</span> <span>Địa chỉ</span>
                    </label>
                    <div className="text-sm sm:text-base text-gray-900 space-y-1 leading-relaxed font-medium">
                      {selectedCustomer.address.streetAddress && <div className="font-bold">{selectedCustomer.address.streetAddress}</div>}
                      {selectedCustomer.address.ward && <div>{selectedCustomer.address.ward}</div>}
                      {selectedCustomer.address.district && <div>{selectedCustomer.address.district}</div>}
                      {selectedCustomer.address.city && <div>{selectedCustomer.address.city}</div>}
                      {selectedCustomer.address.province && <div>{selectedCustomer.address.province}</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-full mt-6 px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white rounded-xl font-bold transition-all shadow-lg touch-manipulation text-base"
              >
                ✓ Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Modal */}
      <AnimatePresence>
        {proofModalOpen && proofModalShipment && proofs[proofModalShipment._id] && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProofModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6"
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5 sm:mb-6 pb-4 border-b-2 border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-lg sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl">📸</span>
                  <span>Ảnh Proof</span>
                </h2>
                <button
                  onClick={() => setProofModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 active:bg-red-300 flex items-center justify-center text-red-600 font-bold text-xl shadow-md touch-manipulation transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {/* Upload new proof button */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300">
                  <button
                    onClick={() => {
                      setProofModalOpen(false);
                      promptForFilesWithPreview(proofModalShipment, proofModalShipment.status === 'SHIPPER_CONFIRMED' ? 'pickup' : 'deliver');
                    }}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white rounded-xl font-bold transition-all shadow-lg touch-manipulation flex items-center justify-center gap-2 text-base"
                  >
                    <span className="text-xl">📤</span>
                    <span>Upload ảnh mới</span>
                  </button>
                </div>

                {/* Before Delivery Images */}
                {proofs[proofModalShipment._id].imagesBeforeDelivery?.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border-2 border-blue-200">
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">📦</span>
                      <span>Ảnh Pickup ({proofs[proofModalShipment._id].imagesBeforeDelivery.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {proofs[proofModalShipment._id].imagesBeforeDelivery.map((img, idx) => (
                        <div 
                          key={`before-${idx}`}
                          className="relative group cursor-pointer touch-manipulation"
                          onClick={() => openLightbox(proofs[proofModalShipment._id].imagesBeforeDelivery, idx)}
                        >
                          <img
                            src={img}
                            alt={`pickup-${idx}`}
                            className="w-full h-40 sm:h-48 object-cover rounded-xl shadow-md group-hover:shadow-xl transition-all border-2 border-transparent group-hover:border-blue-400"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
                            <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* After Delivery Images */}
                {proofs[proofModalShipment._id].imagesAfterDelivery?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-3 sm:p-4 border-2 border-green-200">
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="bg-green-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">✓</span>
                      <span>Ảnh Delivered ({proofs[proofModalShipment._id].imagesAfterDelivery.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {proofs[proofModalShipment._id].imagesAfterDelivery.map((img, idx) => (
                        <div 
                          key={`after-${idx}`}
                          className="relative group cursor-pointer touch-manipulation"
                          onClick={() => openLightbox(proofs[proofModalShipment._id].imagesAfterDelivery, idx)}
                        >
                          <img
                            src={img}
                            alt={`delivered-${idx}`}
                            className="w-full h-40 sm:h-48 object-cover rounded-xl shadow-md group-hover:shadow-xl transition-all border-2 border-transparent group-hover:border-green-400"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
                            <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                          </div>
                        </div>
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
    </div>
  );
}
  
