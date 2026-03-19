import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/utils';

type LabelProps = ComponentProps<'label'>;

export function Label(props: LabelProps) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <label class={cn('text-sm font-semibold text-neutral-700', local.class)} {...rest} />
  );
}
