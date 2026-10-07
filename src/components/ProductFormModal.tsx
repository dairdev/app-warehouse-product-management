import React, { useState, useEffect } from 'react';
import { Product, ProductAttribute, ProductMedia, Brand } from '../types';
import { useStore } from '../context/StoreContext';
import { apiService } from '../services/apiService';
import { getMediaUrl } from '../utils/mediaUtils';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Upload,
  Link,
  Film,
  Layers,
  Check,
  Loader2,
} from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onClose,
  onSaved,
}) => {
  const { categories, brands, addBrand, addProduct, updateProduct, showToast } = useStore();

  const isEditing = Boolean(product);

  // Parent Categories
  const parentCategories = categories.filter((c) => c.parentId === null);

  // Field states
  const [categoryId, setCategoryId] = useState<string>(() => {
    if (product?.categoryId) return product.categoryId;
    return parentCategories.length > 0 ? parentCategories[0].id : '';
  });

  const [brandId, setBrandId] = useState<string>(product?.brandId || '');
  const [presentation, setPresentation] = useState<string>(product?.presentation || '');
  const [name, setName] = useState<string>(product?.name || '');

  const [currency, setCurrency] = useState<'PEN' | 'USD'>(product?.currency || 'PEN');
  const [unit, setUnit] = useState<string>(product?.unit || 'unidad');
  const [sku, setSku] = useState<string>(product?.sku || '');
  const [description, setDescription] = useState<string>(product?.description || '');
  const [featured, setFeatured] = useState<boolean>(product?.featured || false);

  // Quick New Brand modal state
  const [showQuickNewBrand, setShowQuickNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('Perú');

  // MULTIPLE MEDIA ITEMS (Photos & Videos)
  const [mediaList, setMediaList] = useState<ProductMedia[]>(() => {
    return product?.media && product.media.length > 0 ? product.media : [];
  });

  const [isUploading, setIsUploading] = useState(false);

  // Media input inputs
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newMediaTitle, setNewMediaTitle] = useState('');

  // Dynamic Attributes (EAV)
  const [attributes, setAttributes] = useState<ProductAttribute[]>(() => {
    return (
      product?.attributes || [
        { id: '1', key: 'Norma Técnica', value: 'NTP / ASTM' },
        { id: '2', key: 'Uso Recomendado', value: 'Obras civiles y edificaciones' },
      ]
    );
  });

  // Available presentations for selected category
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const categoryPresentations = selectedCategoryObj?.defaultPresentations || [];

  // When category changes, suggest presentation if available
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const newCatObj = categories.find((c) => c.id === newCatId);
    if (newCatObj?.defaultPresentations && newCatObj.defaultPresentations.length > 0) {
      setPresentation(newCatObj.defaultPresentations[0]);
    } else {
      setPresentation('');
    }
  };

  const handleAutoSku = () => {
    const cat = categories.find((c) => c.id === categoryId);
    const prefix = cat ? cat.name.substring(0, 3).toUpperCase() : 'MAT';
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${rand}`);
  };

  const handleCreateQuickBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const slug = newBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = addBrand({
      name: newBrandName.trim(),
      slug,
    });
    setBrandId(created.id);
    setNewBrandName('');
    setShowQuickNewBrand(false);
  };

  // MULTIPLE MEDIA HANDLERS
  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    const newMedia: ProductMedia = {
      id: 'med-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      type: newMediaType,
      url: newMediaUrl.trim(),
      title: newMediaTitle.trim() || (newMediaType === 'video' ? 'Video demostrativo' : 'Foto de producto'),
      sortOrder: mediaList.length + 1,
    };
    setMediaList((prev) => [...prev, newMedia]);
    setNewMediaUrl('');
    setNewMediaTitle('');
    showToast(`Elemento ${newMediaType === 'video' ? 'de video' : 'fotográfico'} agregado`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploading(true);
    showToast(`Subiendo ${fileList.length} archivo(s) al servidor Slim PHP...`);

    try {
      const uploadedItems = await apiService.uploadFiles(fileList);
      const newMediaItems: ProductMedia[] = uploadedItems.map((item, idx) => ({
        id: item.id || `med-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        type: item.type === 'video' ? 'video' : 'image',
        url: item.url,
        title: item.originalName || (item.type === 'video' ? 'Video demostrativo' : 'Foto de producto'),
        sortOrder: mediaList.length + idx + 1,
      }));

      setMediaList((prev) => [...prev, ...newMediaItems]);
      showToast(`${uploadedItems.length} archivo(s) guardado(s) exitosamente en el servidor`);
    } catch (err: unknown) {
      console.error('Error al subir archivos al servidor:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido al subir archivos al servidor';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (id: string) => {
    const itemToRemove = mediaList.find((m) => m.id === id);
    if (itemToRemove && itemToRemove.url.includes('/uploads/')) {
      const parts = itemToRemove.url.split('/uploads/');
      const filename = parts.pop();
      if (filename) {
        apiService.deleteUploadedFile(filename).catch((err) => {
          console.warn('No se pudo eliminar el archivo del servidor:', err);
        });
      }
    }
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  // Dynamic Attributes
  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', val: string) => {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: val } : attr))
    );
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor ingrese el nombre del material', 'error');
      return;
    }

    const cleanAttributes = attributes.filter((a) => a.key.trim() && a.value.trim());
    const selectedBrand = brands.find((b) => b.id === brandId);

    // Auto-assign to generic sub-category of selected category
    const genSubcat = categories.find((c) => c.parentId === categoryId && c.name.toLowerCase() === 'generic');
    const assignedSubcatId = genSubcat ? genSubcat.id : `sub-${categoryId}-generic`;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const productPayload = {
      name: name.trim(),
      slug,
      description: description.trim() || 'Material de construcción para obras civiles y edificación.',
      categoryId,
      subcategoryId: assignedSubcatId,
      brandId: brandId || undefined,
      brandName: selectedBrand?.name || undefined,
      presentation: presentation.trim() || undefined,
      price: null, // Price hidden from views/forms
      currency,
      unit: unit.trim() || 'unidad',
      sku: sku.trim() || undefined,
      featured,
      attributes: cleanAttributes,
      media: mediaList,
      tags: product?.tags || ['favorito'],
    };

    if (isEditing && product) {
      updateProduct(product.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-bold text-lg text-stone-900">
              {isEditing ? 'Editar Material de Construcción' : 'Registrar Nuevo Material'}
            </h3>
            <p className="text-xs text-stone-500">
              Gestor de especificaciones y catálogo de Almacenes Nor Oriente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* STEP 1: CLASIFICACIÓN, MARCA Y NOMBRE */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                1. Clasificación, Marca y Presentación
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Categoría */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Categoría Principal *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium"
                >
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Marca (Brand) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Marca del Material
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickNewBrand(!showQuickNewBrand)}
                    className="text-[11px] text-amber-800 hover:underline font-semibold"
                  >
                    {showQuickNewBrand ? 'Cancelar' : '+ Nueva Marca'}
                  </button>
                </div>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium"
                >
                  <option value="">-- Seleccionar Marca --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {/* Inline New Brand Creation */}
                {showQuickNewBrand && (
                  <div className="mt-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-stone-800 block">
                      Registrar Nueva Marca:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre de la marca"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickBrand}
                        className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Presentación / Medida */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Presentación / Medida
                </label>
                {categoryPresentations.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={presentation}
                      onChange={(e) => setPresentation(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium"
                    >
                      <option value="">-- Seleccionar o escribir manual --</option>
                      {categoryPresentations.map((pres) => (
                        <option key={pres} value={pres}>
                          {pres}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder={'O escribir otra medida (ej: 5/8", 42.5 kg)...'}
                      value={presentation}
                      onChange={(e) => setPresentation(e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={'Ej: 42.5 kg, 1/2", m³, Millar...'}
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  />
                )}
              </div>
            </div>

            {/* 4. NOMBRE DEL MATERIAL: Free text input */}
            <div className="pt-3 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-900 mb-1">
                Nombre del Material * <span className="font-normal text-stone-500">(Texto Libre)</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Cemento Portland Tipo I Sol 42.5 kg"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Ingrese libremente el nombre comercial o técnico del material para el catálogo.
              </p>
            </div>
          </div>

          {/* STEP 2: MULTIPLE MEDIA SELECTOR (PHOTOS OR VIDEOS) */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-700" />
                <span>2. Galería Multimedia (Múltiples Fotos o Videos)</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                {mediaList.length} archivo(s) agregado(s)
              </span>
            </div>

            {/* Add Media Inputs */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Type selector: Image or Video */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Tipo de medio
                  </label>
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="image">Fotografía (Imagen)</option>
                    <option value="video">Video Demostrativo</option>
                  </select>
                </div>

                {/* Media URL */}
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    URL de la Foto o Video
                  </label>
                  <input
                    type="text"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://... o ruta de archivo"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>

                {/* Add button */}
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddMediaUrl}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar por URL</span>
                  </button>
                </div>
              </div>

              {/* Upload Local Files Multiple */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <label
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    isUploading
                      ? 'bg-amber-100 text-stone-500 cursor-not-allowed'
                      : 'cursor-pointer bg-yellow-100 hover:bg-yellow-200 text-stone-900'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-amber-800 animate-spin" />
                      <span>Subiendo al servidor Slim PHP...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-amber-800" />
                      <span>Subir Fotos o Videos al Servidor</span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    disabled={isUploading}
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Preset Construction Photos */}
                <div className="flex items-center gap-1 text-[11px] text-stone-500">
                  <span>Preajustes:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaList((prev) => [
                        ...prev,
                        {
                          id: 'med-' + Date.now(),
                          type: 'image',
                          url: '/src/assets/images/cement_portland_bags_1790484625515.jpg',
                          title: 'Sacos de cemento en pallet',
                          sortOrder: prev.length + 1,
                        },
                      ])
                    }
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                  >
                    + Cemento
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaList((prev) => [
                        ...prev,
                        {
                          id: 'med-' + Date.now(),
                          type: 'image',
                          url: '/src/assets/images/construction_bricks_stack_1790484635426.jpg',
                          title: 'Ladrillos King Kong estibados',
                          sortOrder: prev.length + 1,
                        },
                      ])
                    }
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                  >
                    + Ladrillos
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaList((prev) => [
                        ...prev,
                        {
                          id: 'med-' + Date.now(),
                          type: 'image',
                          url: '/src/assets/images/deformed_steel_rebar_1790484644341.jpg',
                          title: 'Fierro y malla estructural',
                          sortOrder: prev.length + 1,
                        },
                      ])
                    }
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                  >
                    + Fierro
                  </button>
                </div>
              </div>
            </div>

            {/* Render Selected Media Grid */}
            {mediaList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {mediaList.map((media, idx) => (
                  <div
                    key={media.id || idx}
                    className="relative group bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs"
                  >
                    <div className="aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden">
                      {media.type === 'video' ? (
                        <div className="flex flex-col items-center justify-center text-amber-700 p-2 text-center">
                          <VideoIcon className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-bold">Video {idx + 1}</span>
                        </div>
                      ) : (
                        <img
                          src={getMediaUrl(media.url)}
                          alt={media.title || 'Foto'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="p-2 text-[10px] flex items-center justify-between bg-white border-t border-stone-100">
                      <span className="font-semibold truncate max-w-[80px] text-stone-700">
                        {media.type === 'video' ? '🎬 Video' : '📷 Foto'} #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(media.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-stone-300 text-center text-xs text-stone-400">
                Aún no has agregado fotos o videos para este producto.
              </div>
            )}
          </div>

          {/* STEP 3: PRICE (OPTIONAL) AND SKU (OPTIONAL) — NO STOCK FIELD! */}
          {/* STEP 3: UNIDAD Y CÓDIGO (Precios no visibles) */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
              3. Unidad de Despacho y Código SKU
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unidad */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Unidad de Medida / Despacho *
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="ej: bolsa, varilla, m³, millar, panel"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium"
                />
                <span className="text-[10px] text-stone-400 block mt-1">
                  Especifica cómo se comercializa y despacha este material.
                </span>
              </div>

              {/* Optional SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Código SKU <span className="font-normal text-stone-400">(Opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSku}
                    className="text-[11px] text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Autogenerar código</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="CEM-425 (opcional)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Descripción Técnica & Aplicación en Obra
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalle de resistencia, fraguado, usos recomendados en vigas, zapatas o muros..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          {/* STEP 4: DYNAMIC TECHNICAL PARAMETERS (EAV) */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                4. Parámetros Técnicos Certificados (EAV)
              </span>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Parámetro</span>
              </button>
            </div>

            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div key={attr.id || idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Parámetro (ej: Resistencia, Norma, Rendimiento)"
                    value={attr.key}
                    onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                    className="w-1/2 text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Valor certificado (ej: f'c 210 kg/cm², NTP 334.009)"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    className="w-1/2 text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-stone-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl shadow-xs transition-colors"
            >
              {isEditing ? 'Guardar Cambios' : 'Registrar Material en Catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
