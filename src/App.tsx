/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { CatalogView } from './pages/CatalogView';
import { ProductDetailView } from './pages/ProductDetailView';
import { ClientProfileView } from './pages/ClientProfileView';
import { AdminDashboardView } from './pages/AdminDashboardView';
import { LoginView } from './pages/LoginView';
import { RecoverPasswordView } from './pages/RecoverPasswordView';
import { PrintCatalogView } from './pages/PrintCatalogView';
import { ShareMenu } from './components/ShareMenu';
import { TagModal } from './components/TagModal';
import { SqlViewerModal } from './components/SqlViewerModal';
import { ToastContainer } from './components/ToastContainer';
import { Product } from './types';
import { STORE_INFO } from './utils/shareUtils';

function AppContent() {
  const { currentUser, products } = useStore();

  // Navigation router state
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('producto/')) {
      return `product-${hash.split('/')[1]}`;
    }
    if (hash === 'cliente') return 'client-profile';
    if (hash === 'admin') return 'admin-dashboard';
    if (hash === 'login') return 'login';
    return 'catalog';
  });

  const [landingSection, setLandingSection] = useState<'materials' | 'machinery'>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash === 'maquinaria' ? 'machinery' : 'materials';
  });

  const [activeProductId, setActiveProductId] = useState<string | null>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('producto/')) {
      return hash.split('/')[1];
    }
    return null;
  });

  // Modal states
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [taggingProduct, setTaggingProduct] = useState<Product | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('producto/')) {
        const id = hash.split('/')[1];
        setActiveProductId(id);
        setCurrentView(`product-${id}`);
      } else if (hash === 'maquinaria') {
        setCurrentView('catalog');
        setLandingSection('machinery');
        setActiveProductId(null);
      } else if (hash === 'materiales') {
        setCurrentView('catalog');
        setLandingSection('materials');
        setActiveProductId(null);
      } else if (hash === 'cliente') {
        setCurrentView('client-profile');
      } else if (hash === 'admin') {
        setCurrentView('admin-dashboard');
      } else if (hash === 'login') {
        setCurrentView('login');
      } else if (hash === 'imprimir') {
        setCurrentView('print-catalog');
      } else {
        setCurrentView('catalog');
        setLandingSection('materials');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Ensure redirect to catalog when user logs out while in admin dashboard
  useEffect(() => {
    if (!currentUser && currentView === 'admin-dashboard') {
      window.location.hash = '';
      setCurrentView('catalog');
      setLandingSection('materials');
      setActiveProductId(null);
    }
  }, [currentUser, currentView]);

  const navigateTo = (view: string, id?: string) => {
    if (view === 'catalog') {
      window.location.hash = '';
      setCurrentView('catalog');
      setLandingSection('materials');
      setActiveProductId(null);
    } else if (view === 'machinery') {
      window.location.hash = 'maquinaria';
      setCurrentView('catalog');
      setLandingSection('machinery');
      setActiveProductId(null);
    } else if (view === 'product' && id) {
      window.location.hash = `producto/${id}`;
      setActiveProductId(id);
      setCurrentView(`product-${id}`);
    } else if (view === 'client-profile') {
      window.location.hash = 'cliente';
      setCurrentView('client-profile');
    } else if (view === 'admin-dashboard') {
      window.location.hash = 'admin';
      setCurrentView('admin-dashboard');
    } else if (view === 'login') {
      window.location.hash = 'login';
      setCurrentView('login');
    } else if (view === 'recover') {
      setCurrentView('recover');
    } else if (view === 'print-catalog') {
      setCurrentView('print-catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    navigateTo('product', product.id);
  };

  if (currentView === 'print-catalog') {
    return <PrintCatalogView onBack={() => navigateTo('catalog')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans selection:bg-yellow-400 selection:text-black">
      {/* Universal 3-Zone Header */}
      <Header
        currentView={currentView === 'catalog' && landingSection === 'machinery' ? 'machinery' : currentView}
        onNavigate={navigateTo}
        onOpenSqlViewer={() => setIsSqlModalOpen(true)}
      />

      {/* Main Viewport Content */}
      <div className="flex-1">
        {currentView === 'catalog' && (
          <CatalogView
            onSelectProduct={handleSelectProduct}
            onOpenShareModal={(p) => setShareProduct(p)}
            onOpenTagModal={(p) => setTaggingProduct(p)}
            onNavigateToClientProfile={() => navigateTo('client-profile')}
            onPrintCatalog={() => navigateTo('print-catalog')}
            initialLandingSection={landingSection}
            onSectionChange={(section) => {
              setLandingSection(section);
              window.location.hash = section === 'machinery' ? 'maquinaria' : '';
            }}
          />
        )}

        {currentView.startsWith('product-') && activeProductId && (
          <ProductDetailView
            productId={activeProductId}
            onBack={() => navigateTo('catalog')}
            onOpenShareModal={(p) => setShareProduct(p)}
            onOpenTagModal={(p) => setTaggingProduct(p)}
            onSelectRelated={handleSelectProduct}
          />
        )}

        {currentView === 'client-profile' && (
          <ClientProfileView
            onBackToCatalog={() => navigateTo('catalog')}
            onSelectProduct={handleSelectProduct}
            onOpenShareModal={(p) => setShareProduct(p)}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboardView
            onViewProductAsClient={handleSelectProduct}
            onPrintCatalog={() => navigateTo('print-catalog')}
          />
        )}

        {currentView === 'login' && (
          <LoginView
            onSuccess={() => navigateTo('admin-dashboard')}
            onNavigateToRecover={() => setCurrentView('recover')}
            onBackToCatalog={() => navigateTo('catalog')}
          />
        )}

        {currentView === 'recover' && (
          <RecoverPasswordView onBackToLogin={() => setCurrentView('login')} />
        )}
      </div>

      {/* Quiet, Clean Footer */}
      <footer className="no-print bg-stone-900 text-stone-400 border-t border-stone-800 text-xs py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2 md:col-span-2">
              <span className="text-white font-extrabold text-sm block tracking-tight">
                {STORE_INFO.name}
              </span>
              <p className="text-stone-400 max-w-sm text-xs leading-relaxed">
                Distribuidor líder de materiales de construcción pesada: cementos, ladrillos,
                aceros, agregados y concretos. Suministro garantizado directo a obra.
              </p>
              <div className="text-[11px] text-stone-500 pt-1 font-mono">
                {STORE_INFO.address} · {STORE_INFO.city}
              </div>
            </div>

            <div>
              <span className="text-stone-200 font-bold uppercase text-[11px] tracking-wider block mb-2">
                Atención a Clientes
              </span>
              <ul className="space-y-1.5 text-xs text-stone-400">
                <li>
                  <button onClick={() => navigateTo('catalog')} className="hover:text-yellow-400 transition-colors">
                    Catálogo de Productos
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('client-profile')} className="hover:text-yellow-400 transition-colors">
                    Mi Perfil & Etiquetas de Obra
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('print-catalog')} className="hover:text-yellow-400 transition-colors">
                    Catálogo Imprimible A4
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <span className="text-stone-200 font-bold uppercase text-[11px] tracking-wider block mb-2">
                Sistema & Arquitectura
              </span>
              <ul className="space-y-1.5 text-xs text-stone-400">
                <li>
                  <button onClick={() => setIsSqlModalOpen(true)} className="hover:text-yellow-400 font-mono text-[11px] transition-colors">
                    schema.sql & seed.sql (MySQL)
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('login')} className="hover:text-yellow-400 transition-colors">
                    Acceso Personal Administrativo
                  </button>
                </li>
                <li className="text-[11px] text-stone-500">
                  Tel: {STORE_INFO.phone}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} {STORE_INFO.name}. Todos los derechos reservados.
            </div>
            <div>
              Tecnología para ferreterías y almacenes de construcción.
            </div>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {shareProduct && (
        <ShareMenu product={shareProduct} onClose={() => setShareProduct(null)} />
      )}

      {taggingProduct && (
        <TagModal
          product={taggingProduct}
          onClose={() => setTaggingProduct(null)}
          onNavigateToProfile={() => navigateTo('client-profile')}
        />
      )}

      {isSqlModalOpen && <SqlViewerModal onClose={() => setIsSqlModalOpen(false)} />}

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
