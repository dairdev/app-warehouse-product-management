import React, { useState, useRef } from 'react';
import { Machinery, MachineryCategory } from '../types';
import { useStore } from '../context/StoreContext';
import { X, Check, Truck, AlertCircle, Upload, Camera, Image, Sparkles, Loader2, Star, Trash2, Plus } from 'lucide-react';
import { compressImageFile } from '../utils/imageUtils';
import { apiService } from '../services/apiService';

interface MachineryFormModalProps {
  machinery?: Machinery | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MachineryFormModal: React.FC<MachineryFormModalProps> = ({
  machinery,
  isOpen,
  onClose,
}) => {
  const { addMachinery, updateMachinery, machineryBrands, showToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [name, setName] = useState(machinery?.name || '');
  const [brand, setBrand] = useState(machinery?.brand || (machineryBrands[0]?.name || 'Caterpillar (CAT)'));
  const [model, setModel] = useState(machinery?.model || '');
  const [category, setCategory] = useState<MachineryCategory>(machinery?.category || 'pesada');
  const [description, setDescription] = useState(machinery?.description || '');
  const [year, setYear] = useState<number>(machinery?.year || new Date().getFullYear());
  const [powerHp, setPowerHp] = useState(machinery?.powerHp || '');
  const [capacity, setCapacity] = useState(machinery?.capacity || '');
  const [operatingWeight, setOperatingWeight] = useState(machinery?.operatingWeight || '');
  const [fuelType, setFuelType] = useState<'Diesel' | 'Gasolina' | 'Eléctrico' | 'Bifásico/Trifásico'>(
    machinery?.fuelType || 'Diesel'
  );
  const [imageUrl, setImageUrl] = useState(
    machinery?.imageUrl || '/src/assets/images/backhoe_loader_1791133840461.jpg'
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (machinery?.galleryImages && machinery.galleryImages.length > 0) {
      return machinery.galleryImages;
    }
    return machinery?.imageUrl ? [machinery.imageUrl] : ['/src/assets/images/backhoe_loader_1791133840461.jpg'];
  });
  const [urlInput, setUrlInput] = useState('');
  const [hourlyRate, setHourlyRate] = useState<string>(
    machinery?.hourlyRate !== undefined && machinery?.hourlyRate !== null ? String(machinery.hourlyRate) : ''
  );
  const [dailyRate, setDailyRate] = useState<string>(
    machinery?.dailyRate !== undefined && machinery?.dailyRate !== null ? String(machinery.dailyRate) : ''
  );
  const [monthlyRate, setMonthlyRate] = useState<string>(
    machinery?.monthlyRate !== undefined && machinery?.monthlyRate !== null ? String(machinery.monthlyRate) : ''
  );
  const [minRentalHours, setMinRentalHours] = useState<number>(machinery?.minRentalHours || 8);
  const [includesOperator, setIncludesOperator] = useState<boolean>(machinery?.includesOperator ?? true);
  const [operatorDetails, setOperatorDetails] = useState(machinery?.operatorDetails || '');
  const [deliveryConditions, setDeliveryConditions] = useState(machinery?.deliveryConditions || '');
  const [status, setStatus] = useState<'available' | 'rented' | 'maintenance'>(
    machinery?.status || 'available'
  );

  if (!isOpen) return null;

  const categoryNames: Record<MachineryCategory, string> = {
    pesada: 'Maquinaria Pesada',
    liviana: 'Maquinaria Liviana',
    concreto: 'Equipos de Concreto',
    compactacion: 'Compactación & Suelos',
    transporte: 'Transporte & Carga',
    demolicion_energia: 'Demolición & Energía',
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImage(true);
    try {
      showToast(`Optimizando y procesando ${files.length} foto(s)...`);
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 1. Client-side canvas compression: turns 1MB-15MB photos into ~35KB - 70KB
        const compressed = await compressImageFile(file, {
          maxWidth: 1000,
          maxHeight: 800,
          quality: 0.75,
          maxSizeBytes: 70 * 1024,
        });

        let finalUrl = compressed.dataUrl;
        // 2. Attempt to upload the optimized file to the backend
        try {
          const uploadResult = await apiService.uploadFile(compressed.file);
          if (uploadResult && uploadResult.url) {
            finalUrl = uploadResult.url;
          }
        } catch (uploadErr) {
          console.warn('Backend upload skipped, using optimized client data URL fallback:', uploadErr);
        }
        newUrls.push(finalUrl);
      }

      setGalleryImages((prev) => {
        const combined = [...prev, ...newUrls];
        return combined;
      });

      // If current primary image is empty or placeholder, set first uploaded as primary
      if (!imageUrl || imageUrl.includes('backhoe_loader_1791133840461.jpg')) {
        setImageUrl(newUrls[0]);
      }
      showToast(`${newUrls.length} fotografía(s) agregadas a la galería`);
    } catch (err: unknown) {
      console.error('Error al procesar foto:', err);
      const msg = err instanceof Error ? err.message : 'Error al procesar las fotos seleccionadas';
      showToast(msg, 'error');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrlToGallery = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setGalleryImages((prev) => [...prev, url]);
    if (!imageUrl) setImageUrl(url);
    setUrlInput('');
    showToast('Foto agregada a la galería');
  };

  const handleSetPrimary = (img: string) => {
    setImageUrl(img);
    setGalleryImages((prev) => (prev.includes(img) ? prev : [img, ...prev]));
    showToast('Foto de portada actualizada', 'info');
  };

  const handleRemoveImage = (imgToRemove: string) => {
    setGalleryImages((prev) => {
      const filtered = prev.filter((item) => item !== imgToRemove);
      if (imageUrl === imgToRemove) {
        setImageUrl(filtered[0] || '/src/assets/images/backhoe_loader_1791133840461.jpg');
      }
      return filtered;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const finalPrimary = imageUrl.trim() || galleryImages[0] || '/src/assets/images/backhoe_loader_1791133840461.jpg';
    const finalGallery = galleryImages.length > 0 ? galleryImages : [finalPrimary];

    const data: Omit<Machinery, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      slug,
      category,
      categoryName: categoryNames[category],
      brand: brand.trim() || 'Genérica',
      model: model.trim() || 'Estándar',
      description: description.trim(),
      year: Number(year) || undefined,
      powerHp: powerHp.trim() || undefined,
      capacity: capacity.trim() || undefined,
      operatingWeight: operatingWeight.trim() || undefined,
      fuelType,
      imageUrl: finalPrimary,
      galleryImages: finalGallery,
      hourlyRate: null, // Price hidden from views/forms
      dailyRate: null,
      monthlyRate: null,
      currency: 'PEN',
      minRentalHours: Number(minRentalHours) || 8,
      includesOperator,
      operatorDetails: operatorDetails.trim() || undefined,
      deliveryConditions: deliveryConditions.trim() || undefined,
      status,
      featured: true,
    };

    if (machinery) {
      updateMachinery(machinery.id, data);
    } else {
      addMachinery(data);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Fixed & Compact */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 leading-tight">
                {machinery ? `Editar Maquinaria: ${machinery.name}` : 'Registrar Nueva Máquina o Equipo'}
              </h3>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Ficha técnica y disponibilidad para alquiler de equipos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable with optimized compact grid */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
          <div className="overflow-y-auto px-4 py-3 sm:px-5 sm:py-3.5 flex-1 min-h-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Name */}
              <div className="sm:col-span-2 md:col-span-2">
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Nombre Completo del Equipo / Máquina *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Retroexcavadora Caterpillar 420F2 4x4"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold text-stone-900 text-xs"
                />
              </div>

              {/* Status */}
              <div className="sm:col-span-1 md:col-span-1">
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Estado de Disponibilidad
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs bg-white font-medium text-stone-800"
                >
                  <option value="available">Disponible en Almacén</option>
                  <option value="rented">En Obra / Alquilado</option>
                  <option value="maintenance">En Mantenimiento</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MachineryCategory)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs bg-white"
                >
                  <option value="pesada">Maquinaria Pesada</option>
                  <option value="liviana">Maquinaria Liviana (Bobcat)</option>
                  <option value="concreto">Equipos de Concreto (Trompos)</option>
                  <option value="compactacion">Compactación & Suelos</option>
                  <option value="transporte">Transporte & Carga</option>
                  <option value="demolicion_energia">Demolición & Energía</option>
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Marca Fabricante *
                </label>
                <select
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-stone-900 bg-white text-xs"
                >
                  <option value="">-- Seleccionar Marca --</option>
                  {machineryBrands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.origin || 'Nacional'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Modelo / Versión
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej: 420F2, S570, WP1550..."
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Año de Fabricación
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-xs"
                />
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Combustible / Energía
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as any)}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs bg-white"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="Bifásico/Trifásico">Bifásico / Trifásico</option>
                </select>
              </div>

              {/* Engine Power */}
              <div>
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Potencia del Motor
                </label>
                <input
                  type="text"
                  value={powerHp}
                  onChange={(e) => setPowerHp(e.target.value)}
                  placeholder="Ej: 93 HP, 13 HP, 65 kVA..."
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs"
                />
              </div>

              {/* Capacity */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Capacidad de Carga / Cucharón / Tolva
                </label>
                <input
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Ej: Pala 1.0 m³, Tolva 15 m³, 11 p³, 2.5 Tn..."
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs"
                />
              </div>

              {/* Prominent Photo Section with Multi-Image Gallery and Large Preview */}
              <div className="sm:col-span-2 md:col-span-3 p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-stone-700" />
                    <label className="font-bold text-stone-900 text-xs">
                      Fotografías del Equipo (Galería Múltiple) *
                    </label>
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {galleryImages.length} foto(s) · Vista ampliada
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3.5">
                  {/* Significantly Increased Image Preview Box */}
                  <div className="w-full sm:w-56 h-36 sm:h-40 rounded-xl overflow-hidden bg-stone-900/5 border-2 border-stone-300 flex-shrink-0 relative group shadow-xs flex items-center justify-center">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt="Vista previa de maquinaria"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 shadow-xs pointer-events-none">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span>Portada Principal</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[11px] p-3 text-center">
                        <Camera className="w-8 h-8 mb-1.5 text-stone-300" />
                        <span>Sin foto cargada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full flex flex-col justify-between space-y-2">
                    {/* File Upload Button (Multiple Allowed) */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 sm:py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isProcessingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-950" />
                            <span>Optimizando fotos...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Fotos (Múltiples)</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingImage}
                        onClick={() => {
                          const defaultImg = '/src/assets/images/backhoe_loader_1791133840461.jpg';
                          setImageUrl(defaultImg);
                          if (!galleryImages.includes(defaultImg)) {
                            setGalleryImages((prev) => [defaultImg, ...prev]);
                          }
                        }}
                        className="px-2 py-1 text-stone-500 hover:text-stone-800 text-[11px] underline disabled:opacity-50"
                      >
                        Restablecer foto base
                      </button>
                    </div>

                    {/* URL Input with Add button */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-stone-500 font-medium">
                        O agregar foto por enlace web (URL pública):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddUrlToGallery();
                            }
                          }}
                          placeholder="https://... (URL directa de fotografía)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-[11px] bg-white text-stone-700"
                        />
                        <button
                          type="button"
                          onClick={handleAddUrlToGallery}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Añadir</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Compresión automática activa: optimiza fotos múltiples a ~50 KB cada una.</span>
                    </div>
                  </div>
                </div>

                {/* Gallery Thumbnails Strip */}
                {galleryImages.length > 0 && (
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-stone-700">
                        Fotos en la Galería ({galleryImages.length})
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Haz clic en una miniatura para verla o cambiar portada
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 max-h-24 overflow-y-auto">
                      {galleryImages.map((img, idx) => {
                        const isPrimary = img === imageUrl;
                        return (
                          <div
                            key={idx}
                            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                              isPrimary
                                ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                                : 'border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Foto ${idx + 1}`}
                              onClick={() => handleSetPrimary(img)}
                              className="w-14 h-12 object-cover cursor-pointer"
                              title="Clic para establecer como portada principal"
                            />
                            {isPrimary && (
                              <span className="absolute top-0.5 left-0.5 bg-amber-500 text-stone-950 p-0.5 rounded shadow-xs pointer-events-none">
                                <Star className="w-2.5 h-2.5 fill-stone-950" />
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(img)}
                                  title="Fijar como portada"
                                  className="p-1 bg-white hover:bg-yellow-300 text-stone-900 rounded-md text-[10px]"
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                              )}
                              {galleryImages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(img)}
                                  title="Eliminar de galería"
                                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px]"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Description */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-stone-700 text-[11px] mb-1">
                  Descripción Técnica & Aplicación en Obra
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles de excavación, zanjas, rendimiento horario, implementos incluidos..."
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer - Fixed & Visible in Short Viewports */}
          <div className="px-5 py-2.5 sm:py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2.5 shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold text-xs hover:bg-stone-200/50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl flex items-center gap-1.5 shadow-xs text-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{machinery ? 'Guardar Cambios' : 'Registrar Equipo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
