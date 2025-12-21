import api from "./api";

export const kycService = {
  // Upload ảnh CCCD (mặt trước và mặt sau) - Tự động OCR
  uploadCCCDImages: async (frontImage, backImage) => {
    try {
      const formData = new FormData();

      if (frontImage) {
        formData.append("frontImage", frontImage);
      }
      if (backImage) {
        formData.append("backImage", backImage);
      }
      const response = await api.post("/kyc/upload-cccd", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response; // Trả về toàn bộ response để debug
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin CCCD thủ công
  updateCCCDInfo: async (cccdInfo) => {
    try {
      const response = await api.put("/kyc/cccd-info", cccdInfo);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy ảnh CCCD - yêu cầu password
  getCCCDImages: async (password) => {
    try {
      const response = await api.post("/kyc/cccd-images", { password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin CCCD
  getUserCCCD: async () => {
    try {
      const response = await api.get("/kyc/cccd-info");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa ảnh CCCD
  deleteCCCDImages: async () => {
    try {
      const response = await api.delete("/kyc/cccd-images");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy trạng thái KYC
  getKYCStatus: async () => {
    try {
      const response = await api.get("/kyc/status");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default kycService;
