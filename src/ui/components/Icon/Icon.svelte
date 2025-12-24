<script lang="ts">
  import { setIcon } from 'obsidian';

  interface IconProps {
    name: string;
    size?: number;
    class?: string;
  }

  let {
    name,
    size = 16,
    class: className = ''
  }: IconProps = $props();

  // Svelte action - guaranteed to run when element is in DOM
  function icon(node: HTMLElement, iconName: string) {
    node.empty();
    setIcon(node, iconName);

    return {
      update(newName: string) {
        node.empty();
        setIcon(node, newName);
      }
    };
  }
</script>

<span
  use:icon={name}
  class="gb-icon {className}"
  style="--icon-size: {size}px;"
></span>

<style>
  .gb-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size);
    height: var(--icon-size);
    flex-shrink: 0;
  }

  .gb-icon :global(svg) {
    width: var(--icon-size) !important;
    height: var(--icon-size) !important;
    stroke: currentColor;
  }
</style>
