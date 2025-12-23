import type { Component } from 'svelte';

export type IconButtonVariant = 'ghost' | 'danger' | 'favorite';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonProps = {
  /** Lucide icon component */
  icon: Component<{ size?: number; fill?: string }>;
  /** Visual variant */
  variant?: IconButtonVariant;
  /** Size preset */
  size?: IconButtonSize;
  /** Active state (for toggleable buttons like favorite) */
  active?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel: string;
  /** Additional CSS class */
  class?: string;
  /** Click handler */
  onclick?: (event: MouseEvent) => void;
}
