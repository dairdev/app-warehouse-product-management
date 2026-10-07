import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Client } from '../types';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  CheckCircle2,
  X,
  CreditCard,
  Calendar,
  UserCheck,
} from 'lucide-react';

export const ClientManagement: React.FC = () => {
  const { clients, rentalRequests, addClient, updateClient, deleteClient, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [documentType, setDocumentType] = useState<'DNI' | 'RUC' | 'CE'>('RUC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchCompany = c.company ? c.company.toLowerCase().includes(q) : false;
      const matchDoc = c.documentNumber ? c.documentNumber.toLowerCase().includes(q) : false;
      return matchName || matchEmail || matchPhone || matchCompany || matchDoc;
    });
  }, [clients, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('+51 ');
    setCompany('');
    setDocumentType('RUC');
    setDocumentNumber('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setCompany(client.company || '');
    setDocumentType(client.documentType || 'RUC');
    setDocumentNumber(client.documentNumber || '');
    setAddress(client.address || '');
    setNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    const linkedRentals = rentalRequests.filter((r) => r.clientId === client.id || r.clientEmail === client.email);
    const confirmMsg = linkedRentals.length > 0
      ? `El cliente "${client.name}" tiene ${linkedRentals.length} solicitud(es) de alquiler registrada(s). ¿Está seguro de eliminarlo?`
      : `¿Está seguro de eliminar al cliente "${client.name}"?`;

    if (window.confirm(confirmMsg)) {
      deleteClient(client.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      showToast('Por favor ingrese nombre, correo y teléfono del cliente', 'error');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim() || undefined,
        documentType,
        documentNumber: documentNumber.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addClient({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim() || undefined,
        documentType,
        documentNumber: documentNumber.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const getClientRentalsCount = (client: Client) => {
    return rentalRequests.filter(
      (r) => r.clientId === client.id || (client.email && r.clientEmail.toLowerCase() === client.email.toLowerCase())
    ).length;
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Gestión Comercial de Clientes
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Registro, edición y control de clientes y empresas contratistas para solicitudes de alquiler de maquinaria.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-yellow-400" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Total Clientes Registrados
            </span>
            <span className="text-2xl font-black text-stone-900">{clients.length}</span>
          </div>
          <UserCheck className="w-6 h-6 text-amber-600 opacity-70" />
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Empresas con RUC
            </span>
            <span className="text-2xl font-black text-stone-900">
              {clients.filter((c) => c.documentType === 'RUC' && c.documentNumber).length}
            </span>
          </div>
          <Building className="w-6 h-6 text-blue-600 opacity-70" />
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Alquileres Vinculados
            </span>
            <span className="text-2xl font-black text-stone-900">{rentalRequests.length}</span>
          </div>
          <Calendar className="w-6 h-6 text-emerald-600 opacity-70" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar cliente por nombre, empresa, RUC/DNI, correo o teléfono..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-stone-50 focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Clients Table / List */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Cliente / Razón Social</th>
              <th className="py-3 px-4">Empresa & Documento</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Ubicación / Obra</th>
              <th className="py-3 px-4 text-center">Alquileres</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredClients.map((client) => {
              const rentalsCount = getClientRentalsCount(client);
              return (
                <tr key={client.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-bold text-stone-900">{client.name}</span>
                        {client.notes && (
                          <span className="text-[10px] text-stone-500 truncate max-w-xs block">
                            {client.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-stone-600">
                    {client.company ? (
                      <div className="flex items-center gap-1.5 font-medium text-stone-800">
                        <Building className="w-3.5 h-3.5 text-stone-400" />
                        <span>{client.company}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-[11px]">Persona Natural</span>
                    )}
                    {client.documentNumber && (
                      <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                        <span className="font-semibold text-stone-600">{client.documentType || 'DOC'}:</span>{' '}
                        {client.documentNumber}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-stone-600 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                      <a href={`tel:${client.phone}`} className="hover:text-amber-700 font-mono">
                        {client.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                      <a href={`mailto:${client.email}`} className="hover:text-amber-700">
                        {client.email}
                      </a>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-stone-600">
                    {client.address ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[200px]" title={client.address}>
                          {client.address}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-[11px] italic">No especificada</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        rentalsCount > 0
                          ? 'bg-yellow-100 text-yellow-950 font-mono'
                          : 'bg-stone-100 text-stone-400 font-mono'
                      }`}
                    >
                      {rentalsCount}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        title="Editar cliente"
                        className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client)}
                        title="Eliminar cliente"
                        className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-stone-400">
                  No se encontraron clientes con el criterio de búsqueda "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add / Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nombre Completo o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Constructora El Roble S.A.C. / Ing. Juan Pérez"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Empresa / Constructora
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ej: Consorcio Vial Huánuco"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="col-span-1">
                    <label className="block font-semibold text-stone-700 mb-1">
                      Doc.
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as any)}
                      className="w-full px-2 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold bg-white"
                    >
                      <option value="RUC">RUC</option>
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="20601234567"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Teléfono / WhatsApp de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@constructora.pe"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Dirección Habitual / Ubicación de Base u Obra
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Av. Industrial 450, Huánuco"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Notas u Observaciones del Cliente
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Contratista preferencial, solicita facturación a 15 días, equipos requeridos frecuentes..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
