import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/product';
import { useCart } from '../context/CartContext';
import { cartApiService } from '../services/cartApi';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart: addToCartContext, loading: cartLoading } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [monthAvailability, setMonthAvailability] = useState({});

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Fetch month availability when month changes
  useEffect(() => {
    if (product?._id) {
      fetchMonthAvailability();
    }
  }, [currentMonth, product?._id]);

  const fetchMonthAvailability = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const availability = await cartApiService.getMonthAvailability(product._id, year, month);
      setMonthAvailability(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setMonthAvailability({});
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isLightboxOpen || !product?.images) return;
      
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLightboxOpen, product]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getById(id);
      // Backend: { success, data: { product } }
      // Axios: response.data = { success, data: { product } }
      // So we need: response.data.data.product
      const productData = response.data?.data?.product || response.data?.product || response.data;
      setProduct(productData);
      console.log('Product loaded:', productData);
      console.log('Product pricing:', productData?.pricing);
      console.log('Daily rate:', productData?.pricing?.dailyRate);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleDateSelect = (day) => {
    if (!day || !isDateAvailable(day)) return;

    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (selectedDates.includes(dateString)) {
      setSelectedDates(selectedDates.filter(date => date !== dateString));
    } else {
      setSelectedDates([...selectedDates, dateString]);
    }
  };

  const isDateAvailable = (day) => {
    if (!day) return false;
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (date < today) return false;

    // Check availability from API
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const availInfo = monthAvailability[dateString];
    
    return availInfo ? availInfo.available : true; // Default to available if no data yet
  };

  const getDateAvailabilityInfo = (day) => {
    if (!day) return null;
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthAvailability[dateString] || null;
  };

  const isDateSelected = (day) => {
    if (!day) return false;
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
    return product.pricing.dailyRate || 0;
  };

  const getTotalPrice = () => {
    const basePrice = getRentalPrice();
    return basePrice * selectedDates.length * quantity;
  };

  const handleAddToCart = async () => {
    // Validate dates
    if (selectedDates.length === 0) {
      alert('⚠️ Vui lòng chọn ngày thuê');
      return;
    }

    // Validate quantity
    const maxQty = product.availability?.quantity || 1;
    if (quantity > maxQty) {
      alert(`⚠️ Chỉ còn ${maxQty} sản phẩm có sẵn`);
      return;
    }

    const rentalData = {
      startDate: new Date(selectedDates[0]),
      endDate: new Date(selectedDates[selectedDates.length - 1]),
      duration: selectedDates.length
    };

    const result = await addToCartContext(product, quantity, rentalData);
    
    if (result.success) {
      // Show warning if exists
      if (result.warning) {
        alert(`✅ Đã thêm vào giỏ hàng!\n\n${result.warning}`);
      } else {
        alert('✅ Đã thêm sản phẩm vào giỏ hàng!');
      }
    } else {
      // If user needs to login, redirect to login page
      if (result.requireLogin) {
        alert(result.error);
        navigate('/auth/login', { state: { from: `/products/${id}` } });
      } else {
        alert(`❌ ${result.error || 'Không thể thêm vào giỏ hàng'}`);
      }
    }
  };

  const handleRentNow = () => {
    if (selectedDates.length === 0) {
      alert('Vui lòng chọn ngày thuê');
      return;
    }
    
    console.log('Rent now:', {
      product: product.id,
      quantity,
      selectedDates,
      totalPrice: getTotalPrice()
    });
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
          <p className="mt-4 text-xl text-gray-600 font-medium">Đang tải thông tin sản phẩm...</p>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <button
            onClick={() => navigate('/products')}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-3 text-sm">
            <Link to="/" className="text-gray-500 hover:text-green-600 transition-colors font-medium">
              🏠 Trang chủ
            </Link>
            <span className="text-gray-400">›</span>
            <Link to="/products" className="text-gray-500 hover:text-green-600 transition-colors font-medium">
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
                  <span className="font-semibold">{product.metrics?.averageRating || 4.8}</span>
                  <span>({product.metrics?.reviewCount || 0} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👁️</span>
                  <span>{product.metrics?.viewCount || 0} lượt xem</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{product.location?.address?.city || 'Đà Nẵng'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <button className="p-4 rounded-full border-2 border-gray-200 bg-white text-gray-600 hover:text-blue-500 transition-all transform hover:scale-110">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
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
              {/* Main Image with Swipe Support */}
              <div className="relative h-96 lg:h-[600px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    className="w-full h-full cursor-pointer"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x;
                      if (swipe > 10000) {
                        // Swiped right
                        setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1);
                      } else if (swipe < -10000) {
                        // Swiped left
                        setSelectedImage(prev => prev < product.images.length - 1 ? prev + 1 : 0);
                      }
                    }}
                    onClick={() => {
                      setLightboxIndex(selectedImage);
                      setIsLightboxOpen(true);
                    }}
                  >
                    <motion.img
                      src={product.images?.[selectedImage]?.url || '/images/camera.png'}
                      alt={product.title}
                      className="w-full h-full object-contain cursor-zoom-in"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Click to Zoom Hint */}
                <motion.div
                  className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 0.8, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Click để phóng to
                </motion.div>

                {/* Gradient Overlays for Better Button Visibility */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Navigation Buttons - Only show on hover */}
                {product.images && product.images.length > 1 && (
                  <>
                    <motion.button
                      onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all opacity-0 group-hover:opacity-100"
                      whileHover={{ scale: 1.15, x: -4 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => setSelectedImage(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all opacity-0 group-hover:opacity-100"
                      whileHover={{ scale: 1.15, x: 4 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </>
                )}

                {/* Image Counter Badge */}
                {product.images && product.images.length > 1 && (
                  <motion.div 
                    className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-green-400">{selectedImage + 1}</span>
                    <span className="mx-1">/</span>
                    <span>{product.images.length}</span>
                  </motion.div>
                )}

                {/* Swipe Indicator */}
                {product.images && product.images.length > 1 && (
                  <motion.div
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {product.images.map((_, index) => (
                      <motion.div
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === selectedImage 
                            ? 'w-8 bg-white' 
                            : 'w-1.5 bg-white/50'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => setSelectedImage(index)}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Thumbnail Gallery with Smooth Scroll */}
              {product.images && product.images.length > 1 && (
                <div className="p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50">
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory scrollbar-hide">
                      {product.images.map((image, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all snap-center ${
                            index === selectedImage
                              ? 'ring-4 ring-green-500 ring-offset-2 shadow-xl'
                              : 'ring-2 ring-gray-200 hover:ring-gray-300 shadow-md'
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.1, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <img
                            src={image.url}
                            alt={`${product.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === selectedImage && (
                            <motion.div
                              className="absolute inset-0 bg-green-500/20 border-2 border-green-500"
                              layoutId="activeImageBorder"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Scroll Indicators */}
                    <div className="absolute left-0 top-0 bottom-3 w-12 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
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
                    { id: 'description', label: '📋 Mô tả', icon: '📋' },
                    { id: 'specifications', label: '⚙️ Thông số', icon: '⚙️' },
                    { id: 'rules', label: '📜 Quy định', icon: '📜' },
                    { id: 'reviews', label: '⭐ Đánh giá', icon: '⭐' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                  {activeTab === 'description' && (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Chi tiết sản phẩm</h3>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 leading-relaxed text-lg">
                          {product.description || 'Máy ảnh chuyên nghiệp với tính năng vượt trội, phù hợp cho nhiếp ảnh gia và người yêu thích chụp ảnh. Thiết bị được bảo trì định kỳ, đảm bảo chất lượng hình ảnh tốt nhất.'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'specifications' && (
                    <motion.div
                      key="specifications"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Thông số kỹ thuật</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {product.brand?.name && (
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium">🏷️ Thương hiệu:</span>
                                <span className="font-bold text-gray-900">{product.brand.name}</span>
                              </div>
                            </div>
                          )}
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">✨ Tình trạng:</span>
                              <span className="font-bold text-gray-900">
                                {product.condition === 'NEW' ? '🆕 Mới' : '👍 Tốt'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">📦 Số lượng:</span>
                              <span className="font-bold text-gray-900">{product.availability?.quantity || 1} cái</span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">⭐ Đánh giá:</span>
                              <div className="flex items-center">
                                <span className="text-yellow-400 text-lg">★</span>
                                <span className="font-bold text-gray-900 ml-1">{product.metrics?.averageRating || 4.8}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'rules' && (
                    <motion.div
                      key="rules"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">📜 Quy định thuê</h3>
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                          <h4 className="font-bold text-blue-900 mb-3 text-lg">🕒 Thời gian thuê</h4>
                          <ul className="space-y-2 text-blue-800">
                            <li>• Tối thiểu: 4 giờ (đối với thuê theo giờ)</li>
                            <li>• Tối thiểu: 1 ngày (đối với thuê theo ngày)</li>
                            <li>• Giao nhận: 8:00 - 20:00 hàng ngày</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                          <h4 className="font-bold text-green-900 mb-3 text-lg">💰 Thanh toán & Đặt cọc</h4>
                          <ul className="space-y-2 text-green-800">
                            <li>• Đặt cọc: {formatPrice(product.pricing?.deposit?.amount || 500000)}đ</li>
                            <li>• Thanh toán: Trước khi nhận hàng</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">⭐ Đánh giá từ khách thuê</h3>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-4xl font-bold text-gray-900">{product.metrics?.averageRating || 4.8}</div>
                            <div className="flex items-center mt-2">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-2xl ${i < Math.floor(product.metrics?.averageRating || 4.8) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="text-gray-600 mt-1">{product.metrics?.reviewCount || 0} đánh giá</div>
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
                  <span className="text-xl text-gray-500 font-normal ml-2">/ngày</span>
                </div>
              </div>

              {/* Calendar for day rental */}
              <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">📅 Chọn ngày thuê</h4>
                  <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-xl">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="font-bold text-gray-900">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-xs font-bold text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, index) => {
                      const availInfo = getDateAvailabilityInfo(day);
                      const isAvailable = isDateAvailable(day);
                      const isSelected = isDateSelected(day);
                      
                      // Determine color based on availability
                      let bgColor = '';
                      let textColor = '';
                      let borderColor = '';
                      
                      if (!day) {
                        return <div key={index} className="invisible" />;
                      }
                      
                      if (!isAvailable) {
                        bgColor = 'bg-gray-100';
                        textColor = 'text-gray-300';
                        borderColor = 'border-gray-200';
                      } else if (isSelected) {
                        bgColor = 'bg-gradient-to-br from-green-500 to-blue-500';
                        textColor = 'text-white';
                      } else if (availInfo && availInfo.status === 'available') {
                        bgColor = 'bg-green-50 hover:bg-green-100';
                        textColor = 'text-green-900';
                        borderColor = 'border-green-200';
                      } else {
                        bgColor = 'hover:bg-gray-100';
                        textColor = 'text-gray-700';
                      }

                      return (
                        <div key={index} className="relative group">
                          <button
                            onClick={() => handleDateSelect(day)}
                            disabled={!isAvailable}
                            className={`
                              w-full h-12 text-sm rounded-lg transition-all relative font-medium border
                              ${bgColor} ${textColor} ${borderColor}
                              ${!isAvailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                              ${isSelected ? 'shadow-lg transform scale-105 border-transparent' : 'border-gray-100'}
                            `}
                          >
                            {day}
                            {availInfo && !isSelected && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </button>
                          
                          {/* Tooltip on hover */}
                          {availInfo && !isSelected && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                                <div className="font-semibold">
                                  {availInfo.status === 'available' && '✅ Còn hàng'}
                                  {availInfo.status === 'unavailable' && '❌ Đã hết'}
                                </div>
                                <div className="text-gray-300 mt-1">
                                  Còn {availInfo.availableCount}/{availInfo.totalStock} sản phẩm
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-200 border border-green-300"></div>
                        <span className="text-gray-600">Còn hàng</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
                        <span className="text-gray-600">Đã hết</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      💡 Di chuột vào ngày để xem chi tiết
                    </div>
                  </div>

                  {selectedDates.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-xl text-center">
                      <div className="text-green-700 font-semibold">
                        ✅ Đã chọn {selectedDates.length} ngày
                      </div>
                    </div>
                  )}
                </div>

              {/* Quantity Selector */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">🔢 Số lượng</h4>
                <div className="flex items-center bg-gray-50 rounded-xl p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-gray-900">{quantity}</div>
                    <div className="text-sm text-gray-600">cái</div>
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(product.availability?.quantity || 5, quantity + 1))}
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
              {selectedDates.length > 0 && (
                <motion.div
                  className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className="text-lg text-gray-700 mb-2">💰 Tổng chi phí</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      {formatPrice(getTotalPrice())}đ
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {formatPrice(getRentalPrice())}đ × {selectedDates.length} ngày × {quantity} cái
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <motion.button
                  onClick={handleRentNow}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={cartLoading || selectedDates.length === 0}
                >
                  🚀 Thuê ngay
                </motion.button>

                <motion.button
                  onClick={handleAddToCart}
                  className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={cartLoading || selectedDates.length === 0}
                >
                  {cartLoading ? '⏳ Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
                </motion.button>

                <motion.button
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💬 Nhắn tin với chủ sở hữu
                </motion.button>
              </div>

              {/* Owner Info */}
              {product.owner && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">👤 Chủ sở hữu</h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {product.owner.profile?.firstName?.[0] || product.owner.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {product.owner.profile?.firstName} {product.owner.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        📊 Độ tin cậy: <span className="font-semibold text-green-600">{product.owner.trustScore || 95}%</span>
                      </div>
                      <div className="flex items-center text-sm text-yellow-600">
                        <span>⭐</span>
                        <span className="ml-1 font-medium">4.9 (128 đánh giá)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Info */}
              {product.location?.address && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">📍 Vị trí & Giao nhận</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <span className="text-lg mr-2">🏠</span>
                      <span>{product.location.address.district}, {product.location.address.city}</span>
                    </div>

                    {product.location.deliveryOptions?.delivery && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center text-green-700">
                          <span className="text-lg mr-2">🚚</span>
                          <span>Giao tận nơi</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatPrice(product.location.deliveryOptions.deliveryFee || 30000)}đ
                        </span>
                      </div>
                    )}

                    {product.location.deliveryOptions?.pickup && (
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-lg mr-2">🏪</span>
                        <span className="text-blue-700">Nhận tại chỗ (Miễn phí)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && product.images && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center z-10 transition-colors"
              onClick={() => setIsLightboxOpen(false)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Image Counter */}
            <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold z-10">
              <span className="text-green-400">{lightboxIndex + 1}</span>
              <span className="mx-1">/</span>
              <span>{product.images.length}</span>
            </div>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-20" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={lightboxIndex}
                  className="relative max-w-7xl max-h-full"
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x;
                    if (swipe > 10000) {
                      setLightboxIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1);
                    } else if (swipe < -10000) {
                      setLightboxIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0);
                    }
                  }}
                >
                  <img
                    src={product.images[lightboxIndex]?.url}
                    alt={`${product.title} ${lightboxIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              {product.images.length > 1 && (
                <>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1);
                    }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.2, x: -4 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0);
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.2, x: 4 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </>
              )}

              {/* Dot Indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(index);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        index === lightboxIndex 
                          ? 'w-12 bg-white' 
                          : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              )}

              {/* Thumbnail Strip */}
              {product.images.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3 max-w-3xl overflow-x-auto scrollbar-hide px-4">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(index);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                        index === lightboxIndex
                          ? 'ring-4 ring-white shadow-2xl'
                          : 'ring-2 ring-white/30 hover:ring-white/60'
                      }`}
                      whileHover={{ scale: 1.15, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <img
                        src={image.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Nhấn ESC hoặc click bên ngoài để đóng • Lướt hoặc dùng mũi tên để xem ảnh khác
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}