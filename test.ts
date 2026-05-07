import { buildCotizacionPdf } from './src/lib/pdf/template.tsx';
console.log('Testing...');
buildCotizacionPdf({
  numero: 1,
  cliente: 'Test',
  fecha: '2025-01-01',
  productos: [{ descripcion: 'P1', cantidad: 1, precioUnitario: 1000 }],
}).then(() => console.log('Success!'))
  .catch(err => console.error('Error:', err));