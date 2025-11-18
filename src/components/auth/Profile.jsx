import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import userService from "../../services/user.Api";
import kycService from "../../services/kyc.Api"; // Thêm import này
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import KycModal from "../common/KycModal";
import BankAccountSection from "../wallet/BankAccountSection";
import MapSelector from "../common/MapSelector";

const Profile = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const { t } = useTranslation();

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
      coordinates: {
        latitude: null,
        longitude: null,
      },
    },
  });

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  };

  // Handle location selection from MapSelector
  const handleLocationSelect = (locationData) => {
    console.log("Selected location:", locationData);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        streetAddress:
          locationData.streetAddress || locationData.fullAddress || "",
        ward: locationData.ward || "",
        district: locationData.district || prev.address.district,
        city: locationData.city || prev.address.city,
        province: locationData.province || prev.address.province,
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      },
    }));
    toast.success("Đã cập nhật vị trí địa chỉ!");
  };

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
    loadKycStatus();

    // Show notification if coming from product creation
    if (location.state?.fromProductCreate) {
      toast("📍 Cập nhật địa chỉ để tiếp tục tạo sản phẩm", {
        icon: "💡",
        duration: 4000,
        style: {
          background: "#3B82F6",
          color: "#fff",
        },
      });
    }
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
          coordinates: {
            latitude: userData.address?.coordinates?.latitude || null,
            longitude: userData.address?.coordinates?.longitude || null,
          },
        },
      });

      // **SAU KHI LOAD PROFILE, LOAD KYC STATUS**
      await loadKycStatus();
    } catch (error) {
      toast.error(t('profile.messages.fetchError'));
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

      // Check if came from product creation page
      if (location.state?.fromProductCreate) {
        toast.success("🔄 Quay lại trang tạo sản phẩm...", { duration: 2000 });
        setTimeout(() => {
          navigate("/owner/products/create", {
            state: { fromProfile: true },
          });
        }, 1500);
      }
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
      toast.error(t('profile.avatar.fileTooLarge'));
      return;
    }
    
    if (!file.type.match(/\.(jpeg|jpg|png)$/)) {
      toast.error(t('profile.avatar.invalidFormat'));
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
      toast.success(t('profile.avatar.uploadSuccess'));
    } catch (error) {
      toast.error(t('profile.avatar.uploadError'));
    } finally {
      setSaving(false);
    }
  };

  // Handle KYC Modal
  const handleKycSuccess = async (result) => {
    if (result.skipped) {
      toast.success(t('profile.kyc.successVerified'));
    } else {
      toast.success(t('profile.kyc.successUpdate'));
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
        text: t('profile.kyc.statusVerified'),
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: "✅",
      };
    }

    if (hasImages) {
      return {
        text: t('profile.kyc.statusPending'),
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: "⏳",
      };
    }

    return {
      text: t('profile.kyc.statusNotVerified'),
      color: "text-red-500",
      bgColor: "bg-red-100",
      icon: "❌",
    };
  };

  // Sidebar menu items
  const menuItems = [
    { id: "notifications", icon: "🔔", label: t('profile.menu.notifications') },
    {
      id: "profile",
      icon: "👤",
      label: t('profile.menu.account'),
      submenu: [
        { id: "profile", label: t('profile.menu.profile') },
        { id: "address", label: t('profile.menu.address') },
        { id: "password", label: t('profile.menu.password') },
        { id: "verification", label: t('profile.menu.verification') },
        { id: "banking", label: t('profile.menu.banking') },
      ],
    },
    { id: "orders", icon: "📋", label: t('profile.menu.orders') },
    { id: "vouchers", icon: "🎫", label: t('profile.menu.vouchers') },
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
          <p className="text-gray-600 font-medium">{t('profile.messages.loading')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <motion.div
            className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 h-fit sticky top-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            {/* User Info Header */}
            <div className="flex items-center p-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.profile?.firstName?.charAt(0) ||
                  user?.email?.charAt(0) ||
                  "A"}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">
                  {user?.profile?.firstName && user?.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <span className="w-3 h-3 mr-1">✏️</span>
                  {t('profile.edit')}
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                    <span className="w-5 h-5 mr-3">{item.icon}</span>
                    <span className="text-gray-700">{item.label}</span>
                  </button>

                  {item.submenu && (
                    <div className="ml-8">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSection(subItem.id)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            activeSection === subItem.id
                              ? "text-orange-500 bg-orange-50"
                              : "text-gray-600 hover:text-gray-900"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {activeSection === "profile" && t('profile.header.profileTitle')}
                      {activeSection === "address" && t('profile.header.addressTitle')}
                      {activeSection === "verification" && t('profile.header.verificationTitle')}
                      {activeSection === "password" && t('profile.header.passwordTitle')}
                      {activeSection === "banking" && t('profile.header.bankingTitle')}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeSection === "verification"
                        ? t('profile.header.verificationDesc')
                        : activeSection === "banking"
                        ? t('profile.header.bankingDesc')
                        : t('profile.header.profileDesc')}
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
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-blue-600">📧</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {t('profile.kyc.emailVerification')}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {t('profile.kyc.emailDesc')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user?.verification?.emailVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user?.verification?.emailVerified
                              ? t('profile.kyc.emailVerified')
                              : t('profile.kyc.emailNotVerified')}
                          </span>
                          {!user?.verification?.emailVerified && (
                            <button className="ml-3 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                              Xác thực
                            </button>
                          )}
                        </div>
                      </div>

                      {/* KYC Verification */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-purple-600">🆔</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {t('profile.kyc.title')}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {user?.cccd?.isVerified
                                ? t('profile.kyc.kycDescVerified')
                                : t('profile.kyc.kycDescNotVerified')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getKycStatusDisplay().bgColor
                            } ${getKycStatusDisplay().color}`}
                          >
                            {getKycStatusDisplay().icon}{" "}
                            {getKycStatusDisplay().text}
                          </span>
                          <button
                            onClick={() => setShowKycModal(true)}
                            className={`ml-3 px-4 py-2 text-sm rounded hover:opacity-90 transition-colors ${
                              user?.cccd?.isVerified
                                ? "bg-green-600 text-white"
                                : "bg-purple-600 text-white"
                            }`}
                          >
                            {user?.cccd?.isVerified
                              ? `👁️ ${t('profile.kyc.viewInfo')}`
                              : `🔐 ${t('profile.kyc.verifyNow')}`}
                          </button>
                        </div>
                      </div>

                      {/* Security Level */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">🛡️</span>
                          {t('profile.security.title')}
                        </h3>

                        <div className="flex items-center mb-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  (user?.verification?.emailVerified ? 50 : 0) +
                                  +(user?.cccd?.isVerified ? 50 : 0)
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-600">
                            {t('profile.security.completion', {
                              count:
                                (user?.verification?.emailVerified ? 1 : 0) +
                                (user?.cccd?.isVerified ? 1 : 0),
                            })}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">
                          {t('profile.security.helpText') || t('profile.header.profileDesc')}
                        </p>

                        {(user?.verification?.emailVerified ? 1 : 0) +
                          (user?.cccd?.isVerified ? 1 : 0) ===
                          2 && (
                          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-800 flex items-center">
                              <span className="mr-2">🎉</span>
                              {t('profile.security.completeMessage')}
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
                    <div className="flex-1 max-w-lg space-y-6">
                      {/* Name */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          {t('profile.fields.name')}
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
                              placeholder={t('profile.placeholders.enterName')}
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-900">
                                {user?.profile?.firstName || t('profile.fields.notUpdated')}
                              </span>
                              <button
                                onClick={() => setEditing(true)}
                                className="ml-2 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                {t('profile.fields.change')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          {t('profile.fields.email')}
                        </label>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-gray-900 mr-2">
                              {user?.email
                                ? `${user.email.slice(0, 3)}*********@gmail.com`
                                : "N/A"}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              {t('profile.fields.change')}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          {t('profile.fields.phone')}
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
                              placeholder={t('profile.placeholders.enterPhone')}
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-900 mr-2">
                                {user?.phone
                                  ? `*******${user.phone.slice(-2)}`
                                  : t('profile.fields.notUpdated')}
                              </span>
                              <button
                                onClick={() => setEditing(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                {t('profile.fields.change')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          {t('profile.fields.gender')}
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
                                {t('profile.genders.male')}
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
                                {t('profile.genders.female')}
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
                                {t('profile.genders.other')}
                              </label>
                            </div>
                          ) : (
                            <span className="text-gray-900">
                              {user?.profile?.gender === "MALE"
                                ? t('profile.genders.male')
                                : user?.profile?.gender === "FEMALE"
                                ? t('profile.genders.female')
                                : user?.profile?.gender === "OTHER"
                                ? t('profile.genders.other')
                                : t('profile.fields.notUpdated')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="flex items-center">
                        <label className="w-24 text-sm text-gray-600 text-right mr-4">
                          {t('profile.fields.dob')}
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
                                  ).toLocaleDateString()
                                : "*/*/1998"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      {editing && (
                        <div className="flex items-center">
                          <div className="w-24 mr-4"></div>
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                            >
                              {saving ? t('profile.fields.saving') : t('profile.fields.save')}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                              {t('profile.fields.cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Avatar Section */}
                    <div className="w-px bg-gray-200"></div>
                    <div className="w-64 flex flex-col items-center py-8">
                      <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
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

                      <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded cursor-pointer hover:bg-gray-50 text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        {t('profile.avatar.choose')}
                      </label>

                      <div className="text-xs text-gray-500 mt-2 text-center">
                        <p>{t('profile.avatar.fileSize')}</p>
                        <p>{t('profile.avatar.formats')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "address" && (
                  <div className="max-w-2xl">
                    <h2 className="text-lg font-medium mb-6">
                      {t('profile.header.addressTitle')}
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn địa chỉ trên bản đồ (để tính khoảng cách chính
                          xác)
                        </label>
                        <MapSelector
                          onLocationSelect={handleLocationSelect}
                          initialAddress={formData.address.streetAddress}
                          placeholder="Nhấn để chọn địa chỉ trên bản đồ VietMap..."
                          className="mb-4"
                        />
                        {formData.address.latitude &&
                          formData.address.longitude && (
                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded mb-2">
                              ✅ Đã có tọa độ:{" "}
                              {formData.address.latitude.toFixed(6)},{" "}
                              {formData.address.longitude.toFixed(6)}
                            </div>
                          )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ cụ thể (tự điền từ bản đồ)
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
                          readOnly
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.fields.district')}
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
                            placeholder={t('profile.placeholders.district')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.fields.city')}
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
                            placeholder={t('profile.placeholders.city')}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.fields.province')}
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
                          placeholder={t('profile.placeholders.province')}
                        />
                      </div>

                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                      >
                        {saving ? t('profile.fields.saving') : t('profile.address.saveButton')}
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "password" && (
                  <div className="max-w-lg">
                    <h2 className="text-lg font-medium mb-6">{t('profile.header.passwordTitle')}</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.password.currentLabel')}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder={t('profile.password.placeholderCurrent')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.password.newLabel')}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder={t('profile.password.placeholderNew')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('profile.password.confirmLabel')}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          placeholder={t('profile.password.placeholderConfirm')}
                        />
                      </div>

                      <button className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                        {t('profile.password.updateButton')}
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
        title={t('profile.kyc.modalTitle')}
      />
    </div>
  );
};

export default Profile;
