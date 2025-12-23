import type { Snippet, Component } from 'svelte';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Lucide icon component to show before text */
  icon?: Component<{ size?: number }>;
  /** Icon size (defaults based on button size) */
  iconSize?: number;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Click handler */
  onclick?: (event: MouseEvent) => void;
  /** Additional CSS class */
  class?: string;
  /** Button content */
  children: Snippet;
}
