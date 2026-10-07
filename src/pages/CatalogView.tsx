import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { MachineryRentModule } from '../components/MachineryRentModule';
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
  Truck,
  Wrench,
} from 'lucide-react';
import { downloadFullCatalogPdf } from '../utils/pdfExport';
import { STORE_INFO, formatCurrency } from '../utils/shareUtils';

interface CatalogViewProps {
  onSelectProduct: (product: Product) => void;
  onOpenShareModal: (product: Product) => void;
  onOpenTagModal: (product: Product) => void;
  onNavigateToClientProfile: () => void;
  onPrintCatalog: () => void;
  initialLandingSection?: 'materials' | 'machinery';
  onSectionChange?: (section: 'materials' | 'machinery') => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  onSelectProduct,
  onOpenShareModal,
  onOpenTagModal,
  onNavigateToClientProfile,
  onPrintCatalog,
  initialLandingSection = 'materials',
  onSectionChange,
}) => {
  const { products, categories, brands, tags, machineries, storeSettings, currentUser, isAdmin, showToast } = useStore();
  const isManager = isAdmin() || currentUser?.role === 'staff';

  const [activeLandingSection, setActiveLandingSection] = useState<'materials' | 'machinery'>(
    initialLandingSection
  );

  useEffect(() => {
    setActiveLandingSection(initialLandingSection);
  }, [initialLandingSection]);

  const handleSwitchSection = (section: 'materials' | 'machinery') => {
    setActiveLandingSection(section);
    if (onSectionChange) onSectionChange(section);
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'name'>('featured');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Parent Categories
  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

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
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // default: featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [products, searchQuery, selectedParentCategory, selectedBrand, selectedTag, sortBy]);

  const handleExportFullPdf = () => {
    setIsExportingPdf(true);
    try {
      downloadFullCatalogPdf(filteredProducts, categories, isManager);
      showToast('Catálogo general descargado en PDF');
    } catch (e) {
      showToast('Error al generar el PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Section (Dual-Service Awareness: Materials Store & Machinery Rental) */}
      <section className="bg-stone-900 text-white border-b border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-800/90 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-stone-700">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>
                {activeLandingSection === 'materials'
                  ? storeSettings.catalogHeaderBadge || 'Distribución Mayorista Directo a Obra & Alquiler de Maquinaria'
                  : 'Flota Pesada & Equipos Certificados con Operador'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              {activeLandingSection === 'materials'
                ? storeSettings.catalogHeaderTitle || 'Materiales de Construcción Pesada & Fichas Técnicas'
                : 'Alquiler de Maquinaria Pesada & Equipos de Obra'}
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-normal">
              {activeLandingSection === 'materials'
                ? storeSettings.catalogHeaderSubtitle ||
                  'Consulte especificaciones certificadas (NTP / ASTM), medidas, pesos y gestión de abastecimiento en cementos, ladrillos, fierro corrugado, arenas y gravas. Descargue fichas o solicite flete inmediato a pie de obra.'
                : 'Flota moderna de retroexcavadoras 4x4, minicargadores Bobcat, camiones volquetes de 15 m³ y mezcladoras de concreto. Tarifas flexibles por hora, día o mes con operador homologado y seguro SCTR.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Landing Page Dual-Pillar Service Navigation (High Visibility & Clear Differentiation) */}
        <div className="bg-stone-900/95 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-2 border-stone-800 shadow-2xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* PILLAR 1: TIENDA DE MATERIALES */}
            <button
              onClick={() => handleSwitchSection('materials')}
              className={`p-4 sm:p-5 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                activeLandingSection === 'materials'
                  ? 'bg-yellow-400 text-stone-950 shadow-xl ring-4 ring-yellow-400/40 scale-[1.01]'
                  : 'bg-stone-950/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-yellow-400/70 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      activeLandingSection === 'materials'
                        ? 'bg-stone-950 text-yellow-400 shadow-md'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    <Package className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider block ${
                        activeLandingSection === 'materials' ? 'text-stone-800' : 'text-stone-400'
                      }`}
                    >
                      Venta & Despacho a Pie de Obra
                    </span>
                    <h2
                      className={`text-lg sm:text-xl font-black tracking-tight ${
                        activeLandingSection === 'materials' ? 'text-stone-950' : 'text-white'
                      }`}
                    >
                      Tienda de Materiales
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black tabular-nums ${
                      activeLandingSection === 'materials'
                        ? 'bg-stone-950 text-yellow-400'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    {products.length} Materiales
                  </span>
                  {activeLandingSection === 'materials' && (
                    <span className="text-[10px] font-black text-amber-950 uppercase tracking-widest mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      ACTIVO AHORA
                    </span>
                  )}
                </div>
              </div>

              <p
                className={`text-xs sm:text-xs leading-relaxed mt-1 font-medium ${
                  activeLandingSection === 'materials' ? 'text-stone-800' : 'text-stone-400'
                }`}
              >
                Cementos, Fierros corrugados, Ladrillos King Kong, Mallas electrosoldadas, Arenas y Gravas. Fichas técnicas certificadas.
              </p>
            </button>

            {/* PILLAR 2: ALQUILER DE MATERIALES / MAQUINARIA */}
            <button
              onClick={() => handleSwitchSection('machinery')}
              className={`p-4 sm:p-5 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                activeLandingSection === 'machinery'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xl ring-4 ring-amber-500/40 scale-[1.01]'
                  : 'bg-stone-950/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-amber-500/70 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      activeLandingSection === 'machinery'
                        ? 'bg-stone-950 text-yellow-400 shadow-md'
                        : 'bg-stone-800 text-amber-400'
                    }`}
                  >
                    <Truck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider block ${
                        activeLandingSection === 'machinery' ? 'text-amber-100' : 'text-amber-400'
                      }`}
                    >
                      Flota Pesada & Equipos en Obra
                    </span>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      Alquiler de Materiales & Maquinaria
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black tabular-nums ${
                      activeLandingSection === 'machinery'
                        ? 'bg-stone-950 text-yellow-400'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    {machineries.length} Equipos
                  </span>
                  {activeLandingSection === 'machinery' && (
                    <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
                      ACTIVO AHORA
                    </span>
                  )}
                </div>
              </div>

              <p
                className={`text-xs sm:text-xs leading-relaxed mt-1 font-medium ${
                  activeLandingSection === 'machinery' ? 'text-amber-100/90' : 'text-stone-400'
                }`}
              >
                Retroexcavadoras 4x4, Minicargadores Bobcat, Camiones Volquetes de 15 m³, Mezcladoras y Planchas. Reserva con u opcional operador.
              </p>
            </button>
          </div>
        </div>

        {/* SECTION 1: MACHINERY RENTAL MODULE */}
        {activeLandingSection === 'machinery' ? (
          <MachineryRentModule onBackToMaterials={() => handleSwitchSection('materials')} />
        ) : (
          /* SECTION 2: MATERIALS STORE */
          <>
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
                    <option value="name">Alfabético (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Interactive Category Tabs (No subcategories shown) */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedParentCategory('all')}
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
                        onClick={() => setSelectedParentCategory(cat.id)}
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
            selectedBrand !== 'all' ||
            selectedTag !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedParentCategory('all');
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

        {/* Machinery Spotlight Banner inside Materials View */}
        <div className="mt-12 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-700 shadow-md relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/20 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-400/30">
              <Truck className="w-3.5 h-3.5" />
              <span>Servicio de Alquiler de Maquinaria Pesada</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              ¿Tu obra requiere movimiento de tierras o equipos pesados?
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              En Almacenes Nor Oriente suministramos materiales y también disponemos de una flota moderna de retroexcavadoras Caterpillar, minicargadores Bobcat, camiones volquetes y trompos mezcladores con operadores certificados y seguro SCTR.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs text-yellow-300 font-mono">
              <span className="bg-black/40 px-2.5 py-1 rounded-lg">🚜 Retroexcavadoras 4x4</span>
              <span className="bg-black/40 px-2.5 py-1 rounded-lg">🚜 Minicargadores Bobcat</span>
              <span className="bg-black/40 px-2.5 py-1 rounded-lg">🚚 Camiones Volquete 15m³</span>
              <span className="bg-black/40 px-2.5 py-1 rounded-lg">⚙️ Mezcladoras 11 p³</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto relative z-10">
            <button
              onClick={() => handleSwitchSection('machinery')}
              className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-stone-950" />
              <span>Ver Flota de Maquinaria →</span>
            </button>
            <a
              href={`https://wa.me/${storeSettings.whatsappNumber}?text=${encodeURIComponent(
                `Hola ${storeSettings.name}, deseo consultar tarifas y disponibilidad para alquilar maquinaria pesada en obra.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 text-center"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Cotizar por WhatsApp</span>
            </a>
          </div>
        </div>
      </>
    )}
  </main>
</div>
);
};
