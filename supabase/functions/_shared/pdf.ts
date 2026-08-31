import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';

const PRIMARY = rgb(0.357, 0.306, 1); // #5B4EFF
const TEXT = rgb(0.078, 0.078, 0.122); // #14141F
const MUTED = rgb(0.42, 0.42, 0.48); // #6B6B7B
const BORDER = rgb(0.902, 0.902, 0.933); // #E6E6EE

export type OrderNoteType = 'grn' | 'issue_note';

export interface OrderNoteData {
  type: OrderNoteType;
  orderId: string;
  paystackReference: string;
  itemTitle: string;
  amount: number;
  currency: string;
  commissionAmount: number;
  payoutAmount: number;
  buyerName: string;
  sellerName: string;
  bankLast4?: string | null;
  bankName?: string | null;
  releasedAt: string;
}

const CURRENCY_SYMBOL: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', NGN: '₦' };

function money(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function drawLabelValue(page: PDFPage, font: PDFFont, boldFont: PDFFont, x: number, y: number, label: string, value: string) {
  page.drawText(label, { x, y, size: 9, font, color: MUTED });
  page.drawText(value, { x, y: y - 14, size: 12, font: boldFont, color: TEXT });
}

export async function buildOrderNotePdf(data: OrderNoteData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 780;

  // Header
  page.drawText('VATEXS', { x: margin, y, size: 22, font: bold, color: PRIMARY });
  const title = data.type === 'grn' ? 'Goods Received Note' : 'Issue Note';
  const titleWidth = bold.widthOfTextAtSize(title, 14);
  page.drawText(title, { x: 595.28 - margin - titleWidth, y: y + 4, size: 14, font: bold, color: TEXT });
  y -= 20;
  const dateStr = new Date(data.releasedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const dateWidth = font.widthOfTextAtSize(`Issued ${dateStr}`, 10);
  page.drawText(`Issued ${dateStr}`, { x: 595.28 - margin - dateWidth, y, size: 10, font, color: MUTED });
  y -= 30;
  page.drawLine({ start: { x: margin, y }, end: { x: 595.28 - margin, y }, thickness: 1, color: BORDER });
  y -= 30;

  drawLabelValue(page, font, bold, margin, y, 'ORDER REFERENCE', data.paystackReference);
  drawLabelValue(page, font, bold, 320, y, 'ORDER ID', data.orderId.slice(0, 13).toUpperCase());
  y -= 40;

  drawLabelValue(page, font, bold, margin, y, 'ITEM', data.itemTitle);
  y -= 40;

  drawLabelValue(page, font, bold, margin, y, 'BUYER', data.buyerName);
  drawLabelValue(page, font, bold, 320, y, 'SELLER', data.sellerName);
  y -= 40;

  page.drawLine({ start: { x: margin, y }, end: { x: 595.28 - margin, y }, thickness: 1, color: BORDER });
  y -= 30;

  drawLabelValue(page, font, bold, margin, y, 'AMOUNT PAID', money(data.amount, data.currency));
  drawLabelValue(page, font, bold, 220, y, 'VATEXS FEE (10%)', money(data.commissionAmount, data.currency));
  drawLabelValue(page, font, bold, 390, y, 'SELLER PAYOUT', money(data.payoutAmount, data.currency));
  y -= 50;

  page.drawLine({ start: { x: margin, y }, end: { x: 595.28 - margin, y }, thickness: 1, color: BORDER });
  y -= 30;

  const bodyLines =
    data.type === 'grn'
      ? [
          `This note confirms that ${data.buyerName} received the item "${data.itemTitle}" as described,`,
          `and the order was closed on ${dateStr}. The payment held in escrow for this order`,
          `has been released to the seller.`,
        ]
      : [
          `This note confirms that the item "${data.itemTitle}" was marked delivered by the buyer`,
          `on ${dateStr}, closing the order. Your payout of ${money(data.payoutAmount, data.currency)} has been sent to`,
          `${data.bankName ? data.bankName + ' account ending ' + (data.bankLast4 ?? '****') : 'your linked bank account'} via Paystack.`,
        ];
  for (const line of bodyLines) {
    page.drawText(line, { x: margin, y, size: 11, font, color: TEXT });
    y -= 18;
  }

  page.drawText('Vatexs facilitates payment escrow between independent buyers and sellers and is not a party to the sale itself.', {
    x: margin,
    y: 60,
    size: 8,
    font,
    color: MUTED,
  });
  page.drawText('vatexs.store', { x: margin, y: 46, size: 8, font, color: MUTED });

  return doc.save();
}

export function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
