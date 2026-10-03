import { Product, ClientProfile, StoreSettings } from '../types';

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
    `*¡Hola! Me interesa este material de construcción de ${store.name}:*`,
    ``,
    `🏗️ *${product.name}*`,
    product.brandName ? `🏷️ *Marca:* ${product.brandName}` : '',
    product.presentation ? `📐 *Presentación:* ${product.presentation}` : '',
    product.price !== undefined && product.price !== null
      ? `💰 *Precio:* ${formatCurrency(product.price, product.currency)}${product.unit ? ` por ${product.unit}` : ''}`
      : `💰 *Precio:* A cotizar`,
    product.sku ? `🔖 *Código SKU:* ${product.sku}` : '',
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
 * Generate WhatsApp quote request for a list of tagged products
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
    `*Materiales seleccionados:*`,
  ].filter(Boolean);

  let totalEstimate = 0;
  let hasPrices = false;

  products.forEach((p, idx) => {
    if (typeof p.price === 'number') {
      totalEstimate += p.price;
      hasPrices = true;
    }
    const priceText = p.price !== undefined && p.price !== null ? formatCurrency(p.price, p.currency) : 'A cotizar';
    const skuText = p.sku ? ` [${p.sku}]` : '';
    lines.push(`${idx + 1}. *${p.name}*${skuText} — ${priceText}${p.unit ? `/${p.unit}` : ''}`);
  });

  if (hasPrices) {
    lines.push(``);
    lines.push(`*Total referencial:* ${formatCurrency(totalEstimate)}`);
  }

  lines.push(``);
  lines.push(`Por favor confírmeme disponibilidad y costo de flete. ¡Gracias!`);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${store.whatsappNumber}?text=${text}`;
};

/**
 * Generate Telegram share URL
 */
export const getTelegramShareUrl = (product: Product, settings?: StoreSettings): string => {
  const store = settings || STORE_INFO;
  const url = `${window.location.origin}/#producto/${product.id}`;
  const priceInfo = product.price !== undefined && product.price !== null
    ? ` - ${formatCurrency(product.price, product.currency)}${product.unit ? `/${product.unit}` : ''}`
    : ' - Consultar precio';
  const text = encodeURIComponent(
    `Revisa este material en ${store.name}: ${product.name}${priceInfo}`
  );
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
};

/**
 * Generate Mailto link
 */
export const getEmailShareUrl = (product: Product, settings?: StoreSettings): string => {
  const store = settings || STORE_INFO;
  const url = `${window.location.origin}/#producto/${product.id}`;
  const subject = encodeURIComponent(`Ficha Técnica: ${product.name} - ${store.name}`);
  const priceInfo = product.price !== undefined && product.price !== null
    ? `${formatCurrency(product.price, product.currency)} por ${product.unit || 'unidad'}`
    : 'A cotizar';
  const skuInfo = product.sku ? `SKU: ${product.sku}\n` : '';

  const body = encodeURIComponent(
    `Hola,\n\nTe comparto la ficha técnica del siguiente material de construcción de ${store.name}:\n\n` +
      `Producto: ${product.name}\n` +
      `Marca: ${product.brandName || 'N/A'}\n` +
      `Presentación: ${product.presentation || 'N/A'}\n` +
      `Precio: ${priceInfo}\n` +
      skuInfo +
      `Descripción: ${product.description}\n\n` +
      `Puedes ver todos los detalles y fotografías aquí:\n${url}\n\n` +
      `Saludos cordiales,\n${store.name}\n${store.address}\nTel: ${store.phone} | Email: ${store.email}`
  );
  return `mailto:?subject=${subject}&body=${body}`;
};
