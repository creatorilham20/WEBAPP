import React from 'react';
import { ArrowUpRight, Play, Sparkles, CheckCircle2, Zap, Star, Radio } from 'lucide-react';

interface HeroProps {
  onOpenOrderModal: () => void;
  onExplorePortfolio: () => void;
}

const MARQUEE_ITEMS = [
  'CAPCUT',
  'CANVA',
  'COREL',
  'CAPCUT PRO EDITING',
  'CANVA GRAPHIC DESIGN',
  'COREL DRAW VECTOR',
  'TIKTOK & REELS VIRAL CUTS',
  'POSTER, BANNER & FEED',
  '100% HAK CIPTA KLIEN',
  'ESTIMASI 24–48 JAM',
];

export const Hero: React.FC<HeroProps> = ({
  onOpenOrderModal,
  onExplorePortfolio,
}) => {
  return (
    <section id="beranda" className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Background kinetic radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#ccff00]/8 blur-[160px] pointer-events-none rounded-full animate-pulse-glow" />

      {/* Decorative ambient subtle light rings */}
      <div className="absolute -top-24 right-10 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Split-Screen 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Quiet 1-line text kicker with live pulse dot */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
              </span>
              <span>Personal Creative Studio</span>
              <span className="text-neutral-600">·</span>
              <span>Video Editing & Graphic Design</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] text-balance">
              Konten yang Menarik Perhatian.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-[#ccff00]">
                Desain yang Membangun Identitas.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
              Kami mentransformasikan rekaman mentah dan ide kreatif Anda menjadi video bervisi tajam dan desain visual berkualitas tinggi. Dirancang khusus untuk kreator konten, UMKM, personal brand, dan pelaku bisnis modern.
            </p>

            {/* Value Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-neutral-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                <span>Pengerjaan Cepat (1–3 Hari Kerja)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                <span>Format Siap Upload & Hak Cipta 100% Milik Anda</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                <span>Integrasi Brief Google Drive & WhatsApp</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
                <span>Transparansi Harga Mulai Rp35.000</span>
              </div>
            </div>

            {/* Action Buttons with kinetic hover */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={onOpenOrderModal}
                className="group relative flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-[#0b0c10] bg-[#ccff00] hover:bg-[#b8e600] rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-[#ccff00]/20 hover:shadow-[#ccff00]/30 whitespace-nowrap overflow-hidden"
              >
                {/* Shimmer sweep animation overlay */}
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                <span className="relative z-10">Pesan Jasa Sekarang</span>
                <ArrowUpRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={onExplorePortfolio}
                className="group flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-neutral-200 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all whitespace-nowrap"
              >
                <div className="w-6 h-6 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00] group-hover:scale-110 transition-transform">
                  <Play className="w-3 h-3 fill-current" />
                </div>
                <span>Lihat Portofolio</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Anchor with Floating Kinetic Elements */}
          <div className="lg:col-span-5 relative">
            {/* Ambient behind-glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[#ccff00]/20 to-transparent blur-xl opacity-50 group-hover:opacity-80 transition duration-700 pointer-events-none" />

            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl group">
              <img
                src="/src/assets/images/hero_studio_editing_1792827243460.jpg"
                alt="Studio Video Editing Suite Kinetika"
                className="w-full h-[380px] sm:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/30 to-transparent opacity-80" />

              {/* Floating Element 1: Rapid Delivery (Top Left) */}
              <div className="absolute top-4 left-4 z-20 animate-float-slow">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0e1017]/90 border border-neutral-700/80 backdrop-blur-md shadow-xl text-xs">
                  <div className="w-6 h-6 rounded-lg bg-[#ccff00]/20 flex items-center justify-center text-[#ccff00]">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px] leading-tight">24–48 Jam</div>
                    <div className="text-[10px] text-neutral-400">Pengerjaan Draft Kilat</div>
                  </div>
                </div>
              </div>

              {/* Floating Element 2: Rating & Creator Trust (Top Right) */}
              <div className="absolute top-4 right-4 z-20 animate-float-delayed">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e1017]/90 border border-neutral-700/80 backdrop-blur-md shadow-xl text-xs">
                  <Star className="w-3.5 h-3.5 text-[#ccff00] fill-current" />
                  <span className="font-bold text-white text-[11px]">4.9/5</span>
                  <span className="text-[10px] text-neutral-400">· 500+ Video</span>
                </div>
              </div>

              {/* Editorial Overlay Card with Live Soundwave Visualizer */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0e1017]/90 border border-neutral-800 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-300">
                      POST-PRODUCTION SUITE
                    </span>
                  </div>

                  {/* Animated Soundwave Visualizer Bars */}
                  <div className="flex items-end gap-1 h-5 px-2 py-0.5 rounded bg-neutral-950/80 border border-neutral-800" title="Audio Spectrum Master">
                    <div className="w-1 bg-[#ccff00] rounded-full soundwave-bar-1" />
                    <div className="w-1 bg-[#ccff00] rounded-full soundwave-bar-2" />
                    <div className="w-1 bg-[#ccff00] rounded-full soundwave-bar-3" />
                    <div className="w-1 bg-[#ccff00] rounded-full soundwave-bar-4" />
                    <div className="w-1 bg-[#ccff00] rounded-full soundwave-bar-5" />
                  </div>
                </div>

                <p className="text-sm font-semibold text-white">
                  Color Grading 4K · Sound Scaping · Retention Hooks
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
                  <span>CapCut · Canva · Corel</span>
                  <span className="text-[#ccff00]">READY FOR REVISION</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Infinite Marquee Ribbon */}
        <div className="mt-14 sm:mt-16 py-3.5 border-y border-neutral-800/80 bg-neutral-950/60 overflow-hidden relative">
          {/* Subtle gradient fades on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0b0c10] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0b0c10] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center space-x-8 text-xs font-mono tracking-widest text-neutral-400">
            {/* First Set */}
            {MARQUEE_ITEMS.map((item, idx) => (
              <div key={`m1-${idx}`} className="flex items-center space-x-8 shrink-0">
                <span className="hover:text-[#ccff00] transition-colors">{item}</span>
                <span className="text-[#ccff00]/60">✦</span>
              </div>
            ))}
            {/* Duplicated Set for infinite continuous loop */}
            {MARQUEE_ITEMS.map((item, idx) => (
              <div key={`m2-${idx}`} className="flex items-center space-x-8 shrink-0">
                <span className="hover:text-[#ccff00] transition-colors">{item}</span>
                <span className="text-[#ccff00]/60">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full-Width Metrics Strip Below Ribbon */}
        <div className="mt-10 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-700/80 transition-all hover:-translate-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              500+
            </div>
            <div className="text-xs text-neutral-400 mt-1">Video & Reel Diproduksi</div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-700/80 transition-all hover:-translate-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              150+
            </div>
            <div className="text-xs text-neutral-400 mt-1">Desain Visual & Identitas Brand</div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-700/80 transition-all hover:-translate-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#ccff00] font-mono tabular-nums tracking-tight">
              24–48 Jam
            </div>
            <div className="text-xs text-neutral-400 mt-1">Rata-rata Pengerjaan Draft</div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-700/80 transition-all hover:-translate-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              100%
            </div>
            <div className="text-xs text-neutral-400 mt-1">Hak Cipta Milik Klien</div>
          </div>
        </div>
      </div>
    </section>
  );
};
