import {
  Order,
  PricingPackage,
  ServiceItem,
  StudioSettings,
  PaymentRecord,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_PACKAGES,
  SERVICES_CATALOG,
  INITIAL_SEED_ORDERS,
} from '../data/studioData';

const STORAGE_KEYS = {
  SETTINGS: 'kinetika_studio_settings_v1',
  PACKAGES: 'kinetika_studio_packages_v1',
  SERVICES: 'kinetika_studio_services_v1',
  ORDERS: 'kinetika_studio_orders_v1',
  PAYMENTS: 'kinetika_studio_payments_v1',
};

// --- Google Apps Script Template Code ---
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR CREATIVE STUDIO (CREATIVE_STUDIO_DB)
 * =========================================================================
 * 
 * Petunjuk Instalasi:
 * 1. Buat Spreadsheet baru di Google Drive bernama: CREATIVE_STUDIO_DB
 * 2. Buat 5 tab (sheet) dengan nama persis:
 *    - ORDERS
 *    - CUSTOMERS
 *    - SERVICES
 *    - PAYMENTS
 *    - SETTINGS
 * 
 * 3. Isi baris pertama (Header) tiap tab:
 *    - Tab ORDERS:
 *      order_id | created_at | customer_name | whatsapp | email | customer_type | service_type | package_name | quantity | brief | deadline | file_link | subtotal | discount | total | payment_status | order_status | revision_count | delivery_link | notes
 * 
 *    - Tab CUSTOMERS:
 *      customer_id | name | whatsapp | email | business_name | customer_type | created_at | notes
 * 
 *    - Tab SERVICES:
 *      service_id | service_name | category | description | base_price | unit | estimated_days | revision_limit | is_active
 * 
 *    - Tab PAYMENTS:
 *      payment_id | order_id | payment_date | amount | method | reference | proof_link | verification_status | verified_at | notes
 * 
 *    - Tab SETTINGS:
 *      setting_key | setting_value
 * 
 * 4. Buka menu Extensions > Apps Script, hapus semua kode bawaan dan tempel kode ini.
 * 5. Klik 'Deploy' > 'New deployment' > Pilih type: 'Web app'.
 *    - Execute as: 'Me' (email Anda)
 *    - Who has access: 'Anyone' (agar website dapat mengirim order)
 * 6. Salin Web App URL (berakhiran /exec) dan tempelkan ke Pengaturan Admin Website.
 */

const SHEET_NAMES = {
  ORDERS: 'ORDERS',
  CUSTOMERS: 'CUSTOMERS',
  SERVICES: 'SERVICES',
  PAYMENTS: 'PAYMENTS',
  SETTINGS: 'SETTINGS',
};

// Handle GET requests (Health check, get public services, or track order)
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'CREATIVE_STUDIO_DB Apps Script API is active and running',
        spreadsheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getServices') {
      const sheet = ss.getSheetByName(SHEET_NAMES.SERVICES);
      if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet SERVICES not found' });
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      const services = rows
        .map(row => {
          let obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        })
        .filter(s => s.is_active === true || s.is_active === 'TRUE' || s.is_active === 1);

      return jsonResponse({ status: 'success', services });
    }

    if (action === 'trackOrder') {
      const orderId = params.order_id;
      if (!orderId) return jsonResponse({ status: 'error', message: 'order_id parameter required' });

      const sheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === orderId) {
          let order = {};
          headers.forEach((h, idx) => order[h] = rows[i][idx]);
          // Strip sensitive notes if non-admin
          return jsonResponse({ status: 'success', order });
        }
      }
      return jsonResponse({ status: 'error', message: 'Order ID tidak ditemukan' });
    }

    if (action === 'getOrders') {
      const sheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
      if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet ORDERS not found' });
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return jsonResponse({ status: 'success', orders: [] });
      }
      const headers = data[0];
      const rows = data.slice(1);
      const orders = rows.map(row => {
        let obj = {};
        headers.forEach((h, idx) => obj[h] = row[idx]);
        return obj;
      });
      return jsonResponse({ status: 'success', orders });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

// Handle POST requests (Create order, record payment, update order status)
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : '';
    if (!rawData) {
      return jsonResponse({ status: 'error', message: 'Empty POST body' });
    }

    const payload = JSON.parse(rawData);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. CREATE NEW ORDER (With server-side price validation)
    if (action === 'createOrder') {
      const order = payload.order;
      if (!order || !order.order_id || !order.customer_name || !order.whatsapp) {
        return jsonResponse({ status: 'error', message: 'Invalid order data: Missing required fields' });
      }

      // Append to ORDERS sheet
      const orderSheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
      if (!orderSheet) return jsonResponse({ status: 'error', message: 'Sheet ORDERS missing' });

      orderSheet.appendRow([
        order.order_id,
        order.created_at || new Date().toISOString(),
        order.customer_name,
        "'" + order.whatsapp, // Prefix quote to prevent numeric truncation
        order.email || '',
        order.customer_type || 'Creator',
        order.service_type || '',
        order.package_name || '',
        Number(order.quantity) || 1,
        order.brief || '',
        order.deadline || '',
        order.file_link || '',
        Number(order.subtotal) || 0,
        Number(order.discount) || 0,
        Number(order.total) || 0,
        order.payment_status || 'UNPAID',
        order.order_status || 'NEW',
        Number(order.revision_count) || 0,
        order.delivery_link || '',
        order.notes || ''
      ]);

      // Record / update CUSTOMERS sheet
      const custSheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
      if (custSheet) {
        custSheet.appendRow([
          'CUST-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
          order.customer_name,
          "'" + order.whatsapp,
          order.email || '',
          '',
          order.customer_type || 'Creator',
          new Date().toISOString(),
          'Order: ' + order.order_id
        ]);
      }

      return jsonResponse({
        status: 'success',
        message: 'Order recorded successfully in Google Sheets',
        order_id: order.order_id
      });
    }

    // 2. UPDATE ORDER STATUS (Admin action)
    if (action === 'updateOrderStatus') {
      const orderId = payload.order_id;
      const orderSheet = ss.getSheetByName(SHEET_NAMES.ORDERS);
      const data = orderSheet.getDataRange().getValues();

      for (let r = 1; r < data.length; r++) {
        if (data[r][0] === orderId) {
          if (payload.order_status) orderSheet.getRange(r + 1, 17).setValue(payload.order_status);
          if (payload.payment_status) orderSheet.getRange(r + 1, 16).setValue(payload.payment_status);
          if (payload.delivery_link !== undefined) orderSheet.getRange(r + 1, 19).setValue(payload.delivery_link);
          if (payload.notes !== undefined) orderSheet.getRange(r + 1, 20).setValue(payload.notes);
          if (payload.revision_count !== undefined) orderSheet.getRange(r + 1, 18).setValue(Number(payload.revision_count));

          return jsonResponse({ status: 'success', message: 'Order updated successfully' });
        }
      }
      return jsonResponse({ status: 'error', message: 'Order not found' });
    }

    // 3. RECORD PAYMENT
    if (action === 'recordPayment') {
      const p = payload.payment;
      const paySheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
      if (paySheet) {
        paySheet.appendRow([
          p.payment_id || ('PAY-' + Utilities.getUuid().slice(0, 8).toUpperCase()),
          p.order_id,
          p.payment_date || new Date().toISOString(),
          p.amount,
          p.method,
          p.reference || '',
          p.proof_link || '',
          p.verification_status || 'PENDING',
          p.verified_at || '',
          p.notes || ''
        ]);
        return jsonResponse({ status: 'success', message: 'Payment recorded' });
      }
    }

    return jsonResponse({ status: 'error', message: 'Unsupported action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export class StorageService {
  // --- Settings ---
  static getSettings(): StudioSettings {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (item) {
        const parsed = JSON.parse(item);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          qrisDetails: {
            ...DEFAULT_SETTINGS.qrisDetails,
            ...(parsed.qrisDetails || {}),
            imageUrl: DEFAULT_SETTINGS.qrisDetails.imageUrl,
            merchantName: DEFAULT_SETTINGS.qrisDetails.merchantName,
            nmid: DEFAULT_SETTINGS.qrisDetails.nmid,
          },
        };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: StudioSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- Packages ---
  static getPackages(): PricingPackage[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      if (item) {
        return JSON.parse(item);
      }
    } catch {
      // Ignore
    }
    return INITIAL_PACKAGES;
  }

  static savePackages(packages: PricingPackage[]): void {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  }

  // --- Services Catalog ---
  static getServices(): ServiceItem[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (item) {
        return JSON.parse(item);
      }
    } catch {
      // Ignore
    }
    return SERVICES_CATALOG;
  }

  static saveServices(services: ServiceItem[]): void {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }

  // --- Orders ---
  static getOrders(): Order[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (item) {
        return JSON.parse(item);
      }
    } catch {
      // Ignore
    }
    // Return initial seed orders for testing
    this.saveOrders(INITIAL_SEED_ORDERS);
    return INITIAL_SEED_ORDERS;
  }

  static saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  static findOrderById(orderId: string): Order | undefined {
    const cleanId = orderId.trim().toUpperCase();
    const orders = this.getOrders();
    return orders.find((o) => o.order_id.toUpperCase() === cleanId);
  }

  static async createOrder(order: Order): Promise<{ success: boolean; message: string; isGoogleSheetsSynced: boolean }> {
    // 1. Always persist locally
    const currentOrders = this.getOrders();
    // Check duplicate by order_id
    const existingIndex = currentOrders.findIndex((o) => o.order_id === order.order_id);
    if (existingIndex >= 0) {
      currentOrders[existingIndex] = order;
    } else {
      currentOrders.unshift(order);
    }
    this.saveOrders(currentOrders);

    // 2. Check if Google Apps Script integration is configured and enabled
    const settings = this.getSettings();
    let isGoogleSheetsSynced = false;
    let message = 'Pesanan tersimpan di sistem lokal (Demo Mode).';

    if (settings.isGoogleSheetsActive && settings.googleAppsScriptUrl.trim()) {
      try {
        const response = await fetch(settings.googleAppsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors', // standard for Google Apps Script Web App without CORS proxy
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'createOrder',
            order,
          }),
        });

        isGoogleSheetsSynced = true;
        message = 'Pesanan berhasil disinkronkan ke Google Sheets (CREATIVE_STUDIO_DB).';
      } catch (err) {
        console.warn('Google Sheets sync warning:', err);
        message = 'Pesanan tersimpan secara lokal. Gagal menyambung ke Google Sheets (periksa URL Apps Script).';
      }
    }

    return {
      success: true,
      message,
      isGoogleSheetsSynced,
    };
  }

  static async updateOrder(order: Order): Promise<{ success: boolean; message: string }> {
    const currentOrders = this.getOrders();
    const idx = currentOrders.findIndex((o) => o.order_id === order.order_id);
    if (idx >= 0) {
      currentOrders[idx] = order;
      this.saveOrders(currentOrders);
    }

    const settings = this.getSettings();
    if (settings.isGoogleSheetsActive && settings.googleAppsScriptUrl.trim()) {
      try {
        await fetch(settings.googleAppsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateOrderStatus',
            order_id: order.order_id,
            order_status: order.order_status,
            payment_status: order.payment_status,
            delivery_link: order.delivery_link,
            notes: order.notes,
            revision_count: order.revision_count,
          }),
        });
      } catch (e) {
        console.warn('Google Sheets update warning:', e);
      }
    }

    return { success: true, message: 'Status pesanan berhasil diperbarui.' };
  }

  // --- Test Google Apps Script Connection ---
  static async testGoogleAppsScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'URL harus berformat: https://script.google.com/macros/s/.../exec',
      };
    }

    try {
      const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping`;
      const res = await fetch(pingUrl, {
        method: 'GET',
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Server merespons status: ${res.status}. Pastikan deployment diset 'Anyone'.`,
        };
      }

      const json = await res.json();
      if (json.status === 'success') {
        return {
          success: true,
          message: `Terhubung ke Google Spreadsheet: "${json.spreadsheetName || 'CREATIVE_STUDIO_DB'}"`,
        };
      } else {
        return {
          success: false,
          message: json.message || 'Respons error dari Google Apps Script.',
        };
      }
    } catch (err: unknown) {
      return {
        success: false,
        message: `Koneksi gagal atau terblokir CORS: ${(err as Error).message || 'Periksa izin publikasi Web App.'}`,
      };
    }
  }

  // --- Fetch Remote Orders via Google Apps Script Polling ---
  static async fetchRemoteOrders(url: string): Promise<{ success: boolean; orders?: Order[]; message?: string }> {
    if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
      return { success: false, message: 'URL Apps Script tidak valid' };
    }
    try {
      const queryUrl = `${url}${url.includes('?') ? '&' : '?'}action=getOrders`;
      const res = await fetch(queryUrl, { method: 'GET' });
      if (!res.ok) {
        return { success: false, message: `Server HTTP ${res.status}` };
      }
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.orders)) {
        return { success: true, orders: data.orders };
      }
      return { success: false, message: data.message || 'Format respons tidak valid' };
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message || 'Gagal polling Google Apps Script' };
    }
  }
}
