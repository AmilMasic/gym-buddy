<script lang="ts">
	import type { ActiveWorkout, Exercise } from "../../types";
	import { Plus, X, Flag } from "@lucide/svelte";
	import { Button } from "../../ui/components";
	import WorkoutTimer from "./WorkoutTimer.svelte";
	import ExerciseCard from "./ExerciseCard.svelte";

	interface Props {
		activeWorkout: ActiveWorkout;
		exercises: Exercise[];
		showRPE?: boolean;
		unit?: string;
		splitName?: string;
	}

	let {
		activeWorkout,
		exercises,
		showRPE = true,
		unit = "lbs",
		splitName = "",
	}: Props = $props();

	function addExercise() {
		document.dispatchEvent(new CustomEvent("open-exercise-picker"));
	}

	function finishWorkout() {
		document.dispatchEvent(new CustomEvent("finish-workout"));
	}

	function cancelWorkout() {
		document.dispatchEvent(new CustomEvent("cancel-workout"));
	}

	function getExerciseInfo(exerciseId?: string): Exercise | null {
		if (!exerciseId) return null;
		return exercises.find((e) => e.id === exerciseId) || null;
	}

	// Check if any sets have been logged
	const hasSets = $derived(
		activeWorkout.exercises.some((ex) => ex.sets.length > 0)
	);
</script>

<div class="gb-workout-view">
	<!-- Header -->
	<div class="gb-workout-header">
		<div class="gb-workout-header-info">
			<h2>Active Workout</h2>
			{#if splitName}
				<div class="gb-workout-split-badge">{splitName}</div>
			{/if}
		</div>
		<WorkoutTimer startTime={activeWorkout.startTime} />
	</div>

	<!-- Exercises -->
	{#if activeWorkout.exercises.length > 0}
		<div class="gb-exercises">
			{#each activeWorkout.exercises as exercise, index}
				<ExerciseCard
					{exercise}
					exerciseIndex={index}
					exerciseInfo={getExerciseInfo(exercise.exerciseId)}
					{showRPE}
					{unit}
				/>
			{/each}
		</div>
	{/if}

	<!-- Add Exercise Button -->
	<Button variant="ghost" size="lg" fullWidth icon={Plus} onclick={addExercise}>
		Add Exercise
	</Button>

	<!-- Finish Workout Button (only show if exercises with sets exist) -->
	{#if hasSets}
		<div class="gb-workout-actions">
			<Button
				variant="primary"
				size="lg"
				fullWidth
				icon={Flag}
				onclick={finishWorkout}
			>
				Finish Workout
			</Button>
		</div>
	{/if}

	<!-- Cancel Option -->
	<div class="gb-workout-cancel">
		<Button variant="ghost" size="sm" icon={X} onclick={cancelWorkout}>
			Cancel Workout
		</Button>
	</div>
</div>
