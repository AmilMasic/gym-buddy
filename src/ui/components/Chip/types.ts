import type { Snippet } from 'svelte';

export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  /** Active/selected state */
  active?: boolean;
  /** Size preset */
  size?: ChipSize;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onclick?: (event: MouseEvent) => void;
  /** Additional CSS class */
  class?: string;
  /** Content */
  children: Snippet;
}
