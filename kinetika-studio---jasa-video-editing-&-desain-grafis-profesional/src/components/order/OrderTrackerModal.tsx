import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  formatCurrencyIDR,
  generateReceiptNumber,
  generateWhatsAppPaidConfirmationUrl,
  markOrderPaymentConfirmed,
} from '../../utils/orderLogic';
import { playPaymentSuccessChime } from '../../utils/audioChime';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileCheck,
  BadgeCheck,
  Loader2,
  Send,
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  whatsappNumber,
}) => {
  const [searchId, setSearchId] = useState<string>('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isVerifyingQris, setIsVerifyingQris] = useState<boolean>(false);
  const [justVerifiedSuccess, setJustVerifiedSuccess] = useState<boolean>(false);

  // Listen for real-time order updates (e.g. from admin or order wizard)
  useEffect(() => {
    const handleOrderSync = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail && searchedOrder && customEvent.detail.order_id === searchedOrder.order_id) {
        setSearchedOrder(customEvent.detail);
      }
    };
    window.addEventListener('kinetika_order_updated', handleOrderSync);
    return () => window.removeEventListener('kinetika_order_updated', handleOrderSync);
  }, [searchedOrder]);

  if (!isOpen) return null;

  const handleVerifyQrisInTracker = async () => {
    if (!searchedOrder) return;
    setIsVerifyingQris(true);

    setTimeout(async () => {
      const simulatedRef = 'GOPAY-' + Math.floor(10000000 + Math.random() * 90000000);
      const updated = markOrderPaymentConfirmed(
        searchedOrder,
        simulatedRef,
        'Verifikasi QRIS Instan Berhasil via Pelacak'
      );
      setSearchedOrder(updated);
      setIsVerifyingQris(false);
      setJustVerifiedSuccess(true);

      await StorageService.updateOrder(updated);
      playPaymentSuccessChime();
      window.dispatchEvent(new CustomEvent('kinetika_order_updated', { detail: updated }));
    }, 1100);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setErrorMessage('');

    if (!searchId.trim()) {
      setErrorMessage('Silakan masukkan nomor Order ID Anda.');
      setSearchedOrder(null);
      return;
    }

    const found = StorageService.findOrderById(searchId.trim());
    if (found) {
      setSearchedOrder(found);
      setErrorMessage('');
    } else {
      setSearchedOrder(null);
      setErrorMessage(
        `Order dengan ID "${searchId.toUpperCase()}" tidak ditemukan. Pastikan format penulisan benar, misalnya: ORD-20261024-8921.`
      );
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="text-blue-400 font-mono">Pesanan Baru (Menunggu Konfirmasi)</span>;
      case 'CONFIRMED':
        return <span className="text-yellow-400 font-mono">Terkonfirmasi (Antrean Pengerjaan)</span>;
      case 'IN_PROGRESS':
        return <span className="text-[#ccff00] font-mono">Sedang Diedit / Dikerjakan</span>;
      case 'REVISION':
        return <span className="text-orange-400 font-mono">Dalam Tahap Revisi</span>;
      case 'COMPLETED':
        return <span className="text-emerald-400 font-mono">Selesai & Final Diserahkan</span>;
      case 'CANCELLED':
        return <span className="text-red-400 font-mono">Dibatalkan</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'UNPAID':
        return <span className="text-red-400 font-mono">Belum Dibayar</span>;
      case 'PENDING_VERIFICATION':
        return <span className="text-yellow-400 font-mono">Menunggu Verifikasi Admin</span>;
      case 'PARTIAL':
        return <span className="text-blue-400 font-mono">Uang Muka (DP) Terverifikasi</span>;
      case 'PAID':
        return <span className="text-emerald-400 font-mono">Lunas Terverifikasi</span>;
      case 'REFUNDED':
        return <span className="text-neutral-400 font-mono">Dana Dikembalikan</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-xl bg-[#0e1017] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#12141c]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#ccff00]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Lacak Progres Pesanan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Tutup pelacak"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Masukkan Order ID (Contoh: ORD-20261024-8921)"
              className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs font-mono uppercase focus:outline-none focus:border-[#ccff00]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#ccff00] text-[#0b0c10] font-bold rounded-xl text-xs hover:bg-[#b8e600] transition-colors whitespace-nowrap"
            >
              Cari Order
            </button>
          </form>

          {/* Error / Not Found */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/80 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Order Details Display */}
          {searchedOrder && (
            <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
                <div>
                  <div className="text-[11px] text-neutral-500 font-mono">ORDER ID</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {searchedOrder.order_id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-neutral-500 font-mono">TANGGAL PESAN</div>
                  <div className="text-xs text-neutral-300 font-mono">
                    {new Date(searchedOrder.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 text-xs">
                <div>
                  <div className="text-neutral-500 mb-0.5">Status Pengerjaan:</div>
                  <div className="font-semibold">{getOrderStatusBadge(searchedOrder.order_status)}</div>
                </div>
                <div>
                  <div className="text-neutral-500 mb-0.5">Status Pembayaran:</div>
                  <div className="font-semibold">{getPaymentStatusBadge(searchedOrder.payment_status)}</div>
                </div>
              </div>

              {/* Celebration Receipt Banner if order is PAID */}
              {searchedOrder.payment_status === 'PAID' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-neutral-900 border border-[#ccff00] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <BadgeCheck className="w-4 h-4 text-[#ccff00]" />
                      <span>Pembayaran QRIS Berhasil Diverifikasi!</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#ccff00] font-bold">LUNAS</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>No. Invoice:</span>
                      <span className="text-white font-bold">{generateReceiptNumber(searchedOrder.order_id)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Merchant:</span>
                      <span className="text-neutral-300">ILHAM NAWAWI, DIGITAL & K</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Metode:</span>
                      <span className="text-neutral-300">QRIS Standar Pembayaran Nasional</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Proyek Anda sudah dalam antrean pengerjaan tim kreatif. Tim editor kami sedang menyiapkan draft pertama.
                  </p>
                </div>
              )}

              {/* QRIS Quick Payment Prompt if not yet fully paid */}
              {(searchedOrder.payment_status === 'UNPAID' || searchedOrder.payment_status === 'PENDING_VERIFICATION') && (
                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                      <span>QRIS Pembayaran Resmi</span>
                    </span>
                    <a
                      href="/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png"
                      download="QRIS_ILHAM_NAWAWI.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#ccff00] hover:underline"
                    >
                      Unduh QRIS
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/Kode_QRIS_ILHAM_NAWAWI__Digital___Kreatif_9c94f99e.png"
                      alt="QRIS ILHAM NAWAWI, DIGITAL & K"
                      className="w-20 h-auto rounded bg-white p-1 shrink-0"
                    />
                    <div className="text-[11px] text-neutral-300 space-y-0.5">
                      <div className="font-bold text-white">ILHAM NAWAWI, DIGITAL & K</div>
                      <div className="font-mono text-neutral-400">NMID: ID1026599770496</div>
                      <div className="text-neutral-400">Scan QRIS via Mobile Banking atau e-Wallet apapun.</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isVerifyingQris}
                    onClick={handleVerifyQrisInTracker}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#ccff00] text-[#0b0c10] hover:bg-[#b8e600] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#ccff00]/10"
                  >
                    {isVerifyingQris ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memverifikasi Pembayaran QRIS...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Saya Sudah Bayar via QRIS (Verifikasi Sekarang)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Detail fields */}
              <div className="grid grid-cols-2 gap-3 text-xs text-neutral-300">
                <div>
                  <span className="text-neutral-500 block">Layanan / Paket:</span>
                  <span className="font-medium text-white">{searchedOrder.package_name}</span> ({searchedOrder.quantity} item)
                </div>
                <div>
                  <span className="text-neutral-500 block">Target Deadline:</span>
                  <span className="font-mono text-white">{searchedOrder.deadline}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Total Tagihan:</span>
                  <span className="font-mono font-bold text-[#ccff00]">
                    {formatCurrencyIDR(searchedOrder.total)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Putaran Revisi Digunakan:</span>
                  <span className="font-mono">{searchedOrder.revision_count}x</span>
                </div>
              </div>

              {/* Delivery Download Section if Completed */}
              {searchedOrder.delivery_link ? (
                <div className="p-4 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ccff00]">
                    <FileCheck className="w-4 h-4" />
                    <span>Hasil Akhir Siap Diunduh!</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Editor kami telah mengunggah seluruh aset final dan file master ke Google Drive:
                  </p>
                  <a
                    href={searchedOrder.delivery_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ccff00] text-[#0b0c10] font-bold text-xs hover:bg-[#b8e600] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Buka Folder Google Drive Aset Final</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400">
                  <span className="text-neutral-500 font-mono">Catatan Studio: </span>
                  {searchedOrder.notes || 'Pengerjaan sedang berjalan sesuai antrean brief.'}
                </div>
              )}

              {/* Contact Admin via WhatsApp for this Order */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Perlu bantuan cepat terkait pesanan ini?
                </span>
                <a
                  href={`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(
                    `Halo Kinetika Studio, saya ingin menanyakan perkembangan Order ID: ${searchedOrder.order_id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Chat CS</span>
                </a>
              </div>
            </div>
          )}

          {/* Hint initial state */}
          {!searchedOrder && !errorMessage && (
            <div className="text-center py-6 text-neutral-500 text-xs space-y-2">
              <p>Masukkan Order ID unik yang Anda terima setelah checkout formulir.</p>
              <p className="font-mono text-neutral-600">
                Contoh format: ORD-20261024-8921 atau ORD-20261023-4512
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
