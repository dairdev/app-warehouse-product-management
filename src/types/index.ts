export type UserRole = 'admin' | 'staff' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  phone?: string;
  company?: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google';
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  origin?: string;
  logoUrl?: string;
}

export interface MachineryBrand {
  id: string;
  name: string;
  slug: string;
  origin?: string;
  description?: string;
  logoUrl?: string;
}

export type RentalRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface MachineryRentalRequest {
  id: string;
  machineryId: string;
  machineryName: string;
  machineryBrand?: string;
  machineryModel?: string;
  machineryImageUrl?: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  obraLocation: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startHour?: string; // e.g. "08:00"
  endHour?: string; // e.g. "17:00"
  totalHoursOrDays?: string;
  needsOperator: boolean;
  status: RentalRequestStatus;
  notes?: string;
  createdBy: 'client' | 'admin';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  documentType?: 'DNI' | 'RUC' | 'CE';
  documentNumber?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  parentId: string | null;
  sortOrder: number;
  itemCount?: number;
  defaultPresentations?: string[];
}

export interface ProductAttribute {
  id: string;
  key: string;
  value: string;
  unit?: string;
}

export interface ProductMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  sortOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string; // e.g. yellow, blue, emerald, amber, zinc
}

export interface Product {
  id: string;
  name: string; // Concat: Sub Category + Brand + Presentation (editable)
  slug: string;
  description: string;
  categoryId: string;
  subcategoryId?: string | null;
  brandId?: string;
  brandName?: string;
  presentation?: string;
  price?: number | null; // Optional - only shown to management
  currency: 'PEN' | 'USD';
  unit?: string; // e.g. 'bolsa', 'millar', 'm³', 'varilla', 'rollo', 'panel'
  sku?: string; // Optional
  featured?: boolean;
  attributes: ProductAttribute[];
  media: ProductMedia[];
  tags: string[]; // tag slugs
  createdAt: string;
  updatedAt: string;
}

export type MachineryCategory =
  | 'pesada'
  | 'liviana'
  | 'concreto'
  | 'compactacion'
  | 'transporte'
  | 'demolicion_energia';

export interface Machinery {
  id: string;
  name: string;
  slug: string;
  category: MachineryCategory;
  categoryName: string;
  brand: string;
  model: string;
  description: string;
  year?: number;
  powerHp?: string;
  capacity?: string;
  operatingWeight?: string;
  fuelType?: 'Diesel' | 'Gasolina' | 'Eléctrico' | 'Bifásico/Trifásico';
  imageUrl: string;
  galleryImages?: string[];
  // Pricing: for management only!
  hourlyRate?: number | null;
  dailyRate?: number | null;
  monthlyRate?: number | null;
  currency: 'PEN' | 'USD';
  minRentalHours?: number;
  includesOperator?: boolean;
  operatorDetails?: string;
  deliveryConditions?: string;
  status: 'available' | 'rented' | 'maintenance';
  technicalSpecs?: { key: string; value: string }[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  obraProjectName?: string;
  notes?: string;
  taggedProductIds: {
    productId: string;
    tag: string; // e.g. 'favorito', 'por_cotizar', 'cimentacion'
    addedAt: string;
  }[];
}

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface StoreSettings {
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  ruc?: string;
  schedule?: string;
  website?: string;
  logoUrl?: string;
  // Page Headers Configuration
  catalogHeaderBadge?: string;
  catalogHeaderTitle?: string;
  catalogHeaderSubtitle?: string;
  headerTagline?: string;
  profileHeaderTitle?: string;
  profileHeaderSubtitle?: string;
}
