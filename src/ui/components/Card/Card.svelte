<script lang="ts">
  import type { CardProps } from './types';

  let {
    variant = 'default',
    clickable = false,
    selected = false,
    class: className = '',
    onclick,
    children
  }: CardProps = $props();
</script>

{#if clickable}
  <button
    class="gb-card gb-card--{variant} {className}"
    class:gb-card--clickable={clickable}
    class:gb-card--selected={selected}
    {onclick}
  >
    {@render children()}
  </button>
{:else}
  <div
    class="gb-card gb-card--{variant} {className}"
    class:gb-card--selected={selected}
  >
    {@render children()}
  </div>
{/if}

<style>
  .gb-card {
    padding: var(--gb-space-lg);
    background: var(--background-secondary);
    border: 2px solid var(--background-modifier-border);
    border-radius: var(--gb-radius-xl);
    transition: all var(--gb-transition);
    text-align: left;
  }

  .gb-card--clickable {
    cursor: pointer;
    width: 100%;
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
  }

  .gb-card--clickable:hover {
    background: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .gb-card--clickable:active {
    transform: scale(0.98);
  }

  .gb-card--clickable:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .gb-card--selected {
    border-color: var(--interactive-accent);
  }

  .gb-card--interactive {
    border-width: 2px;
  }
</style>
