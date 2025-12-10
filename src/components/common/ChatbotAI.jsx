import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiLoader, FiPackage, FiDollarSign, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/**
 * ChatbotAI Component - AI Chatbot hỗ trợ khách hàng
 * Trả lời câu hỏi về sản phẩm, giá thuê, chính sách, etc.
 */
const ChatbotAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi là trợ lý ảo của Pira. Tôi có thể giúp bạn:\n\n• Tìm sản phẩm cho thuê\n• Giải đáp về giá thuê và chính sách\n• Hướng dẫn sử dụng nền tảng\n\nBạn cần hỗ trợ gì?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quick action buttons
  const quickActions = [
    { icon: FiPackage, text: 'Tìm sản phẩm', query: 'Tôi muốn thuê máy ảnh' },
    { icon: FiDollarSign, text: 'Bảng giá', query: 'Giá thuê thế nào?' },
    { icon: FiInfo, text: 'Hướng dẫn', query: 'Hướng dẫn thuê sản phẩm' }
  ];

  // Helper functions for formatting
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const createProductListHTML = (products) => {
    if (!products || products.length === 0) return '';
    
    return products.map((product, idx) => {
      const price = product.pricing?.dailyRate ? formatPrice(product.pricing.dailyRate) : 'Liên hệ';
      const imageUrl = product.images?.[0]?.url || '/placeholder-product.png';
      const title = product.title.length > 60 ? product.title.substring(0, 60) + '...' : product.title;
      const category = product.category?.name || 'Khác';
      const rating = product.metrics?.averageRating || 0;
      const reviewCount = product.metrics?.reviewCount || 0;
      
      return `
        <div style="margin-bottom: 15px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #f9fafb; transition: all 0.2s;">
          <div style="display: flex; gap: 12px; align-items: start;">
            <img src="${imageUrl}" alt="${product.title}" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" 
                 onerror="this.src='/placeholder-product.png'" />
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${idx + 1}. ${title}</div>
              <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">📦 ${category}</div>
              <div style="color: #7c3aed; font-weight: 700; font-size: 14px; margin-bottom: 4px;">💰 ${price}/ngày</div>
              ${rating > 0 ? `<div style="color: #fbbf24; font-size: 12px;">⭐ ${rating.toFixed(1)}/5 (${reviewCount} đánh giá)</div>` : ''}
            </div>
          </div>
          <a href="/product/${product._id}" 
             onclick="window.location.href='/product/${product._id}'; return false;"
             style="display: inline-block; margin-top: 8px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 6px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3); transition: all 0.2s;">
            📋 Xem chi tiết
          </a>
        </div>
      `;
    }).join('');
  };

  const createSingleProductDetailHTML = (product) => {
    if (!product) return '';
    
    const price = product.pricing?.dailyRate ? formatPrice(product.pricing.dailyRate) : 'Liên hệ';
    const deposit = product.pricing?.deposit?.amount ? formatPrice(product.pricing.deposit.amount) : 'Không yêu cầu';
    const imageUrl = product.images?.[0]?.url || '/placeholder-product.png';
    const category = product.category?.name || 'Khác';
    const condition = {
      'NEW': '✨ Mới',
      'LIKE_NEW': '🌟 Như mới',
      'GOOD': '👍 Tốt',
      'FAIR': '👌 Khá'
    }[product.condition] || product.condition;
    const rating = product.metrics?.averageRating || 0;
    const reviewCount = product.metrics?.reviewCount || 0;
    const owner = product.owner?.fullName || product.owner?.username || 'Chủ sản phẩm';
    
    return `
      <div style="padding: 15px; border: 2px solid #7c3aed; border-radius: 12px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);">
        <div style="display: flex; gap: 15px; margin-bottom: 12px;">
          <img src="${imageUrl}" alt="${product.title}" 
               style="width: 120px; height: 120px; object-fit: cover; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" 
               onerror="this.src='/placeholder-product.png'" />
          <div style="flex: 1;">
            <h4 style="margin: 0 0 8px 0; color: #581c87; font-size: 16px;">🏠 ${product.title}</h4>
            <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">📦 ${category} • ${condition}</div>
            ${rating > 0 ? `<div style="color: #fbbf24; font-size: 12px; margin-bottom: 4px;">⭐ ${rating.toFixed(1)}/5 (${reviewCount} đánh giá)</div>` : ''}
            <div style="color: #6b7280; font-size: 13px;">👤 Chủ: ${owner}</div>
          </div>
        </div>
        <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6b7280;">💰 Giá thuê:</span>
            <span style="color: #7c3aed; font-weight: 700;">${price}/ngày</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">💳 Tiền cọc:</span>
            <span style="color: #059669; font-weight: 600;">${deposit}</span>
          </div>
        </div>
        <div style="color: #4b5563; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
          ${product.description ? product.description.substring(0, 150) + '...' : ''}
        </div>
        <a href="/product/${product._id}" 
           onclick="window.location.href='/product/${product._id}'; return false;"
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          🔗 Xem trang chi tiết đầy đủ
        </a>
      </div>
    `;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/ai/chat', {
        message: inputMessage,
        conversationHistory: messages.slice(-5) // Last 5 messages for context
      });

      if (response.data.success) {
        const data = response.data.data;
        let finalContent = data.reply;
        let shouldShowProducts = false;
        let productsToShow = [];
        
        // Check if we have products to display
        if (data.suggestedProducts && data.suggestedProducts.length > 0) {
          const isDetailRequest = /chi tiết|xem thêm|thông tin chi tiết|detail|số \d+/i.test(inputMessage);
          const productNumberMatch = inputMessage.match(/số (\d+)|phòng (\d+)|sản phẩm (\d+)/i);
          
          // Parse AI response to find mentioned products
          const aiReply = data.reply;
          const mentionedProductTitles = [];
          
          // Extract product names from AI response (look for ** or numbered lists)
          const productMentions = aiReply.match(/\*\*([^*]+)\*\*/g) || [];
          productMentions.forEach(mention => {
            const title = mention.replace(/\*\*/g, '').trim();
            mentionedProductTitles.push(title);
          });
          
          // Also check numbered lists (1., 2., 3.)
          const numberedMatches = aiReply.match(/\d+\.\s+([^\n]+)/g) || [];
          numberedMatches.forEach(match => {
            const title = match.replace(/^\d+\.\s+/, '').replace(/\*\*/g, '').trim();
            if (!title.includes('Giá:') && !title.includes('Tổng')) {
              mentionedProductTitles.push(title);
            }
          });
          
          // Filter products to only show those mentioned by AI
          if (mentionedProductTitles.length > 0) {
            productsToShow = data.suggestedProducts.filter(product => 
              mentionedProductTitles.some(title => 
                product.title.toLowerCase().includes(title.toLowerCase()) ||
                title.toLowerCase().includes(product.title.toLowerCase())
              )
            );
            shouldShowProducts = productsToShow.length > 0;
          } else {
            // Fallback: show all if AI doesn't mention specific products but talks about them
            const aiMentionsProducts = /sản phẩm|combo|gợi ý|tìm thấy|có thể thuê/i.test(aiReply);
            if (aiMentionsProducts) {
              productsToShow = data.suggestedProducts;
              shouldShowProducts = true;
            }
          }
          
          if (shouldShowProducts && productsToShow.length > 0) {
            if (productNumberMatch && isDetailRequest) {
              // Show detail of specific product
              const productIndex = parseInt(productNumberMatch[1] || productNumberMatch[2] || productNumberMatch[3]) - 1;
              if (productsToShow[productIndex]) {
                const productDetailHTML = createSingleProductDetailHTML(productsToShow[productIndex]);
                finalContent = `${data.reply}\n\n${productDetailHTML}`;
              } else {
                const productsListHTML = createProductListHTML(productsToShow);
                finalContent = `${data.reply}\n\n<div style="color: #dc2626; padding: 10px; background-color: #fef2f2; border-radius: 8px; margin-bottom: 10px;">❌ Không tìm thấy sản phẩm số ${productNumberMatch[1] || productNumberMatch[2] || productNumberMatch[3]}. Chỉ có ${productsToShow.length} sản phẩm.</div>\n\n${productsListHTML}`;
              }
            } else if (isDetailRequest && productsToShow.length === 1) {
              // Show detail if only one product
              const productDetailHTML = createSingleProductDetailHTML(productsToShow[0]);
              finalContent = `${data.reply}\n\n${productDetailHTML}`;
            } else {
              // Show list of products
              const productsListHTML = createProductListHTML(productsToShow);
              finalContent = `${data.reply}\n\n${productsListHTML}\n<div style="margin-top: 10px; font-style: italic; color: #6b7280; font-size: 13px;">💡 Bạn có thể nói "xem chi tiết" hoặc "chi tiết sản phẩm số X" để xem thêm thông tin.</div>`;
            }
          }
        }

        const assistantMessage = {
          role: 'assistant',
          content: finalContent,
          timestamp: new Date(),
          isHtml: shouldShowProducts && productsToShow.length > 0,
          actions: data.suggestedActions
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ support.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query) => {
    setInputMessage(query);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setIsOpen(false);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <FiMessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
          AI
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FiMessageCircle className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-pulse"></span>
                </div>
                <div>
                  <h3 className="font-bold">Trợ lý Pira AI</h3>
                  <p className="text-xs opacity-90">Online • Sẵn sàng hỗ trợ</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-600 to-green-600 text-white'
                        : message.isError
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-white border border-gray-200 text-gray-800'
                    } rounded-2xl p-3 shadow-sm`}
                  >
                    {message.isHtml ? (
                      <div 
                        className="chatbot-message"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                        style={{ lineHeight: '1.6' }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Suggested Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickAction(action.query)}
                            className="w-full text-left text-xs bg-emerald-50 hover:bg-emerald-100 rounded-lg px-3 py-2 transition-colors border border-emerald-200 text-emerald-700"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs opacity-50 mt-2">{formatTime(message.timestamp)}</p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="p-3 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">Câu hỏi thường gặp:</p>
                <div className="flex gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.query)}
                      className="flex-1 flex flex-col items-center gap-1 p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                    >
                      <action.icon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs text-gray-700">{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2 bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-full hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTyping ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiSend className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Powered by Pira AI • Hỗ trợ 24/7
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styling cho chatbot HTML content */}
      <style jsx>{`
        .chatbot-message a {
          display: inline-block;
          transition: all 0.2s ease;
        }
        .chatbot-message a:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .chatbot-message img {
          transition: transform 0.2s ease;
        }
        .chatbot-message img:hover {
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
};

export default ChatbotAI;
