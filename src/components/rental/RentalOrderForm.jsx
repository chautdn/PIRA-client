import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useRentalOrder } from "../../context/RentalOrderContext";
import { useAuth } from "../../hooks/useAuth";
import {
  Calendar,
  MapPin,
  Truck,
  CreditCard,
  Clock,
  Package,
  Tag,
  TrendingDown,
} from "lucide-react";
import MapSelector from "../common/MapSelector";
import PaymentMethodSelector from "../common/PaymentMethodSelector";
import VoucherSelector from "../voucher/VoucherSelector";
import { toast } from "../common/Toast";
import paymentService from "../../services/payment";
import rentalOrderService from "../../services/rentalOrder";
import systemPromotionService from "../../services/systemPromotion";

const RentalOrderForm = () => {
  try {
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

    // Debug effect - only runs once
    useEffect(() => {
      console.log("RentalOrderForm: Component mounted");
      console.log("RentalOrderForm: User loaded:", user ? "Yes" : "No");
      console.log(
        "RentalOrderForm: Cart loaded:",
        cartItems ? cartItems.length : "No cart"
      );
      console.log("RentalOrderForm: Selected items:", selectedItems);
      console.log("RentalOrderForm: From cart:", fromCart);
      console.log(
        "RentalOrderForm: RentalOrder context loaded:",
        !!rentalOrderContext
      );
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
      contactPhone: (user && user.profile && user.profile.phone) ? user.profile.phone : '',
      contactName: (user && user.profile && user.profile.fullName) ? user.profile.fullName : ''
    },
    deliveryMethod: 'DELIVERY',
  }));

    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [groupedProducts, setGroupedProducts] = useState({});
    const [totalShipping, setTotalShipping] = useState(0);
    const [showPaymentSelector, setShowPaymentSelector] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositModalData, setDepositModalData] = useState(null);
    const [activePromotion, setActivePromotion] = useState(null);
    const [loadingPromotion, setLoadingPromotion] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    // Update contact info when user changes
    useEffect(() => {
      if (user && user.profile) {
        setOrderData((prev) => ({
          ...prev,
          deliveryAddress: {
            ...prev.deliveryAddress,
            contactPhone:
              user.profile.phone || prev.deliveryAddress.contactPhone,
            contactName:
              user.profile.fullName || prev.deliveryAddress.contactName,
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
          console.error("Failed to load active promotion:", error);
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
        console.log("🎯 Using direct rental data:", directRentalData);
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
        console.log("🎯 Using selected items from cart:", selectedItems);
        sourceItems = selectedItems;
      } else if (cartItems && Array.isArray(cartItems)) {
        console.log("🎯 Using all cart items:", cartItems);
        sourceItems = cartItems;
      } else {
        return;
      }
      const grouped = {};
      let earliestStart = null;
      let latestEnd = null;

      sourceItems.forEach((item) => {
        // Validate item structure
        if (!item?.product?.owner?._id) {
          console.warn("Item missing owner data:", item);
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
      console.log("RentalOrderForm: Grouped products:", grouped);

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

      return {
        duration: totalDays,
        totalRental,
        totalDeposit,
        totalShipping,
        grandTotal: totalRental + totalDeposit + totalShipping,
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
        // NEW LOGIC: Calculate shipping per SubOrder (per Owner) with delivery batches
        // Each Owner's products are grouped by delivery date separately

        let masterTotalShipping = 0;
        const updatedGroups = { ...groupedProducts };

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

          console.log(`📦 Owner ${ownerId} delivery batches:`, deliveryBatches);

          let subOrderTotalShipping = 0;
          const subOrderDeliveries = [];
          let deliveryCount = 0;

          // Calculate shipping for each delivery batch (same owner, same date = 1 delivery trip)
          for (const [deliveryDate, batchProducts] of Object.entries(
            deliveryBatches
          )) {
            deliveryCount++;

            try {
              const ownerLocation = {
                latitude: group.owner.address?.coordinates?.latitude || null,
                longitude: group.owner.address?.coordinates?.longitude || null,
              };
              console.log("group", group);
              console.log("Owner Location:", ownerLocation);

              const userLocation = {
                latitude: orderData.deliveryAddress.latitude || null,
                longitude: orderData.deliveryAddress.longitude || null,
              };
              console.log("User Location:", userLocation);

              const hasOwnerCoords =
                ownerLocation.latitude && ownerLocation.longitude;
              const hasUserCoords =
                userLocation.latitude && userLocation.longitude;

              let batchFee = 0;
              let batchInfo = null;

              if (!hasOwnerCoords || !hasUserCoords) {
                // Fallback: Default fee calculation per delivery batch
                const baseShippingFee = 20000; // 20k per delivery trip
                const perProductFee = 3000; // 3k per product in batch
                const totalQuantity = batchProducts.reduce(
                  (sum, p) => sum + (p.quantity || 1),
                  0
                );
                batchFee = baseShippingFee + perProductFee * totalQuantity;

                batchInfo = {
                  deliveryDate,
                  batchSize: batchProducts.length,
                  batchQuantity: totalQuantity,
                  deliveryFee: batchFee,
                  distance: hasOwnerCoords
                    ? "Chưa có địa chỉ nhận"
                    : "Chưa có địa chỉ gửi",
                  fallback: true,
                  products: batchProducts.map((p) => ({
                    productId: p.product._id,
                    quantity: p.quantity || 1,
                    allocatedFee: Math.round(batchFee / batchProducts.length),
                  })),
                };

                console.warn(
                  `⚠️ Owner ${group.owner.profile?.firstName} batch ${deliveryDate} - Missing coords, fallback: ${batchFee}`
                );
              } else {
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
    latitude: group.owner.address?.coordinates?.latitude || null,
    longitude: group.owner.address?.coordinates?.longitude || null,
    streetAddress: group.owner.address?.streetAddress || "Địa chỉ không xác định", // Thêm streetAddress
  },
  deliveryAddress: {
    latitude: orderData.deliveryAddress.latitude || null,
    longitude: orderData.deliveryAddress.longitude || null,
    streetAddress: orderData.deliveryAddress.streetAddress || "Địa chỉ không xác định", // Thêm streetAddress
  },
  products,
};
                console.log(
                  `🚚 Calculating batch shipping for ${deliveryDate}:`,
                  products.length,
                  "products"
                );
                const shippingResponse =
                  await calculateShipping(shippingData);

                if (
                  shippingResponse?.success &&
                  shippingResponse.metadata?.shipping
                ) {
                  const shipping = shippingResponse.metadata.shipping;
                  batchFee = shipping.totalShippingFee || 20000;

                  batchInfo = {
                    deliveryDate,
                    batchSize: batchProducts.length,
                    batchQuantity: batchProducts.reduce(
                      (sum, p) => sum + (p.quantity || 1),
                      0
                    ),
                    deliveryFee: batchFee,
                    distance: shipping.distance,
                    fallback: false,
                    deliveryBatches: shipping.deliveryBatches || [],
                    products: shipping.productFees || [],
                    summary: shipping.summary,
                  };
                } else {
                  // API failed, use fallback
                  batchFee = 25000;
                  batchInfo = {
                    deliveryDate,
                    deliveryFee: batchFee,
                    fallback: true,
                    error: "API calculation failed",
                  };
                }
              }

              // Add batch fee to SubOrder total
              subOrderTotalShipping += batchFee;
              subOrderDeliveries.push(batchInfo);

              console.log(
                `✅ Delivery batch ${deliveryDate} - Owner ${
                  group.owner.profile?.firstName
                }: ${batchFee.toLocaleString("vi-VN")}đ`
              );
            } catch (error) {
              console.error(
                `❌ Error calculating batch ${deliveryDate} for owner ${ownerId}:`,
                error
              );

              // Fallback for this batch
              const fallbackFee = 25000;
              subOrderTotalShipping += fallbackFee;
              subOrderDeliveries.push({
                deliveryDate,
                deliveryFee: fallbackFee,
                fallback: true,
                error: error.message,
              });
            }
          }

          // Update SubOrder shipping info
          updatedGroups[ownerId].shippingFee = subOrderTotalShipping;
          updatedGroups[ownerId].deliveryInfo = {
            deliveryCount,
            deliveryBatches: subOrderDeliveries,
            distance: subOrderDeliveries[0]?.distance || "Unknown",
            summary: `${deliveryCount} lần giao hàng`,
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

        console.log("🎯 Final SubOrder-based shipping calculation:", {
          masterTotalShipping:
            masterTotalShipping.toLocaleString("vi-VN") + "đ",
          totalSubOrders: Object.keys(updatedGroups).length,
          subOrderBreakdown: Object.keys(updatedGroups).map((ownerId) => ({
            ownerId,
            ownerName:
              updatedGroups[ownerId].owner?.profile?.firstName || "Unknown",
            subOrderShipping:
              updatedGroups[ownerId].shippingFee.toLocaleString("vi-VN") + "đ",
            deliveryCount: updatedGroups[ownerId].deliveryInfo.deliveryCount,
            deliveryDates: updatedGroups[
              ownerId
            ].deliveryInfo.deliveryBatches.map((b) => b.deliveryDate),
          })),
        });

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

      // Show payment method selector
      setShowPaymentSelector(true);
    };

    // Handle payment method selection and process different payment types
    const handlePaymentMethodSelect = async (paymentMethod) => {
      console.log("🚀 Processing payment with method:", paymentMethod);
      console.log("� Total amount:", totals.grandTotal);

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
            // Redirect to PayOS payment gateway
            paymentResult = await processPayOSPayment(
              paymentMethod,
              totals.grandTotal
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
        const orderWithPayment = {
          ...orderData,
          paymentMethod: paymentMethod,
          totalAmount: totals.grandTotal,
          paymentTransactionId: paymentResult.transactionId,
          paymentMessage: paymentResult.message,
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
        console.log("💵 Processing COD with mandatory deposit");
        console.log("📊 Current totals:", totals);

        // Calculate total deposit from all items via backend API
        const totalDeposit = await calculateTotalDeposit();
        console.log("💰 Total deposit calculated:", {
          amount: totalDeposit,
          formatted: totalDeposit.toLocaleString("vi-VN") + "đ",
          isValid: totalDeposit > 0,
        });

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
        console.log("💰 Fetching deposit calculation from backend...");

        // Use rentalOrderService instead of direct fetch
        const result = await rentalOrderService.calculateDeposit();
        console.log("💰 Deposit calculation result:", result);

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

          console.log("💳 Item deposit:", {
            productName: item.product?.title || item.product?.name,
            quantity: item.quantity,
            depositPerUnit: deposit,
            itemTotal: deposit * item.quantity,
          });

          return total + deposit * item.quantity;
        }, 0);

        console.log("💰 Fallback deposit total:", fallbackDeposit);

        // If still 0, provide a meaningful error
        if (fallbackDeposit <= 0) {
          console.error("❌ No deposit found in fallback calculation");
          console.log("🔍 Debug info:", {
            finalItems,
            fromCart,
            selectedItems,
            directRentalData,
            cartItems,
          });
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
              {directRentalData ? "Lỗi dữ liệu thuê" : "Giỏ thuê trống"}
            </h2>
            <p className="text-gray-600 mb-4">
              {directRentalData
                ? "Dữ liệu thuê không hợp lệ. Vui lòng thử lại."
                : "Vui lòng thêm sản phẩm vào giỏ trước khi tạo đơn thuê"}
            </p>
            <button
              onClick={() => navigate("/products")}
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
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl font-bold">
              {directRentalData ? "Thuê Ngay" : "Tạo Đơn Thuê"}
            </h1>
            {directRentalData && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                ⚡ Thuê trực tiếp
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
                  Thông tin thuê chi tiết
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
                          📦 Đơn hàng #{groupIndex + 1} - Chủ cho thuê:{" "}
                          {group.owner.profile?.firstName || "Không rõ"}
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
                                          Số lượng:{" "}
                                          <span className="font-medium">
                                            {item.quantity}
                                          </span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Giá thuê:{" "}
                                          <span className="font-medium">
                                            {(
                                              item.product.pricing?.dailyRate ||
                                              item.product.price ||
                                              0
                                            ).toLocaleString("vi-VN")}
                                            đ/ngày
                                          </span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Tiền cọc:{" "}
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
                                            ⏰ Thời gian thuê:
                                          </p>
                                          {itemStartDate && itemEndDate ? (
                                            <>
                                              <p className="text-xs text-gray-700">
                                                <span className="font-medium">
                                                  Từ:
                                                </span>{" "}
                                                {itemStartDate.toLocaleDateString(
                                                  "vi-VN"
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-700">
                                                <span className="font-medium">
                                                  Đến:
                                                </span>{" "}
                                                {itemEndDate.toLocaleDateString(
                                                  "vi-VN"
                                                )}
                                              </p>
                                              <p className="text-sm font-semibold text-blue-700 mt-1">
                                                Tổng: {itemDuration} ngày
                                              </p>
                                            </>
                                          ) : (
                                            <p className="text-xs text-gray-500">
                                              Chưa có thông tin thời gian thuê
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                          Tổng tiền thuê:
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
                                          Tổng tiền cọc:
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
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Delivery Batch Shipping Information */}
                        {orderData.deliveryMethod === "DELIVERY" && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">
                              🚚 Thông tin vận chuyển
                            </h4>

                            {/* SubOrder Level Shipping */}
                            <div className="mb-3 p-3 bg-white rounded border">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700 font-medium">
                                  Tổng phí vận chuyển SubOrder:
                                </span>
                                <span className="font-bold text-blue-700 text-lg">
                                  {(group.shippingFee || 0).toLocaleString(
                                    "vi-VN"
                                  )}
                                  đ
                                </span>
                              </div>

                              {/* Shipping Calculation Explanation */}
                              {group.deliveryInfo && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                  <div className="font-medium text-blue-800 mb-1">
                                    💡 Cách tính phí:
                                  </div>
                                  <div className="text-blue-700 space-y-1">
                                    <div>
                                      • Phí ship = Số lần giao hàng × (15,000đ
                                      cơ bản + Khoảng cách × 5,000đ/km)
                                    </div>
                                    <div>
                                      • Sản phẩm cùng ngày giao = 1 lần giao = 1
                                      phí ship
                                    </div>
                                    <div>
                                      • Phí ship được chia đều cho các sản phẩm
                                      trong cùng chuyến giao
                                    </div>
                                    <div>
                                      • Tối thiểu: 20,000đ/lần giao | Tối đa:
                                      100,000đ/lần giao
                                    </div>
                                    {group.deliveryInfo.distance && (
                                      <div>
                                        • Khoảng cách:{" "}
                                        {typeof group.deliveryInfo.distance ===
                                        "object"
                                          ? group.deliveryInfo.distance.km
                                          : group.deliveryInfo.distance}
                                        km
                                      </div>
                                    )}
                                    {group.deliveryInfo.summary && (
                                      <div>
                                        • Tổng:{" "}
                                        {group.deliveryInfo.deliveryCount} lần
                                        giao ×{" "}
                                        {Math.round(
                                          (group.shippingFee || 0) /
                                            (group.deliveryInfo.deliveryCount ||
                                              1)
                                        ).toLocaleString("vi-VN")}
                                        đ ={" "}
                                        {(
                                          group.shippingFee || 0
                                        ).toLocaleString("vi-VN")}
                                        đ
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Shipping Per Product */}
                              <div className="mt-2 space-y-1">
                                <div className="text-xs text-gray-600 font-medium mb-1">
                                  📦 Chi tiết phí ship theo sản phẩm:
                                </div>
                                {group.products.map((item, prodIndex) => {
                                  // Calculate shipping fee per product based on delivery batch system
                                  let productDuration = 1;
                                  let deliveryDate = null;

                                  if (
                                    item.rental?.startDate &&
                                    item.rental?.endDate
                                  ) {
                                    const startDate = new Date(
                                      item.rental.startDate
                                    );
                                    const endDate = new Date(
                                      item.rental.endDate
                                    );
                                    const diffTime = Math.abs(
                                      endDate - startDate
                                    );
                                    productDuration =
                                      Math.ceil(
                                        diffTime / (1000 * 60 * 60 * 24)
                                      ) || 1;
                                    deliveryDate =
                                      startDate.toLocaleDateString("vi-VN");
                                  }

                                  console.log(
                                    `🔍 Product ${prodIndex} - ${item.product.title}:`,
                                    {
                                      productId: item.product._id,
                                      deliveryInfo: group.deliveryInfo,
                                      productFees:
                                        group.deliveryInfo?.productFees,
                                      productShippingDetails:
                                        group.deliveryInfo
                                          ?.productShippingDetails,
                                    }
                                  );

                                  // Find product shipping fee from detailed shipping info
                                  let productShippingFee = 0;
                                  let deliveryBatchInfo = null;

                                  // Try to find product shipping fee from backend calculation
                                  if (group.deliveryInfo?.productFees) {
                                    // Look for product fee by productId
                                    const productFee =
                                      group.deliveryInfo.productFees.find(
                                        (fee) =>
                                          fee.productId === item.product._id
                                      );

                                    if (productFee) {
                                      productShippingFee =
                                        productFee.allocatedFee || 0;
                                      deliveryBatchInfo = {
                                        deliveryDate: new Date(
                                          productFee.deliveryDate
                                        ).toLocaleDateString("vi-VN"),
                                        batchSize:
                                          productFee.breakdown?.batchSize || 1,
                                        totalBatchFee:
                                          productFee.breakdown?.deliveryFee ||
                                          0,
                                        distance: productFee.distance,
                                      };
                                    }
                                  }

                                  // If not found in productFees, try deliveryBatches
                                  if (
                                    productShippingFee === 0 &&
                                    group.deliveryInfo?.productShippingDetails
                                  ) {
                                    const productDetail =
                                      group.deliveryInfo.productShippingDetails.find(
                                        (batch) =>
                                          batch.products?.some(
                                            (p) =>
                                              p.productId === item.product._id
                                          )
                                      );

                                    if (productDetail) {
                                      const productInfo =
                                        productDetail.products.find(
                                          (p) =>
                                            p.productId === item.product._id
                                        );
                                      productShippingFee =
                                        productInfo?.allocatedFee || 0;
                                      deliveryBatchInfo = {
                                        deliveryDate: new Date(
                                          productDetail.deliveryDate
                                        ).toLocaleDateString("vi-VN"),
                                        batchSize: productDetail.batchSize,
                                        totalBatchFee:
                                          productDetail.deliveryFee,
                                      };
                                    }
                                  }

                                  // Final fallback - divide total shipping equally
                                  if (productShippingFee === 0) {
                                    const totalProductCount =
                                      group.products.length;
                                    productShippingFee = Math.round(
                                      (group.shippingFee || 0) /
                                        totalProductCount
                                    );
                                    deliveryBatchInfo = {
                                      deliveryDate:
                                        deliveryDate || "Chưa xác định",
                                      batchSize: totalProductCount,
                                      totalBatchFee: group.shippingFee || 0,
                                      note: "Phí được chia đều (fallback)",
                                    };
                                  }

                                  return (
                                    <div
                                      key={prodIndex}
                                      className="bg-gray-50 p-2 rounded border-l-2 border-blue-300"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-700 text-xs">
                                            {item.product.title ||
                                              item.product.name}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                                            <div>
                                              📦 SL: {item.quantity} | ⏱️{" "}
                                              {productDuration} ngày
                                            </div>
                                            {deliveryDate && (
                                              <div>
                                                🚚 Giao ngày: {deliveryDate}
                                              </div>
                                            )}
                                            {deliveryBatchInfo && (
                                              <div className="text-xs text-blue-600">
                                                📋 Batch:{" "}
                                                {deliveryBatchInfo.batchSize} SP
                                                ={" "}
                                                {deliveryBatchInfo.totalBatchFee?.toLocaleString(
                                                  "vi-VN"
                                                )}
                                                đ
                                                {deliveryBatchInfo.distance && (
                                                  <span className="ml-1">
                                                    (
                                                    {deliveryBatchInfo.distance}
                                                    km)
                                                  </span>
                                                )}
                                                {deliveryBatchInfo.note && (
                                                  <div className="text-orange-600 mt-1">
                                                    {deliveryBatchInfo.note}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-semibold text-blue-600 text-sm">
                                            {productShippingFee.toLocaleString(
                                              "vi-VN"
                                            )}
                                            đ
                                          </span>
                                          {deliveryBatchInfo && (
                                            <div className="text-xs text-gray-500">
                                              /{deliveryBatchInfo.batchSize} SP
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Delivery Batch Details */}
                            {group.deliveryInfo ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      Số lần giao:
                                    </span>
                                    <span className="ml-2 font-semibold text-green-700">
                                      {group.deliveryInfo.deliveryCount || 1}{" "}
                                      lần
                                    </span>
                                  </div>
                                  {group.deliveryInfo.distance && (
                                    <div>
                                      <span className="text-gray-600">
                                        Khoảng cách:
                                      </span>
                                      <span className="ml-2 text-gray-800">
                                        {group.deliveryInfo.distance.km ||
                                          group.deliveryInfo.distance}
                                        km
                                      </span>
                                    </div>
                                  )}
                                  {group.deliveryInfo.summary && (
                                    <div>
                                      <span className="text-gray-600">
                                        Trung bình/lần:
                                      </span>
                                      <span className="ml-2 text-gray-800">
                                        {Math.round(
                                          (group.shippingFee || 0) /
                                            (group.deliveryInfo.deliveryCount ||
                                              1)
                                        ).toLocaleString("vi-VN")}
                                        đ
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Delivery Batches Breakdown */}
                                {group.deliveryInfo.deliveryBatches &&
                                  group.deliveryInfo.deliveryBatches.length >
                                    0 && (
                                    <div className="mt-3 border-t pt-2">
                                      <div className="text-xs text-gray-600 mb-2 flex items-center">
                                        <Package className="w-3 h-3 mr-1" />
                                        Chi tiết giao hàng theo ngày:
                                      </div>
                                      <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {group.deliveryInfo.deliveryBatches.map(
                                          (batch, index) => (
                                            <div
                                              key={index}
                                              className="text-xs bg-white p-2 rounded border"
                                            >
                                              <div className="flex justify-between items-center">
                                                <span className="text-gray-700">
                                                  Ngày{" "}
                                                  {new Date(
                                                    batch.deliveryDate
                                                  ).toLocaleDateString("vi-VN")}
                                                </span>
                                                <span className="font-medium text-blue-600">
                                                  {batch.deliveryFee?.toLocaleString(
                                                    "vi-VN"
                                                  )}
                                                  đ
                                                </span>
                                              </div>
                                              <div className="text-gray-500 mt-1">
                                                {batch.batchSize ||
                                                  batch.products?.length ||
                                                  0}{" "}
                                                sản phẩm,
                                                {batch.batchQuantity || 0} món
                                              </div>
                                            </div>
                                          )
                                        )}
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
                                  <span>
                                    💡 Nhấn "Tính phí ship" để xem chi tiết giao
                                    hàng theo ngày
                                  </span>
                                </div>
                              </div>
                            )}
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
                Hình thức nhận hàng
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
  <span>Giao tận nơi (Có phí ship)</span>
</label>
              </div>
            </div>

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

                      {/* Map location status */}
                      {orderData.deliveryAddress.latitude &&
                        orderData.deliveryAddress.longitude && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-700 flex items-center">
                              <span className="mr-2">✅</span>
                              Địa chỉ đã được chọn từ bản đồ - Không cần nhập
                              thủ công
                            </p>
                          </div>
                        )}

                      {/* Fallback manual input - only show if no map location */}
                      {!orderData.deliveryAddress.latitude &&
                        !orderData.deliveryAddress.longitude && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={orderData.deliveryAddress.streetAddress}
                              onChange={(e) =>
                                setOrderData((prev) => ({
                                  ...prev,
                                  deliveryAddress: {
                                    ...prev.deliveryAddress,
                                    streetAddress: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Hoặc nhập thủ công: Số nhà, tên đường..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Khuyến khích chọn từ bản đồ để có địa chỉ chính
                              xác nhất
                            </p>
                          </div>
                        )}
                    </div>
                    {/* Chỉ hiển thị các trường này nếu chưa chọn từ map */}
                    {!orderData.deliveryAddress.latitude &&
                      !orderData.deliveryAddress.longitude && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Phường/Xã
                            </label>
                            <input
                              type="text"
                              value={orderData.deliveryAddress.ward}
                              onChange={(e) =>
                                setOrderData((prev) => ({
                                  ...prev,
                                  deliveryAddress: {
                                    ...prev.deliveryAddress,
                                    ward: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Nhập phường/xã..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Quận/Huyện
                            </label>
                            <input
                              type="text"
                              value={orderData.deliveryAddress.district}
                              onChange={(e) =>
                                setOrderData((prev) => ({
                                  ...prev,
                                  deliveryAddress: {
                                    ...prev.deliveryAddress,
                                    district: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Nhập quận/huyện..."
                            />
                          </div>
                        </div>
                      )}

                    {/* Hiển thị thông tin địa chỉ từ map (read-only) */}
                    {orderData.deliveryAddress.latitude &&
                      orderData.deliveryAddress.longitude && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">
                            📍 Địa chỉ từ bản đồ:
                          </h4>
                          <div className="space-y-1 text-sm text-blue-700">
                            {orderData.deliveryAddress.streetAddress && (
                              <p>
                                <span className="font-medium">Địa chỉ:</span>{" "}
                                {orderData.deliveryAddress.streetAddress}
                              </p>
                            )}
                            {orderData.deliveryAddress.ward && (
                              <p>
                                <span className="font-medium">Phường/Xã:</span>{" "}
                                {orderData.deliveryAddress.ward}
                              </p>
                            )}
                            {orderData.deliveryAddress.district && (
                              <p>
                                <span className="font-medium">Quận/Huyện:</span>{" "}
                                {orderData.deliveryAddress.district}
                              </p>
                            )}
                            {orderData.deliveryAddress.city && (
                              <p>
                                <span className="font-medium">Thành phố:</span>{" "}
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
                            🔄 Chọn lại địa chỉ
                          </button>
                        </div>
                      )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tên người nhận
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
                          Số điện thoại
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
                      ? "Đang tính phí ship..."
                      : "Tính phí vận chuyển"}
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
                    {isCreatingDraft ? "Đang tạo đơn thuê..." : "Tạo đơn thuê"}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">Tổng đơn hàng</h3>

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
                    <span>Số sản phẩm:</span>
                    <span>
                      {directRentalData
                        ? directRentalData.quantity || 1
                        : cartItems?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian thuê:</span>
                    <span>{totals.duration} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền thuê:</span>
                    <span>{totals.totalRental.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền cọc:</span>
                    <span>{totals.totalDeposit.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
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
                        <span>Giảm phí ship (khuyến mãi):</span>
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
                        Giảm phí ship (voucher {selectedVoucher.discountPercent}
                        %):
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
                      <span>Phí ship sau giảm:</span>
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
                    <span>Tổng cộng:</span>
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
                    💡 <strong>Lưu ý:</strong> Tiền cọc sẽ được hoàn lại sau khi
                    bạn trả sản phẩm trong tình trạng tốt.
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
  const [selectedMethod, setSelectedMethod] = useState("");

  const depositMethods = [
    {
      key: "WALLET",
      title: "Ví điện tử",
      description: "Thanh toán cọc từ số dư ví",
      icon: "💳",
    },
    {
      key: "PAYOS",
      title: "Chuyển khoản ngân hàng",
      description: "Thanh toán cọc qua PayOS (QR Code)",
      icon: "🏦",
    },
  ];

  const remainingAmount = totalAmount - depositAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">💵 Thanh toán cọc - COD</h2>

        {/* Amount breakdown */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Tổng đơn hàng:</span>
              <span className="font-medium">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between text-orange-600">
              <span>Cọc cần thanh toán:</span>
              <span className="font-bold">
                {depositAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between text-gray-600 border-t pt-2">
              <span>Còn lại khi nhận hàng:</span>
              <span>{remainingAmount.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Chọn phương thức thanh toán cọc:
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
                <span className="text-2xl">{method.icon}</span>
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
            Hủy
          </button>
          <button
            onClick={() => selectedMethod && onSelect(selectedMethod)}
            disabled={!selectedMethod}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Thanh toán cọc
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalOrderForm;
