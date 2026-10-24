import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOrderId,
  normalizeWhatsAppNumber,
  formatCurrencyIDR,
  calculateOrderPricing,
  generateWhatsAppOrderUrl,
  validateOrderInput,
  canTransitionOrderStatus,
  markOrderPaymentConfirmed,
  generateReceiptNumber,
  generateWhatsAppPaidConfirmationUrl,
  detectPaymentStatusChanges,
  simulateIncomingWebhook,
} from './orderLogic';
import { Order } from '../types';

test('generateOrderId formats correctly with prefix, date, and 4 alphanumeric chars', () => {
  const fixedDate = new Date(2026, 9, 24); // Month is 0-indexed: 9 = October
  const orderId = generateOrderId(fixedDate);

  assert.match(orderId, /^ORD-20261024-[2-9A-Z]{4}$/);
});

test('normalizeWhatsAppNumber handles 08, 8, +62, and strip spaces', () => {
  assert.equal(normalizeWhatsAppNumber('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeWhatsAppNumber('+62 812 9999 1111'), '6281299991111');
  assert.equal(normalizeWhatsAppNumber('85712345678'), '6285712345678');
  assert.equal(normalizeWhatsAppNumber('6281312345678'), '6281312345678');
});

test('calculateOrderPricing computes subtotal, discounts, and DP', () => {
  // Test 1: Standard price without discount
  const res1 = calculateOrderPricing(50000, 3, 0, false);
  assert.equal(res1.subtotal, 150000);
  assert.equal(res1.discount, 0);
  assert.equal(res1.total, 150000);
  assert.equal(res1.amountDueNow, 150000);

  // Test 2: With 10% discount
  const res2 = calculateOrderPricing(100000, 2, 10, false);
  assert.equal(res2.subtotal, 200000);
  assert.equal(res2.discount, 20000);
  assert.equal(res2.total, 180000);
  assert.equal(res2.amountDueNow, 180000);

  // Test 3: With 50% Down Payment
  const res3 = calculateOrderPricing(450000, 1, 0, true);
  assert.equal(res3.total, 450000);
  assert.equal(res3.amountDueNow, 225000);
});

test('validateOrderInput catches required fields and malformed inputs', () => {
  const invalidData: Partial<Order> = {
    customer_name: '',
    whatsapp: '123', // too short
    package_name: '',
    quantity: 0,
    brief: 'short',
    deadline: '',
    file_link: 'not-a-url',
  };

  const validation = validateOrderInput(invalidData);
  assert.equal(validation.isValid, false);
  assert.ok(validation.errors.customer_name);
  assert.ok(validation.errors.whatsapp);
  assert.ok(validation.errors.package_name);
  assert.ok(validation.errors.quantity);
  assert.ok(validation.errors.brief);
  assert.ok(validation.errors.deadline);
  assert.ok(validation.errors.file_link);

  const validData: Partial<Order> = {
    customer_name: 'Budi Kreatif',
    whatsapp: '081234567890',
    package_name: 'Content Bundle',
    quantity: 1,
    brief: 'Editing 10 video reels untuk peluncuran produk fashion UMKM.',
    deadline: '2026-11-01',
    file_link: 'https://drive.google.com/drive/folders/sample123',
  };

  const validValidation = validateOrderInput(validData);
  assert.equal(validValidation.isValid, true);
  assert.equal(Object.keys(validValidation.errors).length, 0);
});

test('generateWhatsAppOrderUrl builds properly encoded click-to-chat url', () => {
  const mockOrder: Order = {
    order_id: 'ORD-20261024-TEST',
    created_at: new Date().toISOString(),
    customer_name: 'Siti Rahma',
    whatsapp: '081234567890',
    customer_type: 'UMKM',
    service_type: 'Video Editing',
    package_name: 'Video Starter',
    quantity: 2,
    brief: 'Edit video reels promo kuliner',
    deadline: '2026-10-30',
    file_link: 'https://drive.google.com/sample',
    subtotal: 100000,
    discount: 0,
    total: 100000,
    payment_status: 'UNPAID',
    order_status: 'NEW',
    revision_count: 0,
    delivery_link: '',
    notes: '',
    payment_method: 'QRIS',
  };

  const url = generateWhatsAppOrderUrl('081999888777', mockOrder, 'Kinetika Studio');
  assert.ok(url.startsWith('https://api.whatsapp.com/send?phone=6281999888777&text='));
  assert.ok(url.includes(encodeURIComponent('ORD-20261024-TEST')));
  assert.ok(url.includes(encodeURIComponent('Siti Rahma')));
});

test('canTransitionOrderStatus allows valid transitions', () => {
  assert.equal(canTransitionOrderStatus('NEW', 'CONFIRMED'), true);
  assert.equal(canTransitionOrderStatus('CONFIRMED', 'IN_PROGRESS'), true);
  assert.equal(canTransitionOrderStatus('COMPLETED', 'CONFIRMED'), false);
  assert.equal(canTransitionOrderStatus('COMPLETED', 'IN_PROGRESS'), true); // admin override allowed
});

test('markOrderPaymentConfirmed updates status to PAID and order_status to CONFIRMED', () => {
  const mockOrder: Order = {
    order_id: 'ORD-20261024-TEST',
    created_at: new Date().toISOString(),
    customer_name: 'Ilham Test',
    whatsapp: '6281234567890',
    customer_type: 'Creator',
    service_type: 'video-editing',
    package_name: 'Video Starter',
    quantity: 1,
    brief: 'Test brief',
    deadline: '2026-10-30',
    file_link: '',
    subtotal: 50000,
    discount: 0,
    total: 50000,
    payment_status: 'UNPAID',
    order_status: 'NEW',
    revision_count: 0,
    delivery_link: '',
    notes: '',
    payment_method: 'QRIS',
  };

  const updated = markOrderPaymentConfirmed(mockOrder, 'GOPAY-998877', 'Ref bank OK');
  assert.equal(updated.payment_status, 'PAID');
  assert.equal(updated.order_status, 'CONFIRMED');
  assert.ok(updated.notes.includes('GOPAY-998877'));
});

test('generateReceiptNumber formats invoice ID correctly', () => {
  assert.equal(generateReceiptNumber('ORD-20261024-Y9CR'), 'INV-20261024-Y9CR');
});

test('generateWhatsAppPaidConfirmationUrl contains confirmed paid notice', () => {
  const mockOrder: Order = {
    order_id: 'ORD-20261024-Y9CR',
    created_at: new Date().toISOString(),
    customer_name: 'Budi Test',
    whatsapp: '6281234567890',
    customer_type: 'Creator',
    service_type: 'video-editing',
    package_name: 'Video Starter',
    quantity: 1,
    brief: 'Test brief',
    deadline: '2026-10-30',
    file_link: '',
    subtotal: 50000,
    discount: 0,
    total: 50000,
    payment_status: 'PAID',
    order_status: 'CONFIRMED',
    revision_count: 0,
    delivery_link: '',
    notes: '',
    payment_method: 'QRIS',
  };

  const url = generateWhatsAppPaidConfirmationUrl('081234567890', mockOrder, 'Kinetika Studio');
  assert.ok(url.includes(encodeURIComponent('PEMBAYARAN QRIS TELAH BERHASIL')));
  assert.ok(url.includes(encodeURIComponent('ORD-20261024-Y9CR')));
});

test('detectPaymentStatusChanges flags newly PAID orders and updates order_status', () => {
  const initialOrders: Order[] = [
    {
      order_id: 'ORD-1001',
      created_at: new Date().toISOString(),
      customer_name: 'Andi',
      whatsapp: '628111111111',
      customer_type: 'Creator',
      service_type: 'Video Editing',
      package_name: 'Video Starter',
      quantity: 1,
      brief: 'Brief 1',
      deadline: '2026-10-30',
      file_link: '',
      subtotal: 50000,
      discount: 0,
      total: 50000,
      payment_status: 'UNPAID',
      order_status: 'NEW',
      revision_count: 0,
      delivery_link: '',
      notes: '',
      payment_method: 'QRIS',
    },
    {
      order_id: 'ORD-1002',
      created_at: new Date().toISOString(),
      customer_name: 'Budi',
      whatsapp: '628222222222',
      customer_type: 'UMKM',
      service_type: 'Social Media',
      package_name: 'Design Starter',
      quantity: 1,
      brief: 'Brief 2',
      deadline: '2026-10-31',
      file_link: '',
      subtotal: 35000,
      discount: 0,
      total: 35000,
      payment_status: 'PAID',
      order_status: 'CONFIRMED',
      revision_count: 0,
      delivery_link: '',
      notes: 'Already paid',
      payment_method: 'QRIS',
    },
  ];

  // Remote database shows ORD-1001 is now PAID
  const remoteUpdates = [
    { order_id: 'ORD-1001', payment_status: 'PAID' as const, notes: 'Verified via Apps Script' },
  ];

  const result = detectPaymentStatusChanges(initialOrders, remoteUpdates);

  assert.equal(result.hasChanges, true);
  assert.equal(result.newlyPaidOrders.length, 1);
  assert.equal(result.newlyPaidOrders[0].order_id, 'ORD-1001');
  assert.equal(result.newlyPaidOrders[0].payment_status, 'PAID');
  assert.equal(result.newlyPaidOrders[0].order_status, 'CONFIRMED'); // Auto-confirmed from NEW
  assert.equal(result.updatedOrders.find((o) => o.order_id === 'ORD-1001')?.payment_status, 'PAID');
});

test('simulateIncomingWebhook transitions order to PAID and auto-confirms', () => {
  const initialOrders: Order[] = [
    {
      order_id: 'ORD-2001',
      created_at: new Date().toISOString(),
      customer_name: 'Citra',
      whatsapp: '628333333333',
      customer_type: 'Company',
      service_type: 'Bundle',
      package_name: 'Content Bundle',
      quantity: 1,
      brief: 'Brief 3',
      deadline: '2026-11-05',
      file_link: '',
      subtotal: 450000,
      discount: 0,
      total: 450000,
      payment_status: 'PENDING_VERIFICATION',
      order_status: 'NEW',
      revision_count: 0,
      delivery_link: '',
      notes: 'Waiting payment',
      payment_method: 'QRIS',
    },
  ];

  const { updatedOrders, paidOrder } = simulateIncomingWebhook(
    initialOrders,
    'ORD-2001',
    'QRIS_GOPAY',
    'GOPAY-888999'
  );

  assert.ok(paidOrder);
  assert.equal(paidOrder.order_id, 'ORD-2001');
  assert.equal(paidOrder.payment_status, 'PAID');
  assert.equal(paidOrder.order_status, 'CONFIRMED');
  assert.ok(paidOrder.notes.includes('GOPAY-888999'));
  assert.equal(updatedOrders[0].payment_status, 'PAID');
});

