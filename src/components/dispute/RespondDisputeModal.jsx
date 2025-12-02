import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RespondDisputeModal = ({ isOpen, onClose, onSubmit }) => {
  const [decision, setDecision] = useState(''); // 'ACCEPTED' or 'REJECTED'
  const [reason, setReason] = useState('');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
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
    
    if (!decision) {
      alert('Vui lòng chọn quyết định');
      return;
    }
    
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
        decision,
        reason,
        evidence: {
          photos: imageUrls,
          videos: videoResults.map(v => v.url),
          notes: reason
        }
      });
      onClose();
      // Reset
      setDecision('');
      setReason('');
      setImages([]);
      setVideos([]);
      setSelectedFiles([]);
      setSelectedVideos([]);
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error(error.message || 'Phản hồi thất bại');
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
    setImages(files.map(f => URL.createObjectURL(f)));
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
    setVideos(files.map(f => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: URL.createObjectURL(f)
    })));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Phản hồi tranh chấp
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Accept/Reject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyết định <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={decision === 'ACCEPTED'}
                    onChange={() => setDecision('ACCEPTED')}
                    className="mr-2"
                  />
                  <span className="text-sm">Chấp nhận</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={decision === 'REJECTED'}
                    onChange={() => setDecision('REJECTED')}
                    className="mr-2"
                  />
                  <span className="text-sm">Từ chối</span>
                </label>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập lý do quyết định của bạn..."
                required
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh bằng chứng (Tối đa 10 ảnh)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video bằng chứng (Tối đa 3 video, mỗi video tối đa 50MB)
              </label>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {videos.length > 0 && (
                <div className="mt-2 space-y-2">
                  {videos.map((video, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{video.name}</p>
                        <p className="text-xs text-gray-500">{video.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RespondDisputeModal;
