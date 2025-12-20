import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import ShipmentService from '../../services/shipment';
import useChatSocket from '../../hooks/useChatSocket';
import ShipmentManagementModal from '../../components/shipper/ShipmentManagementModal';
import { FaCalendarAlt } from 'react-icons/fa';
import { LuPackage } from 'react-icons/lu';
import { CiDeliveryTruck } from 'react-icons/ci';
import { IoCheckmarkDoneCircle } from 'react-icons/io5';

export default function ShipmentsCalendar() {
  const { user } = useAuth();
  const { socket, connected } = useChatSocket();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [managementModalOpen, setManagementModalOpen] = useState(false);

  // Load shipments
  useEffect(() => {
    if (!user) return;
    loadShipments();
  }, [user]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const resp = await ShipmentService.listMyShipments();
      const data = resp.data || resp;
      const shipmentsData = Array.isArray(data) ? data : (data.data || data);
      setShipments(shipmentsData);
    } catch (err) {
      console.error('Failed to load shipments', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time shipment updates and notifications
  useEffect(() => {
    if (!socket || !connected) return;

    const handleShipmentCreated = (data) => {
      console.log('📦 [ShipmentsCalendar] Shipment created event received:', data);
      
      // Show toast notification
      const typeLabel = data.shipment?.type === 'DELIVERY' ? '📦 Giao hàng' : '🔄 Trả hàng';
      const toast = require('react-hot-toast').default;
      toast.success(`✅ ${typeLabel} mới: ${data.shipment?.shipmentId || ''}`);
      
      loadShipments();
    };

    const handleNotification = (data) => {
      console.log('🔔 [ShipmentsCalendar] Notification received:', data);
      
      // If it's a shipment notification, show toast and refresh
      if (data.notification?.type === 'SHIPMENT') {
        const toast = require('react-hot-toast').default;
        toast.success(
          `🔔 ${data.notification.title || 'Thông báo mới'}`,
          { duration: 5000 }
        );
      }
    };

    socket.on('shipment:created', handleShipmentCreated);
    socket.on('notification:new', handleNotification);
    
    console.log('✅ [ShipmentsCalendar] Socket listeners registered');

    return () => {
      socket.off('shipment:created', handleShipmentCreated);
      socket.off('notification:new', handleNotification);
      console.log('🔌 [ShipmentsCalendar] Socket listeners removed');
    };
  }, [socket, connected]);

  // Get week dates (Monday to Sunday)
  const getWeekDates = (date) => {
    const current = new Date(date);
    const dayOfWeek = current.getDay();
    const monday = new Date(current);
    monday.setDate(current.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);

  // Navigate week
  const previousWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Format date helpers
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  };

  const formatDayLabel = (index) => {
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return days[index];
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const isToday = (date) => isSameDay(date, new Date());

  // Get shipment date
  const getShipmentDate = (shipment) => {
    if (shipment.scheduledAt) return new Date(shipment.scheduledAt);
    
    const rentalPeriod = shipment.subOrder?.rentalPeriod;
    if (rentalPeriod) {
      if (shipment.type === 'DELIVERY' && rentalPeriod.startDate) {
        return new Date(rentalPeriod.startDate);
      }
      if (shipment.type === 'RETURN' && rentalPeriod.endDate) {
        return new Date(rentalPeriod.endDate);
      }
    }
    return null;
  };

  // Get shipments for a specific day
  const getShipmentsForDay = (date) => {
    return shipments.filter(s => {
      const shipmentDate = getShipmentDate(s);
      return shipmentDate && isSameDay(shipmentDate, date);
    });
  };

  // Handle shipment click
  const handleShipmentClick = (shipment) => {
    setSelectedShipment(shipment);
    setManagementModalOpen(true);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': 
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-400 hover:from-yellow-100 hover:to-yellow-200';
      case 'SHIPPER_CONFIRMED': 
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-400 hover:from-blue-100 hover:to-blue-200';
      case 'IN_TRANSIT': 
        return 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-400 hover:from-purple-100 hover:to-purple-200';
      case 'DELIVERED': 
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-400 hover:from-green-100 hover:to-green-200';
      default: 
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-300 hover:from-gray-100 hover:to-gray-200';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    return type === 'DELIVERY' ? '📦' : '🔄';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <FaCalendarAlt className="text-xl sm:text-2xl text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Quản lý đơn hàng
              </h1>
            </div>
            <button
              onClick={goToToday}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
            >
              Hôm nay
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <button
              onClick={previousWeek}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all hover:shadow-md flex-shrink-0"
            >
              <span className="text-lg sm:text-xl text-gray-600">←</span>
            </button>
            
            <div className="flex-1 bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 sm:p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">year</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-3">{currentWeek.getFullYear()}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">week</div>
                <div className="text-base sm:text-lg font-semibold text-gray-700">{formatWeekRange()}</div>
              </div>
            </div>

            <button
              onClick={nextWeek}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all hover:shadow-md flex-shrink-0"
            >
              <span className="text-lg sm:text-xl text-gray-600">→</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Desktop View */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-7 gap-0.5 bg-gray-200">
              {weekDates.map((date, index) => {
                const dayShipments = getShipmentsForDay(date);
                const today = isToday(date);

                return (
                  <div
                    key={index}
                    className={`bg-white min-h-[220px] p-4 transition-all ${
                      today ? 'ring-2 ring-red-500 bg-red-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="mb-4 pb-3 border-b-2 border-gray-100">
                      <div className={`text-sm font-bold ${
                        today ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {formatDayLabel(index)}
                      </div>
                      <div className={`text-lg font-bold mt-1 ${
                        today ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </div>

                    {/* Shipments */}
                    <div className="space-y-2">
                      {dayShipments.map((shipment) => (
                        <motion.div
                          key={shipment._id}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleShipmentClick(shipment)}
                          className={`p-3 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md ${
                            getStatusColor(shipment.status)
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">{getTypeIcon(shipment.type)}</span>
                            <span className="text-xs font-bold uppercase tracking-wide">
                              đơn
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-700 truncate">
                            {shipment.shipmentId}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet View - Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto">
            <div className="flex gap-0.5 bg-gray-200 min-w-max p-0.5">
              {weekDates.map((date, index) => {
                const dayShipments = getShipmentsForDay(date);
                const today = isToday(date);

                return (
                  <div
                    key={index}
                    className={`bg-white min-h-[200px] w-[160px] sm:w-[180px] p-3 transition-all flex-shrink-0 ${
                      today ? 'ring-2 ring-red-500 bg-red-50/30' : ''
                    }`}
                  >
                    {/* Day Header */}
                    <div className="mb-3 pb-2 border-b-2 border-gray-100">
                      <div className={`text-xs sm:text-sm font-bold ${
                        today ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {formatDayLabel(index)}
                      </div>
                      <div className={`text-base sm:text-lg font-bold mt-1 ${
                        today ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </div>

                    {/* Shipments */}
                    <div className="space-y-2">
                      {dayShipments.map((shipment) => (
                        <motion.div
                          key={shipment._id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleShipmentClick(shipment)}
                          className={`p-2.5 rounded-lg cursor-pointer transition-all shadow-sm active:shadow-md ${
                            getStatusColor(shipment.status)
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{getTypeIcon(shipment.type)}</span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                              đơn
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-xs font-medium text-gray-700 truncate">
                            {shipment.shipmentId}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <LuPackage className="text-xl sm:text-2xl text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Tổng đơn</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{shipments.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <CiDeliveryTruck className="text-xl sm:text-2xl text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Đang giao</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {shipments.filter(s => s.status === 'IN_TRANSIT').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <IoCheckmarkDoneCircle className="text-xl sm:text-2xl text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Hoàn thành</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {shipments.filter(s => s.status === 'DELIVERED').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management Modal */}
      {managementModalOpen && selectedShipment && (
        <ShipmentManagementModal
          isOpen={managementModalOpen}
          onClose={() => {
            setManagementModalOpen(false);
            setSelectedShipment(null);
            loadShipments();
          }}
          shipment={selectedShipment}
          onShipmentUpdate={loadShipments}
        />
      )}
    </div>
  );
}
