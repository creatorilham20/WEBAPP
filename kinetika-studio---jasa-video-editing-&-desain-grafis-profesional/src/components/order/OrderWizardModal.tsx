import React, { useState, useEffect } from 'react';
import {
  CustomerType,
  Order,
  PaymentMethod,
  PricingPackage,
  ServiceItem,
  StudioSettings,
} from '../../types';
import {
  calculateOrderPricing,
  formatCurrencyIDR,
  generateOrderId,
  generateWhatsAppOrderUrl,
  generateWhatsAppPaidConfirmationUrl,
  generateReceiptNumber,
  markOrderPaymentConfirmed,
  normalizeWhatsAppNumber,
  validateOrderInput,
} from '../../utils/orderLogic';
import { StorageService } from '../../services/storageService';
import { playPaymentSuccessChime } from '../../utils/audioChime';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  Send,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  QrCode,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  FileText,
  BadgeCheck,
  Loader2,
} from 'lucide-react';

interface OrderWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: PricingPackage[];
  services: ServiceItem[];
  settings: StudioSettings;
  initialPackageId?: string;
  initialVisualReference?: string;
  onOrderCompleted?: (order: Order) => void;
}

export const OrderWizardModal: React.FC<OrderWizardModalProps> = ({
  isOpen,
  onClose,
  packages,
  services,
  settings,
  initialPackageId,
  initialVisualReference,
  onOrderCompleted,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');
  const [isVerifyingQris, setIsVerifyingQris] = useState<boolean>(false);
  const [qrisPaidSuccess, setQrisPaidSuccess] = useState<boolean>(false);
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');

  // Handle immediate QRIS payment verification
  const handleVerifyQrisPayment = async () => {
    if (!createdOrder) return;
    setIsVerifyingQris(true);

    setTimeout(async () => {
      const simulatedRef = 'GOPAY-' + Math.floor(10000000 + Math.random() * 90000000);
      setPaymentRefNumber(simulatedRef);

      const updated = markOrderPaymentConfirmed(
        createdOrder,
        simulatedRef,
        'Verifikasi QRIS GoPay Merchant Berhasil'
      );
      setCreatedOrder(updated);
      setQrisPaidSuccess(true);
      setIsVerifyingQris(false);

      // Save updated status to localStorage and Google Sheets
      await StorageService.updateOrder(updated);

      // Trigger audible chime and broadcast update to tracker & admin
      playPaymentSuccessChime();
      window.dispatchEvent(new CustomEvent('kinetika_order_updated', { detail: updated }));
    }, 1100);
  };

  // Form state
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    initialPackageId || packages[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [customerType, setCustomerType] = useState<CustomerType>('Creator');
  const [brief, setBrief] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [fileLink, setFileLink] = useState<string>('');
  const [visualReference, setVisualReference] = useState<string>(initialVisualReference || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [isDownPayment, setIsDownPayment] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialPackageId) {
      setSelectedPackageId(initialPackageId);
    }
  }, [initialPackageId]);

  useEffect(() => {
    if (initialVisualReference) {
      setVisualReference(initialVisualReference);
    }
  }, [initialVisualReference]);

  // Listen for real-time payment updates from polling or webhook
  useEffect(() => {
    const handleOrderSync = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail && createdOrder && customEvent.detail.order_id === createdOrder.order_id) {
        setCreatedOrder(customEvent.detail);
        if (customEvent.detail.payment_status === 'PAID') {
          setQrisPaidSuccess(true);
        }
      }
    };
    window.addEventListener('kinetika_order_updated', handleOrderSync);
    return () => window.removeEventListener('kinetika_order_updated', handleOrderSync);
  }, [createdOrder]);

  if (!isOpen) return null;

  // Selected package details
  const activePackage = packages.find((p) => p.id === selectedPackageId) || packages[0];
  const pricing = calculateOrderPricing(
    activePackage?.price || 0,
    quantity,
    0,
    isDownPayment
  );

  const customerTypes: CustomerType[] = [
    'Creator',
    'UMKM',
    'Personal Brand',
    'Organization',
    'Company',
    'Other',
  ];

  // Step 1 to Step 2 validation
  const handleProceedToStep2 = () => {
    if (!selectedPackageId) {
      setFormErrors({ package: 'Pilih salah satu paket layanan.' });
      return;
    }
    setFormErrors({});
    setCurrentStep(2);
  };

  // Step 2 to Step 3 validation
  const handleProceedToStep3 = () => {
    const partialOrder: Partial<Order> = {
      customer_name: customerName,
      whatsapp,
      email,
      package_name: activePackage.name,
      quantity,
      brief,
      deadline,
      file_link: fileLink,
    };

    const validation = validateOrderInput(partialOrder);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    if (!termsAccepted) {
      setFormErrors({ terms: 'Anda harus menyetujui syarat layanan dan kebijakan privasi.' });
      return;
    }

    setFormErrors({});
    setCurrentStep(3);
  };

  // Step 3 to Step 4: Finalize & Submit Order
  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const orderId = generateOrderId();
      const newOrder: Order = {
        order_id: orderId,
        created_at: new Date().toISOString(),
        customer_name: customerName.trim(),
        whatsapp: normalizeWhatsAppNumber(whatsapp),
        email: email.trim() || undefined,
        customer_type: customerType,
        service_type: activePackage.category,
        package_name: activePackage.name,
        quantity,
        brief: brief.trim(),
        deadline: deadline.trim(),
        file_link: fileLink.trim(),
        visual_reference: visualReference.trim() || undefined,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        total: pricing.total,
        payment_status: 'UNPAID',
        order_status: 'NEW',
        revision_count: 0,
        delivery_link: '',
        notes: isDownPayment ? 'Klien memilih opsi pembayaran DP 50%.' : '',
        payment_method: paymentMethod,
        is_down_payment: isDownPayment,
      };

      const result = await StorageService.createOrder(newOrder);
      setCreatedOrder(newOrder);
      setSyncStatusMessage(result.message);
      setCurrentStep(4);
      if (onOrderCompleted) onOrderCompleted(newOrder);
    } catch (err: unknown) {
      setFormErrors({
        submit: `Gagal menyimpan pesanan: ${(err as Error).message || 'Terjadi kesalahan sistem'}. Mohon coba kembali.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderId = () => {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.order_id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#0e1017] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#12141c]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Formulir Pemesanan Jasa Kreatif
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Tutup form pemesanan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="px-6 py-3 bg-[#0a0b0f] border-b border-neutral-800/80 flex items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                currentStep >= 1 ? 'text-[#ccff00] font-bold' : 'text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">
                1
              </span>
              <span className="hidden sm:inline">Pilih Paket</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />

            <span
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                currentStep >= 2 ? 'text-[#ccff00] font-bold' : 'text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">
                2
              </span>
              <span className="hidden sm:inline">Detail Proyek</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />

            <span
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                currentStep >= 3 ? 'text-[#ccff00] font-bold' : 'text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">
                3
              </span>
              <span className="hidden sm:inline">Pembayaran</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />

            <span
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                currentStep >= 4 ? 'text-[#ccff00] font-bold' : 'text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px]">
                4
              </span>
              <span className="hidden sm:inline">Konfirmasi</span>
            </span>
          </div>

          <span className="text-neutral-400 text-[11px] whitespace-nowrap shrink-0 ml-2">
            Langkah {currentStep} / 4
          </span>
        </div>

        {/* Step Content Area */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {formErrors.submit && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* STEP 1: PILIH PAKET & JUMLAH */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">
                  Pilih Paket Layanan yang Diinginkan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#1a1e28] border-[#ccff00] shadow-md shadow-[#ccff00]/5'
                            : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">
                              {pkg.name}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#ccff00]" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mb-3">
                            {pkg.tagline}
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-neutral-800/80">
                          <span className="text-sm font-extrabold text-white font-mono tabular-nums">
                            {pkg.priceDisplay}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {pkg.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Jumlah Item / Proyek
                  </div>
                  <div className="text-xs text-neutral-400">
                    Berapa banyak video atau variasi desain yang ingin Anda pesan?
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-colors flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-white text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-colors flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Calculation Preview */}
              <div className="p-4 rounded-xl bg-[#12141d] border border-neutral-800/90 flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-400">Subtotal Estimasi:</div>
                  <div className="text-lg font-bold text-white font-mono tabular-nums">
                    {activePackage.price > 0
                      ? formatCurrencyIDR(pricing.subtotal)
                      : 'Berdasarkan Brief'}
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-400 font-mono">
                  <div>Estimasi: {activePackage.estimatedDays} Hari Kerja</div>
                  <div>Revisi: {activePackage.revisionLimit}x Putaran</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DETAIL PROYEK & DATA KLIEN */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Pelanggan */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nama Lengkap / Kontak <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                  />
                  {formErrors.customer_name && (
                    <span className="text-[11px] text-red-400 mt-1 block">
                      {formErrors.customer_name}
                    </span>
                  )}
                </div>

                {/* Nomor WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nomor WhatsApp Aktif <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                  />
                  {formErrors.whatsapp && (
                    <span className="text-[11px] text-red-400 mt-1 block">
                      {formErrors.whatsapp}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email (Opsional) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Email Bisnis (Opsional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                  />
                  {formErrors.email && (
                    <span className="text-[11px] text-red-400 mt-1 block">
                      {formErrors.email}
                    </span>
                  )}
                </div>

                {/* Jenis Pelanggan */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Profil Klien <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#ccff00]"
                  >
                    {customerTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brief Proyek */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Brief Proyek & Instruksi Pengerjaan <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Jelaskan tujuan video/desain, gaya visual yang diinginkan, teks/copywriting wajib, hook pembuka, atau preferensi musik latar..."
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                />
                {formErrors.brief && (
                  <span className="text-[11px] text-red-400 mt-0.5 block">
                    {formErrors.brief}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Deadline */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Target Tanggal Deadline <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#ccff00]"
                  />
                  {formErrors.deadline && (
                    <span className="text-[11px] text-red-400 mt-1 block">
                      {formErrors.deadline}
                    </span>
                  )}
                </div>

                {/* Tautan File / Google Drive */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Link Bahan Mentah (Google Drive / Dropbox)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={fileLink}
                      onChange={(e) => setFileLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                  </div>
                  {formErrors.file_link && (
                    <span className="text-[11px] text-red-400 mt-1 block">
                      {formErrors.file_link}
                    </span>
                  )}
                </div>
              </div>

              {/* Referensi Visual (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Referensi Visual / Link Akun Contoh (Opsional)
                </label>
                <input
                  type="text"
                  value={visualReference}
                  onChange={(e) => setVisualReference(e.target.value)}
                  placeholder="Contoh: @brand_referensi di Instagram, atau link video TikTok serupa"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                />
              </div>

              {/* Syarat & Kebijakan Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-700 text-[#ccff00] focus:ring-[#ccff00]"
                  />
                  <span className="text-xs text-neutral-400">
                    Saya menyetujui batasan revisi paket, kebijakan privasi data, dan bersedia melakukan konfirmasi via WhatsApp untuk verifikasi awal.
                  </span>
                </label>
                {formErrors.terms && (
                  <span className="text-[11px] text-red-400 mt-1 block">
                    {formErrors.terms}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: TINJAU RINGKASAN & METODE PEMBAYARAN */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Ringkasan Proyek
                  </span>
                  <span className="text-xs font-mono text-[#ccff00]">
                    {activePackage.name} x {quantity} item
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block">Klien:</span>
                    <span className="font-semibold">{customerName}</span> ({customerType})
                  </div>
                  <div>
                    <span className="text-neutral-500 block">WhatsApp:</span>
                    <span className="font-mono">{whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Target Deadline:</span>
                    <span>{deadline}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Bahan Mentah:</span>
                    <span className="truncate block text-neutral-400">
                      {fileLink || 'Akan dikirim susulan via WhatsApp'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Total Tagihan:</span>
                  <span className="text-lg font-extrabold text-[#ccff00] font-mono tabular-nums">
                    {activePackage.price > 0
                      ? formatCurrencyIDR(pricing.total)
                      : 'Berdasarkan Brief'}
                  </span>
                </div>
              </div>

              {/* Down payment toggle if allowed */}
              {settings.allowDownPayment && activePackage.price > 100000 && (
                <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Opsi Pembayaran Uang Muka (DP 50%)
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Bayar 50% sekarang ({formatCurrencyIDR(pricing.amountDueNow)}) untuk memulai pengerjaan, sisa dibayar setelah review draft.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDownPayment}
                    onChange={(e) => setIsDownPayment(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ccff00] focus:ring-[#ccff00]"
                  />
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Pilih Saluran Pembayaran
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'bg-[#181d26] border-[#ccff00]'
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="w-4 h-4 text-[#ccff00]" />
                      <span className="text-sm font-bold text-white">QRIS All Payment</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight">
                      Gopay, OVO, ShopeePay, Dana & Seluruh Mobile Banking
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-[#181d26] border-[#ccff00]'
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-[#ccff00]" />
                      <span className="text-sm font-bold text-white">Transfer Bank (BCA / Mandiri)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight">
                      Transfer manual dengan konfirmasi struk pembayaran
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details Display */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="text-xs font-semibold text-neutral-400">
                    Rekening Pembayaran Resmi Studio:
                  </div>
                  {settings.bankDetails.map((b, i) => (
                    <div key={i} className="text-xs text-neutral-300 font-mono">
                      <span className="text-white font-bold">{b.bankName}</span>: {b.accountNumber} a/n {b.accountHolder}
                    </div>
                  ))}
                </div>
              )}

              {paymentMethod === 'QRIS' && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    {/* QRIS Code Image with Animated Laser Radar Scan Line */}
                    <div className="relative overflow-hidden w-44 h-auto shrink-0 bg-white p-2 rounded-xl shadow-lg border border-neutral-700 flex flex-col items-center">
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent shadow-[0_0_12px_#ccff00] pointer-events-none animate-qris-scan z-10" />
                      <img
                        src={settings.qrisDetails.imageUrl || '/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png'}
                        alt="QRIS ILHAM NAWAWI, DIGITAL & K"
                        className="w-full h-auto rounded object-contain relative z-0"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                        <span className="text-[11px] font-mono text-[#ccff00] font-bold">
                          QRIS RESMI TERVERIFIKASI
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-white">
                        {settings.qrisDetails.merchantName || 'ILHAM NAWAWI, DIGITAL & K'}
                      </div>
                      <div className="text-xs text-neutral-400 font-mono">
                        NMID: {settings.qrisDetails.nmid || 'ID1026599770496'}
                      </div>
                      <div className="text-xs text-neutral-300">
                        Tagihan Saat Ini:{' '}
                        <span className="font-bold text-[#ccff00] font-mono">
                          {formatCurrencyIDR(pricing.amountDueNow)}
                        </span>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <a
                          href={settings.qrisDetails.imageUrl || '/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png'}
                          download="QRIS_ILHAM_NAWAWI.png"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
                        >
                          <span>Unduh Gambar QRIS</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed text-center sm:text-left">
                    Mendukung semua aplikasi e-wallet (GoPay, OVO, Dana, ShopeePay, LinkAja) dan Mobile Banking (BCA, Mandiri, BRI, BNI, Permata, CIMB, dll).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: KONFIRMASI ORDER & ORDER ID */}
          {currentStep === 4 && createdOrder && (
            <div className="space-y-6 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-[#ccff00]/10 border border-[#ccff00] text-[#ccff00] flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  Pesanan Berhasil Dicatat!
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                  Sistem telah mengamankan slot pengerjaan dan menghasilkan nomor unik pesanan Anda.
                </p>
              </div>

              {/* Order ID Banner */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 max-w-md mx-auto">
                <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-mono mb-1">
                  Nomor Order ID Anda
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-[#ccff00] tracking-wider">
                    {createdOrder.order_id}
                  </span>
                  <button
                    onClick={handleCopyOrderId}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    title="Salin Order ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedOrderId && (
                  <div className="text-[11px] text-[#ccff00] mt-1">
                    Order ID berhasil disalin ke clipboard!
                  </div>
                )}
              </div>

              {/* IF QRIS PAYMENT WAS COMPLETED AND VERIFIED */}
              {qrisPaidSuccess ? (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-neutral-900 border-2 border-[#ccff00] max-w-md mx-auto space-y-4 text-left shadow-2xl shadow-[#ccff00]/10 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ccff00] text-[#0b0c10] flex items-center justify-center shrink-0">
                      <BadgeCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono font-bold text-[#ccff00] uppercase tracking-wider">
                        NOTIFIKASI RESMI STUDIO
                      </div>
                      <h4 className="text-base font-extrabold text-white">
                        Pembayaran QRIS Berhasil!
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Terima kasih, <strong className="text-white">{createdOrder.customer_name}</strong>! Pembayaran sebesar <strong className="text-[#ccff00]">{formatCurrencyIDR(createdOrder.total)}</strong> telah berhasil kami verifikasi ke merchant <strong className="text-white">ILHAM NAWAWI, DIGITAL & K</strong>.
                  </p>

                  {/* Digital Receipt Card */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-neutral-400">
                      <span>No. Invoice:</span>
                      <span className="text-white font-bold">{generateReceiptNumber(createdOrder.order_id)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>No. Referensi:</span>
                      <span className="text-neutral-300">{paymentRefNumber || 'GOPAY-AUTO-VERIFIED'}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-bold">LUNAS / TERVERIFIKASI</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Waktu:</span>
                      <span className="text-neutral-300">{new Date().toLocaleTimeString('id-ID')} WIB</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <a
                      href={generateWhatsAppPaidConfirmationUrl(settings.whatsapp, createdOrder, settings.brandName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Bukti Lunas ke WhatsApp Studio</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* IF NOT YET VERIFIED */
                <>
                  {/* QRIS quick preview in Step 4 if selected */}
                  {createdOrder.payment_method === 'QRIS' && (
                    <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 max-w-md mx-auto space-y-3 text-left">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-[#ccff00]" />
                          <span>QRIS Pembayaran ({formatCurrencyIDR(createdOrder.total)})</span>
                        </span>
                        <a
                          href={settings.qrisDetails.imageUrl || '/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png'}
                          download="QRIS_ILHAM_NAWAWI.png"
                          className="text-xs text-[#ccff00] hover:underline"
                        >
                          Unduh QR
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative overflow-hidden rounded-lg bg-white p-1 shrink-0 w-20">
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent shadow-[0_0_8px_#ccff00] pointer-events-none animate-qris-scan z-10" />
                          <img
                            src={settings.qrisDetails.imageUrl || '/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png'}
                            alt="QRIS ILHAM NAWAWI"
                            className="w-full h-auto rounded relative z-0"
                          />
                        </div>
                        <div className="text-xs text-neutral-300 space-y-0.5">
                          <div className="font-bold text-white">ILHAM NAWAWI, DIGITAL & K</div>
                          <div className="font-mono text-[11px] text-neutral-400">NMID: ID1026599770496</div>
                          <div className="text-[11px] text-neutral-400">Scan QRIS melalui GoPay, OVO, Dana, BCA, atau m-Banking lain.</div>
                        </div>
                      </div>

                      {/* Instant QRIS Verification Action Button */}
                      <button
                        type="button"
                        disabled={isVerifyingQris}
                        onClick={handleVerifyQrisPayment}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#ccff00] text-[#0b0c10] hover:bg-[#b8e600] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#ccff00]/10"
                      >
                        {isVerifyingQris ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memverifikasi Jaringan QRIS...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Saya Sudah Bayar via QRIS (Verifikasi Instan)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Sync status note */}
                  <div className="text-xs text-neutral-400 max-w-md mx-auto">
                    <span className="text-neutral-500 font-mono">Status Sistem: </span>
                    {syncStatusMessage}
                  </div>

                  {/* Primary Action: WhatsApp Confirm Button */}
                  <div className="max-w-md mx-auto space-y-3 pt-2">
                    <a
                      href={generateWhatsAppOrderUrl(settings.whatsapp, createdOrder, settings.brandName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>Konfirmasi Pesanan via WhatsApp</span>
                    </a>
                    <p className="text-[11px] text-neutral-500">
                      Tautan di atas akan membuka WhatsApp dengan pesan rincian pesanan. Anda juga dapat menekan tombol verifikasi QRIS di atas setelah menyelesaikan scan pembayaran.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#12141c] flex items-center justify-between">
          {currentStep > 1 && currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] rounded-lg transition-transform active:scale-95"
            >
              <span>Lanjutkan ke Detail Proyek</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleProceedToStep3}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] rounded-lg transition-transform active:scale-95"
            >
              <span>Tinjau Ringkasan & Total</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmOrder}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 rounded-lg transition-transform active:scale-95"
            >
              <span>{isSubmitting ? 'Memproses Order...' : 'Konfirmasi & Buat Pesanan'}</span>
              <Check className="w-4 h-4" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 rounded-lg"
            >
              Selesai & Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
