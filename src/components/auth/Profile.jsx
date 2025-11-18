import React, { useState, useEffect } from "react";
import userService from "../../services/user.Api";
import kycService from "../../services/kyc.Api"; // Thêm import này
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import KycModal from "../common/KycModal";
import BankAccountSection from "../wallet/BankAccountSection";

const Profile = () => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // KYC Modal states
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  const [formData, setFormData] = useState({
    profile: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
    },
    phone: "",
    address: {
      streetAddress: "",
      district: "",
      city: "",
      province: "",
    },
  });

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  };

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
    loadKycStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      const userData = response.data.data;

      setUser(userData);

      setFormData({
        profile: {
          firstName: userData.profile?.firstName || "",
          lastName: userData.profile?.lastName || "",
          dateOfBirth: userData.profile?.dateOfBirth
            ? new Date(userData.profile.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: userData.profile?.gender || "",
        },
        phone: userData.phone || "",
        address: {
          streetAddress: userData.address?.streetAddress || "",
          district: userData.address?.district || "",
          city: userData.address?.city || "",
          province: userData.address?.province || "",
        },
      });

      // **SAU KHI LOAD PROFILE, LOAD KYC STATUS**
      await loadKycStatus();
    } catch (error) {
      toast.error("Không thể tải thông tin profile");
    } finally {
      setLoading(false);
    }
  };

  const loadKycStatus = async () => {
    try {
      const statusResponse = await kycService.getKYCStatus();

      if (statusResponse.data?.status === "verified") {
        const kycData = statusResponse.data;
        setKycStatus(kycData);
      } else {
        setKycStatus({
          isVerified: false,
          hasImages: false,
          status: "not_started",
        });
      }
    } catch (error) {
      console.error("Load KYC status error:", error);

      // Fallback: use info from user profile
      if (user?.cccd) {
        setKycStatus({
          isVerified: user.cccd.isVerified || false,
          hasImages: !!user.cccd.frontImageHash,
          status: user.cccd.isVerified ? "verified" : "pending",
        });
      } else {
        setKycStatus({
          isVerified: false,
          hasImages: false,
          status: "not_started",
        });
      }
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleDirectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await userService.updateProfile(formData);
      setUser(response.data);
      setEditing(false);
      toast.success("Cập nhật thành công!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchProfile();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      // 1MB limit
      toast.error("File quá lớn (tối đa 1MB)");
      return;
    }

    if (!file.type.match(/\.(jpeg|jpg|png)$/)) {
      toast.error("Chỉ hỗ trợ định dạng JPEG, PNG");
      return;
    }

    try {
      setSaving(true);
      const response = await userService.uploadAvatar(file);
      setUser((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: response.data.avatarUrl,
        },
      }));
      toast.success("Cập nhật avatar thành công!");
    } catch (error) {
      toast.error("Không thể upload avatar");
    } finally {
      setSaving(false);
    }
  };

  // Handle KYC Modal
  const handleKycSuccess = async (result) => {
    if (result.skipped) {
      toast.success("Xác thực KYC thành công!");
    } else {
      toast.success("Xác thực danh tính và cập nhật profile thành công!");
    }

    // Reload cả KYC status và profile
    await loadKycStatus();
    await fetchProfile();

    // Đóng modal
    setShowKycModal(false);
  };

  // Get KYC status display - check user.cccd.isVerified directly
  const getKycStatusDisplay = () => {
    // Use user.cccd.isVerified as the source of truth (matches withdrawal requirements)
    const isVerified = user?.cccd?.isVerified === true;
    const hasImages = user?.cccd?.frontImageHash || kycStatus?.hasImages;

    if (isVerified) {
      return {
        text: "Đã xác thực",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: "✅",
      };
    }

    if (hasImages) {
      return {
        text: "Chờ xác thực",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: "⏳",
      };
    }

    return {
      text: "Chưa xác thực",
      color: "text-red-500",
      bgColor: "bg-red-100",
      icon: "❌",
    };
  };

  // Sidebar menu items
  const menuItems = [
    { id: "notifications", icon: "🔔", label: "Thông Báo" },
    {
      id: "profile",
      icon: "👤",
      label: "Tài Khoản Của Tôi",
      submenu: [
        { id: "profile", label: "Hồ Sơ" },
        { id: "address", label: "Địa Chỉ" },
        { id: "password", label: "Đổi Mật Khẩu" },
        { id: "verification", label: "Xác Minh Tài Khoản" },
        { id: "banking", label: "Tài Khoản Ngân Hàng" },
      ],
    },
    { id: "orders", icon: "📋", label: "Đơn Thuê" },
    { id: "vouchers", icon: "🎫", label: "Kho Voucher" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Đang tải thông tin...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <motion.div
            className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 h-fit sticky top-6 overflow-hidden"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            {/* User Info Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                    {user?.profile?.avatar ? (
                      <img
                        src={user.profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {user?.profile?.firstName?.charAt(0) ||
                          user?.email?.charAt(0) ||
                          "A"}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-bold text-white text-lg">
                    {user?.profile?.firstName && user?.profile?.lastName
                      ? `${user.profile.firstName} ${user.profile.lastName}`
                      : user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-blue-100 text-sm flex items-center mt-1">
                    <span className="mr-1">✏️</span>
                    Sửa Hồ Sơ
                  </p>
                </div>
              </div>
              
              
            </div>

            {/* Menu Items */}
            <div className="py-3">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button className="w-full flex items-center px-5 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group">
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900">{item.label}</span>
                  </button>

                  {item.submenu && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSection(subItem.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 rounded-lg ${
                            activeSection === subItem.id
                              ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-md transform scale-105"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="flex-1"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 p-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                      <span className="text-4xl">
                        {activeSection === "profile" && "👤"}
                        {activeSection === "address" && "📍"}
                        {activeSection === "verification" && "🆔"}
                        {activeSection === "password" && "🔐"}
                        {activeSection === "banking" && "🏦"}
                      </span>
                      {activeSection === "profile" && "Hồ Sơ Của Tôi"}
                      {activeSection === "address" && "Địa Chỉ"}
                      {activeSection === "verification" && "Xác Minh Tài Khoản"}
                      {activeSection === "password" && "Đổi Mật Khẩu"}
                      {activeSection === "banking" && "Tài Khoản Ngân Hàng"}
                    </h1>
                    <p className="text-orange-100 mt-2 text-lg">
                      {activeSection === "verification"
                        ? "Xác minh danh tính để nâng cao độ tin cậy tài khoản"
                        : activeSection === "banking"
                        ? "Quản lý tài khoản ngân hàng để rút tiền"
                        : "Quản lý thông tin hồ sơ để bảo mật tài khoản"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeSection === "verification" && (
                  <div className="max-w-2xl">
                    <div className="space-y-6">
                      {/* Email Verification */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                            <span className="text-3xl">📧</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              Xác thực Email
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Xác nhận địa chỉ email của bạn
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                              user?.verification?.emailVerified
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {user?.verification?.emailVerified
                              ? "✅ Đã xác thực"
                              : "❌ Chưa xác thực"}
                          </span>
                          {!user?.verification?.emailVerified && (
                            <button className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                              Xác thực ngay
                            </button>
                          )}
                        </div>
                      </div>

                      {/* KYC Verification */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                            <span className="text-3xl">🆔</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              Xác thực Danh tính (KYC)
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {user?.cccd?.isVerified
                                ? "Danh tính của bạn đã được xác minh"
                                : "Upload CCCD/CMND để xác minh danh tính"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                              getKycStatusDisplay().bgColor
                            } ${getKycStatusDisplay().color}`}
                          >
                            {getKycStatusDisplay().icon}{" "}
                            {getKycStatusDisplay().text}
                          </span>
                          <button
                            onClick={() => setShowKycModal(true)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                              user?.cccd?.isVerified
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                            }`}
                          >
                            {user?.cccd?.isVerified
                              ? "👁️ Xem thông tin"
                              : "🔐 Xác thực ngay"}
                          </button>
                        </div>
                      </div>

                      {/* Security Level */}
                      <div className="mt-8 p-8 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl border-2 border-indigo-200 shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center text-xl">
                          <span className="text-3xl mr-3">🛡️</span>
                          Mức độ bảo mật tài khoản
                        </h3>

                        <div className="flex items-center mb-6">
                          <div className="flex-1 bg-gray-300 rounded-full h-4 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                              style={{
                                width: `${
                                  (user?.verification?.emailVerified ? 50 : 0) +
                                  +(user?.cccd?.isVerified ? 50 : 0)
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-4 text-base font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-md">
                            {(user?.verification?.emailVerified ? 1 : 0) +
                              (user?.cccd?.isVerified ? 1 : 0)}
                            /2 Hoàn thành
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 bg-white/60 p-4 rounded-lg">
                          Hoàn thành tất cả các bước xác minh để đảm bảo tài
                          khoản của bạn được bảo mật tốt nhất.
                        </p>

                        {(user?.verification?.emailVerified ? 1 : 0) +
                          (user?.cccd?.isVerified ? 1 : 0) ===
                          2 && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                            <p className="text-base text-white font-semibold flex items-center">
                              <span className="text-2xl mr-3">🎉</span>
                              Chúc mừng! Tài khoản của bạn đã được xác minh hoàn
                              toàn.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "profile" && (
                  <div className="flex gap-8">
                    {/* Form Fields */}
                    <div className="flex-1 max-w-lg space-y-5">
                      {/* Name */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Tên
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <input
                              type="text"
                              value={formData.profile.firstName}
                              onChange={(e) =>
                                handleInputChange(
                                  "profile",
                                  "firstName",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Nhập tên"
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-900">
                                {user?.profile?.firstName || "Chưa cập nhật"}
                              </span>
                              <button
                                onClick={() => setEditing(true)}
                                className="ml-2 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Thay Đổi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Email
                        </label>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-gray-900 mr-2">
                              {user?.email
                                ? `${user.email.slice(0, 3)}*********@gmail.com`
                                : "N/A"}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              Thay Đổi
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Số điện thoại
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) =>
                                handleDirectChange("phone", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Nhập số điện thoại"
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-900 mr-2">
                                {user?.phone
                                  ? `*******${user.phone.slice(-2)}`
                                  : "Chưa cập nhật"}
                              </span>
                              <button
                                onClick={() => setEditing(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Thay Đổi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Giới tính
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <div className="flex space-x-6">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="gender"
                                  value="MALE"
                                  checked={formData.profile.gender === "MALE"}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "profile",
                                      "gender",
                                      e.target.value
                                    )
                                  }
                                  className="mr-2"
                                />
                                Nam
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="gender"
                                  value="FEMALE"
                                  checked={formData.profile.gender === "FEMALE"}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "profile",
                                      "gender",
                                      e.target.value
                                    )
                                  }
                                  className="mr-2"
                                />
                                Nữ
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="gender"
                                  value="OTHER"
                                  checked={formData.profile.gender === "OTHER"}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "profile",
                                      "gender",
                                      e.target.value
                                    )
                                  }
                                  className="mr-2"
                                />
                                Khác
                              </label>
                            </div>
                          ) : (
                            <span className="text-gray-900">
                              {user?.profile?.gender === "MALE"
                                ? "Nam"
                                : user?.profile?.gender === "FEMALE"
                                ? "Nữ"
                                : user?.profile?.gender === "OTHER"
                                ? "Khác"
                                : "Chưa cập nhật"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          Ngày sinh
                        </label>
                        <div className="flex-1">
                          {editing ? (
                            <input
                              type="date"
                              value={formData.profile.dateOfBirth}
                              onChange={(e) =>
                                handleInputChange(
                                  "profile",
                                  "dateOfBirth",
                                  e.target.value
                                )
                              }
                              className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            />
                          ) : (
                            <span className="text-gray-900">
                              {user?.profile?.dateOfBirth
                                ? new Date(
                                    user.profile.dateOfBirth
                                  ).toLocaleDateString("vi-VN")
                                : "*/*/1998"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      {editing && (
                        <div className="flex items-center mt-8">
                          <div className="w-24 mr-4"></div>
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 shadow-md transition-all duration-200"
                            >
                              ❌ Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Avatar Section */}
                    <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                    <div className="w-64 flex flex-col items-center py-8">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-1 mb-6 overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                          <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            <img
                              src={
                                user?.profile?.avatar ||
                                user?.avatar ||
                                "/api/placeholder/120/120"
                              }
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="absolute bottom-4 right-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200">
                          <span className="text-white text-lg">📷</span>
                        </div>
                      </div>

                      <label className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl cursor-pointer hover:from-blue-600 hover:to-purple-600 text-sm shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        📸 Chọn Ảnh Mới
                      </label>

                      <div className="text-xs text-gray-500 mt-4 text-center bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">💾 Dung lượng: Tối đa 1 MB</p>
                        <p className="mt-1">🖼️ Định dạng: JPEG, PNG</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "address" && (
                  <div className="max-w-2xl">
                    <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900">
                      <span className="text-3xl mr-3">📍</span>
                      Địa chỉ của tôi
                    </h2>

                    <div className="space-y-5 bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200 shadow-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ cụ thể
                        </label>
                        <input
                          type="text"
                          value={formData.address.streetAddress}
                          onChange={(e) =>
                            handleInputChange(
                              "address",
                              "streetAddress",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Số nhà, tên đường"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quận/Huyện
                          </label>
                          <input
                            type="text"
                            value={formData.address.district}
                            onChange={(e) =>
                              handleInputChange(
                                "address",
                                "district",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Quận/Huyện"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thành phố
                          </label>
                          <input
                            type="text"
                            value={formData.address.city}
                            onChange={(e) =>
                              handleInputChange(
                                "address",
                                "city",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Thành phố"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tỉnh/Thành phố
                        </label>
                        <input
                          type="text"
                          value={formData.address.province}
                          onChange={(e) =>
                            handleInputChange(
                              "address",
                              "province",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Tỉnh/Thành phố"
                        />
                      </div>

                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {saving ? "⏳ Đang lưu..." : "💾 Lưu địa chỉ"}
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "password" && (
                  <div className="max-w-lg">
                    <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900">
                      <span className="text-3xl mr-3">🔐</span>
                      Đổi mật khẩu
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập mật khẩu mới"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </div>

                      <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                        🔒 Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "banking" && (
                  <BankAccountSection user={user} onUpdate={fetchProfile} />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* KYC Modal */}
      <KycModal
        visible={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={handleKycSuccess}
        title="Xác thực danh tính (KYC)"
      />
    </div>
  );
};

export default Profile;
