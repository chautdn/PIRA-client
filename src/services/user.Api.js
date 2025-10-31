import api from "./api";

const userService = {
  getAllUsers: () => api.get("/users"),
  createUser: (payload) => api.post("/users/create", payload),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (payload) => api.put("/users/profile", payload),
  updateProfileByKyc: () => api.put("/users/profile-by-kyc"), // Không cần payload
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Bank account management
  getBankAccount: () => api.get("/users/bank-account"),
  addBankAccount: (data) => api.post("/users/bank-account", data),
  updateBankAccount: (data) => api.put("/users/bank-account", data),
  removeBankAccount: () => api.delete("/users/bank-account"),
  getVietnameseBanks: () => api.get("/users/banks"), // Public endpoint
};

export default userService;
