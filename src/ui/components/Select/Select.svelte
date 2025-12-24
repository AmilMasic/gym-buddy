<script lang="ts">
  import type { SelectProps } from './types';
  import Icon from '../Icon/Icon.svelte';

  let {
    value = $bindable(''),
    options,
    placeholder = 'Select...',
    size = 'md',
    label,
    disabled = false,
    id,
    fullWidth = true,
    class: className = '',
    onchange
  }: SelectProps = $props();
</script>

<div class="gb-select-wrapper {className}" class:gb-select-wrapper--full-width={fullWidth}>
  {#if label}
    <label class="gb-select-label" for={id}>{label}</label>
  {/if}
  <div class="gb-select-container">
    <select
      class="gb-select gb-select--{size}"
      {id}
      {disabled}
      bind:value
      {onchange}
    >
      {#if placeholder}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <span class="gb-select-arrow">
      <Icon name="chevron-down" size={14} />
    </span>
  </div>
</div>

<style>
  .gb-select-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--gb-space-xs);
  }

  .gb-select-wrapper--full-width {
    width: 100%;
  }

  .gb-select-label {
    font-size: var(--gb-font-sm);
    font-weight: 500;
    color: var(--text-muted);
  }

  .gb-select-container {
    position: relative;
  }

  .gb-select {
    width: 100%;
    border: 2px solid var(--background-modifier-border);
    border-radius: var(--gb-radius-lg);
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    transition: border-color var(--gb-transition);
    padding-right: var(--gb-space-xl);
    font-family: inherit;
  }

  .gb-select:hover:not(:disabled) {
    border-color: var(--interactive-accent-hover);
  }

  .gb-select:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .gb-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gb-select-arrow {
    position: absolute;
    right: var(--gb-space-md);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  /* Sizes */
  .gb-select--sm {
    min-height: var(--gb-input-height-sm);
    padding: var(--gb-space-sm) var(--gb-space-md);
    font-size: var(--gb-font-sm);
  }

  .gb-select--md {
    min-height: var(--gb-input-height-md);
    padding: var(--gb-space-md) var(--gb-space-lg);
    font-size: var(--gb-font-md);
  }

  .gb-select--lg {
    min-height: var(--gb-input-height-lg);
    padding: var(--gb-space-lg);
    font-size: var(--gb-font-lg);
  }
</style>
