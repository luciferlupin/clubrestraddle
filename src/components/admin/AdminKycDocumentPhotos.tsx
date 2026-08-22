import React, { useState } from 'react';
import { Eye, FileImage, X } from 'lucide-react';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';

interface AdminKycDocumentPhotosProps {
  aadhaarPhotoUrl?: string;
  panPhotoUrl?: string;
  onAadhaarChange?: (url?: string) => void;
  onPanChange?: (url?: string) => void;
}

export const AdminKycDocumentPhotos: React.FC<AdminKycDocumentPhotosProps> = ({ aadhaarPhotoUrl, panPhotoUrl, onAadhaarChange, onPanChange }) => {
  const [preview, setPreview] = useState<{ label: string; url: string } | null>(null);
  const documents = [
    { label: 'Aadhaar Card', url: aadhaarPhotoUrl, onChange: onAadhaarChange },
    { label: 'PAN Card', url: panPhotoUrl, onChange: onPanChange },
  ];

  return (
    <>
      <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '9px' }}>
          KYC document photos
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          {documents.map((document) => document.url ? (
            <button
              key={document.label}
              type="button"
              onClick={() => setPreview({ label: document.label, url: document.url! })}
              style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.16)', background: '#0a0204', color: '#fff', textAlign: 'left', cursor: 'pointer' }}
            >
              <img src={document.url} alt={`${document.label} document`} style={{ display: 'block', width: '100%', aspectRatio: '1.58 / 1', objectFit: 'cover' }} />
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '8px 10px', fontSize: '0.76rem', fontWeight: 700 }}>
                {document.label} <Eye size={14} />
              </span>
            </button>
          ) : document.onChange ? (
            <DocumentPhotoUpload
              key={document.label}
              id={`admin-${document.label.toLowerCase().replace(/\s+/g, '-')}`}
              label={document.label}
              value={document.url}
              onChange={document.onChange}
            />
          ) : (
            <div key={document.label} style={{ minHeight: '108px', padding: '12px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#94a3b8', textAlign: 'center' }}>
              <FileImage size={22} />
              <span style={{ fontSize: '0.75rem' }}>{document.label} photo not uploaded</span>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div role="dialog" aria-modal="true" aria-label={`${preview.label} photo`} onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.9)', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: 'min(760px, 100%)', maxHeight: '92vh', overflow: 'auto', borderRadius: '16px', background: '#130508', border: '1px solid rgba(225,29,72,0.5)' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#130508', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <strong>{preview.label} photo</strong>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close document photo" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'grid', placeItems: 'center' }}><X size={19} /></button>
            </div>
            <img src={preview.url} alt={`${preview.label} full document`} style={{ display: 'block', width: '100%', maxHeight: '78vh', objectFit: 'contain', background: '#080103' }} />
          </div>
        </div>
      )}
    </>
  );
};
