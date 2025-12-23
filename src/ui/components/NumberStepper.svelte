<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';
	import { IconButton } from './index';

	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
	}

	let {
		value = $bindable(),
		min = 0,
		max = 1000,
		step = 1,
		label = '',
		unit = ''
	}: Props = $props();

	function decrement() {
		if (value > min) {
			value = Math.max(min, value - step);
		}
	}

	function increment() {
		if (value < max) {
			value = Math.min(max, value + step);
		}
	}
</script>

<div class="gb-stepper">
	{#if label}
		<div class="gb-stepper-label">{label}</div>
	{/if}
	<div class="gb-stepper-controls" role="group" aria-label={label || undefined}>
		<IconButton
			icon={Minus}
			variant="ghost"
			size="md"
			onclick={decrement}
			disabled={value <= min}
			ariaLabel="Decrease {label}"
		/>
		<div class="gb-stepper-value">
			{value}{#if unit} {unit}{/if}
		</div>
		<IconButton
			icon={Plus}
			variant="ghost"
			size="md"
			onclick={increment}
			disabled={value >= max}
			ariaLabel="Increase {label}"
		/>
	</div>
</div>

