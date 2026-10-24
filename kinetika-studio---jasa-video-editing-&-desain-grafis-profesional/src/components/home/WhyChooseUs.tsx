import React from 'react';
import { Sparkles, Zap, ShieldCheck, Layers, ArrowUpRight } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Pacing Cepat & Optimasi Algoritma',
      description: 'Video diedit dengan pemotongan micro-pause, hook visual 3 detik pertama, dan dinamika audio yang menjaga retensi audiens di atas rata-rata industri.',
      tag: 'RETENSI TINGGI',
    },
    {
      icon: Layers,
      title: 'Desain Grafis Beridentitas Kuat',
      description: 'Bukan sekadar template Canva pasaran. Kami merancang poster, banner, dan carousel dengan arsitektur tipografi dan palet warna yang membedakan brand Anda.',
      tag: 'ORIGINAL DESIGN',
    },
    {
      icon: ShieldCheck,
      title: 'Sistem Terbuka & Order Terlacak',
      description: 'Setiap pesanan memiliki Order ID unik dan terdata rapi. Anda dapat melacak progres pengerjaan, kuota revisi, dan mengunduh hasil final kapan saja.',
      tag: 'REAL-TIME TRACKING',
    },
    {
      icon: Sparkles,
      title: 'Aset Lengkap & Bebas Royalti',
      description: 'Seluruh musik latar, efek suara, dan stok visual berlisensi legal. Anda bebas memonetisasi atau menggunakan aset untuk kebutuhan periklanan tanpa risiko klaim.',
      tag: '100% LEGAL ASSETS',
    },
  ];

  return (
    <section className="py-24 bg-[#0b0c10] relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#ccff00]/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ccff00] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
              <span>Karakter & Standar Studio</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Mengapa Kreator & Bisnis Memilih Kinetika
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              Di tengah maraknya konten seragam yang dihasilkan secara instan, kami fokus pada detail estetika, retensi visual, dan integritas pesan brand Anda.
            </p>
            <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-500 font-mono flex items-center gap-2">
              <span className="text-[#ccff00]">✓</span>
              <span>BERKOMITMEN PADA KUALITAS VISUAL SEJAK HARI PERTAMA</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-[#ccff00] group-hover:bg-[#ccff00] group-hover:text-[#0b0c10] transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider text-neutral-500 group-hover:text-[#ccff00] transition-colors">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
