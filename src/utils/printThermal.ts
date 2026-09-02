/**
 * Dedicated Thermal POS Printer Utility (80mm / 58mm ESC/POS)
 * Optimized for TVS RP 3230 ABW and all POS thermal receipt printers.
 * Uses an isolated print frame to prevent browser modal centering, margins, and right-side clipping.
 */
export const printThermalSlip = (elementId: string, docTitle: string = 'Club Receipt'): void => {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    window.print();
    return;
  }

  // Remove any stale print iframes
  const existingIframe = document.getElementById('thermal-print-frame');
  if (existingIframe && existingIframe.parentNode) {
    existingIframe.parentNode.removeChild(existingIframe);
  }

  // Create isolated invisible iframe for printing
  const iframe = document.createElement('iframe');
  iframe.id = 'thermal-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!frameDoc) {
    window.print();
    return;
  }

  // Clone the receipt DOM node without interfering with current UI
  const clonedContent = targetElement.cloneNode(true) as HTMLElement;
  clonedContent.style.margin = '0 auto';
  clonedContent.style.width = '64mm';
  clonedContent.style.maxWidth = '64mm';
  clonedContent.style.boxSizing = 'border-box';

  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace !important;
          }
          .thermal-receipt-paper,
          .receipt-paper,
          #${elementId} {
            width: 64mm !important;
            max-width: 64mm !important;
            min-width: 64mm !important;
            margin: 0 auto !important;
            padding: 2mm 2.5mm 14mm 2.5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
            font-size: 10px !important;
            line-height: 1.28 !important;
            display: block !important;
            overflow: visible !important;
          }
          img {
            max-width: 40px !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto 4px auto !important;
          }
        </style>
      </head>
      <body>
        ${clonedContent.outerHTML}
      </body>
    </html>
  `);
  frameDoc.close();

  // Wait for images and layout to settle, then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 250);
};
