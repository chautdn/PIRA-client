import { useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

let socket = null;

export const useSystemPromotionSocket = (onPromotionUpdate) => {
  const { user } = useAuth();
  const onPromotionUpdateRef = useRef(onPromotionUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onPromotionUpdateRef.current = onPromotionUpdate;
  }, [onPromotionUpdate]);

  useEffect(() => {
    // Initialize socket even without user (for public banner updates)
    if (!socket) {
      // Remove /api from URL for socket connection
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const serverUrl = apiUrl.replace("/api", "");
      const token = localStorage.getItem("token");

      console.log("[Socket] 🔌 Connecting to:", serverUrl);
      console.log("[Socket] Token present:", !!token);

      socket = io(serverUrl, {
        auth: token ? { token } : {},
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("[Socket] ✅ Connected to server for system promotions");
        console.log("[Socket] Socket ID:", socket.id);
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] ⚠️ Disconnected from server. Reason:", reason);
      });

      socket.on("connect_error", (error) => {
        console.error("[Socket] ❌ Connection error:", error.message);
        console.error("[Socket] Attempted URL:", serverUrl);
      });
    }

    // System promotion event handlers
    const handlePromotionCreated = (data) => {
      console.log("[Socket] System promotion created:", data);

      const { promotion } = data;

      // Show toast notification with custom styling
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
          >
            <div
              className="flex-1 w-0 p-4"
              style={{
                background: `linear-gradient(135deg, ${
                  promotion.banner.backgroundColor || "#4F46E5"
                } 0%, ${promotion.banner.backgroundColor || "#4F46E5"}dd 100%)`,
              }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="text-3xl animate-bounce">🎉</div>
                </div>
                <div className="ml-3 flex-1">
                  <p
                    className="text-lg font-bold"
                    style={{ color: promotion.banner.textColor || "#FFFFFF" }}
                  >
                    {promotion.banner.bannerTitle || promotion.title}
                  </p>
                  <p
                    className="mt-1 text-sm opacity-90"
                    style={{ color: promotion.banner.textColor || "#FFFFFF" }}
                  >
                    {promotion.banner.bannerDescription ||
                      promotion.description}
                  </p>
                  <div
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold"
                    style={{ color: promotion.banner.textColor || "#FFFFFF" }}
                  >
                    <span>✨</span>
                    <span>Tự động áp dụng</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        ),
        {
          duration: 8000,
          position: "bottom-right",
        }
      );

      // Trigger callback if provided
      if (onPromotionUpdateRef.current) {
        onPromotionUpdateRef.current(promotion);
      }
    };

    const handlePromotionUpdated = (data) => {
      console.log("[Socket] System promotion updated:", data);

      if (onPromotionUpdateRef.current) {
        onPromotionUpdateRef.current(data.promotion);
      }
    };

    const handlePromotionEnded = (data) => {
      console.log("[Socket] System promotion ended:", data);

      toast.info(`Khuyến mãi đã kết thúc`, {
        duration: 4000,
      });

      if (onPromotionUpdateRef.current) {
        onPromotionUpdateRef.current(null);
      }
    };

    // Register event listeners
    socket.on("system:promotion:created", handlePromotionCreated);
    socket.on("system:promotion:updated", handlePromotionUpdated);
    socket.on("system:promotion:ended", handlePromotionEnded);

    // Cleanup
    return () => {
      socket.off("system:promotion:created", handlePromotionCreated);
      socket.off("system:promotion:updated", handlePromotionUpdated);
      socket.off("system:promotion:ended", handlePromotionEnded);
    };
  }, []); // Remove user dependency

  return socket;
};

export default useSystemPromotionSocket;
