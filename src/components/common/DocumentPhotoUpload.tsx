import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ZoomIn,
  X,
  Upload,
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface DocumentPhotoUploadProps {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange: (dataUrl?: string) => void;
  required?: boolean;
  accentColor?: string;
}

export const DocumentPhotoUpload: React.FC<DocumentPhotoUploadProps> = ({
  id,
  label,
  subLabel,
  icon,
  value,
  onChange,
  required = false,
  accentColor = '#e11d48',
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSizeKb: number;
    compressedSizeKb: number;
    savedPercentage: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WebP, HEIC).');
      return;
    }

    setError(null);
    setCompressing(true);

    try {
      // Compress client-side to max 900px and ~50-65KB to take minimum storage while maintaining crystal clear ID text
      const result = await compressImageFile(file, file.name, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.68,
        targetMaxKb: 65,
      });

      setCompressionStats({
        originalSizeKb: result.originalSizeKb,
        compressedSizeKb: result.sizeKb,
        savedPercentage: result.reductionPercentage,
      });

      onChange(result.dataUrl);
    } catch (err: any) {
      setError(err?.message || 'Failed to process document photo.');
    } finally {
      setCompressing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset inputs so selecting the same file again triggers change event
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setCompressionStats(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="doc-photo-upload-wrapper" style={{ marginTop: '8px' }}>
      {/* Camera-specific input (opens camera on mobile devices) */}
      <input
        ref={cameraInputRef}
        id={`${id}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Gallery / File Picker input (opens photo library or files on mobile/desktop without forcing camera) */}
      <input
        ref={galleryInputRef}
        id={`${id}-gallery`}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {value ? (
        /* Uploaded & Attached State */
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1.5px solid rgba(225, 29, 72, 0.45)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'all 0.2s ease',
            flexWrap: 'wrap',
          }}
        >
          {/* Thumbnail preview */}
          <div
            style={{
              position: 'relative',
              width: '68px',
              height: '52px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
            onClick={() => setIsLightboxOpen(true)}
            title="Click to zoom / inspect"
          >
            <img
              src={value}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.85,
              }}
            >
              <ZoomIn size={16} color="#ffffff" />
            </div>
          </div>

          {/* Info & Compression metrics */}
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>{label} Attached</span>
            </div>

            {compressionStats ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  ⚡ Compressed: {compressionStats.compressedSizeKb} KB
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  ({compressionStats.savedPercentage}% saved)
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Photo optimized & verified
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 9px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setIsLightboxOpen(true)}
              title="Inspect Photo"
            >
              <Eye size={13} /> View
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 9px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => cameraInputRef.current?.click()}
              title="Retake with Camera"
            >
              <Camera size={13} /> Camera
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 9px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => galleryInputRef.current?.click()}
              title="Choose from Gallery / Files"
            >
              <ImageIcon size={13} /> Gallery
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ padding: '6px 9px', fontSize: '0.74rem' }}
              onClick={handleRemove}
              title="Remove Photo"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Choose File or Photo Option State */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${isDragOver ? accentColor : 'rgba(255, 255, 255, 0.22)'}`,
            background: isDragOver ? 'rgba(225, 29, 72, 0.14)' : 'rgba(0, 0, 0, 0.32)',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Header info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {compressing ? (
                <>
                  <RefreshCw size={15} className="spin-anim" color={accentColor} />
                  <span>Compressing Photo...</span>
                </>
              ) : (
                <>
                  <span>Upload or Snap {label} Photo</span>
                  {required && <span style={{ color: '#fb7185' }}>*</span>}
                </>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', maxWidth: '340px' }}>
              {subLabel || 'Choose a photo from your gallery/files or take a new photo with camera.'}
            </div>
          </div>

          {/* Action Choice Buttons: Camera vs Gallery */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            {/* Option 1: Choose from Gallery / Files */}
            <button
              type="button"
              disabled={compressing}
              onClick={(e) => {
                e.stopPropagation();
                galleryInputRef.current?.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '9px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <ImageIcon size={16} color="#38bdf8" />
              <span>Choose from Gallery</span>
            </button>

            {/* Option 2: Take Photo with Camera */}
            <button
              type="button"
              disabled={compressing}
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '9px 12px',
                background: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(225, 29, 72, 0.28)';
                e.currentTarget.style.borderColor = '#e11d48';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(225, 29, 72, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.4)';
              }}
            >
              <Camera size={16} color="#fb7185" />
              <span>Take Photo</span>
            </button>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              color: '#6ee7b7',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <Sparkles size={11} /> Auto-compressed for fast verification
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      {/* Lightbox / Modal for full photo inspection */}
      {isLightboxOpen && value && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '650px',
              width: '100%',
              background: '#130508',
              borderRadius: '16px',
              border: '2px solid rgba(225, 29, 72, 0.5)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>
                {label} (Verified Document)
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#0a0204' }}>
              <img
                src={value}
                alt={label}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}
              />
            </div>

            <div
              style={{
                padding: '10px 16px',
                background: 'rgba(0,0,0,0.5)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.76rem',
                color: '#94a3b8',
              }}
            >
              <span>Encrypted & compressed for private club security verification</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsLightboxOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
