import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import {
  getProductWhatsAppUrl,
  getTelegramShareUrl,
  getEmailShareUrl,
  STORE_INFO,
  formatCurrency,
} from '../utils/shareUtils';
import { downloadProductPdf } from '../utils/pdfExport';
import { getMediaUrl } from '../utils/mediaUtils';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  Mail,
  FileDown,
  Printer,
  ExternalLink,
} from 'lucide-react';

interface ShareMenuProps {
  product: Product;
  onClose: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ product, onClose }) => {
  const { categories, storeSettings, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const category = categories.find((c) => c.id === product.categoryId);
  const productUrl = `${window.location.origin}/#producto/${product.id}`;
  const whatsappUrl = getProductWhatsAppUrl(product, storeSettings);
  const telegramUrl = getTelegramShareUrl(product, storeSettings);
  const mailtoUrl = getEmailShareUrl(product, storeSettings);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      showToast('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleSendSimulatedEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast('Por favor ingrese un correo electrónico válido', 'error');
      return;
    }

    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSentSuccess(true);
      showToast(`Ficha técnica enviada exitosamente a ${recipientEmail}`);
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 700);
  };

  const handleDownloadPdf = () => {
    downloadProductPdf(product, category?.name || 'Materiales de Construcción');
    showToast('Ficha técnica generada en PDF');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-stone-900">Compartir Ficha de Producto</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Target Product Summary */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-3">
            {product.media && product.media[0] ? (
              <img
                src={getMediaUrl(product.media[0].url)}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-cover rounded-lg shrink-0 border border-stone-200"
              />
            ) : null}
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                {product.sku ? `SKU: ${product.sku}` : product.brandName || 'Ferretería'}
              </span>
              <p className="text-sm font-bold text-stone-900 truncate">{product.name}</p>
              <p className="text-xs font-semibold text-amber-800">
                {formatCurrency(product.price, product.currency)} {product.unit ? `por ${product.unit}` : ''}
              </p>
            </div>
          </div>

          {/* Instant Share Channels */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Mensajería Rápida
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Copy Link & PDF */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                copied
                  ? 'bg-yellow-100 border-yellow-400 text-stone-900'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold transition-colors"
            >
              <FileDown className="w-4 h-4 text-amber-700" />
              <span>Descargar PDF</span>
            </button>
          </div>

          {/* Send via Direct Email Form */}
          <div className="pt-3 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Enviar por Correo Electrónico
            </label>
            <form onSubmit={handleSendSimulatedEmail} className="space-y-2.5">
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="correo@cliente.com"
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Nota adicional opcional (ej: Cotización para obra San Martín)..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <a
                  href={mailtoUrl}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                >
                  Abrir cliente de correo (Mailto)
                </a>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Enviando...' : 'Enviar Ficha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
