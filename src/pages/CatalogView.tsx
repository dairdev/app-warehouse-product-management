import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  Search,
  SlidersHorizontal,
  FileDown,
  Printer,
  Share2,
  PhoneCall,
  Check,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { downloadFullCatalogPdf } from '../utils/pdfExport';
import { STORE_INFO, formatCurrency } from '../utils/shareUtils';

interface CatalogViewProps {
  onSelectProduct: (product: Product) => void;
  onOpenShareModal: (product: Product) => void;
  onOpenTagModal: (product: Product) => void;
  onNavigateToClientProfile: () => void;
  onPrintCatalog: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  onSelectProduct,
  onOpenShareModal,
  onOpenTagModal,
  onNavigateToClientProfile,
  onPrintCatalog,
}) => {
  const { products, categories, brands, tags, storeSettings, showToast } = useStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Parent Categories
  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  // Subcategories for selected parent
  const subcategoriesForSelectedParent = useMemo(() => {
    if (selectedParentCategory === 'all') return [];
    return categories
      .filter((c) => c.parentId === selectedParentCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, selectedParentCategory]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSku = product.sku ? product.sku.toLowerCase().includes(q) : false;
        const matchesBrand = product.brandName ? product.brandName.toLowerCase().includes(q) : false;
        const matchesPres = product.presentation ? product.presentation.toLowerCase().includes(q) : false;
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesAttr = product.attributes.some(
          (a) => a.key.toLowerCase().includes(q) || a.value.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesSku && !matchesBrand && !matchesPres && !matchesDesc && !matchesAttr) {
          return false;
        }
      }

      // Parent category
      if (selectedParentCategory !== 'all') {
        if (product.categoryId !== selectedParentCategory) return false;
      }

      // Subcategory
      if (selectedSubcategory !== 'all') {
        if (product.subcategoryId !== selectedSubcategory) return false;
      }

      // Brand
      if (selectedBrand !== 'all') {
        if (product.brandId !== selectedBrand) return false;
      }

      // Tag
      if (selectedTag !== 'all') {
        if (!product.tags || !product.tags.includes(selectedTag)) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.price ?? 999999;
      const priceB = b.price ?? 999999;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // default: featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [products, searchQuery, selectedParentCategory, selectedSubcategory, selectedBrand, selectedTag, sortBy]);

  const handleExportFullPdf = () => {
    setIsExportingPdf(true);
    try {
      downloadFullCatalogPdf(filteredProducts, categories);
      showToast('Catálogo general descargado en PDF');
    } catch (e) {
      showToast('Error al generar el PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Section (Focal anchor, clean industrial aesthetic, yellow accent) */}
      <section className="bg-stone-900 text-white border-b border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-800/90 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-stone-700">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Distribución Mayorista & Menorista Directo a Obra</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Materiales de Construcción Pesada & Fichas Técnicas
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              Consulte especificaciones certificadas (NTP / ASTM), medidas, pesos y precios vigentes
              en cementos, ladrillos, fierro corrugado, arenas y gravas. Descargue fichas o solicite
              flete inmediato a pie de obra.
            </p>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportFullPdf}
                disabled={isExportingPdf}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <FileDown className="w-4 h-4 text-stone-950" />
                <span>{isExportingPdf ? 'Generando PDF...' : 'Descargar Catálogo Completo (PDF)'}</span>
              </button>

              <button
                onClick={onPrintCatalog}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-semibold rounded-xl border border-stone-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-stone-400" />
                <span>Vista Imprimible / A4</span>
              </button>

              <a
                href={`https://wa.me/${storeSettings.whatsappNumber}?text=${encodeURIComponent(
                  `Hola ${storeSettings.name}, deseo consultar precios por volumen y programación de despacho a obra.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Cotización Inmediata por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Search & Filter Toolbar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-5 mb-8 space-y-4">
          {/* Top row: Search input & Sort dropdown */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por material, SKU, resistencia o características (ej: Cemento Tipo I, 1/2, King Kong)..."
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-stone-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-medium"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">Todas las Marcas</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="featured">Destacados para obra</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Interactive Category Tabs (Segmented control buttons) */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedParentCategory('all');
                  setSelectedSubcategory('all');
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedParentCategory === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
                }`}
              >
                Todos los Materiales ({products.length})
              </button>

              {parentCategories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                const isActive = selectedParentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedParentCategory(cat.id);
                      setSelectedSubcategory('all');
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-yellow-400 text-stone-950 shadow-xs'
                        : 'text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/70'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory row (if parent selected) */}
          {subcategoriesForSelectedParent.length > 0 && (
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-stone-400 text-[11px] font-semibold uppercase tracking-wider shrink-0">
                Subcategoría:
              </span>
              <button
                onClick={() => setSelectedSubcategory('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedSubcategory === 'all'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todas
              </button>
              {subcategoriesForSelectedParent.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedSubcategory === sub.id
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Tag Filter Chips */}
          <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-stone-400 text-[11px] font-semibold uppercase tracking-wider shrink-0">
              Etiquetas de Obra:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Todas
            </button>
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTag(selectedTag === t.slug ? 'all' : t.slug)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedTag === t.slug
                    ? 'bg-amber-100 text-amber-900 font-bold ring-1 ring-amber-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Active Filters Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs text-stone-500">
            Mostrando <strong className="text-stone-900 font-bold">{filteredProducts.length}</strong>{' '}
            materiales de construcción disponibles
          </div>

          {(selectedParentCategory !== 'all' ||
            selectedSubcategory !== 'all' ||
            selectedBrand !== 'all' ||
            selectedTag !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedParentCategory('all');
                setSelectedSubcategory('all');
                setSelectedBrand('all');
                setSelectedTag('all');
                setSearchQuery('');
              }}
              className="text-xs text-amber-800 hover:underline font-semibold"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        {/* Product Grid (3-column desktop, 2-column tablet) */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const cat = categories.find((c) => c.id === product.categoryId);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={cat}
                  onViewDetail={onSelectProduct}
                  onShare={onOpenShareModal}
                  onTag={onOpenTagModal}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900 mb-1">
              No se encontraron materiales con esos filtros
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Intente con otro término de búsqueda o seleccione otra categoría.
            </p>
            <button
              onClick={() => {
                setSelectedParentCategory('all');
                setSelectedSubcategory('all');
                setSelectedTag('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl"
            >
              Ver todos los materiales
            </button>
          </div>
        )}

        {/* Client Tagging / Quote Callout Banner */}
        <div className="mt-16 bg-stone-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-stone-800">
          <div>
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest block mb-1">
              ¿Eres maestro de obra o ingeniero residente?
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">
              Arma tu lista de materiales y cotiza por WhatsApp en un clic
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
              Usa el botón de marcador en cualquier producto para etiquetarlo (Cimentación, Acabados,
              Por Cotizar). Puedes exportar la lista completa o enviarla con precios calculados a nuestro equipo.
            </p>
          </div>

          <button
            onClick={onNavigateToClientProfile}
            className="shrink-0 px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Ir a Mi Perfil & Etiquetas →
          </button>
        </div>
      </main>
    </div>
  );
};
