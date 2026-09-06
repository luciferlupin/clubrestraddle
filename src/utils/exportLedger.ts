import { CashTransaction } from '../types';
import { formatCurrency, formatDateTime, formatDateOnly } from './formatters';

export interface LedgerReportOptions {
  title?: string;
  subtitle?: string;
  filterSummary?: string;
  categoryPreset?: string;
  dateRangeLabel?: string;
  preparedBy?: string;
}

/**
 * Escapes values for standard RFC 4180 CSV compliance
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
 * Generates a standard UTF-8 CSV string with all ledger transaction fields
 */
export const generateLedgerCSV = (transactions: CashTransaction[]): string => {
  const headers = [
    'Transaction ID',
    'Date & Time',
    'Flow Direction',
    'Category',
    'Payment Channel',
    'Amount (INR)',
    'Balance After (INR)',
    'Player / Beneficiary',
    'Reference ID',
    'Cashier / Authorized By',
    'Description / Notes',
  ];

  const rows = transactions.map(t => {
    return [
      t.id,
      formatDateTime(t.timestamp),
      t.type.toUpperCase(),
      t.category,
      t.paymentMethod,
      t.amount ?? 0,
      t.balanceAfter ?? 0,
      t.playerName || '',
      t.referenceId || '',
      t.cashierName || '',
      t.description || '',
    ];
  });

  // Prepend UTF-8 BOM for Microsoft Excel / Sheets compatibility
  return (
    '\uFEFF' +
    [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\r\n')
  );
};

/**
 * Downloads the ledger CSV file directly to the user's computer
 */
export const downloadLedgerCSV = (transactions: CashTransaction[], filename?: string): void => {
  const csv = generateLedgerCSV(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `Club_Re_Straddle_Cash_Ledger_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copies TSV (Tab Separated Values) to clipboard for 1-click paste into Excel or Google Sheets
 */
export const copyLedgerToClipboard = async (transactions: CashTransaction[]): Promise<boolean> => {
  const headers = [
    'Transaction ID',
    'Date & Time',
    'Flow Direction',
    'Category',
    'Payment Channel',
    'Amount (INR)',
    'Balance After (INR)',
    'Player / Beneficiary',
    'Reference ID',
    'Cashier / Authorized By',
    'Description / Notes',
  ];

  const rows = transactions.map(t => {
    return [
      t.id,
      formatDateTime(t.timestamp),
      t.type.toUpperCase(),
      t.category,
      t.paymentMethod,
      t.amount ?? 0,
      t.balanceAfter ?? 0,
      t.playerName || '',
      t.referenceId || '',
      t.cashierName || '',
      (t.description || '').replace(/[\r\n\t]/g, ' '),
    ];
  });

  const tsvText = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsvText);
      return true;
    }
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
    console.error('Failed to copy Ledger TSV to clipboard', err);
    return false;
  }
};

/**
 * High-definition printable A4 landscape Ledger PDF report
 */
export const printLedgerReport = (
  transactions: CashTransaction[],
  options?: LedgerReportOptions
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Calculate Metrics
  const totalCount = transactions.length;
  const totalInflow = transactions
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOutflow = transactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const netDelta = totalInflow - totalOutflow;

  // Breakdown by channel
  const cashIn = transactions.filter(t => t.type === 'in' && t.paymentMethod === 'Cash').reduce((s, t) => s + t.amount, 0);
  const cashOut = transactions.filter(t => t.type === 'out' && t.paymentMethod === 'Cash').reduce((s, t) => s + t.amount, 0);

  const upiIn = transactions.filter(t => t.type === 'in' && t.paymentMethod === 'UPI/Digital').reduce((s, t) => s + t.amount, 0);
  const upiOut = transactions.filter(t => t.type === 'out' && t.paymentMethod === 'UPI/Digital').reduce((s, t) => s + t.amount, 0);

  const bankIn = transactions.filter(t => t.type === 'in' && t.paymentMethod === 'Bank Transfer').reduce((s, t) => s + t.amount, 0);
  const bankOut = transactions.filter(t => t.type === 'out' && t.paymentMethod === 'Bank Transfer').reduce((s, t) => s + t.amount, 0);

  const title = options?.title || 'Club Re Straddle — Master Cash Ledger';
  const subtitle = options?.subtitle || 'Complete Financial Treasury & Cash Flow Statement';
  const filterSummary = options?.filterSummary;
  const dateRangeLabel = options?.dateRangeLabel;
  const preparedBy = options?.preparedBy || 'Club Management System';

  const rowsHtml = transactions
    .map(t => {
      const isIn = t.type === 'in';
      const flowBadgeColor = isIn ? '#16a34a' : '#dc2626';
      const flowBadgeBg = isIn ? '#ecfdf5' : '#fef2f2';
      const flowBadgeText = isIn ? '▲ CASH IN' : '▼ CASH OUT';
      const amountColor = isIn ? '#15803d' : '#b91c1c';
      const sign = isIn ? '+' : '-';

      // Payment Method styling
      let pmBg = '#f1f5f9';
      let pmColor = '#475569';
      if (t.paymentMethod === 'Cash') {
        pmBg = '#fef3c7';
        pmColor = '#92400e';
      } else if (t.paymentMethod === 'UPI/Digital') {
        pmBg = '#e0f2fe';
        pmColor = '#0369a1';
      } else if (t.paymentMethod === 'Bank Transfer') {
        pmBg = '#f3e8ff';
        pmColor = '#7e22ce';
      }

      return `
        <tr>
          <td style="font-family: monospace; font-size: 10px; color: #475569; white-space: nowrap;">
            ${formatDateTime(t.timestamp)}
          </td>
          <td style="font-family: monospace; font-size: 10.5px; font-weight: 700; color: #0f172a; white-space: nowrap;">
            ${t.id}
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 800; background: ${flowBadgeBg}; color: ${flowBadgeColor}; border: 1px solid ${flowBadgeColor}40; letter-spacing: 0.3px;">
              ${flowBadgeText}
            </span>
          </td>
          <td style="font-weight: 700; color: #1e293b; font-size: 11px;">
            ${t.category}
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 700; background: ${pmBg}; color: ${pmColor}; white-space: nowrap;">
              ${t.paymentMethod}
            </span>
          </td>
          <td style="font-size: 10.5px; color: #334155;">
            <div><strong>${t.playerName ? t.playerName : '—'}</strong></div>
            <div style="font-size: 9.5px; color: #64748b;">${t.description || ''}</div>
            ${t.referenceId ? `<div style="font-size: 9px; font-family: monospace; color: #94a3b8;">Ref: ${t.referenceId}</div>` : ''}
          </td>
          <td style="font-size: 10px; color: #64748b; white-space: nowrap;">
            ${t.cashierName || 'Staff'}
          </td>
          <td style="text-align: right; font-weight: 800; font-family: monospace; font-size: 11.5px; color: ${amountColor}; white-space: nowrap;">
            ${sign} ${formatCurrency(t.amount)}
          </td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; font-size: 10.5px; color: #475569; white-space: nowrap;">
            ${formatCurrency(t.balanceAfter ?? 0)}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm;
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
            padding: 10px;
            font-size: 11px;
            line-height: 1.35;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #e11d48;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 21px;
            font-weight: 900;
            color: #e11d48;
            letter-spacing: 0.5px;
            margin: 0;
            text-transform: uppercase;
          }
          .doc-subtitle {
            font-size: 13px;
            font-weight: 700;
            color: #334155;
            margin: 3px 0 0 0;
          }
          .filter-tag {
            display: inline-block;
            margin-top: 4px;
            background: #f1f5f9;
            color: #475569;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            border: 1px solid #cbd5e1;
          }
          .meta-box {
            text-align: right;
            font-size: 10.5px;
            color: #64748b;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 12px;
          }
          .stat-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 7px 10px;
          }
          .stat-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            color: #64748b;
          }
          .stat-value {
            font-size: 15px;
            font-weight: 800;
            margin-top: 2px;
            font-family: monospace;
          }
          .stat-sub {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 2px;
          }
          .channel-pill-bar {
            display: flex;
            gap: 12px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 12px;
            margin-bottom: 12px;
            font-size: 10px;
            align-items: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 6px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border: 1px solid #0f172a;
          }
          td {
            padding: 5px 6px;
            border: 1px solid #e2e8f0;
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
            font-size: 9.5px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">Club Re Straddle</h1>
            <div class="doc-subtitle">${subtitle}</div>
            ${filterSummary ? `<div class="filter-tag">📌 Active Filter: ${filterSummary}</div>` : ''}
            ${dateRangeLabel ? `<div class="filter-tag" style="margin-left: 6px;">📅 Period: ${dateRangeLabel}</div>` : ''}
          </div>
          <div class="meta-box">
            <div><strong>Generated:</strong> ${generatedDate}</div>
            <div><strong>Prepared By:</strong> ${preparedBy}</div>
            <div><strong>Classification:</strong> Official Club Audit Record</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value" style="color: #0f172a;">${totalCount}</div>
            <div class="stat-sub">Audited entries in record</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Inflow (Cash In)</div>
            <div class="stat-value" style="color: #16a34a;">+${formatCurrency(totalInflow)}</div>
            <div class="stat-sub">Buy-ins, gate fees, float</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Outflow (Cash Out)</div>
            <div class="stat-value" style="color: #dc2626;">-${formatCurrency(totalOutflow)}</div>
            <div class="stat-sub">Payouts, cashouts, settlements</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Net Treasury Flow</div>
            <div class="stat-value" style="color: ${netDelta >= 0 ? '#16a34a' : '#dc2626'};">
              ${netDelta >= 0 ? '+' : ''}${formatCurrency(netDelta)}
            </div>
            <div class="stat-sub">Net delta for selected entries</div>
          </div>
        </div>

        <div class="channel-pill-bar">
          <strong style="color: #0f172a; text-transform: uppercase; font-size: 9.5px;">Channels Breakdown:</strong>
          <span>💵 <strong>Cash:</strong> +${formatCurrency(cashIn)} / -${formatCurrency(cashOut)} (Net: ${formatCurrency(cashIn - cashOut)})</span>
          <span style="color: #cbd5e1;">|</span>
          <span>📱 <strong>UPI:</strong> +${formatCurrency(upiIn)} / -${formatCurrency(upiOut)} (Net: ${formatCurrency(upiIn - upiOut)})</span>
          <span style="color: #cbd5e1;">|</span>
          <span>🏦 <strong>Bank Wire:</strong> +${formatCurrency(bankIn)} / -${formatCurrency(bankOut)} (Net: ${formatCurrency(bankIn - bankOut)})</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 110px;">Date & Time</th>
              <th style="width: 75px;">Txn ID</th>
              <th style="text-align: center; width: 78px;">Flow</th>
              <th style="width: 140px;">Category</th>
              <th style="text-align: center; width: 85px;">Channel</th>
              <th>Player / Description / Notes</th>
              <th style="width: 75px;">Staff</th>
              <th style="text-align: right; width: 95px;">Amount (INR)</th>
              <th style="text-align: right; width: 95px;">Balance After</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">No cash ledger transactions found for this selection.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          <div>Club Re Straddle • Automated Treasury & Compliance System • Confidential Operating Record</div>
          <div>Printed on ${generatedDate} • Verified Ledger</div>
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
