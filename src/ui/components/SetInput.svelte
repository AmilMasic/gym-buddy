<script lang="ts">
	import NumberStepper from './NumberStepper.svelte';
	import {WorkoutSet} from '../../types';

	interface Props {
		set: WorkoutSet;
		showRPE?: boolean;
		unit?: string;
		lastSet?: WorkoutSet | null;
	}

	let { set = $bindable(), showRPE = true, unit = 'lbs', lastSet = null }: Props = $props();

	// Extract initial values using IIFE to avoid reactivity warnings
	const { initialWeight, initialReps, initialRpe, initialTime } = (() => {
		return {
			initialWeight: set.weight ?? lastSet?.weight ?? 0,
			initialReps: set.reps ?? lastSet?.reps ?? 0,
			initialRpe: set.rpe ?? lastSet?.rpe ?? 0,
			initialTime: set.time ?? lastSet?.time ?? undefined,
		};
	})();

	let weight = $state(initialWeight);
	let reps = $state(initialReps);
	let rpe: number = $state(initialRpe);
	let time = $state(initialTime);

	$effect(() => {
		set.weight = weight > 0 ? weight : undefined;
		set.reps = reps > 0 ? reps : undefined;
		set.rpe = rpe > 0 ? rpe : undefined;
		set.time = time && time > 0 ? time : undefined;
	});

	function logSet() {
		// Emit event to parent
		const event = new CustomEvent('log-set', {
			detail: {set: {...set, weight, reps, rpe, time}},
		});
		document.dispatchEvent(event);
	}
</script>

<div class="gym-buddy-set-input">
	<div class="gym-buddy-set-input-row">
		<NumberStepper
			bind:value={weight}
			min={0}
			max={1000}
			step={5}
			label="Weight"
			unit={unit}
		/>
		<NumberStepper
			bind:value={reps}
			min={0}
			max={100}
			step={1}
			label="Reps"
		/>
	</div>

	{#if showRPE}
		<div class="gym-buddy-set-input-row">
			<NumberStepper
				bind:value={rpe}
				min={0}
				max={10}
				step={0.5}
				label="RPE"
			/>
		</div>
	{/if}

	<button
		class="gym-buddy-log-btn"
		onclick={logSet}
		disabled={weight <= 0 || reps <= 0}
	>
		✓ LOG SET
	</button>
</div>

<style>
	.gym-buddy-set-input {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px;
		background: var(--background-secondary);
		border-radius: 12px;
	}

	.gym-buddy-set-input-row {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}

	.gym-buddy-log-btn {
		width: 100%;
		height: 56px;
		font-size: 18px;
		font-weight: bold;
		border-radius: 8px;
		border: none;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.gym-buddy-log-btn:hover:not(:disabled) {
		background: var(--interactive-accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.gym-buddy-log-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.gym-buddy-log-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.gym-buddy-log-btn {
			height: 64px;
			font-size: 20px;
		}
	}
</style>

