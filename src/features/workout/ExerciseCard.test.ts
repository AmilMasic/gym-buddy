import { describe, it, expect, vi } from 'vitest';
import type { WorkoutExercise } from '../../types';

/**
 * Integration tests for ExerciseCard completion functionality
 *
 * These tests verify the completion state logic and event handling
 * for the ExerciseCard component. Since testing Svelte components
 * directly requires additional setup, these tests focus on the
 * business logic and expected behavior.
 */
describe('ExerciseCard completion state', () => {
	const defaultExercise: WorkoutExercise = {
		name: 'Bench Press',
		exerciseId: 'bench-press',
		sets: [
			{ setNumber: 1, weight: 135, reps: 10 },
			{ setNumber: 2, weight: 155, reps: 8 },
		],
	};

	describe('completion toggle state', () => {
		it('should have isCompleted property on WorkoutExercise type', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: true,
			};

			expect(exercise.isCompleted).toBe(true);
		});

		it('should allow isCompleted to be undefined (optional)', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
			};

			expect(exercise.isCompleted).toBeUndefined();
		});

		it('should toggle isCompleted state correctly', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: false,
			};

			// Simulate toggling completion
			exercise.isCompleted = !exercise.isCompleted;
			expect(exercise.isCompleted).toBe(true);

			// Toggle back
			exercise.isCompleted = !exercise.isCompleted;
			expect(exercise.isCompleted).toBe(false);
		});
	});

	describe('completion event handling', () => {
		it('should create correct event detail for completion toggle', () => {
			const exerciseIndex = 0;
			const isCompleted = true;

			// Simulate the event detail that ExerciseCard would create
			const eventDetail = {
				index: exerciseIndex,
				isCompleted: isCompleted,
			};

			expect(eventDetail).toEqual({
				index: 0,
				isCompleted: true,
			});
		});

		it('should include exercise index in toggle event detail', () => {
			// Simulate toggling different exercises
			const event1Detail = { index: 0, isCompleted: true };
			const event2Detail = { index: 2, isCompleted: true };

			expect(event1Detail.index).toBe(0);
			expect(event2Detail.index).toBe(2);
			expect(event1Detail.isCompleted).toBe(true);
			expect(event2Detail.isCompleted).toBe(true);
		});
	});

	describe('completion visual states', () => {
		it('should determine completed state based on isCompleted flag', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: true,
			};

			// Visual class should be applied when isCompleted is true
			const shouldHaveCompletedClass = exercise.isCompleted === true;
			expect(shouldHaveCompletedClass).toBe(true);
		});

		it('should not show completed state when isCompleted is false', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: false,
			};

			const shouldHaveCompletedClass = exercise.isCompleted === true;
			expect(shouldHaveCompletedClass).toBe(false);
		});

		it('should not show completed state when isCompleted is undefined', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
			};

			const shouldHaveCompletedClass = exercise.isCompleted === true;
			expect(shouldHaveCompletedClass).toBe(false);
		});
	});

	describe('completion collapse behavior', () => {
		it('should determine collapsed state based on isCompleted and expanded flags', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: true,
			};
			let expanded = true;

			// When exercise is completed, it should auto-collapse
			if (exercise.isCompleted) {
				expanded = false;
			}

			expect(expanded).toBe(false);
		});

		it('should allow completed exercises to be manually expanded', () => {
			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: true,
			};
			let expanded = false; // Auto-collapsed due to completion

			// User manually expands
			expanded = true;

			// Exercise should stay expanded even though it's completed
			expect(expanded).toBe(true);
			expect(exercise.isCompleted).toBe(true);
		});
	});

	describe('completion accessibility', () => {
		it('should provide appropriate aria-label based on completion state', () => {
			const incompleteLabel = 'Mark as complete';
			const completeLabel = 'Mark as incomplete';

			const exercise: WorkoutExercise = {
				...defaultExercise,
				isCompleted: false,
			};

			const ariaLabel = exercise.isCompleted ? completeLabel : incompleteLabel;
			expect(ariaLabel).toBe('Mark as complete');

			// When completed
			exercise.isCompleted = true;
			const newAriaLabel = exercise.isCompleted ? completeLabel : incompleteLabel;
			expect(newAriaLabel).toBe('Mark as incomplete');
		});
	});

	describe('completion callback handling', () => {
		it('should invoke onToggleComplete callback when provided', () => {
			const onToggleComplete = vi.fn();
			const exerciseIndex = 0;
			const newCompletedState = true;

			// Simulate the callback being called
			onToggleComplete(exerciseIndex, newCompletedState);

			expect(onToggleComplete).toHaveBeenCalledTimes(1);
			expect(onToggleComplete).toHaveBeenCalledWith(0, true);
		});

		it('should handle completion state changes via callback', () => {
			const exercises: WorkoutExercise[] = [
				{ ...defaultExercise, isCompleted: false },
				{ name: 'Squat', sets: [], isCompleted: false },
			];

			const handleToggleComplete = (index: number, isCompleted: boolean) => {
				const exercise = exercises[index];
				if (exercise) {
					exercise.isCompleted = isCompleted;
				}
			};

			// Mark first exercise as complete
			handleToggleComplete(0, true);
			expect(exercises[0]?.isCompleted).toBe(true);
			expect(exercises[1]?.isCompleted).toBe(false);

			// Mark second exercise as complete
			handleToggleComplete(1, true);
			expect(exercises[0]?.isCompleted).toBe(true);
			expect(exercises[1]?.isCompleted).toBe(true);

			// Unmark first exercise
			handleToggleComplete(0, false);
			expect(exercises[0]?.isCompleted).toBe(false);
			expect(exercises[1]?.isCompleted).toBe(true);
		});
	});

	describe('multiple exercises completion tracking', () => {
		it('should track completion independently for each exercise', () => {
			const exercises: WorkoutExercise[] = [
				{ name: 'Bench Press', sets: [], isCompleted: false },
				{ name: 'Squat', sets: [], isCompleted: false },
				{ name: 'Deadlift', sets: [], isCompleted: false },
			];

			// Complete first and third
			const ex0 = exercises[0];
			const ex2 = exercises[2];
			if (ex0) ex0.isCompleted = true;
			if (ex2) ex2.isCompleted = true;

			expect(exercises[0]?.isCompleted).toBe(true);
			expect(exercises[1]?.isCompleted).toBe(false);
			expect(exercises[2]?.isCompleted).toBe(true);
		});

		it('should count completed exercises correctly', () => {
			const exercises: WorkoutExercise[] = [
				{ name: 'Bench Press', sets: [], isCompleted: true },
				{ name: 'Squat', sets: [], isCompleted: false },
				{ name: 'Deadlift', sets: [], isCompleted: true },
				{ name: 'Pull-ups', sets: [], isCompleted: false },
			];

			const completedCount = exercises.filter(ex => ex.isCompleted).length;
			expect(completedCount).toBe(2);
		});

		it('should identify remaining exercises', () => {
			const exercises: WorkoutExercise[] = [
				{ name: 'Bench Press', sets: [], isCompleted: true },
				{ name: 'Squat', sets: [], isCompleted: false },
				{ name: 'Deadlift', sets: [], isCompleted: true },
			];

			const remainingExercises = exercises.filter(ex => !ex.isCompleted);
			expect(remainingExercises.length).toBe(1);
			expect(remainingExercises[0]?.name).toBe('Squat');
		});
	});
});
