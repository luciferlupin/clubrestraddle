// Utility formatters and helper functions

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatINR = (amount: number): string => {
  return (amount || 0).toLocaleString('en-IN');
};

export const formatClubLabel = (label?: string): string => {
  return (label || '').replace(/^[♠♦♣♥]\s*/, '');
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

export const formatShortDateTime = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

export const formatDateOnly = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatTimeOnly = (isoOrTime?: string): string => {
  if (!isoOrTime) return '—';
  if (isoOrTime.includes('T')) {
    try {
      const d = new Date(isoOrTime);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoOrTime;
    }
  }
  return isoOrTime;
};

/**
 * Poker Club Business Gaming Day / Session (10:00 AM to 10:00 AM).
 * - Hours 10:00 AM (inclusive) to 09:59 AM next morning belong to the starting date session.
 * - e.g. 23 Aug 10:00 AM to 24 Aug 09:59 AM is session "2026-08-23".
 */
export const getClubSessionDate = (dateOrTimestamp?: Date | string | number): string => {
  let d: Date;
  if (!dateOrTimestamp) {
    d = new Date();
  } else if (dateOrTimestamp instanceof Date) {
    d = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrTimestamp)) {
    // Plain YYYY-MM-DD string already represents a session date
    return dateOrTimestamp;
  } else {
    d = new Date(dateOrTimestamp);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
  }

  // If local time is before 10:00 AM, shift belongs to previous calendar day
  const effectiveDate = new Date(d.getTime());
  if (effectiveDate.getHours() < 10) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }

  const year = effectiveDate.getFullYear();
  const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
  const day = String(effectiveDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (): string => {
  return getClubSessionDate(new Date());
};

export const isTimestampInCurrentSession = (
  timestampOrDate?: Date | string | number,
  targetSessionDate?: string
): boolean => {
  if (!timestampOrDate) return false;
  const currentSession = targetSessionDate || getTodayDateString();
  return getClubSessionDate(timestampOrDate) === currentSession;
};

export const formatSessionLabel = (sessionDateStr?: string): string => {
  const sessionStr = sessionDateStr || getTodayDateString();
  const [y, m, d] = sessionStr.split('-').map(Number);
  if (!y || !m || !d) return sessionStr;

  const startD = new Date(y, m - 1, d, 10, 0, 0);
  const endD = new Date(y, m - 1, d + 1, 10, 0, 0);

  const startFmt = startD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const endFmt = endD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return `${startFmt} 10:00 AM – ${endFmt} 10:00 AM`;
};

export const generateId = (prefix: string): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

export const generateSequentialPlayerId = (existingPlayers: { id: string; memberNumber?: number }[] = []): string => {
  let maxSeq = 0;
  for (const p of existingPlayers) {
    if (typeof p.memberNumber === 'number' && p.memberNumber > maxSeq) {
      maxSeq = p.memberNumber;
    }
    if (/^\d+$/.test(p.id)) {
      const num = parseInt(p.id, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return String(maxSeq + 1);
};

export const formatPlayerNumber = (player: { id: string; memberNumber?: number }): string => {
  if (typeof player.memberNumber === 'number' && player.memberNumber > 0) {
    return String(player.memberNumber);
  }
  if (/^\d+$/.test(player.id)) {
    return String(parseInt(player.id, 10));
  }
  return player.id;
};

export const generateSequentialCheckInId = (existingCheckIns: { id: string }[] = []): string => {
  let maxSeq = 1000;
  for (const c of existingCheckIns) {
    const match = c.id.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return `CHK-${maxSeq + 1}`;
};

export const generateSequentialChipId = (existingRequests: { id: string }[] = []): string => {
  let maxSeq = 1000;
  for (const r of existingRequests) {
    const match = r.id.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return `CHP-${maxSeq + 1}`;
};

export const generateSequentialGateTransferId = (existingTransfers: { id: string }[] = []): string => {
  let maxSeq = 1000;
  for (const t of existingTransfers) {
    const match = t.id.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return `GTR-${maxSeq + 1}`;
};

export const generateGateInvoiceNumber = (checkInIdOrSeq: string | number): string => {
  if (typeof checkInIdOrSeq === 'number') {
    return `CRS/GATE/26-27/${String(checkInIdOrSeq).padStart(4, '0')}`;
  }
  const match = checkInIdOrSeq.match(/\d+$/);
  const seq = match ? match[0].padStart(4, '0') : '0001';
  return `CRS/GATE/26-27/${seq}`;
};

export const generateTournamentInvoiceNumber = (
  tournamentId: string,
  existingEntries: { tournamentId?: string; receiptNumber?: string; id?: string }[] = []
): string => {
  let seriesCode = 'TRN-01';
  const trnMatch = tournamentId.match(/TRN-(?:2026-)?(\d+)/i) || tournamentId.match(/(\d+)$/);
  if (trnMatch) {
    seriesCode = `TRN-${trnMatch[1].padStart(2, '0')}`;
  } else {
    seriesCode = tournamentId.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || 'TRN-01';
  }

  const currentTrnEntries = existingEntries.filter(e => e.tournamentId === tournamentId);
  const seq = currentTrnEntries.length + 1;
  return `CRS/${seriesCode}/26-27/${String(seq).padStart(4, '0')}`;
};

export const generateChipInvoiceNumber = (existingRequests: { id: string }[] = []): string => {
  let maxSeq = 1000;
  for (const r of existingRequests) {
    const match = r.id.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return `CRS/CHP/26-27/${maxSeq + 1}`;
};

export const generateReceiptNumber = (prefix: string = 'REC'): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `CRS/${prefix}/26-27/${timestamp}`;
};

export const maskGovtId = (idNumber: string): string => {
  if (!idNumber) return '';
  const clean = idNumber.replace(/\s+/g, '');
  // Aadhaar 12-digit format
  if (clean.length === 12 && /^\d+$/.test(clean)) {
    return `•••• •••• ${clean.slice(-4)}`;
  }
  // PAN 10-character format (ABCDE1234F)
  if (clean.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(clean)) {
    return `•••••${clean.slice(5).toUpperCase()}`;
  }
  if (clean.length <= 4) return clean;
  const visible = clean.slice(-4);
  const masked = '•'.repeat(Math.min(clean.length - 4, 8));
  return `${masked}${visible}`;
};

export const formatFullAadhaar = (aadhaarNumber?: string, govtIdNumber?: string): string => {
  const directNumber = aadhaarNumber?.trim();
  if (directNumber) return directNumber;

  const storedId = govtIdNumber?.trim();
  if (!storedId) return 'Not provided';

  const embeddedAadhaar = storedId.match(/Aadhaar:\s*([\d\s]{12,14})/i)?.[1]?.trim();
  if (embeddedAadhaar) return embeddedAadhaar;

  const digitsOnly = storedId.replace(/\D/g, '');
  return digitsOnly.length === 12 ? storedId : 'Not provided';
};

export const numberToINRWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  let words = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) words += inWords(crore) + 'Crore ';
  if (lakh > 0) words += inWords(lakh) + 'Lakh ';
  if (thousand > 0) words += inWords(thousand) + 'Thousand ';
  if (n > 0) words += inWords(n);

  return words.trim() + ' Rupees Only';
};
