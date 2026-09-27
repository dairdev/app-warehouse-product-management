import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { useStore } from '../context/StoreContext';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

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
  const { login, showToast } = useStore();
  const [email, setEmail] = useState('admin@ferreteria.test');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      onSuccess();
    }
  };

  const handleQuickLogin = async (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setEmail('admin@ferreteria.test');
      setPassword('Admin123!');
      await login('admin@ferreteria.test', 'Admin123!');
    } else {
      setEmail('ventas@ferreteria.test');
      setPassword('Admin123!');
      await login('ventas@ferreteria.test', 'Admin123!');
    }
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
          <h2 className="mt-4 text-xl font-extrabold text-stone-900 tracking-tight">
            Acceso Personal Autorizado
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Administración de Inventario, Precios y Catálogo de Clientes
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-stone-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ferreteria.test"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block text-center mb-2">
              Credenciales Rápidas de Prueba
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                <span>Demo Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
