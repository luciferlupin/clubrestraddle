import { Player } from '../types';
import {
  formatPlayerNumber,
  formatAadhaarNumber,
  formatPanNumber,
  formatDateOnly,
  formatDateTime,
  formatCurrency,
} from './formatters';

/**
 * Escapes values for standard CSV compliance (RFC 4180)
 */
const escapeCSV = (val: string | number | boolean | undefined | null): string => {
  if (val === undefined || val === null) return '""';
  const str = String(val).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Generates a standard UTF-8 CSV string with all player fields
 */
export const generatePlayersCSV = (players: Player[]): string => {
  const headers = [
    'Member ID',
    'Full Name',
    'Phone Number',
    'SMS Verified',
    'Email Address',
    'Membership Tier',
    'KYC Status',
    'Aadhaar Number',
    'PAN Number',
    'Govt ID Type',
    'Date of Birth',
    'Residential Address',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Wallet Balance (INR)',
    'Total Club Visits',
    'Registration Date',
    'Staff Notes',
  ];

  const rows = players.map(p => {
    const aadhaar = formatAadhaarNumber(p.kyc?.aadhaarNumber, p.kyc?.govtIdNumber);
    const pan = formatPanNumber(p.kyc?.panNumber, p.kyc?.govtIdNumber);
    const isPhoneVerified = p.phoneVerified || p.kyc?.phoneVerified ? 'Yes' : 'No';

    return [
      formatPlayerNumber(p),
      p.fullName,
      p.phone,
      isPhoneVerified,
      p.email || '',
      p.membershipTier,
      p.kycStatus.toUpperCase(),
      aadhaar ? `'${aadhaar}` : '', // Prefix with apostrophe for Excel to retain formatting
      pan || '',
      p.kyc?.govtIdType || 'Aadhaar & PAN',
      p.kyc?.dateOfBirth || '',
      p.kyc?.address || '',
      p.kyc?.emergencyContactName || '',
      p.kyc?.emergencyContactPhone || '',
      p.walletBalance ?? 0,
      p.totalVisits ?? 0,
      p.registeredAt ? formatDateTime(p.registeredAt) : '',
      p.notes || '',
    ];
  });

  // Prepend UTF-8 BOM for Microsoft Excel compatibility
  return (
    '\uFEFF' +
    [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\r\n')
  );
};

/**
 * Downloads the CSV file to user's device
 */
export const downloadPlayersCSV = (players: Player[], filename?: string): void => {
  const csv = generatePlayersCSV(players);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `Club_Re_Straddle_Players_Registry_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates TSV (Tab Separated Values) for 1-click paste into Excel / Google Sheets
 */
export const copyPlayersToClipboard = async (players: Player[]): Promise<boolean> => {
  const headers = [
    'Member ID',
    'Full Name',
    'Phone Number',
    'SMS Verified',
    'Email Address',
    'Membership Tier',
    'KYC Status',
    'Aadhaar Number',
    'PAN Number',
    'Govt ID Type',
    'Date of Birth',
    'Residential Address',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Wallet Balance (₹)',
    'Total Visits',
    'Registration Date',
    'Staff Notes',
  ];

  const rows = players.map(p => {
    const aadhaar = formatAadhaarNumber(p.kyc?.aadhaarNumber, p.kyc?.govtIdNumber);
    const pan = formatPanNumber(p.kyc?.panNumber, p.kyc?.govtIdNumber);
    const isPhoneVerified = p.phoneVerified || p.kyc?.phoneVerified ? 'Yes' : 'No';

    return [
      formatPlayerNumber(p),
      p.fullName,
      p.phone,
      isPhoneVerified,
      p.email || '',
      p.membershipTier,
      p.kycStatus.toUpperCase(),
      aadhaar || '',
      pan || '',
      p.kyc?.govtIdType || 'Aadhaar & PAN',
      p.kyc?.dateOfBirth || '',
      (p.kyc?.address || '').replace(/[\r\n\t]/g, ' '),
      p.kyc?.emergencyContactName || '',
      p.kyc?.emergencyContactPhone || '',
      p.walletBalance ?? 0,
      p.totalVisits ?? 0,
      p.registeredAt ? formatDateOnly(p.registeredAt) : '',
      (p.notes || '').replace(/[\r\n\t]/g, ' '),
    ];
  });

  const tsvText = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t')),
  ].join('\n');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsvText);
      return true;
    }
    // Fallback for older browser contexts
    const textArea = document.createElement('textarea');
    textArea.value = tsvText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy TSV to clipboard', err);
    return false;
  }
};

/**
 * Prints a clean, full-page tabular report for all players
 */
export const printPlayersTable = (players: Player[], filterSummary?: string): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const totalBalance = players.reduce((sum, p) => sum + (p.walletBalance ?? 0), 0);
  const verifiedCount = players.filter(p => p.kycStatus === 'verified').length;
  const pendingCount = players.filter(p => p.kycStatus === 'pending').length;

  const rowsHtml = players
    .map((p, idx) => {
      const aadhaar = formatAadhaarNumber(p.kyc?.aadhaarNumber, p.kyc?.govtIdNumber) || '—';
      const pan = formatPanNumber(p.kyc?.panNumber, p.kyc?.govtIdNumber) || '—';
      const kycColor =
        p.kycStatus === 'verified'
          ? '#16a34a'
          : p.kycStatus === 'pending'
          ? '#d97706'
          : '#dc2626';

      return `
      <tr>
        <td style="text-align: center; font-weight: bold; font-family: monospace;">${formatPlayerNumber(p)}</td>
        <td style="font-weight: 600;">${p.fullName}</td>
        <td>
          <div>${p.phone}</div>
          <small style="color: ${p.phoneVerified || p.kyc?.phoneVerified ? '#16a34a' : '#6b7280'};">
            ${p.phoneVerified || p.kyc?.phoneVerified ? '✓ Verified' : 'Unverified'}
          </small>
        </td>
        <td>${p.email || '—'}</td>
        <td style="text-align: center; font-weight: 600;">${p.membershipTier}</td>
        <td style="text-align: center;">
          <span style="color: ${kycColor}; font-weight: 700; text-transform: uppercase; font-size: 11px; border: 1px solid ${kycColor}; padding: 2px 6px; border-radius: 4px;">
            ${p.kycStatus}
          </span>
        </td>
        <td style="font-family: monospace; font-size: 11px;">${aadhaar}</td>
        <td style="font-family: monospace; font-size: 11px; font-weight: 600;">${pan}</td>
        <td style="font-size: 11px; max-width: 140px; word-break: break-word;">${p.kyc?.address || '—'}</td>
        <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatCurrency(p.walletBalance ?? 0)}</td>
        <td style="text-align: center; font-weight: 600;">${p.totalVisits ?? 0}</td>
        <td style="font-size: 11px; white-space: nowrap;">${formatDateOnly(p.registeredAt)}</td>
      </tr>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Club Re Straddle - Official Players Registry</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 16px;
            font-size: 12px;
            line-height: 1.35;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e11d48;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .club-title {
            font-size: 20px;
            font-weight: 900;
            color: #e11d48;
            letter-spacing: 0.5px;
            margin: 0;
            text-transform: uppercase;
          }
          .doc-subtitle {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            margin: 3px 0 0 0;
          }
          .meta-box {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .stats-bar {
            display: flex;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 14px;
            margin-bottom: 14px;
            font-size: 12px;
          }
          .stat-item {
            display: flex;
            gap: 6px;
          }
          .stat-item strong {
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 6px;
            font-size: 11px;
            border: 1px solid #0f172a;
          }
          td {
            padding: 6px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="club-title">Club Re Straddle</h1>
            <div class="doc-subtitle">Official Member Registry & KYC Audit Table</div>
            ${filterSummary ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Filter: ${filterSummary}</div>` : ''}
          </div>
          <div class="meta-box">
            <div><strong>Generated:</strong> ${generatedDate}</div>
            <div><strong>Confidentiality:</strong> Club Management Official Record</div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-item"><span>Total Members:</span> <strong>${players.length}</strong></div>
          <div class="stat-item"><span>KYC Verified:</span> <strong style="color: #16a34a;">${verifiedCount}</strong></div>
          <div class="stat-item"><span>Pending Review:</span> <strong style="color: #d97706;">${pendingCount}</strong></div>
          <div class="stat-item"><span>Total Wallet Pool:</span> <strong>${formatCurrency(totalBalance)}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 65px;">Member #</th>
              <th>Full Name</th>
              <th>Contact Phone</th>
              <th>Email</th>
              <th style="text-align: center; width: 75px;">Tier</th>
              <th style="text-align: center; width: 75px;">KYC</th>
              <th>Aadhaar Number</th>
              <th>PAN Number</th>
              <th>Residential Address</th>
              <th style="text-align: right; width: 90px;">Wallet</th>
              <th style="text-align: center; width: 50px;">Visits</th>
              <th style="width: 85px;">Registered</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Club Re Straddle • Premium Poker Management System • All Rights Reserved</div>
          <div>Page 1 of 1 • System Generated Report</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
