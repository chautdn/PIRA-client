import React, { useState, useRef } from 'react';
import { FiCamera, FiUpload, FiX, FiLoader, FiTag, FiPackage } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/**
 * Visual Search Component - Tìm kiếm bằng hình ảnh
 * Sử dụng Clarifai AI để phân tích ảnh và tìm sản phẩm tương tự
 */
const VisualSearch = ({ onSearch, onResults }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);
    setSearchResults(null);

    try {
      const preview = await fileToBase64(file);
      setPreviewImage(preview);

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/ai/visual-search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        const { products, matchedCategories, searchInfo } = response.data.data;
        
        setSearchResults({
          products,
          categories: matchedCategories,
          info: searchInfo
        });

        // Callback với kết quả
        if (onResults) {
          onResults(products);
        }

        // Hoặc navigate tới trang kết quả với state
        // setTimeout(() => {
        //   navigate('/search-results', { 
        //     state: { 
        //       products, 
        //       isVisualSearch: true,
        //       searchInfo 
        //     } 
        //   });
        //   handleClose();
        // }, 2000);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setSearchResults({ 
        error: error.response?.data?.message || 'Không thể phân tích ảnh. Vui lòng thử lại.' 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const translateLabel = (englishLabel) => {
    const labelMap = {
      // Balo & Túi
      'backpack': 'balo',
      'bag': 'balo',
      'rucksack': 'balo',
      'luggage': 'vali',
      'suitcase': 'vali',
      
      // Máy ảnh
      'camera': 'máy ảnh',
      'photography': 'máy ảnh',
      'dslr': 'máy ảnh',
      'lens': 'ống kính',
      'tripod': 'chân máy',
      'gopro': 'camera hành trình',
      
      // Lều cắm trại
      'tent': 'lều',
      'camping': 'cắm trại',
      'sleeping bag': 'túi ngủ',
      
      // Xe
      'motorcycle': 'xe máy',
      'bike': 'xe đạp',
      'bicycle': 'xe đạp',
      
      // Thể thao nước
      'surfboard': 'ván lướt sóng',
      'kayak': 'thuyền kayak',
    };

    const normalized = englishLabel.toLowerCase().trim();
    
    // Exact match
    if (labelMap[normalized]) {
      return labelMap[normalized];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(labelMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    
    return normalized;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB');
        return;
      }
      analyzeImage(file);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewImage(null);
    setSearchResults(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    handleClose();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full text-gray-500 hover:text-gray-700 transition-all shadow-md"
        title="Tìm kiếm bằng hình ảnh"
      >
        <FiCamera className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Tìm kiếm bằng hình ảnh</h3>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {!previewImage ? (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center gap-3"
                  >
                    <FiUpload className="w-12 h-12 text-gray-400" />
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">Chọn ảnh để tìm kiếm</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG lên đến 10MB</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview Image */}
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg bg-gray-50"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <FiLoader className="w-8 h-8 mx-auto mb-2 animate-spin" />
                          <p className="font-medium">Đang phân tích ảnh...</p>
                          <p className="text-sm mt-1">Tìm kiếm sản phẩm phù hợp</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {searchResults?.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{searchResults.error}</p>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults && !searchResults.error && (
                    <div className="space-y-4">
                      {/* Search Info */}
                      {searchResults.info && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FiTag className="w-4 h-4 text-purple-600" />
                            <p className="text-sm font-medium text-purple-900">
                              Phát hiện: {searchResults.info.totalFound} sản phẩm
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {searchResults.info.topConcepts?.slice(0, 5).map((concept, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-white rounded-full text-xs text-purple-700 border border-purple-200"
                              >
                                {concept.name} ({concept.confidence})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matched Categories */}
                      {searchResults.categories?.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FiPackage className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-medium text-blue-900">Danh mục phù hợp:</p>
                          </div>
                          <div className="space-y-1">
                            {searchResults.categories.slice(0, 3).map((cat, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-blue-800">{cat.name}</span>
                                <span className="text-blue-600 font-medium">
                                  {cat.matchedConcepts?.slice(0, 2).join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products Grid */}
                      {searchResults.products?.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">
                            Sản phẩm tìm thấy ({searchResults.products.length})
                          </h4>
                          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                            {searchResults.products.map((product) => (
                              <div
                                key={product._id}
                                onClick={() => handleProductClick(product._id)}
                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                              >
                                <div className="aspect-square bg-gray-100 relative">
                                  {product.images?.[0] ? (
                                    <img
                                      src={product.images[0].url}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FiCamera className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                  {/* Score Badge */}
                                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    {(product.visualSearchScore * 100).toFixed(0)}%
                                  </div>
                                </div>
                                <div className="p-3">
                                  <h5 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                                    {product.title}
                                  </h5>
                                  <p className="text-xs text-gray-500 mb-2">
                                    {product.category?.name}
                                  </p>
                                  <p className="text-purple-600 font-bold text-sm">
                                    {formatPrice(product.pricing?.dailyRate)}/ngày
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        !isAnalyzing && (
                          <div className="text-center py-8">
                            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Không tìm thấy sản phẩm phù hợp</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Thử với hình ảnh khác hoặc điều chỉnh góc chụp
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Upload Another Button */}
                  {!isAnalyzing && (
                    <button
                      onClick={() => {
                        setPreviewImage(null);
                        setSearchResults(null);
                        fileInputRef.current?.click();
                      }}
                      className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Chọn ảnh khác
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VisualSearch;
