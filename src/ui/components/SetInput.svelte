<script lang="ts">
	import NumberStepper from './NumberStepper.svelte';
	import type {WorkoutSet} from '../../types';
	import { Check } from '@lucide/svelte';
	import { Button } from './index';

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

<div class="gb-set-input">
	<div class="gb-set-input-row">
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
		disabled={weight <= 0 || reps <= 0}
		icon={Check}
	>
		LOG SET
	</Button>
</div>

