import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, AlertCircle } from "lucide-react";
import Portal from "../common/Portal";
import { useEarlyReturn } from "../../hooks/useEarlyReturn";

const EditEarlyReturnModal = ({ isOpen, onClose, request, onSuccess }) => {
  const { updateRequest, updating } = useEarlyReturn();
  const [formData, setFormData] = useState({
    requestedReturnDate: "",
    notes: "",
  });

  useEffect(() => {
    if (request) {
      setFormData({
        requestedReturnDate: request.requestedReturnDate
          ? new Date(request.requestedReturnDate).toISOString().split("T")[0]
          : "",
        notes: request.renterNotes || "",
      });
    }
  }, [request]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate date
      const newDate = new Date(formData.requestedReturnDate);
      const originalEndDate = new Date(request.originalPeriod.endDate);
      const oneDayBefore = new Date(originalEndDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      if (newDate > oneDayBefore) {
        alert("Ngày trả phải ít nhất 1 ngày trước ngày trả gốc");
        return;
      }

      await updateRequest(request._id, {
        requestedReturnDate: formData.requestedReturnDate,
        notes: formData.notes,
      });

      onSuccess();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (!isOpen || !request) return null;

  // Check if request is editable
  const isEditable = request.status === "PENDING";
  const hasShipperConfirmed =
    request.returnShipment?.status &&
    request.returnShipment.status !== "PENDING";

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full z-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Chỉnh Sửa Yêu Cầu Trả Sớm</h2>
              <p className="text-white/80 text-sm mt-1">
                Mã: {request.requestNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Warning if not editable */}
          {!isEditable && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-800">
                    Không thể chỉnh sửa
                  </h3>
                  <p className="text-red-700 text-sm">
                    Yêu cầu chỉ có thể chỉnh sửa khi ở trạng thái PENDING và
                    người giao hàng chưa xác nhận.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasShipperConfirmed && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 m-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    Người giao hàng đã xác nhận
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    Không thể chỉnh sửa sau khi người giao hàng đã xác nhận đơn
                    hàng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Current Info Display */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-800 mb-3">
                Thông tin hiện tại
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ngày trả gốc:</span>
                  <p className="font-medium">
                    {new Date(
                      request.originalPeriod.endDate
                    ).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Trạng thái:</span>
                  <p className="font-medium">{request.status}</p>
                </div>
              </div>
            </div>

            {/* Requested Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Ngày trả mới
              </label>
              <input
                type="date"
                value={formData.requestedReturnDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requestedReturnDate: e.target.value,
                  })
                }
                disabled={!isEditable || hasShipperConfirmed}
                max={
                  new Date(
                    new Date(request.originalPeriod.endDate).setDate(
                      new Date(request.originalPeriod.endDate).getDate() - 1
                    )
                  )
                    .toISOString()
                    .split("T")[0]
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Phải ít nhất 1 ngày trước ngày trả gốc
              </p>
            </div>

            {/* Return Address (Display only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Địa chỉ trả hàng
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {request.returnAddress.streetAddress},{" "}
                {request.returnAddress.ward}, {request.returnAddress.district},{" "}
                {request.returnAddress.city}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Không thể thay đổi địa chỉ khi chỉnh sửa. Vui lòng xóa và tạo
                yêu cầu mới nếu cần đổi địa chỉ.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                disabled={!isEditable || hasShipperConfirmed}
                rows={3}
                placeholder="Thêm ghi chú về yêu cầu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!isEditable || hasShipperConfirmed || updating}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Đang lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditEarlyReturnModal;
