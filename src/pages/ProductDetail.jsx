import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/product';
import { reviewService } from '../services/review';
import { useCart } from '../context/CartContext';
import { cartApiService } from '../services/cartApi';
import { useAuth } from '../hooks/useAuth'; // Added for authentication
import { ROUTES } from '../utils/constants'; // Added for route constants
import ReportModal from './ReportModal';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart: addToCartContext, loading: cartLoading } = useCart();
  const { user } = useAuth(); // Added to get current user
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsTarget, setReviewsTarget] = useState('PRODUCT');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', photos: [] });
  const fileInputRef = useRef(null);
  const [replyBoxOpen, setReplyBoxOpen] = useState({});
  const [menuOpen, setMenuOpen] = useState({});
  const [editingReview, setEditingReview] = useState({});
  const [editingResponse, setEditingResponse] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);

  // Check if current user is the product owner
  const isOwner = user && product?.owner?._id === user._id;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Calculate rental days when dates change
  useEffect(() => {
    if (deliveryDate && returnDate) {
      const delivery = new Date(deliveryDate);
      const returnD = new Date(returnDate);
      if (returnD > delivery) {
        const diffTime = Math.abs(returnD - delivery);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log('Rental days:', diffDays);
      }
    }
  }, [deliveryDate, returnDate]);

  useEffect(() => {
    // fetch reviews when product loaded and reviews tab active
    if (activeTab === 'reviews' && product?._id) {
      fetchReviews(product._id);
    }
  }, [activeTab, product?._id]);

  const fetchReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const res = await reviewService.listByProduct(productId, { page: reviewsPage, limit: 10, target: reviewsTarget });
      const items = res.data?.data || [];
      const pagination = res.data?.pagination || {};
      
      // Process photos in reviews before setting state
      const processedItems = items.map(review => ({
        ...review,
        photos: (review.photos || []).map(photo => {
          if (typeof photo === 'string') return photo;
          return photo.url || photo.path || photo.secure_url || photo.imageUrl;
        }).filter(url => url) // Remove any undefined/null URLs
      }));
      
      console.log('Processed reviews with photos:', processedItems);
      setReviews((prev) => (reviewsPage === 1 ? processedItems : prev.concat(processedItems)));
      setReviewsTotal(pagination.total || 0);
    } catch (err) {
      console.error('Error loading reviews', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleHelpful = async (review) => {
    try {
      const res = await reviewService.helpful(review._id, 'helpful', { userId: user?._id });
      const updated = res.data?.data;
      if (updated) {
        setReviews((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error('Error toggling helpful', err);
    }
  };

  const changeReviewsTarget = (target) => {
    setReviewsTarget(target);
    setReviewsPage(1);
    // directly fetch first page for new target
    (async () => {
      try {
        setReviewsLoading(true);
        const res = await reviewService.listByProduct(product._id, { page: 1, limit: 10, target });
        const items = res.data?.data || [];
        const pagination = res.data?.pagination || {};
        setReviews(items);
        setReviewsTotal(pagination.total || 0);
      } catch (e) {
        console.error('Error switching review target', e);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    })();
  };

  // helper to map target code to human label
  const targetLabel = (t) => {
    if (!t) return '';
    if (t === 'PRODUCT') return 'Sản phẩm';
    if (t === 'OWNER') return 'Chủ sở hữu';
    if (t === 'SHIPPER') return 'Shipper';
    return t;
  };

  // compute stats (average, count) from loaded reviews for the current target
  const reviewStats = (() => {
    const arr = reviews || [];
    if (!arr.length) return { average: product?.metrics?.averageRating || 0, count: reviewsTotal || product?.metrics?.reviewCount || 0 };
    const count = arr.length;
    const sum = arr.reduce((s, it) => s + (Number(it.rating) || 0), 0);
    const average = +(sum / count).toFixed(2);
    return { average, count };
  })();

  // build a simple rating distribution (5 -> 1) from loaded reviews (fallback to empty counts)
  const ratingDistribution = (() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const arr = reviews || [];
    if (arr.length) {
      arr.forEach(r => {
        const v = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
        dist[v] = (dist[v] || 0) + 1;
      });
      return dist;
    }
    // optional: if product.metrics exposes distribution, use it
    if (product?.metrics?.ratingDistribution) {
      return Object.assign(dist, product.metrics.ratingDistribution);
    }
    return dist;
  })();

  const openWriteModal = () => {
    // initialize new review and set its target type to current reviewsTarget
    setNewReview({ rating: 5, title: '', comment: '', photos: [], type: reviewsTarget });
    if (fileInputRef.current) fileInputRef.current.value = null;
    setShowWriteModal(true);
  };

  const handleNewReviewFiles = (files) => {
    setNewReview((s) => ({ ...s, photos: Array.from(files) }));
  };

  const submitNewReview = async () => {
    if (!newReview.comment || !newReview.rating) {
      alert('Vui lòng nhập đủ nội dung và đánh giá');
      return;
    }
    try {
      console.log('Submitting review with photos:', newReview.photos); // Debug log
  const fd = new FormData();
      // set type according to selected target (PRODUCT => product, OWNER/SHIPPER => user)
      const typeForServer = (reviewsTarget === 'PRODUCT') ? 'product' : 'user';
      fd.append('type', typeForServer);
      // When reviewing OWNER or SHIPPER, inform server via targetRole and (if available) reviewee id
      if (reviewsTarget === 'OWNER' || reviewsTarget === 'SHIPPER') {
        fd.append('targetRole', reviewsTarget);
        const revieweeId = reviewsTarget === 'OWNER' ? product?.owner?._id : product?.shipper;
        if (revieweeId) fd.append('reviewee', revieweeId);
      }
      fd.append('product', product._id);
      fd.append('rating', newReview.rating);
      fd.append('comment', newReview.comment);
      if (newReview.title) fd.append('title', newReview.title);
      
      // Ensure photos are appended with 'photos' field name
      if (newReview.photos && newReview.photos.length > 0) {
        console.log('Appending photos to FormData:', newReview.photos);
        for (const photo of newReview.photos) {
          fd.append('photos', photo);
        }
      }

  const response = await reviewService.create(fd);
  console.log('Review created successfully:', response.data);
  setShowWriteModal(false);
  // refresh first page for current target
  await changeReviewsTarget(reviewsTarget);
  setNewReview({ rating: 5, title: '', comment: '', photos: [], type: reviewsTarget });
  if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error('Error creating review', err);
      alert('Lỗi khi gửi đánh giá');
    }
  };

  const toggleReplyBox = (reviewId) => {
    setReplyBoxOpen((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const submitReply = async (reviewId, text, files = []) => {
    if (!text) return;
    try {
      const fd = new FormData();
      fd.append('comment', text);
      (files || []).forEach((f) => fd.append('photos', f));
  await reviewService.reply(reviewId, fd);
      fetchReviews(product._id);
      setReplyBoxOpen((prev) => ({ ...prev, [reviewId]: false }));
    } catch (err) {
      console.error('Error replying to review', err);
      alert('Lỗi khi gửi phản hồi');
    }
  };

  const loadMoreReviews = () => {
    if (reviews.length >= reviewsTotal) return;
    const next = reviewsPage + 1;
    (async () => {
      try {
        setReviewsLoading(true);
        const res = await reviewService.listByProduct(product._id, { page: next, limit: 10, target: reviewsTarget });
        const items = res.data?.data || [];
        setReviews((prev) => prev.concat(items));
        setReviewsPage(next);
      } catch (e) {
        console.error('Error loading more reviews', e);
      } finally {
        setReviewsLoading(false);
      }
    })();
  };

  // Small components used in the review list
  function ReplyBox({ onSubmit }) {
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    return (
      <div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full p-2 border rounded-md" rows={3} placeholder="Viết phản hồi..." />
        <div className="flex items-center gap-2 mt-2">
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <button onClick={() => { onSubmit(text, files); setText(''); setFiles([]); }} className="ml-auto px-4 py-2 bg-green-500 text-white rounded">Gửi</button>
        </div>
      </div>
    );
  }

  function ResponseItem({ resp, productId, onReply }) {
    const [openReply, setOpenReply] = useState(false);
    const [menuOpenLocal, setMenuOpenLocal] = useState(false);
    const [editingLocal, setEditingLocal] = useState({});
    return (
      <div className="pl-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold">{resp.commenter?.profile?.firstName?.[0] || 'R'}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{resp.commenter?.profile?.firstName || resp.commenter?.email || 'Người dùng'}</div>
            <div className="text-xs text-gray-500">{new Date(resp.respondedAt || resp.createdAt || Date.now()).toLocaleString()}</div>
            <div className="mt-2 text-gray-700">{resp.comment}</div>
            <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
              <div className="flex gap-3">
                <button onClick={() => setOpenReply((s) => !s)} className="hover:underline">Trả lời</button>
                <button className="hover:underline">Like</button>
              </div>
              <div className="relative">
                <button onClick={() => setMenuOpenLocal((s) => !s)} className="p-1 rounded-full hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h.01M12 12h.01M18 12h.01"/></svg>
                </button>
                {menuOpenLocal && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border rounded-md shadow-lg z-40">
                    <button onClick={() => { setEditingLocal({ text: resp.comment }); setMenuOpenLocal(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Chỉnh sửa</button>
                    <button onClick={async () => { if (confirm('Bạn muốn xóa phản hồi này?')) { await handleDeleteResponse(productId, resp._id); } setMenuOpenLocal(false); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">Xóa</button>
                  </div>
                )}
              </div>
            </div>

            {/* Edit local response */}
            {editingLocal.text !== undefined && (
              <div className="mt-2">
                <textarea value={editingLocal.text} onChange={(e) => setEditingLocal({ text: e.target.value })} className="w-full p-2 border rounded mb-2" rows={3} />
                <div className="flex gap-2">
                  <button onClick={async () => { await handleSaveEditResponse(productId, resp._id, editingLocal.text); setEditingLocal({}); }} className="px-4 py-2 bg-green-500 text-white rounded">Lưu</button>
                  <button onClick={() => setEditingLocal({})} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
                </div>
              </div>
            )}
            {openReply && <div className="mt-2"><ReplyBox onSubmit={(txt, files) => onReply(txt, files)} /></div>}
            {resp.responses && resp.responses.length > 0 && (
              <div className="mt-3 space-y-3">
                {resp.responses.map((r2) => <ResponseItem key={r2._id} resp={r2} productId={productId} onReply={onReply} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // API handlers for edit/delete review & response
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.remove(reviewId);
      // refresh
      fetchReviews(product._id);
    } catch (err) {
      console.error('Error deleting review', err);
      alert('Lỗi khi xóa đánh giá');
    }
  };

  const handleSaveEditReview = async (reviewId) => {
    try {
      const body = { title: editingReview.title, comment: editingReview.text };
      await reviewService.update(reviewId, body);
      setEditingReview({});
      fetchReviews(product._id);
    } catch (err) {
      console.error('Error saving review edit', err);
      alert('Lỗi khi lưu chỉnh sửa');
    }
  };

  const handleDeleteResponse = async (reviewId, responseId) => {
    try {
      await reviewService.deleteResponse(reviewId, responseId);
      fetchReviews(product._id);
    } catch (err) {
      console.error('Error deleting response', err);
      alert('Lỗi khi xóa phản hồi');
    }
  };

  const handleSaveEditResponse = async (reviewId, responseId, text) => {
    try {
      await reviewService.updateResponse(reviewId, responseId, { comment: text });
      fetchReviews(product._id);
    } catch (err) {
      console.error('Error saving response edit', err);
      alert('Lỗi khi lưu chỉnh sửa phản hồi');
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

  const handleDeliveryDateChange = (date) => {
    setDeliveryDate(date);
    // Auto adjust return date if it's before delivery date
    if (returnDate && new Date(returnDate) <= new Date(date)) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setReturnDate(nextDay.toISOString().split('T')[0]);
    }
  };

  const handleReturnDateChange = (date) => {
    setReturnDate(date);
  };

  const getRentalDays = () => {
    if (!deliveryDate || !returnDate) return 0;
    const delivery = new Date(deliveryDate);
    const returnD = new Date(returnDate);
    if (returnD <= delivery) return 0;
    const diffTime = Math.abs(returnD - delivery);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRentalPrice = () => {
    if (!product?.pricing) return 0;
    return product.pricing.dailyRate || 0;
  };

  const getTotalPrice = () => {
    const basePrice = getRentalPrice();
    return basePrice * getRentalDays() * quantity;
  };

  const handleAddToCart = async () => {
    if (!deliveryDate || !returnDate) {
      alert('⚠️ Vui lòng chọn ngày giao và trả hàng');
      return;
    }

    // Validation
    const maxStock = product.availability?.quantity || 0;
    if (quantity < 1) {
      alert('⚠️ Số lượng phải lớn hơn 0');
      return;
    }
    
    if (quantity > maxStock) {
      alert(`⚠️ Số lượng không được vượt quá ${maxStock} cái`);
      return;
    }

    const rentalData = {
      startDate: new Date(deliveryDate),
      endDate: new Date(returnDate),
      duration: getRentalDays()
    };

    const result = await addToCartContext(product, quantity, rentalData);
    
    if (result.success) {
      if (result.warning) {
        alert(`✅ Đã thêm vào giỏ hàng!\n\n${result.warning}`);
      } else {
        alert('✅ Đã thêm sản phẩm vào giỏ hàng!');
      }
    } else {
      if (result.requireLogin) {
        alert(result.error);
        navigate('/auth/login', { state: { from: `/products/${id}` } });
      } else {
        alert(`❌ ${result.error || 'Không thể thêm vào giỏ hàng'}`);
      }
    }
  };

  const handleRentNow = () => {
    if (!deliveryDate || !returnDate) {
      alert('Vui lòng chọn ngày giao và trả hàng');
      return;
    }
    
    console.log('Rent now:', {
      product: product.id,
      quantity,
      deliveryDate,
      returnDate,
      rentalDays: getRentalDays(),
      totalPrice: getTotalPrice()
    });
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
      const { default: chatService } = await import('../services/chat');
      const conversationResponse = await chatService.createOrGetConversation(
        product.owner._id,
        product._id
      );
      navigate(`/chat/${conversationResponse.data._id}`);
    } catch (error) {
      console.error('Error initiating chat:', error);
      navigate('/chat');
    }
  };



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
      <div className="bg-white/40 backdrop-blur-sm border-b border-gray-200  z-40">
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
              {!isOwner && user && (
                <motion.button
                  onClick={() => setShowReportModal(true)}
                  className="p-4 rounded-full border-2 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 transition-all transform hover:scale-110"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Báo cáo sản phẩm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.button>
              )}
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
                        setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1);
                      } else if (swipe < -10000) {
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
                      <div className="rounded-2xl p-6 mb-6 bg-yellow-50 border border-yellow-100">
                        <div className="flex items-center gap-6">
                          {/* Left: big average circle */}
                          <div className="flex-shrink-0 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
                              <div className="text-white text-2xl font-bold">{(reviewStats.average || product.metrics?.averageRating || 4.8).toFixed(1)}</div>
                            </div>
                            <div className="hidden sm:block">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.257L12 19.771 4.584 23.853 6 15.596 0 9.748l8.332-1.73z"/></svg>
                                <div className="font-semibold">{(reviewStats.average || product.metrics?.averageRating || 4.8).toFixed(1)}</div>
                                <div className="text-gray-500">•</div>
                                <div className="text-gray-500">{reviewStats.count || product.metrics?.reviewCount || 0} đánh giá</div>
                              </div>
                              {/* removed small description per request; histogram bars will animate */}
                            </div>
                          </div>

                          {/* Center: histogram */}
                          <div className="flex-1">
                            <div className="space-y-3">
                              {[5,4,3,2,1].map((s, idx) => {
                                const count = ratingDistribution[s] || 0;
                                const total = reviewStats.count || product.metrics?.reviewCount || 0;
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                const delay = 0.12 * idx; // stagger from top -> bottom
                                const duration = 0.7 + idx * 0.12; // slightly longer for later bars
                                return (
                                  <div key={s} className="flex items-center gap-4">
                                    <div className="w-8 text-sm text-gray-700">{s}★</div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                      <motion.div
                                        className="h-3 bg-yellow-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration, delay, ease: 'easeOut' }}
                                      />
                                    </div>
                                    <div className="w-10 text-right text-sm text-gray-600">{pct}%</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right: target pills + CTA */}
                          <div className="w-40 flex flex-col items-end gap-3">
                            <div className="w-full flex flex-col gap-2">
                              <button onClick={() => changeReviewsTarget('PRODUCT')} className={`w-full py-2 rounded-md text-sm ${reviewsTarget === 'PRODUCT' ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-800 border border-yellow-100'}`}>Sản phẩm</button>
                              <button onClick={() => changeReviewsTarget('OWNER')} className={`w-full py-2 rounded-md text-sm ${reviewsTarget === 'OWNER' ? 'bg-emerald-400 text-white' : 'bg-white text-emerald-800 border border-emerald-100'}`}>Chủ sở hữu</button>
                              <button onClick={() => changeReviewsTarget('SHIPPER')} className={`w-full py-2 rounded-md text-sm ${reviewsTarget === 'SHIPPER' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-700 border border-indigo-100'}`}>Shipper</button>
                            </div>
                            <button onClick={openWriteModal} className="mt-2 w-full py-3 bg-violet-600 text-white rounded-xl shadow-lg">Viết đánh giá ({targetLabel(reviewsTarget)})</button>
                          </div>
                        </div>
                      </div>

                      {/* Reviews list */}
                      <div className="space-y-4">
                        {reviewsLoading && (
                          <div className="text-center text-gray-500 py-6">Đang tải đánh giá...</div>
                        )}

                        {!reviewsLoading && reviews.length === 0 && (
                          <div className="text-center text-gray-500 py-6">Chưa có đánh giá nào cho sản phẩm này.</div>
                        )}

                        {reviews.map((r) => (
                          <div key={r._id} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-start">
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 mr-4">
                                {r.reviewer?.profile?.firstName?.[0] || 'N'}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold">{r.reviewer?.profile?.firstName || r.reviewer?.email || 'Người dùng'}</div>
                                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                                  </div>
                                  <div className="ml-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 font-semibold shadow-sm">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.257L12 19.771 4.584 23.853 6 15.596 0 9.748l8.332-1.73z"/></svg>
                                      <span>{r.rating}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 text-gray-700 whitespace-pre-line">{r.comment}</div>

                                {/* Review Photos Grid */}
                                {r.photos && r.photos.length > 0 && (
                                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {r.photos.map((photo, photoIndex) => {
                                      // Handle different photo object structures
                                      const photoUrl = typeof photo === 'string' ? photo 
                                        : photo.url || photo.path || photo.secure_url || photo.imageUrl;
                                      
                                      if (!photoUrl) {
                                        console.warn('Invalid photo object:', photo);
                                        return null;
                                      }

                                      return (
                                        <div 
                                          key={photoIndex} 
                                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                                          onClick={() => {
                                            window.open(photoUrl, '_blank');
                                          }}
                                        >
                                          <img 
                                            src={photoUrl}
                                            alt={`Review photo ${photoIndex + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              console.warn('Failed to load photo:', photoUrl);
                                              e.target.src = '/images/image-placeholder.png';
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="mt-3 text-sm text-gray-500 flex items-center gap-4 justify-between">
                                  <div className="flex items-center gap-4">
                                    <button className="hover:underline" onClick={() => toggleReplyBox(r._id)}>Phản hồi</button>
                                    <button className="hover:underline" onClick={() => handleHelpful(r)}>{(r.likedBy || []).some(u => user && u && u.toString() === user?._id) ? 'Đã thích' : 'Like'}</button>
                                    {r.responses && r.responses.length > 0 && (
                                      <span className="text-gray-400">Xem tất cả {r.responses.length} phản hồi</span>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <button onClick={() => setMenuOpen((p) => ({ ...p, [r._id]: !p[r._id] }))} className="p-1 rounded-full hover:bg-gray-100">
                                      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h.01M12 12h.01M18 12h.01"/></svg>
                                    </button>
                                    {menuOpen[r._id] && (
                                      <div className="absolute right-0 mt-2 w-36 bg-white border rounded-md shadow-lg z-40">
                                        <button onClick={() => { setEditingReview({ id: r._id, text: r.comment, title: r.title || '' }); setMenuOpen({}); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Chỉnh sửa</button>
                                        <button onClick={async () => { if (confirm('Bạn muốn xóa đánh giá này?')) { await handleDeleteReview(r._id); setMenuOpen({}); } }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">Xóa</button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Edit review inline */}
                                {editingReview.id === r._id && (
                                  <div className="mt-3 p-3 border border-gray-100 rounded">
                                    <input value={editingReview.title} onChange={(e) => setEditingReview((s) => ({ ...s, title: e.target.value }))} placeholder="Tiêu đề (tùy chọn)" className="w-full p-2 border rounded mb-2" />
                                    <textarea value={editingReview.text} onChange={(e) => setEditingReview((s) => ({ ...s, text: e.target.value }))} className="w-full p-2 border rounded mb-2" rows={3} />
                                    <div className="flex gap-2">
                                      <button onClick={async () => { await handleSaveEditReview(r._id); }} className="px-4 py-2 bg-green-500 text-white rounded">Lưu</button>
                                      <button onClick={() => setEditingReview({})} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
                                    </div>
                                  </div>
                                )}

                                {/* Reply box */}
                                {replyBoxOpen[r._id] && (
                                  <div className="mt-3 border border-gray-100 p-3 rounded-lg bg-gray-50">
                                    <ReplyBox onSubmit={(text, files) => submitReply(r._id, text, files)} />
                                  </div>
                                )}

                                {/* Responses */}
                                {r.responses && r.responses.length > 0 && (
                                  <div className="mt-4 space-y-3">
                                    {r.responses.map((resp) => (
                                      <ResponseItem key={resp._id} resp={resp} productId={r._id} onReply={(text, files) => submitReply(r._id, text, files)} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {reviews.length > 0 && reviews.length < reviewsTotal && (
                          <div className="text-center mt-6">
                            <button onClick={loadMoreReviews} className="px-6 py-2 bg-gray-200 rounded-md">Tải thêm</button>
                          </div>
                        )}
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

              {/* Date Selection for Rental */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">📅 Chọn thời gian thuê</h4>
                
                {/* Delivery Date */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🚚 Ngày nhận hàng
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => handleDeliveryDateChange(e.target.value)}
                    min={(() => {
                      const now = new Date();
                      const minDate = new Date();
                      if (now.getHours() >= 12) {
                        minDate.setDate(minDate.getDate() + 1);
                      }
                      return minDate.toISOString().split('T')[0];
                    })()} // Trước 12h: hôm nay, sau 12h: ngày mai
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-gray-900 font-medium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const now = new Date();
                      return now.getHours() >= 12 
                        ? "⏰ Sau 12h trưa: Có thể nhận hàng từ ngày mai"
                        : "⏰ Trước 12h trưa: Có thể nhận hàng từ hôm nay";
                    })()}
                  </p>
                </div>

                {/* Return Date */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📦 Ngày trả hàng
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => handleReturnDateChange(e.target.value)}
                    min={deliveryDate ? (() => {
                      const nextDay = new Date(deliveryDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      return nextDay.toISOString().split('T')[0];
                    })() : new Date().toISOString().split('T')[0]}
                    disabled={!deliveryDate}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {!deliveryDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Vui lòng chọn ngày nhận hàng trước
                    </p>
                  )}
                </div>

                {/* Rental Duration Display */}
                {deliveryDate && returnDate && getRentalDays() > 0 && (
                  <motion.div
                    className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center">
                      <div className="text-sm text-gray-700 mb-1">⏱️ Thời gian thuê</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        {getRentalDays()} ngày
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Từ {new Date(deliveryDate).toLocaleDateString('vi-VN')} đến {new Date(returnDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Time Selection Hints */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-600 text-center">
                    <div className="font-semibold mb-1">🕒 Thời gian giao nhận</div>
                    <div>8:00 - 20:00 hàng ngày</div>
                    <div className="text-gray-500 mt-1">Tối thiểu 1 ngày thuê</div>
                  </div>
                </div>
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
                    onClick={() => {
                      const maxStock = product.availability?.quantity || 0;
                      if (quantity < maxStock) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    disabled={quantity >= (product.availability?.quantity || 0)}
                    className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600 text-center">
                  Có sẵn: {product.availability?.quantity || 0} cái
                  {quantity >= (product.availability?.quantity || 0) && (
                    <div className="text-orange-600 text-xs mt-1">
                      ⚠️ Đã đạt số lượng tối đa
                    </div>
                  )}
                </div>
              </div>

              {/* Total Price */}
              {deliveryDate && returnDate && getRentalDays() > 0 && (
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
                      {formatPrice(getRentalPrice())}đ × {getRentalDays()} ngày × {quantity} cái
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
                  disabled={cartLoading || !deliveryDate || !returnDate || getRentalDays() <= 0}
                >
                  🚀 Thuê ngay
                </motion.button>

                <motion.button
                  onClick={handleAddToCart}
                  className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={cartLoading || !deliveryDate || !returnDate || getRentalDays() <= 0}
                >
                  {cartLoading ? '⏳ Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
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

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        product={product}
        onReportSuccess={() => {
          console.log('Report submitted successfully');
        }}
      />

      {/* Lightbox Modal */}
      {/* Write Review Modal */}
      <AnimatePresence>
        {showWriteModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWriteModal(false)}
          >
            <motion.div className="bg-white rounded-2xl w-full max-w-2xl p-6" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Tạo đánh giá - {targetLabel(reviewsTarget)}</h3>
                <button onClick={() => setShowWriteModal(false)} className="text-gray-500">Đóng</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Đánh giá</label>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((n) => {
                      const active = n <= newReview.rating;
                      return (
                        <button
                          key={n}
                          onClick={() => setNewReview((s) => ({ ...s, rating: n }))}
                          className={`p-2 rounded-md transition-colors ${active ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                          aria-label={`${n} sao`}
                          aria-pressed={active}
                        >
                          <svg className={`w-7 h-7 ${active ? 'text-yellow-500' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.257L12 19.771 4.584 23.853 6 15.596 0 9.748l8.332-1.73z"/>
                          </svg>
                        </button>
                      );
                    })}
                    <div className="text-sm text-gray-500 ml-3">{newReview.rating} sao</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nội dung</label>
                  <textarea placeholder="Nội dung đánh giá" value={newReview.comment} onChange={(e) => setNewReview((s) => ({ ...s, comment: e.target.value }))} rows={5} className="w-full p-3 border rounded" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ảnh (tùy chọn)</label>
                  <div className="flex items-center gap-4">
                    <input ref={fileInputRef} type="file" multiple onChange={(e) => handleNewReviewFiles(e.target.files)} className="" />
                    <div className="text-sm text-gray-500">
                      {(newReview.photos || []).length === 0 ? 'No file chosen' : (newReview.photos || []).map((f, i) => <div key={i}>{f.name}</div>)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => { setShowWriteModal(false); if (fileInputRef.current) fileInputRef.current.value = null; }} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
                  <button onClick={async () => { await submitNewReview(); if (fileInputRef.current) fileInputRef.current.value = null; }} className="px-4 py-2 bg-green-500 text-white rounded">Gửi</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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