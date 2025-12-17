import { Link } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import DisputeList from '../components/dispute/DisputeList';

const DisputesPage = () => {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("disputes.title")}</h1>
      </div>

      <DisputeList />
    </div>
  );
};

export default DisputesPage;
