import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_TAGS,
  INITIAL_USERS,
  INITIAL_BRANDS,
} from '../data/initialData';
import { STORE_INFO } from '../utils/shareUtils';

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

  // Auth & Roles
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'guest' | 'admin' | 'staff' | 'client') => void;
  isAdmin: () => boolean;

  // Store Settings (Admin only)
  updateStoreSettings: (settings: Partial<StoreSettings>) => boolean;

  // Products CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => boolean;
  deleteProduct: (id: string) => boolean;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;

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
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));
  }, [storeSettings]);

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
    showToast('Datos de la ferretería actualizados correctamente');
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
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Producto "${newProduct.name}" registrado con éxito`);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>): boolean => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...productData,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    showToast('Producto actualizado correctamente');
    return true;
  };

  const deleteProduct = (id: string): boolean => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    showToast('Producto eliminado del catálogo', 'info');
    return true;
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getProductBySlug = (slug: string) => {
    return products.find((p) => p.slug === slug);
  };

  // Brands CRUD
  const addBrand = (brandData: Omit<Brand, 'id'>): Brand => {
    const id = 'brand-' + Date.now().toString(36);
    const newBrand: Brand = {
      ...brandData,
      id,
    };
    setBrands((prev) => [...prev, newBrand]);
    showToast(`Marca "${newBrand.name}" agregada con éxito`);
    return newBrand;
  };

  const updateBrand = (id: string, data: Partial<Brand>): boolean => {
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
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
    showToast(`Categoría "${newCat.name}" agregada con éxito`);
    return newCat;
  };

  const updateCategory = (id: string, data: Partial<Category>): boolean => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))
    );
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
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.BRANDS);
    localStorage.removeItem(STORAGE_KEYS.TAGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.CLIENT_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
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
        currentUser,
        clientProfile,
        storeSettings,
        toasts,
        login,
        logout,
        switchRole,
        isAdmin,
        updateStoreSettings,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getProductBySlug,
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
