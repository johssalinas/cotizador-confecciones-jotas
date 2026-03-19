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
  DialogCancel,
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
    <Card>
      <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Cotizaciones Guardadas</CardTitle>
          <CardDescription>
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
            <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message()}
            </div>
          )}
        </Show>

        <div class="hidden overflow-x-auto rounded-lg border border-neutral-200 lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vista previa</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
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
                          class="h-28 w-20 rounded border border-neutral-200 bg-white"
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
                <div class="rounded-lg border border-neutral-200 p-4">
                  <div class="mb-3 flex gap-3">
                    <iframe
                      title={`Miniatura cotizacion ${formatNumeroCotizacion(item.numero)}`}
                      src={`${item.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      loading="lazy"
                      class="h-24 w-16 rounded border border-neutral-200 bg-white"
                    />
                    <div class="space-y-1 text-sm">
                      <p class="font-semibold text-neutral-900">
                        Cotizacion #{formatNumeroCotizacion(item.numero)}
                      </p>
                      <p class="text-neutral-600">{item.cliente}</p>
                      <p class="text-neutral-600">{formatFechaLarga(item.fecha)}</p>
                      <p class="font-semibold text-neutral-900">{formatMonedaCop(item.total)}</p>
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
          <DialogContent>
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
              <DialogCancel>Cancelar</DialogCancel>
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
