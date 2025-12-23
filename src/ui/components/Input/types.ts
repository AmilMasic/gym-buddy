export type InputSize = 'sm' | 'md' | 'lg';

export type InputProps = {
  /** Bound value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Size preset */
  size?: InputSize;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number';
  /** Label text (optional) */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** HTML id attribute */
  id?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Additional CSS class */
  class?: string;
  /** Input event handler */
  oninput?: (event: Event) => void;
}
