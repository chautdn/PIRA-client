import React, { useState, useRef } from 'react';
import { FiCamera, FiUpload, FiX, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

/**
 * Visual Search Component - Tìm kiếm bằng hình ảnh
 * Sử dụng Clarifai AI để phân tích ảnh và tìm sản phẩm tương tự
 */
const VisualSearch = ({ onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [labels, setLabels] = useState([]);
  const fileInputRef = useRef(null);

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
    setLabels([]);

    try {
      const preview = await fileToBase64(file);
      setPreviewImage(preview);

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/ai/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.labels) {
        const detectedLabels = response.data.labels;
        setLabels(detectedLabels);

        if (detectedLabels.length > 0) {
          const topLabel = detectedLabels[0];
          const searchTerm = translateLabel(topLabel.name);
          
          setTimeout(() => {
            onSearch(searchTerm);
            handleClose();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setLabels([{ name: 'Lỗi', confidence: 0, vietnamese: 'Không thể phân tích ảnh' }]);
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
    setLabels([]);
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
              className="bg-white rounded-2xl p-6 max-w-md w-full"
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
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-64 object-contain rounded-lg bg-gray-50"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <FiLoader className="w-8 h-8 mx-auto mb-2 animate-spin" />
                          <p>Đang phân tích...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {labels.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Kết quả phát hiện:</p>
                      <div className="space-y-1">
                        {labels.slice(0, 5).map((label, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm text-gray-700">
                              {label.vietnamese || translateLabel(label.name)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(label.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPreviewImage(null);
                      setLabels([]);
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Chọn ảnh khác
                  </button>
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
