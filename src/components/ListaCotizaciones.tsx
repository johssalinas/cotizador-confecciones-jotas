import {
  Copy,
  Download,
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
  const [isLoading, setIsLoading] = createSignal(false);
  const [activeId, setActiveId] = createSignal<string | null>(null);
  const [deleteTarget, setDeleteTarget] = createSignal<CotizacionListItem | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
          <Button variant="secondary" onClick={refresh} disabled={isLoading()}>
            <Show when={isLoading()} fallback="Actualizar">
              <LoaderCircle class="h-4 w-4 animate-spin" />
            </Show>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Show when={errorMessage()}>
          {(message) => (
            <div class="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message()}
            </div>
          )}
        </Show>

        <div class="hidden overflow-x-auto rounded-md border border-border bg-card/70 shadow-sm lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="text-xs uppercase tracking-[0.08em]">Vista previa</TableHead>
                <TableHead class="text-xs uppercase tracking-[0.08em]">Numero</TableHead>
                <TableHead class="text-xs uppercase tracking-[0.08em]">Cliente</TableHead>
                <TableHead class="text-xs uppercase tracking-[0.08em]">Fecha</TableHead>
                <TableHead class="text-xs uppercase tracking-[0.08em]">Total</TableHead>
                <TableHead class="text-right text-xs uppercase tracking-[0.08em]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={cotizaciones()}>
                {(item) => {
                  const isActive = () => activeId() === item.id;

                  return (
                    <TableRow>
                      <TableCell>
                        <iframe
                          title={`Miniatura cotizacion ${formatNumeroCotizacion(item.numero)}`}
                          src={`${item.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          loading="lazy"
                          class="h-28 w-20 rounded border border-border bg-background"
                        />
                      </TableCell>
                      <TableCell class="font-semibold">
                        {formatNumeroCotizacion(item.numero)}
                      </TableCell>
                      <TableCell>{item.cliente}</TableCell>
                      <TableCell>{formatFechaLarga(item.fecha)}</TableCell>
                      <TableCell>{formatMonedaCop(item.total)}</TableCell>
                      <TableCell>
                        <div class="flex justify-end gap-1">
                          <a
                            href={`/api/cotizaciones/${item.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            <Eye class="h-4 w-4" />
                          </a>
                          <a
                            href={`/api/cotizaciones/${item.id}/pdf?download=1`}
                            class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            <Download class="h-4 w-4" />
                          </a>
                          <a
                            href={`/cotizaciones/${item.id}`}
                            class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            <Pencil class="h-4 w-4" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isActive()}
                            onClick={() => duplicate(item)}
                          >
                            <Show when={isActive()} fallback={<Copy class="h-4 w-4" />}>
                              <LoaderCircle class="h-4 w-4 animate-spin" />
                            </Show>
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </div>
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
                  <div class="mb-3 flex gap-3">
                    <iframe
                      title={`Miniatura cotizacion ${formatNumeroCotizacion(item.numero)}`}
                      src={`${item.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      loading="lazy"
                      class="h-24 w-16 rounded border border-border bg-background"
                    />
                    <div class="space-y-1 text-sm">
                      <p class="font-semibold text-foreground">
                        Cotizacion #{formatNumeroCotizacion(item.numero)}
                      </p>
                      <p class="text-muted-foreground">{item.cliente}</p>
                      <p class="text-muted-foreground">{formatFechaLarga(item.fecha)}</p>
                      <p class="font-semibold text-foreground">{formatMonedaCop(item.total)}</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <a
                      href={`/api/cotizaciones/${item.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Eye class="h-4 w-4" />
                    </a>
                    <a
                      href={`/api/cotizaciones/${item.id}/pdf?download=1`}
                      class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Download class="h-4 w-4" />
                    </a>
                    <a
                      href={`/cotizaciones/${item.id}`}
                      class={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Pencil class="h-4 w-4" />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isActive()}
                      onClick={() => duplicate(item)}
                    >
                      <Show when={isActive()} fallback={<Copy class="h-4 w-4" />}>
                        <LoaderCircle class="h-4 w-4 animate-spin" />
                      </Show>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
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
