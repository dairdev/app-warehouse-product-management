import React, { useState } from 'react';
import { Logo } from './Logo';
import { useStore } from '../context/StoreContext';
import {
  FileText,
  User,
  Shield,
  LogOut,
  LogIn,
  Bookmark,
  Database,
  RotateCcw,
  PhoneCall,
  Menu,
  X,
  Truck,
} from 'lucide-react';
import { STORE_INFO } from '../utils/shareUtils';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  onOpenSqlViewer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSqlViewer,
}) => {
  const { currentUser, clientProfile, storeSettings, logout, switchRole, resetAllData, backendStatus } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const taggedCount = clientProfile.taggedProductIds.length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Zone 1: Brand Wordmark & Optional Header Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('catalog')}
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-lg group text-left"
              title="Ir al Catálogo Principal"
            >
              <Logo size="md" variant="horizontal" />
            </button>
            {storeSettings.headerTagline && (
              <span className="hidden xl:inline-block pl-3 border-l border-stone-200 text-[11px] text-stone-500 font-medium leading-tight max-w-[220px]">
                {storeSettings.headerTagline}
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links (Clean text links with hover underline, no pills) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
            <button
              onClick={() => onNavigate('catalog')}
              className={`transition-colors py-1 relative ${
                currentView === 'catalog' || currentView.startsWith('product-')
                  ? 'text-stone-900 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              Catálogo de Materiales
              {(currentView === 'catalog' || currentView.startsWith('product-')) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
              )}
            </button>

            <button
              onClick={() => onNavigate('machinery')}
              className={`transition-colors py-1 flex items-center gap-1.5 relative ${
                currentView === 'machinery'
                  ? 'text-stone-900 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Alquiler de Maquinaria</span>
              {currentView === 'machinery' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
              )}
            </button>

            <button
              onClick={() => onNavigate('client-profile')}
              className={`transition-colors py-1 flex items-center gap-1.5 relative ${
                currentView === 'client-profile'
                  ? 'text-stone-900 font-semibold'
                  : 'hover:text-stone-900'
              }`}
            >
              <Bookmark className="w-4 h-4 text-stone-400" />
              <span>Mi Perfil & Etiquetas</span>
              {taggedCount > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-yellow-100 rounded px-1.5 py-0.2">
                  {taggedCount}
                </span>
              )}
              {currentView === 'client-profile' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
              )}
            </button>

            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff') ? (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`transition-colors py-1 flex items-center gap-1.5 relative ${
                  currentView.startsWith('admin')
                    ? 'text-stone-900 font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Panel Administrativo</span>
                {currentView.startsWith('admin') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                )}
              </button>
            ) : null}

            <button
              onClick={onOpenSqlViewer}
              className="text-stone-500 hover:text-stone-900 transition-colors py-1 flex items-center gap-1.5 text-xs font-mono"
              title="Ver Esquema SQL y Scripts de Inicialización"
            >
              <Database className="w-3.5 h-3.5 text-stone-400" />
              <span>schema.sql</span>
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="text-stone-500 hover:text-stone-900 transition-colors py-1 flex items-center gap-1.5 text-xs font-mono"
              title="Slim PHP RESTful API"
            >
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>API Slim PHP</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions & User Status */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Quick WhatsApp Cotización */}
            <a
              href={`https://wa.me/${storeSettings.whatsappNumber}?text=${encodeURIComponent(
                `Hola ${storeSettings.name}, deseo consultar disponibilidad y cotización de materiales de construcción.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-stone-600" />
              <span>Atención en Obra</span>
            </a>

            {/* User status / Login / Role switcher */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-yellow-400/30 hover:bg-yellow-400/50 border border-yellow-400/50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="truncate max-w-[120px] font-semibold">{currentUser.name}</span>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                </button>

                {roleSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-50 text-xs">
                    <div className="px-2 py-1 text-stone-400 font-mono text-[10px] uppercase">
                      Cambiar Rol de Prueba
                    </div>
                    <button
                      onClick={() => {
                        switchRole('guest');
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-100 flex items-center justify-between"
                    >
                      <span>Modo Cliente (Público)</span>
                      <span className="text-[10px] text-stone-400">Sin login</span>
                    </button>
                    <button
                      onClick={() => {
                        switchRole('staff');
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-100 flex items-center justify-between"
                    >
                      <span>Personal de Ventas</span>
                      <span className="text-[10px] text-stone-400">Staff</span>
                    </button>
                    <button
                      onClick={() => {
                        switchRole('admin');
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-100 flex items-center justify-between font-semibold text-stone-900"
                    >
                      <span>Administrador Central</span>
                      <span className="text-[10px] text-amber-600">Admin</span>
                    </button>

                    <div className="my-1 border-t border-stone-100"></div>

                    <button
                      onClick={() => {
                        resetAllData();
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-amber-700 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Datos Demo</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        onNavigate('catalog');
                        setRoleSwitcherOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-1.5 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-xs font-semibold text-stone-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingresar / Registrarse</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => onNavigate('client-profile')}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg relative"
              title="Mis etiquetas"
            >
              <Bookmark className="w-5 h-5" />
              {taggedCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => {
              onNavigate('catalog');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-stone-100"
          >
            Catálogo de Materiales
          </button>
          <button
            onClick={() => {
              onNavigate('machinery');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-stone-100 flex items-center gap-2 text-stone-900"
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <span>Alquiler de Maquinaria</span>
          </button>
          <button
            onClick={() => {
              onNavigate('client-profile');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-stone-100 flex items-center justify-between"
          >
            <span>Mi Perfil & Etiquetas</span>
            <span className="text-xs bg-yellow-100 text-stone-800 px-2 py-0.5 rounded">
              {taggedCount} guardados
            </span>
          </button>
          {currentUser && (
            <button
              onClick={() => {
                onNavigate('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-800 bg-yellow-50 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Panel Administrativo</span>
            </button>
          )}
          <button
            onClick={() => {
              onOpenSqlViewer();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-stone-500 hover:bg-stone-100 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>Ver Base de Datos (schema.sql)</span>
          </button>

          <div className="pt-2 border-t border-stone-100">
            {currentUser ? (
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs text-stone-400">
                  Conectado como: <strong className="text-stone-800">{currentUser.name}</strong> ({currentUser.role})
                </div>
                <button
                  onClick={() => {
                    logout();
                    onNavigate('catalog');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-600 font-medium hover:bg-red-50"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center px-4 py-2 text-xs font-semibold text-stone-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg"
              >
                Ingresar / Registrarse (Clientes & Admin)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
