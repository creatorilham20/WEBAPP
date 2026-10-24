import React, { useState } from 'react';
import { PortfolioItem } from '../../types';
import { PORTFOLIO_ITEMS } from '../../data/studioData';
import { Play, X, ExternalLink, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface PortfolioSectionProps {
  onOrderStyle: (title: string) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  onOrderStyle,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filters = [
    { id: 'all', label: 'Semua Karya' },
    { id: 'video-editing', label: 'Video Editing' },
    { id: 'social-media-design', label: 'Social Media' },
    { id: 'poster-banner', label: 'Poster & Banner' },
    { id: 'content-bundle', label: 'Content Bundle' },
  ];

  const filteredItems = PORTFOLIO_ITEMS.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  return (
    <section id="portofolio" className="py-24 bg-[#090a0d] border-t border-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ccff00] mb-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
              <span>Karya Pilihan Studio</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Portofolio Editing & Desain
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-xl">
              Eksplorasi proyek nyata yang telah kami produksi untuk kreator, UMKM, dan personal brand.
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 ${
                activeFilter === f.id
                  ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-md shadow-white/10 scale-[1.02]'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Portfolio Masonry / Bento Grid with kinetic hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="cursor-pointer group rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-[#ccff00]/40 transition-all duration-300 flex flex-col hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/60"
            >
              {/* Media Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

                {item.videoUrl && (
                  <div className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-[#ccff00] border border-[#ccff00]/30 shadow-lg group-hover:scale-110 group-hover:bg-[#ccff00] group-hover:text-[#0b0c10] transition-all duration-300">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4">
                  {/* Clean unboxed metadata with separators */}
                  <div className="flex items-center gap-2 text-xs text-neutral-300 mb-1 font-mono">
                    <span className="text-[#ccff00]">{item.categoryLabel}</span>
                    <span>·</span>
                    <span>{item.clientType}</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ccff00] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="p-4 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span className="truncate max-w-[200px]">{item.client}</span>
                <span className="text-[#ccff00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Detail <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#0e1017] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#12141c]">
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span>PORTOFOLIO DETAIL</span>
                <span>·</span>
                <span className="text-[#ccff00]">{selectedItem.categoryLabel}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Media preview */}
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 aspect-video bg-black">
                <img
                  src={selectedItem.thumbnail}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
                {selectedItem.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <a
                      href={selectedItem.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ccff00] text-[#0b0c10] font-bold text-xs shadow-lg hover:bg-[#b8e600] hover:scale-105 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                      <span>Tonton Video Penuh di YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {selectedItem.title}
                </h3>
                {/* Unboxed metadata */}
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mb-4">
                  <span>Klien: {selectedItem.client}</span>
                  <span>·</span>
                  <span>Tipe: {selectedItem.clientType}</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {/* Goal & Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div>
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 font-mono">
                    Tujuan Proyek
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-200">
                    {selectedItem.goal}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 font-mono">
                    Hasil & Metrik
                  </div>
                  <p className="text-xs sm:text-sm text-[#ccff00] font-mono">
                    {selectedItem.metrics || 'Aset siap komersial'}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
                  Aset yang Dikerjakan (Deliverables)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedItem.deliverables.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ccff00] shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-800 bg-[#12141c] flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-mono">
                Tertarik dengan gaya editing ini?
              </span>
              <button
                onClick={() => {
                  const styleTitle = selectedItem.title;
                  setSelectedItem(null);
                  onOrderStyle(styleTitle);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] rounded-xl transition-transform active:scale-95"
              >
                <span>Pesan Gaya Editing Ini</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
