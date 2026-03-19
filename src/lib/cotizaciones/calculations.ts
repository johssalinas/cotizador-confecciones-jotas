import type { ProductoInput } from './types';

function parseDateValue(value: string): Date | null {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (isoDatePattern.test(value)) {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function calcularSubtotal(producto: ProductoInput): number {
  return roundMoneda(producto.cantidad * producto.precioUnitario);
}

export function calcularTotal(productos: ProductoInput[]): number {
  return roundMoneda(
    productos.reduce((acc, producto) => acc + calcularSubtotal(producto), 0),
  );
}

export function roundMoneda(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMonedaCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatFechaLarga(value: string): string {
  const date = parseDateValue(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatNumeroCotizacion(value: number): string {
  const normalized = Math.max(0, Math.trunc(value));
  return normalized.toString().padStart(3, '0');
}
