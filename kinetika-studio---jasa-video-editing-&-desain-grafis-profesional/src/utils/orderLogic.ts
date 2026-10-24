/**
 * Pure decoupled business logic for order processing, WhatsApp message formatting,
 * phone normalization, and pricing calculations.
 */

import { Order, PaymentStatus, OrderStatus } from '../types';

/**
 * Generates an idempotent or unique Order ID with the format: ORD-YYYYMMDD-XXXX
 */
export function generateOrderId(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  // 4 uppercase alphanumeric characters
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    rand += chars.charAt(idx);
  }

  return `ORD-${dateStr}-${rand}`;
}

/**
 * Normalizes an Indonesian phone number to international WhatsApp format (e.g., 6281234567890).
 */
export function normalizeWhatsAppNumber(raw: string): string {
  if (!raw) return '';
  // Remove non-digit characters
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  } else if (!digits.startsWith('62') && digits.length >= 9) {
    digits = '62' + digits;
  }

  return digits;
}

/**
 * Formats a number as Indonesian Rupiah (IDR).
 */
export function formatCurrencyIDR(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Pure calculation for order pricing and snapshots.
 */
export interface PricingResult {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  amountDueNow: number;
}

export function calculateOrderPricing(
  unitPrice: number,
  quantity: number,
  discountPercentage: number = 0,
  isDownPayment: boolean = false
): PricingResult {
  const safeQuantity = Math.max(1, Math.floor(quantity || 1));
  const safeUnitPrice = Math.max(0, unitPrice || 0);
  const subtotal = safeUnitPrice * safeQuantity;

  const validDiscountPercent = Math.min(100, Math.max(0, discountPercentage || 0));
  const discount = Math.round((subtotal * validDiscountPercent) / 100);
  const total = Math.max(0, subtotal - discount);

  // If 50% DP option is selected
  const amountDueNow = isDownPayment ? Math.round(total * 0.5) : total;

  return {
    unitPrice: safeUnitPrice,
    quantity: safeQuantity,
    subtotal,
    discount,
    total,
    amountDueNow,
  };
}

/**
 * Formats an order into an encoded WhatsApp Click-to-Chat URL.
 */
export function generateWhatsAppOrderUrl(
  businessPhone: string,
  order: Order,
  brandName: string = 'Kinetika Studio'
): string {
  const cleanPhone = normalizeWhatsAppNumber(businessPhone);

  const lines = [
    `Halo *${brandName}*, saya ingin konfirmasi pesanan jasa kreatif:`,
    '',
    `📄 *Order ID:* ${order.order_id}`,
    `👤 *Nama:* ${order.customer_name}`,
    `🏷️ *Tipe Klien:* ${order.customer_type}`,
    `📦 *Layanan & Paket:* ${order.package_name} (${order.service_type})`,
    `🔢 *Jumlah Item:* ${order.quantity}`,
    `💰 *Total Tagihan:* ${formatCurrencyIDR(order.total)}${order.is_down_payment ? ' (Opsi DP 50% diajukan)' : ''}`,
    `💳 *Metode Pembayaran:* ${order.payment_method === 'BANK_TRANSFER' ? 'Transfer Bank' : 'QRIS'}`,
    `⏳ *Estimasi Deadline:* ${order.deadline || 'Sesuai kesepakatan'}`,
    '',
    `📝 *Ringkasan Brief:*`,
    `"${order.brief.slice(0, 160)}${order.brief.length > 160 ? '...' : ''}"`,
    '',
    order.file_link ? `📁 *Tautan File/Aset:* ${order.file_link}` : '',
    '',
    'Mohon konfirmasi ketersediaan slot pengerjaan dan detail pembayaran. Terima kasih!'
  ].filter((line) => line !== null);

  const messageText = lines.join('\n');
  const encodedText = encodeURIComponent(messageText);

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

/**
 * Validates the order form fields and returns detailed error mapping.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateOrderInput(data: Partial<Order>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.customer_name || data.customer_name.trim().length < 2) {
    errors.customer_name = 'Nama lengkap wajib diisi minimal 2 karakter.';
  }

  const phoneDigits = (data.whatsapp || '').replace(/\D/g, '');
  if (!phoneDigits || phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.whatsapp = 'Nomor WhatsApp valid wajib diisi (minimal 9 digit).';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Format alamat email tidak valid.';
  }

  if (!data.package_name || data.package_name.trim().length === 0) {
    errors.package_name = 'Silakan pilih layanan atau paket yang diinginkan.';
  }

  if (!data.quantity || data.quantity < 1) {
    errors.quantity = 'Jumlah item minimal 1.';
  }

  if (!data.brief || data.brief.trim().length < 10) {
    errors.brief = 'Brief proyek wajib diisi minimal 10 karakter untuk panduan tim kami.';
  }

  if (!data.deadline || data.deadline.trim().length === 0) {
    errors.deadline = 'Estimasi target deadline wajib diisi.';
  }

  if (data.file_link && data.file_link.trim().length > 0) {
    const isUrl = /^https?:\/\//i.test(data.file_link.trim());
    if (!isUrl) {
      errors.file_link = 'Tautan bahan/Google Drive harus diawali dengan http:// atau https://';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Order Status transition rules.
 */
export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (from === 'CANCELLED' || from === 'COMPLETED') {
    // Terminal states can only be reopened to IN_PROGRESS by explicit admin intervention
    return to === 'IN_PROGRESS';
  }
  return true;
}

/**
 * Validates Payment Status transition rules.
 */
export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return true;
}

/**
 * Marks an order as confirmed paid via QRIS or Bank Transfer.
 */
export function markOrderPaymentConfirmed(
  order: Order,
  paymentRef: string = '',
  notes: string = ''
): Order {
  const updatedStatus: OrderStatus = order.order_status === 'NEW' ? 'CONFIRMED' : order.order_status;
  const payNotes = paymentRef
    ? `Pembayaran QRIS Terverifikasi (Ref: ${paymentRef}). ${notes}`
    : `Pembayaran QRIS Berhasil Dikonfirmasi Klien. ${notes}`;

  return {
    ...order,
    payment_status: 'PAID',
    order_status: updatedStatus,
    notes: order.notes ? `${order.notes} | ${payNotes}` : payNotes,
  };
}

/**
 * Generates an official Receipt / Invoice number from an Order ID.
 */
export function generateReceiptNumber(orderId: string): string {
  const clean = orderId.replace(/^ORD-/, '');
  return `INV-${clean}`;
}

/**
 * Generates an encoded WhatsApp message specifically for "Payment Successful" confirmation.
 */
export function generateWhatsAppPaidConfirmationUrl(
  businessPhone: string,
  order: Order,
  brandName: string = 'Kinetika Studio'
): string {
  const cleanPhone = normalizeWhatsAppNumber(businessPhone);

  const lines = [
    `Halo *${brandName}*, saya ingin konfirmasi bahwa *PEMBAYARAN QRIS TELAH BERHASIL*:`,
    '',
    `✅ *Status:* PEMBAYARAN LUNAS / TERVERIFIKASI`,
    `📄 *Order ID:* ${order.order_id}`,
    `👤 *Nama Klien:* ${order.customer_name}`,
    `📦 *Paket:* ${order.package_name} (${order.quantity} item)`,
    `💰 *Nominal Dibayar:* ${formatCurrencyIDR(order.total)}`,
    `💳 *Metode:* QRIS Gopay Merchant (ILHAM NAWAWI, DIGITAL & K)`,
    `⏳ *Target Deadline:* ${order.deadline}`,
    '',
    'Mohon dicek di dashboard dan segera dimulai pengerjaannya. Terima kasih banyak!'
  ];

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * Detects payment status transitions (specifically to PAID) between current local orders
 * and remote orders fetched from Google Apps Script / Webhook.
 */
export interface StatusChangeResult {
  updatedOrders: Order[];
  newlyPaidOrders: Order[];
  hasChanges: boolean;
}

export function detectPaymentStatusChanges(
  currentOrders: Order[],
  remoteOrders: Array<Partial<Order> & { order_id: string }>
): StatusChangeResult {
  const remoteMap = new Map<string, Partial<Order>>();
  for (const r of remoteOrders) {
    if (r && r.order_id) {
      remoteMap.set(r.order_id.trim().toUpperCase(), r);
    }
  }

  const newlyPaidOrders: Order[] = [];
  let hasChanges = false;

  const updatedOrders = currentOrders.map((existing) => {
    const remote = remoteMap.get(existing.order_id.trim().toUpperCase());
    if (!remote) return existing;

    const oldPayment = existing.payment_status;
    const newPayment = remote.payment_status || existing.payment_status;
    const newOrderStat = remote.order_status || existing.order_status;
    const newNotes = remote.notes !== undefined ? remote.notes : existing.notes;
    const newDelivery = remote.delivery_link !== undefined ? remote.delivery_link : existing.delivery_link;

    const isNewlyPaid = oldPayment !== 'PAID' && newPayment === 'PAID';
    const isChanged = oldPayment !== newPayment || existing.order_status !== newOrderStat;

    if (isChanged) {
      hasChanges = true;
      const updated: Order = {
        ...existing,
        payment_status: newPayment,
        order_status: isNewlyPaid && existing.order_status === 'NEW' ? 'CONFIRMED' : newOrderStat,
        notes: newNotes,
        delivery_link: newDelivery,
      };
      if (isNewlyPaid) {
        newlyPaidOrders.push(updated);
      }
      return updated;
    }

    return existing;
  });

  return {
    updatedOrders,
    newlyPaidOrders,
    hasChanges,
  };
}

/**
 * Simulates receiving an incoming payment webhook event (e.g. from QRIS GoPay, BCA, or Bank API).
 */
export function simulateIncomingWebhook(
  orders: Order[],
  orderId: string,
  gateway: string = 'GOPAY_QRIS',
  referenceNumber?: string
): { updatedOrders: Order[]; paidOrder: Order | null } {
  const cleanId = orderId.trim().toUpperCase();
  const ref = referenceNumber || `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;
  let paidOrder: Order | null = null;

  const updatedOrders = orders.map((o) => {
    if (o.order_id.toUpperCase() === cleanId) {
      const updated: Order = {
        ...o,
        payment_status: 'PAID',
        order_status: o.order_status === 'NEW' ? 'CONFIRMED' : o.order_status,
        notes: o.notes
          ? `${o.notes} | Webhook Settled: ${gateway} (Ref: ${ref})`
          : `Webhook Settled: ${gateway} (Ref: ${ref})`,
      };
      paidOrder = updated;
      return updated;
    }
    return o;
  });

  return {
    updatedOrders,
    paidOrder,
  };
}

