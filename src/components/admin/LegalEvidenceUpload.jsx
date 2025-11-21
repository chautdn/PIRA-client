import React, { useState } from 'react';
import { Upload, File, X, AlertTriangle, CheckCircle, FileText, Image as ImageIcon } from 'lucide-react';

/**
 * Component upload bằng chứng pháp lý
 * Cả renter và owner đều có thể upload
 */
const LegalEvidenceUpload = ({ dispute, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    fileUrl: '',
    fileType: 'PDF',
    fileName: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (dispute.status !== 'PENDING_LEGAL') {
    return null;
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File không được vượt quá 10MB');
      return;
    }

    // TODO: Upload to cloudinary or backend
    // For now, simulate upload
    setUploading(true);
    setError('');

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock file URL (replace with actual cloudinary upload)
      const mockUrl = `https://example.com/legal-evidence/${Date.now()}-${file.name}`;
      
      setFormData(prev => ({
        ...prev,
        fileUrl: mockUrl,
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'PDF' : 'IMAGE'
      }));

      setSuccess('File đã tải lên thành công!');
    } catch (err) {
      setError('Có lỗi khi tải file. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fileUrl) {
      setError('Vui lòng chọn file để upload');
      return;
    }

    if (!formData.description.trim()) {
      setError('Vui lòng mô tả bằng chứng');
      return;
    }

    try {
      setUploading(true);
      await onUpload(formData);
      
      // Reset form
      setFormData({
        fileUrl: '',
        fileType: 'PDF',
        fileName: '',
        description: ''
      });
      setSuccess('Bằng chứng pháp lý đã được gửi thành công!');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi gửi bằng chứng');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="text-amber-600" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Upload bằng chứng pháp lý
          </h3>
          <p className="text-sm text-gray-600">
            Tranh chấp đã chuyển sang giải quyết pháp lý
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-2">Yêu cầu bằng chứng pháp lý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Văn bản quyết định từ cơ quan có thẩm quyền (Tòa án, Trọng tài, Công an...)</li>
              <li>File định dạng PDF hoặc ảnh rõ ràng</li>
              <li>Kích thước tối đa 10MB</li>
              <li>Cả renter và owner đều có thể upload bằng chứng</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Existing Evidence */}
      {dispute.legalProcess?.legalEvidence && dispute.legalProcess.legalEvidence.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Bằng chứng đã upload:</h4>
          <div className="space-y-2">
            {dispute.legalProcess.legalEvidence.map((evidence, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {evidence.fileType === 'PDF' ? (
                  <FileText className="text-red-500 flex-shrink-0" size={24} />
                ) : (
                  <ImageIcon className="text-blue-500 flex-shrink-0" size={24} />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{evidence.fileName}</p>
                  <p className="text-sm text-gray-600">{evidence.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>
                      Upload bởi: <strong>{evidence.userRole}</strong>
                    </span>
                    <span>
                      {new Date(evidence.uploadedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <a
                  href={evidence.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Xem
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn file <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="legal-file-upload"
            />
            <label
              htmlFor="legal-file-upload"
              className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
                formData.fileUrl
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <Upload className="animate-pulse text-blue-600" size={24} />
                  <span className="text-blue-600 font-medium">Đang tải lên...</span>
                </>
              ) : formData.fileUrl ? (
                <>
                  <CheckCircle className="text-green-600" size={24} />
                  <div className="text-center">
                    <p className="text-green-700 font-medium">{formData.fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">Click để chọn file khác</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="text-gray-400" size={24} />
                  <div className="text-center">
                    <p className="text-gray-700 font-medium">Click để chọn file</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (tối đa 10MB)</p>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả bằng chứng <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="VD: Quyết định của Tòa án nhân dân quận X về việc..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !formData.fileUrl}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          <Upload size={20} />
          {uploading ? 'Đang gửi...' : 'Gửi bằng chứng pháp lý'}
        </button>
      </form>
    </div>
  );
};

export default LegalEvidenceUpload;
