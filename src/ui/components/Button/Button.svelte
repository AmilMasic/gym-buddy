<script lang="ts">
  import type { ButtonProps } from './types';

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    icon: Icon,
    iconSize,
    type = 'button',
    onclick,
    class: className = '',
    children
  }: ButtonProps = $props();

  const sizeToIconSize: Record<string, number> = { sm: 14, md: 16, lg: 20 };
  const resolvedIconSize = $derived(iconSize ?? sizeToIconSize[size]);
</script>

<button
  class="gb-btn gb-btn--{variant} gb-btn--{size} {className}"
  class:gb-btn--full-width={fullWidth}
  {type}
  {disabled}
  {onclick}
>
  {#if Icon}
    <Icon size={resolvedIconSize} />
  {/if}
  {@render children()}
</button>

<style>
  /* Button Base */
  .gb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gb-space-sm);
    font-weight: 600;
    border-radius: var(--gb-radius-lg);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--gb-transition);
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
  }

  .gb-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .gb-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Sizes */
  .gb-btn--sm {
    min-height: var(--gb-btn-height-sm);
    padding: var(--gb-btn-padding-sm);
    font-size: var(--gb-btn-font-sm);
  }

  .gb-btn--md {
    min-height: var(--gb-btn-height-md);
    padding: var(--gb-btn-padding-md);
    font-size: var(--gb-btn-font-md);
  }

  .gb-btn--lg {
    min-height: var(--gb-btn-height-lg);
    padding: var(--gb-btn-padding-lg);
    font-size: var(--gb-btn-font-lg);
  }

  /* Primary Variant */
  .gb-btn--primary {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .gb-btn--primary:hover:not(:disabled) {
    background: var(--interactive-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .gb-btn--primary:active:not(:disabled) {
    transform: translateY(0);
  }

  /* Ghost Variant */
  .gb-btn--ghost {
    background: transparent;
    color: var(--text-normal);
    border-color: var(--background-modifier-border);
  }

  .gb-btn--ghost:hover:not(:disabled) {
    background: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  /* Danger Variant */
  .gb-btn--danger {
    background: var(--text-error);
    color: var(--text-on-accent);
    border-color: var(--text-error);
  }

  .gb-btn--danger:hover:not(:disabled) {
    opacity: 0.9;
    filter: brightness(1.1);
  }

  /* Full Width */
  .gb-btn--full-width {
    width: 100%;
  }
</style>
