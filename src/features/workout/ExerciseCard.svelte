<script lang="ts">
	import type { ExerciseCardProps } from "./types";
	import type { WorkoutExercise, WorkoutSet, Exercise } from "../../types";
	import { ChevronDown, ChevronRight, Trash2, Check } from "@lucide/svelte";
	import { IconButton, SetInput } from "../../ui/components";

	let {
		exercise,
		exerciseIndex,
		exerciseInfo = null,
		showRPE = true,
		unit = "lbs",
	}: ExerciseCardProps = $props();

	let expanded = $state(true);
	let currentSet = $state<WorkoutSet>({
		setNumber: 1,
	});

	// Get last logged set for defaults
	const lastSet = $derived(exercise.sets[exercise.sets.length - 1] || null);
	const nextSetNumber = $derived(exercise.sets.length + 1);

	// Update current set number when sets change
	$effect(() => {
		currentSet.setNumber = nextSetNumber;
	});

	function toggleExpanded() {
		expanded = !expanded;
	}

	function removeExercise(e: MouseEvent) {
		e.stopPropagation();
		document.dispatchEvent(
			new CustomEvent("remove-exercise", {
				detail: { index: exerciseIndex },
			})
		);
	}

	function handleLogSet(setData: WorkoutSet) {
		// Dispatch to parent with exercise index
		document.dispatchEvent(
			new CustomEvent("exercise-log-set", {
				detail: {
					exerciseIndex,
					set: {
						...setData,
						setNumber: nextSetNumber,
					},
				},
			})
		);

		// Reset current set for next input
		currentSet = {
			setNumber: nextSetNumber + 1,
		};
	}
</script>

<div class="gb-exercise-card" class:gb-exercise-card--collapsed={!expanded}>
	<button
		type="button"
		class="gb-exercise-card-header"
		onclick={toggleExpanded}
	>
		<div class="gb-exercise-card-title">
			{#if expanded}
				<ChevronDown size={16} />
			{:else}
				<ChevronRight size={16} />
			{/if}
			<div class="gb-exercise-card-info">
				<span class="gb-exercise-name">{exercise.name}</span>
				<span class="gb-exercise-sets-count"
					>{exercise.sets.length}
					{exercise.sets.length === 1 ? "set" : "sets"}</span
				>
			</div>
		</div>
		<IconButton
			icon={Trash2}
			variant="danger"
			size="sm"
			ariaLabel="Remove exercise"
			onclick={removeExercise}
		/>
	</button>

	{#if expanded}
		<div class="gb-exercise-card-content">
			<!-- Logged sets -->
			{#if exercise.sets.length > 0}
				<div class="gb-logged-sets">
					{#each exercise.sets as set, i}
						<div
							class="gb-logged-set"
							class:gb-logged-set--latest={i ===
								exercise.sets.length - 1}
						>
							<div class="gb-set-number">Set {set.setNumber}</div>
							<div class="gb-set-details">
								{#if set.weight}<span>{set.weight} {unit}</span
									>{/if}
								{#if set.weight && set.reps}<span> x </span>{/if}
								{#if set.reps}<span>{set.reps} reps</span>{/if}
								{#if set.rpe}<span class="gb-set-rpe">
										@ RPE {set.rpe}</span
									>{/if}
							</div>
							<Check size={16} class="gb-set-check" />
						</div>
					{/each}
				</div>
			{/if}

			<!-- Input for next set -->
			<div class="gb-next-set">
				<div class="gb-next-set-label">Set {exercise.sets.length + 1}</div>
				<SetInput
					bind:set={currentSet}
					{showRPE}
					{unit}
					{lastSet}
					onLogSet={handleLogSet}
				/>
			</div>
		</div>
	{/if}
</div>
