import * as React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  calcularSubtotal,
  calcularTotal,
  formatFechaLarga,
  formatMonedaCop,
  formatNumeroCotizacion,
} from '@/lib/cotizaciones/calculations';
import type { ProductoInput } from '@/lib/cotizaciones/types';

// Opcional: registrar una fuente que se vea bien si quieres (Times Roman viene por defecto, pero puedes registrar las tuyas si las necesitas). Standard Fonts are supported.
const LOGO_CANDIDATES = [
  resolve(process.cwd(), 'public/assets/logo.png'),
  resolve(process.cwd(), 'public/assets/logo.svg'), // Note: react-pdf has limited SVG support, better to use PNG if possible or adjust.
];

export interface CotizacionPdfData {
  numero: number;
  cliente: string;
  fecha: string;
  productos: ProductoInput[];
  firmante?: string;
}

const styles = StyleSheet.create({
  page: { padding: 55, fontFamily: 'Times-Roman', fontSize: 14, color: '#131313' },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLogo: {
    width: 182,
    height: 124,
  },
  headerInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 15,
    marginBottom: 10,
    color: '#0d0d0d',
  },
  saludoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  saludoBold: {
    fontFamily: 'Times-Bold',
  },
  table: {
    width: '100%',
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    border: '1pt solid #262626',
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    border: '1pt solid #333333',
    borderBottomWidth: 0,
  },
  tableRowLast: {
    borderBottomWidth: '1pt',
  },
  colDesc: {
    width: '45%',
    padding: 8,
    borderRight: '1pt solid #333333',
  },
  colTalla: {
    width: '10%',
    padding: 8,
    borderRight: '1pt solid #333333',
    textAlign: 'center',
  },
  colCant: {
    width: '15%',
    padding: 8,
    borderRight: '1pt solid #333333',
    textAlign: 'center',
  },
  colPrecio: {
    width: '15%',
    padding: 8,
    borderRight: '1pt solid #333333',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    padding: 8,
    textAlign: 'right',
  },
  tableCellHeader: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
  },
  tableCell: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
  },
  tableCellItalic: {
    fontFamily: 'Times-Italic',
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    border: '1pt solid #333333',
  },
  totalColTitle: {
    width: '85%',
    padding: 8,
    borderRight: '1pt solid #333333',
    textAlign: 'right',
    fontFamily: 'Times-Bold',
    fontSize: 12,
  },
  totalColAmount: {
    width: '15%',
    padding: 8,
    textAlign: 'right',
    fontFamily: 'Times-Bold',
    fontSize: 12,
  },
  footer: {
    marginTop: 'auto',
  },
  agradecimiento: {
    marginBottom: 24,
  },
  atentamente: {
    marginBottom: 75,
  },
  signatureLine: {
    width: 170,
    borderBottom: '1pt solid #404040',
    marginBottom: 8,
  },
  signer: {
    marginBottom: 12,
  },
  companyInfo: {
    fontFamily: 'Times-BoldItalic',
    lineHeight: 1.2,
  },
});

const CotizacionDocument = ({
  data,
  logoBufferBase64,
}: {
  data: CotizacionPdfData;
  logoBufferBase64: string | null;
}) => {
  const productos = data.productos;
  const total = calcularTotal(productos);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {logoBufferBase64 && (
          <Image src={logoBufferBase64} style={styles.watermark} />
        )}

        <View style={styles.header}>
          <View>
            {logoBufferBase64 && (
              <Image src={logoBufferBase64} style={styles.headerLogo} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={{ fontSize: 12, marginBottom: 12 }}>
              {formatFechaLarga(data.fecha)}
            </Text>
            <Text style={{ fontFamily: 'Times-Bold', fontSize: 11 }}>
              Número de Cotización: {formatNumeroCotizacion(data.numero)}
            </Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>COTIZACIÓN</Text>
          <View style={styles.saludoContainer}>
            <Text>Estimados </Text>
            <Text style={styles.saludoBold}>{data.cliente},</Text>
          </View>
          <Text style={{ fontFamily: 'Times-Bold', marginTop: 15 }}>
            Detalle de Productos:
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableCellHeader}>Descripcion del Producto</Text>
            </View>
            <View style={styles.colTalla}>
              <Text style={styles.tableCellHeader}>Talla</Text>
            </View>
            <View style={styles.colCant}>
              <Text style={styles.tableCellHeader}>Cantidad</Text>
            </View>
            <View style={styles.colPrecio}>
              <Text style={styles.tableCellHeader}>Precio Unitario</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tableCellHeader}>Subtotal</Text>
            </View>
          </View>

          {productos.map((producto, i) => {
            const isLast = i === productos.length - 1;
            return (
              <View
                key={i}
                style={[styles.tableRow, isLast ? styles.tableRowLast : {}]}
              >
                <View style={styles.colDesc}>
                  <Text style={styles.tableCellItalic}>{producto.descripcion}</Text>
                </View>
                <View style={styles.colTalla}>
                  <Text style={styles.tableCell}>{producto.talla || '-'}</Text>
                </View>
                <View style={styles.colCant}>
                  <Text style={styles.tableCell}>{producto.cantidad}</Text>
                </View>
                <View style={styles.colPrecio}>
                  <Text style={styles.tableCell}>
                    {formatMonedaCop(producto.precioUnitario)}
                  </Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={styles.tableCell}>
                    {formatMonedaCop(calcularSubtotal(producto))}
                  </Text>
                </View>
              </View>
            );
          })}
          
          <View style={styles.totalRow}>
            <View style={styles.totalColTitle}>
              <Text>Total</Text>
            </View>
            <View style={styles.totalColAmount}>
              <Text>{formatMonedaCop(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.agradecimiento}>
            Agradecemos su interes en nuestros servicios y quedamos atentos a cualquier
            inquietud.
          </Text>
          <Text style={styles.atentamente}>Atentamente,</Text>

          <View style={styles.signatureLine} />
          
          <Text style={styles.signer}>
            {data.firmante ?? 'Luz Elena López Muñoz'}
          </Text>
          
          <View style={styles.companyInfo}>
            <Text>Confecciones Jotas</Text>
            <Text>Dirección: Calle 24H #10A-23</Text>
            <Text>Telefono: 3208472821</Text>
            <Text>Instagram: @confeccionesjotas</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

async function loadLogo(): Promise<string | null> {
  // We use sharp to convert SVG (which react-pdf doesn't support well) to PNG
  // or just optimize existing PNGs.
  const sharp = (await import('sharp')).default;
  for (const path of LOGO_CANDIDATES) {
    try {
      const file = await readFile(path);
      
      const sharpInput = path.endsWith('.svg')
        ? sharp(file, { density: 300 })
        : sharp(file);

      const pngBuffer = await sharpInput
        .trim({ threshold: 1 })
        .png({ compressionLevel: 9 })
        .toBuffer();
        
      const base64 = pngBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch {
      // ignore
    }
  }
  return null;
}

export async function buildCotizacionPdf(data: CotizacionPdfData): Promise<Uint8Array> {
  const logo = await loadLogo();
  const buffer = await renderToBuffer(<CotizacionDocument data={data} logoBufferBase64={logo} />);
  return new Uint8Array(buffer);
}
