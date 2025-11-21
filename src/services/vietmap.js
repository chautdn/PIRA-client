/**
 * VietMap GL JS Integration Service for Frontend
 * Provides geocoding, reverse geocoding và map utilities using VietMap GL JS SDK
 * VietMap GL JS v6.0.0 from https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/
 */

const VIETMAP_API_KEY =
  import.meta.env.VITE_VIETMAP_API_KEY ||
  "6e0f9ec74dcf745f6a0a071f50c2479030322f17f879d547";
const VIETMAP_BASE_URL = "https://maps.vietmap.vn/api";

class VietMapService {
  /**
   * Geocode an address to get coordinates using VietMap Search API
   * @param {string} address - The address string to geocode
   * @returns {Promise<Object>} - Location data with coordinates
   */
  async geocodeAddress(address) {
    try {
      // Use the VietMap Search API for better Vietnamese address parsing
      const response = await fetch(
        `${VIETMAP_BASE_URL}/search?api-version=1.1&apikey=${VIETMAP_API_KEY}&text=${encodeURIComponent(
          address
        )}&focus.point.lat=10.8231&focus.point.lon=106.6297&layers=address,venue&limit=5`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.code === "OK" &&
        data.data &&
        data.data.features &&
        data.data.features.length > 0
      ) {
        const feature = data.data.features[0];
        const coords = feature.geometry.coordinates; // [longitude, latitude]

        return {
          success: true,
          latitude: coords[1],
          longitude: coords[0],
          displayName: feature.properties.label || feature.properties.name,
          address: {
            name: feature.properties.name || "",
            locality: feature.properties.locality || "",
            county: feature.properties.county || "",
            region: feature.properties.region || "",
          },
          confidence: feature.properties.confidence || 1.0,
        };
      } else {
        return {
          success: false,
          error: "No location found for the given address",
        };
      }
    } catch (error) {
      console.error("VietMap geocoding error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address using VietMap Reverse API
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} - Address data
   */
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `${VIETMAP_BASE_URL}/reverse?api-version=1.1&apikey=${VIETMAP_API_KEY}&lat=${lat}&lon=${lon}&layers=address,venue`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.code === "OK" &&
        data.data &&
        data.data.features &&
        data.data.features.length > 0
      ) {
        const feature = data.data.features[0];

        return {
          success: true,
          address: feature.properties.label || feature.properties.name,
          details: {
            name: feature.properties.name || "",
            locality: feature.properties.locality || "",
            county: feature.properties.county || "",
            region: feature.properties.region || "",
          },
          coordinates: {
            latitude: lat,
            longitude: lon,
          },
        };
      } else {
        return {
          success: false,
          error: "No address found for the given coordinates",
        };
      }
    } catch (error) {
      console.error("VietMap reverse geocoding error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Initialize VietMap GL JS SDK
   * @param {string} accessToken - VietMap access token
   * @returns {boolean} - Success status
   */
  initializeSDK(accessToken = VIETMAP_API_KEY) {
    try {
      if (window.vietmapgl) {
        // VietMap GL JS doesn't use accessToken in the same way
        // API key is passed in style URL instead
        console.log("VietMap GL JS initialized successfully");
        return true;
      } else {
        console.warn("VietMap GL JS not loaded yet");
        return false;
      }
    } catch (error) {
      console.error("Error initializing VietMap GL JS SDK:", error);
      return false;
    }
  }

  /**
   * Load VietMap GL JS SDK dynamically
   * @returns {Promise<void>}
   */
  async loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.vietmapgl) {
        resolve();
        return;
      }

      // Load VietMap GL JS CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css";
      document.head.appendChild(link);

      // Load VietMap GL JS
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js";
      script.onload = () => {
        console.log("VietMap GL JS loaded successfully");
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   * This is a client-side fallback when server distance calculation is not available
   * @param {number} lat1 - First point latitude
   * @param {number} lon1 - First point longitude
   * @param {number} lat2 - Second point latitude
   * @param {number} lon2 - Second point longitude
   * @returns {number} - Distance in kilometers
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} - Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate estimated shipping fee based on distance
   * This mirrors the server-side calculation for preview purposes
   * @param {number} distanceKm - Distance in kilometers
   * @param {Object} options - Fee calculation options
   * @returns {Object} - Fee breakdown
   */
  calculateShippingFee(distanceKm, options = {}) {
    const baseFee = options.baseFee || 10000; // 10,000 VND base
    const pricePerKm = options.pricePerKm || 5000; // 5,000 VND per km
    const minFee = options.minFee || 15000; // Minimum 15,000 VND
    const maxFee = options.maxFee || 200000; // Maximum 200,000 VND

    let shippingFee = baseFee + distanceKm * pricePerKm;

    // Apply min/max limits
    if (shippingFee < minFee) {
      shippingFee = minFee;
    }
    if (shippingFee > maxFee) {
      shippingFee = maxFee;
    }

    return {
      baseFee,
      pricePerKm,
      distance: distanceKm,
      calculatedFee: Math.round(shippingFee),
      breakdown: {
        base: baseFee,
        distance: Math.round(distanceKm * pricePerKm),
        total: Math.round(shippingFee),
      },
    };
  }

  /**
   * Calculate shipping fees based on delivery batches (by delivery date)
   * Products with same start date = 1 delivery = 1 shipping fee
   * @param {Array} products - Array of products with quantities and rentalPeriod
   * @param {number} distanceKm - Distance in kilometers
   * @param {Object} options - Calculation options
   * @returns {Object} - Detailed shipping calculation per delivery batch
   */
  calculateProductShippingFees(products, distanceKm, options = {}) {
    const baseFeePerDelivery = options.baseFeePerDelivery || 15000; // 15k per delivery trip
    const pricePerKm = options.pricePerKm || 5000; // 5k per km
    const minFeePerDelivery = options.minFeePerDelivery || 20000; // Min 20k per delivery
    const maxFeePerDelivery = options.maxFeePerDelivery || 100000; // Max 100k per delivery

    // Group products by delivery date (startDate)
    const deliveryBatches = {};

    products.forEach((productItem, index) => {
      const startDate = productItem.rentalPeriod?.startDate;
      let deliveryDate;

      if (startDate) {
        // Convert to date string for grouping (YYYY-MM-DD)
        deliveryDate = new Date(startDate).toISOString().split("T")[0];
      } else {
        // If no startDate, use 'unknown' group
        deliveryDate = "unknown";
      }

      if (!deliveryBatches[deliveryDate]) {
        deliveryBatches[deliveryDate] = [];
      }

      deliveryBatches[deliveryDate].push({
        ...productItem,
        originalIndex: index,
      });
    });

    const deliveryFees = [];
    let totalShippingFee = 0;
    let deliveryCount = 0;

    // Calculate fee for each delivery batch
    Object.entries(deliveryBatches).forEach(([deliveryDate, batchProducts]) => {
      deliveryCount++;

      // Calculate total quantity for this delivery batch
      const batchQuantity = batchProducts.reduce(
        (sum, p) => sum + (p.quantity || 1),
        0
      );

      // Calculate fee for this delivery (one trip regardless of quantity)
      let deliveryFee = baseFeePerDelivery + distanceKm * pricePerKm;

      // Apply min/max limits per delivery
      if (deliveryFee < minFeePerDelivery) deliveryFee = minFeePerDelivery;
      if (deliveryFee > maxFeePerDelivery) deliveryFee = maxFeePerDelivery;

      deliveryFee = Math.round(deliveryFee);
      totalShippingFee += deliveryFee;

      // Distribute delivery fee among products in this batch
      const feePerProduct = Math.round(deliveryFee / batchProducts.length);
      const productFees = [];

      batchProducts.forEach((productItem, batchIndex) => {
        const productFee = {
          productIndex: productItem.originalIndex,
          productId: productItem.product?._id || productItem.product,
          quantity: productItem.quantity || 1,
          deliveryDate: deliveryDate,
          deliveryBatch: deliveryCount,
          distance: distanceKm,
          // Each product gets an equal share of the delivery fee
          allocatedFee:
            batchIndex === batchProducts.length - 1
              ? deliveryFee - feePerProduct * batchIndex // Last product gets remainder
              : feePerProduct,
          breakdown: {
            deliveryFee: deliveryFee,
            productShare: feePerProduct,
            batchSize: batchProducts.length,
            batchQuantity: batchQuantity,
          },
        };

        productFees.push(productFee);
      });

      deliveryFees.push({
        deliveryDate: deliveryDate,
        deliveryBatch: deliveryCount,
        products: productFees,
        batchQuantity: batchQuantity,
        batchSize: batchProducts.length,
        deliveryFee: deliveryFee,
        distance: distanceKm,
        breakdown: {
          baseFee: baseFeePerDelivery,
          distanceFee: Math.round(distanceKm * pricePerKm),
          total: deliveryFee,
        },
      });
    });

    // Flatten product fees for backward compatibility
    const allProductFees = deliveryFees.flatMap((batch) => batch.products);

    return {
      success: true,
      totalShippingFee: totalShippingFee,
      deliveryCount: deliveryCount,
      deliveryBatches: deliveryFees,
      productFees: allProductFees, // For backward compatibility
      summary: {
        totalProducts: products.length,
        totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 1), 0),
        totalDeliveries: deliveryCount,
        averageFeePerDelivery: Math.round(totalShippingFee / deliveryCount),
        averageFeePerProduct: Math.round(totalShippingFee / products.length),
        distance: distanceKm,
        deliveryDates: Object.keys(deliveryBatches),
      },
    };
  }
}

export default new VietMapService();
