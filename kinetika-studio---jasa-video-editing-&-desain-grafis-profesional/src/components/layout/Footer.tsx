import React from 'react';
import { StudioSettings } from '../../types';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  settings: StudioSettings;
  onOpenLegal: (type: 'terms' | 'privacy' | 'refund') => void;
  onOpenOrderModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenLegal,
  onOpenOrderModal,
}) => {
  return (
    <footer className="bg-[#07080b] border-t border-neutral-900 text-neutral-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-neutral-800/80">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ccff00]" />
              <span>{settings.brandName.toUpperCase()}</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              {settings.tagline} Layanan video editing dan desain grafis profesional untuk kreator, UMKM, dan personal brand di seluruh Indonesia.
            </p>
            <div className="text-xs text-neutral-500 font-mono">
              JAKARTA · SURABAYA · BANDUNG · BALI
            </div>
          </div>

          {/* Quick Nav Col */}
          <div className="md:col-span-3 space-y-3 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
              Navigasi Halaman
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#beranda" className="hover:text-white transition-colors">
                  Beranda Studio
                </a>
              </li>
              <li>
                <a href="#layanan" className="hover:text-white transition-colors">
                  Katalog Layanan
                </a>
              </li>
              <li>
                <a href="#portofolio" className="hover:text-white transition-colors">
                  Karya Portofolio
                </a>
              </li>
              <li>
                <a href="#harga" className="hover:text-white transition-colors">
                  Paket & Biaya
                </a>
              </li>
              <li>
                <a href="#kontak" className="hover:text-white transition-colors">
                  Kontak & Konsultasi
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policy Col */}
          <div className="md:col-span-4 space-y-3 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
              Kebijakan & Keamanan
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors text-left"
                >
                  Syarat & Ketentuan Layanan
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors text-left"
                >
                  Kebijakan Privasi Data
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('refund')}
                  className="hover:text-white transition-colors text-left"
                >
                  Ketentuan Revisi & Refund
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={onOpenOrderModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ccff00] text-[#0b0c10] font-bold text-xs hover:bg-[#b8e600] transition-colors"
              >
                <span>Mulai Proyek Pertama</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div>
            © {new Date().getFullYear()} {settings.brandName}. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>ZONA WAKTU: {settings.timezone}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
