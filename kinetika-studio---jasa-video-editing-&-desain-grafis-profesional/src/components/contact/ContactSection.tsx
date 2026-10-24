import React, { useState } from 'react';
import { StudioSettings } from '../../types';
import { FAQS } from '../../data/studioData';
import {
  MessageSquare,
  Mail,
  Clock,
  ChevronDown,
  ArrowUpRight,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface ContactSectionProps {
  settings: StudioSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section id="kontak" className="py-24 bg-[#090a0d] border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Direct Studio Contact */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#ccff00] mb-2">
                Hubungi Studio
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Konsultasikan Proyek Kreatif Anda
              </h2>
              <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
                Punya pertanyaan sebelum memesan? Ingin mendiskusikan konsep video khusus atau paket retainer bulanan? Tim kami siap berdiskusi langsung.
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-4">
              <a
                href={`https://api.whatsapp.com/send?phone=${settings.whatsapp}&text=${encodeURIComponent(
                  'Halo Kinetika Studio, saya ingin bertanya tentang layanan editing dan desain.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-[#25D366] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 font-mono">WHATSAPP OFFICIAL</div>
                    <div className="text-sm font-bold text-white group-hover:text-[#25D366] transition-colors">
                      +{settings.whatsapp}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-[#25D366] transition-colors" />
              </a>

              <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-mono">EMAIL BISNIS</div>
                  <div className="text-sm font-bold text-white font-mono">{settings.email}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-mono">JAM LAYANAN & ZONA WAKTU</div>
                  <div className="text-sm font-bold text-white">{settings.operationalHours}</div>
                  <div className="text-xs text-neutral-500">{settings.timezone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-7">
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <HelpCircle className="w-4 h-4 text-[#ccff00]" />
              <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-neutral-900/60 transition-colors"
                    >
                      <span className="text-sm font-bold text-white">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-[#ccff00]' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-neutral-800/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
