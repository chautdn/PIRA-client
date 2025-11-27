import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "lucide-react";
import systemPromotionService from "../../services/systemPromotion";
import useSystemPromotionSocket from "../../hooks/useSystemPromotionSocket";

const PromotionBanner = () => {
  const [promotion, setPromotion] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Socket integration for real-time updates
  useSystemPromotionSocket((newPromotion) => {
    console.log("[PromotionBanner] Socket received promotion:", newPromotion);
    if (
      newPromotion &&
      newPromotion.banner &&
      newPromotion.banner.displayOnHome
    ) {
      // Clear dismissed status for new promotion
      const dismissedPromotions = JSON.parse(
        localStorage.getItem("dismissedPromotions") || "[]"
      );

      if (!dismissedPromotions.includes(newPromotion._id)) {
        setPromotion(newPromotion);
        setIsDismissed(false);
      }
    } else if (!newPromotion) {
      // Promotion was deactivated
      setPromotion(null);
      setIsDismissed(false);
    }
  });

  useEffect(() => {
    loadActivePromotion();
  }, []);

  const loadActivePromotion = async () => {
    try {
      setLoading(true);
      console.log("[PromotionBanner] Loading active promotion...");
      const response = await systemPromotionService.getActive();
      console.log("[PromotionBanner] API response:", response);

      if (
        response.metadata.promotions &&
        response.metadata.promotions.length > 0
      ) {
        const activePromo = response.metadata.promotions[0];
        console.log("[PromotionBanner] Active promotion found:", activePromo);

        // Check if this promotion was previously dismissed
        const dismissedPromotions = JSON.parse(
          localStorage.getItem("dismissedPromotions") || "[]"
        );

        if (!dismissedPromotions.includes(activePromo._id)) {
          setPromotion(activePromo);
          console.log("[PromotionBanner] Promotion set to state");
        } else {
          console.log("[PromotionBanner] Promotion was dismissed");
        }
      } else {
        console.log("[PromotionBanner] No active promotions found");
      }
    } catch (error) {
      console.error(
        "[PromotionBanner] Failed to load active promotion:",
        error
      );
    } finally {
      setLoading(false);
      console.log("[PromotionBanner] Loading complete");
    }
  };

  const handleDismiss = () => {
    if (promotion) {
      // Save dismissed promotion to localStorage
      const dismissedPromotions = JSON.parse(
        localStorage.getItem("dismissedPromotions") || "[]"
      );
      dismissedPromotions.push(promotion._id);
      localStorage.setItem(
        "dismissedPromotions",
        JSON.stringify(dismissedPromotions)
      );

      setIsDismissed(true);
      setPromotion(null);
    }
  };

  if (loading || !promotion || isDismissed) {
    console.log("[PromotionBanner] Not rendering:", {
      loading,
      hasPromotion: !!promotion,
      isDismissed,
    });
    return null;
  }

  const backgroundColor = promotion.banner?.backgroundColor || "#4F46E5";
  const textColor = promotion.banner?.textColor || "#FFFFFF";
  const bannerTitle = promotion.banner?.bannerTitle || promotion.title;
  const bannerDescription =
    promotion.banner?.bannerDescription || promotion.description;

  console.log("[PromotionBanner] Rendering banner with:", {
    bannerTitle,
    bannerDescription,
  });

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${backgroundColor} 0%, ${backgroundColor}ee 100%)`,
          }}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-4 text-center">
              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Tag
                  className="w-7 h-7 md:w-9 md:h-9"
                  style={{ color: textColor }}
                />
              </motion.div>

              {/* Content - single line */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span
                  className="font-bold text-base md:text-xl"
                  style={{ color: textColor }}
                >
                  {bannerTitle}
                </span>
                <span
                  className="hidden md:inline text-base opacity-75"
                  style={{ color: textColor }}
                >
                  •
                </span>
                <span
                  className="text-base md:text-lg opacity-90"
                  style={{ color: textColor }}
                >
                  {bannerDescription}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromotionBanner;
