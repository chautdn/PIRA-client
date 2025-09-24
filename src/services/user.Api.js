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
};

export default userService;
