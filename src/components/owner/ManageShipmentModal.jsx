import React, { useEffect, useState } from 'react';
import ShipmentService from '../../services/shipment';
import { Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageShipmentModal({ isOpen, onClose, subOrder, masterOrder, onSuccess }) {
  const [shippers, setShippers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      try {
        // prefer ward, fallback to district
        const ward = subOrder?.owner?.address?.ward || '';
        const district = subOrder?.owner?.address?.district || '';
        const city = subOrder?.owner?.address?.city || '';
        const params = ward ? { ward } : district ? { district } : { city };
        const res = await ShipmentService.listShippers(params);
        setShippers(res.data || []);
      } catch (err) {
        console.error('Failed to load shippers', err.message);
        toast.error('Không thể lấy danh sách shipper');
      }
    };
    fetch();
  }, [isOpen, subOrder]);

  const handleSendRequest = async () => {
    if (!selected) return toast.error('Vui lòng chọn shipper');
    setLoading(true);
    try {
      // Normalize fee to number: prefer pricing.shippingFee, then subOrder.shipping.fee.totalFee, then numeric fee, else 0
      const fee = (
        typeof subOrder?.pricing?.shippingFee === 'number' ? subOrder.pricing.shippingFee :
        typeof subOrder?.shipping?.fee === 'number' ? subOrder.shipping.fee :
        (subOrder?.shipping?.fee && typeof subOrder.shipping.fee.totalFee === 'number') ? subOrder.shipping.fee.totalFee :
        0
      );

      const payload = {
        subOrder: subOrder._id,
        productId: subOrder.products?.[0]?.product?._id || null,
        productIndex: 0,
        shipper: selected,
        type: 'DELIVERY',
        fromAddress: subOrder.owner?.address || {},
        toAddress: masterOrder?.deliveryAddress || {},
        fee
      };

      const res = await ShipmentService.createShipment(payload);
      toast.success('Đã gửi yêu cầu vận chuyển');
      setLoading(false);
      onSuccess && onSuccess(res.data);
      onClose && onClose();
    } catch (err) {
      console.error('Create shipment failed', err.message);
      toast.error(err.message || 'Không thể gửi yêu cầu');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quản lí vận chuyển</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X /></button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Chọn shipper phù hợp cho sub-order #{subOrder.subOrderNumber}</p>

        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
          {shippers.length === 0 && <p className="text-sm text-gray-500">Không có shipper tại khu vực này</p>}
          {shippers.map((s) => (
            <label key={s._id} className={`flex items-center p-3 border rounded ${selected === s._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="shipper" value={s._id} checked={selected === s._id} onChange={() => setSelected(s._id)} className="mr-3" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.profile?.firstName || s.profile?.lastName ? `${s.profile.firstName || ''} ${s.profile.lastName || ''}` : s.email}</p>
                    <p className="text-sm text-gray-600">{s.address?.ward || ''} - {s.address?.district || ''}</p>
                  </div>
                  <div className="text-sm text-gray-500">{s.phone || ''}</div>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Hủy</button>
          <button onClick={handleSendRequest} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}
