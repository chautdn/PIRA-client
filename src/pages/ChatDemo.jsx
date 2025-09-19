import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useChat from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const ChatDemo = () => {
  const [targetUserId, setTargetUserId] = useState("");
  const [listingId, setListingId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const { createConversation, creatingConversation } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateConversation = async (e) => {
    e.preventDefault();

    if (!targetUserId.trim()) {
      toast.error("Please enter a target user ID");
      return;
    }

    if (targetUserId === user?._id) {
      toast.error("Cannot create conversation with yourself");
      return;
    }

    try {
      const conversation = await createConversation(
        targetUserId.trim(),
        listingId.trim() || null,
        bookingId.trim() || null
      );

      toast.success("Conversation created successfully!");
      navigate(`/chat/${conversation.data._id}`);
    } catch (error) {
      toast.error(error.message || "Failed to create conversation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Chat Demo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create a new conversation for testing
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleCreateConversation}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="targetUserId"
                className="block text-sm font-medium text-gray-700"
              >
                Target User ID *
              </label>
              <input
                id="targetUserId"
                name="targetUserId"
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter user ID to chat with"
              />
            </div>

            <div>
              <label
                htmlFor="listingId"
                className="block text-sm font-medium text-gray-700"
              >
                Listing/Product ID (Optional)
              </label>
              <input
                id="listingId"
                name="listingId"
                type="text"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Product/Listing ID (optional)"
              />
            </div>

            <div>
              <label
                htmlFor="bookingId"
                className="block text-sm font-medium text-gray-700"
              >
                Booking/Order ID (Optional)
              </label>
              <input
                id="bookingId"
                name="bookingId"
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Order/Booking ID (optional)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={creatingConversation}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingConversation ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </div>
              ) : (
                "Create Conversation"
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Go to Chat
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Your User ID:
          </h3>
          <p className="text-sm text-blue-700 font-mono bg-blue-100 p-2 rounded">
            {user?._id || "Not logged in"}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Share this ID with other users to test chat functionality
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;

