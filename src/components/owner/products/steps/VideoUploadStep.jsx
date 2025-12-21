import React, { useState } from "react";
import { Upload, X, Video, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useI18n } from "../../../../hooks/useI18n";

const VideoUploadStep = ({ formData, handleInputChange, errors }) => {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [validationResults, setValidationResults] = useState([]);

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate file count
    if (files.length > 5) {
      toast.error(t("productForm.videoUpload.maxVideosError"));
      return;
    }

    // Validate file size (100MB max per video)
    const maxSize = 100 * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error(
        `${t("productForm.videoUpload.oversizedError")}: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
      return;
    }

    // Validate file type
    const invalidFiles = files.filter((f) => !f.type.startsWith("video/"));
    if (invalidFiles.length > 0) {
      toast.error(t("productForm.videoUpload.invalidTypeError"));
      return;
    }

    // Create preview URLs
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    }));

    setPreviewVideos(previews);
    handleInputChange({
      target: {
        name: "videos",
        value: files,
      },
    });
  };

  const removeVideo = (index) => {
    const newPreviews = previewVideos.filter((_, i) => i !== index);
    setPreviewVideos(newPreviews);

    // Revoke object URL to free memory
    URL.revokeObjectURL(previewVideos[index].url);

    handleInputChange({
      target: {
        name: "videos",
        value: newPreviews.map((p) => p.file),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t("productForm.videoUpload.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t("productForm.videoUpload.description")}
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="video-upload"
          accept="video/*"
          multiple
          onChange={handleVideoSelect}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="video-upload"
          className="cursor-pointer flex flex-col items-center space-y-3"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {t("productForm.videoUpload.clickToUpload")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t("productForm.videoUpload.fileFormats")}
            </p>
          </div>
        </label>
      </div>

      {errors.videos && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{errors.videos}</span>
        </div>
      )}

      {/* Video Previews */}
      {previewVideos.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">
            {t("productForm.videoUpload.selectedVideos")} (
            {previewVideos.length}/5)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previewVideos.map((preview, index) => (
              <div
                key={index}
                className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
              >
                <video
                  src={preview.url}
                  controls
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {preview.name}
                      </p>
                      <p className="text-xs text-gray-500">{preview.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Video className="w-4 h-4" />
          {t("productForm.videoUpload.guidelinesTitle")}
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>{t("productForm.videoUpload.guideline1")}</li>
          <li>{t("productForm.videoUpload.guideline2")}</li>
          <li>{t("productForm.videoUpload.guideline3")}</li>
          <li>{t("productForm.videoUpload.guideline4")}</li>
          <li>{t("productForm.videoUpload.guideline5")}</li>
          <li>{t("productForm.videoUpload.guideline6")}</li>
        </ul>
      </div>

      {/* Validation Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {t("productForm.videoUpload.moderationTitle")}
        </h4>
        <p className="text-sm text-yellow-800">
          {t("productForm.videoUpload.moderationDesc")}
        </p>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside mt-2">
          <li>{t("productForm.videoUpload.moderationCheck1")}</li>
          <li>{t("productForm.videoUpload.moderationCheck2")}</li>
        </ul>
        <p className="text-sm text-yellow-800 mt-2">
          {t("productForm.videoUpload.moderationWarning")}
        </p>
      </div>
    </div>
  );
};

export default VideoUploadStep;
