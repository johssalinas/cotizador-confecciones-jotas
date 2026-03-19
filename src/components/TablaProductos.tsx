import { Plus, Trash2 } from 'lucide-solid';
import { Index, createMemo } from 'solid-js';

import { Button } from '@/components/ui/button';
import { TextField, TextFieldRoot } from '@/components/ui/textfield';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  calcularSubtotal,
  calcularTotal,
  formatMonedaCop,
} from '@/lib/cotizaciones/calculations';
import type { ProductoInput } from '@/lib/cotizaciones/types';

interface TablaProductosProps {
  productos: ProductoInput[];
  onChange: (next: ProductoInput[]) => void;
  disabled?: boolean;
}

function createBlankRow(): ProductoInput {
  return {
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
  };
}

export function TablaProductos(props: TablaProductosProps) {
  const rowErrors = createMemo(() => {
    return props.productos.map((producto) => ({
      descripcion:
        producto.descripcion.trim().length < 2 ? 'Descripcion demasiado corta.' : '',
      cantidad: producto.cantidad <= 0 ? 'Cantidad invalida.' : '',
      precioUnitario: producto.precioUnitario < 0 ? 'Precio invalido.' : '',
    }));
  });

  const updateRow = (index: number, patch: Partial<ProductoInput>) => {
    const next = [...props.productos];
    next[index] = { ...next[index], ...patch };
    props.onChange(next);
  };

  const addRow = () => {
    props.onChange([...props.productos, createBlankRow()]);
  };

  const removeRow = (index: number) => {
    const next = props.productos.filter((_, rowIndex) => rowIndex !== index);
    props.onChange(next.length > 0 ? next : [createBlankRow()]);
  };

  const totalGeneral = createMemo(() => formatMonedaCop(calcularTotal(props.productos)));

  return (
    <div class="space-y-4">
      <div class="overflow-x-auto rounded-md border border-border bg-card/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-xs uppercase tracking-[0.08em]">Descripcion del Producto</TableHead>
              <TableHead class="text-xs uppercase tracking-[0.08em]">Cantidad</TableHead>
              <TableHead class="text-xs uppercase tracking-[0.08em]">Precio Unitario</TableHead>
              <TableHead class="text-xs uppercase tracking-[0.08em]">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <Index each={props.productos}>
              {(producto, rowIndex) => (
                <TableRow>
                  <TableCell>
                    <TextFieldRoot>
                      <TextField
                        value={producto().descripcion}
                        placeholder="Ej. Uniforme en tela Lafayette"
                        class={
                          rowErrors()[rowIndex]?.descripcion
                            ? 'border-destructive focus-visible:ring-destructive/70'
                            : 'bg-background/80'
                        }
                        disabled={props.disabled}
                        onInput={(event) => {
                          updateRow(rowIndex, {
                            descripcion: event.currentTarget.value,
                          });
                        }}
                      />
                      {rowErrors()[rowIndex]?.descripcion && (
                        <p class="text-xs text-destructive">
                          {rowErrors()[rowIndex]?.descripcion}
                        </p>
                      )}
                    </TextFieldRoot>
                  </TableCell>

                  <TableCell>
                    <TextFieldRoot>
                      <TextField
                        type="number"
                        min={1}
                        value={String(producto().cantidad)}
                        class={
                          rowErrors()[rowIndex]?.cantidad
                            ? 'border-destructive focus-visible:ring-destructive/70'
                            : 'bg-background/80'
                        }
                        disabled={props.disabled}
                        onInput={(event) => {
                          const next = Number(event.currentTarget.value);
                          updateRow(rowIndex, {
                            cantidad: Number.isNaN(next) ? 0 : next,
                          });
                        }}
                      />
                      {rowErrors()[rowIndex]?.cantidad && (
                        <p class="text-xs text-destructive">
                          {rowErrors()[rowIndex]?.cantidad}
                        </p>
                      )}
                    </TextFieldRoot>
                  </TableCell>

                  <TableCell>
                    <TextFieldRoot>
                      <TextField
                        type="number"
                        min={0}
                        step="100"
                        value={String(producto().precioUnitario)}
                        class={
                          rowErrors()[rowIndex]?.precioUnitario
                            ? 'border-destructive focus-visible:ring-destructive/70'
                            : 'bg-background/80'
                        }
                        disabled={props.disabled}
                        onInput={(event) => {
                          const next = Number(event.currentTarget.value);
                          updateRow(rowIndex, {
                            precioUnitario: Number.isNaN(next) ? 0 : next,
                          });
                        }}
                      />
                      {rowErrors()[rowIndex]?.precioUnitario && (
                        <p class="text-xs text-destructive">
                          {rowErrors()[rowIndex]?.precioUnitario}
                        </p>
                      )}
                    </TextFieldRoot>
                  </TableCell>

                  <TableCell>
                    <p class="font-semibold text-foreground">
                      {formatMonedaCop(calcularSubtotal(producto()))}
                    </p>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={props.disabled}
                      onClick={() => removeRow(rowIndex)}
                      aria-label="Eliminar producto"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </Index>
            <TableRow>
              <TableCell class="font-semibold" colSpan={3}>
                Total General
              </TableCell>
              <TableCell class="font-semibold">{totalGeneral()}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Button variant="secondary" onClick={addRow} disabled={props.disabled}>
        <Plus class="h-4 w-4" />
        Agregar producto
      </Button>
    </div>
  );
}
