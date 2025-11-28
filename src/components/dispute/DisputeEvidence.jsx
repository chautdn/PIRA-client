const DisputeEvidence = ({ evidence, title = "Bằng chứng" }) => {
  if (!evidence || (!evidence.images?.length && !evidence.description)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      
      {evidence.description && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Mô tả</p>
          <p className="text-sm text-gray-600">{evidence.description}</p>
        </div>
      )}

      {evidence.images && evidence.images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Hình ảnh ({evidence.images.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {evidence.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => window.open(image, '_blank')}
                  className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                >
                  <span className="text-white text-sm">Xem</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeEvidence;
