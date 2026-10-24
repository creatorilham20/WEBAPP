import React, { useState } from 'react';
import { StudioSettings } from '../../types';
import { Search, Shield, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  settings: StudioSettings;
  onOpenOrderModal: (packageId?: string) => void;
  onOpenTrackerModal: () => void;
  onOpenAdminModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenOrderModal,
  onOpenTrackerModal,
  onOpenAdminModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0c10]/90 backdrop-blur-md border-b border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark) */}
        <a
          href="#"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#ccff00] group-hover:scale-125 transition-transform" />
          <span>{settings.brandName.toUpperCase()}</span>
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a
            href="#beranda"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Beranda
          </a>
          <a
            href="#layanan"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Layanan
          </a>
          <a
            href="#portofolio"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Portofolio
          </a>
          <a
            href="#harga"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Harga Paket
          </a>
          <a
            href="#kontak"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Kontak
          </a>
        </nav>

        {/* Zone 3: Primary Action and Quick Utilities */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <button
            onClick={onOpenTrackerModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors whitespace-nowrap shrink-0"
            title="Lacak status pengerjaan pesanan dengan Order ID"
          >
            <Search className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Lacak Order</span>
          </button>

          <button
            onClick={() => onOpenOrderModal()}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] rounded-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 shadow-sm"
          >
            <span>Pesan Jasa</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdminModal}
            className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg hover:bg-neutral-900"
            title="Akses Portal Admin"
            aria-label="Admin Portal"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenTrackerModal}
            className="p-2 text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg text-xs flex items-center gap-1"
            aria-label="Lacak Pesanan"
          >
            <Search className="w-4 h-4 text-[#ccff00]" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white focus:outline-none"
            aria-label="Buka menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e1017] border-b border-neutral-800 px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium text-neutral-300">
            <a
              href="#beranda"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Beranda
            </a>
            <a
              href="#layanan"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Layanan
            </a>
            <a
              href="#portofolio"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Portofolio
            </a>
            <a
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Harga Paket
            </a>
            <a
              href="#kontak"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Kontak
            </a>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOrderModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#0b0c10] bg-[#ccff00] rounded-lg"
            >
              <span>Pesan Jasa Sekarang</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTrackerModal();
                }}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>Lacak Status Order ID</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminModal();
                }}
                className="text-xs text-neutral-500 hover:text-neutral-400 flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Portal Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
