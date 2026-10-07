import { Product, ClientProfile, StoreSettings, Machinery } from '../types';

export const STORE_INFO: StoreSettings = {
  name: 'Almacenes Nor Oriente',
  phone: '+51 987 654 321',
  whatsappNumber: '51987654321',
  email: 'ventas@almacenesnororiente.com',
  address: 'Av. Circunvalación Norte 1420, Sector Industrial',
  city: 'Tarapoto / San Martín - Perú',
  ruc: '20601234567',
  schedule: 'Lunes a Sábado: 7:00 am - 6:00 pm',
  website: typeof window !== 'undefined' ? window.location.origin : '',
  // Page Headers Configuration
  catalogHeaderBadge: 'Distribución Mayorista & Menorista Directo a Obra',
  catalogHeaderTitle: 'Materiales de Construcción Pesada & Fichas Técnicas',
  catalogHeaderSubtitle: 'Precios por mayor, stock certificado bajo normas ASTM / NTP y cotización directa por WhatsApp para ingenieros, maestros de obra y constructoras.',
  headerTagline: 'Materiales de Construcción · Selva Central & Norte',
  profileHeaderTitle: 'Datos de la Obra / Cliente',
  profileHeaderSubtitle: 'Perfil de Obra & Lista de Materiales Etiquetados',
};

export const formatCurrency = (amount?: number | null, currency: 'PEN' | 'USD' = 'PEN') => {
  if (amount === undefined || amount === null) return 'A cotizar';
  const symbol = currency === 'PEN' ? 'S/.' : '$';
  return `${symbol} ${Number(amount).toFixed(2)}`;
};

/**
 * Generate WhatsApp share message for a single product
 */
export const getProductWhatsAppUrl = (product: Product, settings?: StoreSettings): string => {
  const store = settings || STORE_INFO;
  const url = `${window.location.origin}/#producto/${product.id}`;
  const lines = [
    `*¡Hola! Me interesa cotizar este material de construcción de ${store.name}:*`,
    ``,
    `🏗️ *${product.name}*`,
    product.unit ? `📦 *Unidad de despacho:* ${product.unit}` : '',
    product.brandName ? `🏷️ *Marca:* ${product.brandName}` : '',
    product.presentation ? `📐 *Presentación:* ${product.presentation}` : '',
    product.sku ? `🔖 *Código SKU:* ${product.sku}` : '',
    `💰 *Condición comercial:* Precio a cotizar por volumen y flete`,
  ].filter(Boolean);

  if (product.attributes && product.attributes.length > 0) {
    lines.push(``);
    lines.push(`*Especificaciones Técnicas:*`);
    product.attributes.slice(0, 4).forEach((attr) => {
      lines.push(`• ${attr.key}: ${attr.value}${attr.unit ? ` ${attr.unit}` : ''}`);
    });
  }

  lines.push(``);
  lines.push(`🔗 *Ver ficha técnica completa:* ${url}`);
  lines.push(`🏢 *${store.name}* — ${store.address}, ${store.city}. Entregas y flete directo a pie de obra.`);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${store.whatsappNumber}?text=${text}`;
};

/**
 * Generate WhatsApp quote request for a list of tagged products (prices omitted for client quotes)
 */
export const getQuoteWhatsAppUrl = (
  products: Product[],
  clientProfile: ClientProfile,
  settings?: StoreSettings
): string => {
  const store = settings || STORE_INFO;
  const lines = [
    `*SOLICITUD DE COTIZACIÓN DE MATERIALES — ${store.name}*`,
    `👤 *Cliente / Constructor:* ${clientProfile.name || 'Cliente'}`,
    clientProfile.phone ? `📞 *Teléfono:* ${clientProfile.phone}` : '',
    clientProfile.obraProjectName ? `🏗️ *Proyecto / Obra:* ${clientProfile.obraProjectName}` : '',
    clientProfile.notes ? `📝 *Detalles de entrega:* ${clientProfile.notes}` : '',
    ``,
    `*Materiales para cotizar:*`,
  ].filter(Boolean);

  products.forEach((p, idx) => {
    const skuText = p.sku ? ` [SKU: ${p.sku}]` : '';
    const unitText = p.unit ? ` (Unidad: ${p.unit})` : '';
    const presText = p.presentation ? ` · ${p.presentation}` : '';
    lines.push(`${idx + 1}. *${p.name}*${unitText}${presText}${skuText}`);
  });

  lines.push(``);
  lines.push(`Por favor envíeme la cotización formal con flete a obra y condiciones comerciales.`);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${store.whatsappNumber}?text=${text}`;
};

/**
 * Generate WhatsApp rental inquiry for machinery
 */
export const getMachineryWhatsAppUrl = (
  machinery: Machinery,
  rentalDetails?: {
    estimatedDays?: number | string;
    location?: string;
    needsOperator?: boolean;
    notes?: string;
  },
  settings?: StoreSettings
): string => {
  const store = settings || STORE_INFO;
  const url = `${window.location.origin}/#maquinaria/${machinery.id}`;
  const lines = [
    `*¡Hola! Deseo cotizar el ALQUILER de maquinaria de ${store.name}:*`,
    ``,
    `🚜 *Equipo:* ${machinery.name}`,
    `🏷️ *Marca / Modelo:* ${machinery.brand} ${machinery.model}`,
    machinery.capacity ? `📐 *Capacidad:* ${machinery.capacity}` : '',
    machinery.powerHp ? `⚡ *Potencia:* ${machinery.powerHp}` : '',
    ``,
    `*Detalles del Alquiler:*`,
    rentalDetails?.estimatedDays ? `⏱️ *Tiempo estimado:* ${rentalDetails.estimatedDays} día(s)` : '⏱️ *Tiempo estimado:* A coordinar',
    rentalDetails?.location ? `📍 *Lugar de la obra:* ${rentalDetails.location}` : '📍 *Lugar de la obra:* Selva Central / San Martín',
    rentalDetails?.needsOperator !== undefined
      ? `👷 *Requiere operador:* ${rentalDetails.needsOperator ? 'Sí (con operador)' : 'No (solo equipo)'}`
      : `👷 *Operador:* ${machinery.includesOperator ? 'Incluye operador certificado' : 'Solo equipo'}`,
    rentalDetails?.notes ? `📝 *Observaciones:* ${rentalDetails.notes}` : '',
    ``,
    `🔗 *Ficha técnica:* ${url}`,
    `🏢 *${store.name}* — ${store.address}, ${store.city}. Despacho y movilización directa.`,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${store.whatsappNumber}?text=${text}`;
};

/**
 * Generate Telegram share URL (prices omitted for public client view)
 */
export const getTelegramShareUrl = (product: Product, settings?: StoreSettings): string => {
  const store = settings || STORE_INFO;
  const url = `${window.location.origin}/#producto/${product.id}`;
  const unitSuffix = product.unit && !product.name.toLowerCase().includes(product.unit.toLowerCase())
    ? ` (${product.unit})`
    : '';
  const text = encodeURIComponent(
    `Revisa este material en ${store.name}: ${product.name}${unitSuffix} - Consulte cotización y disponibilidad`
  );
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
};

/**
 * Generate Mailto link (prices omitted for public client view)
 */
export const getEmailShareUrl = (product: Product, settings?: StoreSettings): string => {
  const store = settings || STORE_INFO;
  const url = `${window.location.origin}/#producto/${product.id}`;
  const unitSuffix = product.unit && !product.name.toLowerCase().includes(product.unit.toLowerCase())
    ? ` (${product.unit})`
    : '';
  const subject = encodeURIComponent(`Ficha Técnica: ${product.name}${unitSuffix} - ${store.name}`);
  const skuInfo = product.sku ? `SKU: ${product.sku}\n` : '';

  const body = encodeURIComponent(
    `Hola,\n\nTe comparto la ficha técnica del siguiente material de construcción de ${store.name}:\n\n` +
      `Producto: ${product.name}${unitSuffix}\n` +
      (product.unit ? `Unidad de despacho: ${product.unit}\n` : '') +
      `Marca: ${product.brandName || 'N/A'}\n` +
      `Presentación: ${product.presentation || 'N/A'}\n` +
      `Condición: Precio a cotizar por volumen y flete a pie de obra\n` +
      skuInfo +
      `Descripción: ${product.description}\n\n` +
      `Puedes ver todos los detalles y fotografías aquí:\n${url}\n\n` +
      `Saludos cordiales,\n${store.name}\n${store.address}\nTel: ${store.phone} | Email: ${store.email}`
  );
  return `mailto:?subject=${subject}&body=${body}`;
};
