import { createForm } from '@tanstack/solid-form';
import { LoaderCircle, Save } from 'lucide-solid';
import { Show, createMemo, createSignal } from 'solid-js';

import { TablaProductos } from '@/components/TablaProductos';
import { Button } from '@/components/ui/button';
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
  calcularTotal,
  formatMonedaCop,
  formatNumeroCotizacion,
} from '@/lib/cotizaciones/calculations';
import {
  cotizacionInputSchema,
  type CotizacionRecord,
  type ProductoInput,
} from '@/lib/cotizaciones/types';

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

function openPdfInNewTab(pdfUrl: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.click();
}

export function FormularioCotizacion(props: FormularioCotizacionProps) {
  const initialProductos =
    props.initialCotizacion?.productos.length && props.initialCotizacion.productos.length > 0
      ? props.initialCotizacion.productos
      : [createBlankProducto()];

  const [productos, setProductos] = createSignal<ProductoInput[]>(initialProductos);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
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

      const endpoint = props.initialCotizacion
        ? `/api/cotizaciones/${props.initialCotizacion.id}`
        : '/api/cotizaciones';
      const method = props.initialCotizacion ? 'PUT' : 'POST';

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

        const pdfUrl = `/api/cotizaciones/${result.data.id}/pdf`;
        openPdfInNewTab(pdfUrl);

        if (props.mode === 'create') {
          window.location.assign(`/cotizaciones/${result.data.id}`);
        }
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

  const total = createMemo(() => formatMonedaCop(calcularTotal(productos())));
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
        <CardHeader class="border-b border-border/70 bg-gradient-to-r from-[hsl(var(--accent)/0.55)] to-transparent">
          <CardTitle class="text-2xl tracking-wide text-foreground">
            {props.mode === 'create' ? 'Nueva Cotizacion' : 'Editar Cotizacion'}
          </CardTitle>
          <CardDescription class="leading-relaxed">
            {numeroVisible()
              ? `Numero asignado: ${formatNumeroCotizacion(numeroVisible() ?? 0)}`
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
              await form.handleSubmit();
            }}
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <form.Field name="cliente">
                {(field) => (
                  <TextFieldRoot>
                    <TextFieldLabel for="cliente">Nombre del Cliente</TextFieldLabel>
                    <TextField
                      id="cliente"
                      value={field().state.value}
                      placeholder="Ej. Sofia Hernandez"
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
              />
            </div>

            <div class="rounded-md border border-border bg-muted/40 px-4 py-3 shadow-sm">
              <p class="text-sm text-muted-foreground">Total General</p>
              <p class="text-2xl font-semibold text-foreground">{total()}</p>
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
                Guardar Cotizacion
              </Button>

              <Show when={cotizacionId()}>
                {(id) => (
                  <>
                    <a
                      href={`/api/cotizaciones/${id()}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      class="text-sm text-foreground underline underline-offset-4"
                    >
                      Ver PDF
                    </a>
                    <a
                      href={`/api/cotizaciones/${id()}/pdf?download=1`}
                      class="text-sm text-foreground underline underline-offset-4"
                    >
                      Descargar PDF
                    </a>
                  </>
                )}
              </Show>

              <a href="/" class="text-sm text-muted-foreground underline underline-offset-4">
                Volver al inicio
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
