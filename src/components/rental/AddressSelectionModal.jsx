import React, { useState } from "react";
import MapSelector from "../common/MapSelector";

const AddressSelectionModal = ({ isOpen, onClose, userAddresses = [], onSelect }) => {
  const [showMap, setShowMap] = useState(false);
  const [mapSelection, setMapSelection] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chọn địa chỉ giao hàng</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Đóng</button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Địa chỉ đã lưu</h4>
            {userAddresses && userAddresses.length > 0 ? (
              <div className="space-y-2">
                {userAddresses.map((addr) => (
                  <div
                    key={addr.id || addr._id || addr.streetAddress}
                    className="flex items-center justify-between border rounded p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelect(addr)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {addr.contactName || addr.fullName || "Người nhận"}
                        {addr.isDefault && (
                          <span className="ml-2 text-xs text-white bg-red-500 px-2 py-0.5 rounded">Mặc Định</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{addr.streetAddress}</div>
                      <div className="text-sm text-gray-500">{[addr.ward, addr.district, addr.city].filter(Boolean).join(", ")}</div>
                    </div>
                    <div className="text-sm text-blue-600">Chọn</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Bạn chưa lưu địa chỉ nào.</p>
            )}
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Chọn trên bản đồ</h4>
              <button
                className="text-sm text-blue-600"
                onClick={() => setShowMap((s) => !s)}
              >
                {showMap ? "Ẩn bản đồ" : "Mở bản đồ"}
              </button>
            </div>
            {showMap && (
              <div>
                <MapSelector
                  onLocationSelect={(loc) => setMapSelection(loc)}
                  placeholder="Chọn địa điểm trên bản đồ..."
                />

                <div className="flex justify-end mt-3">
                  <button
                    disabled={!mapSelection}
                    onClick={() => {
                      if (mapSelection) {
                        onSelect(mapSelection);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                  >
                    Chọn địa chỉ này
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressSelectionModal;
