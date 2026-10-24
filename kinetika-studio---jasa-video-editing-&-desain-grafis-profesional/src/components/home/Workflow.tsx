import React from 'react';
import { WORKFLOW_STEPS } from '../../data/studioData';
import { FileEdit, MessageSquare, Wand2, PackageCheck, ArrowRight } from 'lucide-react';

const ICONS = [FileEdit, MessageSquare, Wand2, PackageCheck];

export const Workflow: React.FC = () => {
  return (
    <section className="py-20 bg-[#090a0d] border-y border-neutral-900 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#ccff00]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ccff00] mb-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
            <span>Alur Produksi Terstandarisasi</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bagaimana Kami Mengeksekusi Proyek Anda
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mt-3">
            Sistem pengerjaan transparan tanpa birokrasi rumit. Dari brief awal hingga delivery aset siap publikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_STEPS.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 hover:border-[#ccff00]/50 hover:bg-neutral-900/70 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#ccff00]/5"
              >
                {/* Subtle top indicator bar on hover */}
                <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono font-bold text-[#ccff00] px-2.5 py-1 rounded bg-[#ccff00]/10 border border-[#ccff00]/20">
                      TAHAP 0{item.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-neutral-800/80 text-neutral-300 group-hover:text-[#0b0c10] group-hover:bg-[#ccff00] transition-all duration-300 group-hover:rotate-6">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#ccff00] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span>SLA: {index === 0 ? 'Hari H' : index === 1 ? '1–2 Hari' : index === 2 ? '24 Jam' : 'Selesai'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#ccff00] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
