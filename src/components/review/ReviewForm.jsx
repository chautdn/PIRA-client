import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/review';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../common/Toast';

export default function ReviewForm({ productId, orderId, target, reviewee, existing, onSaved, onCancel }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existing?.rating || 5);
  const [title, setTitle] = useState(existing?.title || '');
  const [comment, setComment] = useState(existing?.comment || '');
  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      previewUrls.forEach(URL.revokeObjectURL);
    };
  }, [previewUrls]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
  };

  const buildForm = () => {
    const fd = new FormData();
    fd.append('order', orderId || '');
    fd.append('product', productId);
    if (reviewee) fd.append('reviewee', reviewee);
    fd.append('type', target === 'PRODUCT' ? 'PRODUCT_REVIEW' : 'USER_REVIEW');
  // include the explicit target role so server can mark intendedFor when reviewee missing
  if (target === 'OWNER' || target === 'SHIPPER') fd.append('targetRole', target);
    fd.append('rating', String(rating));
    fd.append('title', title);
    fd.append('comment', comment);
    fd.append('detailedRating', JSON.stringify({}));
    photos.forEach((f) => fd.append('photos', f));
    return fd;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = buildForm();
      // If editing
      if (existing?._id) {
        await reviewService.update(existing._id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const resp = await reviewService.create(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const created = resp.data && resp.data.data ? resp.data.data : null;
        onSaved && onSaved(created);
        return;
      }
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-gray-600 mb-2">Đánh giá</div>
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setRating(i)} className={`text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
          ))}
        </div>
      </div>

      <div>
        <textarea placeholder="Nội dung đánh giá" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2 border rounded h-28" />
      </div>

      <div>
        <label className="text-sm text-gray-600 mb-2 block">Ảnh (tùy chọn)</label>
        <input type="file" multiple accept="image/*" onChange={handleFiles} />
        <div className="flex gap-2 mt-2">
          {previewUrls.map((u, idx) => (
            <img key={idx} src={u} alt="preview" className="w-20 h-20 object-cover rounded" />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200">Hủy</button>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded bg-green-500 text-white">{existing? 'Lưu' : 'Gửi'}</button>
      </div>
    </div>
  );
}
