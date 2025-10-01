import { useState, useEffect } from "react";
import { useWishlist } from '../context/WishlistContext';
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "../services/product";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rentalType, setRentalType] = useState("day");
  const [selectedHours, setSelectedHours] = useState(4);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getById(id);

  // The API response structure is: response.data.data
  // response.data = { data: { ...product } }
  const productData = response.data.data;
  setProduct(productData);
    } catch (error) {
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleDateSelect = (day) => {
    if (!day || !isDateAvailable(day)) return;

    const dateString = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (selectedDates.includes(dateString)) {
      setSelectedDates(selectedDates.filter((date) => date !== dateString));
    } else {
      setSelectedDates([...selectedDates, dateString]);
    }
  };

  const isDateAvailable = (day) => {
    if (!day) return false;
    const today = new Date();
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date >= today;
  };

  const isDateSelected = (day) => {
    if (!day) return false;
    const dateString = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDates.includes(dateString);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getRentalPrice = () => {
    if (!product?.pricing) return 0;

    switch (rentalType) {
      case "hour":
        // Giả sử giá theo giờ là 1/8 của giá theo ngày
        return Math.floor((product.pricing.dailyRate || 0) / 8);
      case "day":
        return product.pricing.dailyRate || 0;
      default:
        return product.pricing.dailyRate || 0;
    }
  };

  const getTotalPrice = () => {
    const basePrice = getRentalPrice();
    if (rentalType === "hour") {
      return basePrice * selectedHours * quantity;
    } else {
      return basePrice * selectedDates.length * quantity;
    }
  };

  const handleAddToCart = () => {
    // Add to cart functionality
  };

  const handleRentNow = () => {
    // Rent now functionality
  };

  const handleMessageOwner = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!product || !product._id || !product.owner?._id) {
      return;
    }

    try {
      // Import chat service dynamically
  // const { default: chatService } = await import("../services/chat");

      // Create or get existing conversation with the product owner for this specific product
      const conversationResponse = await chatService.createOrGetConversation(
        product.owner._id,
        product._id // Pass product ID as listingId
      );

      // Navigate directly to the conversation
      navigate(`/chat/${conversationResponse.data._id}`);
    } catch (error) {
      // Fallback: navigate to general chat
      navigate("/chat");
    }
  };

  // Check if current user is the product owner
  const isOwner = user && product?.owner?._id === user._id;

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-xl text-gray-600 font-medium">
            Đang tải thông tin sản phẩm...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-8xl mb-6">😕</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <button
            onClick={() => navigate("/products")}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            ← Quay lại danh sách sản phẩm
          </button>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Wishlist heart icon logic
  const isWished = wishlist.includes(id);
  const handleToggleWishlist = async () => {
    if (!user?._id) return alert('Bạn cần đăng nhập để sử dụng wishlist!');
    if (isWished) {
      await removeFromWishlist(id);
    } else {
      await addToWishlist(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-3 text-sm">
            <Link
              to="/"
              className="text-gray-500 hover:text-green-600 transition-colors font-medium"
            >
              🏠 Trang chủ
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              to="/products"
              className="text-gray-500 hover:text-green-600 transition-colors font-medium"
            >
              📦 Sản phẩm
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-semibold">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Title */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold">
                    {product.metrics?.averageRating || 4.8}
                  </span>
                  <span>({product.metrics?.reviewCount || 0} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👁️</span>
                  <span>{product.metrics?.viewCount || 0} lượt xem</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{product.location?.address?.city || "Đà Nẵng"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <button
                className={`p-4 rounded-full border-2 bg-white transition-all transform hover:scale-110 ${isWished ? 'border-red-500 text-red-500' : 'border-gray-200 text-gray-600 hover:text-blue-500'}`}
                title={isWished ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                onClick={handleToggleWishlist}
              >
                <svg
                  className="w-6 h-6"
                  fill={isWished ? '#ef4444' : 'none'}
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="xl:col-span-2 space-y-8">
            {/* Product Images Gallery */}
            <motion.div
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Main Image */}
              <div className="relative h-96 lg:h-[600px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={
                      product.images?.[selectedImage]?.url ||
                      "/images/camera.png"
                    }
                    alt={product.title}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  />
                </AnimatePresence>

                {/* Image Navigation */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev > 0 ? prev - 1 : product.images.length - 1
                        )
                      }
                      className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev < product.images.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-6 right-6 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {product.images.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all ${
                          index === selectedImage
                            ? "border-green-500 shadow-lg scale-110"
                            : "border-gray-200 hover:border-gray-300 hover:scale-105"
                        }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={image.url}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Product Details Tabs */}
            <motion.div
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Tab Headers */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <nav className="flex">
                  {[
                    { id: "description", label: "📋 Mô tả", icon: "📋" },
                    { id: "specifications", label: "⚙️ Thông số", icon: "⚙️" },
                    { id: "rules", label: "📜 Quy định", icon: "📜" },
                    { id: "reviews", label: "⭐ Đánh giá", icon: "⭐" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                        activeTab === tab.id
                          ? "border-green-500 text-green-600 bg-green-50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === "description" && (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        Chi tiết sản phẩm
                      </h3>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 leading-relaxed text-lg">
                          {product.description ||
                            "Máy ảnh chuyên nghiệp với tính năng vượt trội, phù hợp cho nhiếp ảnh gia và người yêu thích chụp ảnh. Thiết bị được bảo trì định kỳ, đảm bảo chất lượng hình ảnh tốt nhất."}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "specifications" && (
                    <motion.div
                      key="specifications"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        Thông số kỹ thuật
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {product.brand?.name && (
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium">
                                  🏷️ Thương hiệu:
                                </span>
                                <span className="font-bold text-gray-900">
                                  {product.brand.name}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">
                                ✨ Tình trạng:
                              </span>
                              <span className="font-bold text-gray-900">
                                {product.condition === "NEW"
                                  ? "🆕 Mới"
                                  : "👍 Tốt"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">
                                📦 Số lượng:
                              </span>
                              <span className="font-bold text-gray-900">
                                {product.availability?.quantity || 1} cái
                              </span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">
                                ⭐ Đánh giá:
                              </span>
                              <div className="flex items-center">
                                <span className="text-yellow-400 text-lg">
                                  ★
                                </span>
                                <span className="font-bold text-gray-900 ml-1">
                                  {product.metrics?.averageRating || 4.8}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "rules" && (
                    <motion.div
                      key="rules"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        📜 Quy định thuê
                      </h3>
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                          <h4 className="font-bold text-blue-900 mb-3 text-lg">
                            🕒 Thời gian thuê
                          </h4>
                          <ul className="space-y-2 text-blue-800">
                            <li>• Tối thiểu: 4 giờ (đối với thuê theo giờ)</li>
                            <li>
                              • Tối thiểu: 1 ngày (đối với thuê theo ngày)
                            </li>
                            <li>• Giao nhận: 8:00 - 20:00 hàng ngày</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                          <h4 className="font-bold text-green-900 mb-3 text-lg">
                            💰 Thanh toán & Đặt cọc
                          </h4>
                          <ul className="space-y-2 text-green-800">
                            <li>
                              • Đặt cọc:{" "}
                              {formatPrice(
                                product.pricing?.deposit?.amount || 500000
                              )}
                              đ
                            </li>
                            <li>• Thanh toán: Trước khi nhận hàng</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "reviews" && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        ⭐ Đánh giá từ khách thuê
                      </h3>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-4xl font-bold text-gray-900">
                              {product.metrics?.averageRating || 4.8}
                            </div>
                            <div className="flex items-center mt-2">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-2xl ${
                                    i <
                                    Math.floor(
                                      product.metrics?.averageRating || 4.8
                                    )
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="text-gray-600 mt-1">
                              {product.metrics?.reviewCount || 0} đánh giá
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Booking Panel */}
          <div className="xl:col-span-1">
            <motion.div
              className="bg-white rounded-3xl shadow-xl p-8 sticky top-24"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Price Section */}
              <div className="mb-8">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {formatPrice(getRentalPrice())}đ
                  <span className="text-xl text-gray-500 font-normal ml-2">
                    /{rentalType === "hour" ? "giờ" : "ngày"}
                  </span>
                </div>
              </div>

              {/* Rental Type Selector */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">
                  ⏰ Loại thuê
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "hour", label: "Theo giờ", icon: "🕐" },
                    { id: "day", label: "Theo ngày", icon: "📅" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setRentalType(type.id)}
                      className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        rentalType === type.id
                          ? "border-green-500 bg-green-50 text-green-700 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hour Selector for hourly rental */}
              {rentalType === "hour" && (
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    🕐 Số giờ thuê
                  </h4>
                  <div className="flex items-center bg-gray-50 rounded-xl p-2">
                    <button
                      onClick={() =>
                        setSelectedHours(Math.max(4, selectedHours - 1))
                      }
                      className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedHours}
                      </div>
                      <div className="text-sm text-gray-600">giờ</div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedHours(Math.min(24, selectedHours + 1))
                      }
                      className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600 text-center">
                    Tối thiểu 4 giờ, tối đa 24 giờ/ngày
                  </div>
                </div>
              )}

              {/* Calendar for day rental */}
              {rentalType === "day" && (
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    📅 Chọn ngày thuê
                  </h4>
                  <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-xl">
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() - 1
                          )
                        )
                      }
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="font-bold text-gray-900">
                      {monthNames[currentMonth.getMonth()]}{" "}
                      {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1
                          )
                        )
                      }
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-bold text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day)}
                        disabled={!isDateAvailable(day)}
                        className={`
                          h-12 text-sm rounded-lg transition-all relative font-medium
                          ${!day ? "invisible" : ""}
                          ${
                            !isDateAvailable(day)
                              ? "text-gray-300 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }
                          ${
                            isDateSelected(day)
                              ? "bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-lg transform scale-105"
                              : ""
                          }
                          ${
                            isDateAvailable(day) && !isDateSelected(day)
                              ? "text-gray-700 hover:shadow-md"
                              : ""
                          }
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {selectedDates.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-xl text-center">
                      <div className="text-green-700 font-semibold">
                        ✅ Đã chọn {selectedDates.length} ngày
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">
                  🔢 Số lượng
                </h4>
                <div className="flex items-center bg-gray-50 rounded-xl p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {quantity}
                    </div>
                    <div className="text-sm text-gray-600">cái</div>
                  </div>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          product.availability?.quantity || 5,
                          quantity + 1
                        )
                      )
                    }
                    className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600 text-center">
                  Còn lại: {product.availability?.quantity || 5} cái
                </div>
              </div>

              {/* Total Price */}
              {(rentalType === "hour" || selectedDates.length > 0) && (
                <motion.div
                  className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className="text-lg text-gray-700 mb-2">
                      💰 Tổng chi phí
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      {formatPrice(getTotalPrice())}đ
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {rentalType === "hour"
                        ? `${formatPrice(
                            getRentalPrice()
                          )}đ × ${selectedHours}h × ${quantity} cái`
                        : `${formatPrice(getRentalPrice())}đ × ${
                            selectedDates.length
                          } ngày × ${quantity} cái`}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <motion.button
                  onClick={handleRentNow}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🚀 Thuê ngay
                </motion.button>

                <motion.button
                  onClick={handleAddToCart}
                  className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🛒 Thêm vào giỏ hàng
                </motion.button>

                {!isOwner && (
                  <motion.button
                    onClick={handleMessageOwner}
                    className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💬 Nhắn tin với chủ sở hữu
                  </motion.button>
                )}
              </div>

              {/* Owner Info */}
              {product.owner && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    👤 Chủ sở hữu
                  </h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {product.owner.profile?.firstName?.[0] ||
                          product.owner.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {product.owner.profile?.firstName}{" "}
                        {product.owner.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        📊 Độ tin cậy:{" "}
                        <span className="font-semibold text-green-600">
                          {product.owner.trustScore || 95}%
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-yellow-600">
                        <span>⭐</span>
                        <span className="ml-1 font-medium">
                          4.9 (128 đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Info */}
              {product.location?.address && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    📍 Vị trí & Giao nhận
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <span className="text-lg mr-2">🏠</span>
                      <span>
                        {product.location.address.district},{" "}
                        {product.location.address.city}
                      </span>
                    </div>

                    {product.location.deliveryOptions?.delivery && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center text-green-700">
                          <span className="text-lg mr-2">🚚</span>
                          <span>Giao tận nơi</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatPrice(
                            product.location.deliveryOptions.deliveryFee ||
                              30000
                          )}
                          đ
                        </span>
                      </div>
                    )}

                    {product.location.deliveryOptions?.pickup && (
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-lg mr-2">🏪</span>
                        <span className="text-blue-700">
                          Nhận tại chỗ (Miễn phí)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}