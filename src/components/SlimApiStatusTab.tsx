import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Server,
  Database,
  Activity,
  CheckCircle2,
  RefreshCw,
  Code,
  Terminal,
  ExternalLink,
  Cpu,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const SlimApiStatusTab: React.FC = () => {
  const { backendStatus, backendInfo, reloadFromApi, showToast } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/health');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await reloadFromApi();
      showToast('Estado del backend Slim PHP actualizado');
    } catch {
      showToast('Error al conectar con el backend', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestEndpoint = async (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
      showToast(`Consulta a ${endpoint} completada con código ${res.status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setTestResult(JSON.stringify({ error: msg }, null, 2));
      showToast(`Error al consultar ${endpoint}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const endpointsList = [
    { method: 'GET', path: '/api/health', desc: 'Diagnóstico general y estado de la base de datos' },
    { method: 'GET', path: '/api/settings', desc: 'Datos corporativos de la ferretería (RUC, Tel, etc.)' },
    { method: 'GET', path: '/api/categories', desc: 'Listado jerárquico de categorías y familias' },
    { method: 'GET', path: '/api/products', desc: 'Catálogo de materiales con precios y presentaciones' },
    { method: 'GET', path: '/api/brands', desc: 'Marcas asociadas y procedencia' },
    { method: 'GET', path: '/api/users', desc: 'Gestión de usuarios y niveles de acceso' },
    { method: 'GET', path: '/api/tags', desc: 'Etiquetas de obra y favoritos para clientes' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl ${
              backendStatus === 'online'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : backendStatus === 'connecting'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <Server className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-wider uppercase text-yellow-400 font-bold">
                  Backend API RESTful
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  backendStatus === 'online'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                    : backendStatus === 'connecting'
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                    : 'bg-red-900/60 text-red-300 border border-red-700/50'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  {backendStatus === 'online' ? 'En Línea (Conectado)' : backendStatus === 'connecting' ? 'Conectando...' : 'Modo Offline'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Slim Framework 4 (PHP 8.2 PSR-7 / PSR-15)
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Provee una API RESTful completa con persistencia SQLite/PDO para el catálogo de Ferretería Almacenes Nor Oriente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-stone-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar Datos</span>
            </button>

            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Abrir /api/health</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Server & DB Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-800">
          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/50">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Versión PHP</span>
            </div>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {backendInfo?.php_version || 'PHP 8.2'}
            </div>
            <span className="text-[10px] text-stone-400">Motor de ejecución</span>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/50">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Base de Datos</span>
            </div>
            <div className="text-lg font-bold text-emerald-300 mt-1 uppercase font-mono">
              {backendInfo?.database.driver || 'SQLite'} (PDO)
            </div>
            <span className="text-[10px] text-stone-400">Persistencia transaccional</span>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/50">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Registros en BD</span>
            </div>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {backendInfo?.database?.counts
                ? Object.values(backendInfo.database.counts).reduce((a, b) => a + b, 0)
                : 'Cargando...'}
            </div>
            <span className="text-[10px] text-stone-400">Tablas sincronizadas</span>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/50">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>Arquitectura</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              PSR-7 / PSR-15
            </div>
            <span className="text-[10px] text-stone-400">Middleware & CORS activo</span>
          </div>
        </div>
      </div>

      {/* Interactive API Tester & Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Directory */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-stone-900 text-sm">Endpoints RESTful Disponibles</h3>
            </div>
            <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
              {endpointsList.length} Rutas
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Haga clic en cualquiera de los endpoints para enviar una petición en tiempo real y validar la respuesta del servidor Slim PHP.
          </p>

          <div className="space-y-2 pt-2">
            {endpointsList.map((ep) => (
              <button
                key={ep.path}
                onClick={() => handleTestEndpoint(ep.path)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                  selectedEndpoint === ep.path
                    ? 'border-yellow-500 bg-yellow-50/70 shadow-xs ring-1 ring-yellow-400/40'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                      {ep.method}
                    </span>
                    <span className="font-mono font-bold text-stone-800">{ep.path}</span>
                  </div>
                  <p className="text-stone-500 text-[11px]">{ep.desc}</p>
                </div>
                <span className="text-stone-400 text-[11px] font-medium shrink-0 pt-0.5">
                  Probar &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Response Inspector */}
        <div className="lg:col-span-7 bg-stone-950 rounded-2xl border border-stone-800 p-6 text-stone-200 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-mono font-bold text-stone-300">
                Respuesta en Vivo: <span className="text-yellow-400">{selectedEndpoint}</span>
              </span>
            </div>
            <button
              onClick={() => handleTestEndpoint(selectedEndpoint)}
              disabled={isTesting}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Ejecutar</span>
            </button>
          </div>

          <div className="flex-1 mt-4">
            {isTesting ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-yellow-400" />
                <span className="text-xs font-mono">Consultando API Slim PHP...</span>
              </div>
            ) : testResult ? (
              <pre className="text-xs font-mono leading-relaxed bg-stone-900/90 p-4 rounded-xl text-emerald-400 border border-stone-800 overflow-x-auto max-h-[460px]">
                {testResult}
              </pre>
            ) : (
              <div className="text-center py-16 text-stone-500 text-xs">
                Seleccione un endpoint a la izquierda para inspeccionar la carga útil devuelta en formato JSON.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>Formato: JSON (application/json)</span>
            <span>Slim 4 Routing & Controllers</span>
          </div>
        </div>
      </div>

      {/* Architecture Documentation Box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-600" />
          <span>Estructura del Backend Slim PHP 4 Implementado</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              1. Enrutador & Middleware
            </span>
            <p className="text-stone-600">
              `backend/public/index.php` gestiona el enrutamiento con Slim AppFactory, middleware CORS para preflights (OPTIONS) y parseo automático de cuerpos JSON.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              2. Controladores Modulares
            </span>
            <p className="text-stone-600">
              Controladores PSR-15 independientes (`CategoryController`, `ProductController`, `BrandController`, `UserController`, `SettingsController`) con respuestas JSON estructuradas.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <span className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              3. Persistencia Transaccional
            </span>
            <p className="text-stone-600">
              Conexión PDO SQLite (`backend/data/ferreteria.sqlite`) con soporte para MySQL/PostgreSQL mediante variables de entorno `DB_HOST`, `DB_NAME`, `DB_USER`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
