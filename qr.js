import qrcode from './qr-vendor.js';

// Local QR generation; no visitor URLs are sent to a third-party service.
export function renderQr(url) {
  const code = qrcode(0, 'M');
  code.addData(url);
  code.make();
  return code.createSvgTag({ cellSize: 3, margin: 12, scalable: true });
}
