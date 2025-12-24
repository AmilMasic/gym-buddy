<script lang="ts">
  import type { InputProps } from './types';

  let {
    value = $bindable(''),
    placeholder = '',
    size = 'md',
    type = 'text',
    label,
    disabled = false,
    id,
    fullWidth = true,
    class: className = '',
    oninput,
    onsubmit
  }: InputProps = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && onsubmit) {
      event.preventDefault();
      onsubmit();
    }
  }
</script>

<div class="gb-input-wrapper {className}" class:gb-input-wrapper--full-width={fullWidth}>
  {#if label}
    <label class="gb-input-label" for={id}>{label}</label>
  {/if}
  <input
    class="gb-input gb-input--{size}"
    {type}
    {id}
    {placeholder}
    {disabled}
    bind:value
    {oninput}
    onkeydown={handleKeydown}
  />
</div>

<style>
  .gb-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--gb-space-xs);
  }

  .gb-input-wrapper--full-width {
    width: 100%;
  }

  .gb-input-label {
    font-size: var(--gb-font-sm);
    font-weight: 500;
    color: var(--text-muted);
  }

  .gb-input {
    width: 100%;
    border: 2px solid var(--background-modifier-border);
    border-radius: var(--gb-radius-lg);
    background: var(--background-primary);
    color: var(--text-normal);
    transition: border-color var(--gb-transition);
    font-family: inherit;
  }

  .gb-input::placeholder {
    color: var(--text-muted);
  }

  .gb-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .gb-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Sizes */
  .gb-input--sm {
    min-height: var(--gb-input-height-sm);
    padding: var(--gb-space-sm) var(--gb-space-md);
    font-size: var(--gb-font-sm);
  }

  .gb-input--md {
    min-height: var(--gb-input-height-md);
    padding: var(--gb-space-md) var(--gb-space-lg);
    font-size: var(--gb-font-md);
  }

  .gb-input--lg {
    min-height: var(--gb-input-height-lg);
    padding: var(--gb-space-lg);
    font-size: var(--gb-font-lg);
  }
</style>
