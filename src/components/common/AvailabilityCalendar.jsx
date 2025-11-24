import React, { useState, useEffect } from 'react';
import rentalOrderService from '../../services/rentalOrder';

const AvailabilityCalendar = ({ productId, selectedDates, onDateSelect }) => {
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState(null);

  // Get calendar data for current month
  useEffect(() => {
    if (!productId) return;
    
    fetchAvailabilityCalendar();
  }, [productId, currentMonth]);

  const fetchAvailabilityCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get first and last day of current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await rentalOrderService.getProductAvailabilityCalendar(
        productId,
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      
      console.log('🔍 Full API response:', JSON.stringify(response, null, 2));
      
      if (response.status === 'success') {
        // Correct response structure: response.data.metadata.calendar
        const calendarData = response.data?.metadata?.calendar || [];
        console.log('📊 Calendar data received:', calendarData);
        console.log('📊 Calendar data length:', calendarData.length);
        if (calendarData.length > 0) {
          console.log('📅 First calendar entry:', calendarData[0]);
        }
        setCalendar(calendarData);
      } else {
        console.error('❌ API Error:', response.message);
        setError(response.message || 'Không thể lấy lịch availability');
      }
    } catch (error) {
      console.error('❌ Error fetching availability calendar:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(`Lỗi khi tải lịch availability: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isDateSelected = (dateString) => {
    if (!selectedDates) return false;
    const date = new Date(dateString);
    const startDate = selectedDates.startDate ? new Date(selectedDates.startDate) : null;
    const endDate = selectedDates.endDate ? new Date(selectedDates.endDate) : null;
    
    if (startDate && endDate) {
      return date >= startDate && date < endDate;
    }
    return false;
  };

  const getDayStatus = (dayInfo) => {
    if (dayInfo.isFullyBooked) return 'fully-booked';
    if (dayInfo.bookedQuantity > 0) return 'partially-booked';
    return 'available';
  };

  const getDayStatusColor = (status) => {
    switch (status) {
      case 'fully-booked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partially-booked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const handleDateClick = (dayInfo) => {
    if (onDateSelect && !dayInfo.isFullyBooked) {
      onDateSelect(dayInfo.date);
    }
  };

  // Calculate minimum available quantity for selected date range
  const getAvailableQuantityForRange = () => {
    if (!selectedDates?.startDate || !selectedDates?.endDate || !calendar.length) {
      return null;
    }

    const startDate = new Date(selectedDates.startDate);
    const endDate = new Date(selectedDates.endDate);
    let minAvailable = Infinity;

    // Check each day in the selected range
    for (let currentDate = new Date(startDate); currentDate < endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayInfo = calendar.find(day => day.date === dateString);
      
      if (dayInfo) {
        minAvailable = Math.min(minAvailable, dayInfo.availableQuantity);
      }
    }

    return minAvailable === Infinity ? null : minAvailable;
  };

  // Generate calendar grid with empty cells for proper alignment
  const generateCalendarGrid = () => {
    if (!calendar.length) return [];
    
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    const grid = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDate; i++) {
      grid.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInfo = calendar.find(d => d.date === dateString) || {
        date: dateString,
        totalQuantity: 0,
        bookedQuantity: 0,
        availableQuantity: 0,
        isFullyBooked: true,
        bookings: []
      };
      grid.push(dayInfo);
    }
    
    return grid;
  };

  const monthYearText = currentMonth.toLocaleDateString('vi-VN', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải lịch...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchAvailabilityCalendar}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const calendarGrid = generateCalendarGrid();

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Lịch Availability</h3>
        <p className="text-sm text-gray-600">
          Kiểm tra thời gian sản phẩm có sẵn để thuê
        </p>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          ←
        </button>
        <h4 className="text-lg font-medium capitalize">{monthYearText}</h4>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          →
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarGrid.map((dayInfo, index) => {
          if (!dayInfo) {
            return <div key={index} className="h-12"></div>;
          }

          const status = getDayStatus(dayInfo);
          const statusColor = getDayStatusColor(status);
          const isSelected = isDateSelected(dayInfo.date);
          const dayNumber = new Date(dayInfo.date).getDate();

          return (
            <div
              key={dayInfo.date}
              onClick={() => handleDateClick(dayInfo)}
              className={`
                h-12 border rounded cursor-pointer flex flex-col items-center justify-center text-xs
                ${statusColor}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${!dayInfo.isFullyBooked ? 'hover:opacity-80' : 'cursor-not-allowed'}
                transition-all
              `}
              title={`${dayNumber}/${currentMonth.getMonth() + 1}: ${dayInfo.availableQuantity}/${dayInfo.totalQuantity} có sẵn`}
            >
              <span className="font-medium">{dayNumber}</span>
              <span className="text-xs">
                {dayInfo.availableQuantity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span>Có sẵn</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>Một phần đã thuê</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
          <span>Hết hàng</span>
        </div>
      </div>

      {/* Selected Date Range with Available Quantity */}
      {selectedDates && selectedDates.startDate && selectedDates.endDate && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800 mb-2">
            <strong>Thời gian đã chọn:</strong>{' '}
            {new Date(selectedDates.startDate).toLocaleDateString('vi-VN')} -{' '}
            {new Date(selectedDates.endDate).toLocaleDateString('vi-VN')}
          </div>
          {(() => {
            const availableQty = getAvailableQuantityForRange();
            return availableQty !== null ? (
              <div className="text-lg font-semibold">
                {availableQty > 0 ? (
                  <span className="text-green-600">
                    ✅ Còn lại: {availableQty} sản phẩm có sẵn
                  </span>
                ) : (
                  <span className="text-red-600">
                    ❌ Hết hàng trong thời gian này
                  </span>
                )}
              </div>
            ) : (
              <div className="text-gray-600">
                Đang kiểm tra availability...
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;