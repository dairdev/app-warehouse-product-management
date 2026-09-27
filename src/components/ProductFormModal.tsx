import React, { useState, useEffect } from 'react';
import { Product, ProductAttribute, ProductMedia, Brand } from '../types';
import { useStore } from '../context/StoreContext';
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

  const [subcategoryId, setSubcategoryId] = useState<string>(product?.subcategoryId || '');
  const [brandId, setBrandId] = useState<string>(product?.brandId || '');
  const [presentation, setPresentation] = useState<string>(product?.presentation || '');
  const [name, setName] = useState<string>(product?.name || '');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState<boolean>(isEditing);

  // Optional price and sku
  const [price, setPrice] = useState<string>(
    product && product.price !== undefined && product.price !== null ? product.price.toString() : ''
  );
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

  // Available subcategories for selected category
  const subcategories = categories.filter((c) => c.parentId === categoryId);

  // Available presentations for selected category
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const categoryPresentations = selectedCategoryObj?.defaultPresentations || [];

  // When category changes, reset subcategory and suggest presentation if not editing
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setSubcategoryId('');
    const newCatObj = categories.find((c) => c.id === newCatId);
    if (newCatObj?.defaultPresentations && newCatObj.defaultPresentations.length > 0) {
      setPresentation(newCatObj.defaultPresentations[0]);
    } else {
      setPresentation('');
    }
  };

  // Auto-concatenation effect:
  // "Material name move it after select category, sub category, brand and presentation;
  // so the name is the result of concat Sub Category + Brand + Presentation"
  useEffect(() => {
    if (!isNameManuallyEdited) {
      const subcatObj = categories.find((c) => c.id === subcategoryId);
      const brandObj = brands.find((b) => b.id === brandId);

      const parts: string[] = [];
      if (subcatObj) {
        parts.push(subcatObj.name);
      } else if (selectedCategoryObj) {
        parts.push(selectedCategoryObj.name);
      }

      if (brandObj) {
        parts.push(brandObj.name);
      }

      if (presentation.trim()) {
        parts.push(presentation.trim());
      }

      if (parts.length > 0) {
        setName(parts.join(' '));
      }
    }
  }, [categoryId, subcategoryId, brandId, presentation, isNameManuallyEdited, categories, brands, selectedCategoryObj]);

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
      origin: newBrandOrigin.trim() || 'Perú',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          const newMedia: ProductMedia = {
            id: 'med-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            type: isVideo ? 'video' : 'image',
            url: resultUrl,
            title: file.name,
            sortOrder: mediaList.length + 1,
          };
          setMediaList((prev) => [...prev, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
    showToast(`${files.length} archivo(s) cargado(s) a la galería`);
    // Clear input
    e.target.value = '';
  };

  const handleRemoveMedia = (id: string) => {
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

    const priceNum = price.trim() !== '' ? parseFloat(price) : null;
    const cleanAttributes = attributes.filter((a) => a.key.trim() && a.value.trim());
    const selectedBrand = brands.find((b) => b.id === brandId);

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const productPayload = {
      name: name.trim(),
      slug,
      description: description.trim() || 'Material de construcción para obras civiles y edificación.',
      categoryId,
      subcategoryId: subcategoryId || null,
      brandId: brandId || undefined,
      brandName: selectedBrand?.name || undefined,
      presentation: presentation.trim() || undefined,
      price: priceNum,
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
          {/* STEP 1: CATEGORY, SUBCATEGORY, BRAND & PRESENTATION */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                1. Clasificación, Marca y Presentación
              </span>
              <span className="text-[11px] text-stone-400">
                Genera el nombre automáticamente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* 2. Subcategoría */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Subcategoría
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium"
                >
                  <option value="">-- Sin subcategoría específica --</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Marca (Brand) */}
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
                      {b.name} ({b.origin || 'Nacional'})
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

              {/* 4. Presentación (Related to Category) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Presentación / Medida (de {selectedCategoryObj?.name})
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
                      placeholder={'O escribir otra medida personalizada (ej: 5/8", 42.5 kg)...'}
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

            {/* 5. NOMBRE DEL MATERIAL: PLACED AFTER Category, Subcategory, Brand, Presentation! */}
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-900">
                  Nombre del Material * (Concatenación: Subcategoría + Marca + Presentación)
                </label>
                <button
                  type="button"
                  onClick={() => setIsNameManuallyEdited(false)}
                  className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-medium"
                  title="Re-concatenar automáticamente con los valores seleccionados arriba"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Autogenerar nombre</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsNameManuallyEdited(true);
                }}
                placeholder="Subcategoría + Marca + Presentación"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-yellow-400 bg-white font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Puedes ajustar manualmente el nombre si necesitas especificar características adicionales.
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
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-stone-900 rounded-lg font-semibold transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-800" />
                  <span>Subir Múltiples Fotos o Videos Locales</span>
                  <input
                    type="file"
                    multiple
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
                          src={media.url}
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
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
              3. Precio y Código (Ambos Opcionales)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Optional Price */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Precio de Venta <span className="font-normal text-stone-400">(Opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Dejar vacío para 'A Cotizar'"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white font-mono"
                />
                <span className="text-[10px] text-stone-400 block mt-1">
                  Si no se especifica, se muestra como "A Cotizar / Consultar".
                </span>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD')}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="PEN">Soles (PEN S/.)</option>
                  <option value="USD">Dólares (USD $)</option>
                </select>
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Unidad de Medida / Despacho
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="ej: bolsa, varilla, m³, millar, panel"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Optional SKU */}
              <div className="sm:col-span-3">
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
                  placeholder="Ej: ACE-COR-050 (opcional)"
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
