import { Link } from 'react-router-dom';
import DisputeList from '../components/dispute/DisputeList';

const DisputesPage = () => {

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tranh chấp của tôi</h1>
      </div>

      <DisputeList />
    </div>
  );
};

export default DisputesPage;
