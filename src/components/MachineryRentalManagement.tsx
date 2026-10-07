import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { MachineryRentalRequest, RentalRequestStatus, Machinery } from '../types';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Truck,
  Check,
  X,
  AlertCircle,
  CalendarDays,
  ListFilter,
  User,
  FileText,
  ShieldCheck,
  Clock3,
} from 'lucide-react';

export const MachineryRentalManagement: React.FC = () => {
  const {
    rentalRequests,
    machineries,
    currentUser,
    addRentalRequest,
    updateRentalRequestStatus,
    updateRentalRequest,
    deleteRentalRequest,
    showToast,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<RentalRequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date(2026, 9, 1)); // Default to Oct 2026
  const [calendarMachineFilter, setCalendarMachineFilter] = useState<string>('all');
  const [selectedDayString, setSelectedDayString] = useState<string | null>('2026-10-08');

  // Inspector & Modal states
  const [inspectingRequest, setInspectingRequest] = useState<MachineryRentalRequest | null>(null);
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MachineryRentalRequest | null>(null);

  // Form states for Admin Direct Input
  const [formMachineryId, setFormMachineryId] = useState<string>(
    machineries[0]?.id || ''
  );
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formObraLocation, setFormObraLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-10-10');
  const [formEndDate, setFormEndDate] = useState('2026-10-12');
  const [formStartHour, setFormStartHour] = useState('08:00');
  const [formEndHour, setFormEndHour] = useState('17:00');
  const [formTotalHoursOrDays, setFormTotalHoursOrDays] = useState('3 días (9 hrs/día)');
  const [formNeedsOperator, setFormNeedsOperator] = useState(true);
  const [formStatus, setFormStatus] = useState<RentalRequestStatus>('pending');
  const [formNotes, setFormNotes] = useState('');

  // Counts for status tabs
  const pendingCount = useMemo(
    () => rentalRequests.filter((r) => r.status === 'pending').length,
    [rentalRequests]
  );
  const approvedCount = useMemo(
    () => rentalRequests.filter((r) => r.status === 'approved').length,
    [rentalRequests]
  );
  const completedCount = useMemo(
    () => rentalRequests.filter((r) => r.status === 'completed').length,
    [rentalRequests]
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return rentalRequests.filter((req) => {
      // Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchClient = req.clientName.toLowerCase().includes(q);
        const matchMachine = req.machineryName.toLowerCase().includes(q);
        const matchLocation = req.obraLocation.toLowerCase().includes(q);
        const matchPhone = req.clientPhone.toLowerCase().includes(q);
        const matchEmail = req.clientEmail.toLowerCase().includes(q);
        if (!matchClient && !matchMachine && !matchLocation && !matchPhone && !matchEmail) {
          return false;
        }
      }
      return true;
    });
  }, [rentalRequests, statusFilter, searchQuery]);

  // Approved requests for calendar
  const approvedRequests = useMemo(() => {
    return rentalRequests.filter((req) => {
      if (req.status !== 'approved') return false;
      if (calendarMachineFilter !== 'all' && req.machineryId !== calendarMachineFilter) {
        return false;
      }
      return true;
    });
  }, [rentalRequests, calendarMachineFilter]);

  // Actions
  const handleApprove = (id: string) => {
    const adminName = currentUser?.name || 'Administrador';
    updateRentalRequestStatus(id, 'approved', adminName);
    showToast('Solicitud aprobada e incorporada al calendario de máquinas', 'success');
    if (inspectingRequest?.id === id) {
      setInspectingRequest((prev) =>
        prev
          ? {
              ...prev,
              status: 'approved',
              approvedBy: adminName,
              approvedAt: new Date().toISOString(),
            }
          : null
      );
    }
  };

  const handleReject = (id: string) => {
    updateRentalRequestStatus(id, 'rejected');
    showToast('Solicitud rechazada', 'info');
    if (inspectingRequest?.id === id) {
      setInspectingRequest((prev) => (prev ? { ...prev, status: 'rejected' } : null));
    }
  };

  const handleComplete = (id: string) => {
    updateRentalRequestStatus(id, 'completed');
    showToast('Alquiler marcado como completado', 'success');
    if (inspectingRequest?.id === id) {
      setInspectingRequest((prev) => (prev ? { ...prev, status: 'completed' } : null));
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de alquiler?')) {
      deleteRentalRequest(id);
      showToast('Registro de solicitud eliminado', 'info');
      if (inspectingRequest?.id === id) {
        setInspectingRequest(null);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingRequest(null);
    setFormMachineryId(machineries[0]?.id || '');
    setFormClientName('');
    setFormClientEmail('');
    setFormClientPhone('');
    setFormObraLocation('');
    setFormStartDate('2026-10-10');
    setFormEndDate('2026-10-12');
    setFormStartHour('08:00');
    setFormEndHour('17:00');
    setFormTotalHoursOrDays('3 días (9 hrs/día)');
    setFormNeedsOperator(true);
    setFormStatus('pending');
    setFormNotes('');
    setIsAddingModalOpen(true);
  };

  const handleOpenEditModal = (req: MachineryRentalRequest) => {
    setEditingRequest(req);
    setFormMachineryId(req.machineryId);
    setFormClientName(req.clientName);
    setFormClientEmail(req.clientEmail);
    setFormClientPhone(req.clientPhone);
    setFormObraLocation(req.obraLocation);
    setFormStartDate(req.startDate);
    setFormEndDate(req.endDate);
    setFormStartHour(req.startHour || '08:00');
    setFormEndHour(req.endHour || '17:00');
    setFormTotalHoursOrDays(req.totalHoursOrDays || '3 días');
    setFormNeedsOperator(req.needsOperator);
    setFormStatus(req.status);
    setFormNotes(req.notes || '');
    setIsAddingModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const mach = machineries.find((m) => m.id === formMachineryId);
    if (!mach) {
      showToast('Seleccione una máquina válida', 'error');
      return;
    }

    if (!formClientName.trim() || !formClientPhone.trim() || !formObraLocation.trim()) {
      showToast('Por favor ingrese el cliente, teléfono y ubicación de la obra', 'error');
      return;
    }

    if (editingRequest) {
      updateRentalRequest(editingRequest.id, {
        machineryId: mach.id,
        machineryName: mach.name,
        machineryBrand: mach.brand,
        machineryModel: mach.model,
        machineryImageUrl: mach.imageUrl,
        clientName: formClientName.trim(),
        clientEmail: formClientEmail.trim() || 'cliente@obra.pe',
        clientPhone: formClientPhone.trim(),
        obraLocation: formObraLocation.trim(),
        startDate: formStartDate,
        endDate: formEndDate,
        startHour: formStartHour,
        endHour: formEndHour,
        totalHoursOrDays: formTotalHoursOrDays.trim(),
        needsOperator: formNeedsOperator,
        status: formStatus,
        notes: formNotes.trim(),
      });
      showToast('Solicitud de alquiler actualizada correctamente', 'success');
    } else {
      addRentalRequest({
        machineryId: mach.id,
        machineryName: mach.name,
        machineryBrand: mach.brand,
        machineryModel: mach.model,
        machineryImageUrl: mach.imageUrl,
        clientName: formClientName.trim(),
        clientEmail: formClientEmail.trim() || 'cliente@obra.pe',
        clientPhone: formClientPhone.trim(),
        obraLocation: formObraLocation.trim(),
        startDate: formStartDate,
        endDate: formEndDate,
        startHour: formStartHour,
        endHour: formEndHour,
        totalHoursOrDays: formTotalHoursOrDays.trim(),
        needsOperator: formNeedsOperator,
        notes: formNotes.trim(),
        createdBy: 'admin',
        status: formStatus,
        approvedBy: formStatus === 'approved' ? currentUser?.name || 'Administrador' : undefined,
        approvedAt: formStatus === 'approved' ? new Date().toISOString() : undefined,
      });
      showToast('Nueva solicitud de alquiler ingresada por administración', 'success');
    }

    setIsAddingModalOpen(false);
  };

  // Calendar Grid Calculations
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Setiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust Monday = 0: Sun(0) -> 6, Mon(1) -> 0
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const prevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const todayMonth = () => {
    setCalendarDate(new Date(2026, 9, 1)); // Oct 2026
    setSelectedDayString('2026-10-08');
  };

  // Check approved bookings for day string YYYY-MM-DD
  const getBookingsForDay = (dateStr: string) => {
    return approvedRequests.filter((req) => {
      return dateStr >= req.startDate && dateStr <= req.endDate;
    });
  };

  // Selected Day's Hourly Schedule
  const selectedDayBookings = useMemo(() => {
    if (!selectedDayString) return [];
    return approvedRequests.filter((req) => {
      return selectedDayString >= req.startDate && selectedDayString <= req.endDate;
    });
  }, [approvedRequests, selectedDayString]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-stone-900">
              Gestión de Solicitudes de Alquiler de Maquinaria
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro, aprobación técnica y programación de días y horas para la flota de maquinaria en obra.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Solicitud de Alquiler</span>
          </button>
        </div>
      </div>

      {/* Control Bar: View Switcher & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-200">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Lista de Solicitudes ({rentalRequests.length})</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-stone-900 text-yellow-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendario de Alquileres Aprobados ({approvedCount})</span>
          </button>
        </div>

        {/* View-specific Filter or Search */}
        {viewMode === 'list' ? (
          <div className="flex flex-wrap items-center gap-2">
            {/* Status pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Todas ({rentalRequests.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Pendientes</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-950 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Aprobadas</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-950 rounded-full text-[10px]">
                  {approvedCount}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-stone-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Completadas ({completedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, obra, equipo..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Filter by Machine */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-600">Filtrar Máquina:</span>
              <select
                value={calendarMachineFilter}
                onChange={(e) => setCalendarMachineFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">-- Todas las Máquinas ({machineries.length}) --</option>
                {machineries.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={todayMonth}
              className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-100 text-stone-700"
            >
              Ir a Hoy
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: LIST TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Máquina / Equipo Solicitado</th>
                  <th className="px-4 py-3">Cliente / Contratista</th>
                  <th className="px-4 py-3">Ubicación de Obra</th>
                  <th className="px-4 py-3">Días & Horas Reservadas</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3">Estado de Aprobación</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Machinery info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {req.machineryImageUrl && (
                            <img
                              src={req.machineryImageUrl}
                              alt={req.machineryName}
                              className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 block truncate max-w-xs">
                              {req.machineryName}
                            </span>
                            <span className="text-[10px] text-amber-900 font-mono">
                              {req.machineryBrand} · Mod. {req.machineryModel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-900">{req.clientName}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{req.clientPhone}</span>
                        </div>
                        {req.clientEmail && (
                          <div className="text-[10px] text-stone-400 truncate max-w-[160px]">
                            {req.clientEmail}
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-1 text-stone-700 max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="text-xs">{req.obraLocation}</span>
                        </div>
                      </td>

                      {/* Dates and Hours */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {req.startDate} al {req.endDate}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 flex items-center gap-1.5 mt-0.5 font-mono">
                          <Clock3 className="w-3 h-3 text-amber-600" />
                          <span>
                            {req.startHour || '08:00'} - {req.endHour || '17:00'}
                          </span>
                          {req.totalHoursOrDays && (
                            <span className="text-stone-400 font-normal">
                              ({req.totalHoursOrDays})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="px-4 py-3.5">
                        {req.needsOperator ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>Con Operador</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg">
                            Solo Equipo
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {req.status === 'pending' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              <span>Pendiente de Aprobación</span>
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Por validar en calendario
                            </span>
                          </div>
                        ) : req.status === 'approved' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aprobado / Agendado</span>
                            </span>
                            {req.approvedBy && (
                              <span className="text-[10px] text-stone-400 block truncate max-w-[140px]">
                                Por: {req.approvedBy}
                              </span>
                            )}
                          </div>
                        ) : req.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                            <span>Completado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            <span>Rechazado</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                              title="Aprobar y agendar en calendario"
                            >
                              Aprobar
                            </button>
                          )}

                          {req.status === 'approved' && (
                            <button
                              onClick={() => handleComplete(req.id)}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold transition-colors"
                              title="Marcar alquiler como culminado"
                            >
                              Completar
                            </button>
                          )}

                          <button
                            onClick={() => setInspectingRequest(req)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                            title="Ver ficha completa de la solicitud"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(req)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                            title="Editar solicitud"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(req.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar solicitud"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                      <Truck className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                      <p className="text-sm font-bold text-stone-700">
                        No se encontraron solicitudes con los filtros actuales
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        Ajuste el estado o agregue una nueva solicitud directa como administrador.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE CALENDAR OF APPROVED MACHINE RENTALS */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Month Header & Navigation */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs text-stone-500">
                  {approvedRequests.length} reservas aprobadas programadas en este período.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={todayMonth}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800"
              >
                Hoy
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Days Calendar Grid */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-bold text-stone-600 uppercase tracking-wider py-3">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Days cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 text-xs">
              {/* Padding before day 1 */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[110px] bg-stone-50/40 p-2 opacity-30" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const isSelected = selectedDayString === dateStr;
                const bookingsOnDay = getBookingsForDay(dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDayString(dateStr)}
                    className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-yellow-50/80 ring-2 ring-inset ring-yellow-400'
                        : bookingsOnDay.length > 0
                        ? 'bg-white hover:bg-stone-50/80'
                        : 'bg-white hover:bg-stone-50/40'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                          isSelected
                            ? 'bg-yellow-400 text-stone-950 font-bold shadow-xs'
                            : 'text-stone-800 group-hover:text-amber-900'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {bookingsOnDay.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                          {bookingsOnDay.length} maq.
                        </span>
                      )}
                    </div>

                    {/* Bookings Badges */}
                    <div className="space-y-1.5 flex-1 overflow-hidden">
                      {bookingsOnDay.slice(0, 3).map((bk) => (
                        <div
                          key={bk.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingRequest(bk);
                          }}
                          className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 text-[10px] leading-tight transition-colors shadow-xs"
                          title={`${bk.machineryName} - ${bk.startHour || '08:00'} a ${bk.endHour || '17:00'}`}
                        >
                          <div className="font-bold truncate text-[11px] text-stone-900">
                            {bk.machineryName.split(' ')[0]} {bk.machineryName.split(' ')[1] || ''}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {bk.startHour || '08:00'} - {bk.endHour || '17:00'}
                            </span>
                          </div>
                          <div className="text-[9px] text-stone-500 truncate">
                            {bk.clientName}
                          </div>
                        </div>
                      ))}

                      {bookingsOnDay.length > 3 && (
                        <span className="text-[10px] font-bold text-stone-500 block text-center">
                          +{bookingsOnDay.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day's Hourly Detailed Breakdown */}
          {selectedDayString && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-stone-900 text-base">
                      Programación Horaria: {selectedDayString}
                    </h4>
                    <span className="text-xs text-stone-500">
                      Detalle de horas activas, máquinas en obra y operadores para este día.
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {selectedDayBookings.length} máquina(s) en servicio
                </div>
              </div>

              {selectedDayBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {b.machineryImageUrl && (
                          <img
                            src={b.machineryImageUrl}
                            alt={b.machineryName}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-200 border border-stone-300 shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-stone-900">{b.machineryName}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                              {b.machineryBrand}
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-emerald-800 font-bold font-mono">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {b.startHour || '08:00'} - {b.endHour || '17:00'}
                              </span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-semibold text-stone-800">
                              <User className="w-3.5 h-3.5 text-stone-400" />
                              <span>{b.clientName}</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-stone-600">
                              <MapPin className="w-3.5 h-3.5 text-amber-600" />
                              <span className="truncate max-w-xs">{b.obraLocation}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700">
                          {b.needsOperator ? '✓ Con Operador' : 'Solo Equipo'}
                        </span>
                        <button
                          onClick={() => setInspectingRequest(b)}
                          className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-lg text-xs"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No hay máquinas programadas para el día {selectedDayString}. Haga clic en "+ Nueva Solicitud" para agendar una reserva.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* INSPECT DETAIL MODAL */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 relative">
            <button
              onClick={() => setInspectingRequest(null)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                {inspectingRequest.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reserva Aprobada & Agendada</span>
                  </span>
                ) : inspectingRequest.status === 'pending' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pendiente de Aprobación</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800">
                    <span>{inspectingRequest.status.toUpperCase()}</span>
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-stone-900">
                {inspectingRequest.machineryName}
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                Marca: {inspectingRequest.machineryBrand} · Mod: {inspectingRequest.machineryModel}
              </p>
            </div>

            {inspectingRequest.machineryImageUrl && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={inspectingRequest.machineryImageUrl}
                  alt={inspectingRequest.machineryName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">
                  Cliente Solicitante
                </span>
                <span className="font-bold text-stone-900 block text-sm">
                  {inspectingRequest.clientName}
                </span>
                <span className="text-stone-600 block">{inspectingRequest.clientPhone}</span>
                <span className="text-stone-500 block truncate">{inspectingRequest.clientEmail}</span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">
                  Ubicación de Obra
                </span>
                <span className="font-semibold text-stone-800 block">
                  {inspectingRequest.obraLocation}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">
                  Período de Alquiler
                </span>
                <span className="font-mono font-bold text-stone-900 block">
                  {inspectingRequest.startDate} al {inspectingRequest.endDate}
                </span>
                <span className="text-amber-900 font-bold font-mono text-[11px] block">
                  Horario: {inspectingRequest.startHour || '08:00'} - {inspectingRequest.endHour || '17:00'}
                </span>
                <span className="text-stone-500 text-[11px] block">
                  {inspectingRequest.totalHoursOrDays}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block">
                  Personal Operador
                </span>
                <span className="font-semibold text-stone-900 block">
                  {inspectingRequest.needsOperator ? '✓ Requiere operador homologado' : 'Operación propia por el cliente'}
                </span>
              </div>

              {inspectingRequest.approvedBy && (
                <div className="sm:col-span-2 pt-2 border-t border-stone-200/60 text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-700">Aprobado por:</span> {inspectingRequest.approvedBy}
                  {inspectingRequest.approvedAt && ` el ${new Date(inspectingRequest.approvedAt).toLocaleDateString()}`}
                </div>
              )}

              {inspectingRequest.notes && (
                <div className="sm:col-span-2 pt-2 border-t border-stone-200/60 text-xs">
                  <span className="font-bold text-stone-700 block text-[11px]">Notas de Obra:</span>
                  <p className="text-stone-600 mt-0.5 italic">{inspectingRequest.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-stone-100">
              {inspectingRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(inspectingRequest.id)}
                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(inspectingRequest.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar Solicitud</span>
                  </button>
                </>
              )}

              {inspectingRequest.status === 'approved' && (
                <button
                  onClick={() => handleComplete(inspectingRequest.id)}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold"
                >
                  Marcar como Completado
                </button>
              )}

              <button
                onClick={() => {
                  const req = inspectingRequest;
                  setInspectingRequest(null);
                  handleOpenEditModal(req);
                }}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold"
              >
                Editar
              </button>

              <button
                onClick={() => setInspectingRequest(null)}
                className="px-3.5 py-2 text-stone-500 hover:text-stone-800 rounded-xl text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DIRECT INPUT / EDIT MODAL */}
      {isAddingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 relative">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-stone-900">
                  {editingRequest ? 'Editar Solicitud de Alquiler' : 'Ingreso Directo de Solicitud de Alquiler (Admin)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Machine selector */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Máquina o Equipo a Alquilar *
                </label>
                <select
                  required
                  value={formMachineryId}
                  onChange={(e) => setFormMachineryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-stone-900 bg-white"
                >
                  {machineries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.brand} - {m.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client information */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block">
                  Datos del Cliente / Contratista
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Nombre o Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      placeholder="Ej: Constructora Los Andes"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={formClientPhone}
                      onChange={(e) => setFormClientPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formClientEmail}
                      onChange={(e) => setFormClientEmail(e.target.value)}
                      placeholder="contacto@constructora.pe"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Obra and Location */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ubicación de la Obra / Destino *
                </label>
                <input
                  type="text"
                  required
                  value={formObraLocation}
                  onChange={(e) => setFormObraLocation(e.target.value)}
                  placeholder="Ej: Av. Las Américas Mz F Lote 12 - Tingo María"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Dates & Hours */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block">
                  Programación de Días y Horas en Calendario
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Fecha de Fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Hora de Inicio en Obra
                    </label>
                    <input
                      type="time"
                      value={formStartHour}
                      onChange={(e) => setFormStartHour(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Hora de Término
                    </label>
                    <input
                      type="time"
                      value={formEndHour}
                      onChange={(e) => setFormEndHour(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      Detalle de Duración Estimada
                    </label>
                    <input
                      type="text"
                      value={formTotalHoursOrDays}
                      onChange={(e) => setFormTotalHoursOrDays(e.target.value)}
                      placeholder="Ej: 3 días completos (9 horas/día)"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Operator and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="needsOperatorCheck"
                    checked={formNeedsOperator}
                    onChange={(e) => setFormNeedsOperator(e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-400"
                  />
                  <label htmlFor="needsOperatorCheck" className="font-semibold text-stone-800">
                    Incluye Operador Certificado
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Estado de la Solicitud
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as RentalRequestStatus)}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-bold"
                  >
                    <option value="pending">Pendiente de Aprobación</option>
                    <option value="approved">Aprobada (Agendar en Calendario)</option>
                    <option value="completed">Completada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Notas de Trabajo / Especificaciones de Excavación o Transporte
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Zanjas para alcantarillado, limpieza de desmonte, etc."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRequest ? 'Guardar Cambios' : 'Ingresar Solicitud'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
