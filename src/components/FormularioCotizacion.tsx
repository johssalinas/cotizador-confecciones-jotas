import { createForm } from '@tanstack/solid-form';
import {
  ArrowLeft,
  CircleCheckBig,
  Download,
  Eye,
  LoaderCircle,
  Save,
} from 'lucide-solid';
import { Show, createMemo, createSignal } from 'solid-js';

import { TablaProductos } from '@/components/TablaProductos';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TextField,
  TextFieldLabel,
  TextFieldRoot,
} from '@/components/ui/textfield';
import {
  formatNumeroCotizacion,
} from '@/lib/cotizaciones/calculations';
import {
  cotizacionInputSchema,
  type CotizacionRecord,
  type ProductoInput,
} from '@/lib/cotizaciones/types';
import { cn } from '@/lib/utils';

interface FormularioCotizacionProps {
  mode: 'create' | 'edit';
  initialCotizacion?: CotizacionRecord;
}

function getTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeDate(value?: string): string {
  if (!value) {
    return getTodayISODate();
  }

  return value.slice(0, 10);
}

function createBlankProducto(): ProductoInput {
  return {
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
  };
}

export function FormularioCotizacion(props: FormularioCotizacionProps) {
  const initialProductos =
    props.initialCotizacion?.productos.length && props.initialCotizacion.productos.length > 0
      ? props.initialCotizacion.productos
      : [createBlankProducto()];

  const [productos, setProductos] = createSignal<ProductoInput[]>(initialProductos);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = createSignal(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = createSignal(false);
  const [savedCotizacion, setSavedCotizacion] = createSignal<CotizacionRecord | null>(
    props.initialCotizacion ?? null,
  );

  const form = createForm(() => ({
    defaultValues: {
      cliente: props.initialCotizacion?.cliente ?? '',
      fecha: normalizeDate(props.initialCotizacion?.fecha),
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);

      const payload = {
        ...value,
        productos: productos(),
      };

      const parsed = cotizacionInputSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage('Revisa los datos del formulario antes de guardar.');
        return;
      }

      const cotizacionActual = savedCotizacion() ?? props.initialCotizacion ?? null;
      const endpoint = cotizacionActual
        ? `/api/cotizaciones/${cotizacionActual.id}`
        : '/api/cotizaciones';
      const method = cotizacionActual ? 'PUT' : 'POST';

      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(parsed.data),
        });

        const result = (await response.json()) as {
          data?: CotizacionRecord;
          error?: string;
        };

        if (!response.ok || !result.data) {
          setErrorMessage(result.error ?? 'No fue posible guardar la cotizacion.');
          return;
        }

        setSavedCotizacion(result.data);
        setIsSuccessDialogOpen(true);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No fue posible guardar la cotizacion.',
        );
      }
    },
  }));

  const isSubmitting = form.useStore((state) => state.isSubmitting);

  const cotizacionActual = createMemo(
    () => savedCotizacion() ?? props.initialCotizacion ?? null,
  );
  const numeroVisible = createMemo(
    () => cotizacionActual()?.numero ?? null,
  );
  const cotizacionId = createMemo(
    () => cotizacionActual()?.id ?? null,
  );

  return (
    <div class="mx-auto w-full max-w-5xl">
      <Card class="overflow-hidden border-border/80 bg-card/90 shadow-lg backdrop-blur">
        <CardHeader class="border-b border-border/70 bg-linear-to-r from-[hsl(var(--accent)/0.55)] to-transparent">
          <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <a
              href="/"
              class={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'w-fit gap-2 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20',
              )}
            >
              <ArrowLeft class="h-4 w-4" />
              Volver al inicio
            </a>

            <Show when={cotizacionId()}>
              {(id) => (
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={`/api/cotizaciones/${id()}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    class={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'gap-2 border-primary/35 bg-background/80',
                    )}
                  >
                    <Eye class="h-4 w-4" />
                    Ver PDF
                  </a>
                  <a
                    href={`/api/cotizaciones/${id()}/pdf?download=1`}
                    class={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'gap-2 border-primary/35 bg-background/80',
                    )}
                  >
                    <Download class="h-4 w-4" />
                    Descargar PDF
                  </a>
                </div>
              )}
            </Show>
          </div>

          <CardTitle class="text-2xl tracking-wide text-foreground">
            {props.mode === 'create' ? 'Nueva Cotización' : 'Editar Cotización'}
          </CardTitle>
          <CardDescription class="leading-relaxed">
            {numeroVisible()
              ? `Número asignado: ${formatNumeroCotizacion(numeroVisible() ?? 0)}`
              : 'El numero se asigna automaticamente al guardar.'}
            {' '}
            El PDF se genera unicamente al guardar la cotizacion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            class="space-y-7"
            onSubmit={async (event) => {
              event.preventDefault();
              setShowValidationErrors(true);
              await form.handleSubmit();
            }}
          >
            <div class="mt-3 grid gap-4 sm:grid-cols-2">
              <form.Field name="cliente">
                {(field) => (
                  <TextFieldRoot>
                    <TextFieldLabel for="cliente">Nombre del Cliente</TextFieldLabel>
                    <TextField
                      id="cliente"
                      value={field().state.value}
                      placeholder="Ej. IT Comunicaciones"
                      class="h-10 bg-background/80 text-base"
                      onInput={(event) => field().handleChange(event.currentTarget.value)}
                      onBlur={field().handleBlur}
                    />
                  </TextFieldRoot>
                )}
              </form.Field>

              <form.Field name="fecha">
                {(field) => (
                  <TextFieldRoot>
                    <TextFieldLabel for="fecha">Fecha</TextFieldLabel>
                    <TextField
                      id="fecha"
                      type="date"
                      value={field().state.value}
                      class="h-10 bg-background/80 text-base"
                      onInput={(event) => field().handleChange(event.currentTarget.value)}
                      onBlur={field().handleBlur}
                    />
                  </TextFieldRoot>
                )}
              </form.Field>
            </div>

            <div class="space-y-3">
              <p class="text-sm font-semibold tracking-wide text-foreground">Productos</p>
              <TablaProductos
                productos={productos()}
                onChange={setProductos}
                disabled={isSubmitting()}
                showValidationErrors={showValidationErrors()}
              />
            </div>

            <Show when={errorMessage()}>
              {(message) => (
                <div class="rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {message()}
                </div>
              )}
            </Show>

            <div class="flex flex-wrap items-center gap-2">
              <Button type="submit" size="lg" disabled={isSubmitting()}>
                <Show when={isSubmitting()} fallback={<Save class="h-4 w-4" />}>
                  <LoaderCircle class="h-4 w-4 animate-spin" />
                </Show>
                Guardar Cotización
              </Button>
            </div>
          </form>

          <AlertDialog
            open={isSuccessDialogOpen()}
            onOpenChange={setIsSuccessDialogOpen}
          >
            <AlertDialogContent class="w-[min(94vw,56rem)] max-w-4xl border-border/80 bg-card p-0 shadow-2xl">
              <div class="relative overflow-hidden rounded-lg">
                <div class="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-primary to-primary/60" />

                <div class="grid gap-6 p-6 pt-8 sm:grid-cols-[auto_1fr] sm:items-start">
                  <div class="mx-auto rounded-full bg-primary/15 p-3 text-primary sm:mx-0">
                    <CircleCheckBig class="h-8 w-8" />
                  </div>

                  <div class="space-y-4">
                    <AlertDialogHeader class="space-y-2 text-left">
                      <AlertDialogTitle class="text-2xl tracking-wide">
                        Cotización guardada con éxito
                      </AlertDialogTitle>
                      <AlertDialogDescription class="text-base leading-relaxed">
                        <Show
                          when={numeroVisible()}
                          fallback={
                            'Tu cotización se guardó correctamente.'
                          }
                        >
                          {(numero) => (
                            <>
                              La cotización {formatNumeroCotizacion(numero())} se guardó
                              correctamente.
                            </>
                          )}
                        </Show>
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <Show when={cotizacionId()}>
                      {(id) => (
                        <div class="flex flex-wrap gap-3">
                          <a
                            href={`/api/cotizaciones/${id()}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            class={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
                          >
                            <Eye class="h-4 w-4" />
                            Ver PDF
                          </a>
                          <a
                            href={`/api/cotizaciones/${id()}/pdf?download=1`}
                            class={cn(
                              buttonVariants({ variant: 'outline', size: 'lg' }),
                              'gap-2',
                            )}
                          >
                            <Download class="h-4 w-4" />
                            Descargar PDF
                          </a>
                        </div>
                      )}
                    </Show>

                    <AlertDialogFooter>
                      <AlertDialogClose class={cn(buttonVariants({ variant: 'secondary' }))}>
                        Cerrar
                      </AlertDialogClose>
                    </AlertDialogFooter>
                  </div>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
