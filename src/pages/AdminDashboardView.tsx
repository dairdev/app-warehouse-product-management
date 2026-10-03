import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category, User, Brand } from '../types';
import { ProductFormModal } from '../components/ProductFormModal';
import { SlimApiStatusTab } from '../components/SlimApiStatusTab';
import { formatCurrency } from '../utils/shareUtils';
import { downloadFullCatalogPdf } from '../utils/pdfExport';
import {
  Package,
  Layers,
  Award,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileDown,
  Eye,
  Shield,
  Tag as TagIcon,
  Lock,
  Globe,
  Check,
  X,
  Settings,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Type,
  Layout,
  Sparkles,
  Bookmark,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onViewProductAsClient: (product: Product) => void;
  onPrintCatalog: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onViewProductAsClient,
  onPrintCatalog,
}) => {
  const {
    products,
    categories,
    brands,
    users,
    currentUser,
    clientProfile,
    storeSettings,
    isAdmin,
    deleteProduct,
    deleteCategory,
    addCategory,
    updateCategory,
    addBrand,
    updateBrand,
    deleteBrand,
    addUser,
    deleteUser,
    updateStoreSettings,
    showToast,
    backendStatus,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'users' | 'settings' | 'export' | 'api'>('products');

  // Product management state
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Category management state (Full CRUD)
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState<string>('none');
  const [catPresentations, setCatPresentations] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState('');

  // Brand management state
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandOrigin, setBrandOrigin] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  // User management state (Admin only)
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');
  const [newUserCompany, setNewUserCompany] = useState('Almacenes Nor Oriente S.A.C.');

  // Store Settings state (Admin only)
  const [storeName, setStoreName] = useState(storeSettings.name);
  const [storeAddress, setStoreAddress] = useState(storeSettings.address);
  const [storeCity, setStoreCity] = useState(storeSettings.city);
  const [storePhone, setStorePhone] = useState(storeSettings.phone);
  const [storeWhatsapp, setStoreWhatsapp] = useState(storeSettings.whatsappNumber);
  const [storeEmail, setStoreEmail] = useState(storeSettings.email);
  const [storeRuc, setStoreRuc] = useState(storeSettings.ruc || '');
  const [storeSchedule, setStoreSchedule] = useState(storeSettings.schedule || '');

  // Page Headers state (Admin only)
  const [catalogHeaderBadge, setCatalogHeaderBadge] = useState(
    storeSettings.catalogHeaderBadge || 'Distribución Mayorista & Menorista Directo a Obra'
  );
  const [catalogHeaderTitle, setCatalogHeaderTitle] = useState(
    storeSettings.catalogHeaderTitle || 'Materiales de Construcción Pesada & Fichas Técnicas'
  );
  const [catalogHeaderSubtitle, setCatalogHeaderSubtitle] = useState(
    storeSettings.catalogHeaderSubtitle ||
      'Precios por mayor, stock certificado bajo normas ASTM / NTP y cotización directa por WhatsApp para ingenieros, maestros de obra y constructoras.'
  );
  const [headerTagline, setHeaderTagline] = useState(
    storeSettings.headerTagline || 'Materiales de Construcción · Selva Central & Norte'
  );
  const [profileHeaderTitle, setProfileHeaderTitle] = useState(
    storeSettings.profileHeaderTitle || 'Datos de la Obra / Cliente'
  );
  const [profileHeaderSubtitle, setProfileHeaderSubtitle] = useState(
    storeSettings.profileHeaderSubtitle || 'Perfil de Obra & Lista de Materiales Etiquetados'
  );

  useEffect(() => {
    setStoreName(storeSettings.name);
    setStoreAddress(storeSettings.address);
    setStoreCity(storeSettings.city);
    setStorePhone(storeSettings.phone);
    setStoreWhatsapp(storeSettings.whatsappNumber);
    setStoreEmail(storeSettings.email);
    setStoreRuc(storeSettings.ruc || '');
    setStoreSchedule(storeSettings.schedule || '');

    setCatalogHeaderBadge(storeSettings.catalogHeaderBadge || 'Distribución Mayorista & Menorista Directo a Obra');
    setCatalogHeaderTitle(storeSettings.catalogHeaderTitle || 'Materiales de Construcción Pesada & Fichas Técnicas');
    setCatalogHeaderSubtitle(
      storeSettings.catalogHeaderSubtitle ||
        'Precios por mayor, stock certificado bajo normas ASTM / NTP y cotización directa por WhatsApp para ingenieros, maestros de obra y constructoras.'
    );
    setHeaderTagline(storeSettings.headerTagline || 'Materiales de Construcción · Selva Central & Norte');
    setProfileHeaderTitle(storeSettings.profileHeaderTitle || 'Datos de la Obra / Cliente');
    setProfileHeaderSubtitle(storeSettings.profileHeaderSubtitle || 'Perfil de Obra & Lista de Materiales Etiquetados');
  }, [storeSettings]);

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      name: storeName.trim(),
      address: storeAddress.trim(),
      city: storeCity.trim(),
      phone: storePhone.trim(),
      whatsappNumber: storeWhatsapp.trim().replace(/\D/g, ''),
      email: storeEmail.trim(),
      ruc: storeRuc.trim(),
      schedule: storeSchedule.trim(),
      catalogHeaderBadge: catalogHeaderBadge.trim(),
      catalogHeaderTitle: catalogHeaderTitle.trim(),
      catalogHeaderSubtitle: catalogHeaderSubtitle.trim(),
      headerTagline: headerTagline.trim(),
      profileHeaderTitle: profileHeaderTitle.trim(),
      profileHeaderSubtitle: profileHeaderSubtitle.trim(),
    });
  };

  const handleResetHeaderDefaults = () => {
    setCatalogHeaderBadge('Distribución Mayorista & Menorista Directo a Obra');
    setCatalogHeaderTitle('Materiales de Construcción Pesada & Fichas Técnicas');
    setCatalogHeaderSubtitle(
      'Precios por mayor, stock certificado bajo normas ASTM / NTP y cotización directa por WhatsApp para ingenieros, maestros de obra y constructoras.'
    );
    setHeaderTagline('Materiales de Construcción · Selva Central & Norte');
    setProfileHeaderTitle('Datos de la Obra / Cliente');
    setProfileHeaderSubtitle('Perfil de Obra & Lista de Materiales Etiquetados');
    showToast('Títulos y subtítulos restablecidos a valores recomendados');
  };

  // KPIs (No stock KPIs!)
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalBrands = brands.length;
  const totalTaggedByClients = clientProfile.taggedProductIds.length;

  const userIsAdmin = isAdmin();

  // Filtered products in admin table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchesBrand = p.brandName ? p.brandName.toLowerCase().includes(q) : false;
        const matchesPres = p.presentation ? p.presentation.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesSku && !matchesBrand && !matchesPres) {
          return false;
        }
      }
      if (productCatFilter !== 'all' && p.categoryId !== productCatFilter) {
        return false;
      }
      return true;
    });
  }, [products, productSearch, productCatFilter]);

  // Category CRUD Handlers
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const slug = catName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const presentationsList = catPresentations
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        slug,
        description: catDesc.trim(),
        parentId: catParentId === 'none' ? null : catParentId,
        defaultPresentations: presentationsList.length > 0 ? presentationsList : undefined,
      });
      setEditingCategory(null);
      setIsAddingCategory(false);
    } else {
      addCategory({
        name: catName.trim(),
        slug,
        description: catDesc.trim(),
        parentId: catParentId === 'none' ? null : catParentId,
        sortOrder: categories.length + 1,
        defaultPresentations: presentationsList.length > 0 ? presentationsList : undefined,
      });
      setIsAddingCategory(false);
    }

    setCatName('');
    setCatDesc('');
    setCatParentId('none');
    setCatPresentations('');
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatParentId(cat.parentId || 'none');
    setCatPresentations(cat.defaultPresentations ? cat.defaultPresentations.join(', ') : '');
    setIsAddingCategory(true);
  };

  const handleStartAddSubcategory = (parentId: string) => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatParentId(parentId);
    setCatPresentations('');
    setIsAddingCategory(true);
  };

  // Brand management handlers
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    const slug = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (editingBrand) {
      updateBrand(editingBrand.id, {
        name: brandName.trim(),
        origin: brandOrigin.trim() || 'Perú',
        description: brandDesc.trim(),
        slug,
      });
      setEditingBrand(null);
    } else {
      addBrand({
        name: brandName.trim(),
        origin: brandOrigin.trim() || 'Perú',
        description: brandDesc.trim(),
        slug,
      });
      setIsAddingBrand(false);
    }

    setBrandName('');
    setBrandOrigin('');
    setBrandDesc('');
  };

  const handleStartEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandOrigin(brand.origin || 'Perú');
    setBrandDesc(brand.description || '');
    setIsAddingBrand(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      company: newUserCompany.trim(),
    });

    setNewUserName('');
    setNewUserEmail('');
    setIsAddingUser(false);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 pb-20">
      {/* Top Admin Banner */}
      <div className="bg-stone-900 text-white border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono mb-1 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Panel Administrativo & Gestión ERP</span>
                <span className="text-stone-400">· Rol: <strong>{currentUser?.role || 'Personal'}</strong></span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Almacenes Nor Oriente
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">
                Control de materiales de construcción, marcas, categorías y catálogo para clientes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Material</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Cards (NO STOCK SHOWN) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700">
              <div className="flex items-center justify-between text-stone-400 text-xs">
                <span>Total Materiales</span>
                <Package className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1 tabular-nums">
                {totalProducts}
              </div>
              <span className="text-[11px] text-stone-400">En catálogo público</span>
            </div>

            <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700">
              <div className="flex items-center justify-between text-stone-400 text-xs">
                <span>Categorías & Líneas</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1 tabular-nums">
                {totalCategories}
              </div>
              <span className="text-[11px] text-stone-400">Aceros, Mallas, Cementos...</span>
            </div>

            <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700">
              <div className="flex items-center justify-between text-stone-400 text-xs">
                <span>Marcas Aliadas</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 mt-1 tabular-nums">
                {totalBrands}
              </div>
              <span className="text-[11px] text-stone-400">Fabricantes certificados</span>
            </div>

            <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700">
              <div className="flex items-center justify-between text-stone-400 text-xs">
                <span>Etiquetas de Obra</span>
                <TagIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1 tabular-nums">
                {totalTaggedByClients}
              </div>
              <span className="text-[11px] text-emerald-400">Interés de clientes</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Gestión de Materiales ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Categorías y Líneas ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'brands'
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Gestión de Marcas ({brands.length})
          </button>

          {/* User & Profile management RESTRICTED TO ADMIN ONLY */}
          {userIsAdmin ? (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'border-yellow-400 text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Usuarios y Roles ({users.length})</span>
              <span className="text-[10px] bg-amber-400/20 text-yellow-400 px-1.5 py-0.2 rounded font-mono">Admin</span>
            </button>
          ) : (
            <div
              className="py-3 px-3 text-xs text-stone-600 flex items-center gap-1 cursor-not-allowed select-none opacity-60"
              title="Usuarios y Perfiles restringido exclusivamente al perfil Administrador"
            >
              <Lock className="w-3 h-3" />
              <span>Usuarios (Solo Admin)</span>
            </div>
          )}

          {/* Store Settings RESTRICTED TO ADMIN ONLY */}
          {userIsAdmin ? (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'border-yellow-400 text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Datos Ferretería</span>
              <span className="text-[10px] bg-amber-400/20 text-yellow-400 px-1.5 py-0.2 rounded font-mono">Admin</span>
            </button>
          ) : (
            <div
              className="py-3 px-3 text-xs text-stone-600 flex items-center gap-1 cursor-not-allowed select-none opacity-60"
              title="Configuración de la ferretería restringida exclusivamente al perfil Administrador"
            >
              <Lock className="w-3 h-3" />
              <span>Datos Ferretería (Solo Admin)</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Exportar Catálogos PDF
          </button>

          {/* Slim PHP RESTful API Tab */}
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'api'
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="flex h-2 w-2 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  backendStatus === 'online' ? 'bg-emerald-400' : backendStatus === 'connecting' ? 'bg-amber-400' : 'bg-red-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendStatus === 'online' ? 'bg-emerald-500' : backendStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />
            </span>
            <span>API Slim PHP (REST)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                backendStatus === 'online'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                  : backendStatus === 'connecting'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                  : 'bg-red-950/70 text-red-300 border border-red-800/60'
              }`}
            >
              {backendStatus === 'online' ? 'Online' : backendStatus === 'connecting' ? 'Conectando...' : 'Offline'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-4">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filtrar por nombre, marca o SKU..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="all">Todas las categorías</option>
                  {categories
                    .filter((c) => c.parentId === null)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  + Agregar Material
                </button>
              </div>
            </div>

            {/* Products Table (NO STOCK COLUMN) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Material (Nombre Concatenado)</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Marca</th>
                    <th className="py-3 px-4">Presentación</th>
                    <th className="py-3 px-4">Precio Lista</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const hasPrice = p.price !== undefined && p.price !== null && p.price > 0;

                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{p.name}</div>
                          <span className="font-mono text-[10px] text-stone-400">
                            {p.sku ? `SKU: ${p.sku}` : 'Sin SKU'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-600 font-medium">
                          {cat?.name || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-amber-900">
                            {p.brandName || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                            {p.presentation || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {hasPrice ? (
                            <>
                              <span className="font-black text-stone-900 tabular-nums">
                                {formatCurrency(p.price!, p.currency)}
                              </span>
                              <span className="text-[10px] text-stone-400 block font-normal">
                                /{p.unit || 'unidad'}
                              </span>
                            </>
                          ) : (
                            <span className="text-amber-800 font-semibold text-[11px]">
                              A Cotizar
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onViewProductAsClient(p)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                              title="Ver ficha técnica como cliente"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-stone-100 rounded-lg"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES & SUBCATEGORIES (Full CRUD: Create, Read, Update, Delete) */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Create / Edit Category Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Gestión de Categorías y Subcategorías</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Cree, edite y configure las líneas de materiales y sus presentaciones asociadas (Aceros y Mallas son independientes).
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (isAddingCategory || editingCategory) {
                      setIsAddingCategory(false);
                      setEditingCategory(null);
                      setCatName('');
                      setCatDesc('');
                      setCatParentId('none');
                      setCatPresentations('');
                    } else {
                      setCatName('');
                      setCatDesc('');
                      setCatParentId('none');
                      setCatPresentations('');
                      setIsAddingCategory(true);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  {isAddingCategory || editingCategory ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAddingCategory || editingCategory ? 'Cerrar' : 'Nueva Categoría'}</span>
                </button>
              </div>

              {/* Category Search Filter */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filtrar categorías por nombre o descripción..."
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 hover:text-stone-600"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Category Create / Edit Form */}
              {(isAddingCategory || editingCategory) && (
                <form
                  onSubmit={handleSaveCategory}
                  className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4 mb-4"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-stone-900">
                      {editingCategory
                        ? (catParentId !== 'none' ? `Editar Sub Categoria: ${editingCategory.name}` : `Editar Categoría: ${editingCategory.name}`)
                        : (catParentId !== 'none' ? 'Registrar Nueva Sub Categoria' : 'Registrar Nueva Categoría Principal')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setEditingCategory(null);
                      }}
                      className="text-stone-400 hover:text-stone-600 text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {catParentId !== 'none' ? 'Sub Categoria *' : 'Nombre de la categoría *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        placeholder={
                          catParentId !== 'none'
                            ? 'Ej: Fierro Corrugado 1/2", King Kong 18 Huecos...'
                            : 'Ej: Aceros, Mallas, Cemento Sol...'
                        }
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Jerarquía / Categoría Padre
                      </label>
                      <select
                        value={catParentId}
                        onChange={(e) => setCatParentId(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      >
                        <option value="none">-- Es una Categoría Principal --</option>
                        {categories
                          .filter((c) => c.parentId === null && (editingCategory ? c.id !== editingCategory.id : true))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              Subcategoría de: {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Descripción técnica o normativa
                      </label>
                      <input
                        type="text"
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        placeholder="Aplicación en obras civiles, NTP..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* Presentations Editor for Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-stone-700">
                        Presentaciones sugeridas (separadas por comas)
                      </label>
                      <span className="text-[10px] text-stone-400">
                        Aparecerán automáticamente al crear productos de esta categoría
                      </span>
                    </div>
                    <input
                      type="text"
                      value={catPresentations}
                      onChange={(e) => setCatPresentations(e.target.value)}
                      placeholder='Ej: 1/2", 3/8", 5/8", 3/4", 1" (o: 42.5 kg, Granel)'
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono"
                    />

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-stone-500">
                      <span>Sugerencias rápidas:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCatPresentations((prev) => (prev ? `${prev}, 42.5 kg` : '42.5 kg'))
                        }
                        className="px-2 py-0.5 rounded bg-stone-200/70 hover:bg-stone-200 text-stone-800"
                      >
                        + 42.5 kg
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCatPresentations((prev) =>
                            prev ? `${prev}, 1/2", 3/8", 5/8"` : '1/2", 3/8", 5/8"'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-stone-200/70 hover:bg-stone-200 text-stone-800"
                      >
                        + 1/2", 3/8", 5/8"
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCatPresentations((prev) =>
                            prev ? `${prev}, Millar (1000 unid)` : 'Millar (1000 unid)'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-stone-200/70 hover:bg-stone-200 text-stone-800"
                      >
                        + Millar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCatPresentations((prev) => (prev ? `${prev}, m³` : 'm³'))
                        }
                        className="px-2 py-0.5 rounded bg-stone-200/70 hover:bg-stone-200 text-stone-800"
                      >
                        + m³
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCatPresentations((prev) =>
                            prev ? `${prev}, Panel 2.40 x 5.00 m` : 'Panel 2.40 x 5.00 m'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-stone-200/70 hover:bg-stone-200 text-stone-800"
                      >
                        + Panel Malla
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setEditingCategory(null);
                      }}
                      className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* List of Parent Categories and Subcategories with full CRUD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories
                .filter((c) => c.parentId === null)
                .filter((c) => {
                  if (!categorySearch.trim()) return true;
                  const q = categorySearch.toLowerCase();
                  const matchesParent = c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
                  const subcats = categories.filter((s) => s.parentId === c.id);
                  const matchesSub = subcats.some((s) => s.name.toLowerCase().includes(q));
                  return matchesParent || matchesSub;
                })
                .map((cat) => {
                  const subcats = categories.filter((s) => s.parentId === cat.id);
                  const productCount = products.filter((p) => p.categoryId === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-yellow-400/60 transition-colors"
                    >
                      {/* Parent Header */}
                      <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                        <div className="pr-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-base">{cat.name}</h4>
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                              Principal
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 mt-0.5 block">
                            Slug: <code className="text-amber-800">{cat.slug}</code> · {productCount} material(es) en catálogo
                          </span>
                        </div>

                        {/* Actions for Parent Category */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartAddSubcategory(cat.id)}
                            className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-amber-900 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                            title="Agregar subcategoría a esta familia"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Subcategoría</span>
                          </button>
                          <button
                            onClick={() => handleStartEditCategory(cat)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Editar categoría principal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar categoría principal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">{cat.description || 'Sin descripción'}</p>

                      {/* Default Presentations Badge List */}
                      {cat.defaultPresentations && cat.defaultPresentations.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-100/80 rounded-xl p-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                            Presentaciones vinculadas ({cat.defaultPresentations.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.defaultPresentations.map((pres) => (
                              <span
                                key={pres}
                                className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-amber-200/80 text-amber-950 font-medium"
                              >
                                {pres}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subcategories list */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Subcategorías vinculadas ({subcats.length})
                          </span>
                          <button
                            onClick={() => handleStartAddSubcategory(cat.id)}
                            className="text-[11px] text-amber-800 hover:underline font-semibold flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Nueva</span>
                          </button>
                        </div>

                        {subcats.length > 0 ? (
                          <div className="space-y-1.5">
                            {subcats.map((sub) => {
                              const subCount = products.filter((p) => p.subcategoryId === sub.id).length;
                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between bg-stone-50 hover:bg-stone-100/80 p-2 rounded-xl border border-stone-200/80 text-xs transition-colors"
                                >
                                  <div>
                                    <span className="font-semibold text-stone-900">{sub.name}</span>
                                    <span className="text-[10px] text-stone-400 ml-2 font-mono">
                                      {subCount} material(es)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleStartEditCategory(sub)}
                                      className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200"
                                      title="Editar subcategoría"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteCategory(sub.id)}
                                      className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50"
                                      title="Eliminar subcategoría"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center">
                            <span className="text-xs text-stone-400 italic block mb-1">
                              Sin subcategorías específicas en esta línea
                            </span>
                            <button
                              onClick={() => handleStartAddSubcategory(cat.id)}
                              className="text-[11px] text-amber-800 font-bold hover:underline"
                            >
                              + Crear primera subcategoría
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: BRANDS MANAGEMENT */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    Gestión de Marcas Fabricantes
                  </h3>
                  <p className="text-xs text-stone-500">
                    Administre los proveedores y marcas certificadas que componen el nombre del producto.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsAddingBrand(!isAddingBrand);
                    setEditingBrand(null);
                    setBrandName('');
                    setBrandOrigin('Perú');
                    setBrandDesc('');
                  }}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isAddingBrand || editingBrand ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAddingBrand || editingBrand ? 'Cerrar' : 'Nueva Marca'}</span>
                </button>
              </div>

              {/* Add / Edit Brand Form */}
              {(isAddingBrand || editingBrand) && (
                <form
                  onSubmit={handleSaveBrand}
                  className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 mb-4"
                >
                  <div className="font-bold text-xs text-stone-900">
                    {editingBrand ? `Editando marca: ${editingBrand.name}` : 'Registrar Nueva Marca:'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Nombre de la Marca *
                      </label>
                      <input
                        type="text"
                        required
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ej: Aceros Arequipa"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        País de Origen / Procedencia
                      </label>
                      <input
                        type="text"
                        value={brandOrigin}
                        onChange={(e) => setBrandOrigin(e.target.value)}
                        placeholder="Ej: Perú, Gerdau, UNACEM"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Descripción o certificaciones
                      </label>
                      <input
                        type="text"
                        value={brandDesc}
                        onChange={(e) => setBrandDesc(e.target.value)}
                        placeholder="Norma NTP 341.031, etc."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBrand(false);
                        setEditingBrand(null);
                      }}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-lg text-xs"
                    >
                      {editingBrand ? 'Actualizar Marca' : 'Guardar Marca'}
                    </button>
                  </div>
                </form>
              )}

              {/* Brands Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {brands.map((brand) => {
                  const productsCount = products.filter((p) => p.brandId === brand.id).length;

                  return (
                    <div
                      key={brand.id}
                      className="p-4 rounded-xl border border-stone-200 bg-white hover:border-yellow-400 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-stone-900">{brand.name}</h4>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                            {brand.origin || 'Nacional'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {brand.description || 'Proveedor certificado de materiales pesados.'}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-400 font-medium">
                          {productsCount} producto(s)
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditBrand(brand)}
                            className="p-1 text-stone-500 hover:text-amber-800 rounded"
                            title="Editar marca"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBrand(brand.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded"
                            title="Eliminar marca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS & ROLES (RESTRICTED STRICTLY TO ADMIN PROFILE) */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            {!userIsAdmin ? (
              <div className="p-8 text-center max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Acceso Restringido: Solo Administrador
                </h3>
                <p className="text-xs text-stone-500">
                  La gestión de usuarios, roles y perfiles requiere privilegios de Administrador. Su sesión actual tiene el rol <strong>{currentUser?.role || 'Personal'}</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Gestión de Usuarios y Roles (Acceso Exclusivo Administrador)</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Administre cuentas de personal de ventas y administradores del sistema.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddingUser(!isAddingUser)}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isAddingUser ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isAddingUser ? 'Cerrar' : 'Nuevo Usuario'}</span>
                  </button>
                </div>

                {isAddingUser && (
                  <form
                    onSubmit={handleCreateUser}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Ej: Miguel Operaciones"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="usuario@ferreteria.test"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Rol Asignado
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'staff')}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        >
                          <option value="staff">Personal / Staff</option>
                          <option value="admin">Administrador Central</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Empresa / Sede
                        </label>
                        <input
                          type="text"
                          value={newUserCompany}
                          onChange={(e) => setNewUserCompany(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingUser(false)}
                        className="px-3 py-1.5 text-xs text-stone-600"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-lg text-xs"
                      >
                        Registrar Usuario
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Rol Asignado</th>
                        <th className="py-3 px-4">Empresa / Proyecto</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50/70">
                          <td className="py-3 px-4 font-bold text-stone-900">{u.name}</td>
                          <td className="py-3 px-4 font-mono text-stone-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-amber-100 text-amber-900'
                                  : u.role === 'staff'
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-600">{u.company || '-'}</td>
                          <td className="py-3 px-4 text-right">
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="p-1 text-stone-400 hover:text-red-600 rounded"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: STORE SETTINGS / DATOS DE FERRETERÍA (ADMIN PROFILE ONLY) */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {!userIsAdmin ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Acceso Restringido: Solo Administrador
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  La configuración de datos de la ferretería (dirección, teléfonos, correo y datos comerciales) requiere privilegios de Administrador. Su sesión actual tiene el rol <strong>{currentUser?.role || 'Personal'}</strong>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form column (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-600" />
                      <span>Configuración de Datos de la Ferretería</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Actualice la dirección, teléfonos, correo y razón social. Estos datos se reflejan en el catálogo, fichas técnicas, cotizaciones automáticas de WhatsApp y documentos imprimibles.
                    </p>
                  </div>

                  <form onSubmit={handleSaveStoreSettings} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Store Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Nombre Comercial de la Ferretería *
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            required
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="Ej: Almacenes Nor Oriente S.A.C."
                            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold text-stone-900"
                          />
                        </div>
                      </div>

                      {/* Store Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Dirección del Almacén / Sede Principal *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            required
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            placeholder="Ej: Av. Circunvalación Norte 1420, Sector Industrial"
                            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                      </div>

                      {/* City / Department */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Ciudad / Región / Departamento *
                        </label>
                        <input
                          type="text"
                          required
                          value={storeCity}
                          onChange={(e) => setStoreCity(e.target.value)}
                          placeholder="Ej: Tarapoto / San Martín - Perú"
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>

                      {/* Store Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Teléfono de Contacto / Central Telefónica *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            required
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                            placeholder="+51 987 654 321"
                            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                          />
                        </div>
                      </div>

                      {/* Store WhatsApp */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Número WhatsApp para Cotizaciones a Obra *
                        </label>
                        <div className="relative">
                          <Send className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                          <input
                            type="text"
                            required
                            value={storeWhatsapp}
                            onChange={(e) => setStoreWhatsapp(e.target.value)}
                            placeholder="51987654321"
                            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                          />
                        </div>
                        <span className="text-[10px] text-stone-400 mt-0.5 block">
                          Formato internacional numérico (ej: 51987654321)
                        </span>
                      </div>

                      {/* Store Email */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Correo Electrónico de Ventas y Cotizaciones *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="email"
                            required
                            value={storeEmail}
                            onChange={(e) => setStoreEmail(e.target.value)}
                            placeholder="ventas@almacenesnororiente.com"
                            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                          />
                        </div>
                      </div>

                      {/* RUC / Identificación Fiscal */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          RUC / Identificación Fiscal
                        </label>
                        <input
                          type="text"
                          value={storeRuc}
                          onChange={(e) => setStoreRuc(e.target.value)}
                          placeholder="20601234567"
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                        />
                      </div>

                      {/* Horario de Atención */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Horario de Despacho en Obra
                        </label>
                        <div className="relative">
                          <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={storeSchedule}
                            onChange={(e) => setStoreSchedule(e.target.value)}
                            placeholder="Lunes a Sábado: 7:00 am - 6:00 pm"
                            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION: ADMINISTRATION OF PAGE HEADER TITLES & SUBTITLES */}
                    <div className="pt-6 border-t border-stone-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                            <Type className="w-4 h-4 text-amber-600" />
                            <span>Administración de Encabezados (Títulos y Subtítulos)</span>
                          </h4>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Personalice los textos principales que ven los clientes en el catálogo, perfil de cotización y barra superior.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetHeaderDefaults}
                          className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold underline self-start sm:self-auto"
                        >
                          Restablecer por defecto
                        </button>
                      </div>

                      {/* Group 1: Catálogo Principal (Hero Header) */}
                      <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                          <Layout className="w-3.5 h-3.5 text-amber-700" />
                          <span>1. Encabezado del Catálogo Principal (Banner Hero)</span>
                        </span>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Distintivo / Etiqueta Superior (Badge)
                            </label>
                            <input
                              type="text"
                              value={catalogHeaderBadge}
                              onChange={(e) => setCatalogHeaderBadge(e.target.value)}
                              placeholder="Ej: Distribución Mayorista & Menorista Directo a Obra"
                              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Título Principal del Catálogo (H1) *
                            </label>
                            <input
                              type="text"
                              required
                              value={catalogHeaderTitle}
                              onChange={(e) => setCatalogHeaderTitle(e.target.value)}
                              placeholder="Ej: Materiales de Construcción Pesada & Fichas Técnicas"
                              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold text-stone-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Subtítulo / Bajada Descriptiva del Catálogo
                            </label>
                            <textarea
                              rows={2}
                              value={catalogHeaderSubtitle}
                              onChange={(e) => setCatalogHeaderSubtitle(e.target.value)}
                              placeholder="Ej: Precios por mayor, stock certificado bajo normas ASTM / NTP..."
                              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Group 2: Barra de Navegación (Header / Navbar) */}
                      <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          <span>2. Barra Superior (Navbar Header)</span>
                        </span>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Lema o Subtítulo junto al Logotipo (Tagline)
                          </label>
                          <input
                            type="text"
                            value={headerTagline}
                            onChange={(e) => setHeaderTagline(e.target.value)}
                            placeholder="Ej: Materiales de Construcción · Selva Central & Norte"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                      </div>

                      {/* Group 3: Perfil de Obra / Cotizador */}
                      <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                          <span>3. Encabezado de la Página de Perfil / Cotizador de Obra</span>
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Título del Encabezado de Perfil
                            </label>
                            <input
                              type="text"
                              value={profileHeaderTitle}
                              onChange={(e) => setProfileHeaderTitle(e.target.value)}
                              placeholder="Ej: Datos de la Obra / Cliente"
                              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Subtítulo / Barra Superior de Perfil
                            </label>
                            <input
                              type="text"
                              value={profileHeaderSubtitle}
                              onChange={(e) => setProfileHeaderSubtitle(e.target.value)}
                              placeholder="Ej: Perfil de Obra & Lista de Materiales Etiquetados"
                              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-200 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Guardar Datos y Encabezados</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Preview Column (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Live Hero Header Preview */}
                  <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-xs border border-stone-800 space-y-3">
                    <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider block font-bold">
                      Vista Previa: Encabezado del Catálogo
                    </span>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-stone-800 text-yellow-400 text-[10px] font-semibold uppercase tracking-wider border border-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                      <span className="line-clamp-1">{catalogHeaderBadge || 'Distribución Mayorista & Menorista'}</span>
                    </div>

                    <h4 className="text-sm font-black text-white leading-snug">
                      {catalogHeaderTitle || 'Título del Catálogo'}
                    </h4>

                    <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-3">
                      {catalogHeaderSubtitle || 'Subtítulo descriptivo del catálogo...'}
                    </p>

                    {headerTagline && (
                      <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400">
                        Lema en Navbar: <span className="text-yellow-400 font-semibold">{headerTagline}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-xs border border-stone-800 space-y-3">
                    <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider block font-bold">
                      Vista Previa de Identidad
                    </span>

                    <h4 className="text-lg font-black text-white">{storeName || 'Nombre Ferretería'}</h4>
                    {storeRuc && (
                      <span className="text-[11px] text-stone-400 font-mono block">
                        RUC: {storeRuc}
                      </span>
                    )}

                    <div className="space-y-1.5 text-xs text-stone-300 pt-2 border-t border-stone-800">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                        <span>{storeAddress || 'Dirección'}, {storeCity}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span>{storePhone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span className="truncate">{storeEmail}</span>
                      </p>
                      {storeSchedule && (
                        <p className="flex items-center gap-2 text-[11px] text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                          <span>{storeSchedule}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-800">
                      <span className="text-[10px] text-stone-400 block mb-1">Enlace Directo WhatsApp:</span>
                      <a
                        href={`https://wa.me/${storeWhatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>wa.me/{storeWhatsapp.replace(/\D/g, '')}</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
                    <span className="font-bold flex items-center gap-1 text-amber-900">
                      <Check className="w-3.5 h-3.5" />
                      Sincronización Automática
                    </span>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Cualquier cambio guardado aquí actualizará automáticamente los enlaces de contacto en el catálogo público, fichas técnicas descargadas y los mensajes predefinidos de cotización para clientes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: EXPORT & PDF GENERATOR */}
        {activeTab === 'export' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-xs max-w-2xl mx-auto text-center space-y-6">
            <div className="w-14 h-14 bg-yellow-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
              <FileDown className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-stone-900">
                Generador de Catálogos & Fichas Oficiales
              </h3>
              <p className="text-stone-500 text-xs mt-1 max-w-md mx-auto">
                Exporte el catálogo de Almacenes Nor Oriente formateado para impresión A4
                con marcas, especificaciones técnicas y cotizaciones oficiales.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  downloadFullCatalogPdf(products, categories);
                  showToast('Descargando PDF del Catálogo General');
                }}
                className="w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar Catálogo Completo (PDF)</span>
              </button>

              <button
                onClick={onPrintCatalog}
                className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <span>Abrir Vista Imprimible / A4</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: SLIM PHP RESTful API STATUS & DIAGNOSTICS */}
        {activeTab === 'api' && <SlimApiStatusTab />}
      </main>

      {/* Product Form Modal (Create / Edit) */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-stone-900">¿Eliminar este material?</h4>
            <p className="text-xs text-stone-600">
              Se retirará <strong>{productToDelete.name}</strong> del catálogo público e inventario.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 text-xs text-stone-600 rounded-lg hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
