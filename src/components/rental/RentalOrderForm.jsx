import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useRentalOrder } from '../../context/RentalOrderContext';
import { useAuth } from "../../hooks/useAuth";
import { Calendar, MapPin, Truck, CreditCard, Clock, Package } from 'lucide-react';
import MapSelector from '../common/MapSelector';
import PaymentMethodSelector from '../common/PaymentMethodSelector';
import { toast } from '../common/Toast';
import paymentService from '../../services/payment';

const RentalOrderForm = () => {
  try {
    const { user } = useAuth();
    const { cart: cartItems, clearCart } = useCart();
    const rentalOrderContext = useRentalOrder();
    const { createDraftOrder, createPaidOrder, calculateShipping, isCreatingDraft, isCalculatingShipping, shippingCalculation } = rentalOrderContext;
    const navigate = useNavigate();

    // Debug effect - only runs once
    useEffect(() => {
      console.log('RentalOrderForm: Component mounted');
      console.log('RentalOrderForm: User loaded:', user ? 'Yes' : 'No');
      console.log('RentalOrderForm: Cart loaded:', cartItems ? cartItems.length : 'No cart');
      console.log('RentalOrderForm: Cart items data:', cartItems);
      console.log('RentalOrderForm: RentalOrder context loaded:', !!rentalOrderContext);
    }, []);

  const [orderData, setOrderData] = useState(() => ({
    rentalPeriod: {
      startDate: '',
      endDate: ''
    },
    deliveryAddress: {
      streetAddress: '',
      ward: '',
      district: '',
      city: '',
      province: 'Hồ Chí Minh',
      contactPhone: (user && user.profile && user.profile.phone) ? user.profile.phone : '',
      contactName: (user && user.profile && user.profile.fullName) ? user.profile.fullName : ''
    },
    deliveryMethod: 'PICKUP'
  }));

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [totalShipping, setTotalShipping] = useState(0);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Update contact info when user changes
  useEffect(() => {
    if (user && user.profile) {
      setOrderData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          contactPhone: user.profile.phone || prev.deliveryAddress.contactPhone,
          contactName: user.profile.fullName || prev.deliveryAddress.contactName
        }
      }));
    }
  }, [user]);

  // Group products by owner and set rental dates from cart
  useEffect(() => {
    if (!cartItems || !Array.isArray(cartItems)) return;
    
    const grouped = {};
    let earliestStart = null;
    let latestEnd = null;
    
    cartItems.forEach(item => {
      // Validate item structure
      if (!item?.product?.owner?._id) {
        console.warn('Cart item missing owner data:', item);
        return;
      }
      
      const ownerId = item.product.owner._id;
      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          owner: item.product.owner,
          products: [],
          shippingFee: 0
        };
      }
      grouped[ownerId].products.push(item);
      
      // Track rental period from cart items
      if (item.rental?.startDate && item.rental?.endDate) {
        const itemStart = new Date(item.rental.startDate);
        const itemEnd = new Date(item.rental.endDate);
        
        if (!earliestStart || itemStart < earliestStart) {
          earliestStart = itemStart;
        }
        if (!latestEnd || itemEnd > latestEnd) {
          latestEnd = itemEnd;
        }
      }
    });
    
    setGroupedProducts(grouped);
    console.log('RentalOrderForm: Grouped products:', grouped);
    
    // Set rental dates from cart items
    if (earliestStart && latestEnd) {
      setOrderData(prev => ({
        ...prev,
        rentalPeriod: {
          startDate: earliestStart.toISOString().split('T')[0],
          endDate: latestEnd.toISOString().split('T')[0]
        }
      }));
    }
  }, [cartItems]);

  // Calculate rental duration
  const calculateDuration = () => {
    if (!orderData.rentalPeriod.startDate || !orderData.rentalPeriod.endDate) return 0;
    const start = new Date(orderData.rentalPeriod.startDate);
    const end = new Date(orderData.rentalPeriod.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate total amounts using dates from cart items
  const calculateTotals = () => {
    let totalRental = 0;
    let totalDeposit = 0;
    let totalDays = 0;

    if (groupedProducts && typeof groupedProducts === 'object') {
      Object.values(groupedProducts).forEach(group => {
        group.products.forEach(item => {
          // Calculate duration for each item from its cart rental dates
          let itemDuration = 1; // default
          if (item.rental?.startDate && item.rental?.endDate) {
            const start = new Date(item.rental.startDate);
            const end = new Date(item.rental.endDate);
            const diffTime = Math.abs(end - start);
            itemDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
          }
          
          const itemRental = (item.product.pricing?.dailyRate || item.product.price || 0) * item.quantity * itemDuration;
          const itemDeposit = (item.product.pricing?.deposit?.amount || item.product.deposit || 0) * item.quantity;
          
          totalRental += itemRental;
          totalDeposit += itemDeposit;
          totalDays = Math.max(totalDays, itemDuration); // Use max duration for display
        });
      });
    }

    return {
      duration: totalDays,
      totalRental,
      totalDeposit,
      totalShipping,
      grandTotal: totalRental + totalDeposit + totalShipping
    };
  };

  // Calculate shipping using delivery batch system
  const handleCalculateShipping = async () => {
    if (orderData.deliveryMethod === 'PICKUP') {
      setTotalShipping(0);
      return;
    }

    // Validate delivery address first
    const hasMapLocation = orderData.deliveryAddress.latitude && orderData.deliveryAddress.longitude;
    const hasManualAddress = !!orderData.deliveryAddress.streetAddress;
    
    if (!orderData.deliveryAddress.contactPhone) {
      alert('Vui lòng nhập số điện thoại liên hệ trước khi tính phí ship');
      return;
    }
    
    if (!hasMapLocation && !hasManualAddress) {
      alert('Vui lòng chọn địa chỉ trên bản đồ hoặc nhập địa chỉ thủ công trước khi tính phí ship');
      return;
    }

    let total = 0;
    const updatedGroups = { ...groupedProducts };

    for (const [ownerId, group] of Object.entries(groupedProducts)) {
      try {
        const ownerLocation = {
          latitude: group.owner.address?.coordinates?.latitude || null,
          longitude: group.owner.address?.coordinates?.longitude || null
        };

        const userLocation = {
          latitude: orderData.deliveryAddress.latitude || null,
          longitude: orderData.deliveryAddress.longitude || null
        };

        // Kiểm tra tọa độ - nếu không có thì dùng phí mặc định
        const hasOwnerCoords = ownerLocation.latitude && ownerLocation.longitude;
        const hasUserCoords = userLocation.latitude && userLocation.longitude;
        
        if (!hasOwnerCoords) {
          console.warn(`⚠️ Chủ cho thuê ${group.owner.profile?.firstName || group.owner.profile?.fullName || 'này'} chưa cập nhật tọa độ địa chỉ`);
          toast(`⚠️ Chủ cho thuê ${group.owner.profile?.firstName || group.owner.profile?.fullName || 'này'} chưa cập nhật tọa độ. Sử dụng phí ship mặc định 50.000đ`, { duration: 4000 });
          
          // Sử dụng phí ship mặc định khi không có tọa độ
          const defaultShippingFee = 50000;
          
          setGroupedProducts(prev => ({
            ...prev,
            [ownerId]: {
              ...prev[ownerId],
              shippingFee: defaultShippingFee,
              deliveryInfo: {
                deliveryCount: 1,
                distance: 'Chưa xác định',
                deliveryBatches: [{
                  deliveryDate: new Date().toISOString().split('T')[0],
                  deliveryBatch: 1,
                  batchSize: group.products.length,
                  batchQuantity: group.products.reduce((sum, p) => sum + p.quantity, 0),
                  deliveryFee: defaultShippingFee
                }],
                summary: {
                  totalProducts: group.products.length,
                  totalQuantity: group.products.reduce((sum, p) => sum + p.quantity, 0),
                  totalDeliveries: 1,
                  averageFeePerDelivery: defaultShippingFee,
                  note: 'Phí ship mặc định - chủ chưa cập nhật tọa độ'
                }
              }
            }
          }));
          
          continue; // Bỏ qua owner này và tiếp tục với owner khác
        }
        
        if (!hasUserCoords) {
          throw new Error('Vui lòng chọn địa chỉ giao hàng trên bản đồ để có tọa độ chính xác');
        }

        // Prepare products with rental periods for delivery batch calculation
        const products = group.products.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          rentalPeriod: {
            startDate: item.rental?.startDate || orderData.rentalPeriod.startDate,
            endDate: item.rental?.endDate || orderData.rentalPeriod.endDate
          }
        }));

        const shippingData = {
          subOrderId: `temp-${ownerId}`, // Temporary ID for calculation
          ownerLocation,
          userLocation,
          products
        };

        console.log(`🚚 Tính phí ship cho chủ ${group.owner.profile?.firstName || group.owner.profile?.fullName}:`);
        console.log('- Products:', products.length, 'items');
        console.log('- Owner location:', ownerLocation);
        console.log('- User location:', userLocation);
        console.log('- Has coordinates: Owner=' + hasOwnerCoords + ', User=' + hasUserCoords);

        // Use the new product shipping calculation API
        const shippingResponse = await rentalOrderContext.calculateProductShipping(shippingData);
        console.log('Delivery batch shipping response:', shippingResponse);
        
        let shippingFee = 20000; // default fallback
        let deliveryInfo = null;
        
        if (shippingResponse?.metadata?.shipping) {
          const shipping = shippingResponse.metadata.shipping;
          shippingFee = shipping.totalShippingFee || shipping.shipping?.totalShippingFee || 20000;
          
          // Store delivery batch information
          deliveryInfo = {
            deliveryCount: shipping.deliveryCount || shipping.shipping?.deliveryCount || 1,
            deliveryBatches: shipping.deliveryBatches || shipping.shipping?.deliveryBatches || [],
            distance: shipping.distance || shipping.shipping?.distance,
            summary: shipping.summary || shipping.shipping?.summary
          };
        }
        
        updatedGroups[ownerId].shippingFee = shippingFee;
        updatedGroups[ownerId].deliveryInfo = deliveryInfo;
        total += shippingFee;
      } catch (error) {
        const ownerName = group.owner?.profile?.fullName || 'Không rõ';
        console.error(`❌ Lỗi tính phí ship cho chủ ${ownerName}:`, error);
        toast.error(`Lỗi tính phí ship cho chủ ${ownerName}: ${error.message}`);
        // Fallback: phí cố định
        updatedGroups[ownerId].shippingFee = 20000;
        updatedGroups[ownerId].deliveryInfo = {
          deliveryCount: 1,
          deliveryBatches: [],
          error: error.message
        };
        total += 20000;
      }
    }

    setGroupedProducts(updatedGroups);
    setTotalShipping(total);
  };

  // Validate form - dates are from cart, only validate delivery info
  const validateForm = () => {
    const newErrors = {};

    // Only validate delivery address if DELIVERY method is selected
    if (orderData.deliveryMethod === 'DELIVERY') {
      // Nếu đã chọn từ map (có latitude/longitude) thì không cần validate địa chỉ chi tiết
      const hasMapLocation = orderData.deliveryAddress.latitude && orderData.deliveryAddress.longitude;
      
      if (!hasMapLocation && !orderData.deliveryAddress.streetAddress) {
        newErrors.streetAddress = 'Vui lòng chọn địa chỉ trên bản đồ hoặc nhập địa chỉ thủ công';
      }

      if (!orderData.deliveryAddress.contactPhone) {
        newErrors.contactPhone = 'Vui lòng nhập số điện thoại';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle address selection from map
  const handleAddressSelect = (locationData) => {
    setOrderData(prev => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        streetAddress: locationData.streetAddress || locationData.fullAddress || '',
        ward: locationData.ward || '',
        district: locationData.district || '',
        city: locationData.city || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }
    }));
    
    // Clear address related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.streetAddress;
      return newErrors;
    });
  };

  // Handle form submission - now shows payment selector first
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Show payment method selector
    setShowPaymentSelector(true);
  };

  // Handle payment method selection and process different payment types
  const handlePaymentMethodSelect = async (paymentMethod) => {
    console.log('🚀 Processing payment with method:', paymentMethod);
    console.log('� Total amount:', totals.grandTotal);

    try {
      let paymentResult = null;

      // Process payment based on selected method
      switch (paymentMethod) {
        case 'WALLET':
          // Deduct from user wallet automatically
          paymentResult = await processWalletPayment(totals.grandTotal);
          break;
          
        case 'BANK_TRANSFER':
        case 'PAYOS':
          // Redirect to PayOS payment gateway
          paymentResult = await processPayOSPayment(paymentMethod, totals.grandTotal);
          break;
          
        case 'COD':
          // Cash on delivery - no immediate payment needed
          paymentResult = { 
            method: 'COD', 
            status: 'PENDING',
            message: 'Thanh toán khi nhận hàng' 
          };
          break;
          
        default:
          throw new Error('Phương thức thanh toán không hợp lệ');
      }

      if (!paymentResult || paymentResult.status === 'FAILED') {
        throw new Error(paymentResult?.message || 'Thanh toán thất bại');
      }

      // Create order with payment info
      const orderWithPayment = {
        ...orderData,
        paymentMethod: paymentMethod,
        totalAmount: totals.grandTotal,
        paymentTransactionId: paymentResult.transactionId,
        paymentMessage: paymentResult.message
      };

      console.log('📤 Creating order after successful payment:', orderWithPayment);
      const paidOrder = await createPaidOrder(orderWithPayment);
      
      if (!paidOrder || !paidOrder._id) {
        throw new Error('Không nhận được thông tin đơn hàng hợp lệ từ server');
      }
      
      // Clear cart after successful payment and order creation
      clearCart();
      
      // Show success notification
      let successMessage = `Đơn thuê #${paidOrder.masterOrderNumber || paidOrder._id} đã được tạo thành công!`;
      let paymentMessage = '';
      
      if (paymentMethod === 'WALLET') {
        paymentMessage = '✅ Đã thanh toán từ ví thành công!';
        successMessage += ' Đã thanh toán từ ví.';
      } else if (paymentMethod === 'COD') {
        paymentMessage = '📦 Đơn hàng đã được tạo! Bạn sẽ thanh toán khi nhận hàng.';
        successMessage += ' Bạn sẽ thanh toán khi nhận hàng.';
      } else {
        paymentMessage = '✅ Đã thanh toán qua PayOS thành công!';
        successMessage += ' Đã thanh toán qua PayOS.';
      }

      // Show success toast notification
      toast.success(`🎉 ${successMessage}\n\n${paymentMessage}`, {
        duration: 6000,
        style: {
          maxWidth: '500px',
          padding: '16px',
        }
      });

      // Navigate to user's rental orders page
      navigate('/rental-orders', { 
        state: { 
          message: successMessage,
          orderId: paidOrder._id,
          paymentMethod: paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
          justCreated: true
        }
      });
    } catch (error) {
      console.error('Lỗi xử lý thanh toán:', error);
      alert(`Có lỗi xảy ra: ${error.message}. Vui lòng thử lại.`);
    }
  };

  // Process wallet payment with real API
  const processWalletPayment = async (amount) => {
    try {
      console.log('💳 Processing wallet payment for amount:', amount);
      
      const orderData = {
        totalAmount: amount,
        orderNumber: `ORD-${Date.now()}`,
        description: 'Thanh toán đơn thuê bằng ví điện tử'
      };

      const result = await paymentService.processWalletPayment(orderData);
      
      return {
        method: 'WALLET',
        status: 'SUCCESS',
        transactionId: result.metadata?.transactionId,
        message: 'Thanh toán từ ví thành công'
      };
    } catch (error) {
      return {
        method: 'WALLET',
        status: 'FAILED',
        message: error.message || 'Lỗi thanh toán từ ví'
      };
    }
  };

  // Process PayOS payment with real API
  const processPayOSPayment = async (method, amount) => {
    try {
      console.log('🏦 Processing PayOS payment for amount:', amount);
      
      const orderData = {
        totalAmount: amount,
        orderNumber: `ORD-${Date.now()}`,
        description: 'Thanh toán đơn thuê qua PayOS'
      };

      const result = await paymentService.createOrderPaymentSession(orderData);
      
      // Open PayOS payment page in new window/tab
      if (result.metadata?.checkoutUrl) {
        window.open(result.metadata.checkoutUrl, '_blank');
        
        // For now, assume success (in real app, would wait for webhook)
        const confirmed = window.confirm(
          'Vui lòng hoàn tất thanh toán trên trang PayOS.\n\nNhấn OK khi đã thanh toán thành công, Cancel để hủy.'
        );
        
        if (!confirmed) {
          throw new Error('Người dùng đã hủy thanh toán');
        }
      }
      
      return {
        method: method,
        status: 'SUCCESS',
        transactionId: result.metadata?.transactionId,
        orderCode: result.metadata?.orderCode,
        message: 'Thanh toán PayOS thành công'
      };
    } catch (error) {
      return {
        method: method,
        status: 'FAILED',
        message: error.message || 'Lỗi thanh toán PayOS'
      };
    }
  };

  const totals = useMemo(() => {
    return calculateTotals();
  }, [groupedProducts, totalShipping]);

  // Memoize form validation - dates from cart, only check delivery info
  const isFormValid = useMemo(() => {
    // For PICKUP, no additional validation needed (dates are from cart)
    if (orderData.deliveryMethod === 'PICKUP') {
      return true;
    }
    
    // For DELIVERY, need address (either from map or manual) and phone
    const hasMapLocation = orderData.deliveryAddress.latitude && orderData.deliveryAddress.longitude;
    const hasManualAddress = !!orderData.deliveryAddress.streetAddress;
    const hasAddress = hasMapLocation || hasManualAddress;
    const hasPhone = !!orderData.deliveryAddress.contactPhone;
    
    return hasAddress && hasPhone;
  }, [
    orderData.deliveryMethod,
    orderData.deliveryAddress.streetAddress,
    orderData.deliveryAddress.contactPhone,
    orderData.deliveryAddress.latitude,
    orderData.deliveryAddress.longitude
  ]);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Giỏ thuê trống</h2>
          <p className="text-gray-600 mb-4">Vui lòng thêm sản phẩm vào giỏ trước khi tạo đơn thuê</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Xem sản phẩm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tạo Đơn Thuê</h1>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rental Information by Owner */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Thông tin thuê chi tiết
              </h2>

              {/* Products grouped by owner with individual rental info */}
              <div className="space-y-6">
                {Object.entries(groupedProducts).map(([ownerId, group], groupIndex) => (
                  <div key={ownerId} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4 text-blue-700">
                      📦 Đơn hàng #{groupIndex + 1} - Chủ cho thuê: {group.owner.profile?.firstName || 'Không rõ'}
                    </h3>
                    
                    {/* Products in this group */}  
                    <div className="space-y-4 mb-4">
                      {group.products.map((item, itemIndex) => {
                        // Calculate individual item rental duration
                        let itemDuration = 1;
                        let itemStartDate = null;
                        let itemEndDate = null;
                        
                        if (item.rental?.startDate && item.rental?.endDate) {
                          itemStartDate = new Date(item.rental.startDate);
                          itemEndDate = new Date(item.rental.endDate);
                          const diffTime = Math.abs(itemEndDate - itemStartDate);
                          itemDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                        }
                        
                        return (
                          <div key={`${ownerId}-${item.product._id}-${itemIndex}`} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <img 
                                src={item.product.images?.[0].url || '/placeholder.jpg'} 
                                alt={item.product.name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{item.product.title || item.product.name}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Số lượng: <span className="font-medium">{item.quantity}</span></p>
                                    <p className="text-sm text-gray-600">Giá thuê: <span className="font-medium">{(item.product.pricing?.dailyRate || item.product.price || 0).toLocaleString('vi-VN')}đ/ngày</span></p>
                                    <p className="text-sm text-gray-600">Tiền cọc: <span className="font-medium">{(item.product.pricing?.deposit?.amount || item.product.deposit || 0).toLocaleString('vi-VN')}đ</span></p>
                                  </div>
                                  <div>
                                    <div className="bg-blue-50 p-3 rounded-md">
                                      <p className="text-sm font-medium text-blue-800 mb-1">⏰ Thời gian thuê:</p>
                                      {itemStartDate && itemEndDate ? (
                                        <>
                                          <p className="text-xs text-gray-700">
                                            <span className="font-medium">Từ:</span> {itemStartDate.toLocaleDateString('vi-VN')}
                                          </p>
                                          <p className="text-xs text-gray-700">
                                            <span className="font-medium">Đến:</span> {itemEndDate.toLocaleDateString('vi-VN')}
                                          </p>
                                          <p className="text-sm font-semibold text-blue-700 mt-1">
                                            Tổng: {itemDuration} ngày
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-xs text-gray-500">Chưa có thông tin thời gian thuê</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Tổng tiền thuê:</span>
                                    <span className="font-semibold text-green-600">
                                      {((item.product.pricing?.dailyRate || item.product.price || 0) * item.quantity * itemDuration).toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Tổng tiền cọc:</span>
                                    <span className="font-semibold text-orange-600">
                                      {((item.product.pricing?.deposit?.amount || item.product.deposit || 0) * item.quantity).toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Delivery Batch Shipping Information */}
                    {orderData.deliveryMethod === 'DELIVERY' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">🚚 Thông tin vận chuyển</h4>
                        
                        {/* Total Shipping Cost */}
                        <div className="mb-3 p-2 bg-white rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Tổng phí vận chuyển:</span>
                            <span className="font-bold text-blue-700 text-lg">
                              {(group.shippingFee || 0).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>

                        {/* Delivery Batch Details */}
                        {group.deliveryInfo ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Số lần giao:</span>
                                <span className="ml-2 font-semibold text-green-700">
                                  {group.deliveryInfo.deliveryCount || 1} lần
                                </span>
                              </div>
                              {group.deliveryInfo.distance && (
                                <div>
                                  <span className="text-gray-600">Khoảng cách:</span>
                                  <span className="ml-2 text-gray-800">
                                    {group.deliveryInfo.distance.km || group.deliveryInfo.distance}km
                                  </span>
                                </div>
                              )}
                              {group.deliveryInfo.summary && (
                                <div>
                                  <span className="text-gray-600">Trung bình/lần:</span>
                                  <span className="ml-2 text-gray-800">
                                    {Math.round((group.shippingFee || 0) / (group.deliveryInfo.deliveryCount || 1)).toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Delivery Batches Breakdown */}
                            {group.deliveryInfo.deliveryBatches && group.deliveryInfo.deliveryBatches.length > 0 && (
                              <div className="mt-3 border-t pt-2">
                                <div className="text-xs text-gray-600 mb-2 flex items-center">
                                  <Package className="w-3 h-3 mr-1" />
                                  Chi tiết giao hàng theo ngày:
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {group.deliveryInfo.deliveryBatches.map((batch, index) => (
                                    <div key={index} className="text-xs bg-white p-2 rounded border">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-700">
                                          Ngày {new Date(batch.deliveryDate).toLocaleDateString('vi-VN')}
                                        </span>
                                        <span className="font-medium text-blue-600">
                                          {batch.deliveryFee?.toLocaleString('vi-VN')}đ
                                        </span>
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        {batch.batchSize || batch.products?.length || 0} sản phẩm, 
                                        {batch.batchQuantity || 0} món
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Error Display */}
                            {group.deliveryInfo.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                                ⚠️ {group.deliveryInfo.error}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Fallback display when no delivery info
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center">
                              <span>💡 Nhấn "Tính phí ship" để xem chi tiết giao hàng theo ngày</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Hình thức nhận hàng
              </h2>
              <div className="space-y-3">
               
<label className="flex items-center space-x-3 cursor-pointer">
  <input
    type="radio"
    value="PICKUP"
    checked={orderData.deliveryMethod === 'PICKUP'}
    onChange={(e) => {
      setOrderData(prev => ({ ...prev, deliveryMethod: e.target.value }));
      setTotalShipping(0);
      setGroupedProducts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(ownerId => {
          updated[ownerId].shippingFee = 0;
        });
        return updated;
      });
    }}
    className="w-4 h-4 text-blue-500"
  />
  <span>Nhận trực tiếp (Miễn phí)</span>
</label>
<label className="flex items-center space-x-3 cursor-pointer">
  <input
    type="radio"
    value="OWNER_DELIVERY"
    checked={orderData.deliveryMethod === 'OWNER_DELIVERY'}
    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
    className="w-4 h-4 text-blue-500"
  />
  <span>Chủ của sản phẩm vận chuyển (Phí ship phụ thuộc vào chủ)</span>
</label>
<label className="flex items-center space-x-3 cursor-pointer">
  <input
    type="radio"
    value="DELIVERY"
    checked={orderData.deliveryMethod === 'DELIVERY'}
    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
    className="w-4 h-4 text-blue-500"
  />
  <span>Giao tận nơi (Có phí ship)</span>
</label>
              </div>
            </div>

            {orderData.deliveryMethod === 'OWNER_DELIVERY' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Địa chỉ giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Địa chỉ chi tiết</label>
                    <MapSelector
                      onLocationSelect={handleAddressSelect}
                      initialAddress={orderData.deliveryAddress.streetAddress}
                      placeholder="Chọn địa chỉ trên bản đồ..."
                      className={errors.streetAddress ? 'border-red-500' : ''}
                    />
                    {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {orderData.deliveryMethod === 'DELIVERY' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Địa chỉ giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Địa chỉ chi tiết</label>
                    <MapSelector
                      onLocationSelect={handleAddressSelect}
                      initialAddress={orderData.deliveryAddress.streetAddress}
                      placeholder="Chọn địa chỉ trên bản đồ..."
                      className={errors.streetAddress ? 'border-red-500' : ''}
                    />
                    {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
                    
                    {/* Map location status */}
                    {orderData.deliveryAddress.latitude && orderData.deliveryAddress.longitude && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700 flex items-center">
                          <span className="mr-2">✅</span>
                          Địa chỉ đã được chọn từ bản đồ - Không cần nhập thủ công
                        </p>
                      </div>
                    )}
                    
                    {/* Fallback manual input - only show if no map location */}
                    {!orderData.deliveryAddress.latitude && !orderData.deliveryAddress.longitude && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={orderData.deliveryAddress.streetAddress}
                          onChange={(e) => setOrderData(prev => ({
                            ...prev,
                            deliveryAddress: { ...prev.deliveryAddress, streetAddress: e.target.value }
                          }))}
                          placeholder="Hoặc nhập thủ công: Số nhà, tên đường..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Khuyến khích chọn từ bản đồ để có địa chỉ chính xác nhất
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Chỉ hiển thị các trường này nếu chưa chọn từ map */}
                  {!orderData.deliveryAddress.latitude && !orderData.deliveryAddress.longitude && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Phường/Xã</label>
                        <input
                          type="text"
                          value={orderData.deliveryAddress.ward}
                          onChange={(e) => setOrderData(prev => ({
                            ...prev,
                            deliveryAddress: { ...prev.deliveryAddress, ward: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Nhập phường/xã..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Quận/Huyện</label>
                        <input
                          type="text"
                          value={orderData.deliveryAddress.district}
                          onChange={(e) => setOrderData(prev => ({
                            ...prev,
                            deliveryAddress: { ...prev.deliveryAddress, district: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Nhập quận/huyện..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Hiển thị thông tin địa chỉ từ map (read-only) */}
                  {orderData.deliveryAddress.latitude && orderData.deliveryAddress.longitude && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">📍 Địa chỉ từ bản đồ:</h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        {orderData.deliveryAddress.streetAddress && (
                          <p><span className="font-medium">Địa chỉ:</span> {orderData.deliveryAddress.streetAddress}</p>
                        )}
                        {orderData.deliveryAddress.ward && (
                          <p><span className="font-medium">Phường/Xã:</span> {orderData.deliveryAddress.ward}</p>
                        )}
                        {orderData.deliveryAddress.district && (
                          <p><span className="font-medium">Quận/Huyện:</span> {orderData.deliveryAddress.district}</p>
                        )}
                        {orderData.deliveryAddress.city && (
                          <p><span className="font-medium">Thành phố:</span> {orderData.deliveryAddress.city}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setOrderData(prev => ({
                          ...prev,
                          deliveryAddress: {
                            ...prev.deliveryAddress,
                            latitude: null,
                            longitude: null,
                            streetAddress: '',
                            ward: '',
                            district: '',
                            city: ''
                          }
                        }))}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        🔄 Chọn lại địa chỉ
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tên người nhận</label>
                      <input
                        type="text"
                        value={orderData.deliveryAddress.contactName}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          deliveryAddress: { ...prev.deliveryAddress, contactName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        value={orderData.deliveryAddress.contactPhone}
                        onChange={(e) => setOrderData(prev => ({
                          ...prev,
                          deliveryAddress: { ...prev.deliveryAddress, contactPhone: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-md ${errors.contactPhone ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
                    </div>
                  </div>
                </div>

                {/* Calculate Shipping Button */}
                <button
                  onClick={handleCalculateShipping}
                  disabled={isCalculatingShipping}
                  className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {isCalculatingShipping ? 'Đang tính phí ship...' : 'Tính phí vận chuyển'}
                </button>
              </div>
            )}

            {/* Order Action */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isCreatingDraft || !isFormValid}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  {isCreatingDraft ? 'Đang tạo đơn thuê...' : 'Tạo đơn thuê'}
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Tổng đơn hàng</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Số sản phẩm:</span>
                  <span>{cartItems?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian thuê:</span>
                  <span>{totals.duration} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền thuê:</span>
                  <span>{totals.totalRental.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền cọc:</span>
                  <span>{totals.totalDeposit.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>{totals.totalShipping.toLocaleString('vi-VN')}đ</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{totals.grandTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Lưu ý:</strong> Tiền cọc sẽ được hoàn lại sau khi bạn trả sản phẩm trong tình trạng tốt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selector Modal */}
      {showPaymentSelector && (
        <PaymentMethodSelector
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={handlePaymentMethodSelect}
          onClose={() => setShowPaymentSelector(false)}
        />
      )}
    </div>
  );
  } catch (error) {
    console.error('RentalOrderForm Error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải trang</h2>
          <p className="text-gray-600 mb-4">
            Có lỗi xảy ra khi tải trang tạo đơn thuê: {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
};

export default RentalOrderForm;