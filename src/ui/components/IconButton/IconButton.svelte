<script lang="ts">
  import type { IconButtonProps } from './types';
  import Icon from '../Icon/Icon.svelte';

  let {
    icon,
    variant = 'ghost',
    size = 'md',
    active = false,
    disabled = false,
    ariaLabel,
    class: className = '',
    onclick
  }: IconButtonProps = $props();

  const sizeToIconSize: Record<string, number> = { sm: 14, md: 16, lg: 20 };
</script>

<button
  class="gb-icon-btn gb-icon-btn--{variant} gb-icon-btn--{size} {className}"
  class:gb-icon-btn--active={active}
  aria-label={ariaLabel}
  {disabled}
  {onclick}
>
  <Icon name={icon} size={sizeToIconSize[size]} />
</button>

<style>
  .gb-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all var(--gb-transition);
    -webkit-tap-highlight-color: transparent;
    border-radius: var(--gb-radius-md);
    padding: 0;
  }

  .gb-icon-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .gb-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Sizes */
  .gb-icon-btn--sm {
    width: var(--gb-icon-btn-sm);
    height: var(--gb-icon-btn-sm);
  }

  .gb-icon-btn--md {
    width: var(--gb-icon-btn-md);
    height: var(--gb-icon-btn-md);
  }

  .gb-icon-btn--lg {
    width: var(--gb-icon-btn-lg);
    height: var(--gb-icon-btn-lg);
  }

  /* Ghost Variant */
  .gb-icon-btn--ghost {
    color: var(--text-muted);
  }

  .gb-icon-btn--ghost:hover:not(:disabled) {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }

  /* Danger Variant */
  .gb-icon-btn--danger {
    color: var(--text-muted);
  }

  .gb-icon-btn--danger:hover:not(:disabled) {
    color: var(--text-on-accent);
    background: var(--text-error);
  }

  /* Favorite Variant */
  .gb-icon-btn--favorite {
    color: var(--text-muted);
  }

  .gb-icon-btn--favorite:hover:not(:disabled) {
    color: var(--text-error);
  }

  .gb-icon-btn--favorite.gb-icon-btn--active {
    color: var(--text-error);
  }

  .gb-icon-btn--favorite.gb-icon-btn--active :global(svg) {
    fill: currentColor;
  }
</style>
