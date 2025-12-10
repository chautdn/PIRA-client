import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useRentalOrder } from "../../context/RentalOrderContext";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../hooks/useI18n";
import {
  Calendar,
  MapPin,
  Truck,
  CreditCard,
  Clock,
  Package,
  Tag,
  TrendingDown,
  Lightbulb,
} from "lucide-react";
import MapSelector from "../common/MapSelector";
import AddressSelectionModal from "./AddressSelectionModal";
import PaymentMethodSelector from "../common/PaymentMethodSelector";
import VoucherSelector from "../voucher/VoucherSelector";
import { toast } from "../common/Toast";
import paymentService from "../../services/payment";
import rentalOrderService from "../../services/rentalOrder";
import systemPromotionService from "../../services/systemPromotion";
import { HiCreditCard } from "react-icons/hi";
import { PiBank , PiHandDeposit  } from "react-icons/pi";

const RentalOrderForm = () => {
  try {
    const { t } = useI18n();
    const { user } = useAuth();
    const { cart: cartItems, clearCart } = useCart();
    const rentalOrderContext = useRentalOrder();
    const {
      createDraftOrder,
      createPaidOrder,
      calculateShipping,
      isCreatingDraft,
      isCalculatingShipping,
      shippingCalculation,
    } = rentalOrderContext;
    const navigate = useNavigate();
    const location = useLocation();

    // Check if this is a direct rental (from product detail)
    const directRentalData = location.state?.directRental
      ? location.state
      : null;
    // Check if there are selected items from cart
    const selectedItems = location.state?.selectedItems || null;
    const fromCart = location.state?.fromCart || false;

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
      contactPhone: (user && (user.phone || (user.profile && user.profile.phone))) ? (user.phone || user.profile.phone) : '',
      contactName: (user && (user.profile && (user.profile.firstName || user.profile.lastName)))
        ? `${user.profile.firstName || ''}${user.profile.firstName && user.profile.lastName ? ' ' : ''}${user.profile.lastName || ''}`.trim()
        : (user && user.profile && user.profile.fullName) || ''
    },
    deliveryMethod: 'DELIVERY',
  }));

    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [groupedProducts, setGroupedProducts] = useState({});
    const [sourceItems, setSourceItems] = useState([]); // Store the items being processed
    const [totalShipping, setTotalShipping] = useState(0);
    const [showPaymentSelector, setShowPaymentSelector] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositModalData, setDepositModalData] = useState(null);
    const [activePromotion, setActivePromotion] = useState(null);
    const [loadingPromotion, setLoadingPromotion] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [selectedShippingInfo, setSelectedShippingInfo] = useState(null);
    
    // Use ref to store calculated shipping data (persist across renders)
    const calculatedShippingRef = useRef(null);

    // Address related states
    const [userAddresses, setUserAddresses] = useState(() => (user && user.addresses) ? user.addresses : (user && user.address ? [{ ...user.address, isDefault: true, id: 'default', phone: user.phone || user.profile?.phone }] : []));
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);

    useEffect(() => {
      // Keep userAddresses in sync with user from context
      if (user) {
        if (user.addresses && Array.isArray(user.addresses)) {
          setUserAddresses(user.addresses);
        } else if (user.address) {
          setUserAddresses([{ ...user.address, isDefault: true, id: 'default', phone: user.phone || user.profile?.phone }]);
        } else {
          setUserAddresses([]);
        }
      }
    }, [user]);

    // When user addresses load, pre-fill orderData.deliveryAddress with default address (local only)
    useEffect(() => {
      if (!userAddresses || userAddresses.length === 0) return;

      const hasAddressInOrder = !!(
        orderData.deliveryAddress.streetAddress ||
        orderData.deliveryAddress.latitude ||
        orderData.deliveryAddress.longitude
      );

      if (hasAddressInOrder) return; // don't overwrite if user already interacted with address

      const defaultAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0];
      if (!defaultAddress) return;

      setOrderData((prev) => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          streetAddress: defaultAddress.streetAddress || defaultAddress.formattedAddress || "",
          ward: defaultAddress.ward || defaultAddress.subLocality || "",
          district: defaultAddress.district || "",
          city: defaultAddress.city || defaultAddress.locality || "",
          contactPhone: defaultAddress.phone || defaultAddress.contactPhone || prev.deliveryAddress.contactPhone,
          contactName: defaultAddress.contactName || prev.deliveryAddress.contactName,
          latitude: (defaultAddress.coordinates && defaultAddress.coordinates.latitude) || defaultAddress.latitude || prev.deliveryAddress.latitude,
          longitude: (defaultAddress.coordinates && defaultAddress.coordinates.longitude) || defaultAddress.longitude || prev.deliveryAddress.longitude,
        },
      }));
    }, [userAddresses]);

    const handleAddressFromModal = (address) => {
      if (!address) return;
      setOrderData((prev) => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          streetAddress: address.streetAddress || address.formattedAddress || "",
          ward: address.ward || address.subLocality || "",
          district: address.district || "",
          city: address.city || address.locality || "",
          contactPhone: address.phone || address.contactPhone || prev.deliveryAddress.contactPhone,
          contactName: address.contactName || prev.deliveryAddress.contactName,
          latitude: (address.coordinates && address.coordinates.latitude) || address.latitude || prev.deliveryAddress.latitude,
          longitude: (address.coordinates && address.coordinates.longitude) || address.longitude || prev.deliveryAddress.longitude,
        },
      }));
      setShowAddressModal(false);
      try {
        // toast is imported earlier
        toast.success("Đã cập nhật địa chỉ giao hàng!");
      } catch (e) {
        // Address updated silently
      }
    };

    // Update contact info when user changes (use top-level phone and profile name parts)
    useEffect(() => {
      if (user) {
        const phoneFromUser = user.phone || (user.profile && user.profile.phone) || '';
        const nameFromProfile = (user.profile && (user.profile.firstName || user.profile.lastName))
          ? `${user.profile.firstName || ''}${user.profile.firstName && user.profile.lastName ? ' ' : ''}${user.profile.lastName || ''}`.trim()
          : (user.profile && user.profile.fullName) || '';

        setOrderData((prev) => ({
          ...prev,
          deliveryAddress: {
            ...prev.deliveryAddress,
            contactPhone: phoneFromUser || prev.deliveryAddress.contactPhone,
            contactName: nameFromProfile || prev.deliveryAddress.contactName,
          },
        }));
      }
    }, [user]);

    // Load active system promotion for automatic discount
    useEffect(() => {
      const loadActivePromotion = async () => {
        try {
          setLoadingPromotion(true);
          const response = await systemPromotionService.getActive();
          if (
            response.metadata.promotions &&
            response.metadata.promotions.length > 0
          ) {
            setActivePromotion(response.metadata.promotions[0]);
          }
        } catch (error) {
          // Failed to load promotion silently
        } finally {
          setLoadingPromotion(false);
        }
      };

      loadActivePromotion();
    }, []);

    // Group products by owner and set rental dates from cart OR direct rental
    useEffect(() => {
      let sourceItems = [];

      // Priority: direct rental > selected items > all cart items
      if (directRentalData) {
        // Convert direct rental to cart-like structure
        sourceItems = [
          {
            _id: "direct-rental-item",
            product: directRentalData.product,
            quantity: directRentalData.quantity,
            rental: directRentalData.rental,
          },
        ];
      } else if (
        selectedItems &&
        Array.isArray(selectedItems) &&
        selectedItems.length > 0
      ) {
        sourceItems = selectedItems;
      } else if (cartItems && Array.isArray(cartItems)) {
        sourceItems = cartItems;
      } else {
        return;
      }
      
      // Store sourceItems in state for later use when submitting
      setSourceItems(sourceItems);
      
      const grouped = {};
      let earliestStart = null;
      let latestEnd = null;

      sourceItems.forEach((item) => {
        // Validate item structure
        if (!item?.product?.owner?._id) {
          return;
        }

        const ownerId = item.product.owner._id;
        if (!grouped[ownerId]) {
          grouped[ownerId] = {
            owner: item.product.owner,
            products: [],
            shippingFee: 0,
          };
        }
        grouped[ownerId].products.push(item);

        // Track rental period from items
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

      // Set rental dates from items
      if (earliestStart && latestEnd) {
        setOrderData((prev) => ({
          ...prev,
          rentalPeriod: {
            startDate: earliestStart.toISOString().split("T")[0],
            endDate: latestEnd.toISOString().split("T")[0],
          },
        }));
      }
    }, [cartItems, directRentalData, selectedItems]);

    // Calculate rental duration
    const calculateDuration = () => {
      if (!orderData.rentalPeriod.startDate || !orderData.rentalPeriod.endDate)
        return 0;
      const start = new Date(orderData.rentalPeriod.startDate);
      const end = new Date(orderData.rentalPeriod.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Helper function to calculate final shipping after discounts
    const calculateFinalShipping = () => {
      let finalShipping = totalShipping;

      // Apply promotion discount first
      if (activePromotion) {
        const discount =
          activePromotion.systemPromotion.discountType === "PERCENTAGE"
            ? (totalShipping *
                activePromotion.systemPromotion.shippingDiscountValue) /
              100
            : Math.min(
                activePromotion.systemPromotion.shippingDiscountValue,
                totalShipping
              );
        finalShipping -= discount;
      }

      // Apply voucher discount on remaining amount
      if (selectedVoucher) {
        const voucherDiscount = Math.round(
          (finalShipping * selectedVoucher.discountPercent) / 100
        );
        finalShipping -= voucherDiscount;
      }

      return Math.max(0, finalShipping);
    };

    // Calculate total amounts using dates from cart items
    const calculateTotals = () => {
      let totalRental = 0;
      let totalDeposit = 0;
      let totalDays = 0;

      if (groupedProducts && typeof groupedProducts === "object") {
        Object.values(groupedProducts).forEach((group) => {
          group.products.forEach((item) => {
            // Calculate duration for each item from its cart rental dates
            let itemDuration = 1; // default
            if (item.rental?.startDate && item.rental?.endDate) {
              const start = new Date(item.rental.startDate);
              const end = new Date(item.rental.endDate);
              const diffTime = Math.abs(end - start);
              itemDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            }

            const itemRental =
              (item.product.pricing?.dailyRate || item.product.price || 0) *
              item.quantity *
              itemDuration;
            const itemDeposit =
              (item.product.pricing?.deposit?.amount ||
                item.product.deposit ||
                0) * item.quantity;

            totalRental += itemRental;
            totalDeposit += itemDeposit;
            totalDays = Math.max(totalDays, itemDuration); // Use max duration for display
          });
        });
      }

      // Calculate final shipping with discounts applied
      const finalShipping = calculateFinalShipping();

      return {
        duration: totalDays,
        totalRental,
        totalDeposit,
        totalShipping, // Original shipping for display
        finalShipping, // Discounted shipping for actual payment
        grandTotal: totalRental + totalDeposit + finalShipping, // Use discounted shipping in total
      };
    };

    // NEW: Calculate shipping using trip-based system (group by delivery date across all SubOrders)
    const handleCalculateShipping = async () => {
      if (orderData.deliveryMethod === "PICKUP") {
        setTotalShipping(0);
        return;
      }

      // Validate delivery address first
      const hasMapLocation =
        orderData.deliveryAddress.latitude &&
        orderData.deliveryAddress.longitude;
      const hasManualAddress = !!orderData.deliveryAddress.streetAddress;

      if (!orderData.deliveryAddress.contactPhone) {
        alert("Vui lòng nhập số điện thoại liên hệ trước khi tính phí ship");
        return;
      }

      if (!hasMapLocation && !hasManualAddress) {
        alert(
          "Vui lòng chọn địa chỉ trên bản đồ hoặc nhập địa chỉ thủ công trước khi tính phí ship"
        );
        return;
      }

      try {
        let masterTotalShipping = 0;
        // Create a mutable copy of groupedProducts
        const updatedGroups = {};
        Object.keys(groupedProducts).forEach(ownerId => {
          updatedGroups[ownerId] = {
            ...groupedProducts[ownerId],
            products: groupedProducts[ownerId].products.map(p => ({
              ...p,
              product: { ...p.product }
            }))
          };
        });

        // Calculate shipping for each SubOrder (Owner) separately
        for (const [ownerId, group] of Object.entries(updatedGroups)) {
          console.log(
            `🚚 Calculating shipping for Owner ${ownerId}:`,
            group.products.length,
            "products"
          );

          // Group this owner's products by delivery date
          const deliveryBatches = {};
          group.products.forEach((product, index) => {
            const deliveryDate = product.rental?.startDate
              ? new Date(product.rental.startDate).toISOString().split("T")[0]
              : "unknown";

            if (!deliveryBatches[deliveryDate]) {
              deliveryBatches[deliveryDate] = [];
            }

            deliveryBatches[deliveryDate].push({
              ...product,
              productIndex: index,
            });
          });

          let subOrderTotalShipping = 0;
          const subOrderDeliveries = [];
          let deliveryCount = 0;

          // Calculate shipping for each delivery batch (same owner, same date = 1 delivery trip)
          for (const [deliveryDate, batchProducts] of Object.entries(
            deliveryBatches
          )) {
            deliveryCount++;

            const ownerLocation = {
              latitude: group.owner.address?.coordinates?.latitude || null,
              longitude: group.owner.address?.coordinates?.longitude || null,
            };
            console.log("Owner Location:", ownerLocation);

            const userLocation = {
              latitude: orderData.deliveryAddress.latitude || null,
              longitude: orderData.deliveryAddress.longitude || null,
            };
            console.log("User Location:", userLocation);

            // Kiểm tra tọa độ - KHÔNG fallback, báo lỗi rõ ràng
            if (!ownerLocation.latitude || !ownerLocation.longitude) {
              throw new Error(
                `Chủ sản phẩm ${group.owner.profile?.firstName || "Unknown"} chưa có tọa độ địa chỉ. Vui lòng liên hệ chủ sản phẩm cập nhật địa chỉ.`
              );
            }

            if (!userLocation.latitude || !userLocation.longitude) {
              throw new Error(
                "Địa chỉ giao hàng chưa có tọa độ. Vui lòng chọn địa chỉ trên bản đồ."
              );
            }

            // Use backend API to calculate exact shipping for this batch
            const products = batchProducts.map((item) => ({
              product: item.product._id,
              quantity: item.quantity || 1,
              rentalPeriod: item.rental || {
                startDate: orderData.rentalPeriod.startDate,
                endDate: orderData.rentalPeriod.endDate,
              },
            }));

            const shippingData = {
              subOrderId: `batch-${deliveryDate}-${ownerId}`,
              ownerAddress: {
                latitude: ownerLocation.latitude,
                longitude: ownerLocation.longitude,
                streetAddress: group.owner.address?.streetAddress || "Địa chỉ không xác định",
              },
              deliveryAddress: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                streetAddress: orderData.deliveryAddress.streetAddress || "Địa chỉ không xác định",
              },
              products,
            };

            console.log(
              `🚚 Calculating batch shipping for ${deliveryDate}:`,
              products.length,
              "products"
            );

            const shippingResponse = await calculateShipping(shippingData);

            // Xử lý response từ API
            // Response có thể có nhiều format:
            // 1. Trực tiếp: { distance: 20.5, fee: 120000, success: true, ... }
            // 2. Wrapped: { data: { shipping: {...} } }
            // 3. Wrapped: { metadata: { shipping: {...} } }
            let shipping;
            
            if (shippingResponse?.distance !== undefined && shippingResponse?.fee !== undefined) {
              // Format 1: Response trực tiếp là shipping object
              shipping = shippingResponse;
            } else {
              // Format 2 & 3: Response wrapped
              shipping = 
                shippingResponse?.data?.shipping || 
                shippingResponse?.metadata?.shipping ||
                shippingResponse?.shipping;
            }
            
            if (!shipping || !shipping.distance || !shipping.fee) {
              throw new Error(
                shippingResponse?.message || "Không thể tính phí ship từ API - Dữ liệu không hợp lệ"
              );
            }
            const batchFee = shipping.fee || 0;

            const allocatedFeePerProduct = Math.round(batchFee / batchProducts.length);
            
            const batchInfo = {
              deliveryDate,
              batchSize: batchProducts.length,
              batchQuantity: batchProducts.reduce(
                (sum, p) => sum + (p.quantity || 1),
                0
              ),
              deliveryFee: batchFee,
              distance: shipping.distance,
              distanceMeters: shipping.distanceMeters,
              estimatedTime: shipping.estimatedTime,
              shippingDetails: shipping.shippingDetails,
              products: batchProducts.map((p) => ({
                productId: p.product._id,
                quantity: p.quantity || 1,
                allocatedFee: allocatedFeePerProduct,
              })),
            };

            // Update each product with its shipping fee in the updatedGroups
            batchProducts.forEach((batchProduct) => {
              const productIndex = group.products.findIndex(
                (prod) => prod.product._id === batchProduct.product._id
              );
              if (productIndex !== -1) {
                // Create new product object to ensure immutability
                updatedGroups[ownerId].products[productIndex] = {
                  ...updatedGroups[ownerId].products[productIndex],
                  product: {
                    ...updatedGroups[ownerId].products[productIndex].product,
                    totalShippingFee: allocatedFeePerProduct
                  }
                };
              }
            });

            subOrderTotalShipping += batchFee;
            subOrderDeliveries.push(batchInfo);

            console.log(
              `✅ Delivery batch ${deliveryDate} - Owner ${
                group.owner.profile?.firstName
              }: ${batchFee.toLocaleString("vi-VN")}đ (${shipping.distance.toFixed(2)}km)`
            );
          }

          // Update SubOrder shipping info
          updatedGroups[ownerId].shippingFee = subOrderTotalShipping;
          updatedGroups[ownerId].deliveryInfo = {
            deliveryCount,
            deliveryBatches: subOrderDeliveries,
            distance: subOrderDeliveries[0]?.distance || 0,
            summary: `${deliveryCount} lần giao hàng - ${subOrderDeliveries[0]?.distance?.toFixed(2) || 0}km`,
          };

          masterTotalShipping += subOrderTotalShipping;

          console.log(
            `📦 SubOrder ${ownerId} total: ${subOrderTotalShipping.toLocaleString(
              "vi-VN"
            )}đ (${deliveryCount} deliveries)`
          );
        }

        // Update state with calculated shipping fees
        setGroupedProducts(updatedGroups);
        setTotalShipping(masterTotalShipping);
        
        // Store in ref to persist across renders
        calculatedShippingRef.current = {
          groupedProducts: updatedGroups,
          totalShipping: masterTotalShipping,
          timestamp: Date.now()
        };
        
        toast.success(
          `Đã tính phí ship: ${masterTotalShipping.toLocaleString(
            "vi-VN"
          )}đ cho ${Object.keys(updatedGroups).length} SubOrder`
        );
      } catch (error) {
        console.error("❌ Error in trip-based shipping calculation:", error);
        toast.error(`Lỗi tính phí ship: ${error.message}`);
      }
    };

    // Validate form - dates are from cart, only validate delivery info
    const validateForm = () => {
      const newErrors = {};

      // Only validate delivery address if DELIVERY method is selected
      if (orderData.deliveryMethod === "DELIVERY") {
        // Nếu đã chọn từ map (có latitude/longitude) thì không cần validate địa chỉ chi tiết
        const hasMapLocation =
          orderData.deliveryAddress.latitude &&
          orderData.deliveryAddress.longitude;

        if (!hasMapLocation && !orderData.deliveryAddress.streetAddress) {
          newErrors.streetAddress =
            "Vui lòng chọn địa chỉ trên bản đồ hoặc nhập địa chỉ thủ công";
        }

        if (!orderData.deliveryAddress.contactPhone) {
          newErrors.contactPhone = "Vui lòng nhập số điện thoại";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle address selection from map
    const handleAddressSelect = (locationData) => {
      setOrderData((prev) => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          streetAddress:
            locationData.streetAddress || locationData.fullAddress || "",
          ward: locationData.ward || "",
          district: locationData.district || "",
          city: locationData.city || "",
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      }));

      // Clear address related errors
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.streetAddress;
        return newErrors;
      });
    };

    // Handle form submission - now shows payment selector first
    const handleSubmit = async () => {
      if (!validateForm()) return;

      // Validate that shipping has been calculated for DELIVERY orders
      if (orderData.deliveryMethod === "DELIVERY") {
        // Use ref as source of truth if available
        const shippingSource = calculatedShippingRef.current?.groupedProducts || groupedProducts;
        
        const hasShippingCalculated = Object.values(shippingSource).some(
          group => group.shippingFee > 0
        );
        
        if (!hasShippingCalculated) {
          toast.error("Vui lòng nhấn 'Tính phí vận chuyển' trước khi tạo đơn hàng");
          return;
        }
      }

      // Show payment method selector
      setShowPaymentSelector(true);
    };

    // Handle payment method selection and process different payment types
    const handlePaymentMethodSelect = async (paymentMethod) => {
      try {
        let paymentResult = null;

        // Process payment based on selected method
        switch (paymentMethod) {
          case "WALLET":
            // For wallet payment, let the order creation handle the deduction
            // No separate payment processing needed - avoid double deduction
            console.log(
              "💳 Wallet payment selected - skipping separate payment processing to avoid double deduction"
            );
            paymentResult = {
              method: "WALLET",
              status: "PENDING",
              message: "Thanh toán từ ví sẽ được xử lý khi tạo đơn hàng",
            };
            break;

          case "BANK_TRANSFER":
          case "PAYOS":
            // Redirect to PayOS payment gateway - use discounted total
            paymentResult = await processPayOSPayment(
              paymentMethod,
              totals.grandTotal // Now includes discount
            );
            break;

          case "COD":
            // COD requires mandatory deposit payment
            paymentResult = await processCODWithDeposit(totals);
            break;

          default:
            throw new Error("Phương thức thanh toán không hợp lệ");
        }

        if (!paymentResult || paymentResult.status === "FAILED") {
          throw new Error(paymentResult?.message || "Thanh toán thất bại");
        }

        // Create order with payment info
        // Use ref for shipping data if available (more reliable than state)
        const shippingSource = calculatedShippingRef.current?.groupedProducts || groupedProducts;
        const shippingTotal = calculatedShippingRef.current?.totalShipping || totalShipping;
        
        const orderWithPayment = {
          ...orderData,
          paymentMethod: paymentMethod,
          totalAmount: totals.grandTotal,
          paymentTransactionId: paymentResult.transactionId,
          paymentMessage: paymentResult.message,
          // Pass the items being processed (not selectedItems from location.state)
          selectedItems: sourceItems,
          // Pass shipping data calculated from frontend with promotion applied
          shippingData: {
            totalShipping: shippingTotal,
            finalShipping: calculateFinalShipping(),
            promotionDiscount: activePromotion ? (() => {
              const discount = activePromotion.systemPromotion.discountType === "PERCENTAGE"
                ? (shippingTotal * activePromotion.systemPromotion.shippingDiscountValue) / 100
                : Math.min(activePromotion.systemPromotion.shippingDiscountValue, shippingTotal);
              return discount;
            })() : 0,
            voucherDiscount: selectedVoucher ? Math.round((shippingTotal * selectedVoucher.discountPercent) / 100) : 0,
            activePromotion: activePromotion ? {
              _id: activePromotion._id,
              code: activePromotion.code,
              title: activePromotion.title,
              systemPromotion: activePromotion.systemPromotion
            } : null,
            groupedShipping: Object.fromEntries(
              Object.entries(shippingSource).map(([ownerId, group]) => [
                ownerId,
                {
                  shippingFee: group.shippingFee || 0,
                  deliveryInfo: group.deliveryInfo || null,
                  products: (group.products || []).map(item => ({
                    productId: item.product._id,
                    totalShippingFee: item.product.totalShippingFee || 0,
                    deliveryDate: item.rental?.startDate
                  }))
                }
              ])
            )
          },
          // COD specific fields
          ...(paymentMethod === "COD" && {
            depositAmount: paymentResult.depositAmount,
            depositPaymentMethod: paymentResult.depositPaymentMethod,
            depositTransactionId: paymentResult.depositTransactionId,
          }),
        };

        console.log(
          "📤 Creating order after successful payment:",
          orderWithPayment
        );
        const paidOrder = await createPaidOrder(orderWithPayment);

        if (!paidOrder || !paidOrder._id) {
          throw new Error(
            "Không nhận được thông tin đơn hàng hợp lệ từ server"
          );
        }

        // Check if need to redirect to PayOS payment
        if (
          (paymentMethod === "PAYOS" || paymentMethod === "BANK_TRANSFER") &&
          paidOrder.paymentInfo?.paymentDetails?.paymentUrl
        ) {
          console.log(
            "🔗 Redirecting to PayOS payment:",
            paidOrder.paymentInfo.paymentDetails.paymentUrl
          );

          // Save order info to sessionStorage for later use
          sessionStorage.setItem(
            "pendingPaymentOrder",
            JSON.stringify({
              orderId: paidOrder._id,
              orderNumber: paidOrder.masterOrderNumber,
              orderCode: paidOrder.paymentInfo.orderCode,
            })
          );

          // Redirect to PayOS payment page
          window.location.href =
            paidOrder.paymentInfo.paymentDetails.paymentUrl;
          return; // Stop execution here
        }

        // For COD with PayOS deposit
        if (
          paymentMethod === "COD" &&
          paidOrder.paymentInfo?.paymentDetails?.depositPaymentUrl
        ) {
          console.log(
            "🔗 Redirecting to PayOS deposit payment:",
            paidOrder.paymentInfo.paymentDetails.depositPaymentUrl
          );

          // Save order info to sessionStorage
          sessionStorage.setItem(
            "pendingPaymentOrder",
            JSON.stringify({
              orderId: paidOrder._id,
              orderNumber: paidOrder.masterOrderNumber,
              orderCode: paidOrder.paymentInfo.paymentDetails.depositOrderCode,
            })
          );

          // Redirect to PayOS payment page
          window.location.href =
            paidOrder.paymentInfo.paymentDetails.depositPaymentUrl;
          return; // Stop execution here
        }

        // Clear cart after successful payment and order creation
        clearCart();

        // Show success notification
        let successMessage = `Đơn thuê #${
          paidOrder.masterOrderNumber || paidOrder._id
        } đã được tạo thành công!`;
        let paymentMessage = "";

        if (paymentMethod === "WALLET") {
          paymentMessage = "✅ Đã thanh toán từ ví thành công!";
          successMessage += " Đã thanh toán từ ví.";
        } else if (paymentMethod === "COD") {
          paymentMessage =
            "📦 Đơn hàng đã được tạo! Bạn sẽ thanh toán khi nhận hàng.";
          successMessage += " Bạn sẽ thanh toán khi nhận hàng.";
        } else {
          paymentMessage = "✅ Đã thanh toán qua PayOS thành công!";
          successMessage += " Đã thanh toán qua PayOS.";
        }

        // Show success toast notification
        toast.success(`🎉 ${successMessage}\n\n${paymentMessage}`, {
          duration: 6000,
          style: {
            maxWidth: "500px",
            padding: "16px",
          },
        });

        // Navigate to user's rental orders page
        navigate("/rental-orders", {
          state: {
            message: successMessage,
            orderId: paidOrder._id,
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
            justCreated: true,
          },
        });
      } catch (error) {
        console.error("Lỗi xử lý thanh toán:", error);
        alert(`Có lỗi xảy ra: ${error.message}. Vui lòng thử lại.`);
      }
    };

    // Process COD with mandatory deposit payment
    const processCODWithDeposit = async (totals) => {
      try {
        // Calculate total deposit from all items via backend API
        const totalDeposit = await calculateTotalDeposit();

        if (!totalDeposit || totalDeposit <= 0) {
          console.error("❌ Invalid deposit amount:", totalDeposit);
          throw new Error(
            `Không thể tính được tiền cọc cho đơn hàng này. Deposit calculated: ${totalDeposit}`
          );
        }

        // Show deposit payment method selection
        const depositPaymentMethod = await showDepositPaymentModal(
          totalDeposit,
          totals.grandTotal
        );

        if (!depositPaymentMethod) {
          throw new Error("Cần chọn phương thức thanh toán cọc");
        }

        // Process deposit payment
        let depositResult;
        if (depositPaymentMethod === "WALLET") {
          // Process wallet deposit payment (will be handled by backend)
          depositResult = {
            status: "SUCCESS",
            transactionId: `DEP_${Date.now()}`,
            method: "WALLET",
          };
        } else {
          // Process PayOS deposit payment
          depositResult = await processPayOSPayment(
            depositPaymentMethod,
            totalDeposit
          );
        }

        if (depositResult.status !== "SUCCESS") {
          throw new Error(
            "Thanh toán cọc thất bại: " +
              (depositResult.message || "Unknown error")
          );
        }

        return {
          method: "COD",
          status: "SUCCESS",
          depositAmount: totalDeposit,
          depositPaymentMethod: depositPaymentMethod,
          depositTransactionId: depositResult.transactionId,
          message: `Đã thanh toán cọc ${totalDeposit.toLocaleString(
            "vi-VN"
          )}đ. Còn lại ${(totals.grandTotal - totalDeposit).toLocaleString(
            "vi-VN"
          )}đ thanh toán khi nhận hàng`,
        };
      } catch (error) {
        console.error("❌ COD deposit payment error:", error);
        return {
          method: "COD",
          status: "FAILED",
          message: error.message || "Lỗi thanh toán cọc",
        };
      }
    };

    // Calculate total deposit from backend API (accurate calculation)
    const calculateTotalDeposit = async () => {
      try {
        // Use rentalOrderService instead of direct fetch
        const result = await rentalOrderService.calculateDeposit();

        if (
          result.success &&
          result.metadata &&
          typeof result.metadata.totalDeposit === "number"
        ) {
          return result.metadata.totalDeposit;
        } else {
          throw new Error("Invalid response format from deposit API");
        }
      } catch (error) {
        console.error("❌ Error calculating deposit from API:", error);

        // Fallback to client-side calculation
        console.log("🔄 Falling back to client-side deposit calculation");
        const items = fromCart
          ? selectedItems
          : directRentalData
          ? [directRentalData]
          : [];

        console.log("📋 Items for deposit calculation:", {
          fromCart,
          selectedItems: selectedItems?.length || 0,
          directRentalData: !!directRentalData,
          totalItems: items.length,
          cartItems: cartItems?.length || 0,
        });

        // If no items found, try to get from cartItems as last resort
        const finalItems = items.length > 0 ? items : cartItems || [];

        if (finalItems.length === 0) {
          console.error(
            "❌ No items found for deposit calculation in any source"
          );
          throw new Error("Không có sản phẩm nào để tính tiền cọc");
        }

        const fallbackDeposit = finalItems.reduce((total, item) => {
          const deposit =
            item.product?.pricing?.deposit?.amount ||
            item.product?.deposit ||
            item.depositRate ||
            0;

          return total + deposit * item.quantity;
        }, 0);

        // If still 0, provide a meaningful error
        if (fallbackDeposit <= 0) {
          // Return a small positive number to avoid blocking the flow
          return 50000; // 50,000 VND as minimum deposit
        }

        return fallbackDeposit;
      }
    };

    // Show deposit payment method selection modal
    const showDepositPaymentModal = (depositAmount, totalAmount) => {
      return new Promise((resolve) => {
        setShowDepositModal(true);
        setDepositModalData({
          depositAmount,
          totalAmount,
          onSelect: (method) => {
            setShowDepositModal(false);
            resolve(method);
          },
          onCancel: () => {
            setShowDepositModal(false);
            resolve(null);
          },
        });
      });
    };

    // Process PayOS payment with real API
    const processPayOSPayment = async (method, amount) => {
      try {
        console.log("🏦 Processing PayOS payment for amount:", amount);

        // This will be handled by createPaidOrder - just return pending status
        // The actual PayOS payment link will be in the order response
        return {
          method: method,
          status: "PENDING", // Changed from SUCCESS to PENDING
          message: "Đang tạo link thanh toán PayOS",
        };
      } catch (error) {
        console.error("❌ PayOS payment error:", error);
        return {
          method: method,
          status: "FAILED",
          message: error.message || "Lỗi thanh toán PayOS",
        };
      }
    };

    const totals = useMemo(() => {
      return calculateTotals();
    }, [groupedProducts, totalShipping]);

    // Memoize form validation - dates from cart, only check delivery info
    const isFormValid = useMemo(() => {
      // For PICKUP, no additional validation needed (dates are from cart)
      if (orderData.deliveryMethod === "PICKUP") {
        return true;
      }

      // For DELIVERY, need address (either from map or manual) and phone
      const hasMapLocation =
        orderData.deliveryAddress.latitude &&
        orderData.deliveryAddress.longitude;
      const hasManualAddress = !!orderData.deliveryAddress.streetAddress;
      const hasAddress = hasMapLocation || hasManualAddress;
      const hasPhone = !!orderData.deliveryAddress.contactPhone;

      return hasAddress && hasPhone;
    }, [
      orderData.deliveryMethod,
      orderData.deliveryAddress.streetAddress,
      orderData.deliveryAddress.contactPhone,
      orderData.deliveryAddress.latitude,
      orderData.deliveryAddress.longitude,
    ]);

    // Check if we have products (from cart or direct rental)
    const hasProducts = directRentalData || (cartItems && cartItems.length > 0);

    if (!hasProducts) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {directRentalData ? t("rentalOrderForm.emptyDirectRental") : t("rentalOrderForm.emptyCart")}
            </h2>
            <p className="text-gray-600 mb-4">
              {directRentalData
                ? t("rentalOrderForm.emptyDirectMessage")
                : t("rentalOrderForm.emptyMessage")}
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              {t("rentalOrderForm.viewProducts")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl font-bold">
              {directRentalData ? t("rentalOrderForm.directRental") : t("rentalOrderForm.title")}
            </h1>
            {directRentalData && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                {t("rentalOrderForm.directRentalBadge")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rental Information by Owner */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {t("rentalOrderForm.rentalDetailsTitle")}
                </h2>

                {/* Products grouped by owner with individual rental info */}
                <div className="space-y-6">
                  {Object.entries(groupedProducts).map(
                    ([ownerId, group], groupIndex) => (
                      <div
                        key={ownerId}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="text-lg font-medium mb-4 text-blue-700">
                          📦 Order #{groupIndex + 1} - {t("rentalOrderForm.orderNumberLabel")}: {group.owner.profile?.firstName || t("rentalOrderForm.unknown")}
                        </h3>

                        {/* Products in this group */}
                        <div className="space-y-4 mb-4">
                          {group.products.map((item, itemIndex) => {
                            // Calculate individual item rental duration
                            let itemDuration = 1;
                            let itemStartDate = null;
                            let itemEndDate = null;

                            if (
                              item.rental?.startDate &&
                              item.rental?.endDate
                            ) {
                              itemStartDate = new Date(item.rental.startDate);
                              itemEndDate = new Date(item.rental.endDate);
                              const diffTime = Math.abs(
                                itemEndDate - itemStartDate
                              );
                              itemDuration =
                                Math.ceil(diffTime / (1000 * 60 * 60 * 24)) ||
                                1;
                            }

                            return (
                              <div
                                key={`${ownerId}-${item.product._id}-${itemIndex}`}
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={
                                      item.product.images?.[0].url ||
                                      "/placeholder.jpg"
                                    }
                                    alt={item.product.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-2">
                                      {item.product.title || item.product.name}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-600">
                                          {t("rentalOrderForm.quantity")}{" "}
                                          <span className="font-medium">
                                            {item.quantity}
                                          </span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {t("rentalOrderForm.rentalPrice")}{" "}
                                          <span className="font-medium">
                                            {(
                                              item.product.pricing?.dailyRate ||
                                              item.product.price ||
                                              0
                                            ).toLocaleString("vi-VN")}
                                            đ/{t("rentalOrderForm.days")}
                                          </span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {t("rentalOrderForm.deposit")}{" "}
                                          <span className="font-medium">
                                            {(
                                              item.product.pricing?.deposit
                                                ?.amount ||
                                              item.product.deposit ||
                                              0
                                            ).toLocaleString("vi-VN")}
                                            đ
                                          </span>
                                        </p>
                                      </div>
                                      <div>
                                        <div className="bg-blue-50 p-3 rounded-md">
                                          <p className="text-sm font-medium text-blue-800 mb-1">
                                            {t("rentalOrderForm.rentalTime")}
                                          </p>
                                          {itemStartDate && itemEndDate ? (
                                            <>
                                              <p className="text-xs text-gray-700">
                                                <span className="font-medium">
                                                  {t("rentalOrderForm.from")}:
                                                </span>{" "}
                                                {itemStartDate.toLocaleDateString(
                                                  "vi-VN"
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-700">
                                                <span className="font-medium">
                                                  {t("rentalOrderForm.to")}:
                                                </span>{" "}
                                                {itemEndDate.toLocaleDateString(
                                                  "vi-VN"
                                                )}
                                              </p>
                                              <p className="text-sm font-semibold text-blue-700 mt-1">
                                                {t("rentalOrderForm.total")}: {itemDuration} {t("rentalOrderForm.days")}
                                              </p>
                                            </>
                                          ) : (
                                            <p className="text-xs text-gray-500">
                                              {t("rentalOrderForm.noRentalTime")}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                          {t("rentalOrderForm.totalRentalAmount")}:
                                        </span>
                                        <span className="font-semibold text-green-600">
                                          {(
                                            (item.product.pricing?.dailyRate ||
                                              item.product.price ||
                                              0) *
                                            item.quantity *
                                            itemDuration
                                          ).toLocaleString("vi-VN")}
                                          đ
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                          {t("rentalOrderForm.totalDepositAmount")}:
                                        </span>
                                        <span className="font-semibold text-orange-600">
                                          {(
                                            (item.product.pricing?.deposit
                                              ?.amount ||
                                              item.product.deposit ||
                                              0) * item.quantity
                                          ).toLocaleString("vi-VN")}
                                          đ
                                        </span>
                                      </div>
                                      {orderData.deliveryMethod === "DELIVERY" && group.shippingFee > 0 && (() => {
                                        // Calculate shipping fee for this product
                                        let productShippingFee = 0;
                                        const deliveryDate = item.rental?.startDate 
                                          ? new Date(item.rental.startDate).toLocaleDateString("vi-VN")
                                          : null;

                                        // Try to find from productFees
                                        if (group.deliveryInfo?.productFees) {
                                          const productFee = group.deliveryInfo.productFees.find(
                                            (fee) => fee.productId === item.product._id
                                          );
                                          if (productFee) {
                                            productShippingFee = productFee.allocatedFee || 0;
                                          }
                                        }

                                        // Fallback to batch calculation by delivery date
                                        if (productShippingFee === 0 && group.deliveryInfo?.deliveryBatches && deliveryDate) {
                                          const productBatch = group.deliveryInfo.deliveryBatches.find(
                                            (batch) => batch.deliveryDate === deliveryDate
                                          );
                                          if (productBatch) {
                                            productShippingFee = Math.round(
                                              productBatch.deliveryFee / productBatch.batchSize
                                            );
                                          }
                                        }

                                        // Final fallback - group products by delivery date and calculate per batch
                                        if (productShippingFee === 0 && deliveryDate) {
                                          // Count products with same delivery date
                                          const productsOnSameDate = group.products.filter(p => {
                                            const pDate = p.rental?.startDate 
                                              ? new Date(p.rental.startDate).toLocaleDateString("vi-VN")
                                              : null;
                                            return pDate === deliveryDate;
                                          });
                                          
                                          // Get unique delivery dates to calculate number of deliveries
                                          const uniqueDates = [...new Set(
                                            group.products.map(p => 
                                              p.rental?.startDate 
                                                ? new Date(p.rental.startDate).toLocaleDateString("vi-VN")
                                                : null
                                            ).filter(d => d !== null)
                                          )];
                                          
                                          const numDeliveries = uniqueDates.length || 1;
                                          const feePerDelivery = Math.round((group.shippingFee || 0) / numDeliveries);
                                          const productsInBatch = productsOnSameDate.length || 1;
                                          
                                          productShippingFee = Math.round(feePerDelivery / productsInBatch);
                                        }

                                        return productShippingFee > 0 ? (
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">
                                              {t("rentalOrderForm.shippingFee")}:
                                            </span>
                                            <span className="font-semibold text-blue-600">
                                              {productShippingFee.toLocaleString("vi-VN")}đ
                                            </span>
                                          </div>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Shipping Info Button */}
                        {orderData.deliveryMethod === "DELIVERY" && group.deliveryInfo && group.shippingFee > 0 && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedShippingInfo(group);
                                setShowShippingModal(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                            >
                              <Lightbulb className="w-4 h-4" />
                              <span className="text-sm font-medium">{t("rentalOrderForm.shippingCalculation")}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

            {/* Delivery Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                {t("rentalOrderForm.deliveryMethod")}
              </h2>
              <div className="space-y-3">

  <label className="flex items-center space-x-3 cursor-pointer">
  <input
    type="radio"
    value="DELIVERY"
    checked={orderData.deliveryMethod === 'DELIVERY'}
    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
    className="w-4 h-4 text-blue-500"
  />
  <span>{t("rentalOrderForm.delivery")}</span>
</label>
              </div>
            </div>
            
            {showAddressModal && (
              <AddressSelectionModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                userAddresses={userAddresses}
                onSelect={handleAddressFromModal}
              />
            )}

              {orderData.deliveryMethod === "OWNER_DELIVERY" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Địa chỉ giao hàng
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Địa chỉ chi tiết
                      </label>
                      <MapSelector
                        onLocationSelect={handleAddressSelect}
                        initialAddress={orderData.deliveryAddress.streetAddress}
                        placeholder="Chọn địa chỉ trên bản đồ..."
                        className={errors.streetAddress ? "border-red-500" : ""}
                      />
                      {errors.streetAddress && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.streetAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {orderData.deliveryMethod === "DELIVERY" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {t("rentalOrderForm.deliveryAddress")}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("rentalOrderForm.detailedAddress")}
                      </label>
                      <MapSelector
                        onLocationSelect={handleAddressSelect}
                        initialAddress={orderData.deliveryAddress.streetAddress}
                        placeholder={t("rentalOrderForm.selectOnMap")}
                        className={errors.streetAddress ? "border-red-500" : ""}
                      />
                      {errors.streetAddress && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.streetAddress}
                        </p>
                      )}

                      
                    </div>
                   

                    {/* Hiển thị thông tin địa chỉ từ map (read-only) */}
                    {orderData.deliveryAddress.latitude &&
                      orderData.deliveryAddress.longitude && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">
                            {t("rentalOrderForm.mapAddress")}
                          </h4>
                          <div className="space-y-1 text-sm text-blue-700">
                            {orderData.deliveryAddress.streetAddress && (
                              <p>
                                <span className="font-medium">{t("rentalOrderForm.address")}:</span>{" "}
                                {orderData.deliveryAddress.streetAddress}
                              </p>
                            )}
                            {orderData.deliveryAddress.ward && (
                              <p>
                                <span className="font-medium">{t("rentalOrderForm.ward")}:</span>{" "}
                                {orderData.deliveryAddress.ward}
                              </p>
                            )}
                            {orderData.deliveryAddress.district && (
                              <p>
                                <span className="font-medium">{t("rentalOrderForm.district")}:</span>{" "}
                                {orderData.deliveryAddress.district}
                              </p>
                            )}
                            {orderData.deliveryAddress.city && (
                              <p>
                                <span className="font-medium">{t("rentalOrderForm.city")}:</span>{" "}
                                {orderData.deliveryAddress.city}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setOrderData((prev) => ({
                                ...prev,
                                deliveryAddress: {
                                  ...prev.deliveryAddress,
                                  latitude: null,
                                  longitude: null,
                                  streetAddress: "",
                                  ward: "",
                                  district: "",
                                  city: "",
                                },
                              }))
                            }
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {t("rentalOrderForm.changeAddress")}
                          </button>
                        </div>
                      )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("rentalOrderForm.recipientName")}
                        </label>
                        <input
                          type="text"
                          value={orderData.deliveryAddress.contactName}
                          onChange={(e) =>
                            setOrderData((prev) => ({
                              ...prev,
                              deliveryAddress: {
                                ...prev.deliveryAddress,
                                contactName: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("rentalOrderForm.phoneNumber")}
                        </label>
                        <input
                          type="tel"
                          value={orderData.deliveryAddress.contactPhone}
                          onChange={(e) =>
                            setOrderData((prev) => ({
                              ...prev,
                              deliveryAddress: {
                                ...prev.deliveryAddress,
                                contactPhone: e.target.value,
                              },
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.contactPhone
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {errors.contactPhone && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.contactPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calculate Shipping Button */}
                  <button
                    onClick={handleCalculateShipping}
                    disabled={isCalculatingShipping}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isCalculatingShipping
                      ? t("rentalOrderForm.calculating")
                      : t("rentalOrderForm.calculateShipping")}
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
                    {isCreatingDraft ? t("rentalOrderForm.creating") : t("rentalOrderForm.createOrder")}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">{t("rentalOrderForm.orderSummary")}</h3>

                {/* Active Promotion Banner (Auto-applied) */}
                {activePromotion && !loadingPromotion && (
                  <div className="mb-4 pb-4 border-b">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Tag className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 text-sm">
                            ✨ {activePromotion.title}
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            {activePromotion.description}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">
                            <TrendingDown className="w-3 h-3" />
                            Giảm{" "}
                            {activePromotion.systemPromotion.discountType ===
                            "PERCENTAGE"
                              ? `${activePromotion.systemPromotion.shippingDiscountValue}%`
                              : `${activePromotion.systemPromotion.shippingDiscountValue.toLocaleString(
                                  "vi-VN"
                                )}đ`}{" "}
                            phí ship
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voucher Selector */}
                <div className="mb-4">
                  <VoucherSelector
                    onVoucherSelect={setSelectedVoucher}
                    selectedVoucher={selectedVoucher}
                    shippingFee={totals.totalShipping}
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("rentalOrderForm.numProducts")}:</span>
                    <span>
                      {directRentalData
                        ? directRentalData.quantity || 1
                        : cartItems?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentalOrderForm.rentalDays")}:</span>
                    <span>{totals.duration} {t("rentalOrderForm.days")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentalOrderForm.totalRental")}:</span>
                    <span>{totals.totalRental.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentalOrderForm.totalDeposit")}:</span>
                    <span>{totals.totalDeposit.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("rentalOrderForm.shippingTotal")}:</span>
                    <span
                      className={
                        activePromotion || selectedVoucher
                          ? "line-through text-gray-400"
                          : ""
                      }
                    >
                      {totals.totalShipping.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {activePromotion && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>{t("rentalOrderForm.shippingDiscountPromotion")}:</span>
                        <span>
                          -
                          {(() => {
                            const discount =
                              activePromotion.systemPromotion.discountType ===
                              "PERCENTAGE"
                                ? (totals.totalShipping *
                                    activePromotion.systemPromotion
                                      .shippingDiscountValue) /
                                  100
                                : Math.min(
                                    activePromotion.systemPromotion
                                      .shippingDiscountValue,
                                    totals.totalShipping
                                  );
                            return discount.toLocaleString("vi-VN");
                          })()}
                          đ
                        </span>
                      </div>
                    </>
                  )}
                  {selectedVoucher && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        {t("rentalOrderForm.shippingDiscountVoucher")} ({selectedVoucher.discountPercent}%):
                      </span>
                      <span>
                        -
                        {(() => {
                          const baseShipping = activePromotion
                            ? totals.totalShipping -
                              (activePromotion.systemPromotion.discountType ===
                              "PERCENTAGE"
                                ? (totals.totalShipping *
                                    activePromotion.systemPromotion
                                      .shippingDiscountValue) /
                                  100
                                : Math.min(
                                    activePromotion.systemPromotion
                                      .shippingDiscountValue,
                                    totals.totalShipping
                                  ))
                            : totals.totalShipping;
                          const voucherDiscount = Math.round(
                            (baseShipping * selectedVoucher.discountPercent) /
                              100
                          );
                          return voucherDiscount.toLocaleString("vi-VN");
                        })()}
                        đ
                      </span>
                    </div>
                  )}
                  {(activePromotion || selectedVoucher) && (
                    <div className="flex justify-between font-medium">
                      <span>{t("rentalOrderForm.shippingAfterDiscount")}:</span>
                      <span className="text-green-600">
                        {(() => {
                          let finalShipping = totals.totalShipping;

                          // Apply promotion discount first
                          if (activePromotion) {
                            const discount =
                              activePromotion.systemPromotion.discountType ===
                              "PERCENTAGE"
                                ? (totals.totalShipping *
                                    activePromotion.systemPromotion
                                      .shippingDiscountValue) /
                                  100
                                : Math.min(
                                    activePromotion.systemPromotion
                                      .shippingDiscountValue,
                                    totals.totalShipping
                                  );
                            finalShipping -= discount;
                          }

                          // Apply voucher discount on remaining amount
                          if (selectedVoucher) {
                            const voucherDiscount = Math.round(
                              (finalShipping *
                                selectedVoucher.discountPercent) /
                                100
                            );
                            finalShipping -= voucherDiscount;
                          }

                          return Math.max(0, finalShipping).toLocaleString(
                            "vi-VN"
                          );
                        })()}
                        đ
                      </span>
                    </div>
                  )}
                  <hr className="my-3" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t("rentalOrderForm.grandTotal")}:</span>
                    <span className="text-blue-600">
                      {(() => {
                        let finalShipping = totals.totalShipping;

                        // Apply promotion discount
                        if (activePromotion) {
                          const discount =
                            activePromotion.systemPromotion.discountType ===
                            "PERCENTAGE"
                              ? (totals.totalShipping *
                                  activePromotion.systemPromotion
                                    .shippingDiscountValue) /
                                100
                              : Math.min(
                                  activePromotion.systemPromotion
                                    .shippingDiscountValue,
                                  totals.totalShipping
                                );
                          finalShipping -= discount;
                        }

                        // Apply voucher discount
                        if (selectedVoucher) {
                          const voucherDiscount = Math.round(
                            (finalShipping * selectedVoucher.discountPercent) /
                              100
                          );
                          finalShipping -= voucherDiscount;
                        }

                        finalShipping = Math.max(0, finalShipping);
                        const grandTotal =
                          totals.totalRental +
                          totals.totalDeposit +
                          finalShipping;

                        return grandTotal.toLocaleString("vi-VN");
                      })()}
                      đ
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    {t("rentalOrderForm.depositNote")}
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

        {/* Shipping Calculation Modal */}
        {showShippingModal && selectedShippingInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  💡 Cách tính phí vận chuyển
                </h3>
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Total Shipping Fee */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Tổng phí vận chuyển:
                    </span>
                    <span className="font-bold text-blue-700 text-xl">
                      {(selectedShippingInfo.shippingFee || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {/* Calculation Formula */}
                {selectedShippingInfo.deliveryInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-800 mb-3">📝 Công thức tính:</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Phí ship = Số lần giao hàng × (15,000đ cơ bản + Khoảng cách × 5,000đ/km)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Sản phẩm cùng ngày giao = 1 lần giao = 1 phí ship</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Phí ship được chia đều cho các sản phẩm trong cùng chuyến giao</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Tối thiểu: 20,000đ/lần giao | Tối đa: 100,000đ/lần giao</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Statistics */}
                {selectedShippingInfo.deliveryInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white border rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Số lần giao</div>
                      <div className="text-lg font-semibold text-green-700">
                        {selectedShippingInfo.deliveryInfo.deliveryCount || 1} lần
                      </div>
                    </div>
                    {selectedShippingInfo.deliveryInfo.distance && (
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Khoảng cách</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {typeof selectedShippingInfo.deliveryInfo.distance === "number"
                            ? selectedShippingInfo.deliveryInfo.distance.toFixed(2)
                            : selectedShippingInfo.deliveryInfo.distance}
                          km
                        </div>
                      </div>
                    )}
                    <div className="bg-white border rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Trung bình/lần</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {Math.round(
                          (selectedShippingInfo.shippingFee || 0) /
                            (selectedShippingInfo.deliveryInfo?.deliveryCount || 1)
                        ).toLocaleString("vi-VN")}
                        đ
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Batches Breakdown */}
                {selectedShippingInfo.deliveryInfo?.deliveryBatches &&
                  selectedShippingInfo.deliveryInfo.deliveryBatches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Chi tiết giao hàng theo ngày:
                      </h4>
                      <div className="space-y-2">
                        {selectedShippingInfo.deliveryInfo.deliveryBatches.map((batch, index) => (
                          <div key={index} className="bg-white border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">
                                📅 {new Date(batch.deliveryDate).toLocaleDateString("vi-VN")}
                              </span>
                              <span className="font-bold text-blue-600">
                                {batch.deliveryFee?.toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {batch.batchSize || batch.products?.length || 0} sản phẩm, {batch.batchQuantity || 0} món
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Calculation Example */}
                {selectedShippingInfo.deliveryInfo?.summary && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">✅ Tính toán:</h4>
                    <div className="text-sm text-gray-700">
                      {selectedShippingInfo.deliveryInfo.deliveryCount} lần giao ×{" "}
                      {Math.round(
                        (selectedShippingInfo.shippingFee || 0) /
                          (selectedShippingInfo.deliveryInfo.deliveryCount || 1)
                      ).toLocaleString("vi-VN")}
                      đ ={" "}
                      <span className="font-semibold text-green-700">
                        {(selectedShippingInfo.shippingFee || 0).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t p-4">
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Payment Modal for COD */}
        {showDepositModal && depositModalData && (
          <DepositPaymentModal
            depositAmount={depositModalData.depositAmount}
            totalAmount={depositModalData.totalAmount}
            onSelect={depositModalData.onSelect}
            onCancel={depositModalData.onCancel}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("RentalOrderForm Error:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Lỗi tải trang
          </h2>
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

// Deposit Payment Modal Component for COD orders
const DepositPaymentModal = ({
  depositAmount,
  totalAmount,
  onSelect,
  onCancel,
}) => {
  const { t } = useI18n();
  const [selectedMethod, setSelectedMethod] = useState("");

  const depositMethods = [
    {
      key: "WALLET",
      title: t("rentalOrders.depositPaymentModal.ewallet"),
      description: t("rentalOrders.depositPaymentModal.ewalletDesc"),
      icon: <HiCreditCard className="text-2xl text-blue-600" />,
    },
    {
      key: "PAYOS",
      title: t("rentalOrders.depositPaymentModal.bankTransfer"),
      description: t("rentalOrders.depositPaymentModal.bankTransferDesc"),
      icon: <PiBank  className="text-2xl text-green-600" />,
    },
  ];

  const remainingAmount = totalAmount - depositAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <PiHandDeposit  className="text-orange-600" />
          {t("rentalOrders.depositPaymentModal.title")}
        </h2>

        {/* Amount breakdown */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>{t("rentalOrders.depositPaymentModal.totalOrder")}</span>
              <span className="font-medium">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between text-orange-600">
              <span>{t("rentalOrders.depositPaymentModal.depositAmount")}</span>
              <span className="font-bold">
                {depositAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between text-gray-600 border-t pt-2">
              <span>{t("rentalOrders.depositPaymentModal.remainingAmount")}</span>
              <span>{remainingAmount.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {t("rentalOrders.depositPaymentModal.selectPaymentMethod")}
        </p>

        <div className="space-y-3 mb-6">
          {depositMethods.map((method) => (
            <div
              key={method.key}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMethod === method.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedMethod(method.key)}
            >
              <div className="flex items-start space-x-3">
                <div>{method.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="depositMethod"
                      value={method.key}
                      checked={selectedMethod === method.key}
                      onChange={() => setSelectedMethod(method.key)}
                      className="text-blue-500"
                    />
                    <h3 className="font-medium">{method.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t("rentalOrders.depositPaymentModal.cancel")}
          </button>
          <button
            onClick={() => selectedMethod && onSelect(selectedMethod)}
            disabled={!selectedMethod}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("rentalOrders.depositPaymentModal.submitPayment")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalOrderForm;
