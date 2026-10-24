import React, { useState } from 'react';
import { ServiceItem } from '../../types';
import { formatCurrencyIDR } from '../../utils/orderLogic';
import { Clock, RefreshCw, ArrowUpRight, Check, Sparkles } from 'lucide-react';

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Semua Layanan' },
    { id: 'video-editing', label: 'Video Editing' },
    { id: 'social-media-design', label: 'Social Media Design' },
    { id: 'poster-banner', label: 'Poster & Banner' },
    { id: 'content-bundle', label: 'Content Bundle' },
    { id: 'custom-business', label: 'Custom Business' },
  ];

  const filteredServices = services.filter((srv) => {
    if (!srv.isActive) return false;
    if (selectedCategory === 'all') return true;
    return srv.category === selectedCategory;
  });

  return (
    <section id="layanan" className="py-24 bg-[#0b0c10] border-t border-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ccff00] mb-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
              <span>Katalog Layanan Kreatif</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Kategori Layanan Editing & Desain
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-xl">
              Pilih spesifikasi layanan yang tepat untuk kebutuhan produksi konten Anda. Harga transparan dengan batasan revisi jelas.
            </p>
          </div>
        </div>

        {/* Category Tabs (Segmented Button Controls) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-md shadow-white/10 scale-[1.02]'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid with kinetic card hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="relative p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 hover:border-[#ccff00]/40 hover:bg-neutral-900/70 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#ccff00]/5 overflow-hidden"
            >
              {/* Subtle top neon accent line on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                <div className="flex items-center justify-between mb-3 text-xs text-neutral-500 font-mono">
                  <span>
                    {service.category === 'video-editing'
                      ? 'VIDEO EDITING'
                      : service.category === 'social-media-design'
                      ? 'GRAPHIC DESIGN'
                      : service.category === 'poster-banner'
                      ? 'POSTER & BANNER'
                      : service.category === 'content-bundle'
                      ? 'BUNDLE PACKAGE'
                      : 'CUSTOM BUSINESS'}
                  </span>
                  {service.popular && (
                    <span className="text-[#ccff00] font-semibold flex items-center gap-1 px-2 py-0.5 rounded bg-[#ccff00]/10 border border-[#ccff00]/20 animate-pulse">
                      <Sparkles className="w-3 h-3" /> POPULER
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#ccff00] transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Deliverables checklist */}
                <div className="space-y-2 mb-6">
                  {service.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                      <Check className="w-3.5 h-3.5 text-[#ccff00] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {/* Meta details: estimated days & revision limit */}
                <div className="pt-4 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs text-neutral-400 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{service.estimatedDays} Hari Kerja</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Maks. {service.revisionLimit}x Revisi</span>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs text-neutral-500">Mulai dari</div>
                    <div className="text-lg font-bold text-white font-mono tabular-nums">
                      {service.basePrice > 0 ? formatCurrencyIDR(service.basePrice) : 'Berdasarkan Brief'}
                    </div>
                    <div className="text-[11px] text-neutral-500">{service.unit}</div>
                  </div>

                  <button
                    onClick={() => onSelectService(service)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] rounded-xl transition-all duration-200 active:scale-95 whitespace-nowrap shadow-md shadow-[#ccff00]/10 hover:shadow-[#ccff00]/25 group-hover:scale-[1.03]"
                  >
                    <span>Pesan Layanan</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
