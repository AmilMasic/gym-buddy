<script lang="ts">
	export let value: number;
	export let min: number = 0;
	export let max: number = 1000;
	export let step: number = 1;
	export let label: string = '';
	export let unit: string = '';

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

<div class="gym-buddy-stepper">
	{#if label}
		<div class="gym-buddy-stepper-label">{label}</div>
	{/if}
	<div class="gym-buddy-stepper-controls" role="group" aria-label={label || undefined}>
		<button
			class="gym-buddy-stepper-btn gym-buddy-stepper-btn-minus"
			onclick={decrement}
			disabled={value <= min}
			aria-label="Decrease {label}"
		>
			−
		</button>
		<div class="gym-buddy-stepper-value">
			{value}{#if unit} {unit}{/if}
		</div>
		<button
			class="gym-buddy-stepper-btn gym-buddy-stepper-btn-plus"
			onclick={increment}
			disabled={value >= max}
			aria-label="Increase {label}"
		>
			+
		</button>
	</div>
</div>

