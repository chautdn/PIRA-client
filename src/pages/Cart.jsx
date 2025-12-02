  import React from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { motion } from "framer-motion";
  import { useCart } from "../context/CartContext";
  import { ROUTES } from "../utils/constants";
  import rentalOrderService from "../services/rentalOrder";
  import { useAuth } from "../hooks/useAuth";
  import KycWarningModal from "../components/common/KycWarningModal";
  import { checkKYCRequirements } from "../utils/kycVerification";

  const Cart = () => {
    const { cart, cartTotal, updateQuantityByItemId, updateRental, updateRentalByItemId, removeFromCartById, clearCart, cartData } = useCart();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [editingDates, setEditingDates] = React.useState({});
    const [selectedItems, setSelectedItems] = React.useState(new Set());
    const [selectAll, setSelectAll] = React.useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = React.useState(false);
    const [availabilityWarnings, setAvailabilityWarnings] = React.useState([]);
    const [showKycWarningModal, setShowKycWarningModal] = React.useState(false);
    const [kycMissingRequirements, setKycMissingRequirements] = React.useState([]);

    const formatPrice = (price) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    };

    // Tính tổng tiền cho các sản phẩm đã chọn
    const getSelectedItemsTotal = () => {
      if (selectedItems.size === 0) return cartTotal;
      return cart
        .filter(item => selectedItems.has(item._id))
        .reduce((total, item) => {
          const price = item.product.pricing?.dailyRate || 0;
          const days = item.rental?.duration || 1;
          return total + price * days * item.quantity;
        }, 0);
    };

    // Không có phí nền tảng khi thuê sản phẩm
    const selectedItemsTotal = getSelectedItemsTotal();
    const finalTotal = selectedItemsTotal;

    const handleClearCart = () => {
      if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
        clearCart();
      }
    };

    const handleEditDates = (itemId) => {
      const item = cart.find(item => item._id === itemId);
      if (item?.rental) {
        const startDate = item.rental.startDate ? new Date(item.rental.startDate).toISOString().split('T')[0] : '';
        const endDate = item.rental.endDate ? new Date(item.rental.endDate).toISOString().split('T')[0] : '';
        
        setEditingDates({
          ...editingDates,
          [itemId]: {
            startDate,
            endDate,
            isEditing: true
          }
        });
      }
    };

    const handleCancelEdit = (itemId) => {
      setEditingDates({
        ...editingDates,
        [itemId]: {
          ...editingDates[itemId],
          isEditing: false
        }
      });
    };

    const handleSaveDates = async (itemId) => {
      const dates = editingDates[itemId];
      if (!dates || !dates.startDate || !dates.endDate) return;

      const startDate = new Date(dates.startDate);
      const endDate = new Date(dates.endDate);
      
      if (startDate >= endDate) {
        alert('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }

      try {
        await updateRental(itemId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        });
        
        setEditingDates({
          ...editingDates,
          [itemId]: {
            ...dates,
            isEditing: false
          }
        });
      } catch (error) {
        console.error('Lỗi cập nhật thời gian thuê:', error);
        alert('Không thể cập nhật thời gian thuê. Vui lòng thử lại.');
      }
    };

  // Update rental dates for an item with validation
  const handleRentalUpdate = async (item, field, value) => {
    if (!value) return;
    
    const rental = { ...item.rental };
    const minStartDate = getMinStartDate();
    
    if (field === 'startDate') {
      // Validate start date is not in the past
      if (value < minStartDate) {
        const now = new Date();
        const message = now.getHours() >= 12 
          ? 'Sau 12h trưa, bạn chỉ có thể chọn từ ngày mai trở đi'
          : 'Ngày bắt đầu phải từ hôm nay trở đi';
        alert(message);
        return;
      }
      
      rental.startDate = new Date(value).toISOString();
      // Auto adjust end date if it's before start date (like ProductDetail)
      if (rental.endDate && new Date(rental.endDate) <= new Date(value)) {
        const nextDay = new Date(value);
        nextDay.setDate(nextDay.getDate() + 1);
        rental.endDate = nextDay.toISOString();
      }
    } else if (field === 'endDate') {
      rental.endDate = new Date(value).toISOString();
      // Validate end date is after start date
      if (rental.startDate) {
        const startDate = new Date(rental.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          alert('Ngày kết thúc phải sau ngày bắt đầu');
          return;
        }
      }
    }

    // Tính lại duration
    if (rental.startDate && rental.endDate) {
      const start = new Date(rental.startDate);
      const end = new Date(rental.endDate);
      rental.duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    }

    // Update single item
    try {
      const result = await updateRentalByItemId(item._id, rental);
      
      if (result && !result.success) {
        alert(result.error || 'Không thể cập nhật thời gian thuê');
        return;
      }
      
    } catch (error) {
      console.error('Lỗi cập nhật thời gian thuê:', error);
      alert('Không thể cập nhật thời gian thuê. Vui lòng thử lại.');
    }
  };  // Get minimum start date based on current time
  const getMinStartDate = () => {
    const now = new Date();
    const minDate = new Date();
    if (now.getHours() >= 12) {
      minDate.setDate(minDate.getDate() + 1);
    }
    return minDate.toISOString().slice(0, 10);
  };

  // Group cart items by owner
  const groupedByOwner = React.useMemo(() => {
    if (!cart?.length) return [];

    const ownerMap = new Map();
    
    cart.forEach(item => {
      const ownerId = item.product?.owner?._id || 'unknown';
      const ownerName = item.product?.owner?.profile?.firstName || 'Chưa xác định';
      
      if (!ownerMap.has(ownerId)) {
        ownerMap.set(ownerId, {
          ownerId,
          ownerName,
          items: []
        });
      }
      
      ownerMap.get(ownerId).items.push(item);
    });

    return Array.from(ownerMap.values());
  }, [cart]);

    // Handle item selection
    const handleSelectItem = (item) => {
      const newSelected = new Set(selectedItems);
      
      if (selectedItems.has(item._id)) {
        newSelected.delete(item._id);
      } else {
        newSelected.add(item._id);
      }
      
      setSelectedItems(newSelected);
    };

    // Handle owner selection (select all items from an owner)
    const handleSelectOwner = (ownerId) => {
      const ownerGroup = groupedByOwner.find(group => group.ownerId === ownerId);
      if (!ownerGroup) return;

      const newSelected = new Set(selectedItems);
      const allOwnerItemIds = ownerGroup.items.map(item => item._id);
      
      // Check if all owner's items are selected
      const allSelected = allOwnerItemIds.every(id => selectedItems.has(id));
      
      if (allSelected) {
        // Deselect all owner's items
        allOwnerItemIds.forEach(id => newSelected.delete(id));
      } else {
        // Select all owner's items
        allOwnerItemIds.forEach(id => newSelected.add(id));
      }
      
      setSelectedItems(newSelected);
    };

    // Check if all items from an owner are selected
    const isOwnerSelected = (ownerId) => {
      const ownerGroup = groupedByOwner.find(group => group.ownerId === ownerId);
      if (!ownerGroup) return false;
      
      const allOwnerItemIds = ownerGroup.items.map(item => item._id);
      return allOwnerItemIds.length > 0 && allOwnerItemIds.every(id => selectedItems.has(id));
    };

    // Check if item is selected
    const isItemSelected = (item) => {
      return selectedItems.has(item._id);
    };

    // Handle select all toggle
    React.useEffect(() => {
      if (selectAll) {
        const allItemIds = cart.map(item => item._id);
        setSelectedItems(new Set(allItemIds));
      } else {
        setSelectedItems(new Set());
      }
    }, [selectAll, cart]);

    // Check availability for cart items (works for both selected and all items)
    const checkCartAvailability = async (itemsToCheck) => {
      console.log('🔍 Checking availability for cart items before checkout...');
      const unavailableItems = [];
      
      for (const item of itemsToCheck) {
        try {
          // Safety check for rental dates
          if (!item.rental?.startDate || !item.rental?.endDate) {
            console.error(`Invalid rental dates for ${item.product?.title}:`, item.rental);
            unavailableItems.push({
              productName: item.product?.title || 'Unknown Product',
              error: true,
              errorMessage: 'Thiếu thông tin ngày thuê'
            });
            continue;
          }

          const response = await rentalOrderService.getProductAvailabilityCalendar(
            item.product._id,
            item.rental.startDate.split('T')[0],
            item.rental.endDate.split('T')[0]
          );
          
          if (response.status === 'success' && response.data?.metadata?.calendar) {
            const calendar = response.data.metadata.calendar;
            
            // Check each day in the rental period for availability
            const startDate = new Date(item.rental.startDate);
            const endDate = new Date(item.rental.endDate);
            const unavailableDates = [];
            let minAvailable = Infinity;
            
            for (let currentDate = new Date(startDate); currentDate < endDate; currentDate.setDate(currentDate.getDate() + 1)) {
              const dateString = currentDate.toISOString().split('T')[0];
              const dayInfo = calendar.find(day => day.date === dateString);
              
              if (dayInfo) {
                minAvailable = Math.min(minAvailable, dayInfo.availableQuantity);
                
                // Track specific dates that don't have enough quantity
                if (dayInfo.availableQuantity < item.quantity) {
                  unavailableDates.push({
                    date: new Date(dateString).toLocaleDateString('vi-VN'),
                    available: dayInfo.availableQuantity,
                    requested: item.quantity
                  });
                }
              } else {
                // Date not found in calendar = unavailable
                unavailableDates.push({
                  date: new Date(dateString).toLocaleDateString('vi-VN'),
                  available: 0,
                  requested: item.quantity
                });
              }
            }
            
            const currentAvailable = minAvailable === Infinity ? 0 : minAvailable;
            
            if (currentAvailable < item.quantity || unavailableDates.length > 0) {
              // Tìm ngày có sẵn để gợi ý (trong vòng 30 ngày tiếp theo)
              const today = new Date();
              const suggestedDates = [];
              
              for (let i = 0; i < 30 && suggestedDates.length < 5; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + i);
                const dateString = checkDate.toISOString().split('T')[0];
                
                const dayInfo = calendar.find(day => day.date === dateString);
                if (dayInfo && dayInfo.availableQuantity >= item.quantity) {
                  suggestedDates.push({
                    date: checkDate.toLocaleDateString('vi-VN'),
                    available: dayInfo.availableQuantity,
                    rawDate: dateString
                  });
                }
              }

              unavailableItems.push({
                productName: item.product.title,
                requested: item.quantity,
                available: currentAvailable,
                dateRange: `${new Date(item.rental.startDate).toLocaleDateString('vi-VN')} - ${new Date(item.rental.endDate).toLocaleDateString('vi-VN')}`,
                unavailableDates: unavailableDates,
                suggestedDates: suggestedDates,
                itemId: item._id // Để có thể update cart item
              });
            }
          }
        } catch (error) {
          console.error(`Error checking availability for ${item.product.title}:`, error);
          unavailableItems.push({
            productName: item.product.title,
            error: true
          });
        }
      }
      
      return unavailableItems;
    };

    // Handle rent selected items
    const handleRentSelected = async () => {
      // Check KYC requirements first
      if (user) {
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

        const kycCheck = checkKYCRequirements(currentUser);
        if (!kycCheck.isComplete) {
          setKycMissingRequirements(kycCheck.missing);
          setShowKycWarningModal(true);
          return;
        }
      }

      const selectedCartItems = cart.filter(item => selectedItems.has(item._id));
      if (selectedCartItems.length === 0) return;
      
      const unavailableItems = await checkCartAvailability(selectedCartItems);
      
      if (unavailableItems.length > 0) {
        showAvailabilityWarning(unavailableItems);
        return;
      }
      
      console.log('✅ Selected cart items availability check passed');
      navigate('/rental-orders/create', { 
        state: { 
          selectedItems: selectedCartItems,
          fromCart: true 
        } 
      });
    };

    // Handle rent all items
    const handleRentAll = async () => {
      // Check KYC requirements first
      if (user) {
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

        const kycCheck = checkKYCRequirements(currentUser);
        if (!kycCheck.isComplete) {
          setKycMissingRequirements(kycCheck.missing);
          setShowKycWarningModal(true);
          return;
        }
      }

      if (cart.length === 0) return;
      
      const unavailableItems = await checkCartAvailability(cart);
      
      if (unavailableItems.length > 0) {
        showAvailabilityWarning(unavailableItems);
        return;
      }
      
      console.log('✅ All cart items availability check passed');
      navigate('/rental-orders/create', { 
        state: { 
          selectedItems: cart,
          fromCart: true 
        } 
      });
    };

    // Show detailed availability warning in modal
    const showAvailabilityWarning = (unavailableItems) => {
      setAvailabilityWarnings(unavailableItems);
      setShowAvailabilityModal(true);
    };

    if (!cart?.length) {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-md p-12 max-w-md mx-auto"
              >
                <div className="text-6xl mb-6">🛒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Giỏ hàng trống
                </h2>
                <p className="text-gray-600 mb-8">
                  Hãy thêm một số sản phẩm vào giỏ hàng để bắt đầu mua sắm!
                </p>
                <Link
                  to={ROUTES.PRODUCTS}
                  className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Khám Phá Sản Phẩm
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-gray-900 flex items-center gap-3"
            >
              <span>🛒</span> Giỏ Hàng Của Bạn
            </motion.h1>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectAll(!selectAll)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              
              {selectedItems.size > 0 && (
                <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  Đã chọn: {cart.filter(item => selectedItems.has(item._id)).reduce((total, item) => total + item.quantity, 0)} sản phẩm
                </div>
              )}
            </div>
          </div>

          {/* Expired Items Warning */}
          {cartData?.expiredItems?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Có sản phẩm với ngày thuê đã quá hạn
                  </h3>
                  <div className="space-y-2">
                    {cartData.expiredItems.map((expiredItem, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        <span className="font-medium">{expiredItem.productTitle}</span>
                        <span className="text-yellow-600 block">{expiredItem.message}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    Vui lòng cập nhật lại ngày thuê cho các sản phẩm này.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              {groupedByOwner.map((group) => (
                <div key={group.ownerId} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  {/* Owner Header */}
                  <div className="bg-gray-100 px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {group.ownerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.ownerName}</h3>
                        <p className="text-sm text-gray-600">{group.items.length} sản phẩm</p>
                      </div>
                      <div className="ml-auto">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isOwnerSelected(group.ownerId)}
                            onChange={() => handleSelectOwner(group.ownerId)}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <span className="text-sm">Chọn tất cả</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Owner's Items */}
                  <div className="p-6 space-y-4">
                    {group.items.map((item, index) => {
                      const { product, rental, quantity } = item;
                      const dailyRate = product.pricing?.dailyRate || 0;
                      const days = rental?.duration || 1;
                      const itemTotal = dailyRate * days * quantity;
                      const isSelected = isItemSelected(item);
                      
                      // Check if this item has expired dates
                      const minStartDate = getMinStartDate();
                      const isExpired = rental?.startDate && new Date(rental.startDate).toISOString().slice(0, 10) < minStartDate;

                      return (
                        <motion.div
                          key={item._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className={`flex gap-6 p-4 rounded-xl hover:bg-gray-50 transition-colors border-2 ${
                            isSelected ? 'border-blue-500 bg-blue-50' : isExpired ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="flex items-start pt-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectItem(item)}
                              className="w-5 h-5 text-blue-600 rounded"
                              disabled={isExpired}
                            />
                          </div>

                          {/* Image */}
                          <Link
                            to={ROUTES.PRODUCT_DETAIL.replace(":id", product._id)}
                            className="flex-shrink-0"
                          >
                            <img
                              src={product.images?.[0]?.url || "/images/placeholder.jpg"}
                              alt={product.title}
                              className="w-32 h-32 object-cover rounded-xl"
                            />
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <Link
                                  to={ROUTES.PRODUCT_DETAIL.replace(":id", product._id)}
                                  className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors block mb-1"
                                >
                                  {product.title}
                                </Link>
                                <p className="text-gray-600 mb-2">{product.description}</p>
                                
                                {isExpired && (
                                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mb-2">
                                    <span className="font-medium">⚠️ Ngày thuê đã quá hạn - Vui lòng cập nhật</span>
                                  </div>
                                )}
                              
                              </div>
                            </div>

                            <div className="space-y-3">
                              {/* Rental Dates */}
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  Thời gian thuê:
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      Ngày bắt đầu
                                    </label>
                                    <input
                                      type="date"
                                      value={rental?.startDate ? rental.startDate.slice(0, 10) : ''}
                                      min={getMinStartDate()}
                                      onChange={(e) => handleRentalUpdate(item, 'startDate', e.target.value)}
                                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                        isExpired ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      Ngày kết thúc
                                    </label>
                                    <input
                                      type="date"
                                      value={rental?.endDate ? rental.endDate.slice(0, 10) : ''}
                                      min={rental?.startDate ? new Date(Date.parse(rental.startDate) + 86400000).toISOString().slice(0, 10) : getMinStartDate()}
                                      onChange={(e) => handleRentalUpdate(item, 'endDate', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-blue-600 font-medium">
                                  Tổng thời gian: {days} ngày
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">
                                  Số lượng:
                                </span>
                                
                                <div className="flex items-center bg-gray-100 rounded-lg">
                                  <button
                                    onClick={() => updateQuantityByItemId(item._id, Math.max(1, quantity - 1))}
                                    className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                                    disabled={quantity <= 1}
                                  >
                                    -
                                  </button>
                                  <span className="px-4 py-2 font-medium bg-white">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantityByItemId(item._id, quantity + 1)}
                                    className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                                    disabled={quantity >= (product.availability?.quantity || 0)}
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-xs text-gray-500">
                                  Có sẵn: {product.availability?.quantity || 0} cái
                                </div>

                                <button
                                  onClick={() => removeFromCartById(item._id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all ml-auto"
                                  title="Xóa sản phẩm"
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
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              isExpired ? 'text-yellow-600' : 'text-primary-600'
                            }`}>
                              {formatPrice(itemTotal)}
                            </div>
                            {isExpired && (
                              <div className="text-xs text-yellow-600 mt-1">
                                Vui lòng cập nhật ngày
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-semibold">{formatPrice(selectedItemsTotal)}</span>
                  </div>
                
                  <div className="flex justify-between text-gray-600">
                    <span>Giảm giá</span>
                    <span className="text-green-600 font-semibold">-0₫</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Tổng cộng
                    </span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedItems.size > 0) {
                      handleRentSelected();
                    } else {
                      handleRentAll();
                    }
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl mb-4"
                >
                  📋 {selectedItems.size > 0 ? `Thuê ${cart.filter(item => selectedItems.has(item._id)).reduce((total, item) => total + item.quantity, 0)} sản phẩm đã chọn` : 'Tạo Đơn Thuê (Tất cả)'}
                </button>

                <Link
                  to={ROUTES.PRODUCTS}
                  className="block w-full text-center border-2 border-green-500 hover:border-green-600 text-green-600 hover:text-green-700 hover:bg-green-50 py-3 rounded-xl font-semibold transition-all"
                >
                  ← Tiếp Tục Mua Sắm
                </Link>

                {/* Security Info */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <span>Thanh toán bảo mật 100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Hỗ trợ 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🚚</span>
                    <span>Miễn phí vận chuyển</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

    
      {showAvailabilityModal && (
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
                    <h3 className="text-lg font-bold text-red-800">Cảnh báo khả năng sản phẩm</h3>
                    <p className="text-sm text-red-600">Một số sản phẩm trong giỏ hàng không còn đủ số lượng</p>
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
              <div className="space-y-4">
                {availabilityWarnings.map((item, index) => (
                  <div key={index} className="border border-red-200 rounded-xl p-4 bg-red-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-red-600 text-sm font-bold">!</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-2">{item.productName}</h4>
                        
                        {item.error ? (
                          <p className="text-red-600 text-sm">
                            {item.errorMessage || 'Không thể kiểm tra tình trạng'}
                          </p>
                        ) : (
                          <>
                            <div className="text-sm text-red-700 mb-2">
                              <span className="font-medium">Thời gian thuê:</span> {item.dateRange}
                            </div>
                            <div className="text-sm text-red-700 mb-3">
                              <span className="font-medium">Yêu cầu:</span> {item.requested} sản phẩm • 
                              <span className="font-medium"> Tối đa có thể thuê:</span> {item.available} sản phẩm
                            </div>
                            
                            {item.unavailableDates && item.unavailableDates.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-red-200">
                                <h5 className="font-medium text-red-800 mb-2">📅 Ngày không đủ số lượng:</h5>
                                <div className="space-y-1">
                                  {item.unavailableDates.map((dateInfo, dateIndex) => (
                                    <div key={dateIndex} className="flex justify-between items-center text-sm">
                                      <span className="text-red-700">{dateInfo.date}</span>
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                                        {dateInfo.available}/{dateInfo.requested}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Suggested Available Dates */}
                            {item.suggestedDates && item.suggestedDates.length > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                                <h6 className="font-medium text-green-800 mb-2 flex items-center text-sm">
                                  <span className="mr-1">💡</span>
                                  Gợi ý ngày còn {item.requested} sản phẩm:
                                </h6>
                                <div className="grid grid-cols-2 gap-1">
                                  {item.suggestedDates.slice(0, 4).map((dateInfo, index) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        // Update cart item with suggested date
                                        const newStartDate = new Date(dateInfo.rawDate).toISOString();
                                        const newEndDate = new Date(dateInfo.rawDate);
                                        newEndDate.setDate(newEndDate.getDate() + 1);
                                        
                                        updateRentalByItemId(item.itemId, {
                                          startDate: newStartDate,
                                          endDate: newEndDate.toISOString()
                                        });
                                        setShowAvailabilityModal(false);
                                      }}
                                      className="flex justify-between items-center text-xs bg-white border border-green-200 hover:border-green-400 px-2 py-1.5 rounded transition-colors group"
                                    >
                                      <span className="text-green-700 group-hover:text-green-800">{dateInfo.date}</span>
                                      <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium text-xs group-hover:bg-green-200">
                                        {dateInfo.available}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-green-600 mt-1 text-center">
                                  👆 Click để cập nhật ngày thuê
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    // User có thể edit cart items từ đây
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Chỉnh sửa giỏ hàng
                </button>
              </div>
              <div className="mt-3 text-center text-sm text-gray-600">
                💡 Vui lòng cập nhật số lượng hoặc chọn thời gian khác để tiếp tục
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
        </div>
    );
  };

  export default Cart;