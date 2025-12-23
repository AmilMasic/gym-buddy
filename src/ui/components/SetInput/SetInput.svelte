<script lang="ts">
	import NumberStepper from '../NumberStepper';
	import type { WorkoutSet } from '../../../types';
	import { Check } from '@lucide/svelte';
	import { Button } from '../index';
	import type { SetInputProps } from './types';

	let { set = $bindable(), showRPE = true, unit = 'lbs', lastSet = null, onLogSet }: SetInputProps = $props();

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
		set.weight = weight >= 0 ? weight : undefined;
		set.reps = reps > 0 ? reps : undefined;
		set.rpe = rpe > 0 ? rpe : undefined;
		set.time = time && time > 0 ? time : undefined;
	});

	function logSet() {
		const setData: WorkoutSet = {...set, weight, reps, rpe, time};

		// Use callback if provided, otherwise dispatch to document
		if (onLogSet) {
			onLogSet(setData);
		} else {
			const event = new CustomEvent('log-set', {
				detail: {set: setData},
			});
			document.dispatchEvent(event);
		}
	}
</script>

<div class="gb-set-input">
	<div class="gb-set-input-row">
		<NumberStepper
			bind:value={weight}
			min={0}
			max={1000}
			step={5}
			label="Weight"
			unit={unit}
			quickIncrements={[10, 25, 45]}
			quickDecrements={[10, 25, 45]}
			allowDirectInput={true}
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
		<div class="gb-set-input-row">
			<NumberStepper
				bind:value={rpe}
				min={0}
				max={10}
				step={0.5}
				label="RPE"
			/>
		</div>
	{/if}

	<Button
		variant="primary"
		size="lg"
		fullWidth
		onclick={logSet}
		disabled={reps <= 0}
		icon={Check}
	>
		LOG SET
	</Button>
</div>

