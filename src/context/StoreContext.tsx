import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  Tag,
  User,
  ClientProfile,
  ProductAttribute,
  ProductMedia,
  Brand,
  StoreSettings,
  Machinery,
  MachineryBrand,
  MachineryRentalRequest,
  RentalRequestStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_TAGS,
  INITIAL_USERS,
  INITIAL_BRANDS,
  INITIAL_MACHINERY,
  INITIAL_MACHINERY_BRANDS,
  INITIAL_RENTAL_REQUESTS,
} from '../data/initialData';
import { STORE_INFO } from '../utils/shareUtils';
import { apiService, SlimHealthResponse } from '../services/apiService';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StoreContextType {
  // State
  products: Product[];
  categories: Category[];
  brands: Brand[];
  tags: Tag[];
  users: User[];
  currentUser: User | null;
  clientProfile: ClientProfile;
  storeSettings: StoreSettings;
  toasts: ToastMessage[];

  // Backend Status (Slim PHP)
  backendStatus: 'online' | 'connecting' | 'offline';
  backendInfo: SlimHealthResponse | null;
  reloadFromApi: () => Promise<void>;

  // Auth & Roles
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'guest' | 'admin' | 'staff' | 'client') => void;
  isAdmin: () => boolean;
  registerClient: (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    company?: string;
    authProvider?: 'email' | 'google';
  }) => Promise<boolean>;
  loginWithGoogle: (googleUser?: {
    name: string;
    email: string;
    avatarUrl?: string;
  }) => Promise<boolean>;

  // Store Settings (Admin only)
  updateStoreSettings: (settings: Partial<StoreSettings>) => boolean;

  // Products CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => boolean;
  deleteProduct: (id: string) => boolean;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;

  // Machinery Renting Module
  machineries: Machinery[];
  addMachinery: (machinery: Omit<Machinery, 'id' | 'createdAt' | 'updatedAt'>) => Machinery;
  updateMachinery: (id: string, data: Partial<Machinery>) => boolean;
  deleteMachinery: (id: string) => boolean;
  getMachineryById: (id: string) => Machinery | undefined;

  // Machinery Brands CRUD
  machineryBrands: MachineryBrand[];
  addMachineryBrand: (brand: Omit<MachineryBrand, 'id'>) => MachineryBrand;
  updateMachineryBrand: (id: string, data: Partial<MachineryBrand>) => boolean;
  deleteMachineryBrand: (id: string) => boolean;

  // Machinery Rental Requests (Application Management)
  rentalRequests: MachineryRentalRequest[];
  addRentalRequest: (
    req: Omit<MachineryRentalRequest, 'id' | 'createdAt' | 'status'> & { status?: RentalRequestStatus }
  ) => MachineryRentalRequest;
  updateRentalRequestStatus: (
    id: string,
    status: RentalRequestStatus,
    approvedBy?: string
  ) => boolean;
  updateRentalRequest: (id: string, data: Partial<MachineryRentalRequest>) => boolean;
  deleteRentalRequest: (id: string) => boolean;

  // Brands CRUD
  addBrand: (brand: Omit<Brand, 'id'>) => Brand;
  updateBrand: (id: string, data: Partial<Brand>) => boolean;
  deleteBrand: (id: string) => boolean;

  // Categories CRUD
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => boolean;
  deleteCategory: (id: string) => boolean;
  getParentCategories: () => Category[];
  getSubcategories: (parentId: string) => Category[];

  // Users & Profiles (Restricted to Admin Profile)
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
  updateUser: (id: string, data: Partial<User>) => boolean;
  deleteUser: (id: string) => boolean;

  // Client Profile & Tagging
  updateClientProfile: (profile: Partial<ClientProfile>) => void;
  tagProduct: (productId: string, tagSlug: string) => void;
  untagProduct: (productId: string, tagSlug: string) => void;
  isProductTaggedByClient: (productId: string, tagSlug?: string) => boolean;
  getClientTaggedProducts: (tagSlug?: string) => Product[];

  // Notifications
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;

  // Reset demo data
  resetAllData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'almacenes_products_v2',
  CATEGORIES: 'almacenes_categories_v2',
  BRANDS: 'almacenes_brands_v2',
  TAGS: 'almacenes_tags_v2',
  USERS: 'almacenes_users_v2',
  AUTH: 'almacenes_auth_user_v2',
  CLIENT_PROFILE: 'almacenes_client_profile_v2',
  SETTINGS: 'almacenes_store_settings_v2',
  MACHINERY: 'almacenes_machinery_v2',
  MACHINERY_BRANDS: 'almacenes_machinery_brands_v2',
  RENTAL_REQUESTS: 'almacenes_rental_requests_v2',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store Settings (Ferretería details: address, phone, email, etc.)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : STORE_INFO;
    } catch {
      return STORE_INFO;
    }
  });

  // Machinery State
  const [machineries, setMachineries] = useState<Machinery[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MACHINERY);
      return saved ? JSON.parse(saved) : INITIAL_MACHINERY;
    } catch {
      return INITIAL_MACHINERY;
    }
  });

  // Machinery Brands State
  const [machineryBrands, setMachineryBrands] = useState<MachineryBrand[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MACHINERY_BRANDS);
      return saved ? JSON.parse(saved) : INITIAL_MACHINERY_BRANDS;
    } catch {
      return INITIAL_MACHINERY_BRANDS;
    }
  });

  // Machinery Rental Requests State
  const [rentalRequests, setRentalRequests] = useState<MachineryRentalRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RENTAL_REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_RENTAL_REQUESTS;
    } catch {
      return INITIAL_RENTAL_REQUESTS;
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Brands
  const [brands, setBrands] = useState<Brand[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANDS);
      return saved ? JSON.parse(saved) : INITIAL_BRANDS;
    } catch {
      return INITIAL_BRANDS;
    }
  });

  // Tags
  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  });

  // Users
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Backend state
  const [backendStatus, setBackendStatus] = useState<'online' | 'connecting' | 'offline'>('connecting');
  const [backendInfo, setBackendInfo] = useState<SlimHealthResponse | null>(null);

  // Current logged in user (null = Guest / Public client)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Lightweight Client Profile
  const [clientProfile, setClientProfile] = useState<ClientProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: 'client-local-1',
      name: 'Cliente Constructor',
      email: 'cliente@ejemplo.com',
      phone: '+51 987 000 111',
      obraProjectName: 'Residencial Los Olivos (Fase 1)',
      notes: 'Solicitar cotización de cemento y fierro con flete a obra',
      taggedProductIds: [
        { productId: 'prod-cemento-sol-tipo1', tag: 'favorito', addedAt: new Date().toISOString() },
        { productId: 'prod-ladrillo-king-kong-18', tag: 'por-cotizar', addedAt: new Date().toISOString() },
        { productId: 'prod-acero-corrugado-media', tag: 'cimentacion', addedAt: new Date().toISOString() },
      ],
    };
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_PROFILE, JSON.stringify(clientProfile));
  }, [clientProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MACHINERY, JSON.stringify(machineries));
  }, [machineries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MACHINERY_BRANDS, JSON.stringify(machineryBrands));
  }, [machineryBrands]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RENTAL_REQUESTS, JSON.stringify(rentalRequests));
  }, [rentalRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));

    // Dynamic favicon: update with custom store logo if available, otherwise keep default logo favicon
    const faviconElement = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (faviconElement) {
      if (storeSettings.logoUrl && storeSettings.logoUrl.trim()) {
        faviconElement.href = storeSettings.logoUrl.trim();
      } else {
        faviconElement.href = './favicon.svg';
      }
    }
  }, [storeSettings]);

  // Load from Slim PHP REST API on mount
  const reloadFromApi = useCallback(async () => {
    try {
      setBackendStatus('connecting');
      const health = await apiService.getHealth();
      setBackendInfo(health);
      setBackendStatus('online');

      const [settRes, catRes, brandRes, prodRes, userRes, tagRes] = await Promise.allSettled([
        apiService.getSettings(),
        apiService.getCategories(),
        apiService.getBrands(),
        apiService.getProducts(),
        apiService.getUsers(),
        apiService.getTags(),
      ]);

      if (settRes.status === 'fulfilled' && settRes.value) {
        setStoreSettings((prev) => ({ ...prev, ...settRes.value }));
      }
      if (catRes.status === 'fulfilled' && catRes.value?.length) {
        setCategories(catRes.value);
      }
      if (brandRes.status === 'fulfilled' && brandRes.value?.length) {
        setBrands(brandRes.value);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value?.length) {
        setProducts(prodRes.value);
      }
      if (userRes.status === 'fulfilled' && userRes.value?.length) {
        setUsers(userRes.value);
      }
      if (tagRes.status === 'fulfilled' && tagRes.value?.length) {
        setTags(tagRes.value);
      }
    } catch (err) {
      console.warn('[StoreContext] Could not connect to Slim PHP backend, using local cache:', err);
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    reloadFromApi();
  }, [reloadFromApi]);

  // Notifications
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth handlers
  const isAdmin = (): boolean => {
    return currentUser?.role === 'admin';
  };

  // Store Settings (Admin profile only)
  const updateStoreSettings = (newSettings: Partial<StoreSettings>): boolean => {
    if (!isAdmin()) {
      showToast('Acceso restringido: Solo el Administrador puede modificar los datos de la ferretería', 'error');
      return false;
    }
    setStoreSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
    // Sync with Slim PHP backend
    apiService.updateSettings(newSettings).catch((err) => {
      console.warn('[API] Error syncing settings with Slim PHP:', err.message);
    });
    showToast('Datos de la ferretería actualizados y sincronizados con el servidor');
    return true;
  };

  const login = async (email: string, _password?: string): Promise<boolean> => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      showToast(`Bienvenido(a), ${found.name} (${found.role === 'admin' ? 'Administrador' : 'Personal'})`);
      return true;
    }
    // Fallback default admin
    if (email.toLowerCase().includes('admin')) {
      const adminUser = users[0];
      setCurrentUser(adminUser);
      showToast(`Bienvenido al Panel de Administración`);
      return true;
    }
    showToast('Credenciales incorrectas. Pruebe admin@ferreteria.test', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente. Ahora navegas como cliente.');
    window.location.hash = '';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  const switchRole = (role: 'guest' | 'admin' | 'staff' | 'client') => {
    if (role === 'guest') {
      setCurrentUser(null);
      showToast('Navegando como Cliente / Modo Público (Sin Login)');
    } else if (role === 'admin') {
      const admin = users.find((u) => u.role === 'admin') || users[0];
      setCurrentUser(admin);
      showToast('Conectado como Administrador');
    } else if (role === 'staff') {
      const staff = users.find((u) => u.role === 'staff') || users[1];
      setCurrentUser(staff);
      showToast('Conectado como Personal / Staff');
    } else if (role === 'client') {
      const client = users.find((u) => u.role === 'client') || users[2];
      setCurrentUser(client);
      showToast(`Conectado como Cliente: ${client.name}`);
    }
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const id = 'prod-' + Date.now().toString(36);
    // Automatically guarantee subcategoryId is set to Generic if missing
    const genSubcat = categories.find((c) => c.parentId === productData.categoryId && c.name.toLowerCase() === 'generic');
    const assignedSubcatId = productData.subcategoryId || (genSubcat ? genSubcat.id : `sub-${productData.categoryId}-generic`);

    const newProduct: Product = {
      ...productData,
      subcategoryId: assignedSubcatId,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    // Persist to Slim PHP
    apiService.createProduct(newProduct).catch((err) => {
      console.warn('[API] Error creating product on Slim PHP:', err.message);
    });
    showToast(`Producto "${newProduct.name}" registrado con éxito`);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>): boolean => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const targetCatId = productData.categoryId || item.categoryId;
        const genSubcat = categories.find((c) => c.parentId === targetCatId && c.name.toLowerCase() === 'generic');
        const assignedSubcatId = productData.subcategoryId !== undefined
          ? productData.subcategoryId
          : (genSubcat ? genSubcat.id : item.subcategoryId);

        return {
          ...item,
          ...productData,
          subcategoryId: assignedSubcatId,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    // Persist to Slim PHP
    apiService.updateProduct(id, productData).catch((err) => {
      console.warn('[API] Error updating product on Slim PHP:', err.message);
    });
    showToast('Producto actualizado correctamente');
    return true;
  };

  const deleteProduct = (id: string): boolean => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    // Persist to Slim PHP
    apiService.deleteProduct(id).catch((err) => {
      console.warn('[API] Error deleting product on Slim PHP:', err.message);
    });
    showToast('Producto eliminado del catálogo', 'info');
    return true;
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getProductBySlug = (slug: string) => {
    return products.find((p) => p.slug === slug);
  };

  // Machinery CRUD
  const addMachinery = (machineryData: Omit<Machinery, 'id' | 'createdAt' | 'updatedAt'>): Machinery => {
    const id = 'mach-' + Date.now().toString(36);
    const newMach: Machinery = {
      ...machineryData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMachineries((prev) => [newMach, ...prev]);
    showToast(`Maquinaria "${newMach.name}" agregada al catálogo de alquiler`);
    return newMach;
  };

  const updateMachinery = (id: string, data: Partial<Machinery>): boolean => {
    setMachineries((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m))
    );
    showToast('Ficha de maquinaria actualizada correctamente');
    return true;
  };

  const deleteMachinery = (id: string): boolean => {
    setMachineries((prev) => prev.filter((m) => m.id !== id));
    showToast('Maquinaria retirada del módulo de alquiler', 'info');
    return true;
  };

  const getMachineryById = (id: string) => {
    return machineries.find((m) => m.id === id);
  };

  // Machinery Brands CRUD
  const addMachineryBrand = (brandData: Omit<MachineryBrand, 'id'>): MachineryBrand => {
    const id = 'mbrand-' + Date.now().toString(36);
    const newBrand: MachineryBrand = {
      ...brandData,
      id,
    };
    setMachineryBrands((prev) => [...prev, newBrand]);
    showToast(`Marca de maquinaria "${newBrand.name}" registrada con éxito`);
    return newBrand;
  };

  const updateMachineryBrand = (id: string, data: Partial<MachineryBrand>): boolean => {
    setMachineryBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
    showToast('Marca de maquinaria actualizada');
    return true;
  };

  const deleteMachineryBrand = (id: string): boolean => {
    const target = machineryBrands.find((b) => b.id === id);
    const inUse = machineries.some(
      (m) => m.brand.toLowerCase() === (target?.name || '').toLowerCase()
    );
    if (inUse) {
      showToast('No se puede eliminar la marca porque hay maquinaria asignada a ella', 'error');
      return false;
    }
    setMachineryBrands((prev) => prev.filter((b) => b.id !== id));
    showToast('Marca de maquinaria eliminada', 'info');
    return true;
  };

  // Machinery Rental Requests (Application Management)
  const addRentalRequest = (
    reqData: Omit<MachineryRentalRequest, 'id' | 'createdAt' | 'status'> & { status?: RentalRequestStatus }
  ): MachineryRentalRequest => {
    const id = 'rent-req-' + Date.now().toString(36);
    const newReq: MachineryRentalRequest = {
      ...reqData,
      id,
      status: reqData.status || 'pending',
      createdAt: new Date().toISOString(),
    };
    setRentalRequests((prev) => [newReq, ...prev]);
    showToast(`Solicitud de alquiler registrada para ${newReq.machineryName}`, 'success');
    return newReq;
  };

  const updateRentalRequestStatus = (
    id: string,
    status: RentalRequestStatus,
    approvedBy?: string
  ): boolean => {
    setRentalRequests((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;
        const isApproved = status === 'approved';
        return {
          ...req,
          status,
          approvedBy: isApproved ? (approvedBy || currentUser?.name || 'Administrador') : req.approvedBy,
          approvedAt: isApproved ? new Date().toISOString() : req.approvedAt,
        };
      })
    );
    const msg =
      status === 'approved'
        ? 'Solicitud aprobada con éxito'
        : status === 'rejected'
        ? 'Solicitud rechazada'
        : status === 'completed'
        ? 'Solicitud marcada como completada'
        : 'Estado de solicitud actualizado';
    showToast(msg, status === 'rejected' ? 'info' : 'success');
    return true;
  };

  const updateRentalRequest = (id: string, data: Partial<MachineryRentalRequest>): boolean => {
    setRentalRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...data } : req))
    );
    showToast('Solicitud de alquiler actualizada');
    return true;
  };

  const deleteRentalRequest = (id: string): boolean => {
    setRentalRequests((prev) => prev.filter((req) => req.id !== id));
    showToast('Solicitud de alquiler eliminada', 'info');
    return true;
  };

  // Client Registration & Google Auth
  const registerClient = async (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    company?: string;
    authProvider?: 'email' | 'google';
  }): Promise<boolean> => {
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      showToast('Ya existe una cuenta con este correo. Inicia sesión directamente.', 'error');
      return false;
    }
    const id = 'user-client-' + Date.now().toString(36);
    const newUser: User = {
      id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || 'Cliente123!',
      phone: data.phone?.trim() || '',
      company: data.company?.trim() || '',
      role: 'client',
      authProvider: data.authProvider || 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    showToast(`¡Bienvenido(a), ${newUser.name}! Tu cuenta de cliente ha sido creada.`, 'success');
    return true;
  };

  const loginWithGoogle = async (googleUser?: {
    name: string;
    email: string;
    avatarUrl?: string;
  }): Promise<boolean> => {
    const email = (googleUser?.email || 'cliente.google@gmail.com').toLowerCase();
    const name = googleUser?.name || 'Usuario Google';
    const avatarUrl = googleUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    let found = users.find((u) => u.email.toLowerCase() === email);
    if (!found) {
      const id = 'user-google-' + Date.now().toString(36);
      found = {
        id,
        name,
        email,
        role: 'client',
        avatarUrl,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, found!]);
    }
    setCurrentUser(found);
    showToast(`Sesión iniciada con Google (${found.name})`, 'success');
    return true;
  };

  // Brands CRUD
  const addBrand = (brandData: Omit<Brand, 'id'>): Brand => {
    const id = 'brand-' + Date.now().toString(36);
    const newBrand: Brand = {
      ...brandData,
      id,
    };
    setBrands((prev) => [...prev, newBrand]);
    // Persist to Slim PHP
    apiService.createBrand(newBrand).catch((err) => {
      console.warn('[API] Error creating brand on Slim PHP:', err.message);
    });
    showToast(`Marca "${newBrand.name}" agregada con éxito`);
    return newBrand;
  };

  const updateBrand = (id: string, data: Partial<Brand>): boolean => {
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
    // Persist to Slim PHP
    apiService.updateBrand(id, data).catch((err) => {
      console.warn('[API] Error updating brand on Slim PHP:', err.message);
    });
    showToast('Marca actualizada');
    return true;
  };

  const deleteBrand = (id: string): boolean => {
    const hasProducts = products.some((p) => p.brandId === id);
    if (hasProducts) {
      showToast('No se puede eliminar la marca porque hay productos asignados a ella', 'error');
      return false;
    }
    setBrands((prev) => prev.filter((b) => b.id !== id));
    // Persist to Slim PHP
    apiService.deleteBrand(id).catch((err) => {
      console.warn('[API] Error deleting brand on Slim PHP:', err.message);
    });
    showToast('Marca eliminada', 'info');
    return true;
  };

  // Categories CRUD
  const addCategory = (categoryData: Omit<Category, 'id'>): Category => {
    const id = 'cat-' + Date.now().toString(36);
    const newCat: Category = {
      ...categoryData,
      id,
    };
    setCategories((prev) => [...prev, newCat]);
    // Persist to Slim PHP
    apiService.createCategory(newCat).catch((err) => {
      console.warn('[API] Error creating category on Slim PHP:', err.message);
    });
    showToast(`Categoría "${newCat.name}" agregada con éxito`);
    return newCat;
  };

  const updateCategory = (id: string, data: Partial<Category>): boolean => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))
    );
    // Persist to Slim PHP
    apiService.updateCategory(id, data).catch((err) => {
      console.warn('[API] Error updating category on Slim PHP:', err.message);
    });
    showToast('Categoría actualizada');
    return true;
  };

  const deleteCategory = (id: string): boolean => {
    // Check if products exist in category
    const hasProducts = products.some((p) => p.categoryId === id || p.subcategoryId === id);
    if (hasProducts) {
      showToast('No se puede eliminar la categoría porque contiene productos asignados', 'error');
      return false;
    }
    setCategories((prev) => prev.filter((cat) => cat.id !== id && cat.parentId !== id));
    // Persist to Slim PHP
    apiService.deleteCategory(id).catch((err) => {
      console.warn('[API] Error deleting category on Slim PHP:', err.message);
    });
    showToast('Categoría eliminada', 'info');
    return true;
  };

  const getParentCategories = () => {
    return categories.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getSubcategories = (parentId: string) => {
    return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Users CRUD (Restricted to Admin Profile)
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): boolean => {
    if (!isAdmin()) {
      showToast('Acceso denegado: solo el Administrador puede gestionar usuarios', 'error');
      return false;
    }
    const id = 'user-' + Date.now().toString(36);
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    // Persist to Slim PHP
    apiService.createUser(newUser).catch((err) => {
      console.warn('[API] Error creating user on Slim PHP:', err.message);
    });
    showToast(`Usuario ${newUser.name} creado con éxito`);
    return true;
  };

  const updateUser = (id: string, data: Partial<User>): boolean => {
    if (!isAdmin()) {
      showToast('Acceso denegado: solo el Administrador puede modificar usuarios', 'error');
      return false;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...data, updatedAt: new Date().toISOString() } : u))
    );
    // Persist to Slim PHP
    apiService.updateUser(id, data).catch((err) => {
      console.warn('[API] Error updating user on Slim PHP:', err.message);
    });
    showToast('Usuario actualizado');
    return true;
  };

  const deleteUser = (id: string): boolean => {
    if (!isAdmin()) {
      showToast('Acceso denegado: solo el Administrador puede eliminar usuarios', 'error');
      return false;
    }
    if (id === currentUser?.id) {
      showToast('No puedes eliminar tu propio usuario en sesión activa', 'error');
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    // Persist to Slim PHP
    apiService.deleteUser(id).catch((err) => {
      console.warn('[API] Error deleting user on Slim PHP:', err.message);
    });
    showToast('Usuario eliminado', 'info');
    return true;
  };

  // Client Profile & Tagging
  const updateClientProfile = (profileUpdate: Partial<ClientProfile>) => {
    setClientProfile((prev) => ({
      ...prev,
      ...profileUpdate,
    }));
    showToast('Perfil de cliente actualizado');
  };

  const tagProduct = (productId: string, tagSlug: string) => {
    setClientProfile((prev) => {
      const exists = prev.taggedProductIds.some(
        (item) => item.productId === productId && item.tag === tagSlug
      );
      if (exists) return prev;
      return {
        ...prev,
        taggedProductIds: [
          ...prev.taggedProductIds,
          { productId, tag: tagSlug, addedAt: new Date().toISOString() },
        ],
      };
    });
    showToast(`Producto agregado a tu etiqueta "${tagSlug}"`);
  };

  const untagProduct = (productId: string, tagSlug: string) => {
    setClientProfile((prev) => ({
      ...prev,
      taggedProductIds: prev.taggedProductIds.filter(
        (item) => !(item.productId === productId && item.tag === tagSlug)
      ),
    }));
    showToast('Etiqueta retirada del producto', 'info');
  };

  const isProductTaggedByClient = (productId: string, tagSlug?: string) => {
    if (tagSlug) {
      return clientProfile.taggedProductIds.some(
        (item) => item.productId === productId && item.tag === tagSlug
      );
    }
    return clientProfile.taggedProductIds.some((item) => item.productId === productId);
  };

  const getClientTaggedProducts = (tagSlug?: string) => {
    const productIds = clientProfile.taggedProductIds
      .filter((item) => (tagSlug ? item.tag === tagSlug : true))
      .map((item) => item.productId);
    return products.filter((p) => productIds.includes(p.id));
  };

  // Reset all data
  const resetAllData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setBrands(INITIAL_BRANDS);
    setTags(INITIAL_TAGS);
    setUsers(INITIAL_USERS);
    setMachineries(INITIAL_MACHINERY);
    setMachineryBrands(INITIAL_MACHINERY_BRANDS);
    setRentalRequests(INITIAL_RENTAL_REQUESTS);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.BRANDS);
    localStorage.removeItem(STORAGE_KEYS.TAGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.CLIENT_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.MACHINERY);
    localStorage.removeItem(STORAGE_KEYS.MACHINERY_BRANDS);
    localStorage.removeItem(STORAGE_KEYS.RENTAL_REQUESTS);
    setStoreSettings(STORE_INFO);
    showToast('Datos reiniciados a los valores originales de fábrica');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        brands,
        tags,
        users,
        machineries,
        machineryBrands,
        rentalRequests,
        currentUser,
        clientProfile,
        storeSettings,
        toasts,
        backendStatus,
        backendInfo,
        reloadFromApi,
        login,
        logout,
        switchRole,
        isAdmin,
        registerClient,
        loginWithGoogle,
        updateStoreSettings,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getProductBySlug,
        addMachinery,
        updateMachinery,
        deleteMachinery,
        getMachineryById,
        addMachineryBrand,
        updateMachineryBrand,
        deleteMachineryBrand,
        addRentalRequest,
        updateRentalRequestStatus,
        updateRentalRequest,
        deleteRentalRequest,
        addBrand,
        updateBrand,
        deleteBrand,
        addCategory,
        updateCategory,
        deleteCategory,
        getParentCategories,
        getSubcategories,
        addUser,
        updateUser,
        deleteUser,
        updateClientProfile,
        tagProduct,
        untagProduct,
        isProductTaggedByClient,
        getClientTaggedProducts,
        showToast,
        removeToast,
        resetAllData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
