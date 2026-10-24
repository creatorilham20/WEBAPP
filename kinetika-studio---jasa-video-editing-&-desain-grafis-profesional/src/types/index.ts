/**
 * Core Type Definitions for Creative Studio Platform
 */

export type CustomerType =
  | 'Creator'
  | 'UMKM'
  | 'Personal Brand'
  | 'Organization'
  | 'Company'
  | 'Other';

export type ServiceCategory =
  | 'video-editing'
  | 'social-media-design'
  | 'poster-banner'
  | 'content-bundle'
  | 'custom-business';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING_VERIFICATION'
  | 'PARTIAL'
  | 'PAID'
  | 'REFUNDED';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'REVISION'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS' | 'CUSTOM_AGREEMENT';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  basePrice: number; // in IDR
  unit: string; // e.g. "per video", "per item", "per paket"
  estimatedDays: number;
  revisionLimit: number;
  deliverables: string[];
  popular?: boolean;
  isActive: boolean;
}

export interface PricingPackage {
  id: string;
  name: string;
  tagline: string;
  category: ServiceCategory;
  price: number; // in IDR
  priceDisplay: string;
  unit: string;
  estimatedDays: number;
  revisionLimit: number;
  deliverables: string[];
  limitations: string[];
  highlight?: boolean;
  ctaText?: string;
}

export interface Order {
  order_id: string;
  created_at: string;
  customer_name: string;
  whatsapp: string;
  email?: string;
  customer_type: CustomerType;
  service_type: string;
  package_name: string;
  quantity: number;
  brief: string;
  deadline: string;
  file_link: string;
  visual_reference?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  revision_count: number;
  delivery_link: string;
  notes: string;
  payment_method: PaymentMethod;
  is_down_payment?: boolean;
}

export interface CustomerRecord {
  customer_id: string;
  name: string;
  whatsapp: string;
  email?: string;
  business_name?: string;
  customer_type: CustomerType;
  created_at: string;
  notes?: string;
}

export interface PaymentRecord {
  payment_id: string;
  order_id: string;
  payment_date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  proof_link?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_at?: string;
  notes?: string;
}

export interface StudioSettings {
  brandName: string;
  tagline: string;
  whatsapp: string;
  email: string;
  operationalHours: string;
  timezone: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  qrisDetails: {
    title: string;
    description: string;
    imageUrl?: string;
    merchantName?: string;
    nmid?: string;
  };
  googleAppsScriptUrl: string;
  isGoogleSheetsActive: boolean;
  adminPasscode: string;
  allowDownPayment: boolean;
  downPaymentPercentage: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: ServiceCategory;
  categoryLabel: string;
  client: string;
  clientType: CustomerType;
  description: string;
  goal: string;
  deliverables: string[];
  thumbnail: string;
  videoUrl?: string; // e.g. YouTube or direct mp4
  featured?: boolean;
  metrics?: string;
}
