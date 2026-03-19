import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

export function Card(props: ComponentProps<'section'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <section
      class={cn('rounded-xl border border-neutral-200 bg-white shadow-sm', local.class)}
      {...rest}
    />
  );
}

export function CardHeader(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <div class={cn('space-y-1.5 p-6', local.class)} {...rest} />;
}

export function CardTitle(props: ComponentProps<'h2'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <h2 class={cn('text-xl font-semibold tracking-tight text-neutral-900', local.class)} {...rest} />
  );
}

export function CardDescription(props: ComponentProps<'p'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <p class={cn('text-sm text-neutral-500', local.class)} {...rest} />;
}

export function CardContent(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <div class={cn('p-6 pt-0', local.class)} {...rest} />;
}

export function CardFooter(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <div class={cn('flex items-center p-6 pt-0', local.class)} {...rest} />;
}
