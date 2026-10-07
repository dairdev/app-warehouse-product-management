import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { useStore } from '../context/StoreContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  User,
  Building,
  Phone,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

interface LoginViewProps {
  onSuccess: () => void;
  onNavigateToRecover: () => void;
  onBackToCatalog: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onNavigateToRecover,
  onBackToCatalog,
}) => {
  const { login, registerClient, loginWithGoogle, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@ferreteria.test');
  const [loginPassword, setLoginPassword] = useState('Admin123!');

  // Register form state (Client non-admin)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(loginEmail, loginPassword);
    setLoading(false);
    if (ok) {
      onSuccess();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      showToast('Por favor ingrese su nombre y correo electrónico', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setLoading(true);
    const ok = await registerClient({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      company: regCompany.trim(),
      authProvider: 'email',
    });
    setLoading(false);

    if (ok) {
      onSuccess();
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    // Simulates instant Google account authentication popup / OAuth token
    const ok = await loginWithGoogle({
      name: 'Ing. Carlos Mendoza (Google)',
      email: 'carlos.mendoza.obra@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    });
    setLoading(false);
    if (ok) {
      onSuccess();
    }
  };

  const handleQuickLogin = async (type: 'admin' | 'staff' | 'client') => {
    setLoading(true);
    if (type === 'admin') {
      setLoginEmail('admin@ferreteria.test');
      setLoginPassword('Admin123!');
      await login('admin@ferreteria.test', 'Admin123!');
    } else if (type === 'staff') {
      setLoginEmail('ventas@ferreteria.test');
      setLoginPassword('Admin123!');
      await login('ventas@ferreteria.test', 'Admin123!');
    } else {
      setLoginEmail('cliente@constructora.pe');
      setLoginPassword('Cliente123!');
      await login('cliente@constructora.pe', 'Cliente123!');
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Back Link */}
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Público (Sin Login)</span>
        </button>

        {/* Brand Logo */}
        <div className="text-center mb-6">
          <Logo size="lg" variant="full" />
          <h2 className="mt-4 text-2xl font-black text-stone-900 tracking-tight">
            {activeTab === 'login' ? 'Bienvenido a Almacenes Nor Oriente' : 'Registro de Cuenta para Clientes'}
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {activeTab === 'login'
              ? 'Acceda con su cuenta de cliente, Google o credenciales corporativas.'
              : 'Cree su cuenta para solicitar alquiler de maquinaria y cotizar materiales directo a obra.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-stone-200">
          {/* Tabs: Iniciar Sesión vs Registrarse */}
          <div className="flex rounded-2xl bg-stone-100 p-1 mb-6 border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Registrar Cliente
            </button>
          </div>

          {/* GOOGLE ONE-CLICK AUTHENTICATION BUTTON */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold border border-stone-300 shadow-xs transition-colors flex items-center justify-center gap-3 hover:border-stone-400"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Cuenta de Google</span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-stone-400 bg-white px-2">
                O con correo electrónico
              </div>
            </div>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="usuario@constructora.pe"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateToRecover}
                    className="text-[11px] font-semibold text-amber-800 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* TAB 2: CLIENT REGISTRATION FORM */
            <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej: Arq. Carlos Mendoza / Constructora Sol"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="cliente@constructora.pe"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contraseña de Acceso * (Mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Crea una contraseña segura"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Empresa u Obra
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Residencial Los Olivos"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 mt-3"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta de Cliente'}</span>
              </button>
            </form>
          )}

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block text-center mb-2">
              Acceso Rápido con Perfiles Demo
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('client')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-yellow-100 text-stone-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 border border-stone-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-yellow-100 text-stone-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 border border-stone-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-yellow-100 text-stone-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 border border-stone-200"
              >
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                <span>Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
