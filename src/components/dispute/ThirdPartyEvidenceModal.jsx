import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ThirdPartyEvidenceModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    description: '',
    images: [],
    videos: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
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

  const uploadVideos = async (files) => {
    if (!files || files.length === 0) return [];
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('videos', file);
    });

    try {
      const response = await api.post('/upload/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.videos || [];
    } catch (error) {
      console.error('Upload video error:', error);
      throw new Error('Failed to upload videos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let imageUrls = [];
      let videoResults = [];
      
      setIsUploading(true);
      
      if (selectedFiles.length > 0) {
        toast.loading('Đang upload ảnh...', { id: 'upload-images' });
        imageUrls = await uploadImages(selectedFiles);
        toast.success(`Upload ${imageUrls.length} ảnh thành công!`, { id: 'upload-images' });
      }
      
      if (selectedVideos.length > 0) {
        toast.loading('Đang upload video...', { id: 'upload-videos' });
        videoResults = await uploadVideos(selectedVideos);
        toast.success(`Upload ${videoResults.length} video thành công!`, { id: 'upload-videos' });
      }
      
      setIsUploading(false);

      await onSubmit({
        officialDecision: formData.description,
        photos: imageUrls,
        videos: videoResults.map(v => v.url)
      });
      onClose();
      // Reset form
      setFormData({ description: '', images: [], videos: [] });
      setSelectedFiles([]);
      setSelectedVideos([]);
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

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error('Tối đa 3 video');
      return;
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error('Mỗi video tối đa 50MB');
      return;
    }
    
    setSelectedVideos(files);
    setFormData(prev => ({
      ...prev,
      videos: files.map(f => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: URL.createObjectURL(f)
      }))
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

            {/* Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video bằng chứng
              </label>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tải lên tối đa 3 video. Mỗi video tối đa 50MB
              </p>
              {formData.videos.length > 0 && (
                <div className="mt-2 space-y-2">
                  {formData.videos.map((video, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{video.name}</p>
                        <p className="text-xs text-gray-500">{video.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            videos: prev.videos.filter((_, i) => i !== idx)
                          }));
                          setSelectedVideos(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
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
