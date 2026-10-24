import React from 'react';
import { X, Shield } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyType: 'terms' | 'privacy' | 'refund';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  policyType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl bg-[#0e1017] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#12141c]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#ccff00]" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {policyType === 'terms'
                ? 'Syarat & Ketentuan Layanan (Terms of Service)'
                : policyType === 'privacy'
                ? 'Kebijakan Privasi (Privacy Policy)'
                : 'Kebijakan Revisi & Pengembalian Dana (Refund)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-neutral-300 space-y-4 leading-relaxed">
          {policyType === 'terms' && (
            <>
              <p>
                Selamat datang di Kinetika Studio. Dengan menggunakan layanan editing video dan desain grafis kami, Anda menyetujui ketentuan berikut:
              </p>
              <h4 className="font-bold text-white pt-2">1. Ruang Lingkup Layanan</h4>
              <p>
                Kinetika Studio menyediakan jasa pascaproduksi video (editing, sound design, color grading, subtitles) dan desain grafis digital (social media, banner, poster) sesuai brief yang disepakati.
              </p>
              <h4 className="font-bold text-white pt-2">2. Bahan Mentah & Hak Cipta Klien</h4>
              <p>
                Klien bertanggung jawab penuh atas hak cipta footage, rekaman audio, logo, dan materi mentah yang diserahkan untuk diedit. Kinetika Studio dibebaskan dari segala tuntutan pelanggaran hak cipta atas bahan yang disediakan klien.
              </p>
              <h4 className="font-bold text-white pt-2">3. Penyerahan Hasil Akhir & Kepemilikan</h4>
              <p>
                Setelah pembayaran lunas diterima, seluruh hak komersial dan kepemilikan hasil akhir menjadi milik klien seutuhnya untuk dipublikasikan tanpa batasan royalti.
              </p>
            </>
          )}

          {policyType === 'privacy' && (
            <>
              <p>
                Kebijakan Privasi ini menjelaskan bagaimana Kinetika Studio mengelola data kontak dan bahan proyek Anda:
              </p>
              <h4 className="font-bold text-white pt-2">1. Data yang Dikumpulkan</h4>
              <p>
                Kami hanya mengumpulkan data yang diperlukan untuk memproses pesanan Anda: Nama, nomor WhatsApp, email, dan tautan folder bahan proyek di Google Drive.
              </p>
              <h4 className="font-bold text-white pt-2">2. Keamanan Bahan Mentah</h4>
              <p>
                Bahan mentah dan draft video Anda disimpan dalam penyimpanan terisolasi dan tidak akan pernah dibagikan kepada pihak ketiga di luar tim produksi yang bertugas.
              </p>
              <h4 className="font-bold text-white pt-2">3. Portofolio & Kerahasiaan (NDA)</h4>
              <p>
                Jika proyek Anda bersifat rahasia (pre-release produk atau private corporate), Anda berhak meminta perjanjian kerahasiaan agar karya tidak dijadikan materi portofolio publik kami.
              </p>
            </>
          )}

          {policyType === 'refund' && (
            <>
              <p>
                Ketentuan revisi dan pengembalian dana kami dirancang secara transparan dan adil:
              </p>
              <h4 className="font-bold text-white pt-2">1. Batasan Revisi</h4>
              <p>
                Revisi mencakup perubahan tempo, pemotongan klip, penyesuaian font caption, musik, atau warna. Revisi tidak mencakup penggantian total konsep brief setelah draft pertama selesai.
              </p>
              <h4 className="font-bold text-white pt-2">2. Kebijakan Refund</h4>
              <p>
                Jika tim kami gagal memenuhi tenggat waktu yang disepakati karena kelalaian internal tanpa konfirmasi, klien berhak mendapatkan pengembalian dana penuh atau kompensasi layanan tambahan.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 bg-[#12141c] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
