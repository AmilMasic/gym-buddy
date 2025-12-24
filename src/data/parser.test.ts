import { describe, it, expect } from 'vitest';
import { WorkoutParser } from './parser';
import type { Workout, WorkoutExercise, WorkoutSet } from '../types';

describe('WorkoutParser', () => {
	describe('round-trip conversion', () => {
		it('should convert workout to markdown and back to matching object', () => {
			const workout: Workout = {
				date: '2025-01-15',
				duration: 45,
				muscles: ['Chest', 'Triceps'],
				volume: 5000,
				prs: 1,
				split: 'push',
				exercises: [
					{
						name: 'Bench Press',
						exerciseId: 'bench-press',
						sets: [
							{ setNumber: 1, weight: 135, reps: 10 },
							{ setNumber: 2, weight: 155, reps: 8, rpe: 7 },
							{ setNumber: 3, weight: 165, reps: 6, rpe: 8.5 },
						],
					},
					{
						name: 'Tricep Dips',
						exerciseId: 'tricep-dips',
						sets: [
							{ setNumber: 1, weight: 0, reps: 12 },
							{ setNumber: 2, weight: 0, reps: 10 },
						],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.date).toBe(workout.date);
			expect(parsed.duration).toBe(workout.duration);
			expect(parsed.muscles).toEqual(workout.muscles);
			expect(parsed.volume).toBe(workout.volume);
			expect(parsed.prs).toBe(workout.prs);
			expect(parsed.split).toBe(workout.split);
			expect(parsed.exercises).toHaveLength(workout.exercises.length);

			// Verify first exercise
			expect(parsed.exercises[0]?.name).toBe('Bench Press');
			expect(parsed.exercises[0]?.sets).toHaveLength(3);
			expect(parsed.exercises[0]?.sets[0]).toEqual({
				setNumber: 1,
				weight: 135,
				reps: 10,
			});
			expect(parsed.exercises[0]?.sets[1]).toEqual({
				setNumber: 2,
				weight: 155,
				reps: 8,
				rpe: 7,
			});

			// Verify second exercise (bodyweight)
			expect(parsed.exercises[1]?.name).toBe('Tricep Dips');
			expect(parsed.exercises[1]?.sets).toHaveLength(2);
			expect(parsed.exercises[1]?.sets[0]).toEqual({
				setNumber: 1,
				weight: 0,
				reps: 12,
			});
		});
	});

	describe('empty workout', () => {
		it('should handle workout with no exercises', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: [],
				exercises: [],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.date).toBe(workout.date);
			expect(parsed.exercises).toHaveLength(0);
			expect(parsed.muscles).toEqual([]);
		});
	});

	describe('multiple exercises', () => {
		it('should handle workout with multiple exercises', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Chest', 'Triceps', 'Shoulders'],
				exercises: [
					{
						name: 'Bench Press',
						sets: [{ setNumber: 1, weight: 135, reps: 10 }],
					},
					{
						name: 'Overhead Press',
						sets: [{ setNumber: 1, weight: 95, reps: 8 }],
					},
					{
						name: 'Tricep Pushdown',
						sets: [{ setNumber: 1, weight: 60, reps: 12 }],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises).toHaveLength(3);
			expect(parsed.exercises[0]?.name).toBe('Bench Press');
			expect(parsed.exercises[1]?.name).toBe('Overhead Press');
			expect(parsed.exercises[2]?.name).toBe('Tricep Pushdown');
		});
	});

	describe('bodyweight exercise (weight=0)', () => {
		it('should correctly handle bodyweight exercises with weight=0', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Chest'],
				exercises: [
					{
						name: 'Push-ups',
						sets: [
							{ setNumber: 1, weight: 0, reps: 20 },
							{ setNumber: 2, weight: 0, reps: 18 },
							{ setNumber: 3, weight: 0, reps: 15 },
						],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.sets).toHaveLength(3);
			expect(parsed.exercises[0]?.sets[0]?.weight).toBe(0);
			expect(parsed.exercises[0]?.sets[1]?.weight).toBe(0);
			expect(parsed.exercises[0]?.sets[2]?.weight).toBe(0);
		});

		it('should preserve weight=0 in round-trip conversion', () => {
			const originalSet: WorkoutSet = {
				setNumber: 1,
				weight: 0,
				reps: 15,
			};

			const exercise: WorkoutExercise = {
				name: 'Pull-ups',
				sets: [originalSet],
			};

			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Back'],
				exercises: [exercise],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.sets[0]?.weight).toBe(0);
			expect(parsed.exercises[0]?.sets[0]?.reps).toBe(15);
		});
	});

	describe('RPE values', () => {
		it('should handle sets with RPE values', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Legs'],
				exercises: [
					{
						name: 'Squat',
						sets: [
							{ setNumber: 1, weight: 225, reps: 5, rpe: 7 },
							{ setNumber: 2, weight: 245, reps: 5, rpe: 8 },
							{ setNumber: 3, weight: 265, reps: 5, rpe: 9.5 },
						],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.sets[0]?.rpe).toBe(7);
			expect(parsed.exercises[0]?.sets[1]?.rpe).toBe(8);
			expect(parsed.exercises[0]?.sets[2]?.rpe).toBe(9.5);
		});

		it('should handle mixed sets with and without RPE', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Back'],
				exercises: [
					{
						name: 'Deadlift',
						sets: [
							{ setNumber: 1, weight: 135, reps: 10 }, // no RPE
							{ setNumber: 2, weight: 225, reps: 5, rpe: 7 },
							{ setNumber: 3, weight: 275, reps: 3 }, // no RPE
						],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.sets[0]?.rpe).toBeUndefined();
			expect(parsed.exercises[0]?.sets[1]?.rpe).toBe(7);
			expect(parsed.exercises[0]?.sets[2]?.rpe).toBeUndefined();
		});
	});

	describe('time-based sets', () => {
		it('should handle exercises with time tracking', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Abs'],
				exercises: [
					{
						name: 'Plank',
						sets: [
							{ setNumber: 1, time: 60 },
							{ setNumber: 2, time: 45 },
							{ setNumber: 3, time: 30 },
						],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.sets[0]?.time).toBe(60);
			expect(parsed.exercises[0]?.sets[1]?.time).toBe(45);
			expect(parsed.exercises[0]?.sets[2]?.time).toBe(30);
		});

		it('should handle mixed time and weight exercises', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Abs', 'Chest'],
				exercises: [
					{
						name: 'Weighted Plank',
						sets: [
							{ setNumber: 1, weight: 25, time: 45 },
							{ setNumber: 2, weight: 25, time: 40 },
						],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.sets[0]?.weight).toBe(25);
			expect(parsed.exercises[0]?.sets[0]?.time).toBe(45);
			expect(parsed.exercises[0]?.sets[1]?.weight).toBe(25);
			expect(parsed.exercises[0]?.sets[1]?.time).toBe(40);
		});
	});

	describe('special characters in exercise names', () => {
		it('should handle exercise names with special characters', () => {
			const workout: Workout = {
				date: '2025-01-15',
				muscles: ['Legs'],
				exercises: [
					{
						name: "Farmer's Walk",
						sets: [{ setNumber: 1, weight: 100, reps: 1 }],
					},
					{
						name: 'Cable Fly (High-to-Low)',
						sets: [{ setNumber: 1, weight: 30, reps: 12 }],
					},
					{
						name: 'Romanian Deadlift / RDL',
						sets: [{ setNumber: 1, weight: 185, reps: 10 }],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			expect(parsed.exercises[0]?.name).toBe("Farmer's Walk");
			expect(parsed.exercises[1]?.name).toBe('Cable Fly (High-to-Low)');
			expect(parsed.exercises[2]?.name).toBe('Romanian Deadlift / RDL');
		});
	});

	describe('markdown without frontmatter', () => {
		it('should handle workout without frontmatter (appended format)', () => {
			const workout: Workout = {
				date: '2025-01-15',
				duration: 30,
				muscles: ['Arms'],
				split: 'arms',
				exercises: [
					{
						name: 'Bicep Curl',
						sets: [{ setNumber: 1, weight: 35, reps: 10 }],
					},
				],
			};

			const markdown = WorkoutParser.workoutToMarkdown(workout, false);
			const parsed = WorkoutParser.markdownToWorkout(markdown, workout.date);

			// Without frontmatter, metadata won't be preserved
			expect(parsed.date).toBe(workout.date);
			expect(parsed.exercises).toHaveLength(1);
			expect(parsed.exercises[0]?.name).toBe('Bicep Curl');
		});
	});
});
