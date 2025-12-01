import { useState } from 'react';
import { Link } from 'react-router-dom';
import DisputeList from '../components/dispute/DisputeList';
import CreateDisputeModal from '../components/dispute/CreateDisputeModal';
import { useDispute } from '../context/DisputeContext';

const DisputesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createDispute } = useDispute();

  const handleCreateDispute = async (data) => {
    await createDispute(data);
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tranh chấp của tôi</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Tạo tranh chấp mới
        </button>
      </div>

      <DisputeList />

      <CreateDisputeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDispute}
      />
    </div>
  );
};

export default DisputesPage;
