import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Camera, Upload, ZoomIn, ZoomOut, Check, AlertCircle, X, Trash2 } from 'lucide-react';

export const PhotoUploadModal = ({ isOpen, onClose, currentAvatar, onSavePhoto }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, WebP, or GIF).');
      return;
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      setError('Image file is too large. Maximum allowed size is 2MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!previewUrl && !selectedFile) {
      setError('Please select an image first.');
      return;
    }

    try {
      setProcessing(true);
      // Render to 360x360 canvas for crisp, optimized circular profile photo
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, 360, 360);

        // Circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(180, 180, 180, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Calculate aspect fill with zoom
        const imgAspect = img.width / img.height;
        let drawWidth, drawHeight;

        if (imgAspect > 1) {
          drawHeight = 360 * zoom;
          drawWidth = drawHeight * imgAspect;
        } else {
          drawWidth = 360 * zoom;
          drawHeight = drawWidth / imgAspect;
        }

        const offsetX = (360 - drawWidth) / 2;
        const offsetY = (360 - drawHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        onSavePhoto(optimizedBase64);
        setProcessing(false);
        handleClose();
      };
      img.src = previewUrl;
    } catch (err) {
      console.error('Failed to crop image', err);
      setError('Failed to process image. Please try another file.');
      setProcessing(false);
    }
  };

  const handleRemovePhoto = () => {
    if (window.confirm('Remove your profile photo and reset to student initials?')) {
      onSavePhoto('');
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setZoom(1);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Update Student Profile Photo">
      <div className="space-y-6">
        
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Circular Preview Container */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            {/* Outer ring */}
            <div className="w-48 h-48 rounded-full border-4 border-brand-orange/40 dark:border-brand-orange/30 p-1 shadow-uber overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              {previewUrl ? (
                <div 
                  className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center"
                  style={{ transform: `scale(${zoom})`, transition: 'transform 0.1s ease' }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Current Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-500">No Photo Selected</span>
                </div>
              )}
            </div>

            {/* Camera Overlay Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="absolute bottom-1 right-2 p-3 bg-brand-orange text-white rounded-full shadow-lg hover:brightness-110 active:scale-95 transition"
              title="Upload new image"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs">
            JPG, PNG, WebP or GIF up to 2MB. Your photo will be framed in a circle across CampusRide.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Zoom Slider when an image is loaded */}
        {previewUrl && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-brand-blue" />
                Fit & Zoom Image
              </span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.2"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-orange"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            {currentAvatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="btn-uber-outline !text-xs !text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-950/40 hover:!border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-uber-outline !text-xs !py-2.5 !px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!previewUrl || processing}
              onClick={handleApply}
              className="btn-uber-orange !text-xs !py-2.5 !px-5 disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              {processing ? 'Processing...' : 'Save Profile Photo'}
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

