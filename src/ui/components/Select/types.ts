export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  /** Bound value */
  value?: string;
  /** Options list */
  options: SelectOption[];
  /** Placeholder option text */
  placeholder?: string;
  /** Size preset */
  size?: SelectSize;
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
  /** Change handler */
  onchange?: (event: Event) => void;
}
