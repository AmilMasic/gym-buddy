<script lang="ts">
	import { IconButton } from '../index';
	import type { NumberStepperProps } from './types';

	let {
		value = $bindable(),
		min = 0,
		max = 1000,
		step = 1,
		label = '',
		unit = '',
		quickIncrements = [],
		quickDecrements = [],
		allowDirectInput = false
	}: NumberStepperProps = $props();

	let isEditing = $state(false);
	let inputValue = $state('');
	let inputEl: HTMLInputElement | null = $state(null);

	// Focus input when editing starts
	$effect(() => {
		if (isEditing && inputEl) {
			inputEl.focus();
		}
	});

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

	function quickIncrement(amount: number) {
		value = Math.min(max, Math.max(min, value + amount));
	}

	function startEditing() {
		if (!allowDirectInput) return;
		isEditing = true;
		inputValue = value.toString();
	}

	function finishEditing() {
		const parsed = parseFloat(inputValue);
		if (!isNaN(parsed)) {
			value = Math.min(max, Math.max(min, parsed));
		}
		isEditing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			finishEditing();
		} else if (e.key === 'Escape') {
			isEditing = false;
		}
	}
</script>

<div class="gb-stepper">
	{#if label}
		<div class="gb-stepper-label">{label}</div>
	{/if}
	<div class="gb-stepper-controls" role="group" aria-label={label || undefined}>
		<IconButton
			icon="minus"
			variant="ghost"
			size="md"
			onclick={decrement}
			disabled={value <= min}
			ariaLabel="Decrease {label}"
		/>

		{#if isEditing}
			<input
				type="number"
				class="gb-stepper-input"
				bind:value={inputValue}
				bind:this={inputEl}
				onblur={finishEditing}
				onkeydown={handleKeydown}
				{min}
				{max}
			/>
		{:else}
			<button
				class="gb-stepper-value"
				class:gb-stepper-value--clickable={allowDirectInput}
				onclick={startEditing}
				type="button"
				disabled={!allowDirectInput}
			>
				{value}{#if unit} {unit}{/if}
			</button>
		{/if}

		<IconButton
			icon="plus"
			variant="ghost"
			size="md"
			onclick={increment}
			disabled={value >= max}
			ariaLabel="Increase {label}"
		/>
	</div>

	{#if quickIncrements.length > 0}
		<div class="gb-stepper-quick-increments">
			{#each quickIncrements as inc}
				<button
					class="gb-quick-increment"
					onclick={() => quickIncrement(inc)}
					type="button"
					disabled={value + inc > max}
				>
					+{inc}
				</button>
			{/each}
		</div>
	{/if}

	{#if quickDecrements.length > 0}
		<div class="gb-stepper-quick-decrements">
			{#each quickDecrements as dec}
				<button
					class="gb-quick-increment gb-quick-increment--negative"
					onclick={() => quickIncrement(-dec)}
					type="button"
					disabled={value - dec < min}
				>
					-{dec}
				</button>
			{/each}
		</div>
	{/if}
</div>

