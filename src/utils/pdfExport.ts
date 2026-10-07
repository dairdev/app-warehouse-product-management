import { jsPDF } from 'jspdf';
import { Product, Category } from '../types';
import { STORE_INFO, formatCurrency } from './shareUtils';

/**
 * Trigger clean browser print preview formatted for A4
 */
export const printDatasheetOrCatalog = () => {
  window.print();
};

/**
 * Generate and download a single product technical datasheet PDF using jsPDF
 */
export const downloadProductPdf = (product: Product, categoryName: string, isManager: boolean = false) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Header Bar (Yellow / Dark Slate)
  doc.setFillColor(250, 204, 21); // yellow-400
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Brand Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ALMACENES NOR ORIENTE', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('MATERIALES DE CONSTRUCCIÓN & FERRETERÍA PESADA', margin, 19);

  // Date and Document Type
  doc.setFontSize(8);
  doc.text('FICHA TÉCNICA OFICIAL', pageWidth - margin, 14, { align: 'right' });
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - margin, 19, { align: 'right' });

  let y = 34;

  // Category & SKU
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${categoryName.toUpperCase()} · SKU: ${product.sku || 'N/A'}`, margin, y);
  y += 6;

  // Product Title (with unit)
  const fullTitle = `${product.name}${product.unit && !product.name.toLowerCase().includes(product.unit.toLowerCase()) ? ` (${product.unit})` : ''}`;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(fullTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Price box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Condición Comercial / Venta:', margin + 4, y + 7);
  const brandPres = [
    product.brandName ? `Marca: ${product.brandName}` : null,
    product.presentation ? `Presentación: ${product.presentation}` : null,
    product.unit ? `Unidad: ${product.unit}` : null,
  ].filter(Boolean).join('  |  ');
  doc.text(brandPres || 'Material para construcción civil', margin + 4, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(
    'Cotización directa para obra',
    pageWidth - margin - 4,
    y + 11,
    { align: 'right' }
  );
  y += 26;

  // Description Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Descripción del Producto', margin, y);
  y += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(product.description, contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 6;

  // Technical Characteristics Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Especificaciones & Parámetros Técnicos', margin, y);
  y += 5;

  if (product.attributes && product.attributes.length > 0) {
    // Table header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Parámetro / Característica', margin + 4, y + 4.8);
    doc.text('Valor Certificado', margin + contentWidth * 0.55, y + 4.8);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    product.attributes.forEach((attr, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(attr.key, margin + 4, y + 4.8);
      doc.setFont('helvetica', 'bold');
      doc.text(attr.value, margin + contentWidth * 0.55, y + 4.8);
      doc.setFont('helvetica', 'normal');
      y += 7;
    });
  }

  y += 6;

  // Recommendations and Guarantee
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Condiciones de Entrega y Almacenamiento', margin, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const noteLines = doc.splitTextToSize(
    '• Despacho a granel o estibado directo a pie de obra mediante camiones volquetes y plataformas autorizadas.\n' +
      '• Producto conforme a las Normas Técnicas Peruanas (NTP) y especificaciones ASTM aplicables.\n' +
      '• Garantía de calidad de fábrica respaldada por Almacenes Nor Oriente.',
    contentWidth
  );
  doc.text(noteLines, margin, y);

  // Footer Box
  const footerY = pageHeight - 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${STORE_INFO.name} · ${STORE_INFO.address} · ${STORE_INFO.city}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );
  doc.text(
    `Tel: ${STORE_INFO.phone} · Email: ${STORE_INFO.email} · Atención de Lunes a Sábado`,
    pageWidth / 2,
    footerY + 9,
    { align: 'center' }
  );
  doc.text(
    'Documento emitido con fines informativos y cotizaciones. Precios sujetos a variación sin previo aviso.',
    pageWidth / 2,
    footerY + 13,
    { align: 'center' }
  );

  const cleanFilename = `Ficha_Tecnica_${product.sku || 'Producto'}.pdf`;
  doc.save(cleanFilename);
};

/**
 * Generate full catalog PDF using jsPDF
 */
export const downloadFullCatalogPdf = (products: Product[], categories: Category[], isManager: boolean = false) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Cover Page
  // Accent yellow band
  doc.setFillColor(250, 204, 21);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('ALMACENES NOR ORIENTE', margin, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('MATERIALES DE CONSTRUCCIÓN & ACABADOS ESTRUCTURALES', margin, 42);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CATÁLOGO GENERAL DE PRODUCTOS 2026', margin, 75);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Edición Oficial para Clientes, Contratistas e Ingenieros Residentes · ${new Date().toLocaleDateString('es-PE')}`,
    margin,
    82
  );

  // Table of Contents
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Índice de Categorías y Líneas de Producto', margin, 100);

  let tocY = 110;
  const parentCats = categories.filter((c) => c.parentId === null);

  parentCats.forEach((cat, index) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${index + 1}. ${cat.name}`, margin + 5, tocY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${count} producto(s)`, pageWidth - margin - 5, tocY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin + 5, tocY + 2, pageWidth - margin - 5, tocY + 2);
    tocY += 9;
  });

  // Cover Page Contact info box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 215, contentWidth, 45, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Atención de Pedidos y Despachos en Obra', margin + 8, 226);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Dirección de Planta & Almacén: ${STORE_INFO.address}`, margin + 8, 234);
  doc.text(`• Teléfono Central / WhatsApp de Cotizaciones: ${STORE_INFO.phone}`, margin + 8, 241);
  doc.text(`• Correo Electrónico: ${STORE_INFO.email}`, margin + 8, 248);

  // Now create pages for products
  doc.addPage();

  let curY = 24;

  const printHeader = (pageNum: number) => {
    doc.setFillColor(250, 204, 21);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ALMACENES NOR ORIENTE · CATÁLOGO DE PRODUCTOS', margin, 8);
    doc.text(`Página ${pageNum}`, pageWidth - margin, 8, { align: 'right' });
  };

  printHeader(2);

  products.forEach((product, idx) => {
    // Check if space needed
    if (curY > pageHeight - 55) {
      doc.addPage();
      printHeader(doc.getNumberOfPages());
      curY = 24;
    }

    const cat = categories.find((c) => c.id === product.categoryId);

    // Product item box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, curY, contentWidth, 38, 2, 2, 'FD');

    // Title & SKU (with unit)
    const fullProdTitle = `${idx + 1}. ${product.name}${product.unit && !product.name.toLowerCase().includes(product.unit.toLowerCase()) ? ` (${product.unit})` : ''}`;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fullProdTitle, margin + 4, curY + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const metaParts = [
      `Categoría: ${cat?.name || 'General'}`,
      product.brandName ? `Marca: ${product.brandName}` : null,
      product.presentation ? `Presentación: ${product.presentation}` : null,
      product.unit ? `Unidad: ${product.unit}` : null,
      product.sku ? `SKU: ${product.sku}` : null,
    ].filter(Boolean).join('  |  ');
    doc.text(metaParts, margin + 4, curY + 12);

    // Short description
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const shortDesc = doc.splitTextToSize(product.description, contentWidth - 48);
    doc.text(shortDesc.slice(0, 2), margin + 4, curY + 18);

    // Key attribute
    if (product.attributes && product.attributes.length > 0) {
      const topAttr = product.attributes.slice(0, 2).map((a) => `${a.key}: ${a.value}`).join(' · ');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Especificaciones: ${topAttr}`, margin + 4, curY + 31);
    }

    // Dispatch condition pill
    doc.setFillColor(254, 249, 195); // yellow-100
    doc.roundedRect(pageWidth - margin - 46, curY + 5, 42, 14, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7);
    doc.text(
      'A cotizar obra',
      pageWidth - margin - 25,
      curY + 11,
      { align: 'center' }
    );
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 63, 18);
    doc.text(product.unit ? `por ${product.unit}` : 'directo a obra', pageWidth - margin - 25, curY + 16, { align: 'center' });

    curY += 43;
  });

  doc.save('Catalogo_Almacenes_Nor_Oriente.pdf');
};
