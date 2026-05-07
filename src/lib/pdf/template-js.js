import * as React from "react";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  calcularSubtotal,
  calcularTotal,
  formatFechaLarga,
  formatMonedaCop,
  formatNumeroCotizacion
} from "@/lib/cotizaciones/calculations";
const LOGO_CANDIDATES = [
  resolve(process.cwd(), "public/assets/logo.png"),
  resolve(process.cwd(), "public/assets/logo.svg")
  // Note: react-pdf has limited SVG support, better to use PNG if possible or adjust.
];
const styles = StyleSheet.create({
  page: { padding: 55, fontFamily: "Times-Roman", fontSize: 14, color: "#131313" },
  watermark: {
    position: "absolute",
    top: "30%",
    left: "15%",
    width: "70%",
    opacity: 0.08
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40
  },
  headerLogo: {
    width: 182,
    height: 124
  },
  headerInfo: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  titleSection: {
    marginBottom: 20
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 15,
    marginBottom: 10,
    color: "#0d0d0d"
  },
  saludoContainer: {
    flexDirection: "row",
    marginBottom: 10
  },
  saludoBold: {
    fontFamily: "Times-Bold"
  },
  table: {
    width: "100%",
    marginBottom: 40
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    border: "1pt solid #262626",
    borderBottomWidth: 0
  },
  tableRow: {
    flexDirection: "row",
    border: "1pt solid #333333",
    borderBottomWidth: 0
  },
  tableRowLast: {
    borderBottomWidth: "1pt"
  },
  colDesc: {
    width: "45%",
    padding: 8,
    borderRight: "1pt solid #333333"
  },
  colTalla: {
    width: "10%",
    padding: 8,
    borderRight: "1pt solid #333333",
    textAlign: "center"
  },
  colCant: {
    width: "15%",
    padding: 8,
    borderRight: "1pt solid #333333",
    textAlign: "center"
  },
  colPrecio: {
    width: "15%",
    padding: 8,
    borderRight: "1pt solid #333333",
    textAlign: "right"
  },
  colTotal: {
    width: "15%",
    padding: 8,
    textAlign: "right"
  },
  tableCellHeader: {
    fontFamily: "Times-Bold",
    fontSize: 12
  },
  tableCell: {
    fontFamily: "Times-Roman",
    fontSize: 12
  },
  tableCellItalic: {
    fontFamily: "Times-Italic",
    fontSize: 12
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    border: "1pt solid #333333"
  },
  totalColTitle: {
    width: "85%",
    padding: 8,
    borderRight: "1pt solid #333333",
    textAlign: "right",
    fontFamily: "Times-Bold",
    fontSize: 12
  },
  totalColAmount: {
    width: "15%",
    padding: 8,
    textAlign: "right",
    fontFamily: "Times-Bold",
    fontSize: 12
  },
  footer: {
    marginTop: "auto"
  },
  agradecimiento: {
    marginBottom: 24
  },
  atentamente: {
    marginBottom: 75
  },
  signatureLine: {
    width: 170,
    borderBottom: "1pt solid #404040",
    marginBottom: 8
  },
  signer: {
    marginBottom: 12
  },
  companyInfo: {
    fontFamily: "Times-BoldItalic",
    lineHeight: 1.2
  }
});
const CotizacionDocument = ({
  data,
  logoBufferBase64
}) => {
  const productos = data.productos;
  const total = calcularTotal(productos);
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: styles.page }, logoBufferBase64 && /* @__PURE__ */ React.createElement(Image, { src: logoBufferBase64, style: styles.watermark }), /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(View, null, logoBufferBase64 && /* @__PURE__ */ React.createElement(Image, { src: logoBufferBase64, style: styles.headerLogo })), /* @__PURE__ */ React.createElement(View, { style: styles.headerInfo }, /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 12, marginBottom: 12 } }, formatFechaLarga(data.fecha)), /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: "Times-Bold", fontSize: 11 } }, "N\xFAmero de Cotizaci\xF3n: ", formatNumeroCotizacion(data.numero)))), /* @__PURE__ */ React.createElement(View, { style: styles.titleSection }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "COTIZACI\xD3N"), /* @__PURE__ */ React.createElement(View, { style: styles.saludoContainer }, /* @__PURE__ */ React.createElement(Text, null, "Estimados "), /* @__PURE__ */ React.createElement(Text, { style: styles.saludoBold }, data.cliente, ",")), /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: "Times-Bold", marginTop: 15 } }, "Detalle de Productos:")), /* @__PURE__ */ React.createElement(View, { style: styles.table }, /* @__PURE__ */ React.createElement(View, { style: styles.tableHeader }, /* @__PURE__ */ React.createElement(View, { style: styles.colDesc }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCellHeader }, "Descripcion del Producto")), /* @__PURE__ */ React.createElement(View, { style: styles.colTalla }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCellHeader }, "Talla")), /* @__PURE__ */ React.createElement(View, { style: styles.colCant }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCellHeader }, "Cantidad")), /* @__PURE__ */ React.createElement(View, { style: styles.colPrecio }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCellHeader }, "Precio Unitario")), /* @__PURE__ */ React.createElement(View, { style: styles.colTotal }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCellHeader }, "Subtotal"))), productos.map((producto, i) => {
    const isLast = i === productos.length - 1;
    return /* @__PURE__ */ React.createElement(
      View,
      {
        key: i,
        style: [styles.tableRow, isLast ? styles.tableRowLast : {}]
      },
      /* @__PURE__ */ React.createElement(View, { style: styles.colDesc }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCellItalic }, producto.descripcion)),
      /* @__PURE__ */ React.createElement(View, { style: styles.colTalla }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCell }, producto.talla || "-")),
      /* @__PURE__ */ React.createElement(View, { style: styles.colCant }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCell }, producto.cantidad)),
      /* @__PURE__ */ React.createElement(View, { style: styles.colPrecio }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCell }, formatMonedaCop(producto.precioUnitario))),
      /* @__PURE__ */ React.createElement(View, { style: styles.colTotal }, /* @__PURE__ */ React.createElement(Text, { style: styles.tableCell }, formatMonedaCop(calcularSubtotal(producto))))
    );
  }), /* @__PURE__ */ React.createElement(View, { style: styles.totalRow }, /* @__PURE__ */ React.createElement(View, { style: styles.totalColTitle }, /* @__PURE__ */ React.createElement(Text, null, "Total")), /* @__PURE__ */ React.createElement(View, { style: styles.totalColAmount }, /* @__PURE__ */ React.createElement(Text, null, formatMonedaCop(total))))), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, /* @__PURE__ */ React.createElement(Text, { style: styles.agradecimiento }, "Agradecemos su interes en nuestros servicios y quedamos atentos a cualquier inquietud."), /* @__PURE__ */ React.createElement(Text, { style: styles.atentamente }, "Atentamente,"), /* @__PURE__ */ React.createElement(View, { style: styles.signatureLine }), /* @__PURE__ */ React.createElement(Text, { style: styles.signer }, data.firmante ?? "Luz Elena L\xF3pez Mu\xF1oz"), /* @__PURE__ */ React.createElement(View, { style: styles.companyInfo }, /* @__PURE__ */ React.createElement(Text, null, "Confecciones Jotas"), /* @__PURE__ */ React.createElement(Text, null, "Direcci\xF3n: Calle 24H #10A-23"), /* @__PURE__ */ React.createElement(Text, null, "Telefono: 3208472821"), /* @__PURE__ */ React.createElement(Text, null, "Instagram: @confeccionesjotas")))));
};
async function loadLogo() {
  const sharp = (await import("sharp")).default;
  for (const path of LOGO_CANDIDATES) {
    try {
      const file = await readFile(path);
      const sharpInput = path.endsWith(".svg") ? sharp(file, { density: 300 }) : sharp(file);
      const pngBuffer = await sharpInput.trim({ threshold: 1 }).png({ compressionLevel: 9 }).toBuffer();
      const base64 = pngBuffer.toString("base64");
      return `data:image/png;base64,${base64}`;
    } catch {
    }
  }
  return null;
}
async function buildCotizacionPdf(data) {
  const logo = await loadLogo();
  const buffer = await renderToBuffer(/* @__PURE__ */ React.createElement(CotizacionDocument, { data, logoBufferBase64: logo }));
  return new Uint8Array(buffer);
}
export {
  buildCotizacionPdf
};
