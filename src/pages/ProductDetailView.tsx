import React, { useState } from 'react';
import { Product, Category } from '../types';
import { useStore } from '../context/StoreContext';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  FileDown,
  PhoneCall,
  ShieldCheck,
  Truck,
  Video,
  Image as ImageIcon,
  Play,
  Package,
} from 'lucide-react';
import { formatCurrency, getProductWhatsAppUrl, STORE_INFO } from '../utils/shareUtils';
import { downloadProductPdf } from '../utils/pdfExport';
import { getMediaUrl } from '../utils/mediaUtils';

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
  onOpenShareModal: (product: Product) => void;
  onOpenTagModal: (product: Product) => void;
  onSelectRelated: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onBack,
  onOpenShareModal,
  onOpenTagModal,
  onSelectRelated,
}) => {
  const { products, categories, storeSettings, isProductTaggedByClient, showToast } = useStore();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Producto no encontrado</h2>
        <p className="text-xs text-stone-500 mb-6">El producto que buscas ya no existe o fue retirado del catálogo.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const subcategory = categories.find((c) => c.id === product.subcategoryId);
  const isTagged = isProductTaggedByClient(product.id);
  const whatsappUrl = getProductWhatsAppUrl(product, storeSettings);

  const mediaList = product.media && product.media.length > 0 ? product.media : [];
  const currentMedia = mediaList[selectedMediaIndex] || mediaList[0];

  const hasPrice = product.price !== undefined && product.price !== null && product.price > 0;

  // Related products from same category
  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);

  const handleDownloadPdf = () => {
    downloadProductPdf(product, category?.name || 'Materiales de Construcción');
    showToast('Ficha técnica generada en formato PDF');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Top Breadcrumb & Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo de Materiales</span>
          </button>

          {/* Breadcrumb unboxed */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400">
            <span>Catálogo</span>
            <span aria-hidden="true">/</span>
            <span>{category?.name || 'Materiales'}</span>
            {subcategory && (
              <>
                <span aria-hidden="true">/</span>
                <span>{subcategory.name}</span>
              </>
            )}
            {product.sku && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-stone-900 font-semibold truncate max-w-[200px]">SKU: {product.sku}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Media Gallery (Photos & Videos) (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Media Main Viewport */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="relative aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden">
                {currentMedia ? (
                  currentMedia.type === 'video' ? (
                    currentMedia.url.startsWith('data:video') || currentMedia.url.endsWith('.mp4') ? (
                      <video
                        src={getMediaUrl(currentMedia.url)}
                        controls
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-900 text-white flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-400 text-stone-950 flex items-center justify-center mb-3">
                          <Play className="w-8 h-8 fill-current ml-1" />
                        </div>
                        <h4 className="text-sm font-bold">{currentMedia.title || 'Video Demostrativo del Material'}</h4>
                        <p className="text-xs text-stone-400 mt-1 max-w-sm">
                          Pruebas de resistencia y demostración técnica para {product.name}
                        </p>
                      </div>
                    )
                  ) : (
                    <img
                      src={getMediaUrl(currentMedia.url)}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                  )
                ) : (
                  <div className="text-stone-400 text-xs flex flex-col items-center">
                    <Package className="w-12 h-12 stroke-[1.25] text-stone-300 mb-2" />
                    <span>Sin imagen disponible</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-stone-950/75 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-md">
                  {currentMedia?.type === 'video' ? '🎬 Video Demostrativo' : '📷 Fotografía Oficial'} · Almacenes Nor Oriente
                </div>
              </div>

              {/* Thumbnails if multiple media items */}
              {mediaList.length > 1 && (
                <div className="p-3 border-t border-stone-100 flex gap-2.5 overflow-x-auto">
                  {mediaList.map((m, idx) => (
                    <button
                      key={m.id || idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`relative w-18 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-stone-100 ${
                        selectedMediaIndex === idx
                          ? 'border-yellow-500 ring-2 ring-yellow-400/30'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      {m.type === 'video' ? (
                        <div className="w-full h-full bg-stone-900 text-yellow-400 flex items-center justify-center">
                          <Video className="w-6 h-6" />
                        </div>
                      ) : (
                        <img
                          src={getMediaUrl(m.url)}
                          alt={m.title || ''}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] text-white px-1 rounded">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Technical Narrative */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                Descripción y Aplicación en Obra
              </h3>
              <p className="text-stone-700 text-sm leading-relaxed">
                {product.description}
              </p>

              {/* Guarantees Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-stone-900 block">Normas Certificadas</span>
                    <span className="text-stone-500">Fabricación normalizada NTP / ASTM con garantía de lote.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-stone-900 block">Despacho en Obra</span>
                    <span className="text-stone-500">Flete coordinado en camión volquete o plataforma según volumen.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Characteristics Table (EAV) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">
                  Ficha Técnica & Parámetros Certificados
                </h3>
                {product.sku && <span className="text-xs font-mono text-stone-400">SKU: {product.sku}</span>}
              </div>

              <div className="divide-y divide-stone-100 text-xs">
                {/* Brand & Presentation rows */}
                {product.brandName && (
                  <div className="py-2.5 flex items-center justify-between hover:bg-stone-50/60 px-2 rounded-lg">
                    <span className="font-semibold text-stone-600">Marca Registrada:</span>
                    <span className="font-bold text-stone-900 text-right">{product.brandName}</span>
                  </div>
                )}
                {product.presentation && (
                  <div className="py-2.5 flex items-center justify-between hover:bg-stone-50/60 px-2 rounded-lg">
                    <span className="font-semibold text-stone-600">Presentación / Medida:</span>
                    <span className="font-bold text-amber-900 font-mono text-right">{product.presentation}</span>
                  </div>
                )}
                {product.attributes && product.attributes.length > 0 ? (
                  product.attributes.map((attr, idx) => (
                    <div
                      key={attr.id || idx}
                      className="py-2.5 flex items-center justify-between hover:bg-stone-50/60 px-2 rounded-lg transition-colors"
                    >
                      <span className="font-medium text-stone-600">{attr.key}</span>
                      <span className="font-bold text-stone-900 font-mono text-right">{attr.value}</span>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Contiguous Purchase / Inquiry Module (Sticky on desktop) (5 cols) */}
          <div className="lg:col-span-5 sticky top-22 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
              {/* Category, Brand, Presentation */}
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-1.5">
                  <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                    {category?.name || 'Construcción'}
                  </span>
                  {product.brandName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-amber-900">{product.brandName}</span>
                    </>
                  )}
                  {product.presentation && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-stone-600">{product.presentation}</span>
                    </>
                  )}
                  {product.sku && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-stone-400">SKU: {product.sku}</span>
                    </>
                  )}
                </div>

                <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Price Box — Optional Price handling, NO STOCK SHOWN */}
              <div className="bg-yellow-50/70 border border-yellow-200/80 rounded-xl p-4">
                <div className="text-xs text-stone-600 font-medium">Condición Comercial:</div>
                <div className="flex items-baseline gap-2 mt-1">
                  {hasPrice ? (
                    <>
                      <span className="text-3xl font-black text-stone-950 tabular-nums tracking-tight">
                        {formatCurrency(product.price!, product.currency)}
                      </span>
                      <span className="text-xs font-medium text-stone-700">
                        por {product.unit || 'unidad'} (inc. IGV)
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold text-amber-900">
                      Precio a Cotizar / Consultar
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-2">
                  Atención por camión completo, volumen o pedido fraccionado a pie de obra.
                </p>
              </div>

              {/* Primary Actions: WhatsApp Order & Tag */}
              <div className="space-y-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Cotizar / Consultar por WhatsApp</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenTagModal(product)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isTagged
                        ? 'bg-yellow-400 border-yellow-500 text-stone-950 font-bold'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                    <span>{isTagged ? 'Etiquetado en Obra' : 'Etiquetar Producto'}</span>
                  </button>

                  <button
                    onClick={() => onOpenShareModal(product)}
                    className="py-2.5 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>

              {/* PDF Datasheet Download Button */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <button
                  onClick={handleDownloadPdf}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4 text-stone-700" />
                  <span>Descargar Ficha Técnica PDF Oficial</span>
                </button>
              </div>

              {/* Direct Store Contact Info Card */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600 space-y-1">
                <div className="font-bold text-stone-900">{STORE_INFO.name}</div>
                <div>📍 {STORE_INFO.address}</div>
                <div>📞 Central de Ventas: {STORE_INFO.phone}</div>
              </div>
            </div>

            {/* Related materials from same category */}
            {relatedProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Materiales Relacionados en {category?.name}
                </h4>
                <div className="space-y-3">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated(rel)}
                      className="p-2.5 rounded-xl border border-stone-100 hover:border-yellow-400 hover:bg-stone-50 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800">
                          {rel.name}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {rel.brandName ? `${rel.brandName} · ` : ''}{rel.presentation || ''}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-stone-900 whitespace-nowrap tabular-nums">
                        {rel.price ? formatCurrency(rel.price, rel.currency) : 'A Cotizar'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
