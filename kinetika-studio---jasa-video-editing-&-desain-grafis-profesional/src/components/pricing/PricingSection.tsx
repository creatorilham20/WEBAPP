import React from 'react';
import { PricingPackage } from '../../types';
import { Check, X, Clock, RefreshCw, ArrowUpRight, Zap } from 'lucide-react';

interface PricingSectionProps {
  packages: PricingPackage[];
  onSelectPackage: (pkg: PricingPackage) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  packages,
  onSelectPackage,
}) => {
  return (
    <section id="harga" className="py-24 bg-[#0b0c10] border-t border-neutral-900 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-[#ccff00]/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ccff00] mb-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
            <span>Paket Investasi Konten</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Harga Transparan, Hasil Tanpa Kompromi
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mt-3">
            Pilih paket yang sesuai dengan fase pertumbuhan channel atau bisnis Anda. Seluruh harga dapat disesuaikan untuk kebutuhan khusus.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg) => {
            const isHighlight = pkg.highlight;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-2 ${
                  isHighlight
                    ? 'bg-neutral-900 border-2 border-[#ccff00] shadow-2xl shadow-[#ccff00]/15 lg:-translate-y-2'
                    : 'bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50'
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ccff00] text-[#0b0c10] text-[11px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1.5 animate-pulse">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>PALING BANYAK DIPILIH</span>
                  </div>
                )}

                <div>
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-extrabold text-white mb-1 group-hover:text-[#ccff00] transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-neutral-400 min-h-[32px]">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-4 border-y border-neutral-800/80 mb-6">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                      {pkg.priceDisplay}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {pkg.unit}
                    </div>
                  </div>

                  {/* SLA metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 mb-6 font-mono">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/40">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{pkg.estimatedDays} Hari Kerja</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/40">
                      <RefreshCw className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{pkg.revisionLimit}x Revisi</span>
                    </div>
                  </div>

                  {/* Deliverables List */}
                  <div className="space-y-2.5 mb-6">
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                      Termasuk dalam paket:
                    </div>
                    {pkg.deliverables.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-200">
                        <Check className="w-3.5 h-3.5 text-[#ccff00] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations if any */}
                  {pkg.limitations && pkg.limitations.length > 0 && (
                    <div className="space-y-1.5 pt-4 border-t border-neutral-800/60 mb-6">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-mono">
                        Catatan layanan:
                      </div>
                      {pkg.limitations.map((limit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-neutral-400">
                          <span className="text-neutral-600 mt-0.5">·</span>
                          <span>{limit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onSelectPackage(pkg)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                    isHighlight
                      ? 'bg-[#ccff00] hover:bg-[#b8e600] text-[#0b0c10] shadow-md shadow-[#ccff00]/15 hover:shadow-[#ccff00]/30'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  }`}
                >
                  <span>{pkg.ctaText || `Pilih ${pkg.name}`}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
