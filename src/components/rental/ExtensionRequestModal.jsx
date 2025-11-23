import React, { useState, useEffect } from 'react';
import extensionService from '../../services/extension.js';

const ExtensionRequestModal = ({ isOpen, onClose, subOrder, onSuccess }) => {
  const [newEndDate, setNewEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [calculating, setCalculating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form khi mở
      setNewEndDate('');
      setReason('');
      setEstimatedCost(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const calc = () => {
      if (!subOrder || !newEndDate) {
        console.log('🔍 Calc skipped - missing subOrder or newEndDate', { hasSubOrder: !!subOrder, hasNewEndDate: !!newEndDate });
        return setEstimatedCost(0);
      }
      try {
        setCalculating(true);
        
        // Get current end date - try multiple paths
        let currentEndDate = subOrder.rentalPeriod?.endDate || subOrder.products?.[0]?.rentalPeriod?.endDate;
        let startDate = subOrder.rentalPeriod?.startDate || subOrder.products?.[0]?.rentalPeriod?.startDate;
        
        if (!currentEndDate || !startDate) {
          console.warn('⚠️ Missing rental period dates', { currentEndDate, startDate });
          return setEstimatedCost(0);
        }

        const currentEnd = new Date(currentEndDate);
        const newEnd = new Date(newEndDate);
        
        console.log('🔢 Date calculation:', { currentEnd, newEnd });
        
        const diff = Math.ceil((newEnd - currentEnd) / (1000 * 60 * 60 * 24));
        console.log('📅 Extension days:', diff);
        
        if (diff <= 0) {
          console.warn('⚠️ Extension days <= 0');
          return setEstimatedCost(0);
        }

        // Try multiple ways to get rental amount
        let rentalAmount = 0;
        
        // Method 1: From pricing
        if (subOrder.pricing?.rentalAmount) {
          rentalAmount = subOrder.pricing.rentalAmount;
          console.log('💰 Got rentalAmount from pricing:', rentalAmount);
        }
        // Method 2: From products sum
        else if (subOrder.products?.length > 0) {
          rentalAmount = subOrder.products.reduce((sum, p) => sum + (p.rentalRate * p.quantity || 0), 0);
          console.log('💰 Calculated rentalAmount from products:', rentalAmount);
        }
        // Method 3: From pricing totalRental
        else if (subOrder.pricing?.totalRental) {
          rentalAmount = subOrder.pricing.totalRental;
          console.log('💰 Got rentalAmount from pricing.totalRental:', rentalAmount);
        }

        if (rentalAmount <= 0) {
          console.warn('⚠️ rentalAmount is 0 or negative, using default calculation');
          // Fallback: assume 50k per day if no pricing available
          rentalAmount = 50000;
        }

        const originalDays = Math.max(1, Math.ceil((new Date(currentEndDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
        const dailyRate = rentalAmount / originalDays;
        const cost = Math.round(dailyRate * diff);
        
        console.log('📊 Final calculation:', { rentalAmount, originalDays, dailyRate, diff, cost });
        setEstimatedCost(cost);
      } catch (err) {
        console.error('❌ Cost calculation error:', err);
        setEstimatedCost(0);
      } finally {
        setCalculating(false);
      }
    };
    calc();
  }, [newEndDate, subOrder]);

  const handleSubmit = async () => {
    if (!newEndDate || newEndDate.trim() === '') {
      return alert('Vui lòng chọn ngày kết thúc mới');
    }
    
    // Get current end date - try multiple paths
    let currentEndDate = null;
    if (subOrder?.rentalPeriod?.endDate) {
      currentEndDate = subOrder.rentalPeriod.endDate;
    } else if (subOrder?.products?.[0]?.rentalPeriod?.endDate) {
      currentEndDate = subOrder.products[0].rentalPeriod.endDate;
    }

    if (!currentEndDate) {
      return alert('Không tìm thấy ngày kết thúc hiện tại của đơn hàng');
    }

    const currentEnd = new Date(currentEndDate).getTime();
    const newEnd = new Date(newEndDate).getTime();
    
    console.log('🔍 Date check:', { currentEndDate, newEndDate, currentEnd, newEnd });
    
    if (newEnd <= currentEnd) {
      return alert('Ngày kết thúc phải sau ngày kết thúc hiện tại: ' + new Date(currentEndDate).toLocaleString('vi-VN'));
    }

    try {
      setProcessing(true);
      console.log('📤 Submitting extension request:', { 
        subOrderId: subOrder._id, 
        newEndDate, 
        reason, 
        paymentMethod,
        estimatedCost 
      });

      // Call extension API - server will handle payment
      const result = await extensionService.requestExtension(subOrder._id, {
        newEndDate: new Date(newEndDate).toISOString(),
        extensionReason: reason || 'Không có lý do',
        paymentMethod
      });

      console.log('✅ Extension request result:', result);
      alert('Yêu cầu gia hạn đã được gửi thành công');
      onSuccess && onSuccess({ type: 'success', message: 'Yêu cầu gia hạn đã được gửi' });
      onClose && onClose();
    } catch (err) {
      console.error('❌ Extension request error', err);
      const errorMsg = err.response?.data?.message || err.message || err.toString();
      alert('Có lỗi khi gửi yêu cầu: ' + errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Yêu cầu gia hạn thuê</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 font-medium">Ngày kết thúc mới</label>
            <input
              type="datetime-local"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {(subOrder?.rentalPeriod?.endDate || subOrder?.products?.[0]?.rentalPeriod?.endDate) && (
              <p className="mt-1 text-xs text-gray-500">
                Ngày kết thúc hiện tại: {new Date(subOrder?.rentalPeriod?.endDate || subOrder?.products?.[0]?.rentalPeriod?.endDate).toLocaleString('vi-VN')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 font-medium">Lý do (tùy chọn)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nhập lý do muốn gia hạn..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 font-medium">Phương thức thanh toán</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)} 
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="WALLET">Thanh toán bằng ví</option>
              <option value="PAYOS">Thanh toán qua PayOS</option>
              <option value="COD">Thanh toán khi nhận (COD)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 font-medium">Chi phí ước tính</div>
              <div className="font-semibold text-lg text-orange-600">
                {calculating ? '...' : `${estimatedCost?.toLocaleString('vi-VN') || 0}đ`}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            disabled={processing}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={processing}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Đang xử lý...' : 'Gửi yêu cầu và thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionRequestModal;
