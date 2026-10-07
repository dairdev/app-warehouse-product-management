import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { MachineryBrand } from '../types';
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  Globe,
  Truck,
  Check,
  X,
  Sparkles,
  Building,
} from 'lucide-react';

export const MachineryBrandManagement: React.FC = () => {
  const {
    machineryBrands,
    addMachineryBrand,
    updateMachineryBrand,
    deleteMachineryBrand,
    machineries,
    showToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<MachineryBrand | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('EE.UU.');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const filteredBrands = useMemo(() => {
    return machineryBrands.filter((b) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.origin && b.origin.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
    });
  }, [machineryBrands, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setName('');
    setOrigin('EE.UU.');
    setDescription('');
    setLogoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: MachineryBrand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setOrigin(brand.origin || 'EE.UU.');
    setDescription(brand.description || '');
    setLogoUrl(brand.logoUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor ingrese el nombre de la marca', 'error');
      return;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (editingBrand) {
      updateMachineryBrand(editingBrand.id, {
        name: name.trim(),
        origin: origin.trim() || 'Internacional',
        description: description.trim(),
        slug,
        logoUrl: logoUrl.trim() || undefined,
      });
      showToast(`Marca "${name}" actualizada correctamente`, 'success');
    } else {
      addMachineryBrand({
        name: name.trim(),
        origin: origin.trim() || 'Internacional',
        description: description.trim(),
        slug,
        logoUrl: logoUrl.trim() || undefined,
      });
      showToast(`Nueva marca "${name}" registrada para alquiler de maquinaria`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (brand: MachineryBrand) => {
    const associatedMachines = machineries.filter(
      (m) => m.brand.toLowerCase() === brand.name.toLowerCase()
    );
    if (associatedMachines.length > 0) {
      const confirmDelete = window.confirm(
        `Hay ${associatedMachines.length} máquina(s) asociada(s) a la marca "${brand.name}". ¿Desea eliminar la marca de todas formas?`
      );
      if (!confirmDelete) return;
    }

    deleteMachineryBrand(brand.id);
    showToast(`Marca "${brand.name}" eliminada`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-stone-900">
              Gestión de Marcas de Maquinaria
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Fabricantes de equipos pesados, minicargadores, volquetes y herramientas certificadas para alquiler en obra.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Marca de Maquinaria</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar marca por nombre, país de origen o especialidad..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-xs"
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

        <span className="text-xs text-stone-500 font-medium">
          Total de Marcas: <strong className="text-stone-900 font-bold">{machineryBrands.length}</strong>
        </span>
      </div>

      {/* Grid of Machinery Brands */}
      {filteredBrands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => {
            const count = machineries.filter(
              (m) => m.brand.toLowerCase() === brand.name.toLowerCase()
            ).length;

            return (
              <div
                key={brand.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-yellow-400/70 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-black flex items-center justify-center text-sm shadow-xs">
                        {brand.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{brand.name}</h4>
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                          <Globe className="w-3 h-3 text-stone-400" />
                          <span>{brand.origin || 'Internacional'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(brand)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Editar marca de maquinaria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar marca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed mb-4 mt-2">
                    {brand.description || 'Fabricante de maquinaria pesada y equipos certificados para construcción civil.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px]">Equipos en Flota:</span>
                  <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Truck className="w-3 h-3 text-amber-600" />
                    <span>{count} equipo(s)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Award className="w-12 h-12 text-stone-300 mx-auto" />
          <h4 className="font-bold text-base text-stone-900">
            No se encontraron marcas de maquinaria
          </h4>
          <p className="text-xs text-stone-500">
            No hay marcas que coincidan con su búsqueda. Intente con otro término o registre una nueva marca.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-yellow-400 text-stone-950 rounded-xl font-bold text-xs"
          >
            + Registrar Marca
          </button>
        </div>
      )}

      {/* Modal for Add / Edit Machinery Brand */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8 relative">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-stone-900">
                  {editingBrand ? `Editar Marca: ${editingBrand.name}` : 'Registrar Nueva Marca de Maquinaria'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nombre del Fabricante / Marca *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Caterpillar (CAT), Komatsu, Bobcat..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  País de Origen / Sede
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ej: EE.UU., Japón, Alemania, Suecia..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Especialidad / Descripción Técnica
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Líder en excavadoras hidráulicas, minicargadores de alto torque y motores diesel certificados..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBrand ? 'Guardar Cambios' : 'Registrar Marca'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
