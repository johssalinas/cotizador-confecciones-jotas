import {
  Copy,
  Download,
  Ellipsis,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-solid';
import { For, Show, createSignal } from 'solid-js';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatFechaLarga,
  formatMonedaCop,
  formatNumeroCotizacion,
} from '@/lib/cotizaciones/calculations';
import type { CotizacionListItem } from '@/lib/cotizaciones/types';
import { cn } from '@/lib/utils';

interface ListaCotizacionesProps {
  initialCotizaciones: CotizacionListItem[];
}

export function ListaCotizaciones(props: ListaCotizacionesProps) {
  const [cotizaciones, setCotizaciones] = createSignal(props.initialCotizaciones);
  const [activeId, setActiveId] = createSignal<string | null>(null);
  const [deleteTarget, setDeleteTarget] = createSignal<CotizacionListItem | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const refresh = async () => {
    setErrorMessage(null);

    try {
      const response = await fetch('/api/cotizaciones?limit=100');
      const payload = (await response.json()) as { data?: CotizacionListItem[]; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'No fue posible actualizar la lista.');
      }

      setCotizaciones(payload.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al actualizar.');
    }
  };

  const duplicate = async (item: CotizacionListItem) => {
    setActiveId(item.id);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/cotizaciones/${item.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'No fue posible duplicar la cotizacion.');
      }

      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al duplicar.');
    } finally {
      setActiveId(null);
    }
  };

  const remove = async () => {
    const target = deleteTarget();
    if (!target) {
      return;
    }

    setActiveId(target.id);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/cotizaciones/${target.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'No fue posible eliminar la cotizacion.');
      }

      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al eliminar.');
    } finally {
      setActiveId(null);
    }
  };

  const closeActionsMenu = (target: Element) => {
    const menu = target.closest('details');
    if (menu instanceof HTMLDetailsElement) {
      menu.open = false;
    }
  };

  const actionItemClass =
    'flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[0.95rem] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed';

  const actionDangerClass =
    'flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[0.95rem] font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive';

  const renderActionsMenu = (item: CotizacionListItem, isActive: boolean, showLabel = false) => (
    <details class="relative">
      <summary
        class={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'list-none cursor-pointer gap-2 [&::-webkit-details-marker]:hidden',
        )}
      >
        <Ellipsis class="h-4 w-4" />
        <Show when={showLabel}>
          <span>Acciones</span>
        </Show>
        <span class="sr-only">
          Abrir acciones de la cotizacion {formatNumeroCotizacion(item.numero)}
        </span>
      </summary>

      <div class="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-border bg-card p-2 shadow-lg">
        <a
          href={`/api/cotizaciones/${item.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          class={actionItemClass}
          onClick={(event) => closeActionsMenu(event.currentTarget)}
        >
          <Eye class="h-4 w-4" />
          Ver documento PDF
        </a>
        <a
          href={`/api/cotizaciones/${item.id}/pdf?download=1`}
          class={actionItemClass}
          onClick={(event) => closeActionsMenu(event.currentTarget)}
        >
          <Download class="h-4 w-4" />
          Descargar documento PDF
        </a>
        <a
          href={`/cotizaciones/${item.id}`}
          class={actionItemClass}
          onClick={(event) => closeActionsMenu(event.currentTarget)}
        >
          <Pencil class="h-4 w-4" />
          Editar esta cotizacion
        </a>
        <button
          type="button"
          class={actionItemClass}
          disabled={isActive}
          onClick={(event) => {
            closeActionsMenu(event.currentTarget);
            void duplicate(item);
          }}
        >
          <Show
            when={isActive}
            fallback={(
              <>
                <Copy class="h-4 w-4" />
                Duplicar esta cotizacion
              </>
            )}
          >
            <LoaderCircle class="h-4 w-4 animate-spin" />
            Duplicando cotizacion...
          </Show>
        </button>
        <button
          type="button"
          class={actionDangerClass}
          onClick={(event) => {
            closeActionsMenu(event.currentTarget);
            setDeleteTarget(item);
          }}
        >
          <Trash2 class="h-4 w-4" />
          Eliminar esta cotizacion
        </button>
      </div>
    </details>
  );

  const formatProductosPreview = (descripciones: string[]) => {
    if (descripciones.length === 0) {
      return 'Sin descripcion de productos';
    }

    return descripciones.join(', ');
  };

  const formatProductosTooltip = (descripciones: string[]) => {
    if (descripciones.length === 0) {
      return 'No hay descripciones de productos disponibles.';
    }

    return descripciones
      .map((descripcion, index) => `${index + 1}. ${descripcion}`)
      .join('\n');
  };

  return (
    <Card class="overflow-hidden border-border/80 bg-card/90 shadow-lg backdrop-blur">
      <CardHeader class="border-b border-border/70 bg-gradient-to-r from-[hsl(var(--accent)/0.55)] to-transparent sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle class="text-2xl tracking-wide">Cotizaciones Guardadas</CardTitle>
          <CardDescription class="mt-2 leading-relaxed">
            Historial de documentos con acciones para ver, descargar, editar, duplicar y eliminar.
          </CardDescription>
        </div>

        <div class="flex gap-2">
          <a href="/cotizaciones/nueva" class={cn(buttonVariants({ variant: 'default' }))}>
            <Plus class="h-4 w-4" />
            Nueva cotizacion
          </a>
        </div>
      </CardHeader>

      <CardContent class="pt-6">
        <Show when={errorMessage()}>
          {(message) => (
            <div class="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message()}
            </div>
          )}
        </Show>

        <div class="hidden overflow-x-auto rounded-md border border-border bg-card/70 px-3 shadow-sm lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="px-4 text-xs uppercase tracking-[0.08em]">Número</TableHead>
                <TableHead class="px-4 text-xs uppercase tracking-[0.08em]">Cliente</TableHead>
                <TableHead class="px-4 text-xs uppercase tracking-[0.08em]">Productos</TableHead>
                <TableHead class="px-4 text-xs uppercase tracking-[0.08em]">Fecha</TableHead>
                <TableHead class="px-4 text-xs uppercase tracking-[0.08em]">Total</TableHead>
                <TableHead class="px-4 text-right text-xs uppercase tracking-[0.08em]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={cotizaciones()}>
                {(item) => {
                  const isActive = () => activeId() === item.id;

                  return (
                    <TableRow>
                      <TableCell class="px-4 py-5 font-semibold">
                        {formatNumeroCotizacion(item.numero)}
                      </TableCell>
                      <TableCell class="px-4 py-5">{item.cliente}</TableCell>
                      <TableCell class="px-4 py-5">
                        <p
                          title={formatProductosTooltip(item.descripcionesProductos)}
                          class="max-h-16 max-w-[21rem] overflow-hidden text-sm leading-relaxed [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
                        >
                          {formatProductosPreview(item.descripcionesProductos)}
                        </p>
                      </TableCell>
                      <TableCell class="px-4 py-5">{formatFechaLarga(item.fecha)}</TableCell>
                      <TableCell class="px-4 py-5">{formatMonedaCop(item.total)}</TableCell>
                      <TableCell class="px-4 py-5">
                        <div class="flex justify-end">{renderActionsMenu(item, isActive())}</div>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </For>
            </TableBody>
          </Table>
        </div>

        <div class="grid gap-4 lg:hidden">
          <For each={cotizaciones()}>
            {(item) => {
              const isActive = () => activeId() === item.id;

              return (
                <div class="rounded-md border border-border bg-card/80 p-4 shadow-sm">
                  <div class="mb-3 space-y-1 text-sm">
                    <div class="flex items-start justify-between gap-3">
                      <p class="font-semibold text-foreground">{item.cliente}</p>
                      <p class="w-16 text-right font-semibold text-muted-foreground">
                        {formatNumeroCotizacion(item.numero)}
                      </p>
                    </div>
                    <p
                      title={formatProductosTooltip(item.descripcionesProductos)}
                      class="max-h-12 overflow-hidden text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                    >
                      {formatProductosPreview(item.descripcionesProductos)}
                    </p>
                    <p class="text-muted-foreground">{formatFechaLarga(item.fecha)}</p>
                    <p class="font-semibold text-foreground">{formatMonedaCop(item.total)}</p>
                  </div>
                  <div class="flex justify-end">
                    {renderActionsMenu(item, isActive(), true)}
                  </div>
                </div>
              );
            }}
          </For>
        </div>

        <Dialog open={Boolean(deleteTarget())} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent class="border-border bg-card">
            <DialogHeader>
              <DialogTitle>
                <Show when={deleteTarget()}>
                  {(item) =>
                    `Eliminar cotizacion #${formatNumeroCotizacion(item().numero)}`}
                </Show>
              </DialogTitle>
              <DialogDescription>
                Esta accion no se puede deshacer. Se eliminara el archivo PDF y el registro.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Dialog.CloseButton class={cn(buttonVariants({ variant: 'outline' }))}>
                Cancelar
              </Dialog.CloseButton>
              <Button variant="destructive" onClick={remove}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
