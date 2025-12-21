import React, { useState, useEffect } from 'react';
import ShipmentService from '../../services/shipment';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageShipmentModal({ isOpen, onClose, subOrder, masterOrder, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [shippers, setShippers] = useState([]);
  const [selectedShipperId, setSelectedShipperId] = useState(null);
  const [loadingShippers, setLoadingShippers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchShippers();
    }
  }, [isOpen]);

  const fetchShippers = async () => {
    setLoadingShippers(true);
    try {
      const response = await ShipmentService.getAvailableShippers?.();
      
      // Response structure: { status: 'success', data: [...] }
      const shipperList = Array.isArray(response?.data) ? response.data : [];
      
      setShippers(shipperList);
    } catch (err) {
      setShippers([]);
    } finally {
      setLoadingShippers(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedShipperId) {
      toast.error('Vui lòng chọn shipper');
      return;
    }

    setLoading(true);
    try {
      const masterOrderId = masterOrder?._id;
      if (!masterOrderId) {
        toast.error('Không tìm thấy master order');
        setLoading(false);
        return;
      }

      const res = await ShipmentService.createDeliveryAndReturnShipments(masterOrderId, selectedShipperId);
      
      if (res.status === 'success') {
        toast.success(`✅ Đã tạo ${res.data?.count || 0} shipment (${res.data?.pairs || 0} cặp giao/trả)`);
      } else {
        toast.success('Đã gửi yêu cầu tạo shipment');
      }
      
      setLoading(false);
      onSuccess && onSuccess(res.data);
      onClose && onClose();
    } catch (err) {
      toast.error(err.message || 'Không thể gửi yêu cầu');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gửi yêu cầu vận chuyển</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X /></button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Chọn shipper cho sub-order <strong>#{subOrder?.subOrderNumber}</strong>
          </p>
          
          {/* Shipper Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Shipper</label>
            {loadingShippers ? (
              <div className="text-center py-4 text-gray-500">Đang tải danh sách shipper...</div>
            ) : shippers.length > 0 ? (
              <>
                <select
                  value={selectedShipperId || ''}
                  onChange={(e) => setSelectedShipperId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn shipper --</option>
                  {shippers.map((shipper, idx) => {
                    const displayName = 
                      shipper?.name || 
                      `${shipper?.profile?.firstName || ''} ${shipper?.profile?.lastName || ''}`.trim() ||
                      shipper?.email ||
                      `Shipper #${idx}`;
                    
                    return (
                      <option key={shipper._id || idx} value={shipper._id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  ({shippers.length} shipper{shippers.length !== 1 ? 's' : ''})
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">Không có shipper khả dụng</div>
            )}
          </div>

          {/* Shipment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
            <p>✓ Sẽ tạo <strong>2 shipment:</strong></p>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• <strong>DELIVERY:</strong> Giao hàng từ bạn đến khách</li>
              <li>• <strong>RETURN:</strong> Trả hàng từ khách về bạn</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Hủy</button>
          <button 
            onClick={handleSendRequest} 
            disabled={loading || !selectedShipperId} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang gửi...' : 'Tạo Shipment'}
          </button>
        </div>
      </div>
    </div>
  );
}
