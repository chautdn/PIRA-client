import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ThirdPartyEvidenceModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    description: '',
    images: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.urls || [];
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload images');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Upload images first
      let imageUrls = [];
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        toast.loading('Đang upload ảnh...', { id: 'upload' });
        imageUrls = await uploadImages(selectedFiles);
        toast.success('Upload ảnh thành công!', { id: 'upload' });
        setIsUploading(false);
      }

      await onSubmit({
        officialDecision: formData.description,
        photos: imageUrls
      });
      onClose();
      // Reset form
      setFormData({ description: '', images: [] });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error(error.message || 'Upload thất bại');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }
    setSelectedFiles(files);
    setFormData(prev => ({
      ...prev,
      images: files.map(f => URL.createObjectURL(f))
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tải bằng chứng cho bên thứ 3
          </h2>

          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900 mb-1">
                  Quan trọng
                </p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Đây là cơ hội cuối để cung cấp bằng chứng</li>
                  <li>• Bên thứ 3 sẽ đưa ra quyết định cuối cùng dựa trên tất cả bằng chứng</li>
                  <li>• Quyết định của bên thứ 3 là bắt buộc và không thể kháng cáo</li>
                  <li>• Vui lòng cung cấp bằng chứng đầy đủ và chính xác</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Mô tả chi tiết tình huống và cung cấp bằng chứng...&#10;&#10;Bao gồm:&#10;- Mô tả sự việc&#10;- Bằng chứng hỗ trợ&#10;- Yêu cầu giải quyết"
                required
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh bằng chứng <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tải lên tối đa 10 hình ảnh. Định dạng: JPG, PNG, JPEG
              </p>
              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Tôi xác nhận rằng tất cả thông tin và bằng chứng cung cấp là chính xác và trung thực. 
                  Tôi hiểu rằng quyết định của bên thứ 3 là cuối cùng và tôi đồng ý tuân theo.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tải lên...' : 'Gửi bằng chứng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyEvidenceModal;
