import React, { useState, useMemo } from 'react';
import { Machinery, MachineryCategory } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency, getMachineryWhatsAppUrl } from '../utils/shareUtils';
import {
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  Fuel,
  Zap,
  PhoneCall,
  Search,
  Filter,
  ShieldCheck,
  ChevronRight,
  Info,
  Calendar,
  X,
  FileText,
  Sparkles,
  Star,
  UserPlus,
  Lock,
  Layers,
} from 'lucide-react';

interface MachineryRentModuleProps {
  onBackToMaterials?: () => void;
  standalone?: boolean;
}

export const MachineryRentModule: React.FC<MachineryRentModuleProps> = ({
  onBackToMaterials,
  standalone = false,
}) => {
  const { machineries, storeSettings, currentUser, isAdmin, showToast, addRentalRequest, registerClient } = useStore();
  const isManager = isAdmin() || currentUser?.role === 'staff';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachinery, setSelectedMachinery] = useState<Machinery | null>(null);
  const [overviewActiveImage, setOverviewActiveImage] = useState<string>('');

  // Rental Application modal state
  const [quoteMachinery, setQuoteMachinery] = useState<Machinery | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [obraLocation, setObraLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('17:00');
  const [estimatedDays, setEstimatedDays] = useState<number>(3);
  const [rentalHours, setRentalHours] = useState<number>(8);
  const [needOperator, setNeedOperator] = useState<boolean>(true);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Inline client registration states (for unauthenticated users)
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const categories = [
    { id: 'all', label: 'Todos los Equipos', icon: Truck },
    { id: 'pesada', label: 'Maquinaria Pesada', icon: Truck },
    { id: 'liviana', label: 'Maquinaria Liviana', icon: Wrench },
    { id: 'concreto', label: 'Equipos de Concreto', icon: Zap },
    { id: 'compactacion', label: 'Compactación & Suelos', icon: ShieldCheck },
    { id: 'transporte', label: 'Transporte & Volquetes', icon: Truck },
  ];

  const filteredMachinery = useMemo(() => {
    return machineries.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchModel = item.model.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchModel && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [machineries, selectedCategory, searchQuery]);

  const handleOpenOverview = (mach: Machinery) => {
    setSelectedMachinery(mach);
    setOverviewActiveImage(mach.imageUrl);
  };

  const handleOpenQuoteModal = (mach: Machinery) => {
    setQuoteMachinery(mach);
    setNeedOperator(mach.includesOperator ?? true);
    setEstimatedDays(mach.category === 'pesada' ? 5 : 2);
    setRentalHours(mach.minRentalHours || 8);
    setObraLocation(currentUser?.company ? `${currentUser.company} - Obra Principal` : '');
    setQuoteNotes('');
    setClientName(currentUser?.name || '');
    setClientEmail(currentUser?.email || '');
    setClientPhone(currentUser?.phone || '');
    setShowRegisterForm(false);

    const today = new Date();
    const tmrw = new Date(today);
    tmrw.setDate(today.getDate() + 1);
    const endD = new Date(tmrw);
    endD.setDate(tmrw.getDate() + (mach.category === 'pesada' ? 4 : 2));

    setStartDate(tmrw.toISOString().split('T')[0]);
    setEndDate(endD.toISOString().split('T')[0]);
    setStartHour('08:00');
    setEndHour('17:00');
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      showToast('Por favor ingrese su nombre, correo y teléfono', 'error');
      return;
    }
    setRegLoading(true);
    const ok = await registerClient({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      company: regCompany.trim(),
      password: regPassword || 'Cliente123!',
      authProvider: 'email',
    });
    setRegLoading(false);
    if (ok) {
      setClientName(regName.trim());
      setClientEmail(regEmail.trim());
      setClientPhone(regPhone.trim());
      if (regCompany.trim() && !obraLocation) {
        setObraLocation(`${regCompany.trim()} - Obra Principal`);
      }
      setShowRegisterForm(false);
      showToast('Cuenta de cliente registrada y datos vinculados a la solicitud', 'success');
    }
  };

  const handleSubmitRentalApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteMachinery) return;

    if (!clientName.trim() || !clientPhone.trim() || !obraLocation.trim()) {
      showToast('Por favor complete los datos obligatorios del cliente y ubicación', 'error');
      return;
    }

    addRentalRequest({
      machineryId: quoteMachinery.id,
      machineryName: quoteMachinery.name,
      machineryBrand: quoteMachinery.brand,
      machineryModel: quoteMachinery.model,
      machineryImageUrl: quoteMachinery.imageUrl,
      clientId: currentUser?.id,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || 'cliente@obra.pe',
      clientPhone: clientPhone.trim(),
      obraLocation: obraLocation.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || startDate || new Date().toISOString().split('T')[0],
      startHour: startHour || '08:00',
      endHour: endHour || '17:00',
      totalHoursOrDays: `${estimatedDays} días (${rentalHours} hrs/día)`,
      needsOperator: needOperator,
      notes: quoteNotes.trim(),
      createdBy: 'client',
      status: 'pending',
    });

    showToast(
      `¡Solicitud de alquiler registrada para ${quoteMachinery.name}! Queda pendiente de aprobación.`,
      'success'
    );
    setQuoteMachinery(null);
  };

  return (
    <div className="space-y-8">
      {/* Module Hero Banner (Only shown in standalone mode to avoid duplication on Landing Page) */}
      {standalone && (
        <section className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-800/90 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-stone-700">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Módulo de Alquiler y Despacho a Pie de Obra</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              Alquiler de Maquinaria Pesada & Equipos de Construcción
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
              Flota moderna de retroexcavadoras, minicargadores Bobcat, volquetes de 15 m³, trompos mezcladores
              y equipos de compactación certificados para ingenieros, contratistas y maestros de obra.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
                <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Equipos Certificados</span>
                  <span className="text-stone-400 text-[11px]">Mantenimiento al día</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
                <UserCheck className="w-5 h-5 text-yellow-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Con o Sin Operador</span>
                  <span className="text-stone-400 text-[11px]">SCTR y EPP completo</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
                <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Tarifas Flexibles</span>
                  <span className="text-stone-400 text-[11px]">Por hora, día o mes</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Control Bar: Categories & Search */}
      <div className="space-y-4">
        {/* Category Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-stone-900 border-stone-900 text-yellow-400 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-yellow-400 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-yellow-400' : 'text-stone-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por marca, modelo o tipo de máquina..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 hover:text-stone-600"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="text-xs text-stone-500">
            Mostrando <strong className="text-stone-900 font-bold">{filteredMachinery.length}</strong> máquinas y equipos disponibles
          </div>
        </div>
      </div>

      {/* Machinery Grid */}
      {filteredMachinery.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachinery.map((mach) => {
            const hasRates = isManager && (mach.dailyRate || mach.hourlyRate);

            return (
              <div
                key={mach.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-yellow-400/80 hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image slot */}
                <div
                  onClick={() => setSelectedMachinery(mach)}
                  className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer flex items-center justify-center border-b border-stone-100"
                >
                  <img
                    src={mach.imageUrl}
                    alt={mach.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {mach.status === 'available' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>Disponible en almacén</span>
                      </span>
                    ) : mach.status === 'rented' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white shadow-xs">
                        <span>En Obra / Reservado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-stone-600 text-white shadow-xs">
                        <span>Mantenimiento</span>
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-semibold backdrop-blur-xs">
                    {mach.categoryName}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                      <span className="font-bold text-amber-900">{mach.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-stone-600">Modelo {mach.model}</span>
                      {mach.year && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-stone-400 font-mono">{mach.year}</span>
                        </>
                      )}
                    </div>

                    <h3
                      onClick={() => setSelectedMachinery(mach)}
                      className="text-base font-bold text-stone-900 hover:text-amber-800 transition-colors cursor-pointer leading-snug"
                    >
                      {mach.name}
                    </h3>
                  </div>

                  {/* Technical Specs Tags */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
                    {mach.powerHp && (
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{mach.powerHp}</span>
                      </div>
                    )}
                    {mach.capacity && (
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{mach.capacity}</span>
                      </div>
                    )}
                    {mach.fuelType && (
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Fuel className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{mach.fuelType}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {mach.includesOperator ? 'Con Operador' : 'Sin Operador'}
                      </span>
                    </div>
                  </div>

                  {/* Availability & Actions (Prices hidden) */}
                  <div className="mt-auto pt-3 border-t border-stone-100">
                    <div className="mb-3">
                      <span className="text-[11px] text-stone-400 block font-normal">
                        Disponibilidad para Obra:
                      </span>
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reserva programada con o sin operador</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedMachinery(mach)}
                        className="py-2.5 px-3 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-stone-50 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        <span>Ficha Técnica</span>
                      </button>

                      <button
                        onClick={() => handleOpenQuoteModal(mach)}
                        className="py-2.5 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Solicitar Alquiler</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-3">
          <Truck className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">
            No se encontraron equipos con esos filtros
          </h3>
          <p className="text-xs text-stone-500">
            Intente con otro término de búsqueda o seleccione otra categoría de maquinaria.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl"
          >
            Ver todos los equipos
          </button>
        </div>
      )}

      {/* Machinery Technical Specs Modal - Optimized for Full HD (1920x1080) and smaller screens */}
      {selectedMachinery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header - Fixed & Compact */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                    {selectedMachinery.categoryName} · {selectedMachinery.brand} ({selectedMachinery.model})
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-stone-900 leading-tight">
                    {selectedMachinery.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMachinery(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                title="Cerrar Ficha Técnica"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 2 Columns on desktop, scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left Column: Image Gallery & Badges */}
                <div className="md:col-span-5 space-y-3">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-900 border border-stone-200 shadow-inner group">
                    <img
                      src={overviewActiveImage || selectedMachinery.imageUrl}
                      alt={selectedMachinery.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-700">
                      Año {selectedMachinery.year}
                    </div>
                  </div>

                  {/* Multi-Image Thumbnails */}
                  {selectedMachinery.galleryImages && selectedMachinery.galleryImages.length > 1 && (
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                        Galería de Fotos ({selectedMachinery.galleryImages.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {selectedMachinery.galleryImages.map((img, idx) => {
                          const isActive = (overviewActiveImage || selectedMachinery.imageUrl) === img;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setOverviewActiveImage(img)}
                              className={`relative w-14 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                                isActive
                                  ? 'border-yellow-400 ring-2 ring-yellow-400/30 scale-105'
                                  : 'border-stone-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Operational badges */}
                  <div className="grid grid-cols-1 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 block text-[11px]">Operador Certificado:</span>
                        <span className="text-stone-600 text-[11px] leading-tight block">
                          {selectedMachinery.operatorDetails ||
                            (selectedMachinery.includesOperator
                              ? 'Incluye maquinista homologado con SCTR'
                              : 'Operación propia por el cliente')}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 block text-[11px]">Despacho & Movilización:</span>
                        <span className="text-stone-600 text-[11px] leading-tight block">
                          {selectedMachinery.deliveryConditions || 'Despacho directo en cama baja o plataforma a pie de obra.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Description & Technical Specs */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Descripción del Equipo
                    </h4>
                    <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                      {selectedMachinery.description}
                    </p>
                  </div>

                  {/* Quick specs overview chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {selectedMachinery.powerHp && (
                      <div className="bg-yellow-50/60 border border-yellow-200/80 p-2 rounded-xl">
                        <span className="text-[10px] text-yellow-800 uppercase font-semibold block">Potencia</span>
                        <span className="font-extrabold text-stone-900 text-xs">{selectedMachinery.powerHp}</span>
                      </div>
                    )}
                    {selectedMachinery.capacity && (
                      <div className="bg-yellow-50/60 border border-yellow-200/80 p-2 rounded-xl">
                        <span className="text-[10px] text-yellow-800 uppercase font-semibold block">Capacidad</span>
                        <span className="font-extrabold text-stone-900 text-xs">{selectedMachinery.capacity}</span>
                      </div>
                    )}
                    {selectedMachinery.fuelType && (
                      <div className="bg-yellow-50/60 border border-yellow-200/80 p-2 rounded-xl">
                        <span className="text-[10px] text-yellow-800 uppercase font-semibold block">Combustible</span>
                        <span className="font-extrabold text-stone-900 text-xs">{selectedMachinery.fuelType}</span>
                      </div>
                    )}
                    {selectedMachinery.operatingWeight && (
                      <div className="bg-stone-100/80 border border-stone-200 p-2 rounded-xl">
                        <span className="text-[10px] text-stone-600 uppercase font-semibold block">Peso Operativo</span>
                        <span className="font-extrabold text-stone-900 text-xs">{selectedMachinery.operatingWeight}</span>
                      </div>
                    )}
                    <div className="bg-stone-100/80 border border-stone-200 p-2 rounded-xl">
                      <span className="text-[10px] text-stone-600 uppercase font-semibold block">Mínimo Alquiler</span>
                      <span className="font-extrabold text-stone-900 text-xs">{selectedMachinery.minRentalHours || 8} horas</span>
                    </div>
                  </div>

                  {/* Technical Specifications table */}
                  {selectedMachinery.technicalSpecs && selectedMachinery.technicalSpecs.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Especificaciones Técnicas Certificadas
                      </h4>
                      <div className="divide-y divide-stone-100 text-xs border border-stone-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                        {selectedMachinery.technicalSpecs.map((spec, i) => (
                          <div key={i} className="px-3 py-1.5 flex items-center justify-between hover:bg-stone-50">
                            <span className="font-medium text-stone-600 text-[11px]">{spec.key}:</span>
                            <span className="font-bold text-stone-900 font-mono text-[11px] text-right">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Fixed CTA */}
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMachinery(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  const m = selectedMachinery;
                  setSelectedMachinery(null);
                  handleOpenQuoteModal(m);
                }}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Solicitar Alquiler de este Equipo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental Application Modal */}
      {quoteMachinery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSubmitRentalApplication}
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-5 py-3.5 border-b border-stone-200 bg-white shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-950 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  <span>Solicitud Oficial de Alquiler</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 leading-tight">
                  {quoteMachinery.name}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Reserva programada y confirmación técnica para pie de obra
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteMachinery(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="space-y-3.5 text-xs flex-1 min-h-0 overflow-y-auto px-5 py-3.5">
              {/* Client Status Banner: Registered / Logged In vs Guest */}
              {currentUser ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-950 text-xs">
                          {currentUser.name}
                        </span>
                        <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono">
                          Cliente Registrado
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 block">
                        {currentUser.email} {currentUser.company ? `· ${currentUser.company}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-medium hidden sm:inline">
                    Datos precargados automáticamente
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-amber-950 text-xs">
                        ¿Desea registrarse antes de enviar la solicitud?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(!showRegisterForm)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-[11px] rounded-lg transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showRegisterForm ? 'Ocultar Registro' : 'Registrarme Ahora'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Al registrarse como cliente no necesitará ingresar sus datos nuevamente en futuros alquileres o cotizaciones. También puede continuar como invitado llenando los datos a continuación.
                  </p>

                  {/* Inline Registration Expansion */}
                  {showRegisterForm && (
                    <div className="mt-2.5 pt-2.5 border-t border-amber-200/80 bg-white p-3 rounded-lg border space-y-2.5">
                      <span className="font-bold text-stone-900 text-xs block">
                        Crear Cuenta de Cliente Comercial:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Nombre Completo *</label>
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Ej: Ing. Jorge Valdivia"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Correo Electrónico *</label>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="jorge@constructora.pe"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Teléfono / WhatsApp *</label>
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="+51 987 654 321"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Empresa / Razón Social</label>
                          <input
                            type="text"
                            value={regCompany}
                            onChange={(e) => setRegCompany(e.target.value)}
                            placeholder="Ej: Consorcio Vial Huánuco"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Contraseña</label>
                          <input
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={regLoading}
                          onClick={handleInlineRegister}
                          className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{regLoading ? 'Registrando...' : 'Confirmar y Guardar Cuenta'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Client Info Grid */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block">
                    1. Datos del Solicitante / Cliente
                  </span>
                  {currentUser && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Completado desde tu cuenta
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1 text-[11px]">
                      Nombre o Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej: Constructora El Roble / Ing. Juan"
                      className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1 text-[11px]">
                      Teléfono / WhatsApp de Contacto *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1 text-[11px]">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="contacto@obra.pe"
                      className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ubicación de la Obra / Destino de Despacho *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={obraLocation}
                    onChange={(e) => setObraLocation(e.target.value)}
                    placeholder="Ej: Av. Principal 450, Huánuco - Frente al Puente"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
              </div>

              {/* Dates & Hours Grid */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block">
                  2. Programación de Días y Horas Solicitadas
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Fecha Fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Operator */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Requerimiento de Maquinista / Operador
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNeedOperator(true)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      needOperator
                        ? 'bg-yellow-400 border-yellow-500 text-stone-950 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-stone-900" />
                    <span>Con Operador Certificado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNeedOperator(false)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      !needOperator
                        ? 'bg-yellow-400 border-yellow-500 text-stone-950 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-stone-900" />
                    <span>Solo Máquina (Operador Propio)</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Detalles o especificaciones adicionales
                </label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Ej: Se requiere martillo hidráulico auxiliar, ingreso con rampa de tierra..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuoteMachinery(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Solicitud de Alquiler</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
