import React, { useRef } from "react";
import { toast } from "react-hot-toast";

const ImageUploader = ({ images, onChange, error }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only image files are allowed`);
        return;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 10MB`);
        return;
      }

      validFiles.push(file);
    });

    // Check total images limit
    if (images.length + validFiles.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    // Add new images with preview
    const newImages = validFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      isMain: images.length === 0 && index === 0, // First image is main
    }));

    onChange([...images, ...newImages]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (imageId) => {
    const filtered = images.filter((img) => img.id !== imageId);

    // If we removed the main image, make the first remaining image main
    if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
      filtered[0].isMain = true;
    }

    onChange(filtered);
  };

  const setMainImage = (imageId) => {
    const updated = images.map((img) => ({
      ...img,
      isMain: img.id === imageId,
    }));
    onChange(updated);
  };

  const reorderImages = (dragIndex, hoverIndex) => {
    const newImages = [...images];
    const draggedImage = newImages[dragIndex];

    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedImage);

    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-center w-full">
        <label
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
            error
              ? "border-red-500 bg-red-50 animate-shake"
              : "border-gray-300 hover:border-primary-400"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className={`w-12 h-12 mb-3 ${
                error ? "text-red-400" : "text-gray-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p
              className={`mb-2 text-sm ${
                error ? "text-red-600" : "text-gray-500"
              }`}
            >
              <span className="font-semibold">Nhấp để tải lên</span> hoặc kéo
              thả
            </p>
            <p
              className={`text-xs ${error ? "text-red-500" : "text-gray-500"}`}
            >
              PNG, JPG, GIF tối đa 10MB (Tối đa 10 ảnh)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg">
          <svg
            className="w-4 h-4 mr-1.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group border-2 rounded-lg overflow-hidden ${
                image.isMain ? "border-blue-500" : "border-gray-200"
              }`}
            >
              {/* Main Badge */}
              {image.isMain && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-10">
                  Main
                </div>
              )}

              {/* Image */}
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover"
              />

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                {!image.isMain && (
                  <button
                    type="button"
                    onClick={() => setMainImage(image.id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    title="Set as main image"
                  >
                    Main
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  title="Remove image"
                >
                  Remove
                </button>
              </div>

              {/* Image Index */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count Info */}
      {images.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {images.length} / 10 images uploaded
          {images.length > 0 && (
            <span className="ml-2">
              • {images.filter((img) => img.isMain).length > 0 ? "✅" : "⚠️"}{" "}
              Main image selected
            </span>
          )}
        </div>
      )}

      {/* AI Validation Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-1">
          🤖 AI Image Validation
        </h4>
        <p className="text-xs text-blue-700">
          Your images will be automatically validated to ensure they:
        </p>
        <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
          <li>Are appropriate and family-friendly</li>
          <li>Match your selected product category</li>
          <li>Meet quality standards</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUploader;
