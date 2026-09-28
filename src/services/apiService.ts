import { Category, Brand, Product, User, StoreSettings, Tag } from '../types';

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/tienda')) {
    return '/tienda/api';
  }
  return '/api';
}

const API_BASE = getApiBase();

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data;
}

export interface SlimHealthResponse {
  status: string;
  framework: string;
  php_version: string;
  database: {
    driver: string;
    status: string;
    counts: Record<string, number>;
  };
  server_time: string;
  endpoints: Record<string, unknown>;
}

export const apiService = {
  // Health
  async getHealth(): Promise<SlimHealthResponse> {
    return fetchJson<SlimHealthResponse>(`${API_BASE}/health`);
  },

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await fetchJson<{ success: boolean; data: StoreSettings }>(`${API_BASE}/settings`);
    return res.data;
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetchJson<{ success: boolean; data: StoreSettings }>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return res.data;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetchJson<{ success: boolean; data: Category[] }>(`${API_BASE}/categories`);
    return res.data;
  },

  async createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const res = await fetchJson<{ success: boolean; data: Category }>(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return res.data;
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const res = await fetchJson<{ success: boolean; data: Category }>(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    return res.data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean; deletedId: string; message: string }> {
    return fetchJson<{ success: boolean; deletedId: string; message: string }>(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    const res = await fetchJson<{ success: boolean; data: Brand[] }>(`${API_BASE}/brands`);
    return res.data;
  },

  async createBrand(brand: Omit<Brand, 'id'> & { id?: string }): Promise<Brand> {
    const res = await fetchJson<{ success: boolean; data: Brand }>(`${API_BASE}/brands`, {
      method: 'POST',
      body: JSON.stringify(brand),
    });
    return res.data;
  },

  async updateBrand(id: string, brand: Partial<Brand>): Promise<Brand> {
    const res = await fetchJson<{ success: boolean; data: Brand }>(`${API_BASE}/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brand),
    });
    return res.data;
  },

  async deleteBrand(id: string): Promise<{ success: boolean; deletedId: string }> {
    return fetchJson<{ success: boolean; deletedId: string }>(`${API_BASE}/brands/${id}`, {
      method: 'DELETE',
    });
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetchJson<{ success: boolean; data: Product[] }>(`${API_BASE}/products`);
    return res.data;
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Product> {
    const res = await fetchJson<{ success: boolean; data: Product }>(`${API_BASE}/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return res.data;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetchJson<{ success: boolean; data: Product }>(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return res.data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean; deletedId: string }> {
    return fetchJson<{ success: boolean; deletedId: string }>(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetchJson<{ success: boolean; data: User[] }>(`${API_BASE}/users`);
    return res.data;
  },

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const res = await fetchJson<{ success: boolean; data: User }>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return res.data;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const res = await fetchJson<{ success: boolean; data: User }>(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
    return res.data;
  },

  async deleteUser(id: string): Promise<{ success: boolean; deletedId: string }> {
    return fetchJson<{ success: boolean; deletedId: string }>(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    const res = await fetchJson<{ success: boolean; data: Tag[] }>(`${API_BASE}/tags`);
    return res.data;
  },
};
