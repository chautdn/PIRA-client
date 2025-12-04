import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, DollarSign, AlertCircle, Loader, Check, ChevronRight } from "lucide-react";
import Portal from "../common/Portal";
import toast from "react-hot-toast";
import api from "../../services/api";

/**
 * Extend Rental Modal - Single page with per-product calendar picker
 */
const ExtendRentalModal = ({
  isOpen,
  onClose,
  masterOrder,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [localOrder, setLocalOrder] = useState(null);

  // Get suborder - ensure populate
  const order = localOrder || masterOrder;
  const subOrder = order?.subOrders?.[0];
  const products = subOrder?.products || [];
  
  // State to hold enriched product data
  const [enrichedProducts, setEnrichedProducts] = useState({});

  // Fetch order detail if needed
  useEffect(() => {
    if (isOpen && masterOrder && !masterOrder.subOrders) {
      console.log('📥 Fetching order detail...');
      api.get(`/rental-orders/${masterOrder._id}`)
        .then(res => {
          setLocalOrder(res.data.data);
          console.log('✅ Order detail fetched:', res.data.data);
        })
        .catch(err => console.error('❌ Failed to fetch order:', err));
    }
  }, [isOpen, masterOrder]);

  // Fetch product details for items without proper population
  useEffect(() => {
    if (products && products.length > 0) {
      products.forEach(product => {
        // If product already has data from populate, use it directly
        if (product.product && typeof product.product === 'object' && product.product._id) {
          console.log('📦 Product already populated:', product.product);
          setEnrichedProducts(prev => ({
            ...prev,
            [product._id]: product.product
          }));
        } else if (product.product && typeof product.product === 'string') {
          // If product is just an ID string, fetch it
          const productId = product.product;
          console.log(`🔍 Fetching product with ID: ${productId}`);
          api.get(`/products/${productId}`)
            .then(res => {
              const fetchedProduct = res.data?.data || res.data?.metadata || res.data;
              console.log(`✅ Fetched product ${productId}:`, fetchedProduct);
              setEnrichedProducts(prev => ({
                ...prev,
                [product._id]: fetchedProduct
              }));
            })
            .catch(err => {
              console.warn(`⚠️ Failed to fetch product ${productId}:`, err.message);
            });
        }
      });
    }
  }, [products]);

  // Selected products with per-product extension dates
  const [selectedProducts, setSelectedProducts] = useState({});

  // Initialize on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectAll(false);
      setShowSummary(false);
      setSelectedProducts({});
    }
  }, [isOpen]);

  // Get product image safely
  const getProductImage = (productDetail) => {
    if (!productDetail) return null;
    
    console.log('🖼️ Getting image from:', productDetail);
    
    // Try images array first (from populated data)
    if (productDetail.images && Array.isArray(productDetail.images) && productDetail.images.length > 0) {
      const firstImage = productDetail.images[0];
      console.log('✅ Using image from images array:', firstImage);
      return typeof firstImage === 'string' ? firstImage : firstImage?.url;
    }
    
    // Try thumbnail
    if (productDetail.thumbnail) {
      console.log('✅ Using thumbnail:', productDetail.thumbnail);
      return productDetail.thumbnail;
    }
    
    // Try single image field
    if (productDetail.image) {
      console.log('✅ Using image field:', productDetail.image);
      return productDetail.image;
    }
    
    if (productDetail.mainImage) {
      console.log('✅ Using mainImage:', productDetail.mainImage);
      return productDetail.mainImage;
    }
    
    console.log('❌ No image found in product detail');
    return null;
  };

  // Get product name safely
  const getProductName = (productDetail) => {
    if (!productDetail) return 'Sản phẩm (chưa tải)';
    
    // Try title first (from Product model)
    if (productDetail.title) {
      console.log('✅ Using title:', productDetail.title);
      return productDetail.title;
    }
    
    // Try name (fallback)
    if (productDetail.name) {
      console.log('✅ Using name:', productDetail.name);
      return productDetail.name;
    }
    
    console.log('❌ No name/title found');
    return 'Sản phẩm (chưa tải tên)';
  };
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    const newSelected = {};
    if (checked) {
      products.forEach(p => {
        if (isValidProduct(p)) {
          newSelected[p._id] = {
            selected: true,
            newEndDate: null
          };
        }
      });
    }
    setSelectedProducts(newSelected);
  };

  // Check if product is valid for extension
  const isValidProduct = (product) => {
    return product.productStatus === 'CONFIRMED' || 
           product.productStatus === 'ACTIVE' || 
           product.productStatus === 'DELIVERED' || 
           product.productStatus === 'COMPLETED';
  };

  // Handle product selection
  const handleProductSelect = (productId, checked) => {
    setSelectedProducts(prev => {
      const newState = { ...prev };
      if (checked) {
        newState[productId] = { selected: true, newEndDate: null };
      } else {
        delete newState[productId];
        setSelectAll(false);
      }
      return newState;
    });
  };

  // Handle date change for a product
  const handleDateChange = (productId, newDate) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        newEndDate: newDate
      }
    }));
  };

  // Calculate extension days for product
  const getExtensionDays = (productId, newDate) => {
    if (!newDate) return 0;
    const product = products.find(p => p._id === productId);
    if (!product) return 0;
    
    const currentEndDate = new Date(product.rentalPeriod?.endDate);
    const newEndDate = new Date(newDate);
    
    if (newEndDate <= currentEndDate) return 0;
    
    const diffTime = Math.abs(newEndDate - currentEndDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate extension fee for product
  const getExtensionFee = (product, extensionDays) => {
    if (extensionDays <= 0 || !product) return 0;
    
    // Get the daily rental price from the product in subOrder
    // product.rentalRate is the daily rental rate for this item in the order
    const dailyPrice = product.rentalRate || 0;
    
    if (!dailyPrice || dailyPrice <= 0) {
      console.warn('⚠️ Missing rentalRate for product:', {
        productId: product._id,
        productName: product.product?.title || product.product?.name || 'Unknown',
        rentalRate: product.rentalRate
      });
      return 0;
    }
    
    const fee = Math.ceil(dailyPrice * extensionDays);
    
    console.log('💰 Fee calculation:', {
      productId: product._id,
      productName: product.product?.title || product.product?.name || 'Unknown',
      rentalRate: dailyPrice,
      extensionDays,
      fee
    });
    return fee;
  };

  // Get all valid selections
  const validSelections = Object.entries(selectedProducts)
    .filter(([_, data]) => data.selected && data.newEndDate)
    .map(([productId, data]) => {
      const product = products.find(p => p._id === productId);
      const extensionDays = getExtensionDays(productId, data.newEndDate);
      const extensionFee = getExtensionFee(product, extensionDays);
      // Use enriched data first, then product.product as fallback
      const productDetail = enrichedProducts[productId] || product?.product;
      
      return {
        productId,
        product,
        productDetail,
        newEndDate: data.newEndDate,
        extensionDays,
        extensionFee,
        dailyPrice: product.rentalRate || 0
      };
    });

  // Calculate total fee
  const totalFee = validSelections.reduce((sum, item) => sum + item.extensionFee, 0);
  const selectedCount = Object.values(selectedProducts).filter(p => p.selected).length;

  // Handle submit
  const handleSubmit = async () => {
    if (validSelections.length === 0) {
      toast.error('Vui lòng chọn sản phẩm và ngày gia hạn');
      return;
    }

    try {
      setLoading(true);
      
      // Send each product with its own extension details
      const selectedProductsPayload = validSelections.map(item => ({
        productId: item.productId,
        newEndDate: item.newEndDate,
        extensionDays: item.extensionDays,
        extensionFee: item.extensionFee,
        dailyRentalPrice: item.dailyPrice
      }));

      console.log('📤 Sending extension request:', {
        subOrderId: subOrder._id,
        productCount: selectedProductsPayload.length,
        products: selectedProductsPayload.map(p => ({
          productId: p.productId,
          extensionDays: p.extensionDays,
          extensionFee: p.extensionFee,
          dailyRentalPrice: p.dailyRentalPrice
        })),
        totalFee: selectedProductsPayload.reduce((sum, p) => sum + p.extensionFee, 0)
      });

      const response = await api.post('/extensions/request', {
        subOrderId: subOrder._id,
        selectedProducts: selectedProductsPayload
      });

      console.log('✅ Extension request response:', response);
      toast.success('Gửi yêu cầu gia hạn thành công');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error sending extension request:', error);
      toast.error(error.response?.data?.message || 'Lỗi gửi yêu cầu gia hạn');
    } finally {
      setLoading(false);
    }
  };

  if (!subOrder || !products || products.length === 0) {
    return (
      <Portal>
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Gia hạn thời gian thuê</h2>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 text-center text-gray-500">
                  <p>Không tìm thấy đơn hàng hoặc sản phẩm</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    );
  }

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gia hạn thời gian thuê</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Danh sách các sản phẩm có trong suborder
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {!showSummary ? (
                  <>
                    {/* Select All */}
                    <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="select-all"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                      />
                      <label htmlFor="select-all" className="ml-3 cursor-pointer flex-1">
                        <p className="font-medium text-gray-900">Chọn tất cả</p>
                        <p className="text-xs text-gray-600">Chọn tất cả {products.length} sản phẩm</p>
                      </label>
                    </div>

                    {/* Products List */}
                    <div className="space-y-3">
                      {products && products.length > 0 ? (
                        products.map((product) => {
                          const isValid = isValidProduct(product);
                          const isSelected = selectedProducts[product._id]?.selected;
                          const newEndDate = selectedProducts[product._id]?.newEndDate;
                          const extensionDays = getExtensionDays(product._id, newEndDate);
                          const extensionFee = getExtensionFee(product, extensionDays);
                          const dailyPrice = product.rentalRate || 0;
                          const currentEndDate = new Date(product.rentalPeriod?.endDate);
                          
                          // Product detail - use enriched first, then direct from product.product
                          const enrichedData = enrichedProducts[product._id];
                          const productDetail = enrichedData || product.product;
                          
                          console.log('🔍 Rendering product:', { product, productDetail, enrichedData });
                          
                          const productName = getProductName(productDetail);
                          const productImage = getProductImage(productDetail);
                          const productSku = productDetail?.sku || productDetail?.code;
                          const productId = productDetail?._id || 'N/A';

                          return (
                            <div
                              key={product._id}
                              className={`border rounded-lg p-4 transition ${
                                isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-white'
                              } ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {/* Product Header with Image */}
                              <div className="flex items-start space-x-4 mb-3">
                                {/* Checkbox */}
                                <input
                                  type="checkbox"
                                  id={`product-${product._id}`}
                                  checked={isSelected || false}
                                  onChange={(e) => handleProductSelect(product._id, e.target.checked)}
                                  disabled={!isValid}
                                  className="w-5 h-5 text-green-600 rounded cursor-pointer mt-2 flex-shrink-0"
                                />
                                
                                {/* Product Image */}
                                {productImage ? (
                                  <img 
                                    src={productImage} 
                                    alt={productName}
                                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', productImage);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 border border-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No Image</span>
                                  </div>
                                )}

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 break-words">{productName}</p>
                                  <div className="text-xs text-gray-600 space-y-1 mt-2">
                                    {productId && productId !== 'N/A' && (
                                      <p>Mã sản phẩm: <span className="font-semibold text-gray-900">{productId}</span></p>
                                    )}
                                    {productSku && (
                                      <p>SKU: <span className="font-semibold text-gray-900">{productSku}</span></p>
                                    )}
                                    <p>Giá thuê: <span className="font-bold text-green-600">{dailyPrice.toLocaleString('vi-VN')}đ/ngày</span></p>
                                    <p>Ngày kết thúc: <span className="font-medium">{currentEndDate.toLocaleDateString('vi-VN')}</span></p>
                                  </div>
                                </div>
                              </div>

                              {/* Date Picker Section */}
                              {isSelected && (
                                <div className="ml-8 space-y-3 border-t border-gray-200 pt-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      <Calendar className="w-4 h-4 inline mr-2" />
                                      Chọn ngày kết thúc mới muốn gia hạn
                                    </label>
                                    <input
                                      type="date"
                                      value={newEndDate || ''}
                                      onChange={(e) => handleDateChange(product._id, e.target.value)}
                                      min={minDateStr}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {newEndDate && extensionDays > 0 && (
                                      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Số ngày gia hạn:</span>
                                          <span className="font-semibold text-gray-900">{extensionDays} ngày</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Giá/ngày:</span>
                                          <span className="font-semibold text-gray-900">{dailyPrice.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-blue-200">
                                          <span className="text-gray-600">Phí gia hạn:</span>
                                          <span className="font-bold text-green-600">{extensionFee.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Không có sản phẩm nào trong đơn hàng này</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Summary View
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">Xác nhận yêu cầu gia hạn</h3>

                    {/* Summary Products */}
                    <div className="space-y-3">
                      {validSelections.map((item) => {
                        const currentEndDate = new Date(item.product.rentalPeriod?.endDate);
                        const newEndDate = new Date(item.newEndDate);
                        const productDetail = item.productDetail;
                        const productName = getProductName(productDetail);
                        const productImage = getProductImage(productDetail);

                        return (
                          <div key={item.productId} className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                            {/* Product Header with Image */}
                            <div className="flex items-start space-x-4 mb-3">
                              {/* Product Image */}
                              {productImage ? (
                                <img 
                                  src={productImage} 
                                  alt={productName}
                                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-orange-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-20 bg-orange-100 rounded-lg flex-shrink-0 border border-orange-200 flex items-center justify-center">
                                  <span className="text-orange-400 text-xs">No Image</span>
                                </div>
                              )}
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-gray-900 break-words">{productName}</h4>
                                <div className="text-sm text-gray-600 space-y-1 mt-2">
                                  {productDetail?.sku && <p>SKU: <span className="font-medium text-gray-900">{productDetail.sku}</span></p>}
                                  {productDetail?.code && !productDetail?.sku && <p>Mã: <span className="font-medium text-gray-900">{productDetail.code}</span></p>}
                                  <p>Trạng thái: <span className="font-medium text-blue-600">{item.product.productStatus}</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Date and Fee Info Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Ngày kết thúc hiện tại</p>
                                <p className="font-bold text-gray-900">{currentEndDate.toLocaleDateString('vi-VN')}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Ngày kết thúc mới</p>
                                <p className="font-bold text-blue-600">{newEndDate.toLocaleDateString('vi-VN')}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Giá thuê</p>
                                <p className="font-bold text-gray-900">{item.dailyPrice.toLocaleString('vi-VN')}đ/ngày</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Số ngày gia hạn</p>
                                <p className="font-bold text-gray-900">{item.extensionDays} ngày</p>
                              </div>
                              <div className="col-span-2 pt-2 border-t border-orange-200">
                                <p className="text-gray-600">Phí gia hạn</p>
                                <p className="font-bold text-green-600 text-lg">{item.extensionFee.toLocaleString('vi-VN')}đ</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Fee */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Tổng phí gia hạn</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {totalFee.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Phí sẽ được trừ từ ví của bạn khi chủ hàng chấp nhận
                      </p>
                    </div>

                    {/* Info Alert */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Quy trình gia hạn:</p>
                        <ul className="space-y-1 text-xs">
                          <li>✓ Yêu cầu được gửi đến chủ hàng</li>
                          <li>✓ Chủ hàng xác nhận hoặc từ chối</li>
                          <li>✓ Nếu xác nhận, phí sẽ được trừ ngay</li>
                          <li>✓ Ngày kết thúc sẽ được cập nhật</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (showSummary) {
                      setShowSummary(false);
                    } else {
                      onClose();
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
                >
                  {showSummary ? 'Quay lại' : 'Hủy'}
                </button>

                {!showSummary ? (
                  <button
                    type="button"
                    onClick={() => setShowSummary(true)}
                    disabled={validSelections.length === 0}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center space-x-2"
                  >
                    <span>Xem tổng tiền</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Gửi yêu cầu gia hạn</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default ExtendRentalModal;
