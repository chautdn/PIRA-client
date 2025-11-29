const DisputeEvidence = ({ evidence, title = "Bằng chứng" }) => {
  // Support both 'photos' (from model) and 'images' (legacy)
  const photos = evidence?.photos || evidence?.images || [];
  const documents = evidence?.documents || [];
  const description = evidence?.additionalInfo || evidence?.description || '';

  if (!evidence || (photos.length === 0 && documents.length === 0 && !description)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      
      {description && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Mô tả</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Hình ảnh ({photos.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div 
                key={index} 
                className="relative group cursor-pointer"
                onClick={() => window.open(photo, '_blank')}
              >
                <img
                  src={photo}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-500 transition"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="text-white text-sm opacity-0 group-hover:opacity-100">
                    🔍 Xem chi tiết
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Tài liệu đính kèm ({documents.length})
          </p>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <a
                key={index}
                href={doc}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-sm"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-blue-700">Tài liệu {index + 1}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeEvidence;
