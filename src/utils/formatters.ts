// Utility formatters and helper functions

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
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
  if (idNumber.length <= 4) return idNumber;
  const visible = idNumber.slice(-4);
  const masked = '*'.repeat(idNumber.length - 4);
  return `${masked}${visible}`;
};
