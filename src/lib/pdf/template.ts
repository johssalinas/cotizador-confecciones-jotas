import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import sharp from 'sharp';

import {
  calcularSubtotal,
  calcularTotal,
  formatFechaLarga,
  formatMonedaCop,
  formatNumeroCotizacion,
} from '@/lib/cotizaciones/calculations';
import type { ProductoInput } from '@/lib/cotizaciones/types';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 55;
const DETAIL_LABEL_Y = A4_HEIGHT - 235;
const TABLE_TOP = DETAIL_LABEL_Y - 58;
const ROW_HEIGHT = 30;
const FONT_SIZE_BODY = 14;
const FONT_SIZE_TITLE = 15;
const FONT_SIZE_TABLE = 12;
const CLOSING_GAP_AFTER_CONTENT = 58;
const CLOSING_LINE_GAP = 24;
const MIN_CLOSING_Y = 224;
const SIGNATURE_GAP_AFTER_CLOSING = 100;
const MIN_SIGNATURE_LINE_Y = 102;
const MAX_SIGNATURE_LINE_Y = 118;

const LOGO_CANDIDATES = [
  resolve(process.cwd(), 'public/assets/logo.png'),
  resolve(process.cwd(), 'public/assets/logo.svg'),
];

interface CotizacionPdfData {
  numero: number;
  cliente: string;
  fecha: string;
  productos: ProductoInput[];
  firmante?: string;
}

interface TableColumns {
  descripcionX: number;
  descripcionWidth: number;
  cantidadX: number;
  cantidadWidth: number;
  precioX: number;
  precioWidth: number;
  totalX: number;
  totalWidth: number;
  right: number;
}

function drawRightAlignedText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - textWidth,
    y,
    font,
    size,
  });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: centerX - textWidth / 2,
    y,
    font,
    size,
  });
}

function truncateText(value: string, max = 42): string {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

async function loadLogoPng(): Promise<Uint8Array | null> {
  for (const path of LOGO_CANDIDATES) {
    try {
      const file = await readFile(path);

      const sharpInput = path.endsWith('.svg')
        ? sharp(file, { density: 300 })
        : sharp(file);

      const png = await sharpInput
        .trim({ threshold: 1 })
        .png({ compressionLevel: 9 })
        .toBuffer();

      return new Uint8Array(png);
    } catch {
      // Keep trying candidate logo paths.
    }
  }

  return null;
}

function drawHeader(
  page: PDFPage,
  opts: {
    fechaLarga: string;
    numero: number;
    cliente: string;
    logo?: { image: Awaited<ReturnType<PDFDocument['embedPng']>> };
  },
  boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
  regularFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const headerRightX = A4_WIDTH - MARGIN_X;

  if (opts.logo) {
    page.drawImage(opts.logo.image, {
      x: MARGIN_X - 2,
      y: A4_HEIGHT - 138,
      width: 182,
      height: 124,
    });
  }

  drawRightAlignedText(page, opts.fechaLarga, headerRightX, A4_HEIGHT - 60, regularFont, 12);

  drawRightAlignedText(
    page,
    `Número de Cotización: ${formatNumeroCotizacion(opts.numero)}`,
    headerRightX,
    A4_HEIGHT - 84,
    boldFont,
    11,
  );

  page.drawText('COTIZACIÓN', {
    x: MARGIN_X,
    y: A4_HEIGHT - 168,
    font: boldFont,
    size: FONT_SIZE_TITLE,
    color: rgb(0.05, 0.05, 0.05),
  });

  const saludo = 'Estimados ';
  const saludoX = MARGIN_X;
  const saludoY = A4_HEIGHT - 206;
  const saludoWidth = regularFont.widthOfTextAtSize(saludo, FONT_SIZE_BODY);

  page.drawText(saludo, {
    x: saludoX,
    y: saludoY,
    font: regularFont,
    size: FONT_SIZE_BODY,
  });

  page.drawText(`${truncateText(opts.cliente, 36)},`, {
    x: saludoX + saludoWidth,
    y: saludoY,
    font: boldFont,
    size: FONT_SIZE_BODY,
  });

  page.drawText('Detalle de Productos:', {
    x: MARGIN_X,
    y: DETAIL_LABEL_Y,
    font: boldFont,
    size: FONT_SIZE_BODY,
  });
}

function drawTableHeader(
  page: PDFPage,
  y: number,
  boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const tableLeft = MARGIN_X;
  const tableRight = A4_WIDTH - MARGIN_X;
  const columns: TableColumns = {
    descripcionX: tableLeft,
    descripcionWidth: 245,
    cantidadX: tableLeft + 245,
    cantidadWidth: 70,
    precioX: tableLeft + 245 + 70,
    precioWidth: 95,
    totalX: tableLeft + 245 + 70 + 95,
    totalWidth: tableRight - (tableLeft + 245 + 70 + 95),
    right: tableRight,
  };

  page.drawRectangle({
    x: columns.descripcionX,
    y,
    width: columns.right - columns.descripcionX,
    height: ROW_HEIGHT,
    borderColor: rgb(0.15, 0.15, 0.15),
    borderWidth: 1,
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawText('Descripcion del Producto', {
    x: columns.descripcionX + 8,
    y: y + 10,
    font: boldFont,
    size: FONT_SIZE_TABLE,
  });

  drawCenteredText(
    page,
    'Cantidad',
    columns.cantidadX + columns.cantidadWidth / 2,
    y + 10,
    boldFont,
    FONT_SIZE_TABLE,
  );

  drawCenteredText(
    page,
    'Precio Unitario',
    columns.precioX + columns.precioWidth / 2,
    y + 10,
    boldFont,
    FONT_SIZE_TABLE,
  );

  drawCenteredText(
    page,
    'Subtotal',
    columns.totalX + columns.totalWidth / 2,
    y + 10,
    boldFont,
    FONT_SIZE_TABLE,
  );

  page.drawLine({
    start: { x: columns.cantidadX, y },
    end: { x: columns.cantidadX, y: y + ROW_HEIGHT },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawLine({
    start: { x: columns.precioX, y },
    end: { x: columns.precioX, y: y + ROW_HEIGHT },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawLine({
    start: { x: columns.totalX, y },
    end: { x: columns.totalX, y: y + ROW_HEIGHT },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  return columns;
}

function drawWatermark(
  page: PDFPage,
  logoImage: Awaited<ReturnType<PDFDocument['embedPng']>> | null,
) {
  if (!logoImage) {
    return;
  }

  const watermarkWidth = 430;
  const watermarkHeight = 324;

  page.drawImage(logoImage, {
    x: (A4_WIDTH - watermarkWidth) / 2,
    y: (A4_HEIGHT - watermarkHeight) / 2 - 72,
    width: watermarkWidth,
    height: watermarkHeight,
    opacity: 0.08,
  });
}

export async function buildCotizacionPdf(data: CotizacionPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);

  const boldFont = await doc.embedFont(StandardFonts.TimesRomanBold);
  const regularFont = await doc.embedFont(StandardFonts.TimesRoman);
  const italicFont = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const boldItalicFont = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const logoBytes = await loadLogoPng();
  const logoImage = logoBytes ? await doc.embedPng(logoBytes) : null;

  drawWatermark(page, logoImage);

  drawHeader(
    page,
    {
      fechaLarga: formatFechaLarga(data.fecha),
      numero: data.numero,
      cliente: data.cliente,
      logo: logoImage ? { image: logoImage } : undefined,
    },
    boldFont,
    regularFont,
  );

  const columns = drawTableHeader(page, TABLE_TOP, boldFont);
  const productos = data.productos;

  let currentY = TABLE_TOP - ROW_HEIGHT;

  for (const producto of productos) {
    page.drawRectangle({
      x: columns.descripcionX,
      y: currentY,
      width: columns.right - columns.descripcionX,
      height: ROW_HEIGHT,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawText(truncateText(producto.descripcion, 45), {
      x: columns.descripcionX + 8,
      y: currentY + 10,
      font: italicFont,
      size: FONT_SIZE_TABLE,
    });

    drawCenteredText(
      page,
      String(producto.cantidad),
      columns.cantidadX + columns.cantidadWidth / 2,
      currentY + 10,
      regularFont,
      FONT_SIZE_TABLE,
    );

    drawRightAlignedText(
      page,
      formatMonedaCop(producto.precioUnitario),
      columns.precioX + columns.precioWidth - 7,
      currentY + 10,
      regularFont,
      FONT_SIZE_TABLE,
    );

    drawRightAlignedText(
      page,
      formatMonedaCop(calcularSubtotal(producto)),
      columns.totalX + columns.totalWidth - 7,
      currentY + 10,
      regularFont,
      FONT_SIZE_TABLE,
    );

    page.drawLine({
      start: { x: columns.cantidadX, y: currentY },
      end: { x: columns.cantidadX, y: currentY + ROW_HEIGHT },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawLine({
      start: { x: columns.precioX, y: currentY },
      end: { x: columns.precioX, y: currentY + ROW_HEIGHT },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawLine({
      start: { x: columns.totalX, y: currentY },
      end: { x: columns.totalX, y: currentY + ROW_HEIGHT },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    currentY -= ROW_HEIGHT;
  }

  const total = calcularTotal(productos);

  page.drawRectangle({
    x: columns.precioX,
    y: currentY,
    width: columns.right - columns.precioX,
    height: ROW_HEIGHT,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });

  page.drawLine({
    start: { x: columns.totalX, y: currentY },
    end: { x: columns.totalX, y: currentY + ROW_HEIGHT },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  drawRightAlignedText(
    page,
    'Total',
    columns.totalX - 8,
    currentY + 10,
    boldFont,
    FONT_SIZE_TABLE,
  );

  drawRightAlignedText(
    page,
    formatMonedaCop(total),
    columns.totalX + columns.totalWidth - 7,
    currentY + 10,
    boldFont,
    FONT_SIZE_TABLE,
  );

  const contentBottomY = currentY;

  // Keep the closing block close to the latest content while preserving footer clearance.
  const agradecimientoY = Math.max(MIN_CLOSING_Y, contentBottomY - CLOSING_GAP_AFTER_CONTENT);
  const atentamenteY = agradecimientoY - CLOSING_LINE_GAP;
  const signatureLineBaseY = atentamenteY - SIGNATURE_GAP_AFTER_CLOSING;
  const signatureLineY = Math.min(
    MAX_SIGNATURE_LINE_Y,
    Math.max(MIN_SIGNATURE_LINE_Y, signatureLineBaseY),
  );
  const signerNameY = signatureLineY - 14;
  const companyNameY = signerNameY - 26;
  const addressY = companyNameY - 16;
  const phoneY = addressY - 14;
  const instagramY = phoneY - 14;

  page.drawText(
    'Agradecemos su interes en nuestros servicios y quedamos atentos a cualquier inquietud.',
    {
      x: MARGIN_X,
      y: agradecimientoY,
      size: FONT_SIZE_BODY,
      font: regularFont,
      color: rgb(0.12, 0.12, 0.12),
    },
  );

  page.drawText('Atentamente,', {
    x: MARGIN_X,
    y: atentamenteY,
    size: FONT_SIZE_BODY,
    font: regularFont,
    color: rgb(0.12, 0.12, 0.12),
  });

  page.drawLine({
    start: { x: MARGIN_X, y: signatureLineY },
    end: { x: MARGIN_X + 170, y: signatureLineY },
    thickness: 1,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText(data.firmante ?? 'Luz Elena López Muñoz', {
    x: MARGIN_X,
    y: signerNameY,
    size: FONT_SIZE_BODY,
    font: regularFont,
  });

  page.drawText('Confecciones Jotas', {
    x: MARGIN_X,
    y: companyNameY,
    size: FONT_SIZE_BODY,
    font: boldItalicFont,
  });

  page.drawText('Dirección: Calle 24H #10A-23', {
    x: MARGIN_X,
    y: addressY,
    size: FONT_SIZE_BODY,
    font: boldItalicFont,
  });

  page.drawText('Telefono: 3208472821', {
    x: MARGIN_X,
    y: phoneY,
    size: FONT_SIZE_BODY,
    font: boldItalicFont,
  });

  page.drawText('Instagram: @confeccionesjotas', {
    x: MARGIN_X,
    y: instagramY,
    size: FONT_SIZE_BODY,
    font: boldItalicFont,
  });

  const bytes = await doc.save({ useObjectStreams: true });
  return new Uint8Array(bytes);
}
