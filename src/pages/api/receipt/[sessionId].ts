// src/pages/api/receipt/[sessionId].ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const GET: APIRoute = async ({ params }) => {
  const { sessionId } = params;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session ID' }), { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product', 'payment_intent'],
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  const items = session.line_items?.data ?? [];
  const buyerEmail = session.customer_details?.email ?? 'N/A';
  const buyerName  = session.customer_details?.name  ?? 'Customer';
  const total      = ((session.amount_total ?? 0) / 100).toFixed(2);
  const currency   = (session.currency ?? 'usd').toUpperCase();
  const orderId    = session.payment_intent
    ? typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id
    : sessionId;
  const date = new Date((session.created) * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold   = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica);

  const BLACK  = rgb(0.05, 0.05, 0.05);
  const GRAY   = rgb(0.45, 0.45, 0.45);
  const LIGHT  = rgb(0.93, 0.93, 0.93);
  const BLUE   = rgb(0.23, 0.51, 0.96);
  const WHITE  = rgb(1, 1, 1);

  // Header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: BLUE });
  page.drawText('NOX', { x: 40, y: height - 52, size: 28, font: fontBold, color: WHITE });
  page.drawText('Purchase Receipt', { x: 40, y: height - 68, size: 11, font: fontNormal, color: rgb(0.8, 0.88, 1) });
  page.drawText(date, { x: width - 150, y: height - 52, size: 11, font: fontNormal, color: WHITE });

  let y = height - 110;

  // Order ref
  page.drawText('ORDER REFERENCE', { x: 40, y, size: 8, font: fontBold, color: GRAY });
  y -= 16;
  page.drawText(orderId, { x: 40, y, size: 10, font: fontNormal, color: BLACK });

  y -= 28;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: LIGHT });
  y -= 24;

  // Buyer info
  page.drawText('BILLED TO', { x: 40, y, size: 8, font: fontBold, color: GRAY });
  y -= 16;
  page.drawText(buyerName,  { x: 40, y, size: 11, font: fontBold,   color: BLACK });
  y -= 16;
  page.drawText(buyerEmail, { x: 40, y, size: 10, font: fontNormal, color: GRAY  });

  y -= 32;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: LIGHT });
  y -= 20;

  // Table header
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: rgb(0.96, 0.97, 1) });
  page.drawText('ITEM',  { x: 48,          y: y + 4, size: 8, font: fontBold, color: GRAY });
  page.drawText('QTY',   { x: width - 160, y: y + 4, size: 8, font: fontBold, color: GRAY });
  page.drawText('PRICE', { x: width - 100, y: y + 4, size: 8, font: fontBold, color: GRAY });
  y -= 24;

  // Line items
  for (const li of items) {
    const name  = typeof li.price?.product === 'object' && li.price.product !== null
      ? (li.price.product as Stripe.Product).name
      : 'Component';
    const qty   = li.quantity ?? 1;
    const price = ((li.amount_total ?? 0) / 100).toFixed(2);

    // Truncate long names
    const maxChars = 52;
    const displayName = name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;

    page.drawText(displayName, { x: 48,          y, size: 10, font: fontNormal, color: BLACK });
    page.drawText(String(qty), { x: width - 160, y, size: 10, font: fontNormal, color: BLACK });
    page.drawText(`$${price}`, { x: width - 100, y, size: 10, font: fontNormal, color: BLACK });
    y -= 22;

    page.drawLine({ start: { x: 48, y: y + 8 }, end: { x: width - 48, y: y + 8 }, thickness: 0.5, color: LIGHT });
  }

  y -= 16;

  // Total
  page.drawRectangle({ x: width - 200, y: y - 8, width: 160, height: 32, color: BLUE });
  page.drawText('TOTAL', { x: width - 192, y: y + 4, size: 9,  font: fontBold,   color: WHITE });
  page.drawText(`${currency} $${total}`, { x: width - 120, y: y + 4, size: 11, font: fontBold, color: WHITE });

  y -= 60;

  // Footer note
  page.drawText('Thank you for your purchase on Nox. Keep this receipt for your records.',
    { x: 40, y, size: 9, font: fontNormal, color: GRAY });
  y -= 14;
  page.drawText('For support, visit nox.com/support',
    { x: 40, y, size: 9, font: fontNormal, color: GRAY });

  // Bottom border
  page.drawRectangle({ x: 0, y: 0, width, height: 8, color: BLUE });

  const pdfBytes = await doc.save();

return new Response(new Blob([pdfBytes]), {
  status: 200,
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="nox-receipt-${orderId.slice(-8)}.pdf"`,
    'Cache-Control': 'private, no-store',
  },
});