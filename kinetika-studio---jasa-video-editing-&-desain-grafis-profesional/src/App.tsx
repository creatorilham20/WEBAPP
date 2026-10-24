/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/home/Hero';
import { Workflow } from './components/home/Workflow';
import { WhyChooseUs } from './components/home/WhyChooseUs';
import { ServicesSection } from './components/services/ServicesSection';
import { PortfolioSection } from './components/portfolio/PortfolioSection';
import { PricingSection } from './components/pricing/PricingSection';
import { ContactSection } from './components/contact/ContactSection';
import { Footer } from './components/layout/Footer';
import { OrderWizardModal } from './components/order/OrderWizardModal';
import { OrderTrackerModal } from './components/order/OrderTrackerModal';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';
import { LegalModal } from './components/legal/LegalModal';

import { StorageService } from './services/storageService';
import { Order, PricingPackage, ServiceItem, StudioSettings } from './types';
import { MessageSquare, ArrowUp, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<StudioSettings>(() => StorageService.getSettings());
  const [packages, setPackages] = useState<PricingPackage[]>(() => StorageService.getPackages());
  const [services, setServices] = useState<ServiceItem[]>(() => StorageService.getServices());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [selectedVisualReference, setSelectedVisualReference] = useState<string | undefined>(undefined);

  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Listen to order updates (including QRIS payment confirmations)
  useEffect(() => {
    const handleOrderUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        setOrders((prev) =>
          prev.map((o) => (o.order_id === updated.order_id ? updated : o))
        );
        if (updated.payment_status === 'PAID') {
          showToast(`Pembayaran QRIS ${updated.order_id} Berhasil Diverifikasi!`);
        }
      }
    };
    window.addEventListener('kinetika_order_updated', handleOrderUpdate);
    return () => window.removeEventListener('kinetika_order_updated', handleOrderUpdate);
  }, []);

  const handleOpenOrderWithPackage = (pkgId?: string) => {
    setSelectedPackageId(pkgId);
    setSelectedVisualReference(undefined);
    setIsOrderModalOpen(true);
  };

  const handleSelectServiceFromCatalog = (service: ServiceItem) => {
    // Find matching package or fallback
    const matchedPkg = packages.find((p) => p.category === service.category) || packages[0];
    setSelectedPackageId(matchedPkg.id);
    setSelectedVisualReference(service.name);
    setIsOrderModalOpen(true);
  };

  const handleOrderStyleFromPortfolio = (styleTitle: string) => {
    setSelectedPackageId(packages[0]?.id);
    setSelectedVisualReference(`Gaya Referensi Portofolio: ${styleTitle}`);
    setIsOrderModalOpen(true);
  };

  const handleOrderCompleted = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Pesanan ${newOrder.order_id} berhasil dibuat!`);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-neutral-100 flex flex-col selection:bg-[#ccff00] selection:text-[#0b0c10]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 p-4 rounded-xl bg-neutral-900 border border-[#ccff00] text-white text-xs shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        settings={settings}
        onOpenOrderModal={() => handleOpenOrderWithPackage()}
        onOpenTrackerModal={() => setIsTrackerModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onOpenOrderModal={() => handleOpenOrderWithPackage()}
          onExplorePortfolio={() => {
            const el = document.getElementById('portofolio');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Workflow 4-Step Process */}
        <Workflow />

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Services Section */}
        <ServicesSection
          services={services}
          onSelectService={handleSelectServiceFromCatalog}
        />

        {/* Portfolio Showcase */}
        <PortfolioSection
          onOrderStyle={handleOrderStyleFromPortfolio}
        />

        {/* Pricing Packages */}
        <PricingSection
          packages={packages}
          onSelectPackage={(pkg) => handleOpenOrderWithPackage(pkg.id)}
        />

        {/* Contact & FAQ Section */}
        <ContactSection settings={settings} />
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenLegal={(type) => setLegalModalType(type)}
        onOpenOrderModal={() => handleOpenOrderWithPackage()}
      />

      {/* Floating WhatsApp Quick Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <a
          href={`https://api.whatsapp.com/send?phone=${settings.whatsapp}&text=${encodeURIComponent(
            'Halo Kinetika Studio, saya ingin konsultasi mengenai jasa video editing atau desain.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white font-bold text-xs shadow-xl hover:scale-105 active:scale-95 transition-transform"
          title="Chat WhatsApp CS Studio"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Tanya Studio via WA</span>
        </a>
      </div>

      {/* MODALS */}
      {/* 1. Multi-step Order Wizard */}
      <OrderWizardModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        packages={packages}
        services={services}
        settings={settings}
        initialPackageId={selectedPackageId}
        initialVisualReference={selectedVisualReference}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* 2. Order Tracking Modal */}
      <OrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        whatsappNumber={settings.whatsapp}
      />

      {/* 3. Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        orders={orders}
        packages={packages}
        services={services}
        settings={settings}
        onOrdersUpdated={(newOrders) => {
          setOrders(newOrders);
          StorageService.saveOrders(newOrders);
        }}
        onPackagesUpdated={(newPkgs) => {
          setPackages(newPkgs);
          StorageService.savePackages(newPkgs);
        }}
        onSettingsUpdated={(newSet) => {
          setSettings(newSet);
          StorageService.saveSettings(newSet);
        }}
      />

      {/* 4. Legal / Policies Modal */}
      <LegalModal
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
        policyType={legalModalType || 'terms'}
      />
    </div>
  );
}
