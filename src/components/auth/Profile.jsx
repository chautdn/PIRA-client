import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import userService from "../../services/user.Api";
import kycService from "../../services/kyc.Api"; // Thêm import này
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../hooks/useI18n";
import { motion } from "framer-motion";
import KycModal from "../common/KycModal";
import BankAccountSection from "../wallet/BankAccountSection";
import MapSelector from "../common/MapSelector";
import icons from "../../utils/icons";

const {
  FiUser,
  FiMapPin,
  BiCreditCard,
  FiLock,
  BsBuildings,
  FiMail,
  FiPhone,
  MdOutlineStarPurple500,
  FiCamera,
  FiCheck,
  FiX,
  FiKey,
  FiRefreshCcw,
  FiShield,
  FiInfo,
  FiUnlock,
  FiImage,
  FiFile,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiEye,
  FiEdit3,
  FiSave,
  FiTrash2,
  FaBell,
  FaClipboardList,
  FaTicketAlt,
  FaMale,
  FaFemale,
  FaUserFriends,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaLock,
  FaMapMarkerAlt,
  FaLightbulb,
  FaRedo,
  FaExclamationTriangle,
} = icons;

const Profile = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // KYC Modal states
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  // Password prompt states for viewing CCCD
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordForCCCD, setPasswordForCCCD] = useState("");
  const [loadingCCCD, setLoadingCCCD] = useState(false);
  const [cccdData, setCccdData] = useState(null);
  const [cccdImages, setCccdImages] = useState(null);

  // Change password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      ward: "",
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
    toast.success(t("profilePage.updateAddressSuccess"));
  };

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
    loadKycStatus();

    // Show notification if coming from product creation
    if (location.state?.fromProductCreate) {
      toast(t("profilePage.updateAddressToContinueCreatingProduct"), {
        icon: <FaMapMarkerAlt className="text-blue-500" />,
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
          ward: userData.address?.ward || "",
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
      console.error("Error loading profile:", error);
      toast.error(t("profilePage.cannotLoadProfile"));
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

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleDirectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      toast.error(t("profilePage.checkInfo"));
      return;
    }

    try {
      setSaving(true);

      // Preserve avatar in formData before sending
      const profileData = {
        ...formData,
        profile: {
          ...formData.profile,
          avatar: user?.profile?.avatar, // Preserve current avatar
        },
      };

      const response = await userService.updateProfile(profileData);
      const userData = response.data.data;

      // Update local state
      setUser(userData);

      // Update global AuthContext and localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      await refreshUser();

      setEditing(false);
      setErrors({});
      toast.success(t("profilePage.updateSuccess"));

      // Check if came from product creation page
      if (location.state?.fromProductCreate) {
        toast.success(t("profilePage.returningToProductCreate"), {
          icon: <FaRedo className="text-green-500" />,
          duration: 2000,
        });
        setTimeout(() => {
          navigate("/owner/products/create", {
            state: { fromProfile: true },
          });
        }, 1500);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("profilePage.updateError")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    fetchProfile();
  };

  // Validation functions
  const validateProfile = () => {
    const newErrors = {};

    // Validate firstName
    if (!formData.profile.firstName.trim()) {
      newErrors.firstName = t("profilePage.errorFirstNameRequired");
    } else if (formData.profile.firstName.trim().length < 2) {
      newErrors.firstName = t("profilePage.errorFirstNameMin");
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.profile.firstName)) {
      newErrors.firstName = t("profilePage.errorFirstNameLetters");
    }

    // Validate lastName
    if (!formData.profile.lastName.trim()) {
      newErrors.lastName = t("profilePage.errorLastNameRequired");
    } else if (formData.profile.lastName.trim().length < 1) {
      newErrors.lastName = t("profilePage.errorLastNameMin");
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.profile.lastName)) {
      newErrors.lastName = t("profilePage.errorLastNameLetters");
    }

    // Validate phone
    if (
      formData.phone &&
      !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(formData.phone)
    ) {
      newErrors.phone = t("profilePage.errorPhoneInvalid");
    }

    // Validate date of birth
    if (formData.profile.dateOfBirth) {
      const birthDate = new Date(formData.profile.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13) {
        newErrors.dateOfBirth = t("profilePage.errorAgeMin");
      } else if (age > 120) {
        newErrors.dateOfBirth = t("profilePage.errorDateInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = t("profilePage.errorCurrentPasswordRequired");
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = t("profilePage.errorNewPasswordRequired");
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = t("profilePage.errorNewPasswordMin");
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = t("profilePage.errorPasswordsNotMatch");
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t("profilePage.errorPasswordsNotMatch");
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error(t("profilePage.checkInfo"));
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(t("profilePage.passwordUpdated"));
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("profilePage.passwordUpdateError")
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      // 1MB limit
      toast.error("File quá lớn (tối đa 1MB)");
      return;
    }

    try {
      setUploadingAvatar(true);
      const response = await userService.uploadAvatar(file);
      console.log("📸 Avatar upload response:", response.data);

      // Backend trả: { status: 'success', data: { avatarUrl: '...' } }
      if (
        response.data?.status === "success" &&
        response.data?.data?.avatarUrl
      ) {
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            avatar: response.data.data.avatarUrl,
          },
        };

        // Update local state
        setUser(updatedUser);

        // Update global AuthContext and localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        await refreshUser();

        toast.success("Cập nhật avatar thành công!");
      } else {
        toast.error("Không thể upload avatar");
      }
    } catch (error) {
      console.error("❌ Avatar upload error:", error);
      toast.error(error.response?.data?.message || "Không thể upload avatar");
    } finally {
      setUploadingAvatar(false);
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

    // Update global user state in AuthContext to refresh navbar
    await refreshUser();

    // Đóng modal
    setShowKycModal(false);
  };

  // Handle view CCCD info - yêu cầu password
  const handleViewCCCDInfo = () => {
    setShowPasswordPrompt(true);
    setPasswordForCCCD("");
    setCccdData(null);
  };

  const handlePasswordSubmitForCCCD = async () => {
    console.log("user authProvider:", user?.authProvider);
    // Kiểm tra nếu user đăng nhập bằng OAuth (không có password)
    if (user?.authProvider && user.authProvider !== "local") {
      // Người dùng OAuth không cần password, load trực tiếp
      try {
        setLoadingCCCD(true);

        const [dataResponse, imagesResponse] = await Promise.all([
          kycService.getUserCCCD(),
          kycService.getCCCDImages(""), // Pass empty string for OAuth users
        ]);

        console.log("📥 Data Response (OAuth):", dataResponse);
        console.log("📥 Images Response (OAuth):", imagesResponse);

        if (dataResponse?.status === "success" && dataResponse?.data) {
          setCccdData(dataResponse.data);

          if (imagesResponse?.status === "success" && imagesResponse?.data) {
            setCccdImages(imagesResponse.data);
          }

          toast.success("Xác thực thành công!");
        }
      } catch (error) {
        console.error("❌ Error (OAuth):", error);
        toast.error("Không thể tải thông tin CCCD");
      } finally {
        setLoadingCCCD(false);
      }
      return;
    }

    // User đăng nhập bằng email/password - yêu cầu nhập password
    if (!passwordForCCCD) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setLoadingCCCD(true);

      // Verify password và load data + images song song
      await userService.verifyPassword(passwordForCCCD);

      const [dataResponse, imagesResponse] = await Promise.all([
        kycService.getUserCCCD(),
        kycService.getCCCDImages(passwordForCCCD),
      ]);

      console.log("📥 Data Response:", dataResponse);
      console.log("📥 Images Response:", imagesResponse);

      // kycService đã unwrap response.data, nên dataResponse = { status, message, data, metadata }
      // Backend trả data trực tiếp trong field 'data', không nested
      if (dataResponse?.status === "success" && dataResponse?.data) {
        console.log("💾 Setting CCCD Data:", dataResponse.data);
        setCccdData(dataResponse.data);

        if (imagesResponse?.status === "success" && imagesResponse?.data) {
          console.log("🖼️ Setting CCCD Images:", imagesResponse.data);
          setCccdImages(imagesResponse.data);
        }

        toast.success(t("profilePage.verifiedSuccess"));
      } else {
        console.error("❌ Invalid response:", dataResponse);
        toast.error(t("profilePage.cccdNotFound"));
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error(error.message || t("profilePage.passwordIncorrect"));
      setPasswordForCCCD("");
    } finally {
      setLoadingCCCD(false);
    }
  };

  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPasswordForCCCD("");
    setCccdData(null);
    setCccdImages(null);
  };

  // Auto-load CCCD data for OAuth users when modal opens
  useEffect(() => {
    if (
      showPasswordPrompt &&
      user?.authProvider &&
      user.authProvider !== "local"
    ) {
      console.log("🔓 OAuth user detected, auto-loading CCCD data...");
      handlePasswordSubmitForCCCD();
    }
  }, [showPasswordPrompt]);

  // Get KYC status display - check user.cccd.isVerified directly
  const getKycStatusDisplay = () => {
    // Use user.cccd.isVerified as the source of truth (matches withdrawal requirements)
    const isVerified = user?.cccd?.isVerified === true;
    const hasImages = user?.cccd?.frontImageHash || kycStatus?.hasImages;

    if (isVerified) {
      return {
        text: t("profilePage.kycVerifiedStatus"),
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: <FaCheckCircle className="text-green-500" />,
      };
    }

    if (hasImages) {
      return {
        text: t("profilePage.kycPendingStatus"),
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: <FaClock className="text-yellow-500" />,
      };
    }

    return {
      text: t("profilePage.kycNotVerifiedStatus"),
      color: "text-red-500",
      bgColor: "bg-red-100",
      icon: <FaTimesCircle className="text-red-500" />,
    };
  };

  // Sidebar menu items
  const menuItems = [
    {
      id: "notifications",
      icon: <FaBell className="text-xl" />,
      label: t("profilePage.menuNotifications"),
    },
    {
      id: "profile",

      icon: <FiUser className="text-xl" />,
      label: t("profilePage.menuMyAccount"),
      submenu: [
        { id: "profile", label: t("profilePage.menuProfile") },
        { id: "address", label: t("profilePage.menuAddress") },
        { id: "password", label: t("profilePage.menuPassword") },
        { id: "verification", label: t("profilePage.menuVerification") },
        { id: "banking", label: t("profilePage.menuBanking") },
      ],
    },

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
          <p className="text-gray-600 font-medium">
            {t("profilePage.loadingInfo")}
          </p>
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
            <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-green-600 p-6">
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
                    <FiEdit3 className="mr-1" />
                    {t("profilePage.editProfile")}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-3">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button className="w-full flex items-center px-5 py-3 text-left hover:bg-gradient-to-r hover:from-green-50 hover:to-primary-50 transition-all duration-200 group">
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </button>

                  {item.submenu && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSection(subItem.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 rounded-lg ${
                            activeSection === subItem.id
                              ? "bg-gradient-to-r from-primary-500 to-green-600 text-white font-semibold shadow-md transform scale-105"
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
              <div className="bg-gradient-to-r from-primary-500 via-green-500 to-primary-600 p-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                      <span className="text-4xl">
                        {activeSection === "profile" && <FiUser />}
                        {activeSection === "address" && <FiMapPin />}
                        {activeSection === "verification" && <BiCreditCard />}
                        {activeSection === "password" && <FiLock />}
                        {activeSection === "banking" && <BsBuildings />}
                      </span>
                      {activeSection === "profile" &&
                        t("profilePage.sectionProfile")}
                      {activeSection === "address" &&
                        t("profilePage.sectionAddress")}
                      {activeSection === "verification" &&
                        t("profilePage.sectionVerification")}
                      {activeSection === "password" &&
                        t("profilePage.sectionPassword")}
                      {activeSection === "banking" &&
                        t("profilePage.sectionBanking")}
                    </h1>
                    <p className="text-green-100 mt-2 text-lg">
                      {activeSection === "verification"
                        ? t("profilePage.manageVerification")
                        : activeSection === "banking"
                        ? t("profilePage.manageBanking")
                        : t("profilePage.manageProfileInfo")}
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
                            <FiMail className="text-3xl text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {t("profilePage.emailVerification")}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("profilePage.emailVerificationDesc")}
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
                            {user?.verification?.emailVerified ? (
                              <>
                                <FaCheckCircle className="inline mr-1" />
                                {t("profilePage.emailVerified")}
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="inline mr-1" />
                                {t("profilePage.emailNotVerified")}
                              </>
                            )}
                          </span>
                          {!user?.verification?.emailVerified && (
                            <button className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                              {t("profilePage.verifyNow")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* KYC Verification */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                            <BiCreditCard className="text-3xl text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {t("profilePage.kycVerification")}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {user?.cccd?.isVerified
                                ? t("profilePage.kycVerified")
                                : t("profilePage.kycNotVerified")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                              getKycStatusDisplay().bgColor
                            } ${getKycStatusDisplay().color}`}
                          >
                            {getKycStatusDisplay().icon}
                            <span className="ml-1">
                              {getKycStatusDisplay().text}
                            </span>
                          </span>
                          <button
                            onClick={() =>
                              user?.cccd?.isVerified
                                ? handleViewCCCDInfo()
                                : setShowKycModal(true)
                            }
                            className={`px-5 py-2.5 text-sm font-semibold rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                              user?.cccd?.isVerified
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                            }`}
                          >
                            {user?.cccd?.isVerified ? (
                              <>
                                <FiEye className="inline mr-1" />
                                {t("profilePage.viewInfo")}
                              </>
                            ) : (
                              <>
                                <FaLock className="inline mr-1" />
                                {t("profilePage.verifyIdentity")}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Security Level */}
                      <div className="mt-8 p-8 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl border-2 border-indigo-200 shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center text-xl">
                          <FiShield className="text-3xl mr-3" />
                          {t("profilePage.securityLevel")}
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
                            /2 {t("profilePage.completed")}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 bg-white/60 p-4 rounded-lg">
                          {t("profilePage.securityDesc")}
                        </p>

                        {(user?.verification?.emailVerified ? 1 : 0) +
                          (user?.cccd?.isVerified ? 1 : 0) ===
                          2 && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                            <p className="text-base text-white font-semibold flex items-center">
                              <FiAward className="text-2xl mr-3" />
                              {t("profilePage.congratulations")}
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
                      {/* First Name */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <FiUser className="text-xl" />
                            {t("profilePage.firstName")}:
                          </label>
                          <div className="flex-1">
                            {editing ? (
                              <>
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
                                  className={`w-full px-4 py-3 border-2 ${
                                    errors.firstName
                                      ? "border-red-300"
                                      : "border-blue-300"
                                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200`}
                                  placeholder={t(
                                    "profilePage.placeholderFirstName"
                                  )}
                                />
                                {errors.firstName && (
                                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <span>{errors.firstName}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">
                                  {user?.profile?.firstName ||
                                    t("profilePage.notUpdated")}
                                </span>
                                <button
                                  onClick={() => setEditing(true)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                  <FiEdit3 className="inline mr-1" />
                                  {t("profilePage.change")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Last Name */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <FiUser className="text-xl" />
                            {t("profilePage.lastName")}:
                          </label>
                          <div className="flex-1">
                            {editing ? (
                              <>
                                <input
                                  type="text"
                                  value={formData.profile.lastName}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "profile",
                                      "lastName",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full px-4 py-3 border-2 ${
                                    errors.lastName
                                      ? "border-red-300"
                                      : "border-green-300"
                                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200`}
                                  placeholder={t(
                                    "profilePage.placeholderLastName"
                                  )}
                                />
                                {errors.lastName && (
                                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <span>{errors.lastName}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">
                                  {user?.profile?.lastName ||
                                    t("profilePage.notUpdated")}
                                </span>
                                <button
                                  onClick={() => setEditing(true)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                  <FiEdit3 className="inline mr-1" />
                                  {t("profilePage.change")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <FiMail className="text-xl" />
                            {t("profilePage.email")}:
                          </label>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900 font-medium">
                                {user?.email
                                  ? `${user.email.slice(
                                      0,
                                      3
                                    )}*********@gmail.com`
                                  : "N/A"}
                              </span>
                              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
                                <FiEdit3 className="inline mr-1" />
                                {t("profilePage.change")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <FiPhone className="text-xl" />
                            {t("profilePage.phone")}:
                          </label>
                          <div className="flex-1">
                            {editing ? (
                              <>
                                <input
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) =>
                                    handleDirectChange("phone", e.target.value)
                                  }
                                  className={`w-full px-4 py-3 border-2 ${
                                    errors.phone
                                      ? "border-red-300"
                                      : "border-green-300"
                                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200`}
                                  placeholder={t(
                                    "profilePage.placeholderPhone"
                                  )}
                                />
                                {errors.phone && (
                                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <span>{errors.phone}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">
                                  {user?.phone
                                    ? `*******${user.phone.slice(-2)}`
                                    : "Chưa cập nhật"}
                                </span>
                                <button
                                  onClick={() => setEditing(true)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                  <FiEdit3 className="inline mr-1" />
                                  {t("profilePage.change")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <FiUser className="text-xl" />
                            {t("profilePage.gender")}:
                          </label>
                          <div className="flex-1">
                            {editing ? (
                              <div className="flex space-x-4">
                                <label className="flex items-center px-4 py-3 bg-white border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors duration-200 has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500">
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
                                    className="mr-2 w-4 h-4 text-blue-600"
                                  />
                                  <span className="font-medium">
                                    <FaMale className="inline mr-1" />
                                    {t("profilePage.male")}
                                  </span>
                                </label>
                                <label className="flex items-center px-4 py-3 bg-white border-2 border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50 transition-colors duration-200 has-[:checked]:bg-pink-100 has-[:checked]:border-pink-500">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value="FEMALE"
                                    checked={
                                      formData.profile.gender === "FEMALE"
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        "profile",
                                        "gender",
                                        e.target.value
                                      )
                                    }
                                    className="mr-2 w-4 h-4 text-pink-600"
                                  />
                                  <span className="font-medium">
                                    <FaFemale className="inline mr-1" />
                                    {t("profilePage.female")}
                                  </span>
                                </label>
                                <label className="flex items-center px-4 py-3 bg-white border-2 border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors duration-200 has-[:checked]:bg-purple-100 has-[:checked]:border-purple-500">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value="OTHER"
                                    checked={
                                      formData.profile.gender === "OTHER"
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        "profile",
                                        "gender",
                                        e.target.value
                                      )
                                    }
                                    className="mr-2 w-4 h-4 text-purple-600"
                                  />
                                  <span className="font-medium">
                                    <FaUserFriends className="inline mr-1" />
                                    {t("profilePage.other")}
                                  </span>
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">
                                  {user?.profile?.gender === "MALE" ? (
                                    <>
                                      <FaMale className="inline mr-1" />
                                      {t("profilePage.male")}
                                    </>
                                  ) : user?.profile?.gender === "FEMALE" ? (
                                    <>
                                      <FaFemale className="inline mr-1" />
                                      {t("profilePage.female")}
                                    </>
                                  ) : user?.profile?.gender === "OTHER" ? (
                                    <>
                                      <FaUserFriends className="inline mr-1" />
                                      {t("profilePage.other")}
                                    </>
                                  ) : (
                                    t("profilePage.notUpdated")
                                  )}
                                </span>
                                <button
                                  onClick={() => setEditing(true)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                  <FiEdit3 className="inline mr-1" />
                                  {t("profilePage.change")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="bg-gradient-to-r from-rose-50 to-red-50 p-5 rounded-xl border-2 border-rose-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <FiCalendar className="text-xl" />
                            {t("profilePage.dateOfBirth")}:
                          </label>
                          <div className="flex-1">
                            {editing ? (
                              <>
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
                                  className={`px-4 py-3 border-2 ${
                                    errors.dateOfBirth
                                      ? "border-red-300"
                                      : "border-rose-300"
                                  } rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white shadow-sm transition-all duration-200`}
                                />
                                {errors.dateOfBirth && (
                                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <span>{errors.dateOfBirth}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">
                                  {user?.profile?.dateOfBirth
                                    ? new Date(
                                        user.profile.dateOfBirth
                                      ).toLocaleDateString("vi-VN")
                                    : "*/*/1998"}
                                </span>
                                <button
                                  onClick={() => setEditing(true)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                  <FiEdit3 className="inline mr-1" />
                                  {t("profilePage.change")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credit Score - Read Only */}
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 w-32 text-sm font-semibold text-gray-700 mr-4">
                            <MdOutlineStarPurple500 className="text-xl" />
                            Điểm tín dụng:
                          </label>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-gray-900 font-bold text-lg">
                                  {user?.creditScore || 100} / 100
                                </span>
                                <div className="flex items-center gap-1">
                                  {/* Credit Score Stars */}
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar
                                      key={i}
                                      className={`text-lg ${
                                        i <
                                        Math.floor(
                                          (user?.creditScore || 100) / 20
                                        )
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span
                                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    (user?.creditScore || 100) >= 80
                                      ? "bg-green-100 text-green-800"
                                      : (user?.creditScore || 100) >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : (user?.creditScore || 100) >= 40
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {(user?.creditScore || 100) >= 80
                                    ? "Xuất sắc"
                                    : (user?.creditScore || 100) >= 60
                                    ? "Tốt"
                                    : (user?.creditScore || 100) >= 40
                                    ? "Khá"
                                    : "Cần cải thiện"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  (user?.creditScore || 100) >= 80
                                    ? "bg-gradient-to-r from-green-400 to-green-600"
                                    : (user?.creditScore || 100) >= 60
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    : (user?.creditScore || 100) >= 40
                                    ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                    : "bg-gradient-to-r from-red-400 to-red-600"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    user?.creditScore || 100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              <FiInfo className="inline mr-1" />
                              Điểm tín dụng được tính dựa trên lịch sử thuê và
                              trả đồ của bạn
                            </p>
                          </div>
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
                              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <FiSave className="inline mr-2" />
                              {saving
                                ? t("profilePage.saving")
                                : t("profilePage.save")}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 shadow-md transition-all duration-200"
                            >
                              <FiX className="inline mr-2" />
                              {t("profilePage.cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Avatar Section */}
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
                          <FiCamera className="text-white text-lg" />
                        </div>
                      </div>

                      <label
                        className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl text-sm shadow-lg transition-all duration-200 ${
                          uploadingAvatar
                            ? "opacity-75 cursor-not-allowed"
                            : "cursor-pointer hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                        {uploadingAvatar ? (
                          <>
                            <svg
                              className="animate-spin inline mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {t("profilePage.uploading") || "Đang tải lên..."}
                          </>
                        ) : (
                          <>
                            <FiCamera className="inline mr-2" />
                            {t("profilePage.chooseNewPhoto")}
                          </>
                        )}
                      </label>

                      <div className="text-xs text-gray-500 mt-4 text-center bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">
                          <FiFile className="inline mr-1" />
                          {t("profilePage.capacityMax")}
                        </p>
                        <p className="mt-1">
                          <FiImage className="inline mr-1" />
                          {t("profilePage.formatSupported")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "address" && (
                  <div className="max-w-2xl">
                    <h2 className="text-lg font-medium mb-6">
                      {t("profilePage.myAddress")}
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("profilePage.chooseOnMap")}
                        </label>
                        <MapSelector
                          onLocationSelect={handleLocationSelect}
                          initialAddress={formData.address.streetAddress}
                          placeholder={t("profilePage.clickToChooseMap")}
                          className="mb-4"
                        />
                        {formData.address.coordinates?.latitude &&
                          formData.address.coordinates?.longitude && (
                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded mb-2">
                              <FaCheckCircle className="inline mr-1 text-green-500" />
                              Đã có tọa độ:{" "}
                              {formData.address.coordinates.latitude.toFixed(6)}
                              ,{" "}
                              {formData.address.coordinates.longitude.toFixed(
                                6
                              )}
                            </div>
                          )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("profilePage.addressDetail")}
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                          {formData.address.streetAddress || "Chưa cập nhật"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("profilePage.ward")}
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                          {formData.address.ward || "Chưa cập nhật"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("profilePage.city")}
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                          {formData.address.city || "Chưa cập nhật"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("profilePage.province")}
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                          {formData.address.province || "Chưa cập nhật"}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <div className="flex items-start gap-3">
                          <FiInfo className="text-2xl text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              {t("profilePage.locationNote")}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              {t("profilePage.locationNoteDesc")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                          {saving
                            ? t("profilePage.saving")
                            : t("profilePage.saveAddress")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "password" && (
                  <div className="max-w-2xl">
                    <div className="space-y-6">
                      {/* Current Password */}
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border-2 border-red-100 hover:shadow-xl transition-all duration-300">
                        <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                          <FiKey className="text-2xl" />
                          {t("profilePage.currentPassword")}
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => {
                              setPasswordData((prev) => ({
                                ...prev,
                                currentPassword: e.target.value,
                              }));
                              if (passwordErrors.currentPassword) {
                                setPasswordErrors((prev) => ({
                                  ...prev,
                                  currentPassword: undefined,
                                }));
                              }
                            }}
                            className={`w-full px-4 py-3 pl-12 border-2 ${
                              passwordErrors.currentPassword
                                ? "border-red-300"
                                : "border-red-200"
                            } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm transition-all duration-200 text-gray-800 placeholder-gray-400`}
                            placeholder={t(
                              "profilePage.placeholderCurrentPassword"
                            )}
                          />
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-red-500" />
                        </div>
                        {passwordErrors.currentPassword && (
                          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <FaExclamationTriangle className="text-red-500" />
                            <span>{passwordErrors.currentPassword}</span>
                          </div>
                        )}
                      </div>

                      {/* New Password */}
                      <div className="bg-gradient-to-r from-primary-50 to-green-50 p-6 rounded-xl border-2 border-primary-100 hover:shadow-xl transition-all duration-300">
                        <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                          <FiRefreshCcw className="text-2xl" />
                          {t("profilePage.newPassword")}
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => {
                              setPasswordData((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }));
                              if (passwordErrors.newPassword) {
                                setPasswordErrors((prev) => ({
                                  ...prev,
                                  newPassword: undefined,
                                }));
                              }
                            }}
                            className={`w-full px-4 py-3 pl-12 border-2 ${
                              passwordErrors.newPassword
                                ? "border-red-300"
                                : "border-primary-200"
                            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all duration-200 text-gray-800 placeholder-gray-400`}
                            placeholder={t(
                              "profilePage.placeholderNewPassword"
                            )}
                          />
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-primary-500" />
                        </div>
                        {passwordErrors.newPassword && (
                          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <FaExclamationTriangle className="text-red-500" />
                            <span>{passwordErrors.newPassword}</span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-100 hover:shadow-xl transition-all duration-300">
                        <label className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                          <FiCheck className="text-2xl" />
                          {t("profilePage.confirmPassword")}
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => {
                              setPasswordData((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }));
                              if (passwordErrors.confirmPassword) {
                                setPasswordErrors((prev) => ({
                                  ...prev,
                                  confirmPassword: undefined,
                                }));
                              }
                            }}
                            className={`w-full px-4 py-3 pl-12 border-2 ${
                              passwordErrors.confirmPassword
                                ? "border-red-300"
                                : "border-green-200"
                            } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-gray-800 placeholder-gray-400`}
                            placeholder={t(
                              "profilePage.placeholderConfirmPassword"
                            )}
                          />
                          <FiUnlock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-green-500" />
                        </div>
                        {passwordErrors.confirmPassword && (
                          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <FaExclamationTriangle className="text-red-500" />
                            <span>{passwordErrors.confirmPassword}</span>
                          </div>
                        )}
                      </div>

                      {/* Security Tips */}
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-200">
                        <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                          <FiShield className="text-xl" />
                          {t("profilePage.passwordTips")}
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-center gap-2">
                            <FiCheck className="text-green-500" />
                            <span>{t("profilePage.passwordTip1")}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <FiCheck className="text-green-500" />
                            <span>{t("profilePage.passwordTip2")}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <FiCheck className="text-green-500" />
                            <span>{t("profilePage.passwordTip3")}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Update Button */}
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleChangePassword}
                          disabled={changingPassword}
                          className="px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                        >
                          <FiLock className="inline mr-2" />
                          {t("profilePage.updatePassword")}
                        </button>
                      </div>
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

      {/* Password Prompt Modal for viewing CCCD */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FiUnlock className="text-3xl" />
              {t("profilePage.verifyToViewCCCD")}
            </h3>
            <p className="text-gray-600 mb-6">
              {user?.authProvider === "google"
                ? t("profilePage.googleAutoVerify")
                : user?.authProvider === "facebook"
                ? t("profilePage.facebookAutoVerify")
                : t("profilePage.enterPasswordToViewCCCD")}
            </p>

            {!cccdData ? (
              <>
                {/* Chỉ hiển thị ô nhập password cho local users */}
                {(!user?.authProvider || user.authProvider === "local") && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("profilePage.password")}
                    </label>
                    <input
                      type="password"
                      value={passwordForCCCD}
                      onChange={(e) => setPasswordForCCCD(e.target.value)}
                      placeholder={t("profilePage.placeholderPassword")}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handlePasswordSubmitForCCCD();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                )}

                {/* OAuth users - auto loading */}
                {user?.authProvider && user.authProvider !== "local" && (
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 font-medium">
                        {t("profilePage.loadingCCCDInfo")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClosePasswordPrompt}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <FiX className="inline mr-2" />
                    {t("profilePage.cancel")}
                  </button>
                  {(!user?.authProvider || user.authProvider === "local") && (
                    <button
                      onClick={handlePasswordSubmitForCCCD}
                      disabled={!passwordForCCCD || loadingCCCD}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg"
                    >
                      {loadingCCCD
                        ? t("profilePage.verifying")
                        : t("profilePage.confirm")}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-green-700">
                          {t("profilePage.cccdNumber")}:
                        </label>
                        <p className="text-green-900 font-bold text-lg">
                          {cccdData.cccdNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700">
                          {t("profilePage.fullName")}:
                        </label>
                        <p className="text-green-900 font-bold text-lg">
                          {cccdData.fullName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700">
                          {t("profilePage.cccdDateOfBirth")}:
                        </label>
                        <p className="text-green-900">
                          {cccdData.dateOfBirth
                            ? new Date(cccdData.dateOfBirth).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700">
                          {t("profilePage.cccdGender")}:
                        </label>
                        <p className="text-green-900">
                          {cccdData.gender === "MALE"
                            ? t("profilePage.male_display")
                            : cccdData.gender === "FEMALE"
                            ? t("profilePage.female_display")
                            : t("profilePage.other_display")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-green-700">
                        {t("profilePage.cccdAddress")}:
                      </label>
                      <p className="text-green-900">
                        {cccdData.address || "N/A"}
                      </p>
                    </div>
                  </div>

                  {cccdData.verifiedAt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <FiCheck className="inline mr-1" />
                        <span className="font-semibold">
                          {t("profilePage.verifiedAt")}:
                        </span>{" "}
                        {new Date(cccdData.verifiedAt).toLocaleString("vi-VN")}
                      </p>
                      {cccdData.verificationSource && (
                        <p className="text-sm text-blue-700 mt-1">
                          <FiInfo className="inline mr-1" />
                          <span className="font-semibold">
                            {t("profilePage.verificationSource")}:
                          </span>{" "}
                          {cccdData.verificationSource}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Hiển thị ảnh CCCD */}
                  {cccdImages && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FiImage className="text-xl" />
                        Ảnh CCCD
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cccdImages.frontImage && (
                          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                              <p className="text-white font-semibold text-sm">
                                <FiFile className="inline mr-1" />
                                Mặt trước
                              </p>
                            </div>
                            <div className="p-2">
                              <img
                                src={cccdImages.frontImage}
                                alt="CCCD mặt trước"
                                className="w-full h-auto rounded-lg"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23f3f4f6" width="400" height="250"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {cccdImages.backImage && (
                          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2">
                              <p className="text-white font-semibold text-sm">
                                <FiFile className="inline mr-1" />
                                Mặt sau
                              </p>
                            </div>
                            <div className="p-2">
                              <img
                                src={cccdImages.backImage}
                                alt="CCCD mặt sau"
                                className="w-full h-auto rounded-lg"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleClosePasswordPrompt}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 shadow-lg"
                  >
                    <FiX className="inline mr-2" />
                    Đóng
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
