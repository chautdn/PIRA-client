export const getStatusColor = (status) => {
  const colors = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PAYMENT_COMPLETED: "bg-blue-100 text-blue-800",
    PENDING_CONFIRMATION: "bg-orange-100 text-orange-800",
    OWNER_CONFIRMED: "bg-blue-100 text-blue-800",
    OWNER_REJECTED: "bg-red-100 text-red-800",
    CONFIRMED: "bg-green-100 text-green-800",
    PARTIALLY_CANCELLED: "bg-yellow-100 text-yellow-800",
    READY_FOR_CONTRACT: "bg-purple-100 text-purple-800",
    CONTRACT_SIGNED: "bg-green-100 text-green-800",
    DELIVERED: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getStatusText = (status) => {
  const texts = {
    DRAFT: "Nháp",
    PENDING_PAYMENT: "Chờ thanh toán",
    PAYMENT_COMPLETED: "Đã thanh toán",
    PENDING_CONFIRMATION: "Chờ xác nhận",
    OWNER_CONFIRMED: "Chủ đã xác nhận",
    OWNER_REJECTED: "Chủ từ chối",
    CONFIRMED: "Đã xác nhận",
    PARTIALLY_CANCELLED: "Xác nhận một phần",
    READY_FOR_CONTRACT: "Sẵn sàng ký HĐ",
    CONTRACT_SIGNED: "Đã ký HĐ",
    DELIVERED: "Đã giao hàng",
    ACTIVE: "Đang thuê",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return texts[status] || status;
};

export const getEarlyReturnStatusColor = (status) => {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACKNOWLEDGED: "bg-blue-100 text-blue-800",
    RETURNED: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    AUTO_COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getEarlyReturnStatusText = (status) => {
  const texts = {
    PENDING: "Chờ xử lý",
    ACKNOWLEDGED: "Đã xác nhận",
    RETURNED: "Đã trả hàng",
    COMPLETED: "Hoàn thành",
    AUTO_COMPLETED: "Tự động hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return texts[status] || status;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
