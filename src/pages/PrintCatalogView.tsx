import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from '../components/Logo';
import { formatCurrency, STORE_INFO } from '../utils/shareUtils';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintCatalogViewProps {
  onBack: () => void;
}

export const PrintCatalogView: React.FC<PrintCatalogViewProps> = ({ onBack }) => {
  const { products, categories, storeSettings, currentUser, isAdmin } = useStore();
  const isManager = isAdmin() || currentUser?.role === 'staff';

  const parentCategories = categories.filter((c) => c.parentId === null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen text-stone-900">
      {/* Top Non-Print Controls */}
      <div className="no-print bg-stone-900 text-white px-4 py-3 sticky top-0 z-50 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la aplicación</span>
          </button>
          <span className="text-stone-600">|</span>
          <span className="text-xs text-yellow-400 font-bold">
            Vista Previa de Impresión A4 / Guardar como PDF
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Guardar PDF (Ctrl + P)</span>
        </button>
      </div>

      {/* Printable Document Container */}
      <div className="max-w-[210mm] mx-auto p-8 sm:p-12 print:p-0">
        {/* COVER PAGE */}
        <section className="min-h-[260mm] flex flex-col justify-between py-12 border-b-2 border-stone-200 print:border-none print-page-break">
          <div>
            <div className="flex items-center justify-between mb-8">
              <Logo size="xl" variant="horizontal" />
              <div className="text-right text-xs text-stone-500">
                <span className="font-bold text-stone-900 block">CATÁLOGO TÉCNICO OFICIAL</span>
                <span>Edición 2026 · {new Date().toLocaleDateString('es-PE')}</span>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t-4 border-yellow-400">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-950 tracking-tight leading-none mb-4">
                Catálogo General de Materiales de Construcción
              </h1>
              <p className="text-stone-600 text-base max-w-xl">
                Especificaciones normalizadas (NTP / ASTM), parámetros físicos y mecánicos,
                unidades de despacho y cotizaciones vigentes.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="mt-16 bg-stone-50 p-6 rounded-2xl border border-stone-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
                Índice de Líneas y Familias de Producto
              </h3>
              <div className="divide-y divide-stone-200 text-xs">
                {parentCategories.map((cat, idx) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} className="py-2.5 flex items-center justify-between">
                      <span className="font-bold text-stone-900">
                        {idx + 1}. {cat.name}
                      </span>
                      <span className="text-stone-500 font-mono">{count} material(es)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cover Footer */}
          <div className="pt-8 border-t border-stone-200 text-xs text-stone-500 flex justify-between items-end">
            <div>
              <strong className="text-stone-900 block">{storeSettings.name}</strong>
              <span>{storeSettings.address}, {storeSettings.city}</span>
              {storeSettings.ruc && <span className="block text-[11px] font-mono">RUC: {storeSettings.ruc}</span>}
            </div>
            <div className="text-right font-mono text-[11px]">
              <div>Tel: {storeSettings.phone}</div>
              <div>WhatsApp: +{storeSettings.whatsappNumber}</div>
              <div>Email: {storeSettings.email}</div>
            </div>
          </div>
        </section>

        {/* PRODUCTS BY CATEGORY */}
        {parentCategories.map((category) => {
          const categoryProducts = products.filter((p) => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} className="pt-8 print-avoid-break">
              <div className="border-b-2 border-stone-900 pb-2 mb-6 flex items-baseline justify-between">
                <h2 className="text-2xl font-black text-stone-950 tracking-tight">
                  {category.name}
                </h2>
                <span className="text-xs text-stone-500 font-mono">
                  {categoryProducts.length} productos
                </span>
              </div>

              <div className="space-y-6">
                {categoryProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-5 border border-stone-300 rounded-xl print-avoid-break bg-stone-50/40"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 uppercase tracking-wider mb-0.5">
                          {prod.sku && <span>SKU: {prod.sku}</span>}
                          {prod.brandName && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-stone-700">{prod.brandName}</span>
                            </>
                          )}
                          {prod.presentation && (
                            <>
                              <span>•</span>
                              <span>{prod.presentation}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-stone-950">
                          {prod.name}{prod.unit && !prod.name.toLowerCase().includes(prod.unit.toLowerCase()) ? ` (${prod.unit})` : ''}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-900 block">
                          A Cotizar Directo a Obra
                        </span>
                        {prod.unit && <span className="text-[11px] text-stone-500 block">por {prod.unit}</span>}
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed mb-3">
                      {prod.description}
                    </p>

                    {/* Parameters Table */}
                    {prod.attributes && prod.attributes.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] bg-white p-2.5 rounded-lg border border-stone-200">
                        {prod.attributes.map((attr, aIdx) => (
                          <div key={aIdx} className="flex justify-between border-b border-stone-100 py-0.5">
                            <span className="text-stone-500">{attr.key}:</span>
                            <span className="font-semibold text-stone-900 font-mono">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
