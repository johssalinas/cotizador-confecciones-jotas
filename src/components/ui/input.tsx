import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

type InputProps = ComponentProps<'input'>;

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <input
      class={cn(
        'flex h-11 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50',
        local.class,
      )}
      {...rest}
    />
  );
}
