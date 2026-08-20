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

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateId = (prefix: string): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

export const generateReceiptNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `REC-${timestamp}-${random}`;
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
