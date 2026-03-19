import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export function Table(props: ComponentProps<'table'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <table class={cn('w-full caption-bottom text-sm', local.class)} {...rest} />;
}

export function TableHeader(props: ComponentProps<'thead'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <thead class={cn('[&_tr]:border-b', local.class)} {...rest} />;
}

export function TableBody(props: ComponentProps<'tbody'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <tbody class={cn('[&_tr:last-child]:border-0', local.class)} {...rest} />;
}

export function TableRow(props: ComponentProps<'tr'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <tr
      class={cn('border-b border-neutral-200 transition-colors hover:bg-neutral-50', local.class)}
      {...rest}
    />
  );
}

export function TableHead(props: ComponentProps<'th'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <th
      class={cn(
        'h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-neutral-600',
        local.class,
      )}
      {...rest}
    />
  );
}

export function TableCell(props: ComponentProps<'td'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <td class={cn('p-3 align-middle', local.class)} {...rest} />;
}
