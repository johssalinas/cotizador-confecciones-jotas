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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div class="mx-auto w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {props.mode === 'create' ? 'Nueva Cotizacion' : 'Editar Cotizacion'}
          </CardTitle>
          <CardDescription>
            {numeroVisible()
              ? `Numero asignado: ${formatNumeroCotizacion(numeroVisible() ?? 0)}`
              : 'El numero se asigna automaticamente al guardar.'}
            {' '}
            El PDF se genera unicamente al guardar la cotizacion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            class="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              await form.handleSubmit();
            }}
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <form.Field name="cliente">
                {(field) => (
                  <div class="space-y-2">
                    <Label for="cliente">Nombre del Cliente</Label>
                    <Input
                      id="cliente"
                      value={field().state.value}
                      placeholder="Ej. Sofia Hernandez"
                      onInput={(event) => field().handleChange(event.currentTarget.value)}
                      onBlur={field().handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="fecha">
                {(field) => (
                  <div class="space-y-2">
                    <Label for="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={field().state.value}
                      onInput={(event) => field().handleChange(event.currentTarget.value)}
                      onBlur={field().handleBlur}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div class="space-y-2">
              <Label>Productos</Label>
              <TablaProductos
                productos={productos()}
                onChange={setProductos}
                disabled={isSubmitting()}
              />
            </div>

            <div class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p class="text-sm text-neutral-600">Total General</p>
              <p class="text-2xl font-semibold text-neutral-900">{total()}</p>
            </div>

            <Show when={errorMessage()}>
              {(message) => (
                <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                      class="text-sm text-neutral-700 underline underline-offset-4"
                    >
                      Ver PDF
                    </a>
                    <a
                      href={`/api/cotizaciones/${id()}/pdf?download=1`}
                      class="text-sm text-neutral-700 underline underline-offset-4"
                    >
                      Descargar PDF
                    </a>
                  </>
                )}
              </Show>

              <a href="/" class="text-sm text-neutral-600 underline underline-offset-4">
                Volver al inicio
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
