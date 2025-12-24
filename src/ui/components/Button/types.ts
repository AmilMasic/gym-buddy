import type { Snippet } from 'svelte';

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
  /** Obsidian icon name to show before text */
  icon?: string;
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
