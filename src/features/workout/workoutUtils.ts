import { moment } from "obsidian";
import type {
	ActiveWorkout,
	Workout,
	WorkoutExercise,
	Exercise,
} from "../../types";

/**
 * Format elapsed time as MM:SS or H:MM:SS
 */
export function formatDuration(startTime: Date): string {
	const totalSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Calculate workout duration in minutes
 */
export function calculateDuration(startTime: Date): number {
	return Math.floor((Date.now() - startTime.getTime()) / 60000);
}

/**
 * Calculate total volume (weight x reps for all sets)
 */
export function calculateVolume(exercises: WorkoutExercise[]): number {
	return exercises.reduce((total, ex) => {
		return (
			total +
			ex.sets.reduce((setTotal, set) => {
				return setTotal + (set.weight || 0) * (set.reps || 0);
			}, 0)
		);
	}, 0);
}

/**
 * Derive unique muscle groups from exercises
 */
export function deriveMuscles(
	exercises: WorkoutExercise[],
	exerciseLibrary: Exercise[]
): string[] {
	const muscles = new Set<string>();

	for (const ex of exercises) {
		const exercise = exerciseLibrary.find((e) => e.id === ex.exerciseId);
		if (exercise) {
			for (const muscle of exercise.muscles) {
				muscles.add(muscle);
			}
		}
	}

	return Array.from(muscles);
}

/**
 * Convert ActiveWorkout to Workout for saving
 */
export function activeWorkoutToWorkout(
	activeWorkout: ActiveWorkout,
	exerciseLibrary: Exercise[]
): Workout {
	return {
		date: moment().format("YYYY-MM-DD"),
		duration: calculateDuration(activeWorkout.startTime),
		muscles: deriveMuscles(activeWorkout.exercises, exerciseLibrary),
		volume: calculateVolume(activeWorkout.exercises),
		exercises: activeWorkout.exercises,
		split: activeWorkout.splitId,
	};
}
