import React, { useEffect, useState } from 'react';
import { reviewService } from '../../services/review';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import { useAuth } from '../../hooks/useAuth';
import ConfirmModal from '../common/ConfirmModal';
import { toast } from '../common/Toast';

export default function ReviewList({ productId, refreshKey, onReviewsChanged, filterTarget, filterReviewee, pendingCreatedReview, onConsumePending }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const { user } = useAuth();

  const fetch = async () => {
    setLoading(true);
    try {
        const params = { page: 1, limit: 50 };
        if (filterTarget) params.target = filterTarget;
        if (filterReviewee) params.reviewee = filterReviewee;
      const resp = await reviewService.listByProduct(productId, params);
      let items = resp.data.data || [];

      // If parent provided a pending created review, and it's not in the fetched items,
      // merge it to the front so user sees it immediately.
      if (pendingCreatedReview && pendingCreatedReview._id) {
        const exists = items.some(i => i._id === pendingCreatedReview._id);
        // Only merge if it matches current filterTarget/reviewee semantics
        let matchesFilter = true;
        if (filterTarget === 'PRODUCT') {
          // product reviews don't have reviewee, always ok
          matchesFilter = (pendingCreatedReview.type === 'PRODUCT_REVIEW' || !pendingCreatedReview.type);
        } else if (filterTarget === 'OWNER' || filterTarget === 'SHIPPER') {
          // ensure pending's reviewee equals filterReviewee if provided, otherwise compare against presence
          if (filterReviewee) {
            matchesFilter = (pendingCreatedReview.reviewee && (pendingCreatedReview.reviewee === filterReviewee || (pendingCreatedReview.reviewee._id && pendingCreatedReview.reviewee._id === filterReviewee)));
          } else {
            // if no filterReviewee provided but target is OWNER/SHIPPER, we rely on the server-side product-derived reviewee.
            // In this case, only merge if pendingCreatedReview.reviewee is falsy OR its reviewee exists (we still merge to show immediate feedback).
            matchesFilter = true;
          }
        }

        if (!exists && matchesFilter) {
          items = [pendingCreatedReview, ...items];
          // inform parent we've consumed the pending item so it won't be reused
          onConsumePending && onConsumePending();
        }
      }

      setReviews(items);
      // compute simple stats and notify parent if provided
      if (onReviewsChanged) {
        const count = items.length;
        const avg = count ? (items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) : 0;
        try { onReviewsChanged({ count, average: avg }); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [productId, refreshKey]);

  // If parent passed a newly created review (created while product.shipper may be missing),
  // prepend it to local list so user sees it immediately.
  useEffect(() => {
    if (!pendingCreatedReview) return;
    try {
      const exists = reviews.some(r => r._id === pendingCreatedReview._id);
      if (!exists) {
        setReviews(prev => [pendingCreatedReview, ...prev]);
        // notify parent about updated stats
        if (onReviewsChanged) {
          const count = (reviews.length || 0) + 1;
          const avg = ( (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0)) + (Number(pendingCreatedReview.rating) || 0) ) / count;
          try { onReviewsChanged({ count, average: avg }); } catch (e) { /* ignore */ }
        }
      }
    } finally {
      // tell parent we've consumed it (so it won't resend)
      onConsumePending && onConsumePending();
    }
  }, [pendingCreatedReview]);

  const handleEdit = (r) => setEditing(r);
  const [showConfirmReviewId, setShowConfirmReviewId] = useState(null);

  const handleDelete = (r) => {
    // show confirmation modal
    setShowConfirmReviewId(r._id);
  };

  const confirmDeleteReview = async () => {
    const id = showConfirmReviewId;
    if (!id) return setShowConfirmReviewId(null);
    try {
      await reviewService.remove(id);
      // refresh local list (fetch will also notify parent with stats)
      await fetch();
      toast.success('Đã xóa đánh giá');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa');
    } finally {
      setShowConfirmReviewId(null);
    }
  };

  const handleReply = (r) => setReplyingId(r ? r._id : null);

  // Submit a reply and update local state immediately
  const handleReplySubmit = async (reviewId, text, files = []) => {
    try {
      let res;
      if (files && files.length) {
        const fd = new FormData();
        fd.append('comment', text);
        for (const f of files) fd.append('photos', f);
        res = await reviewService.reply(reviewId, fd);
      } else {
        res = await reviewService.reply(reviewId, { comment: text });
      }
      const updated = res.data.data;
      setReviews((prev) => prev.map((it) => (it._id === reviewId ? updated : it)));
      setReplyingId(null);
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gửi phản hồi');
    }
  };

  // helper to update nested response by id (returns new responses array)
  function updateNestedResponseArray(responses = [], responseId, updater) {
    if (!responses || !responses.length) return responses;
    return responses.map((r) => {
      if (r._id === responseId || (r._id && r._id.toString() === responseId.toString())) {
        return updater(r);
      }
      if (r.responses && r.responses.length) {
        return { ...r, responses: updateNestedResponseArray(r.responses, responseId, updater) };
      }
      return r;
    });
  }

  // helper to find nested response object by id (non-mutating)
  function findNestedResponse(responses = [], responseId) {
    if (!responses || !responses.length) return null;
    for (const r of responses) {
      if (r._id === responseId || (r._id && r._id.toString() === (responseId && responseId.toString()))) return r;
      if (r.responses && r.responses.length) {
        const found = findNestedResponse(r.responses, responseId);
        if (found) return found;
      }
    }
    return null;
  }

  const handleHelpful = async (review, target = 'review', responseId) => {
    try {
      // Optimistic toggle: update review.helpfulness or response.helpfulness
      let hasLiked = false;
      if (!user) {
        hasLiked = false;
      } else if (target === 'review') {
        hasLiked = review.likedBy && review.likedBy.some(u => u === user._id || u === user._id?.toString());
      } else if (target === 'response') {
        // determine liked status from the specific nested response
        const resp = findNestedResponse(review.responses || [], responseId);
        if (resp && resp.likedBy) {
          hasLiked = resp.likedBy.some(u => u === user._id || u === user._id?.toString());
        } else {
          // fallback: check any response
          hasLiked = review.responses && review.responses.some(r => r.likedBy && r.likedBy.some(u => u === user._id || u === user._id?.toString()));
        }
      }

      setReviews((prev) => prev.map((it) => {
        if (it._id !== review._id) return it;
        if (target === 'response' && it.responses) {
          // update the specific nested response by responseId if provided
          if (responseId) {
            const newResponses = updateNestedResponseArray(it.responses, responseId, (resp) => {
              const current = resp.helpfulness?.helpful || 0;
              return {
                ...resp,
                helpfulness: { ...resp.helpfulness, helpful: hasLiked ? Math.max(0, current - 1) : current + 1 },
                likedBy: hasLiked ? (resp.likedBy || []).filter(u => u !== user._id && u !== user._id?.toString()) : [ ...(resp.likedBy || []), (user?._id || 'guest')]
              };
            });
            return { ...it, responses: newResponses };
          }
          // fallback: update last response
          const idx = it.responses.length - 1;
          const current = it.responses[idx].helpfulness?.helpful || 0;
          const newResponses = it.responses.map((resp, i) => i === idx ? {
            ...resp,
            helpfulness: { ...resp.helpfulness, helpful: hasLiked ? Math.max(0, current - 1) : current + 1 },
            likedBy: hasLiked ? (resp.likedBy || []).filter(u => u !== user._id && u !== user._id?.toString()) : [ ...(resp.likedBy || []), (user?._id || 'guest')]
          } : resp);
          return { ...it, responses: newResponses };
        }
        const current = it.helpfulness?.helpful || 0;
        return {
          ...it,
          helpfulness: { ...it.helpfulness, helpful: hasLiked ? Math.max(0, current - 1) : current + 1 },
          likedBy: hasLiked ? (it.likedBy || []).filter(u => u !== user._id && u !== user._id?.toString()) : [ ...(it.likedBy || []), (user?._id || 'guest')]
        };
      }));
      await reviewService.helpful(review._id, 'helpful', { userId: user?._id, target, responseId });
    } catch (err) {
      console.error(err);
      // Optionally refetch on failure
      fetch();
    }
  };

  // Reply to a nested response
  const handleReplyToResponse = async (reviewId, responseId, text, files = []) => {
    try {
      let resp;
      if (files && files.length) {
        const fd = new FormData();
        fd.append('comment', text);
        for (const f of files) fd.append('photos', f);
        resp = await reviewService.replyToResponse(reviewId, responseId, fd);
      } else {
        resp = await reviewService.replyToResponse(reviewId, responseId, { comment: text });
      }
      const updated = resp.data.data;
      setReviews((prev) => prev.map((it) => (it._id === reviewId ? updated : it)));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gửi phản hồi');
    }
  };

  const handleUpdateResponse = async (reviewId, responseId, text, files = []) => {
    try {
      let resp;
      if (files && files.length) {
        const fd = new FormData();
        fd.append('comment', text);
        for (const f of files) fd.append('photos', f);
        resp = await reviewService.updateResponse(reviewId, responseId, fd);
      } else {
        resp = await reviewService.updateResponse(reviewId, responseId, { comment: text });
      }
      const updated = resp.data.data;
      setReviews((prev) => prev.map((it) => (it._id === reviewId ? updated : it)));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật phản hồi');
    }
  };

  const handleDeleteResponse = async (reviewId, responseId) => {
    try {
      await reviewService.deleteResponse(reviewId, responseId);
      // refresh list
      fetch();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa phản hồi');
    }
  };

  const onSaved = () => {
    setEditing(null);
    setReplyingId(null);
    // refresh list and let fetch() notify parent with updated stats
    fetch();
  };


  if (loading) return <div>Đang tải đánh giá...</div>;

  return (
    <div className="space-y-4">
      {editing && (
        <div className="p-4 bg-white rounded">
          <h4 className="font-bold mb-2">Chỉnh sửa đánh giá</h4>
          <ReviewForm existing={editing} productId={productId} onSaved={onSaved} onCancel={() => setEditing(null)} />
        </div>
      )}

      {/* Inline reply form is rendered inside each ReviewItem when replyingId matches */}

      {reviews.length === 0 && <div className="text-gray-500">Chưa có đánh giá nào</div>}

      {reviews.map(r => {
        const isLiked = user && r.likedBy && r.likedBy.some(u => u === user._id || u === user._id?.toString()) || (!user && r.likedBy && r.likedBy.includes('guest'));
        return (
          <ReviewItem
            key={r._id}
            review={r}
            isLiked={isLiked}
            currentUserId={user?._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReplyStart={() => handleReply(r)}
            isReplying={replyingId === r._id}
            onReplySubmit={(text, files) => handleReplySubmit(r._id, text, files)}
              onHelpful={(target, responseId) => handleHelpful(r, target || 'review', responseId)}
              onReplyToResponse={(responseId, text, files) => handleReplyToResponse(r._id, responseId, text, files)}
              onUpdateResponse={(responseId, text, files) => handleUpdateResponse(r._id, responseId, text, files)}
              onDeleteResponse={(responseId) => handleDeleteResponse(r._id, responseId)}
          />
        );
      })}
      <ConfirmModal
        isOpen={!!showConfirmReviewId}
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc muốn xóa đánh giá này? Hành động này sẽ xóa tất cả phản hồi liên quan."
        onConfirm={confirmDeleteReview}
        onCancel={() => setShowConfirmReviewId(null)}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
      />
    </div>
  );
}

// Note: Reply form is rendered inline inside ReviewItem for better UX
