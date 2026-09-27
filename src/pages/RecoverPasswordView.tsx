import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { useStore } from '../context/StoreContext';
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';

interface RecoverPasswordViewProps {
  onBackToLogin: () => void;
}

export const RecoverPasswordView: React.FC<RecoverPasswordViewProps> = ({ onBackToLogin }) => {
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    showToast(`Enlace de restablecimiento enviado a ${email}`);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio de Sesión</span>
        </button>

        <div className="text-center mb-6">
          <Logo size="lg" variant="full" />
          <h2 className="mt-4 text-xl font-extrabold text-stone-900 tracking-tight">
            Recuperar Contraseña
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Ingresa tu correo electrónico corporativo registrado
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-stone-200">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">
                ¡Instrucciones Enviadas!
              </h3>
              <p className="text-xs text-stone-500">
                Hemos enviado un correo a <strong>{email}</strong> con el enlace de restablecimiento válido por 60 minutos.
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                Volver al Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Enviar Enlace de Recuperación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
