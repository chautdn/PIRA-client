import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ShipmentService from '../../services/shipment';
import { formatCurrency } from '../../utils/constants';
import chatService from '../../services/chat';

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-2xl font-bold mb-4">Quản lí vận chuyển</h1>
      {shipments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">Không có shipment nào</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SubOrder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Phí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày pick/deliver</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.shipmentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.subOrder?._id || s.subOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">{formatCurrency(s.fee || 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {s.tracking?.pickedUpAt ? new Date(s.tracking.pickedUpAt).toLocaleString('vi-VN') : '-'}
                    {' / '}
                    {s.tracking?.deliveredAt ? new Date(s.tracking.deliveredAt).toLocaleString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      {s.status === 'PENDING' && (
                        <button onClick={() => handleAccept(s)} className="px-3 py-1 bg-green-600 text-white rounded">Nhận</button>
                      )}

                      {s.status === 'SHIPPER_CONFIRMED' && (
                        <button onClick={() => handleUploadAction(s, 'pickup')} className="px-3 py-1 bg-blue-600 text-white rounded">Pickup (chụp ảnh)</button>
                      )}

                      {s.status === 'IN_TRANSIT' && (
                        <button onClick={() => handleUploadAction(s, 'deliver')} className="px-3 py-1 bg-indigo-600 text-white rounded">Deliver (chụp ảnh)</button>
                      )}

                      {/* Show uploaded photos preview */}
                      {Array.isArray(s.tracking?.photos) && s.tracking.photos.length > 0 && (
                        <div className="flex space-x-2">
                          {s.tracking.photos.slice(0,3).map((p, i) => (
                            <img key={i} src={p} alt={`proof-${i}`} className="w-12 h-12 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
