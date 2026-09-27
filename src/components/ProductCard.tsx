import React, { useState } from 'react';
import { Product, Category } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/shareUtils';
import { Share2, Bookmark, ArrowRight, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  category?: Category;
  onViewDetail: (product: Product) => void;
  onShare: (product: Product) => void;
  onTag: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  category,
  onViewDetail,
  onShare,
  onTag,
}) => {
  const { isProductTaggedByClient } = useStore();
  const [imageError, setImageError] = useState(false);

  const isTagged = isProductTaggedByClient(product.id);
  const primaryImage = product.media && product.media.length > 0 ? product.media[0].url : null;
  const mediaCount = product.media ? product.media.length : 0;

  // Key attributes for fast technical reference
  const topAttribute = product.attributes && product.attributes.length > 0 ? product.attributes[0] : null;

  const hasPrice = product.price !== undefined && product.price !== null && product.price > 0;

  return (
    <div className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-yellow-400/80 hover:shadow-md transition-all duration-200">
      {/* Product Image Slot (Clean solid neutral backdrop, 65-70% visual prominence) */}
      <div
        onClick={() => onViewDetail(product)}
        className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer flex items-center justify-center border-b border-stone-100"
      >
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-stone-400">
            <Package className="w-12 h-12 stroke-[1.25] text-stone-300 mb-2" />
            <span className="text-xs text-stone-500 font-medium">Material Estructural</span>
          </div>
        )}

        {/* Media count indicator if multiple */}
        {mediaCount > 1 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-stone-950/70 text-white text-[10px] font-mono backdrop-blur-xs">
            {mediaCount} fotos/videos
          </div>
        )}

        {/* Floating Quick Action overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTag(product);
            }}
            className={`p-1.5 rounded-lg shadow-sm transition-colors ${
              isTagged
                ? 'bg-yellow-400 text-stone-900 font-bold'
                : 'bg-white/90 text-stone-600 hover:text-stone-900 hover:bg-white'
            }`}
            title={isTagged ? 'Material en tus etiquetas' : 'Etiquetar / Guardar para mi obra'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(product);
            }}
            className="p-1.5 rounded-lg bg-white/90 text-stone-600 hover:text-stone-900 hover:bg-white shadow-sm transition-colors"
            title="Compartir ficha por WhatsApp o Email"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Content & Metadata (Zero-pill discipline) */}
      <div className="flex flex-col flex-1 p-4">
        {/* Unboxed metadata: Category · Brand · Presentation · (Optional SKU) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 mb-1.5">
          <span className="font-semibold text-stone-700 uppercase tracking-wider text-[11px]">
            {category?.name || 'Materiales'}
          </span>

          {product.brandName && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-amber-900 text-[11px]">{product.brandName}</span>
            </>
          )}

          {product.presentation && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-stone-600 font-mono text-[11px]">{product.presentation}</span>
            </>
          )}

          {product.sku && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[10px] text-stone-400">SKU {product.sku}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetail(product)}
          className="text-base font-bold text-stone-900 line-clamp-2 hover:text-amber-800 transition-colors cursor-pointer leading-snug mb-2"
        >
          {product.name}
        </h3>

        {/* Key Technical Parameter */}
        {topAttribute && (
          <div className="text-xs text-stone-600 mb-3 bg-stone-50 rounded-lg p-2 border border-stone-100 flex items-center justify-between">
            <span className="text-stone-500">{topAttribute.key}:</span>
            <span className="font-medium text-stone-800 font-mono">{topAttribute.value}</span>
          </div>
        )}

        {/* Price & Unit (Baseline aligned with Tabular Numerals) — Optional Price handling */}
        <div className="mt-auto pt-2 border-t border-stone-100 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-stone-400 block font-normal">
              {hasPrice ? `Precio por ${product.unit || 'unidad'}` : 'Cotización'}
            </span>
            {hasPrice ? (
              <span className="text-lg font-black tracking-tight text-stone-900 tabular-nums">
                {formatCurrency(product.price!, product.currency)}
              </span>
            ) : (
              <span className="text-sm font-bold text-amber-800">
                A Cotizar / Consultar
              </span>
            )}
          </div>

          <button
            onClick={() => onViewDetail(product)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-800 hover:text-amber-800 bg-stone-100 hover:bg-yellow-400/50 px-3 py-1.5 rounded-lg transition-colors group/btn"
          >
            <span>Ficha</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
