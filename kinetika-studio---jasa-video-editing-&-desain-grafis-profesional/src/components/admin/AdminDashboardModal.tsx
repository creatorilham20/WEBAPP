import React, { useState } from 'react';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  PricingPackage,
  ServiceItem,
  StudioSettings,
} from '../../types';
import { StorageService, GOOGLE_APPS_SCRIPT_CODE } from '../../services/storageService';
import {
  formatCurrencyIDR,
  detectPaymentStatusChanges,
  simulateIncomingWebhook,
} from '../../utils/orderLogic';
import { playPaymentSuccessChime } from '../../utils/audioChime';
import {
  X,
  Lock,
  Unlock,
  Search,
  Filter,
  CheckCircle,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  Settings,
  DollarSign,
  Layers,
  Copy,
  ExternalLink,
  Save,
  Check,
  AlertCircle,
  Eye,
  Send,
  Database,
  Activity,
  Zap,
  Terminal,
  Radio,
  Play,
  Pause,
  BellRing,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  packages: PricingPackage[];
  services: ServiceItem[];
  settings: StudioSettings;
  onOrdersUpdated: (newOrders: Order[]) => void;
  onPackagesUpdated: (newPackages: PricingPackage[]) => void;
  onSettingsUpdated: (newSettings: StudioSettings) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  packages,
  services,
  settings,
  onOrdersUpdated,
  onPackagesUpdated,
  onSettingsUpdated,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPasscode, setEnteredPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'orders' | 'webhook' | 'services' | 'sheets' | 'settings'>('orders');

  // Orders management filters & selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  // Order editor form state
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('NEW');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('UNPAID');
  const [editRevisionCount, setEditRevisionCount] = useState<number>(0);
  const [editDeliveryLink, setEditDeliveryLink] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Polling & Webhook Listener State
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [pollingIntervalSeconds, setPollingIntervalSeconds] = useState<number>(10);
  const [isPollingRunning, setIsPollingRunning] = useState<boolean>(false);
  const [lastPollTime, setLastPollTime] = useState<string>(() => new Date().toLocaleTimeString('id-ID'));
  const [pollCycleCount, setPollCycleCount] = useState<number>(0);
  const [webhookTargetId, setWebhookTargetId] = useState<string>('');
  const [selectedGateway, setSelectedGateway] = useState<string>('QRIS_GOPAY');
  const [customRefInput, setCustomRefInput] = useState<string>('');
  const [syncLogs, setSyncLogs] = useState<
    Array<{ id: string; time: string; type: 'POLL' | 'WEBHOOK' | 'PAID' | 'INFO'; message: string; badge?: string }>
  >([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString('id-ID'),
      type: 'INFO',
      message: 'Sistem polling & webhook listener studio aktif dan siap memantau transaksi QRIS.',
      badge: 'READY',
    },
  ]);

  const addSyncLog = (type: 'POLL' | 'WEBHOOK' | 'PAID' | 'INFO', message: string, badge?: string) => {
    setSyncLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        time: new Date().toLocaleTimeString('id-ID'),
        type,
        message,
        badge,
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Sync editor whenever selectedOrder changes
  React.useEffect(() => {
    if (selectedOrder) {
      setEditOrderStatus(selectedOrder.order_status);
      setEditPaymentStatus(selectedOrder.payment_status);
      setEditRevisionCount(selectedOrder.revision_count);
      setEditDeliveryLink(selectedOrder.delivery_link || '');
      setEditNotes(selectedOrder.notes || '');
      setSaveSuccessMsg('');
    }
  }, [selectedOrder]);

  // Google Sheets integration state
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState<string>(settings.googleAppsScriptUrl);
  const [isGoogleSheetsActiveInput, setIsGoogleSheetsActiveInput] = useState<boolean>(settings.isGoogleSheetsActive);
  const [connectionTestResult, setConnectionTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Editable pricing packages
  const [localPackages, setLocalPackages] = useState<PricingPackage[]>(packages);

  // Periodic Polling Function
  const executePollCheck = async (isManual = false) => {
    setIsPollingRunning(true);
    const nowTime = new Date().toLocaleTimeString('id-ID');
    setLastPollTime(nowTime);
    setPollCycleCount((prev) => prev + 1);

    const pendingCount = orders.filter((o) => o.payment_status === 'UNPAID' || o.payment_status === 'PENDING_VERIFICATION').length;

    try {
      let remoteOrders: Partial<Order>[] = [];

      // 1. If Google Apps Script is active and URL set, fetch remote orders
      if (settings.isGoogleSheetsActive && settings.googleAppsScriptUrl.trim()) {
        const remoteRes = await StorageService.fetchRemoteOrders(settings.googleAppsScriptUrl.trim());
        if (remoteRes.success && remoteRes.orders) {
          remoteOrders = remoteRes.orders;
          addSyncLog('POLL', `Google Sheets Sync: Berhasil memeriksa ${remoteOrders.length} data order remote.`, 'SHEETS');
        }
      }

      // 2. Also check local storage updates (e.g. if another client tab marked payment)
      const localStored = StorageService.getOrders();
      const combinedRemote = [...remoteOrders, ...localStored];

      const changeResult = detectPaymentStatusChanges(orders, combinedRemote as any);

      if (changeResult.hasChanges) {
        onOrdersUpdated(changeResult.updatedOrders);
        StorageService.saveOrders(changeResult.updatedOrders);

        // If any order transitioned to PAID
        if (changeResult.newlyPaidOrders.length > 0) {
          changeResult.newlyPaidOrders.forEach((paidOrd) => {
            playPaymentSuccessChime();
            window.dispatchEvent(new CustomEvent('kinetika_order_updated', { detail: paidOrd }));
            addSyncLog(
              'PAID',
              `🎉 PEMBAYARAN LUNAS TERVERIFIKASI: ${paidOrd.order_id} (${paidOrd.customer_name}) - ${formatCurrencyIDR(paidOrd.total)}. Event 'kinetika_order_updated' berhasil dipicu!`,
              'PAID'
            );
          });
        }
      } else {
        if (isManual) {
          addSyncLog('INFO', `Status up-to-date. Tidak ada perubahan status pembayaran untuk ${pendingCount} antrean.`, 'OK');
        }
      }
    } catch (err: unknown) {
      addSyncLog('INFO', `Notice polling: ${(err as Error).message || 'Koneksi lokal normal'}`, 'WARN');
    } finally {
      setIsPollingRunning(false);
    }
  };

  // Setup periodic polling interval
  React.useEffect(() => {
    if (!isPollingActive || !isOpen) return;

    const timeoutId = setTimeout(() => {
      executePollCheck();
    }, 1200);

    const intervalId = setInterval(() => {
      executePollCheck();
    }, pollingIntervalSeconds * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isPollingActive, pollingIntervalSeconds, isOpen, orders, settings]);

  // Webhook settlement simulator
  const handleTriggerWebhookSettlement = async (targetOrderId?: string) => {
    const idToPay = targetOrderId || webhookTargetId || (orders.find((o) => o.payment_status !== 'PAID')?.order_id);
    if (!idToPay) {
      alert('Pilih order yang ingin disimulasikan settlement webhook-nya.');
      return;
    }

    const ref = customRefInput.trim() || `GOPAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const { updatedOrders, paidOrder } = simulateIncomingWebhook(orders, idToPay, selectedGateway, ref);

    if (paidOrder) {
      onOrdersUpdated(updatedOrders);
      StorageService.saveOrders(updatedOrders);
      if (selectedOrder?.order_id === paidOrder.order_id) {
        setSelectedOrder(paidOrder);
      }

      // Sync to Google Sheets if configured
      if (settings.isGoogleSheetsActive && settings.googleAppsScriptUrl.trim()) {
        StorageService.updateOrder(paidOrder);
      }

      // Play celebration chime
      playPaymentSuccessChime();

      // Dispatch real-time event to customer UI
      window.dispatchEvent(new CustomEvent('kinetika_order_updated', { detail: paidOrder }));

      // Audit trail log
      addSyncLog(
        'WEBHOOK',
        `⚡ WEBHOOK SETTLEMENT: ${paidOrder.order_id} (${paidOrder.customer_name}) settlement sukses via ${selectedGateway}. Ref: ${ref}. Event 'kinetika_order_updated' dipicu ke seluruh UI!`,
        'SETTLED'
      );

      setSaveSuccessMsg(`Webhook berhasil diproses! ${paidOrder.order_id} kini berstatus LUNAS.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPasscode.trim() === settings.adminPasscode) {
      setIsAuthenticated(true);
      setAuthError('');
      if (orders.length > 0 && !selectedOrder) {
        selectOrderToEdit(orders[0]);
      }
    } else {
      setAuthError('Passcode tidak valid. Gunakan passcode default: admin123');
    }
  };

  const selectOrderToEdit = (ord: Order) => {
    setSelectedOrder(ord);
    setEditOrderStatus(ord.order_status);
    setEditPaymentStatus(ord.payment_status);
    setEditRevisionCount(ord.revision_count);
    setEditDeliveryLink(ord.delivery_link || '');
    setEditNotes(ord.notes || '');
    setSaveSuccessMsg('');
  };

  const handleSaveOrderChanges = async () => {
    if (!selectedOrder) return;

    const updatedOrder: Order = {
      ...selectedOrder,
      order_status: editOrderStatus,
      payment_status: editPaymentStatus,
      revision_count: editRevisionCount,
      delivery_link: editDeliveryLink.trim(),
      notes: editNotes.trim(),
    };

    const newOrders = orders.map((o) => (o.order_id === updatedOrder.order_id ? updatedOrder : o));
    onOrdersUpdated(newOrders);
    setSelectedOrder(updatedOrder);

    await StorageService.updateOrder(updatedOrder);
    setSaveSuccessMsg('Perubahan pesanan berhasil disimpan & disinkronkan!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleTestConnection = async () => {
    setConnectionTestResult({ status: 'testing', message: 'Menguji koneksi ke Google Apps Script...' });
    const result = await StorageService.testGoogleAppsScriptConnection(appsScriptUrlInput.trim());
    if (result.success) {
      setConnectionTestResult({ status: 'success', message: result.message });
    } else {
      setConnectionTestResult({ status: 'error', message: result.message });
    }
  };

  const handleSaveSheetsConfig = () => {
    const updatedSettings: StudioSettings = {
      ...settings,
      googleAppsScriptUrl: appsScriptUrlInput.trim(),
      isGoogleSheetsActive: isGoogleSheetsActiveInput,
    };
    onSettingsUpdated(updatedSettings);
    StorageService.saveSettings(updatedSettings);
    alert('Pengaturan Google Sheets tersimpan!');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'PAID')
    .reduce((acc, curr) => acc + curr.total, 0);
  const pendingOrders = orders.filter((o) => o.order_status === 'NEW' || o.order_status === 'IN_PROGRESS').length;
  const pendingPayments = orders.filter((o) => o.payment_status === 'PENDING_VERIFICATION' || o.payment_status === 'UNPAID').length;
  const completedOrders = orders.filter((o) => o.order_status === 'COMPLETED').length;

  // Filtered orders list
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.whatsapp.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || ord.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || ord.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div
        className="relative w-full max-w-6xl bg-[#0e1017] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#12141c]">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-neutral-800 text-[#ccff00]">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>PORTAL ADMIN KINETIKA STUDIO</span>
                {isAuthenticated && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    TEROTENTIKASI
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setIsPollingActive(!isPollingActive)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border flex items-center gap-1.5 transition-colors ${
                    isPollingActive
                      ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                  title={isPollingActive ? 'Klik untuk jeda auto-polling' : 'Klik untuk mengaktifkan auto-polling'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPollingActive ? 'bg-[#ccff00] animate-pulse' : 'bg-neutral-600'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isPollingActive ? `Polling: ${pollingIntervalSeconds}s` : 'Polling: Dijeda'}
                  </span>
                  {isPollingActive ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-neutral-400" />}
                </button>

                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
                >
                  Kunci / Keluar
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="Tutup admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AUTHENTICATION GATE */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#090a0e]">
            <div className="w-full max-w-md p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-6">
              <div className="w-12 h-12 rounded-full bg-neutral-800 text-[#ccff00] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Otorisasi Dashboard Admin</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Masukkan passcode internal untuk mengelola pesanan, harga paket, dan database Google Sheets.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={enteredPasscode}
                    onChange={(e) => setEnteredPasscode(e.target.value)}
                    placeholder="Masukkan Passcode (Default: admin123)"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-center text-white text-sm font-mono focus:outline-none focus:border-[#ccff00]"
                    autoFocus
                  />
                  {authError && (
                    <span className="text-xs text-red-400 mt-1.5 block">
                      {authError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#ccff00] text-[#0b0c10] font-bold rounded-xl text-xs hover:bg-[#b8e600] transition-colors"
                >
                  Buka Akses Dashboard
                </button>
              </form>

              <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 font-mono">
                PASSCODE DEFAULT: <span className="text-neutral-300">admin123</span>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0b0f]">
            {/* Navigation Tabs & Metrics Summary */}
            <div className="px-6 py-3 border-b border-neutral-800 bg-[#0f1118] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'orders'
                      ? 'bg-[#ccff00] text-[#0b0c10]'
                      : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Daftar Pesanan ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('webhook')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'webhook'
                      ? 'bg-[#ccff00] text-[#0b0c10]'
                      : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Live Webhook & Polling</span>
                  {isPollingActive && (
                    <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('sheets')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'sheets'
                      ? 'bg-[#ccff00] text-[#0b0c10]'
                      : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Google Sheets Sync</span>
                  {settings.isGoogleSheetsActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'services'
                      ? 'bg-[#ccff00] text-[#0b0c10]'
                      : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Kelola Paket & Harga</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'settings'
                      ? 'bg-[#ccff00] text-[#0b0c10]'
                      : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan Studio</span>
                </button>
              </div>

              {/* KPI Strip */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-neutral-500">Omset Lunas: </span>
                  <span className="text-[#ccff00] font-bold">{formatCurrencyIDR(totalRevenue)}</span>
                </div>
                <div className="hidden sm:block text-neutral-600">|</div>
                <div className="hidden sm:block">
                  <span className="text-neutral-500">Antrean Kerja: </span>
                  <span className="text-white font-bold">{pendingOrders}</span>
                </div>
              </div>
            </div>

            {/* TAB 1: ORDERS MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left side: Orders list table with search & filter */}
                <div className="lg:w-7/12 border-r border-neutral-800 flex flex-col overflow-hidden">
                  {/* Search and filters bar */}
                  <div className="p-4 border-b border-neutral-800 bg-[#0e1017] grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1 relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari ID/Nama/WA..."
                        className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                      />
                      <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                    </div>

                    <div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
                      >
                        <option value="ALL">Semua Status Kerja</option>
                        <option value="NEW">NEW (Baru)</option>
                        <option value="CONFIRMED">CONFIRMED (Terkonfirmasi)</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (Pengerjaan)</option>
                        <option value="REVISION">REVISION (Revisi)</option>
                        <option value="COMPLETED">COMPLETED (Selesai)</option>
                        <option value="CANCELLED">CANCELLED (Batal)</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
                      >
                        <option value="ALL">Semua Status Bayar</option>
                        <option value="UNPAID">UNPAID (Belum Bayar)</option>
                        <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                        <option value="PARTIAL">PARTIAL (DP)</option>
                        <option value="PAID">PAID (Lunas)</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders list */}
                  <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80">
                    {filteredOrders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-500">
                        Tidak ada pesanan yang sesuai dengan filter pencarian.
                      </div>
                    ) : (
                      filteredOrders.map((ord) => {
                        const isSelected = selectedOrder?.order_id === ord.order_id;
                        return (
                          <div
                            key={ord.order_id}
                            onClick={() => selectOrderToEdit(ord)}
                            className={`p-4 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#181d28] border-l-2 border-[#ccff00]'
                                : 'hover:bg-neutral-900/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono font-bold text-[#ccff00]">
                                {ord.order_id}
                              </span>
                              <span className="text-[11px] text-neutral-400 font-mono">
                                {new Date(ord.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white truncate max-w-[200px]">
                                {ord.customer_name}
                              </span>
                              <span className="text-xs font-mono font-bold text-white">
                                {formatCurrencyIDR(ord.total)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-neutral-400 mt-1 font-mono">
                              <span>
                                {ord.package_name} ({ord.quantity}x)
                              </span>
                              <div className="flex items-center gap-2">
                                {ord.payment_status !== 'PAID' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTriggerWebhookSettlement(ord.order_id);
                                    }}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-[#ccff00] hover:text-[#0b0c10] text-[#ccff00] font-mono font-bold transition-colors flex items-center gap-1"
                                    title="Tembak Webhook Lunas untuk pesanan ini"
                                  >
                                    <Zap className="w-2.5 h-2.5" />
                                    <span>Webhook</span>
                                  </button>
                                )}
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    ord.payment_status === 'PAID'
                                      ? 'text-emerald-400 bg-emerald-950/60'
                                      : ord.payment_status === 'PENDING_VERIFICATION'
                                      ? 'text-yellow-400 bg-yellow-950/60'
                                      : 'text-red-400 bg-red-950/60'
                                  }`}
                                >
                                  {ord.payment_status}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded text-neutral-300 bg-neutral-800">
                                  {ord.order_status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right side: Detailed Order Editor Drawer */}
                <div className="lg:w-5/12 bg-[#0e1017] p-6 pb-14 overflow-y-auto space-y-6">
                  {selectedOrder ? (
                    <>
                      <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
                        <div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            DETAIL & EDIT PESANAN
                          </div>
                          <h3 className="text-lg font-bold text-white font-mono">
                            {selectedOrder.order_id}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedOrder.payment_status !== 'PAID' && (
                            <button
                              type="button"
                              onClick={async () => {
                                setEditPaymentStatus('PAID');
                                if (editOrderStatus === 'NEW') setEditOrderStatus('CONFIRMED');
                                const updated: Order = {
                                  ...selectedOrder,
                                  payment_status: 'PAID',
                                  order_status: selectedOrder.order_status === 'NEW' ? 'CONFIRMED' : selectedOrder.order_status,
                                  notes: selectedOrder.notes ? `${selectedOrder.notes} | Verifikasi Lunas QRIS oleh Admin` : 'Verifikasi Lunas QRIS oleh Admin',
                                };
                                const newOrders = orders.map((o) => (o.order_id === updated.order_id ? updated : o));
                                onOrdersUpdated(newOrders);
                                setSelectedOrder(updated);
                                await StorageService.updateOrder(updated);
                                window.dispatchEvent(new CustomEvent('kinetika_order_updated', { detail: updated }));
                                setSaveSuccessMsg('Status pembayaran QRIS berhasil diubah menjadi LUNAS!');
                                setTimeout(() => setSaveSuccessMsg(''), 3000);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ccff00] text-[#0b0c10] text-xs font-bold hover:bg-[#b8e600] transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verifikasi Lunas QRIS</span>
                            </button>
                          )}
                          <a
                            href={`https://api.whatsapp.com/send?phone=${selectedOrder.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/30 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Chat Klien</span>
                          </a>
                        </div>
                      </div>

                      {saveSuccessMsg && (
                        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{saveSuccessMsg}</span>
                        </div>
                      )}

                      {/* Client Info Grid */}
                      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-neutral-300">
                          <div>
                            <span className="text-neutral-500 block">Klien:</span>
                            <span className="font-semibold text-white">{selectedOrder.customer_name}</span> ({selectedOrder.customer_type})
                          </div>
                          <div>
                            <span className="text-neutral-500 block">WhatsApp:</span>
                            <span className="font-mono text-white">{selectedOrder.whatsapp}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Email:</span>
                            <span>{selectedOrder.email || '-'}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Deadline:</span>
                            <span className="font-mono text-white">{selectedOrder.deadline}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-neutral-800/80">
                          <span className="text-neutral-500 block">Brief Proyek:</span>
                          <p className="text-neutral-200 mt-0.5 text-xs bg-neutral-950 p-2 rounded border border-neutral-800">
                            {selectedOrder.brief}
                          </p>
                        </div>

                        {selectedOrder.file_link && (
                          <div className="pt-2 border-t border-neutral-800/80">
                            <span className="text-neutral-500 block">Link Bahan / Drive:</span>
                            <a
                              href={selectedOrder.file_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ccff00] hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <span>{selectedOrder.file_link}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* EDIT STATUS FORM */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-400 mb-1">
                              Status Pekerjaan
                            </label>
                            <select
                              value={editOrderStatus}
                              onChange={(e) => setEditOrderStatus(e.target.value as OrderStatus)}
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ccff00]"
                            >
                              <option value="NEW">NEW (Baru)</option>
                              <option value="CONFIRMED">CONFIRMED (Terkonfirmasi)</option>
                              <option value="IN_PROGRESS">IN_PROGRESS (Pengerjaan)</option>
                              <option value="REVISION">REVISION (Revisi)</option>
                              <option value="COMPLETED">COMPLETED (Selesai)</option>
                              <option value="CANCELLED">CANCELLED (Batal)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-400 mb-1">
                              Status Pembayaran
                            </label>
                            <select
                              value={editPaymentStatus}
                              onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ccff00]"
                            >
                              <option value="UNPAID">UNPAID (Belum Bayar)</option>
                              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                              <option value="PARTIAL">PARTIAL (DP 50%)</option>
                              <option value="PAID">PAID (Lunas Terverifikasi)</option>
                              <option value="REFUNDED">REFUNDED</option>
                            </select>
                          </div>
                        </div>

                        {/* Revision counter */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 mb-1">
                            Jumlah Revisi yang Digunakan
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setEditRevisionCount(Math.max(0, editRevisionCount - 1))}
                              className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-700 flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-white text-sm">
                              {editRevisionCount}x Putaran
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditRevisionCount(editRevisionCount + 1)}
                              className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-700 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Delivery Link Input */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 mb-1">
                            Link Serah Terima Aset Final (Google Drive / Dropbox)
                          </label>
                          <input
                            type="url"
                            value={editDeliveryLink}
                            onChange={(e) => setEditDeliveryLink(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                          />
                          <span className="text-[11px] text-neutral-500 mt-0.5 block">
                            Link ini akan langsung muncul pada menu "Lacak Order" klien setelah diisi.
                          </span>
                        </div>

                        {/* Admin Internal Notes */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 mb-1">
                            Catatan Internal Admin / Update untuk Klien
                          </label>
                          <textarea
                            rows={3}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Catatan pengerjaan, editor yang ditugaskan, jadwal kirim draft..."
                            className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveOrderChanges}
                          className="w-full py-2.5 bg-[#ccff00] text-[#0b0c10] font-bold rounded-xl text-xs hover:bg-[#b8e600] transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Pembaruan Pesanan</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      Pilih salah satu pesanan pada daftar di sebelah kiri untuk melihat detail.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: LIVE WEBHOOK & POLLING */}
            {activeTab === 'webhook' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#ccff00] uppercase mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
                      <span>Real-Time Payment Listener</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Live Webhook & Auto-Polling Engine
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                      Mengecek status pembayaran QRIS secara periodik ke Google Apps Script dan memancarkan event{' '}
                      <code className="text-[#ccff00] font-mono">kinetika_order_updated</code> secara instan ke UI pelanggan begitu status berubah menjadi <span className="text-emerald-400 font-bold">PAID</span>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => executePollCheck(true)}
                      disabled={isPollingRunning}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-neutral-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPollingRunning ? 'animate-spin text-[#ccff00]' : ''}`} />
                      <span>{isPollingRunning ? 'Memeriksa...' : 'Cek Status Sekarang'}</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Engine Controller */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Radio className="w-4 h-4 text-[#ccff00]" />
                        <span>Mesin Polling</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isPollingActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {isPollingActive ? 'AKTIF' : 'DIJEDA'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Interval Polling:</span>
                        <select
                          value={pollingIntervalSeconds}
                          onChange={(e) => setPollingIntervalSeconds(Number(e.target.value))}
                          className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-mono focus:outline-none"
                        >
                          <option value={5}>5 Detik (Ultra Cepat)</option>
                          <option value={10}>10 Detik (Standar)</option>
                          <option value={30}>30 Detik</option>
                          <option value={60}>60 Detik</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Pemeriksaan Terakhir:</span>
                        <span className="font-mono text-white">{lastPollTime}</span>
                      </div>

                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Total Siklus Sinkron:</span>
                        <span className="font-mono text-[#ccff00]">#{pollCycleCount}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !isPollingActive;
                        setIsPollingActive(next);
                        addSyncLog('INFO', next ? 'Auto-polling diaktifkan kembali.' : 'Auto-polling dijeda oleh admin.', 'POLL');
                      }}
                      className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                        isPollingActive
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          : 'bg-[#ccff00] text-[#0b0c10] hover:bg-[#b8e600]'
                      }`}
                    >
                      {isPollingActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPollingActive ? 'Jeda Polling Sementara' : 'Mulai Auto-Polling'}</span>
                    </button>
                  </div>

                  {/* Card 2: Pending Payments Queue */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Antrean Unpaid / Pending</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">
                        {pendingPayments} Pesanan
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-neutral-400">Nominal Menunggu Verifikasi:</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {formatCurrencyIDR(
                          orders
                            .filter((o) => o.payment_status === 'UNPAID' || o.payment_status === 'PENDING_VERIFICATION')
                            .reduce((acc, curr) => acc + curr.total, 0)
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400 leading-relaxed border-t border-neutral-800/80 pt-2">
                      Sistem memeriksa antrean pesanan ini setiap {pollingIntervalSeconds} detik untuk mendeteksi settlement QRIS yang masuk.
                    </div>
                  </div>

                  {/* Card 3: Target UI Event Listeners */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Event Bus Pelanggan (Real-Time)</span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center gap-2 text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>
                          <strong>OrderWizardModal:</strong> Auto-switch ke Notifikasi Lunas di Langkah 4
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>
                          <strong>OrderTrackerModal:</strong> Status langsung berubah hijau & muncul Invoice
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>
                          <strong>App Global Toast:</strong> Pop-up notifikasi perayaan dan audio chime
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webhook Test Simulator Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-[#12151f] border-2 border-[#ccff00]/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#ccff00] text-[#0b0c10]">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Simulator Webhook Masuk (QRIS Payment Settlement)
                        </h4>
                        <p className="text-xs text-neutral-400">
                          Uji coba respon instan sistem saat payment gateway atau Google Apps Script mengirimkan payload pembayaran sukses.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Pilih Pesanan Target
                      </label>
                      <select
                        value={webhookTargetId}
                        onChange={(e) => setWebhookTargetId(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ccff00]"
                      >
                        <option value="">-- Pilih Pesanan ({orders.length} Tersedia) --</option>
                        {orders.map((o) => (
                          <option key={o.order_id} value={o.order_id}>
                            {o.order_id} - {o.customer_name} ({o.payment_status} - {formatCurrencyIDR(o.total)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Penyedia Gateway / Bank
                      </label>
                      <select
                        value={selectedGateway}
                        onChange={(e) => setSelectedGateway(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ccff00]"
                      >
                        <option value="QRIS_GOPAY">GoPay Merchant QRIS (ILHAM NAWAWI)</option>
                        <option value="QRIS_BCA">BCA Mobile QRIS</option>
                        <option value="QRIS_MANDIRI">Livin' Mandiri QRIS</option>
                        <option value="QRIS_DANA">DANA QRIS</option>
                        <option value="QRIS_SHOPEEPAY">ShopeePay QRIS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        No. Referensi Bank (Opsional)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customRefInput}
                          onChange={(e) => setCustomRefInput(e.target.value)}
                          placeholder="GOPAY-99887766"
                          className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomRefInput(`REF-${Math.floor(10000000 + Math.random() * 90000000)}`)}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl transition-colors whitespace-nowrap"
                        >
                          Acak
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Target event:{' '}
                      <span className="text-[#ccff00]">window.dispatchEvent('kinetika_order_updated')</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerWebhookSettlement()}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#ccff00] text-[#0b0c10] font-bold rounded-xl text-xs hover:bg-[#b8e600] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#ccff00]/10"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>⚡ Tembak Webhook Settlement (PAID)</span>
                    </button>
                  </div>
                </div>

                {/* Live Audit Terminal & Streaming Event Log */}
                <div className="rounded-2xl bg-[#07080b] border border-neutral-800 overflow-hidden shadow-2xl">
                  <div className="px-4 py-3 bg-[#0d0f14] border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 mr-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <Terminal className="w-4 h-4 text-neutral-400" />
                      <span className="text-xs font-mono font-bold text-white">
                        kinetika-event-bus:~$ tail -f /var/log/payment-sync.log
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {syncLogs.length} Entri Tercatat
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSyncLogs([
                            {
                              id: 'clear-1',
                              time: new Date().toLocaleTimeString('id-ID'),
                              type: 'INFO',
                              message: 'Log terminal dibersihkan.',
                              badge: 'CLEARED',
                            },
                          ])
                        }
                        className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 transition-colors"
                      >
                        Bersihkan Log
                      </button>
                    </div>
                  </div>

                  <div className="p-4 max-h-64 overflow-y-auto space-y-2 font-mono text-xs">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-neutral-500 select-none shrink-0">[{log.time}]</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                            log.type === 'PAID'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.type === 'WEBHOOK'
                              ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30'
                              : log.type === 'POLL'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {log.badge || log.type}
                        </span>
                        <span
                          className={`${
                            log.type === 'PAID'
                              ? 'text-emerald-300 font-semibold'
                              : log.type === 'WEBHOOK'
                              ? 'text-white'
                              : 'text-neutral-300'
                          }`}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE SHEETS INTEGRATION & SETUP GUIDE */}
            {activeTab === 'sheets' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto">
                <div>
                  <div className="text-xs font-mono font-bold text-[#ccff00] uppercase mb-1">
                    Database Integration Center
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Integrasi Google Sheets (CREATIVE_STUDIO_DB)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Hubungkan website dengan Google Sheets Anda melalui Google Apps Script Web App tanpa biaya hosting database terpisah.
                  </p>
                </div>

                {/* Connection Box */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">
                        Status Sinkronisasi Google Sheets
                      </div>
                      <div className="text-xs text-neutral-400">
                        {settings.isGoogleSheetsActive
                          ? 'Aktif — Pesanan baru akan otomatis dicatat ke Spreadsheet'
                          : 'Non-Aktif (Mode Demo Lokal Aktif)'}
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGoogleSheetsActiveInput}
                        onChange={(e) => setIsGoogleSheetsActiveInput(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ccff00]"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      Web App URL Google Apps Script (berakhiran /exec)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={appsScriptUrlInput}
                        onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                        className="flex-1 px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
                      />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                      >
                        Uji Sambungan
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSheetsConfig}
                        className="px-4 py-2 bg-[#ccff00] text-[#0b0c10] text-xs font-bold rounded-xl hover:bg-[#b8e600] transition-colors whitespace-nowrap"
                      >
                        Simpan URL
                      </button>
                    </div>

                    {connectionTestResult.message && (
                      <div
                        className={`mt-2 p-3 rounded-lg text-xs flex items-center gap-2 ${
                          connectionTestResult.status === 'success'
                            ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                            : connectionTestResult.status === 'testing'
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-red-950/60 border border-red-800 text-red-300'
                        }`}
                      >
                        {connectionTestResult.status === 'success' && <Check className="w-4 h-4 shrink-0" />}
                        {connectionTestResult.status === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{connectionTestResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7-Step Setup Guide as instructed by prompt */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Panduan 7 Langkah Menyiapkan Spreadsheet & Script
                  </h4>

                  <div className="space-y-3 text-xs text-neutral-300">
                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="font-bold text-white mb-1">
                        1. Buat Spreadsheet Baru di Google Drive
                      </div>
                      <p className="text-neutral-400">
                        Buka Google Drive Anda, buat spreadsheet baru dan beri nama persis: <span className="text-[#ccff00] font-mono">CREATIVE_STUDIO_DB</span>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="font-bold text-white mb-1">
                        2. Siapkan 5 Tab dengan Nama Header Kolom Persis
                      </div>
                      <div className="space-y-2 mt-2 font-mono text-[11px]">
                        <div>
                          <span className="text-white font-bold">Tab 1: ORDERS</span>
                          <p className="text-neutral-400">
                            order_id, created_at, customer_name, whatsapp, email, customer_type, service_type, package_name, quantity, brief, deadline, file_link, subtotal, discount, total, payment_status, order_status, revision_count, delivery_link, notes
                          </p>
                        </div>
                        <div>
                          <span className="text-white font-bold">Tab 2: CUSTOMERS</span>
                          <p className="text-neutral-400">
                            customer_id, name, whatsapp, email, business_name, customer_type, created_at, notes
                          </p>
                        </div>
                        <div>
                          <span className="text-white font-bold">Tab 3: SERVICES</span>
                          <p className="text-neutral-400">
                            service_id, service_name, category, description, base_price, unit, estimated_days, revision_limit, is_active
                          </p>
                        </div>
                        <div>
                          <span className="text-white font-bold">Tab 4: PAYMENTS</span>
                          <p className="text-neutral-400">
                            payment_id, order_id, payment_date, amount, method, reference, proof_link, verification_status, verified_at, notes
                          </p>
                        </div>
                        <div>
                          <span className="text-white font-bold">Tab 5: SETTINGS</span>
                          <p className="text-neutral-400">setting_key, setting_value</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-white">
                          3. Buka Extensions &gt; Apps Script dan Tempel Kode Backend
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyScript}
                          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#ccff00] text-[#0b0c10] font-bold text-xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedScript ? 'Tersalin!' : 'Salin Seluruh Kode Script'}</span>
                        </button>
                      </div>
                      <p className="text-neutral-400 mb-2">
                        Hapus semua kode bawaan di editor Apps Script, lalu tempel kode backend siap pakai kami. Kode ini menangani validasi harga di server, penambahan order, pelacakan, dan update status.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="font-bold text-white mb-1">
                        4. Deploy sebagai Web App
                      </div>
                      <p className="text-neutral-400">
                        Klik tombol biru <strong>Deploy &gt; New deployment</strong>. Pilih type <strong>Web app</strong>.<br />
                        - <strong>Execute as:</strong> "Me" (email Google Anda)<br />
                        - <strong>Who has access:</strong> "Anyone" (wajib agar browser dapat mengirim formulir order).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="font-bold text-white mb-1">
                        5. Berikan Izin Akses (Authorize Access)
                      </div>
                      <p className="text-neutral-400">
                        Pilih akun Google Anda, klik <em>Advanced</em>, lalu <em>Go to Untitled project (unsafe)</em> dan klik <em>Allow</em>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="font-bold text-white mb-1">
                        6. Tempelkan URL ke Dashboard Website & Uji Sambungan
                      </div>
                      <p className="text-neutral-400">
                        Salin URL deployment yang berakhiran <code className="text-[#ccff00]">/exec</code> ke kolom di atas dan tekan <strong>Uji Sambungan</strong>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div className="font-bold text-white mb-1">
                        7. Troubleshooting Jika Mengalami Error
                      </div>
                      <p className="text-neutral-400 leading-relaxed">
                        Jika status tes menunjukkan error, pastikan pengaturan <em>Who has access</em> telah disetel ke <strong>Anyone</strong> (bukan Only myself) dan tab spreadsheet memiliki ejaan nama persis huruf kapital (ORDERS, CUSTOMERS, dll).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SERVICES & PACKAGES PRICING */}
            {activeTab === 'services' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Kelola Harga & Paket Layanan</h3>
                    <p className="text-xs text-neutral-400">
                      Sesuaikan harga paket awal (Video Starter, Design Starter, Content Bundle, Monthly Creator). Perubahan tersimpan secara lokal dan langsung tercermin di katalog publik.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {localPackages.map((pkg, idx) => (
                    <div
                      key={pkg.id}
                      className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{pkg.name}</span>
                        <span className="text-xs font-mono text-neutral-500">{pkg.unit}</span>
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Harga Paket (IDR)
                        </label>
                        <input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...localPackages];
                            updated[idx] = {
                              ...updated[idx],
                              price: val,
                              priceDisplay: val > 0 ? formatCurrencyIDR(val) : 'Berdasarkan Brief',
                            };
                            setLocalPackages(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#ccff00]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            SLA (Hari Kerja)
                          </label>
                          <input
                            type="number"
                            value={pkg.estimatedDays}
                            onChange={(e) => {
                              const updated = [...localPackages];
                              updated[idx] = { ...updated[idx], estimatedDays: Number(e.target.value) || 1 };
                              setLocalPackages(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            Batas Revisi
                          </label>
                          <input
                            type="number"
                            value={pkg.revisionLimit}
                            onChange={(e) => {
                              const updated = [...localPackages];
                              updated[idx] = { ...updated[idx], revisionLimit: Number(e.target.value) || 1 };
                              setLocalPackages(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onPackagesUpdated(localPackages);
                    StorageService.savePackages(localPackages);
                    alert('Daftar paket dan harga berhasil diperbarui!');
                  }}
                  className="px-6 py-2.5 bg-[#ccff00] text-[#0b0c10] font-bold rounded-xl text-xs hover:bg-[#b8e600] transition-colors"
                >
                  Simpan Semua Perubahan Harga
                </button>
              </div>
            )}

            {/* TAB 4: STUDIO SETTINGS */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-white">Pengaturan Umum Studio</h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Nama Brand Studio</label>
                    <input
                      type="text"
                      defaultValue={settings.brandName}
                      onChange={(e) => onSettingsUpdated({ ...settings, brandName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Nomor WhatsApp Bisnis</label>
                    <input
                      type="text"
                      defaultValue={settings.whatsapp}
                      onChange={(e) => onSettingsUpdated({ ...settings, whatsapp: e.target.value })}
                      placeholder="6281234567890"
                      className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Email Bisnis</label>
                    <input
                      type="email"
                      defaultValue={settings.email}
                      onChange={(e) => onSettingsUpdated({ ...settings, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Jam Operasional Layanan</label>
                    <input
                      type="text"
                      defaultValue={settings.operationalHours}
                      onChange={(e) => onSettingsUpdated({ ...settings, operationalHours: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Passcode Login Admin</label>
                    <input
                      type="text"
                      defaultValue={settings.adminPasscode}
                      onChange={(e) => onSettingsUpdated({ ...settings, adminPasscode: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  {/* QRIS Configuration & Status */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                        <span>QRIS Resmi Studio Aktif</span>
                      </div>
                      <a
                        href={settings.qrisDetails.imageUrl || '/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png'}
                        download="QRIS_ILHAM_NAWAWI.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#ccff00] hover:underline"
                      >
                        Unduh File QRIS
                      </a>
                    </div>
                    <div className="flex items-center gap-4">
                      <img
                        src={settings.qrisDetails.imageUrl || '/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png'}
                        alt="QRIS Preview"
                        className="w-24 h-auto rounded-lg bg-white p-1 border border-neutral-700 shrink-0"
                      />
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-white">{settings.qrisDetails.merchantName || 'ILHAM NAWAWI, DIGITAL & K'}</div>
                        <div className="font-mono text-neutral-400">NMID: {settings.qrisDetails.nmid || 'ID1026599770496'}</div>
                        <div className="text-[11px] text-neutral-400">
                          Kode QRIS ini otomatis ditampilkan kepada klien pada formulir pemesanan, invoice, dan pelacakan pesanan.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      StorageService.saveSettings(settings);
                      alert('Pengaturan umum studio berhasil disimpan!');
                    }}
                    className="px-6 py-2.5 bg-[#ccff00] text-[#0b0c10] font-bold rounded-xl text-xs hover:bg-[#b8e600] transition-colors"
                  >
                    Simpan Pengaturan Studio
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
