<script lang="ts">
  import type { ChipProps } from './types';

  let {
    active = false,
    size = 'md',
    disabled = false,
    onclick,
    class: className = '',
    children
  }: ChipProps = $props();
</script>

<button
  class="gb-chip gb-chip--{size} {className}"
  class:gb-chip--active={active}
  {disabled}
  {onclick}
>
  {@render children()}
</button>

<style>
  .gb-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--gb-radius-full);
    border: 2px solid var(--background-modifier-border);
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
    transition: all var(--gb-transition);
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
    font-weight: 500;
  }

  .gb-chip:hover:not(:disabled):not(.gb-chip--active) {
    background: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .gb-chip--active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .gb-chip--active:hover:not(:disabled) {
    opacity: 0.9;
  }

  .gb-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Sizes */
  .gb-chip--sm {
    min-height: var(--gb-chip-height-sm);
    padding: var(--gb-chip-padding-sm);
    font-size: var(--gb-font-xs);
  }

  .gb-chip--md {
    min-height: var(--gb-chip-height-md);
    padding: var(--gb-chip-padding-md);
    font-size: var(--gb-font-sm);
  }

  .gb-chip--lg {
    min-height: var(--gb-chip-height-lg);
    padding: var(--gb-chip-padding-lg);
    font-size: var(--gb-font-md);
  }
</style>
