import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import {
  Bookmark,
  Send,
  Trash2,
  FileDown,
  Printer,
  User,
  Building,
  Phone,
  ArrowLeft,
  Check,
  Package,
} from 'lucide-react';
import { formatCurrency, getQuoteWhatsAppUrl, STORE_INFO } from '../utils/shareUtils';
import { getMediaUrl } from '../utils/mediaUtils';

interface ClientProfileViewProps {
  onBackToCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenShareModal: (product: Product) => void;
}

export const ClientProfileView: React.FC<ClientProfileViewProps> = ({
  onBackToCatalog,
  onSelectProduct,
  onOpenShareModal,
}) => {
  const {
    products,
    tags,
    clientProfile,
    storeSettings,
    updateClientProfile,
    untagProduct,
    showToast,
  } = useStore();

  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [name, setName] = useState(clientProfile.name);
  const [phone, setPhone] = useState(clientProfile.phone);
  const [email, setEmail] = useState(clientProfile.email);
  const [obra, setObra] = useState(clientProfile.obraProjectName || '');
  const [notes, setNotes] = useState(clientProfile.notes || '');
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Get tagged products
  const taggedItems = clientProfile.taggedProductIds;
  const uniqueTaggedProductIds = Array.from(new Set(taggedItems.map((t) => t.productId)));

  const taggedProducts = products.filter((p) => uniqueTaggedProductIds.includes(p.id));

  const filteredTaggedProducts = taggedProducts.filter((product) => {
    if (activeTagFilter === 'all') return true;
    return clientProfile.taggedProductIds.some(
      (item) => item.productId === product.id && item.tag === activeTagFilter
    );
  });

  // Calculate total estimated cost
  const totalCost = filteredTaggedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const itemsWithoutPrice = filteredTaggedProducts.filter((p) => !p.price || p.price <= 0).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientProfile({
      name,
      phone,
      email,
      obraProjectName: obra,
      notes,
    });
    setIsEditingInfo(false);
  };

  const whatsappQuoteUrl = getQuoteWhatsAppUrl(filteredTaggedProducts, clientProfile, storeSettings);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>

          <span className="text-xs text-stone-500 font-medium">
            {storeSettings.profileHeaderSubtitle || 'Perfil de Obra & Lista de Materiales Etiquetados'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Client Profile Card (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    {storeSettings.profileHeaderTitle || 'Datos de la Obra / Cliente'}
                  </h3>
                  <span className="text-[11px] text-stone-400">Guardado en este navegador</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="text-xs font-semibold text-amber-800 hover:underline"
              >
                {isEditingInfo ? 'Cerrar' : 'Editar'}
              </button>
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Nombre o Razón Social
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ing. Carlos Mendoza / Constructora"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Proyecto / Obra
                  </label>
                  <input
                    type="text"
                    value={obra}
                    onChange={(e) => setObra(e.target.value)}
                    placeholder="Residencial Los Olivos Mz B"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Instrucciones de Despacho
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descarga con cuadrilla o pluma grúa..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold"
                >
                  Guardar Cambios
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                    Cliente / Contratista
                  </span>
                  <span className="font-bold text-stone-900 text-sm">
                    {clientProfile.name || 'Sin especificar'}
                  </span>
                </div>

                {clientProfile.phone && (
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                      Contacto
                    </span>
                    <span className="text-stone-700 font-mono">{clientProfile.phone}</span>
                  </div>
                )}

                {clientProfile.obraProjectName && (
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                      Obra / Destino
                    </span>
                    <span className="text-stone-700">{clientProfile.obraProjectName}</span>
                  </div>
                )}

                {clientProfile.notes && (
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                      Notas de entrega
                    </span>
                    <span className="text-stone-600 italic">{clientProfile.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Quote Summary Card */}
            <div className="pt-4 border-t border-stone-100 bg-stone-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <span className="text-xs text-stone-500 block mb-1">Total Referencial de Materiales:</span>
              <div className="text-2xl font-black text-stone-950 tabular-nums">
                {formatCurrency(totalCost)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 mb-4">
                Sujeto a flete según distancia y volumen de carga.
              </p>

              {filteredTaggedProducts.length > 0 ? (
                <a
                  href={whatsappQuoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Cotización por WhatsApp</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-stone-200 text-stone-400 text-xs font-bold rounded-xl cursor-not-allowed"
                >
                  Sin materiales seleccionados
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Tagged Products List (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Tag Filter Tabs */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>Materiales Guardados por Etiqueta ({taggedProducts.length})</span>
                </h3>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setActiveTagFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    activeTagFilter === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Todos ({taggedProducts.length})
                </button>
                {tags.map((t) => {
                  const count = clientProfile.taggedProductIds.filter((item) => item.tag === t.slug).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTagFilter(t.slug)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        activeTagFilter === t.slug
                          ? 'bg-yellow-400 text-stone-950 shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      #{t.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tagged Items List */}
            {filteredTaggedProducts.length > 0 ? (
              <div className="space-y-3">
                {filteredTaggedProducts.map((prod) => {
                  const assignedTags = clientProfile.taggedProductIds
                    .filter((item) => item.productId === prod.id)
                    .map((item) => item.tag);

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {prod.media && prod.media[0] ? (
                          <img
                            src={getMediaUrl(prod.media[0].url)}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover border border-stone-100 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-stone-300" />
                          </div>
                        )}

                        <div className="min-w-0">
                          {prod.sku && (
                            <span className="text-[11px] font-mono text-stone-400 block">
                              SKU: {prod.sku}
                            </span>
                          )}
                          <h4
                            onClick={() => onSelectProduct(prod)}
                            className="font-bold text-sm text-stone-900 truncate hover:text-amber-800 cursor-pointer"
                          >
                            {prod.name}
                          </h4>
                          {(prod.brandName || prod.presentation) && (
                            <div className="text-xs text-stone-600 mt-0.5">
                              {prod.brandName ? <span className="font-semibold text-amber-900">{prod.brandName} </span> : null}
                              {prod.presentation ? <span className="font-mono text-stone-500">· {prod.presentation}</span> : null}
                            </div>
                          )}

                          {/* Tag Badges */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {assignedTags.map((tagSlug) => (
                              <span
                                key={tagSlug}
                                className="text-[10px] font-semibold bg-yellow-100 text-stone-800 px-2 py-0.5 rounded"
                              >
                                #{tagSlug}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 gap-2 shrink-0">
                        <div className="text-right">
                          {prod.price && prod.price > 0 ? (
                            <>
                              <span className="text-sm font-black text-stone-900 tabular-nums">
                                {formatCurrency(prod.price, prod.currency)}
                              </span>
                              <span className="text-[11px] text-stone-400 block">por {prod.unit || 'unidad'}</span>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-amber-800">
                              A Cotizar
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectProduct(prod)}
                            className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-800"
                          >
                            Ver Ficha
                          </button>
                          <button
                            onClick={() => {
                              // untag all tags for this product in client profile
                              assignedTags.forEach((t) => untagProduct(prod.id, t));
                            }}
                            className="p-1 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Quitar de mis etiquetas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <Bookmark className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-stone-900 mb-1">
                  Aún no tienes materiales guardados
                </h4>
                <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
                  Explora el catálogo público y haz clic en el ícono de marcador para etiquetar
                  productos de tu interés.
                </p>
                <button
                  onClick={onBackToCatalog}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl text-xs font-bold"
                >
                  Explorar Catálogo de Materiales
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
