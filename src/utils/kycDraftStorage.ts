export interface KycFormData {
  fullName: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  aadhaarPhotoUrl: string;
  aadhaarBackPhotoUrl: string;
  panPhotoUrl: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photoUrl: string;
  agreedToRules: boolean;
}

export interface KycDraftState {
  formData: KycFormData;
  step: number;
  isPhoneVerified: boolean;
  verifiedPhoneNumber: string;
  lastUpdated: number;
}

export const KYC_STORAGE_KEY = 'poker_kyc_registration_draft';

/**
 * Retrieves the saved KYC draft state from localStorage.
 */
export function getKycDraft(): KycDraftState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KYC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KycDraftState;
    if (parsed && typeof parsed.step === 'number' && parsed.formData) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse KYC draft from localStorage', e);
  }
  return null;
}

/**
 * Persists the KYC draft state to localStorage.
 * Includes a fallback in case quota is exceeded by large images.
 */
export function saveKycDraft(data: {
  formData: KycFormData;
  step: number;
  isPhoneVerified: boolean;
  verifiedPhoneNumber: string;
}): void {
  if (typeof window === 'undefined') return;
  const draft: KycDraftState = {
    formData: data.formData,
    step: data.step,
    isPhoneVerified: data.isPhoneVerified,
    verifiedPhoneNumber: data.verifiedPhoneNumber,
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    // If storage quota exceeded due to large photo strings, save text fields and metadata
    try {
      const lightweightDraft: KycDraftState = {
        ...draft,
        formData: {
          ...draft.formData,
          aadhaarPhotoUrl: '',
          aadhaarBackPhotoUrl: '',
          panPhotoUrl: '',
        },
      };
      localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(lightweightDraft));
    } catch (fallbackErr) {
      console.warn('Unable to persist KYC draft to localStorage', fallbackErr);
    }
  }
}

/**
 * Clears the active KYC draft from localStorage.
 */
export function clearKycDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KYC_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear KYC draft from localStorage', e);
  }
}
