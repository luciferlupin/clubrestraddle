import { Player, DailyCheckIn, MembershipTier } from '../types';

export interface ParsedPlayerQR {
  playerId?: string;
  scanId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  membershipTier?: MembershipTier;
  memberNumber?: number;
}

/**
 * Builds a universal, self-contained verification URL for QR codes.
 * Contains the player's full identity so any security scanner/device
 * instantly renders the exact customer name and KYC details.
 */
export const buildPlayerVerificationUrl = (
  player: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    membershipTier?: MembershipTier;
    memberNumber?: number;
    kyc?: {
      aadhaarNumber?: string;
      panNumber?: string;
      govtIdNumber?: string;
      photoUrl?: string;
    };
  },
  checkIn?: { id: string }
): string => {
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://clubrestraddle.vercel.app';

  const checkInId = checkIn?.id || `CHK-${player.id}`;
  const aadhaar = (player.kyc?.aadhaarNumber || '').replace(/\D/g, '');
  const pan = (player.kyc?.panNumber || '').trim().toUpperCase();

  const params = new URLSearchParams();
  params.set('portal', 'security');
  params.set('scan', checkInId);
  params.set('player', player.id);
  params.set('name', player.fullName.trim());
  params.set('phone', player.phone.trim());

  if (player.email) {
    params.set('email', player.email.trim());
  }
  if (aadhaar) {
    params.set('aadhaar', aadhaar);
  }
  if (pan) {
    params.set('pan', pan);
  }
  if (player.membershipTier) {
    params.set('tier', player.membershipTier);
  }
  if (player.memberNumber) {
    params.set('member', String(player.memberNumber));
  }

  return `${baseUrl}/?${params.toString()}`;
};

/**
 * Parses scanned QR text, URL, query string, or JSON payload
 * into structured customer verification fields.
 */
export const parsePlayerVerificationCode = (rawCode: string): ParsedPlayerQR => {
  const trimmed = rawCode.trim();
  if (!trimmed) return {};

  // 1. Check for JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        playerId: parsed.playerId || parsed.player || parsed.id || parsed.memberId,
        scanId: parsed.scan || parsed.scanId || parsed.checkInId || parsed.c,
        fullName: parsed.name || parsed.fullName || parsed.player_name || parsed.customerName,
        phone: parsed.phone || parsed.mobile || parsed.player_phone,
        email: parsed.email,
        aadhaarNumber: parsed.aadhaar || parsed.aadhaarNumber,
        panNumber: parsed.pan || parsed.panNumber,
        membershipTier: parsed.tier || parsed.membershipTier,
        memberNumber: parsed.member ? Number(parsed.member) : undefined,
      };
    } catch {
      // Fall through
    }
  }

  // 2. Check for URL / Query string
  if (trimmed.includes('?') || trimmed.includes('=') || trimmed.includes('/') || trimmed.startsWith('http')) {
    try {
      const queryString = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
      const params = new URLSearchParams(queryString);

      const playerId =
        params.get('player') ||
        params.get('playerId') ||
        params.get('p') ||
        params.get('id') ||
        params.get('memberId') ||
        undefined;

      const scanId =
        params.get('scan') ||
        params.get('scanId') ||
        params.get('checkInId') ||
        params.get('c') ||
        undefined;

      const fullName =
        params.get('name') ||
        params.get('fullName') ||
        params.get('playerName') ||
        params.get('customerName') ||
        params.get('n') ||
        undefined;

      const phone =
        params.get('phone') ||
        params.get('mobile') ||
        params.get('m') ||
        undefined;

      const email = params.get('email') || undefined;
      const aadhaarNumber = params.get('aadhaar') || params.get('aadhaarNumber') || undefined;
      const panNumber = params.get('pan') || params.get('panNumber') || undefined;
      const tier = (params.get('tier') || params.get('membershipTier') || undefined) as MembershipTier | undefined;
      const member = params.get('member');

      if (playerId || scanId || fullName || phone || aadhaarNumber || panNumber) {
        return {
          playerId,
          scanId,
          fullName: fullName ? decodeURIComponent(fullName).trim() : undefined,
          phone: phone ? decodeURIComponent(phone).trim() : undefined,
          email: email ? decodeURIComponent(email).trim() : undefined,
          aadhaarNumber: aadhaarNumber ? decodeURIComponent(aadhaarNumber).trim() : undefined,
          panNumber: panNumber ? decodeURIComponent(panNumber).trim().toUpperCase() : undefined,
          membershipTier: tier,
          memberNumber: member ? Number(member) : undefined,
        };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Fallback: single identifier (Phone / PAN / Aadhaar / Member ID)
  const cleanDigits = trimmed.replace(/\D/g, '');
  if (cleanDigits.length === 10) {
    return { phone: trimmed };
  }
  if (cleanDigits.length === 12) {
    return { aadhaarNumber: cleanDigits };
  }
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(trimmed)) {
    return { panNumber: trimmed.toUpperCase() };
  }
  if (/^CHK-/i.test(trimmed)) {
    return { scanId: trimmed };
  }

  return { playerId: trimmed };
};
