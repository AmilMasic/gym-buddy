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

<style>
	.gym-buddy-stepper {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.gym-buddy-stepper-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-normal);
	}

	.gym-buddy-stepper-controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.gym-buddy-stepper-btn {
		min-width: 48px;
		min-height: 48px;
		font-size: 24px;
		font-weight: bold;
		border-radius: 8px;
		border: 2px solid var(--background-modifier-border);
		background: var(--background-primary);
		color: var(--text-normal);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.gym-buddy-stepper-btn:hover:not(:disabled) {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-stepper-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.gym-buddy-stepper-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.gym-buddy-stepper-value {
		min-width: 80px;
		text-align: center;
		font-size: 20px;
		font-weight: 600;
		color: var(--text-normal);
	}

	@media (max-width: 768px) {
		.gym-buddy-stepper-btn {
			min-width: 56px;
			min-height: 56px;
			font-size: 28px;
		}

		.gym-buddy-stepper-value {
			font-size: 24px;
			min-width: 100px;
		}
	}
</style>

