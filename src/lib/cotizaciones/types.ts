import { z } from 'zod';

export const productoSchema = z.object({
  descripcion: z.string().trim().min(2, 'Ingresa una descripcion valida.'),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser mayor a 0.'),
  precioUnitario: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
});

export const cotizacionInputSchema = z.object({
  cliente: z.string().trim().min(2, 'Ingresa el nombre del cliente.'),
  fecha: z.string().min(1, 'Ingresa una fecha.'),
  productos: z.array(productoSchema).min(1, 'Debes agregar al menos un producto.'),
});

export type ProductoInput = z.infer<typeof productoSchema>;
export type CotizacionInput = z.infer<typeof cotizacionInputSchema>;

export interface CotizacionRecord {
  id: string;
  numero: number;
  cliente: string;
  fecha: string;
  total: number;
  pdfUrl: string;
  productos: ProductoInput[];
  createdAt: string;
  updatedAt: string;
}

export interface CotizacionListItem {
  id: string;
  numero: number;
  cliente: string;
  descripcionesProductos: string[];
  fecha: string;
  total: number;
}

export interface CotizacionApiError {
  error: string;
  details?: unknown;
}
