import * as DialogPrimitive from '@kobalte/core/dialog';
import { X } from 'lucide-solid';
import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.CloseButton;

export function DialogContent(props: ComponentProps<typeof DialogPrimitive.Content>) {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/45" />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPrimitive.Content
          class={cn(
            'w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none',
            local.class,
          )}
          {...rest}
        >
          {local.children}
          <DialogPrimitive.CloseButton class="absolute right-4 top-4 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800">
            <X class="h-4 w-4" />
            <span class="sr-only">Cerrar</span>
          </DialogPrimitive.CloseButton>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <div class={cn('mb-4 space-y-1.5', local.class)} {...rest} />;
}

export function DialogTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  const [local, rest] = splitProps(props, ['class']);
  return <DialogPrimitive.Title class={cn('text-lg font-semibold', local.class)} {...rest} />;
}

export function DialogDescription(
  props: ComponentProps<typeof DialogPrimitive.Description>,
) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <DialogPrimitive.Description class={cn('text-sm text-neutral-600', local.class)} {...rest} />
  );
}

export function DialogFooter(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <div
      class={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', local.class)}
      {...rest}
    />
  );
}

export function DialogAction(props: ComponentProps<'button'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <DialogPrimitive.CloseButton
      class={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 disabled:pointer-events-none disabled:opacity-50',
        local.class,
      )}
      {...rest}
    />
  );
}

export function DialogCancel(props: ComponentProps<'button'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <DialogPrimitive.CloseButton
      class={cn(
        'inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100',
        local.class,
      )}
      {...rest}
    />
  );
}

export function DialogOverlay(props: ComponentProps<typeof DialogPrimitive.Overlay>) {
  const [local, rest] = splitProps(props, ['class']);
  return <DialogPrimitive.Overlay class={cn('fixed inset-0 bg-black/45', local.class)} {...rest} />;
}

export function DialogPortal(props: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />;
}
