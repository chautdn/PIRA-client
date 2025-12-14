import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useI18n } from '../hooks/useI18n';
import { productService } from '../services/product';
import { reviewService } from '../services/review';
import recommendationService from '../services/recommendation';
import { useCart } from '../context/CartContext';
import { cartApiService } from '../services/cartApi';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import ReportModal from './ReportModal';
import rentalOrderService from '../services/rentalOrder';
import KycWarningModal from '../components/common/KycWarningModal';
import { checkKYCRequirements } from '../utils/kycVerification';

import {
  FaHome,
  FaBox,
  FaEye,
  FaMapMarkerAlt,
  FaClipboardList,
  FaCog,
  FaScroll,
  FaTag,
  FaHandSparkles,
  FaClock,
  FaMoneyBillWave,
  FaTruck,
  FaBoxOpen,
  FaHourglassHalf,
  FaChartBar,
  FaHashtag,
  FaRocket,
  FaShoppingCart,
  FaComments,
  FaUser,
  FaFire,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaLightbulb,
  FaHandPointUp,
  FaSadTear,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaStar,
} from 'react-icons/fa';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useI18n();
  const { addToCart: addToCartContext, loading: cartLoading } = useCart();
  const { user, refreshUser } = useAuth(); // Added to get current user
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
  const [ratingFilter, setRatingFilter] = useState(null); // null = all, 1-5 = specific rating
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', photos: [] });
  const [previewImages, setPreviewImages] = useState([]);
  const fileInputRef = useRef(null);
  const [replyBoxOpen, setReplyBoxOpen] = useState({});
  const [menuOpen, setMenuOpen] = useState({});
  const [editingReview, setEditingReview] = useState({});
  const [editingResponse, setEditingResponse] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityModalData, setAvailabilityModalData] = useState(null);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [myCompletedOrders, setMyCompletedOrders] = useState([]);
  const [showKycWarningModal, setShowKycWarningModal] = useState(false);
  const [kycMissingRequirements, setKycMissingRequirements] = useState([]);
  const [ownerHotProducts, setOwnerHotProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingCarousels, setLoadingCarousels] = useState(false);
  const hotProductsScrollRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const relatedProductsScrollRef = useRef(null);
  
  // Order context for rating (when coming from completed order)
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [shipperInfo, setShipperInfo] = useState(null);

  // Check if current user is the product owner
  const isOwner = user && product?.owner?._id === user._id;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Load order context if coming from completed order or handle activeTab query param
  useEffect(() => {
    const fromOrder = searchParams.get('fromOrder');
    const activeTabParam = searchParams.get('activeTab');
    
    if (fromOrder) {
      setCurrentOrderId(fromOrder);
      loadOrderData(fromOrder);
      // Auto-switch to reviews tab
      setActiveTab('reviews');
    } else if (activeTabParam === 'reviews') {
      // Switch to reviews tab when coming from notification
      setActiveTab('reviews');
    }
    
    // Scroll to reviews section after tab is set
    if ((fromOrder || activeTabParam === 'reviews') && reviewsSectionRef.current) {
      setTimeout(() => {
        reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300); // Wait for tab animation
    }
  }, [searchParams]);

  // Fetch owner hot products and related products
  useEffect(() => {
    if (product?._id && product?.owner?._id) {
      fetchOwnerHotProducts();
      fetchRelatedProducts();
    }
  }, [product?._id, product?.owner?._id]);

  // Auto-scroll carousels
  useEffect(() => {
    const scrollInterval = setInterval(() => {
      // Scroll hot products
      if (hotProductsScrollRef.current && ownerHotProducts.length > 0) {
        const container = hotProductsScrollRef.current;
        const scrollAmount = container.offsetWidth;
        if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }

      // Scroll related products
      if (relatedProductsScrollRef.current && relatedProducts.length > 0) {
        const container = relatedProductsScrollRef.current;
        const scrollAmount = container.offsetWidth;
        if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(scrollInterval);
  }, [ownerHotProducts.length, relatedProducts.length]);

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

  // Check availability when dates change
  useEffect(() => {
    checkAvailability();
  }, [deliveryDate, returnDate, product?._id]);

  useEffect(() => {
    // fetch reviews when product loaded and reviews tab active
    if (activeTab === 'reviews' && product?._id) {
      fetchReviews(product._id, ratingFilter);
    }
  }, [activeTab, product?._id, ratingFilter]);

  // Check if user can write review (must have rented this product with COMPLETED order)
  useEffect(() => {
    const checkCanWriteReview = async () => {
      if (!user || !product?._id) {
        console.log('⏭️  Skipping review check - user or product missing');
        setCanWriteReview(false);
        return;
      }

      try {
        // Fetch user's orders
        const response = await rentalOrderService.getMyOrders();
        
        // Extract orders from response - try multiple paths
        let allOrders = [];
        
        // Path 1: { metadata: { orders: [...] } }
        if (response?.metadata?.orders) {
          allOrders = response.metadata.orders;
          console.log('✅ Found orders in metadata.orders, count:', allOrders.length);
        } 
        // Path 2: { data: { metadata: { orders: [...] } } }
        else if (response?.data?.metadata?.orders) {
          allOrders = response.data.metadata.orders;
         
        }
        // Path 3: { data: [...] }
        else if (response?.data && Array.isArray(response.data)) {
          allOrders = response.data;
         
        }
        // Path 4: Direct array
        else if (Array.isArray(response)) {
          allOrders = response;
        
        }
        
        console.log('📋 Total orders found:', allOrders.length);
        
        // Filter to COMPLETED orders only
        const orders = allOrders.filter(o => o.status === 'COMPLETED');
        
        if (orders.length === 0) {
          console.log('⚠️  No completed orders found for user');
          setCanWriteReview(false);
          setMyCompletedOrders([]);
          return;
        }
        
        // Check if current product is in any completed order
        let hasRented = false;
        
        for (const masterOrder of orders) {

          // Iterate through subOrders
          const subOrders = Array.isArray(masterOrder.subOrders) ? masterOrder.subOrders : [];
          
          for (let i = 0; i < subOrders.length; i++) {
            const subOrder = subOrders[i];
            // Handle both populated and unpopulated subOrder references
            const subOrderData = typeof subOrder === 'object' ? subOrder : {};
            const products = Array.isArray(subOrderData.products) ? subOrderData.products : [];
         
            for (let j = 0; j < products.length; j++) {
              const p = products[j];
              const productData = typeof p === 'object' ? p : {};
              const productRef = productData.product;
              const productId = typeof productRef === 'object' ? productRef?._id : productRef;
              

              // Compare both as strings to handle ObjectId/String conversions
              if (String(productId) === String(product._id)) {
                hasRented = true;
                break;
              }
            }
            
            if (hasRented) break;
          }
          
          if (hasRented) break;
        }
        
        if (!hasRented) {
          console.log('❌ Product not found in completed orders');
        }
        
        setCanWriteReview(hasRented);
        setMyCompletedOrders(orders);
      } catch (err) {
        console.error('Error checking review eligibility:', err);
        setCanWriteReview(false);
      }
    };

    checkCanWriteReview();
  }, [user, product?._id]);

  const fetchReviews = async (productId, filterRating = null) => {
    try {
      setReviewsLoading(true);
      const params = { page: reviewsPage, limit: 10, target: reviewsTarget };
      if (filterRating) {
        params.rating = filterRating;
      }
      const res = await reviewService.listByProduct(productId, params);
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

  const handleHelpfulResponse = async (reviewId, responseId, response) => {
    try {
      const res = await reviewService.helpful(reviewId, 'helpful', { userId: user?._id, target: 'response', responseId });
      const updated = res.data?.data;
      if (updated) {
        setReviews((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error('Error toggling response helpful', err);
    }
  };

  const changeReviewsTarget = (target) => {
    setReviewsTarget(target);
    setReviewsPage(1);
    setRatingFilter(null); // Reset rating filter when changing target
    
    // Load shipper info when switching to SHIPPER target
    if (target === 'SHIPPER' && !shipperInfo && myCompletedOrders.length > 0) {
      loadShipperInfoFromOrders();
    }
    
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
  const targetLabel = (target) => {
    if (!target) return '';
    if (target === 'PRODUCT') return t('productDetail.reviewTargets.PRODUCT');
    if (target === 'OWNER') return t('productDetail.reviewTargets.OWNER');
    if (target === 'SHIPPER') return t('productDetail.reviewTargets.SHIPPER');
    return target;
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
    // Clean up any existing preview URLs using functional update to access current state
    setPreviewImages(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = null;
    
    // Load shipper info if reviewing shipper and not already loaded
    if (reviewsTarget === 'SHIPPER' && !shipperInfo && myCompletedOrders.length > 0) {
      console.log('🔍 Opening shipper review modal, loading shipper info...');
      loadShipperInfoFromOrders();
    }
    
    setShowWriteModal(true);
  };

  const handleNewReviewFiles = (files) => {
    const filesArray = Array.from(files);
    setNewReview((s) => ({ ...s, photos: filesArray }));
    
    // Create preview URLs
    const previews = filesArray.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };
  
  const removePreviewImage = (index) => {
    const newPhotos = [...newReview.photos];
    newPhotos.splice(index, 1);
    
    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]); // Clean up URL
    newPreviews.splice(index, 1);
    
    setNewReview((s) => ({ ...s, photos: newPhotos }));
    setPreviewImages(newPreviews);
    
    // Reset file input if no files left
    if (newPhotos.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const submitNewReview = async () => {
    if (!newReview.rating) {
      toast.error(t("productDetail.selectRating"));
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
        
        // For SHIPPER: use shipper info from order context if available
        let revieweeId;
        if (reviewsTarget === 'SHIPPER' && shipperInfo?._id) {
          revieweeId = shipperInfo._id;
          console.log('Using shipper from order context:', shipperInfo);
        } else {
          revieweeId = reviewsTarget === 'OWNER' ? product?.owner?._id : product?.shipper;
        }
        
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
  
  // Clean up preview URLs
  previewImages.forEach(url => URL.revokeObjectURL(url));
  setPreviewImages([]);
  
  setShowWriteModal(false);
  // refresh first page for current target
  console.log('📝 About to refresh reviews, target:', reviewsTarget);
  await changeReviewsTarget(reviewsTarget);
  setNewReview({ rating: 5, title: '', comment: '', photos: [], type: reviewsTarget });
  if (fileInputRef.current) fileInputRef.current.value = null;
  toast.success(t("productDetail.reviewSubmitSuccess"));
    } catch (err) {
      console.error('Error creating review', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Check for duplicate review error - differentiate by type
      const errorMessage = err.response?.data?.message || '';
      const errorStatus = err.response?.status;
      
      // Handle 403 Forbidden - could be permission issue
      if (errorStatus === 403) {
        toast.error(t("productDetail.needCompletedOrder"));
        return;
      }
      
      // Check if it's a duplicate review based on the target type
      if (errorMessage.toLowerCase().includes('bình luận 1 lần cho sản phẩm')) {
        toast.error(t("productDetail.reviewProductError"));
      } else if (errorMessage.toLowerCase().includes('bình luận 1 lần cho người')) {
        toast.error(t("productDetail.reviewOwnerError"));
      } else if (errorMessage.toLowerCase().includes('bình luận 1 lần')) {
        // Generic duplicate message from backend
        if (reviewsTarget === 'PRODUCT') {
          toast.error(t("productDetail.reviewProductError"));
        } else if (reviewsTarget === 'OWNER') {
          toast.error(t("productDetail.reviewOwnerError"));
        } else {
          toast.error(t("productDetail.reviewAlreadyExists"));
        }
      } else if (errorMessage.toLowerCase().includes('hoàn thành một đơn hàng')) {
        toast.error(t("productDetail.needCompletedOrder"));
      } else {
        toast.error(t("productDetail.errorSubmittingReview") + ': ' + (errorMessage || err.message));
      }
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
      toast.success('Phản hồi đã được gửi thành công!');
    } catch (err) {
      console.error('Error replying to review', err);
      toast.error('Lỗi khi gửi phản hồi');
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
                <button 
                  onClick={() => handleHelpfulResponse(productId, resp._id, resp)}
                  className={`flex items-center gap-1 ${(resp.likedBy || []).some(u => user && u && u.toString() === user?._id) ? 'text-red-500 font-semibold' : 'hover:text-gray-700'}`}
                >
                  <span>👍</span>
                  <span>{(resp.likedBy || []).length > 0 ? `${(resp.likedBy || []).length}` : 'Like'}</span>
                </button>
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
                <textarea value={editingLocal.text} onChange={(e) => setEditingLocal((s) => ({ ...s, text: e.target.value }))} className="w-full p-2 border rounded mb-2" rows={3} />
                <div className="mb-2">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => setEditingLocal((s) => ({ ...s, newPhotos: Array.from(e.target.files || []) }))} 
                    className="w-full p-2 border rounded"
                  />
                  {editingLocal.newPhotos && editingLocal.newPhotos.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Sẽ thêm {editingLocal.newPhotos.length} ảnh:</div>
                      <div className="grid grid-cols-4 gap-2">
                        {editingLocal.newPhotos.map((photo, idx) => (
                          <div key={idx} className="relative">
                            <img 
                              src={URL.createObjectURL(photo)} 
                              alt={`Preview ${idx}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <div className="text-xs text-center text-gray-600 mt-1 truncate">{photo.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { await handleSaveEditResponse(productId, resp._id, editingLocal.text, editingLocal.newPhotos); setEditingLocal({}); }} className="px-4 py-2 bg-green-500 text-white rounded">Lưu</button>
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
      toast.success(t("productDetail.reviewDeleted"));
    } catch (err) {
      console.error('Error deleting review', err);
      toast.error(t("productDetail.deleteReviewError"));
    }
  };

  const handleSaveEditReview = async (reviewId) => {
    try {
      const fd = new FormData();
      fd.append('title', editingReview.title || '');
      fd.append('comment', editingReview.text || '');
      
      // Thêm ảnh mới nếu có
      if (editingReview.newPhotos && editingReview.newPhotos.length > 0) {
        for (const photo of editingReview.newPhotos) {
          fd.append('photos', photo);
        }
      }
      
      await reviewService.update(reviewId, fd);
      setEditingReview({});
      fetchReviews(product._id);
      toast.success(t("productDetail.reviewUpdated"));
    } catch (err) {
      console.error('Error saving review edit', err);
      toast.error('Lỗi khi lưu chỉnh sửa');
    }
  };

  const handleDeleteResponse = async (reviewId, responseId) => {
    try {
      await reviewService.deleteResponse(reviewId, responseId);
      fetchReviews(product._id);
      toast.success('Phản hồi đã được xóa');
    } catch (err) {
      console.error('Error deleting response', err);
      toast.error('Lỗi khi xóa phản hồi');
    }
  };

  const handleSaveEditResponse = async (reviewId, responseId, text, newPhotos = []) => {
    try {
      const fd = new FormData();
      fd.append('comment', text || '');
      
      // Thêm ảnh mới nếu có
      if (newPhotos && newPhotos.length > 0) {
        for (const photo of newPhotos) {
          fd.append('photos', photo);
        }
      }
      
      await reviewService.updateResponse(reviewId, responseId, fd);
      fetchReviews(product._id);
      toast.success('Phản hồi đã được cập nhật');
    } catch (err) {
      console.error('Error saving response edit', err);
      toast.error('Lỗi khi lưu chỉnh sửa phản hồi');
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

      // Track category click for recommendation (only if user is logged in)
      if (user && productData?.category?._id) {
        try {
          await recommendationService.trackCategoryClick(productData.category._id);
          console.log('Category click tracked for recommendation:', productData.category._id);
        } catch (trackError) {
          // Silent fail - don't affect user experience if tracking fails
          console.error('Failed to track category click:', trackError);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Load order data when rating from completed order
  const loadShipperInfoFromOrders = async () => {
    try {
      console.log('🔍 Loading shipper info from completed orders...');
      console.log('📦 My completed orders:', myCompletedOrders);
      console.log('📦 Current product ID:', product._id);
      
      // Try to find shipper info from any completed order that contains this product
      for (const masterOrder of myCompletedOrders) {
        console.log('🔍 Checking master order:', masterOrder._id);
        const subOrders = Array.isArray(masterOrder.subOrders) ? masterOrder.subOrders : [];
        console.log('   SubOrders count:', subOrders.length);
        
        for (const subOrder of subOrders) {
          const subOrderData = typeof subOrder === 'object' ? subOrder : {};
          const products = Array.isArray(subOrderData.products) ? subOrderData.products : [];
          
          // Check if this subOrder contains the current product
          const hasCurrentProduct = products.some(p => {
            const productRef = typeof p === 'object' ? p.product : p;
            const productId = typeof productRef === 'object' ? productRef?._id : productRef;
            return String(productId) === String(product._id);
          });
          
          if (hasCurrentProduct) {
            console.log('✅ Found subOrder with current product!');
            // Found a subOrder with this product, now get full order details with shipper info
            try {
              const response = await rentalOrderService.getOrderDetail(masterOrder._id);
              const orderData = response.masterOrder || response.data?.masterOrder || response;
              console.log('📋 Order detail response:', orderData);
              
              if (orderData?.subOrders && orderData.subOrders.length > 0) {
                // Find the subOrder that contains this product
                for (const fullSubOrder of orderData.subOrders) {
                  const fullProducts = Array.isArray(fullSubOrder.products) ? fullSubOrder.products : [];
                  const hasProduct = fullProducts.some(p => {
                    const productRef = typeof p === 'object' ? p.product : p;
                    const productId = typeof productRef === 'object' ? productRef?._id : productRef;
                    return String(productId) === String(product._id);
                  });
                  
                  console.log('   SubOrder has product:', hasProduct);
                  console.log('   SubOrder shipments:', fullSubOrder.shipments);
                  
                  if (hasProduct && fullSubOrder.shipments && fullSubOrder.shipments.length > 0) {
                    console.log('   Shipments found:', fullSubOrder.shipments.length);
                    for (const shipment of fullSubOrder.shipments) {
                      console.log('   Shipment type:', shipment.type, 'Shipper:', shipment.shipper);
                    }
                    
                    const deliveryShipment = fullSubOrder.shipments.find(s => s.type === 'DELIVERY');
                    console.log('   Delivery shipment:', deliveryShipment);
                    
                    if (deliveryShipment?.shipper) {
                      setShipperInfo(deliveryShipment.shipper);
                      console.log('✅ Shipper info loaded from completed order:', deliveryShipment.shipper);
                      return; // Found shipper, exit
                    } else {
                      console.warn('⚠️ Delivery shipment found but no shipper populated');
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Error loading order detail:', err);
              continue; // Try next order
            }
          }
        }
      }
      console.log('⚠️ No shipper found in completed orders');
    } catch (error) {
      console.error('❌ Error loading shipper info:', error);
    }
  };

  const loadOrderData = async (orderId) => {
    try {
      const response = await rentalOrderService.getOrderDetail(orderId);
      console.log('API Response:', response);
      
      // Extract masterOrder from response - API returns { masterOrder, message, ... }
      const orderData = response.masterOrder || response.data?.masterOrder || response;
      console.log('Order data:', orderData);
      
      setCurrentOrder(orderData);
      
      // Extract shipper info from the first suborder's shipments
      if (orderData?.subOrders && orderData.subOrders.length > 0) {
        const subOrder = orderData.subOrders[0];
        console.log('First suborder:', subOrder);
        console.log('Shipments:', subOrder.shipments);
        
        // Get shipper from shipments array
        if (subOrder.shipments && subOrder.shipments.length > 0) {
          const deliveryShipment = subOrder.shipments.find(s => s.type === 'DELIVERY');
          console.log('Delivery shipment:', deliveryShipment);
          
          if (deliveryShipment?.shipper) {
            setShipperInfo(deliveryShipment.shipper);
            console.log('✅ Shipper info loaded:', deliveryShipment.shipper);
          } else {
            console.log('⚠️ No shipper found in delivery shipment');
          }
        } else {
          console.log('⚠️ No shipments found in suborder');
        }
      } else {
        console.log('⚠️ No suborders found in order');
      }
    } catch (error) {
      console.error('❌ Error loading order data:', error);
    }
  };

  const fetchOwnerHotProducts = async () => {
    if (!product?.owner?._id) return;
    try {
      setLoadingCarousels(true);
      const response = await recommendationService.getProductsByOwner(product.owner._id, {
        hotOnly: true,
        limit: 10
      });
      if (response.success || response.metadata) {
        const data = response.metadata || response.data || response;
        // Exclude current product
        const filtered = (data.products || []).filter(p => p._id !== product._id);
        setOwnerHotProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching owner hot products:', error);
    } finally {
      setLoadingCarousels(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product?._id) return;
    try {
      setLoadingCarousels(true);
      // Try to get products from same subcategory first, fallback to category
      const categoryId = product.subCategory?._id || product.category?._id;
      if (!categoryId) return;

      const response = await productService.list({
        category: categoryId,
        limit: 10,
        sort: 'metrics.averageRating',
        order: 'desc'
      });
      
      if (response.data) {
        const products = response.data.data?.products || response.data.products || response.data;
        // Exclude current product
        const filtered = (Array.isArray(products) ? products : []).filter(p => p._id !== product._id);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoadingCarousels(false);
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

  const checkAvailability = async () => {
    if (!product?._id || !deliveryDate || !returnDate) {
      setAvailableQuantity(null);
      return;
    }

    try {
      setCheckingAvailability(true);
      
      const response = await rentalOrderService.getProductAvailabilityCalendar(
        product._id,
        deliveryDate,
        returnDate
      );

      if (response.status === 'success' && response.data?.metadata?.calendar) {
        const calendar = response.data.metadata.calendar;
        
        // Find minimum available quantity across the selected date range
        let minAvailable = Infinity;
        const startDate = new Date(deliveryDate);
        const endDate = new Date(returnDate);
        
        for (let currentDate = new Date(startDate); currentDate < endDate; currentDate.setDate(currentDate.getDate() + 1)) {
          const dateString = currentDate.toISOString().split('T')[0];
          const dayInfo = calendar.find(day => day.date === dateString);
          
          if (dayInfo) {
            minAvailable = Math.min(minAvailable, dayInfo.availableQuantity);
          }
        }
        
        setAvailableQuantity(minAvailable === Infinity ? 0 : minAvailable);
      } else {
        setAvailableQuantity(0);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableQuantity(0);
    } finally {
      setCheckingAvailability(false);
    }
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
      alert(t("productDetail.pleaseSelectDates"));
      return;
    }

    // Validation
    if (quantity < 1) {
      alert('Số lượng phải lớn hơn 0');
      return;
    }

    // Real-time availability check trước khi add to cart
    // Check real-time availability before adding to cart
    try {
      const availabilityResponse = await rentalOrderService.getProductAvailabilityCalendar(
        product._id,
        deliveryDate,
        returnDate
      );

      if (availabilityResponse.status === 'success' && availabilityResponse.data?.metadata?.calendar) {
        const calendar = availabilityResponse.data.metadata.calendar;
        
        // Find minimum available quantity in selected range
        let minAvailable = Infinity;
        const startDate = new Date(deliveryDate);
        const endDate = new Date(returnDate);
        
        for (let currentDate = new Date(startDate); currentDate < endDate; currentDate.setDate(currentDate.getDate() + 1)) {
          const dateString = currentDate.toISOString().split('T')[0];
          const dayInfo = calendar.find(day => day.date === dateString);
          
          if (dayInfo) {
            minAvailable = Math.min(minAvailable, dayInfo.availableQuantity);
          }
        }
        
        const currentAvailable = minAvailable === Infinity ? 0 : minAvailable;
        
        if (currentAvailable < quantity) {
          // Tìm ngày có sẵn để gợi ý
          const availableDates = calendar.filter(day => day.availableQuantity >= quantity);
          
          setAvailabilityModalData({
            productName: product.title,
            requested: quantity,
            available: currentAvailable,
            dateRange: `${new Date(deliveryDate).toLocaleDateString('vi-VN')} - ${new Date(returnDate).toLocaleDateString('vi-VN')}`,
            unavailableDates: calendar
              .filter(day => day.availableQuantity < quantity)
              .map(day => ({
                date: new Date(day.date).toLocaleDateString('vi-VN'),
                available: day.availableQuantity,
                requested: quantity
              })),
            suggestedDates: availableDates.slice(0, 5).map(day => ({
              date: new Date(day.date).toLocaleDateString('vi-VN'),
              available: day.availableQuantity,
              rawDate: day.date
            }))
          });
          setShowAvailabilityModal(true);
          
          // Cập nhật lại availability hiển thị
          setAvailableQuantity(currentAvailable);
          
          // Tự động giảm quantity xuống available amount
          if (currentAvailable > 0) {
            setQuantity(Math.min(quantity, currentAvailable));
          }
          return;
        }
        
        // Real-time check passed
      }
    } catch (error) {
      console.error('Error checking real-time availability:', error);
      alert('Không thể kiểm tra tình trạng sản phẩm. Vui lòng thử lại sau.');
      return;
    }

    // Fallback check with total stock
    const maxStock = product.availability?.quantity || 0;
    if (quantity > maxStock) {
      alert(`Số lượng không được vượt quá ${maxStock} cái`);
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
        alert(`${t("productDetail.addedToCart")}\n\n${result.warning}`);
      } else {
        alert(t("productDetail.addedToCart"));
      }
    } else {
      if (result.requireLogin) {
        alert(result.error);
        navigate('/auth/login', { state: { from: `/products/${id}` } });
      } else {
        alert(` ${result.error || t("productDetail.addCartError")}`);
      }
    }
  };

  const handleRentNow = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thuê sản phẩm');
      navigate('/auth/login', { state: { from: `/products/${id}` } });
      return;
    }

    // Refresh user data to get latest info from backend
    let currentUser = user;
    try {
      if (refreshUser) {
        currentUser = await refreshUser();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Continue with cached user data
    }

    // Check KYC requirements with fresh user data
    const kycCheck = checkKYCRequirements(currentUser);
    if (!kycCheck.isComplete) {
      setKycMissingRequirements(kycCheck.missing);
      setShowKycWarningModal(true);
      return;
    }

    if (!deliveryDate || !returnDate) {
      alert(t("productDetail.pleaseSelectDates"));
      return;
    }

    // Validation
    const maxStock = product.availability?.quantity || 0;
    if (quantity < 1) {
      alert('Số lượng phải lớn hơn 0');
      return;
    }
    
    if (quantity > maxStock) {
      alert(`Số lượng không được vượt quá ${maxStock} cái`);
      return;
    }

    const rentalData = {
      startDate: new Date(deliveryDate),
      endDate: new Date(returnDate),
      duration: getRentalDays()
    };

    try {
      // Add product to cart with openDrawer=false to prevent drawer opening
      const result = await addToCartContext(product, quantity, rentalData, false);
      
      if (result.success) {
        // Navigate to cart page without opening drawer
        navigate('/cart');
      } else {
        alert(` ${result.error || t("productDetail.addCartError")}`);
      }
    } catch (error) {
      const errorMsg = error.message || t("productDetail.addCartError");
      alert(`${errorMsg}`);
    }
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
          <FaSadTear className="text-8xl text-gray-400 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            {t("productDetail.backToList")}
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
              <FaHome className="inline mr-1" />Trang chủ
            </Link>
            <span className="text-gray-400">›</span>
            <Link to="/products" className="text-gray-500 hover:text-green-600 transition-colors font-medium">
              <FaBox className="inline mr-1" />Sản phẩm
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
                  <FaStar className="text-yellow-500" />
                  <span className="font-semibold">{product.metrics?.averageRating || 4.8}</span>
                  <span>{t("productDetail.reviewCount", { count: product.metrics?.reviewCount || 0 })}</span>
                </div>
                <div className="flex items-center gap-2">

                  <FaEye className="text-gray-500" />
                  <span>{product.metrics?.viewCount || 0} {t('productDetail.views')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-500" />
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
                  {t('productDetail.clickToZoom')}
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
                    { id: 'description', label: <><FaClipboardList className="inline mr-1" />{t("productDetail.tab_description")}</>, icon: FaClipboardList },
                    { id: 'specifications', label: <><FaCog className="inline mr-1" />{t("productDetail.tab_specifications")}</>, icon: FaCog },
                    { id: 'rules', label: <><FaScroll className="inline mr-1" />{t("productDetail.tab_rules")}</>, icon: FaScroll },
                    { id: 'reviews', label: <><FaStar className="inline mr-1" />{t("productDetail.tab_reviews")}</>, icon: FaStar }
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
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('productDetail.productDetailsTitle')}</h3>
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
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('productDetail.specificationsTitle')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {product.brand?.name && (
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl">
                              <div className="flex justify-between items-center">
                                <FaTag className="text-gray-600 mr-2" />
                                <span className="text-gray-600 font-medium">Thương hiệu:</span>
                                <span className="font-bold text-gray-900">{product.brand.name}</span>
                              </div>
                            </div>
                          )}
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <FaHandSparkles  className="text-gray-600 mr-2" />
                              <span className="text-gray-600 font-medium">Tình trạng:</span>
                              <span className="font-bold text-gray-900">
                                {product.condition === 'NEW' ? 'Mới' : 'Tốt'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <FaBox className="text-gray-600 mr-2" />
                              <span className="text-gray-600 font-medium">Số lượng:</span>
                              <span className="font-bold text-gray-900">{product.availability?.quantity || 1} cái</span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                              <FaStar className="text-yellow-400 mr-2" />
                              <span className="text-gray-600 font-medium">{t("productDetail.selectedRating")}</span>
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
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Quy định thuê</h3>
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                          <h4 className="font-bold text-blue-900 mb-3 text-lg flex items-center">
                            <FaClock className="mr-2" />
                            Thời gian thuê
                          </h4>
                          <ul className="space-y-2 text-blue-800">
                            <li>{t('productDetail.minimumHourlyRental')}</li>
                            <li>{t('productDetail.minimumDailyRental')}</li>
                            <li>{t('productDetail.deliveryPickupHours')}</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                          <h4 className="font-bold text-green-900 mb-3 text-lg flex items-center">
                            <FaMoneyBillWave className="mr-2" />
                            {t('productDetail.paymentDepositTitle2')}
                          </h4>
                          <ul className="space-y-2 text-green-800">
                            <li>• {t('productDetail.depositAmount', { amount: formatPrice(product.pricing?.deposit?.amount || 500000) })}</li>
                            <li>• {t('productDetail.paymentBeforeDelivery')}</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'reviews' && (
                    <motion.div
                      ref={reviewsSectionRef}
                      key="reviews"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">{t("productDetail.reviews")}</h3>
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
                                <div className="text-gray-500">{t("productDetail.reviewCount").replace('{count}', reviewStats.count || product.metrics?.reviewCount || 0)}</div>
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
                                const isActive = ratingFilter === s;
                                return (
                                  <div 
                                    key={s} 
                                    className="flex items-center gap-4 cursor-pointer group"
                                    onClick={() => setRatingFilter(isActive ? null : s)}
                                  >
                                    <div className={`w-8 text-sm font-medium transition-colors ${isActive ? 'text-yellow-600' : 'text-gray-700 group-hover:text-yellow-600'}`}>{s}★</div>
                                    <div className={`flex-1 rounded-full h-3 overflow-hidden transition-colors ${isActive ? 'bg-yellow-300' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                                      <motion.div
                                        className={`h-3 rounded-full transition-colors ${isActive ? 'bg-yellow-600' : 'bg-yellow-400'}`}
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
                              <button onClick={() => changeReviewsTarget('PRODUCT')} className={`w-full py-2 rounded-md text-sm ${reviewsTarget === 'PRODUCT' ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-800 border border-yellow-100'}`}>{t('productDetail.reviewTargets.PRODUCT')}</button>
                              <button onClick={() => changeReviewsTarget('OWNER')} className={`w-full py-2 rounded-md text-sm ${reviewsTarget === 'OWNER' ? 'bg-emerald-400 text-white' : 'bg-white text-emerald-800 border border-emerald-100'}`}>{t('productDetail.reviewTargets.OWNER')}</button>
                              <button onClick={() => changeReviewsTarget('SHIPPER')} className={`w-full py-2 rounded-md text-sm ${reviewsTarget === 'SHIPPER' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-700 border border-indigo-100'}`}>{t('productDetail.reviewTargets.SHIPPER')}</button>
                            </div>
                            {canWriteReview && (
                              <button onClick={openWriteModal} className="mt-2 w-full py-3 bg-violet-600 text-white rounded-xl shadow-lg">{t("productDetail.writeReview", { target: targetLabel(reviewsTarget) })}</button>
                            )}
                            {!canWriteReview && user && (
                              <div className="mt-2 w-full py-3 bg-gray-300 text-gray-600 text-center rounded-xl text-sm">{t('productDetail.viewOnlyReviews')}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reviews list */}
                      <div className="space-y-4">
                        {reviewsLoading && (
                          <div className="text-center text-gray-500 py-6">{t('productDetail.loadingReviews2')}</div>
                        )}

                        {!reviewsLoading && reviews.length === 0 && (
                          <div className="text-center text-gray-500 py-6">{t('productDetail.noReviewsYet')}</div>
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
                                    <button 
                                      onClick={() => handleHelpful(r)}
                                      className={`flex items-center gap-1 ${(r.likedBy || []).some(u => user && u && u.toString() === user?._id) ? 'text-red-500 font-semibold' : 'hover:underline text-gray-500'}`}
                                    >
                                      <span>👍</span>
                                      <span>{(r.likedBy || []).length > 0 ? `${(r.likedBy || []).length}` : 'Like'}</span>
                                    </button>
                                    {r.responses && r.responses.length > 0 && (
                                      <span className="text-gray-400">{t('productDetail.viewAllResponses', { count: r.responses.length })}</span>
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
                                    )}git 
                                  </div>
                                </div>

                                {/* Edit review inline */}
                                {editingReview.id === r._id && (
                                  <div className="mt-3 p-3 border border-gray-100 rounded">
                                    <textarea value={editingReview.text} onChange={(e) => setEditingReview((s) => ({ ...s, text: e.target.value }))} className="w-full p-2 border rounded mb-2" rows={3} />
                                    <div className="mb-2">
                                      <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*"
                                        onChange={(e) => setEditingReview((s) => ({ ...s, newPhotos: Array.from(e.target.files || []) }))} 
                                        className="w-full p-2 border rounded"
                                      />
                                      {editingReview.newPhotos && editingReview.newPhotos.length > 0 && (
                                        <div className="mt-2">
                                          <div className="text-sm font-semibold text-gray-700 mb-2">Sẽ thêm {editingReview.newPhotos.length} ảnh:</div>
                                          <div className="grid grid-cols-4 gap-2">
                                            {editingReview.newPhotos.map((photo, idx) => (
                                              <div key={idx} className="relative">
                                                <img 
                                                  src={URL.createObjectURL(photo)} 
                                                  alt={`Preview ${idx}`}
                                                  className="w-full h-24 object-cover rounded border"
                                                />
                                                <div className="text-xs text-center text-gray-600 mt-1 truncate">{photo.name}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
                  <span className="text-xl text-gray-500 font-normal ml-2">{t("productDetail.perDay")}</span>
                </div>
              </div>

              {/* Date Selection for Rental */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">{t("productDetail.selectRentalTime")}</h4>
                
                {/* Delivery Date */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    
                    <FaTruck className="inline mr-1" />
                   {t("productDetail.deliveryDate")}
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
                        ? t("productDetail.deliveryTimeHint_after12")
                        : t("productDetail.deliveryTimeHint_before12");
                    })()}
                  </p>
                </div>

                {/* Return Date */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    
                    <FaBoxOpen className="inline mr-1" />
                    {t("productDetail.returnDate")}
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
                      {t("productDetail.pleaseSelectDeliveryFirst")}
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
                      <div className="text-sm text-gray-700 mb-1">
                        <FaHourglassHalf className="inline mr-1" />
                        {t("productDetail.rentalDuration")}
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        {getRentalDays()} {t("productDetail.rentalDays")}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {t("productDetail.from")} {new Date(deliveryDate).toLocaleDateString('vi-VN')} {t("productDetail.to")} {new Date(returnDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Time Selection Hints */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-600 text-center">
                    <div className="font-semibold mb-1">
                      <FaClock className="inline mr-1" />
                      {t("productDetail.deliveryTime")}
                    </div>
                    <div>8:00 - 20:00 hàng ngày</div>
                    <div className="text-gray-500 mt-1">{t("productDetail.minimumRental")}</div>
                  </div>
                </div>

                {/* Availability Info */}
                {deliveryDate && returnDate && (
                  <div className="mt-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2">
                        <FaChartBar className="inline mr-1" />
                        {t("productDetail.productStatus")}
                      </h5>
                      {checkingAvailability ? (
                        <div className="flex items-center space-x-2">
                          <FaSpinner className="animate-spin text-blue-600" />
                          <span className="text-blue-600">{t("productDetail.checkingAvailability")}</span>
                        </div>
                      ) : availableQuantity !== null ? (
                        <div className="text-lg font-semibold">
                          {availableQuantity > 0 ? (
                            <span className="text-green-600">
                              <FaCheckCircle className="inline mr-1" />
                              {t("productDetail.inStock", { count: availableQuantity })}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              
                              <FaTimesCircle className="inline mr-1" />
                              {t("productDetail.outOfStock")}
                            </span>
                          )}
                        </div>
                      ) : null}
                      <div className="text-sm text-blue-600 mt-1">
                        {t("productDetail.from")} {new Date(deliveryDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} {t("productDetail.to")} {new Date(returnDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">
                  <FaHashtag className="inline mr-1" />
                  {t("productDetail.quantity")}
                </h4>
                <div className="flex items-center bg-gray-50 rounded-xl p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-gray-900">{quantity}</div>
                    <div className="text-sm text-gray-600">{t("productDetail.pcs")}</div>
                  </div>
                  <button
                    onClick={() => {
                      const maxStock = deliveryDate && returnDate && availableQuantity !== null 
                        ? availableQuantity 
                        : (product.availability?.quantity || 0);
                      if (quantity < maxStock) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    disabled={(() => {
                      const maxStock = deliveryDate && returnDate && availableQuantity !== null 
                        ? availableQuantity 
                        : (product.availability?.quantity || 0);
                      return quantity >= maxStock;
                    })()}
                    className="w-12 h-12 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600 text-center">
                  {deliveryDate && returnDate && availableQuantity !== null ? (
                    <>
                      {t("productDetail.availableInRange", { count: availableQuantity })}
                      {quantity >= availableQuantity && (
                        <div className="text-orange-600 text-xs mt-1">
                          
                          <FaExclamationTriangle className="inline mr-1" />
                          {t("productDetail.reachedMaxQuantity")}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {t("productDetail.available", { count: product.availability?.quantity || 0 })}
                      {quantity >= (product.availability?.quantity || 0) && (
                        <div className="text-orange-600 text-xs mt-1">
                          
                          <FaExclamationTriangle className="inline mr-1" />
                          {t("productDetail.reachedMaxQuantityTotal")}
                        </div>
                      )}
                    </>
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
                    <div className="text-lg text-gray-700 mb-2">
                      <FaMoneyBillWave className="inline mr-1" />
                      {t("productDetail.totalCost")}
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      {formatPrice(getTotalPrice())}đ
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {t("productDetail.costCalculation", {
                        price: formatPrice(getRentalPrice()),
                        days: getRentalDays(),
                        quantity: quantity
                      })}
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
                  
                  <FaRocket className="inline mr-2" />
                  {t("productDetail.rentNow")}
                </motion.button>

                <motion.button
                  onClick={handleAddToCart}
                  className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={cartLoading || !deliveryDate || !returnDate || getRentalDays() <= 0}
                >
                  {cartLoading ? <><FaSpinner className="animate-spin inline mr-2" />{t("productDetail.adding")}</> : <><FaShoppingCart className="inline mr-2" />{t("productDetail.addToCart")}</>}
                </motion.button>

                {!isOwner && (
                  <motion.button
                    onClick={handleMessageOwner}
                    className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    
                    <FaComments className="inline mr-2" />
                    {t("productDetail.messageOwner")}
                  </motion.button>
                )}
                
              </div>

              {/* Owner Info */}
              {product.owner && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    <FaUser className="inline mr-1" />
                    {t('productDetail.ownerLabel')}
                  </h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {product.owner.profile?.firstName?.[0] || product.owner.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">
                        {product.owner.profile?.firstName} {product.owner.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <FaChartBar className="inline mr-1" />
                        {t('productDetail.trustScoreLabel')}: <span className="font-semibold text-green-600">{product.owner.trustScore || 95}%</span>
                      </div>
                      <div className="flex items-center text-sm text-yellow-600">
                        <FaStar className="mr-1" />
                        <span className="font-medium">{product.owner.metrics?.averageRating?.toFixed(1) || '4.9'} {t('productDetail.reviewCount', { count: product.owner.metrics?.reviewCount || 128 })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* View All Products Button */}
                  <motion.button
                    onClick={() => navigate(`/owner/${product.owner._id}/products`)}
                    className="mt-4 w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {t('productDetail.viewAllButton')}
                  </motion.button>
                </div>
              )}

              {/* Location Info */}
              {product.location?.address && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">
                    <FaMapMarkerAlt className="inline mr-1" />
                    {t('productDetail.locationAndDeliveryLabel')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <FaHome className="text-lg mr-2" />
                      <span>{product.location.address.district}, {product.location.address.city}</span>
                    </div>

                    {product.location.deliveryOptions?.delivery && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center text-green-700">
                          <FaTruck className="text-lg mr-2" />
                          <span>{t('productDetail.deliveryOptionLabel')}</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatPrice(product.location.deliveryOptions.deliveryFee || 30000)}đ
                        </span>
                      </div>
                    )}

                    {product.location.deliveryOptions?.pickup && (
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg">

                        <FaBox className="text-lg mr-2" />
                        <span className="text-blue-700">{t('productDetail.pickupOptionLabel')}</span>
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
            <motion.div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{t("productDetail.createReviewModal", { target: targetLabel(reviewsTarget) })}</h3>
                <button onClick={() => setShowWriteModal(false)} className="text-gray-500">{t("productDetail.closeButton")}</button>
              </div>

              {/* Display Shipper Info when reviewing shipper */}
              {reviewsTarget === 'SHIPPER' && (
                shipperInfo ? (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300 shadow-sm">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    {t("productDetail.shipperInfoLabel")}
                  </h4>
                  <div className="space-y-3">
                    {(shipperInfo.profile?.firstName || shipperInfo.profile?.lastName) && (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                          {(shipperInfo.profile?.firstName?.[0] || shipperInfo.email?.[0] || 'S').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-base">
                            {shipperInfo.profile.firstName} {shipperInfo.profile?.lastName || ''}
                          </p>
                          <p className="text-xs text-gray-500">{t("productDetail.shipperName")}</p>
                        </div>
                      </div>
                    )}
                    {shipperInfo.email && (
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-800">{shipperInfo.email}</p>
                          <p className="text-xs text-gray-500">{t("productDetail.shipperEmail")}</p>
                        </div>
                      </div>
                    )}
                    {(shipperInfo.phone || shipperInfo.profile?.phoneNumber) && (
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-800">{shipperInfo.phone || shipperInfo.profile?.phoneNumber}</p>
                          <p className="text-xs text-gray-500">{t("productDetail.shipperPhone")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Đang tải thông tin shipper...
                    </p>
                  </div>
                )
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t("productDetail.ratingLabel")}</label>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((n) => {
                      const active = n <= newReview.rating;
                      return (
                        <button
                          key={n}
                          onClick={() => setNewReview((s) => ({ ...s, rating: n }))}
                          className={`p-2 rounded-md transition-colors ${active ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                          aria-label={t("productDetail.starText").replace("{n}", n)}
                          aria-pressed={active}
                        >
                          <svg className={`w-7 h-7 ${active ? 'text-yellow-500' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.257L12 19.771 4.584 23.853 6 15.596 0 9.748l8.332-1.73z"/>
                          </svg>
                        </button>
                      );
                    })}
                    <div className="text-sm text-gray-500 ml-3">{newReview.rating} {t("productDetail.starText").replace("{n}", "").toLowerCase()}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t("productDetail.contentLabel")}</label>
                  <textarea placeholder={t("productDetail.reviewContentPlaceholder")} value={newReview.comment} onChange={(e) => setNewReview((s) => ({ ...s, comment: e.target.value }))} rows={5} className="w-full p-3 border rounded" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t("productDetail.photosOptional")}</label>
                  <div className="flex flex-col gap-3">
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => handleNewReviewFiles(e.target.files)} className="text-sm" />
                    
                    {previewImages.length === 0 ? (
                      <div className="text-sm text-gray-500">{t("productDetail.noFilesSelected")}</div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">{t("productDetail.filesSelected", { count: newReview.photos.length })}</div>
                        <div className="grid grid-cols-3 gap-3">
                          {previewImages.map((preview, i) => (
                            <div key={i} className="relative group">
                              <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                              <button
                                type="button"
                                onClick={() => removePreviewImage(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="text-xs text-gray-500 mt-1 truncate">{newReview.photos[i]?.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => { 
                    previewImages.forEach(url => URL.revokeObjectURL(url));
                    setPreviewImages([]);
                    setShowWriteModal(false); 
                    if (fileInputRef.current) fileInputRef.current.value = null; 
                  }} className="px-4 py-2 bg-gray-200 rounded">{t("productDetail.cancelButton")}</button>
                  <button onClick={async () => { await submitNewReview(); if (fileInputRef.current) fileInputRef.current.value = null; }} className="px-4 py-2 bg-green-500 text-white rounded">{t("productDetail.submitButton")}</button>
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
              {t('productDetail.imageGalleryHint')}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Availability Warning Modal */}
      {showAvailabilityModal && availabilityModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">Không đủ sản phẩm</h3>
                    <p className="text-sm text-red-600">Sản phẩm không còn đủ số lượng trong thời gian đã chọn</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                >
                  <span className="text-red-600 font-bold">×</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <div className="border border-red-200 rounded-xl p-4 bg-red-50 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">{availabilityModalData.productName}</h4>
                <div className="text-sm text-red-700 mb-2">
                  <span className="font-medium">Thời gian thuê:</span> {availabilityModalData.dateRange}
                </div>
                <div className="text-sm text-red-700 mb-3">
                  <span className="font-medium">Yêu cầu:</span> {availabilityModalData.requested} sản phẩm • 
                  <span className="font-medium"> Tối đa có thể thuê:</span> {availabilityModalData.available} sản phẩm
                </div>
                
                {availabilityModalData.unavailableDates && availabilityModalData.unavailableDates.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-red-200 mb-4">
                    <h5 className="font-medium text-red-800 mb-2">📅 Ngày không đủ số lượng:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {availabilityModalData.unavailableDates.map((dateInfo, dateIndex) => (
                        <div key={dateIndex} className="flex justify-between items-center text-sm bg-red-50 px-2 py-1 rounded">
                          <span className="text-red-700">{dateInfo.date}</span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-medium text-xs">
                            {dateInfo.available}/{dateInfo.requested}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Available Dates */}
              {availabilityModalData.suggestedDates && availabilityModalData.suggestedDates.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h5 className="font-medium text-green-800 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    Gợi ý ngày còn hàng ({availabilityModalData.requested} sản phẩm):
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {availabilityModalData.suggestedDates.map((dateInfo, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          // Auto-fill suggested date as delivery date
                          setDeliveryDate(dateInfo.rawDate);
                          setReturnDate('');
                          setShowAvailabilityModal(false);
                        }}
                        className="flex justify-between items-center text-sm bg-white border border-green-200 hover:border-green-400 px-3 py-2 rounded-lg transition-colors group"
                      >
                        <span className="text-green-700 group-hover:text-green-800">{dateInfo.date}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium text-xs group-hover:bg-green-200">
                          {dateInfo.available} có sẵn
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-green-600 mt-2 text-center">
                    👆 Click vào ngày để tự động chọn làm ngày nhận hàng
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowAvailabilityModal(false);
                    // Scroll to date picker
                    window.scrollTo({ top: document.querySelector('input[type="date"]')?.offsetTop - 100, behavior: 'smooth' });
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Chọn ngày khác
                </button>
              </div>
              <div className="mt-3 text-center text-sm text-gray-600">
                💡 Vui lòng chọn thời gian khác hoặc giảm số lượng để tiếp tục
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* KYC Warning Modal */}
      <KycWarningModal
        isOpen={showKycWarningModal}
        onClose={() => setShowKycWarningModal(false)}
        missingRequirements={kycMissingRequirements}
      />

      {/* Owner Hot Products Carousel */}
      {!loading && product && ownerHotProducts.length > 0 && (
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {t('productDetail.hotProductsTitle')}{' '}
                <span className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {product.owner?.profile?.fullName || t('productDetail.thisOwner')}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t('productDetail.highestRatedProducts')}</p>
            </div>
            <Link
              to={`/owner/${product.owner._id}/products`}
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              {t('productDetail.viewAllButton')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={() => {
                if (hotProductsScrollRef.current) {
                  hotProductsScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
              aria-label="Previous"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={() => {
                if (hotProductsScrollRef.current) {
                  hotProductsScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
              aria-label="Next"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Scroll Container */}
            <div 
            ref={hotProductsScrollRef}
            className="relative overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseEnter={() => hotProductsScrollRef.current?.style.setProperty('--pause', 'paused')}
            onMouseLeave={() => hotProductsScrollRef.current?.style.setProperty('--pause', 'running')}
          >
            <div className="flex gap-4" style={{ scrollSnapType: 'x mandatory' }}>
              {ownerHotProducts.map((item, index) => (
                <motion.div
                  key={item._id}
                  className="flex-shrink-0 w-64"
                  style={{ scrollSnapAlign: 'start' }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Link to={`/product/${item._id}`} className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden h-full">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.images?.[0]?.url || item.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="font-medium text-gray-700">
                            {item.metrics?.averageRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          ({item.metrics?.reviewCount || 0})
                        </span>
                      </div>
                      <p className="text-green-600 font-bold text-lg">
                        {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(item.pricing?.dailyRate || 0)}đ
                        <span className="text-sm text-gray-500 font-normal">{t('productDetail.perDay')}</span>
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          </div>
        </motion.div>
      )}

      {/* Related Products Carousel */}
      {!loading && product && relatedProducts.length > 0 && (
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {t('productDetail.relatedProductsTitle')}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {product.subCategory?.name || product.category?.name}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">{t('productDetail.discoverSimilarProducts')}</p>
          </div>
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={() => {
                if (relatedProductsScrollRef.current) {
                  relatedProductsScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
              aria-label="Previous"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={() => {
                if (relatedProductsScrollRef.current) {
                  relatedProductsScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110"
              aria-label="Next"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Scroll Container */}
            <div 
            ref={relatedProductsScrollRef}
            className="relative overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseEnter={() => relatedProductsScrollRef.current?.style.setProperty('--pause', 'paused')}
            onMouseLeave={() => relatedProductsScrollRef.current?.style.setProperty('--pause', 'running')}
          >
            <div className="flex gap-4" style={{ scrollSnapType: 'x mandatory' }}>
              {relatedProducts.map((item, index) => (
                <motion.div
                  key={item._id}
                  className="flex-shrink-0 w-64"
                  style={{ scrollSnapAlign: 'start' }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Link to={`/product/${item._id}`} className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden h-full">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.images?.[0]?.url || item.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="font-medium text-gray-700">
                            {item.metrics?.averageRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          ({item.metrics?.reviewCount || 0})
                        </span>
                      </div>
                      <p className="text-green-600 font-bold text-lg">
                        {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(item.pricing?.dailyRate || 0)}đ
                        <span className="text-sm text-gray-500 font-normal">{t('productDetail.perDay')}</span>
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        {t('productDetail.from')}: {item.owner?.profile?.fullName || item.owner?.email?.split('@')[0]}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}