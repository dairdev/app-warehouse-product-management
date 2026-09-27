import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Bookmark, Plus, X, Check, UserCheck, Construction } from 'lucide-react';

interface TagModalProps {
  product: Product;
  onClose: () => void;
  onNavigateToProfile?: () => void;
}

export const TagModal: React.FC<TagModalProps> = ({
  product,
  onClose,
  onNavigateToProfile,
}) => {
  const {
    tags,
    clientProfile,
    tagProduct,
    untagProduct,
    updateClientProfile,
    showToast,
  } = useStore();

  const [newTagInput, setNewTagInput] = useState('');
  const [clientName, setClientName] = useState(clientProfile.name);
  const [clientPhone, setClientPhone] = useState(clientProfile.phone);
  const [clientObra, setClientObra] = useState(clientProfile.obraProjectName || '');
  const [editingProfile, setEditingProfile] = useState(!clientProfile.name);

  // Check which tags the product currently has for this client
  const activeTagsForProduct = clientProfile.taggedProductIds
    .filter((item) => item.productId === product.id)
    .map((item) => item.tag);

  const handleToggleTag = (tagSlug: string) => {
    if (activeTagsForProduct.includes(tagSlug)) {
      untagProduct(product.id, tagSlug);
    } else {
      tagProduct(product.id, tagSlug);
    }
  };

  const handleCreateCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return;
    tagProduct(product.id, clean);
    setNewTagInput('');
    showToast(`Etiqueta personalizada "${clean}" agregada`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientProfile({
      name: clientName,
      phone: clientPhone,
      obraProjectName: clientObra,
    });
    setEditingProfile(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500 fill-yellow-400" />
            <h3 className="font-bold text-base text-stone-900">Etiquetar Material para tu Obra</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Target Product Info */}
          <div className="text-xs text-stone-500">
            Producto seleccionado:
            <div className="text-sm font-bold text-stone-900 mt-0.5 line-clamp-1">
              {product.name}
            </div>
          </div>

          {/* Client Profile Identification */}
          <div className="p-3 bg-yellow-50/60 border border-yellow-200/70 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Perfil de Cliente / Obra</span>
              </div>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="text-[11px] text-amber-800 hover:underline font-medium"
              >
                {editingProfile ? 'Cancelar' : 'Editar datos'}
              </button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-2 mt-2">
                <input
                  type="text"
                  placeholder="Tu Nombre o Empresa"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Teléfono / WhatsApp"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nombre de la Obra"
                    value={clientObra}
                    onChange={(e) => setClientObra(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1 text-xs font-semibold bg-stone-900 text-white rounded-lg"
                >
                  Guardar en mi dispositivo
                </button>
              </form>
            ) : (
              <div className="text-xs text-stone-700">
                <span className="font-semibold">{clientProfile.name || 'Sin nombre registrado'}</span>
                {clientProfile.obraProjectName && (
                  <span className="text-stone-500 block text-[11px]">
                    Obra: {clientProfile.obraProjectName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Preset Tags Selection (Interactive segmented buttons with active state) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Seleccionar Etiquetas
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = activeTagsForProduct.includes(tag.slug);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.slug)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-yellow-400 border-yellow-500 text-stone-900 font-bold shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom tag */}
          <form onSubmit={handleCreateCustomTag} className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Nueva etiqueta (ej: Fase-2, Techo)..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear</span>
            </button>
          </form>

          {/* Link to Client Profile summary */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">
              {clientProfile.taggedProductIds.length} materiales en total guardados
            </span>
            {onNavigateToProfile && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToProfile();
                }}
                className="font-semibold text-amber-800 hover:underline"
              >
                Ver lista completa de etiquetas →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
