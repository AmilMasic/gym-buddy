<script lang="ts">
	import NumberStepper from '../NumberStepper';
	import type { WorkoutSet } from '../../../types';
	import { Button } from '../index';
	import type { SetInputProps } from './types';

	let {
		set = $bindable(),
		showRPE = true,
		unit = 'lbs',
		distanceUnit = 'mi',
		lastSet = null,
		onLogSet,
		trackWeight = true,
		trackReps = true,
		trackTime = false,
		trackDistance = false
	}: SetInputProps = $props();

	// Extract initial values using IIFE to avoid reactivity warnings
	const { initialWeight, initialReps, initialRpe, initialTimeMinutes, initialTimeSeconds, initialDistance } = (() => {
		const lastTime = lastSet?.time ?? 0;
		const setTime = set.time ?? lastTime;
		return {
			initialWeight: set.weight ?? lastSet?.weight ?? 0,
			initialReps: set.reps ?? lastSet?.reps ?? 0,
			initialRpe: set.rpe ?? lastSet?.rpe ?? 0,
			initialTimeMinutes: Math.floor(setTime / 60),
			initialTimeSeconds: setTime % 60,
			initialDistance: set.distance ?? lastSet?.distance ?? 0,
		};
	})();

	let weight = $state(initialWeight);
	let reps = $state(initialReps);
	let rpe: number = $state(initialRpe);
	let timeMinutes = $state(initialTimeMinutes);
	let timeSeconds = $state(initialTimeSeconds);
	let distance = $state(initialDistance);

	// Compute total time in seconds
	const totalTime = $derived(timeMinutes * 60 + timeSeconds);

	$effect(() => {
		set.weight = weight >= 0 ? weight : undefined;
		set.reps = reps > 0 ? reps : undefined;
		set.rpe = rpe > 0 ? rpe : undefined;
		set.time = totalTime > 0 ? totalTime : undefined;
		set.distance = distance > 0 ? distance : undefined;
	});

	// Determine if the log button should be enabled
	// For weight/bodyweight: require reps > 0
	// For cardio: require time OR distance > 0
	const canLog = $derived.by(() => {
		if (trackWeight || trackReps) {
			return reps > 0;
		}
		if (trackTime || trackDistance) {
			return totalTime > 0 || distance > 0;
		}
		return false;
	});

	function logSet() {
		const setData: WorkoutSet = {
			...set,
			weight: trackWeight ? weight : undefined,
			reps: trackReps ? reps : undefined,
			rpe,
			time: trackTime ? totalTime : undefined,
			distance: trackDistance ? distance : undefined
		};

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
	{#if trackWeight || trackReps}
		<div class="gb-set-input-row">
			{#if trackWeight}
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
			{/if}
			{#if trackReps}
				<NumberStepper
					bind:value={reps}
					min={0}
					max={100}
					step={1}
					label="Reps"
					quickIncrements={[5, 10]}
				/>
			{/if}
		</div>
	{/if}

	{#if trackTime}
		<div class="gb-set-input-row gb-set-input-row--time">
			<NumberStepper
				bind:value={timeMinutes}
				min={0}
				max={999}
				step={1}
				label="Minutes"
				quickIncrements={[5, 10, 15]}
			/>
			<NumberStepper
				bind:value={timeSeconds}
				min={0}
				max={59}
				step={15}
				label="Seconds"
				quickIncrements={[15, 30]}
			/>
		</div>
	{/if}

	{#if trackDistance}
		<div class="gb-set-input-row">
			<NumberStepper
				bind:value={distance}
				min={0}
				max={999}
				step={0.1}
				label="Distance"
				unit={distanceUnit}
				quickIncrements={[0.5, 1, 5]}
				allowDirectInput={true}
			/>
		</div>
	{/if}

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
		disabled={!canLog}
		icon="check"
	>
		LOG SET
	</Button>
</div>

