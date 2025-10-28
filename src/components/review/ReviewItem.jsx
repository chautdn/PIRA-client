import React, { useState, useRef, useEffect } from 'react';
import ConfirmModal from '../common/ConfirmModal';
import { toast } from '../common/Toast';

export default function ReviewItem({ review, isLiked, currentUserId, onEdit, onDelete, onReplyStart, isReplying, onReplySubmit, onHelpful, onReplyToResponse, onUpdateResponse, onDeleteResponse }) {
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRefTop = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (menuOpen && menuRefTop.current && !menuRefTop.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  // Recursive renderer for responses
  function ResponseNode({ resp, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [replyVal, setReplyVal] = useState('');
  const [replyFilesResp, setReplyFilesResp] = useState([]);
    const [editing, setEditing] = useState(false);
    const [editVal, setEditVal] = useState(resp.comment || '');
  const [editFiles, setEditFiles] = useState([]);

  const rawCommenterId = resp.commenter && (resp.commenter._id ? resp.commenter._id : resp.commenter);
  const commenterIdStr = rawCommenterId ? (rawCommenterId.toString ? rawCommenterId.toString() : String(rawCommenterId)) : null;
  const currentUserIdStr = currentUserId ? (currentUserId.toString ? currentUserId.toString() : String(currentUserId)) : null;
  const canEditOrDelete = !currentUserIdStr || (commenterIdStr && commenterIdStr === currentUserIdStr);

  const [menuOpenResp, setMenuOpenResp] = useState(false);
  const menuRefResp = useRef(null);

    const idOf = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (v._id) return (v._id.toString ? v._id.toString() : String(v._id));
      try {
        if (v.toString) return v.toString();
      } catch (e) {
        // ignore
      }
      return String(v);
    };

    const [showConfirmResp, setShowConfirmResp] = useState(false);

    const sendReplyToResp = async () => {
      if (!replyVal.trim()) return toast.error('Nhập nội dung phản hồi');
      try {
        const rid = idOf(resp);
        if (!rid) return toast.error('Không xác định được phản hồi để trả lời');
        await onReplyToResponse && onReplyToResponse(rid, replyVal, replyFilesResp);
        setReplyVal('');
        setReplyFilesResp([]);
        setReplying(false);
      } catch (e) {
        console.error(e);
        toast.error('Lỗi khi gửi phản hồi');
      }
    };

    const saveEdit = async () => {
      try {
        const rid = idOf(resp);
        if (!rid) return toast.error('Không xác định được phản hồi để cập nhật');
        await onUpdateResponse && onUpdateResponse(rid, editVal, editFiles);
        setEditing(false);
        toast.success('Cập nhật phản hồi thành công');
      } catch (e) {
        console.error(e);
        toast.error('Lỗi khi cập nhật');
      }
    };

    const removeResp = async () => {
      // show modal
      setShowConfirmResp(true);
    };

    const confirmRemoveResp = async () => {
      try {
        const rid = idOf(resp);
        if (!rid) return toast.error('Không xác định được phản hồi để xóa');
        await onDeleteResponse && onDeleteResponse(rid);
        toast.success('Đã xóa phản hồi');
      } catch (e) {
        console.error(e);
        toast.error('Lỗi khi xóa');
      } finally {
        setShowConfirmResp(false);
      }
    };

    // close menu when clicking outside
    useEffect(() => {
      function onDocClick(e) {
        if (menuOpenResp && menuRefResp.current && !menuRefResp.current.contains(e.target)) {
          setMenuOpenResp(false);
        }
      }
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }, [menuOpenResp]);

    return (
      <div className={`p-3 border-l-4 ${depth % 2 === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} rounded`}>
        {!editing ? (
          <>
            <div className="text-sm text-gray-700">{resp.comment}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">{resp.respondedAt ? new Date(resp.respondedAt).toLocaleString() : ''}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <button onClick={() => setReplying(!replying)} className="hover:underline">Phản hồi</button>
                  <button onDoubleClick={() => onHelpful && onHelpful('response', idOf(resp))} onClick={() => onHelpful && onHelpful('response', idOf(resp))} className={`px-2 py-1 rounded hover:bg-gray-100 ${ (resp.likedBy && currentUserIdStr && resp.likedBy.some(u => u === currentUserIdStr || u === currentUserId)) ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    Like
                  </button>
                </div>

                <div className="relative" ref={menuRefResp}>
                  <button
                    onClick={() => setMenuOpenResp(!menuOpenResp)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpenResp}
                    className="p-1 rounded hover:bg-gray-100 text-gray-600"
                    title="Thao tác"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  {menuOpenResp && (
                    <div role="menu" className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg p-1 z-10 min-w-[140px]">
                      <button
                        role="menuitem"
                        onClick={() => { setMenuOpenResp(false); setEditing(true); }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path d="M4 13v3h3l9-9a1.5 1.5 0 00-2-2L5 14z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-gray-700">Chỉnh sửa</span>
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => { setMenuOpenResp(false); removeResp(); }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 6v14a2 2 0 002 2h4a2 2 0 002-2V6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>
            <textarea value={editVal} onChange={(e) => setEditVal(e.target.value)} className="w-full p-2 border rounded h-20" />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1 rounded bg-gray-200">Hủy</button>
              <button onClick={saveEdit} className="px-3 py-1 rounded bg-blue-600 text-white">Lưu</button>
            </div>
          </div>
        )}

        {replying && (
          <div className="mt-2">
            <textarea value={replyVal} onChange={(e) => setReplyVal(e.target.value)} className="w-full p-2 border rounded h-20" placeholder="Viết phản hồi..." />
            <div className="mt-2">
              <input type="file" accept="image/*" multiple onChange={(e) => setReplyFilesResp(Array.from(e.target.files))} />
              {replyFilesResp && replyFilesResp.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">{replyFilesResp.map(f => f.name).join(', ')}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => { setReplyVal(''); setReplying(false); }} className="px-3 py-1 rounded bg-gray-200">Hủy</button>
              <button onClick={sendReplyToResp} className="px-3 py-1 rounded bg-blue-600 text-white">Gửi</button>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirmResp}
          title="Xác nhận xóa"
          message="Bạn có chắc muốn xóa phản hồi này? Hành động này sẽ xóa cả các phản hồi con."
          onConfirm={confirmRemoveResp}
          onCancel={() => setShowConfirmResp(false)}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
        />

        {/* render nested responses */}
        {resp.responses && resp.responses.length > 0 && (
          <div className="mt-2 space-y-2">
            {resp.responses.map((child) => (
              <ResponseNode key={child._id} resp={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const sendReply = async () => {
    if (!replyText.trim()) return toast.error('Nhập nội dung phản hồi');
    setReplyLoading(true);
    try {
      await onReplySubmit && onReplySubmit(replyText, replyFiles);
      setReplyText('');
      setReplyFiles([]);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gửi phản hồi');
    } finally {
      setReplyLoading(false);
    }
  };

  const name = review.reviewer?.profile?.firstName || review.reviewer?.email || 'Người dùng';
  const date = review.createdAt ? new Date(review.createdAt).toLocaleString() : '';

    return (
      <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-base">
          {name[0] || 'U'}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-sm">{name}</div>
              <div className="text-xs text-gray-500">{date}</div>
            </div>
            <div className="text-yellow-400 font-bold text-sm">{review.rating}★</div>
          </div>

          <div className="mt-2 text-sm">
            {review.title && <div className="font-semibold mb-1">{review.title}</div>}
            <div className="text-gray-700">{review.comment}</div>

            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 mt-3">
                {review.photos.map((p, i) => (
                  <img key={i} src={p} alt="photo" className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

                  {review.responses && review.responses.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-600">
                        <button onClick={() => setExpanded(!expanded)} className="hover:underline">{expanded ? 'Ẩn bớt' : `Xem tất cả ${review.responses.length} phản hồi`}</button>
                        {expanded && (
                          <div className="mt-2 space-y-2">
                            {review.responses.map((r) => (
                              <ResponseNode key={r._id} resp={r} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <button onClick={() => onReplyStart && onReplyStart(review)} className="hover:underline">Phản hồi</button>
              <button onDoubleClick={() => onHelpful && onHelpful('review')} onClick={() => onHelpful && onHelpful('review')} className={`px-2 py-1 rounded hover:bg-gray-100 ${isLiked ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                Like
              </button>
            </div>

            <div className="relative" ref={menuRefTop}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                title="Thao tác"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg p-1 z-10 min-w-[140px]">
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onEdit && onEdit(review); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M4 13v3h3l9-9a1.5 1.5 0 00-2-2L5 14z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gray-700">Chỉnh sửa</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onDelete && onDelete(review); }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6v14a2 2 0 002 2h4a2 2 0 002-2V6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Xóa</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {isReplying && (
            <div className="mt-3">
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full p-2 border rounded h-20" placeholder="Viết phản hồi..." />
              <div className="mt-2">
                <input type="file" accept="image/*" multiple onChange={(e) => setReplyFiles(Array.from(e.target.files))} />
                {replyFiles && replyFiles.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">{replyFiles.map(f => f.name).join(', ')}</div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => { setReplyText(''); if (onReplyStart) onReplyStart(null); }} className="px-4 py-2 rounded bg-gray-200">Hủy</button>
                <button onClick={sendReply} disabled={replyLoading} className="px-4 py-2 rounded bg-blue-600 text-white">Gửi</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
