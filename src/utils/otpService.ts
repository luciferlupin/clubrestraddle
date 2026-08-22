// Client-side OTP Generation & Verification Service for Club Re Straddle

interface ActiveOtp {
  phone: string;
  code: string;
  expiresAt: number;
  purpose: 'registration' | 'login';
}

const otpStore = new Map<string, ActiveOtp>();

export type OtpNotificationListener = (payload: { phone: string; code: string; purpose: 'registration' | 'login' }) => void;
const listeners = new Set<OtpNotificationListener>();

export const subscribeToOtpNotifications = (listener: OtpNotificationListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (payload: { phone: string; code: string; purpose: 'registration' | 'login' }) => {
  listeners.forEach(fn => {
    try {
      fn(payload);
    } catch (err) {
      console.error('Error in OTP listener:', err);
    }
  });
};

/**
 * Normalizes mobile number (removes spaces, hyphens, country code prefix for keying)
 */
export const normalizePhone = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly;
};

/**
 * Generates a 6-digit OTP code for a phone number and dispatches SMS notification
 */
export const sendOtp = (phone: string, purpose: 'registration' | 'login' = 'login'): { code: string; phone: string } => {
  const normalized = normalizePhone(phone);
  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(normalized, {
    phone,
    code,
    expiresAt,
    purpose,
  });

  // Broadcast to simulated SMS notification banner
  notifyListeners({ phone, code, purpose });

  console.log(`[SMS Gateway] Sent OTP ${code} to ${phone} for ${purpose}`);
  return { code, phone };
};

/**
 * Verifies if the entered code matches the active OTP for the phone number
 */
export const verifyOtpCode = (phone: string, inputCode: string): { success: boolean; message: string } => {
  const normalized = normalizePhone(phone);
  const active = otpStore.get(normalized);

  const cleanInput = inputCode.trim();

  // Master demo bypass code for testing ease: 123456
  if (cleanInput === '123456') {
    otpStore.delete(normalized);
    return { success: true, message: 'OTP verified successfully.' };
  }

  if (!active) {
    return { success: false, message: 'No active OTP found. Please request a new code.' };
  }

  if (Date.now() > active.expiresAt) {
    otpStore.delete(normalized);
    return { success: false, message: 'OTP has expired. Please request a new code.' };
  }

  if (active.code !== cleanInput) {
    return { success: false, message: 'Invalid OTP code. Please check and try again.' };
  }

  // Success: Consume OTP
  otpStore.delete(normalized);
  return { success: true, message: 'OTP verified successfully.' };
};

/**
 * Check if a phone has a pending active OTP
 */
export const getActiveOtp = (phone: string): ActiveOtp | undefined => {
  const normalized = normalizePhone(phone);
  const active = otpStore.get(normalized);
  if (active && Date.now() <= active.expiresAt) {
    return active;
  }
  return undefined;
};
