import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, Eye, Trash2, RefreshCw, AlertCircle, Sparkles, ZoomIn, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setError('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    setError(null);
    setCompressing(true);

    try {
      // Compress client-side to max 1200px and ~70KB to take minimum storage while maintaining crystal clear ID text
      const result = await compressImageFile(file, file.name, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.72,
        targetMaxKb: 100,
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="doc-photo-upload-wrapper" style={{ marginTop: '8px' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {value ? (
        /* Uploaded & Compressed State */
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
          <div style={{ flex: 1, minWidth: 0 }}>
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
                  ({compressionStats.savedPercentage}% storage saved)
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Document photo optimized & ready
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 8px', fontSize: '0.74rem' }}
              onClick={() => setIsLightboxOpen(true)}
              title="Inspect Photo"
            >
              <Eye size={13} /> View
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 8px', fontSize: '0.74rem' }}
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo"
            >
              <RefreshCw size={13} /> Retake
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ padding: '5px 8px', fontSize: '0.74rem' }}
              onClick={handleRemove}
              title="Remove Photo"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Upload Dropzone State */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${isDragOver ? accentColor : 'rgba(255, 255, 255, 0.2)'}`,
            background: isDragOver ? 'rgba(225, 29, 72, 0.12)' : 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(225, 29, 72, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            {compressing ? (
              <RefreshCw size={18} className="spin-anim" />
            ) : (
              <Camera size={18} />
            )}
          </div>

          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
            {compressing ? 'Compressing & Optimizing Photo...' : `Upload or Take ${label} Photo`}
            {required && <span style={{ color: '#fb7185', marginLeft: '4px' }}>*</span>}
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8', maxWidth: '300px' }}>
            {subLabel || 'Tap to take photo or choose file. Auto-compressed (<100 KB) for instant verification.'}
          </div>

          <div
            style={{
              marginTop: '4px',
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
            <Sparkles size={11} /> Smart Low-Storage Compression
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
