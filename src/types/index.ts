export type UserRole = 'admin' | 'staff' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  company?: string;
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
  price?: number | null; // Optional
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
