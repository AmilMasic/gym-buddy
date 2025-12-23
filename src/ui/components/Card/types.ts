import type { Snippet } from 'svelte';

export type CardVariant = 'default' | 'interactive';

export interface CardProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Make card clickable */
  clickable?: boolean;
  /** Selected state */
  selected?: boolean;
  /** Additional CSS class */
  class?: string;
  /** Click handler */
  onclick?: (event: MouseEvent) => void;
  /** Card content */
  children: Snippet;
}
