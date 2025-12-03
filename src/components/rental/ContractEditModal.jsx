import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileEdit, AlertCircle } from 'lucide-react';
import rentalOrderService from '../../services/rentalOrder';
import { toast } from '../common/Toast';

const ContractEditModal = ({ contractId, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);
  const [additionalTerms, setAdditionalTerms] = useState([]);
  const [customClauses, setCustomClauses] = useState('');
  const [specialConditions, setSpecialConditions] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await rentalOrderService.getContractForEditing(contractId);
      
      // Extract contract from response - handle both data and metadata structures
      const contractData = response.metadata?.contract || response.data?.contract || response.contract || response;
      
      if (!contractData) {
        throw new Error('Không nhận được dữ liệu hợp đồng từ server');
      }
      
      setContract(contractData);
      
      // Load existing editable terms if any
      if (contractData.editableTerms) {
        setAdditionalTerms(contractData.editableTerms.additionalTerms || []);
        setCustomClauses(contractData.editableTerms.customClauses || '');
        setSpecialConditions(contractData.editableTerms.specialConditions || '');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading contract:', error);
      setError(error.message);
      setLoading(false);
      toast.error(error.message || 'Không thể tải hợp đồng');
    }
  };

  const handleAddTerm = () => {
    setAdditionalTerms([...additionalTerms, { title: '', content: '' }]);
  };

  const handleRemoveTerm = (index) => {
    const newTerms = additionalTerms.filter((_, i) => i !== index);
    setAdditionalTerms(newTerms);
  };

  const handleTermChange = (index, field, value) => {
    const newTerms = [...additionalTerms];
    newTerms[index][field] = value;
    setAdditionalTerms(newTerms);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate terms
      const validTerms = additionalTerms.filter(t => t.title.trim() && t.content.trim());

      const editData = {
        additionalTerms: validTerms,
        customClauses,
        specialConditions
      };

      await rentalOrderService.updateContractTerms(contractId, editData);
      
      toast.success('Cập nhật điều khoản hợp đồng thành công');
      
      if (onSaved) {
        onSaved();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving contract terms:', error);
      setError(error.message);
      toast.error(error.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-center">Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileEdit className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa hợp đồng</h2>
              <p className="text-sm text-gray-600">
                Hợp đồng #{contract?.contractNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Lỗi</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Lưu ý:</strong> Bạn chỉ có thể chỉnh sửa hợp đồng trước khi ký. 
              Sau khi lưu thay đổi, vui lòng xem lại hợp đồng trước khi tiến hành ký.
            </p>
          </div>

          {/* Additional Terms */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Điều khoản bổ sung
              </label>
              <button
                onClick={handleAddTerm}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm điều khoản</span>
              </button>
            </div>
            
            {additionalTerms.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">Chưa có điều khoản bổ sung</p>
                <button
                  onClick={handleAddTerm}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Thêm điều khoản đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {additionalTerms.map((term, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Điều khoản {index + 1}</h4>
                      <button
                        onClick={() => handleRemoveTerm(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Xóa điều khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={term.title}
                        onChange={(e) => handleTermChange(index, 'title', e.target.value)}
                        placeholder="Tiêu đề điều khoản"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        value={term.content}
                        onChange={(e) => handleTermChange(index, 'content', e.target.value)}
                        placeholder="Nội dung điều khoản"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Clauses */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Điều khoản tùy chỉnh
            </label>
            <textarea
              value={customClauses}
              onChange={(e) => setCustomClauses(e.target.value)}
              placeholder="Nhập các điều khoản tùy chỉnh của bạn..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bạn có thể nhập nội dung tự do, tối đa 10,000 ký tự
            </p>
          </div>

          {/* Special Conditions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Điều kiện đặc biệt
            </label>
            <textarea
              value={specialConditions}
              onChange={(e) => setSpecialConditions(e.target.value)}
              placeholder="Nhập các điều kiện đặc biệt (nếu có)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ví dụ: Điều kiện về bảo hiểm, bảo trì, quy định sử dụng đặc biệt...
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu & Tiếp tục ký'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractEditModal;
