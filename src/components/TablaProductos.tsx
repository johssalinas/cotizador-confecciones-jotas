import { Plus, Trash2 } from 'lucide-solid';
import { For, createMemo, type Setter } from 'solid-js';

import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

interface TablaProductosProps {
  productos: ProductoInput[];
  onChange: Setter<ProductoInput[]>;
  disabled?: boolean;
  showValidationErrors?: boolean;
}

function createBlankRow(): ProductoInput {
  return {
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
  };
}

export function TablaProductos(props: TablaProductosProps) {
  const shouldShowErrors = () => props.showValidationErrors ?? false;

  const inputBaseClass =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-shadow placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

  const rowErrors = createMemo(() => {
    return props.productos.map((producto) => ({
      descripcion:
        producto.descripcion.trim().length < 2 ? 'Descripcion demasiado corta.' : '',
      cantidad: producto.cantidad <= 0 ? 'Cantidad invalida.' : '',
      precioUnitario: producto.precioUnitario < 0 ? 'Precio invalido.' : '',
    }));
  });

  const updateRow = (index: number, patch: Partial<ProductoInput>) => {
    props.onChange((current) =>
      current.map((producto, rowIndex) =>
        rowIndex === index ? { ...producto, ...patch } : producto,
      )
    );
  };

  const addRow = () => {
    props.onChange((current) => [...current, createBlankRow()]);
  };

  const removeRow = (index: number) => {
    props.onChange((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index);
      return next.length > 0 ? next : [createBlankRow()];
    });
  };

  const totalGeneral = createMemo(() => formatMonedaCop(calcularTotal(props.productos)));

  return (
    <div class="space-y-4">
      <div class="overflow-x-auto rounded-md border border-border bg-card/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-xs font-bold uppercase tracking-[0.08em]">Descripcion del Producto</TableHead>
              <TableHead class="text-xs font-bold uppercase tracking-[0.08em]">Cantidad</TableHead>
              <TableHead class="text-xs font-bold uppercase tracking-[0.08em]">Precio Unitario</TableHead>
              <TableHead class="text-xs font-bold uppercase tracking-[0.08em]">SubTotal</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={props.productos}>
              {(producto, rowIndex) => (
                <TableRow>
                  <TableCell>
                    <div class="space-y-1">
                      <input
                        value={producto.descripcion}
                        placeholder="Ej. Uniforme en tela Lafayette"
                        class={cn(
                          inputBaseClass,
                          shouldShowErrors() && rowErrors()[rowIndex()]?.descripcion
                            ? 'border-destructive focus-visible:ring-destructive/70'
                            : 'bg-background/80',
                        )}
                        disabled={props.disabled}
                        onInput={(event) => {
                          updateRow(rowIndex(), {
                            descripcion: event.currentTarget.value,
                          });
                        }}
                      />
                      {shouldShowErrors() && rowErrors()[rowIndex()]?.descripcion && (
                        <p class="text-xs text-destructive">
                          {rowErrors()[rowIndex()]?.descripcion}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div class="space-y-1">
                      <input
                        type="number"
                        min={1}
                        value={String(producto.cantidad)}
                        class={cn(
                          inputBaseClass,
                          shouldShowErrors() && rowErrors()[rowIndex()]?.cantidad
                            ? 'border-destructive focus-visible:ring-destructive/70'
                            : 'bg-background/80',
                        )}
                        disabled={props.disabled}
                        onInput={(event) => {
                          const next = Number(event.currentTarget.value);
                          updateRow(rowIndex(), {
                            cantidad: Number.isNaN(next) ? 0 : next,
                          });
                        }}
                      />
                      {shouldShowErrors() && rowErrors()[rowIndex()]?.cantidad && (
                        <p class="text-xs text-destructive">
                          {rowErrors()[rowIndex()]?.cantidad}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div class="space-y-1">
                      <input
                        type="number"
                        min={0}
                        step="100"
                        value={String(producto.precioUnitario)}
                        class={cn(
                          inputBaseClass,
                          shouldShowErrors() && rowErrors()[rowIndex()]?.precioUnitario
                            ? 'border-destructive focus-visible:ring-destructive/70'
                            : 'bg-background/80',
                        )}
                        disabled={props.disabled}
                        onInput={(event) => {
                          const next = Number(event.currentTarget.value);
                          updateRow(rowIndex(), {
                            precioUnitario: Number.isNaN(next) ? 0 : next,
                          });
                        }}
                      />
                      {shouldShowErrors() && rowErrors()[rowIndex()]?.precioUnitario && (
                        <p class="text-xs text-destructive">
                          {rowErrors()[rowIndex()]?.precioUnitario}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <p class="font-semibold text-foreground">
                      {formatMonedaCop(calcularSubtotal(producto))}
                    </p>
                  </TableCell>

                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={props.disabled}
                      onClick={() => removeRow(rowIndex())}
                      aria-label="Eliminar producto"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </For>
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

      <Button
        type="button"
        variant="secondary"
        class="cursor-pointer"
        onClick={addRow}
        disabled={props.disabled}
      >
        <Plus class="h-4 w-4" />
        Agregar producto
      </Button>
    </div>
  );
}
