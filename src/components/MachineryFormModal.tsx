import React, { useState, useRef } from 'react';
import { Machinery, MachineryCategory } from '../types';
import { useStore } from '../context/StoreContext';
import { X, Check, Truck, AlertCircle, Upload, Camera, Image, Sparkles } from 'lucide-react';

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
  const { addMachinery, updateMachinery, machineryBrands } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImageUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

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
      imageUrl: imageUrl.trim() || '/src/assets/images/backhoe_loader_1791133840461.jpg',
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 relative">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-stone-900">
              {machinery ? `Editar Maquinaria: ${machinery.name}` : 'Registrar Nueva Máquina o Equipo'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Nombre Completo del Equipo / Máquina *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Retroexcavadora Caterpillar 420F2 4x4"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MachineryCategory)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="pesada">Maquinaria Pesada</option>
                <option value="liviana">Maquinaria Liviana (Bobcat)</option>
                <option value="concreto">Equipos de Concreto (Trompos)</option>
                <option value="compactacion">Compactación & Suelos (Planchas, Rodillos)</option>
                <option value="transporte">Transporte & Carga (Volquetes)</option>
                <option value="demolicion_energia">Demolición & Energía</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Estado de Disponibilidad
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="available">Disponible en Almacén</option>
                <option value="rented">En Obra / Alquilado</option>
                <option value="maintenance">En Mantenimiento Preventivo</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Marca Fabricante *
              </label>
              <select
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-stone-900 bg-white"
              >
                <option value="">-- Seleccionar Marca --</option>
                {machineryBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.origin || 'Nacional'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Modelo / Versión
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej: 420F2, S570, WP1550..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Año de Fabricación
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tipo de Combustible / Energía
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="Diesel">Diesel</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Bifásico/Trifásico">Bifásico / Trifásico</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Potencia del Motor
              </label>
              <input
                type="text"
                value={powerHp}
                onChange={(e) => setPowerHp(e.target.value)}
                placeholder="Ej: 93 HP, 13 HP, 65 kVA..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Capacidad de Carga / Cucharón / Tolva
              </label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Ej: Pala 1.0 m³, Tolva 15 m³, 11 p³..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Upload Photos Section */}
            <div className="sm:col-span-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-stone-900">
                  Fotografía de la Maquinaria *
                </label>
                <span className="text-[11px] text-stone-400">
                  Sube archivo local o ingresa URL
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Image Preview Thumbnail */}
                <div className="w-28 h-20 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 flex-shrink-0 relative group">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[10px]">
                      <Camera className="w-6 h-6 mb-1 text-stone-400" />
                      Sin foto
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  {/* File Upload Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir Foto desde Dispositivo</span>
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('/src/assets/images/backhoe_loader_1791133840461.jpg')}
                        className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 text-[11px] underline"
                      >
                        Restablecer foto predeterminada
                      </button>
                    )}
                  </div>

                  {/* URL Text Input Option */}
                  <div className="relative">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="O pegar URL directa de la imagen (https://...)"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-[11px] bg-white text-stone-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Descripción Técnica & Aplicación en Obra
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles de excavación, zanjas, rendimiento horario..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
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
