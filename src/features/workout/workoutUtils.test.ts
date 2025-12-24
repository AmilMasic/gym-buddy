import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	formatDuration,
	calculateDuration,
	calculateVolume,
	deriveMuscles,
} from './workoutUtils';
import type { WorkoutExercise, Exercise } from '../../types';

describe('workoutUtils', () => {
	describe('formatDuration', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should format duration in seconds (under 1 minute)', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:00:30'));

			const result = formatDuration(startTime);
			expect(result).toBe('0:30');
		});

		it('should format duration in minutes and seconds', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:05:45'));

			const result = formatDuration(startTime);
			expect(result).toBe('5:45');
		});

		it('should format duration with hours', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T11:23:45'));

			const result = formatDuration(startTime);
			expect(result).toBe('1:23:45');
		});

		it('should format duration with multiple hours', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T12:05:03'));

			const result = formatDuration(startTime);
			expect(result).toBe('2:05:03');
		});

		it('should pad seconds and minutes with leading zeros', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:03:05'));

			const result = formatDuration(startTime);
			expect(result).toBe('3:05');
		});

		it('should handle zero duration', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:00:00'));

			const result = formatDuration(startTime);
			expect(result).toBe('0:00');
		});
	});

	describe('calculateDuration', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should return duration in minutes', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:45:00'));

			const result = calculateDuration(startTime);
			expect(result).toBe(45);
		});

		it('should floor partial minutes', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:45:45'));

			const result = calculateDuration(startTime);
			expect(result).toBe(45);
		});

		it('should handle zero duration', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T10:00:30'));

			const result = calculateDuration(startTime);
			expect(result).toBe(0);
		});

		it('should handle long durations', () => {
			const startTime = new Date('2025-01-01T10:00:00');
			vi.setSystemTime(new Date('2025-01-01T12:30:00'));

			const result = calculateDuration(startTime);
			expect(result).toBe(150);
		});
	});

	describe('calculateVolume', () => {
		it('should calculate total volume for single exercise', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					sets: [
						{ setNumber: 1, weight: 135, reps: 10 }, // 1350
						{ setNumber: 2, weight: 155, reps: 8 }, // 1240
						{ setNumber: 3, weight: 165, reps: 6 }, // 990
					],
				},
			];

			const volume = calculateVolume(exercises);
			expect(volume).toBe(3580);
		});

		it('should calculate total volume for multiple exercises', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					sets: [
						{ setNumber: 1, weight: 135, reps: 10 }, // 1350
						{ setNumber: 2, weight: 155, reps: 8 }, // 1240
					],
				},
				{
					name: 'Squat',
					sets: [
						{ setNumber: 1, weight: 225, reps: 5 }, // 1125
						{ setNumber: 2, weight: 245, reps: 5 }, // 1225
					],
				},
			];

			const volume = calculateVolume(exercises);
			expect(volume).toBe(4940);
		});

		it('should handle bodyweight exercises (weight=0)', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Push-ups',
					sets: [
						{ setNumber: 1, weight: 0, reps: 20 }, // 0
						{ setNumber: 2, weight: 0, reps: 18 }, // 0
					],
				},
			];

			const volume = calculateVolume(exercises);
			expect(volume).toBe(0);
		});

		it('should handle sets without weight', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Plank',
					sets: [
						{ setNumber: 1, time: 60 },
						{ setNumber: 2, time: 45 },
					],
				},
			];

			const volume = calculateVolume(exercises);
			expect(volume).toBe(0);
		});

		it('should handle sets without reps', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Weighted Plank',
					sets: [
						{ setNumber: 1, weight: 25, time: 45 },
					],
				},
			];

			const volume = calculateVolume(exercises);
			expect(volume).toBe(0);
		});

		it('should handle mixed exercises', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					sets: [
						{ setNumber: 1, weight: 135, reps: 10 }, // 1350
					],
				},
				{
					name: 'Pull-ups',
					sets: [
						{ setNumber: 1, weight: 0, reps: 12 }, // 0
					],
				},
				{
					name: 'Plank',
					sets: [
						{ setNumber: 1, time: 60 }, // 0
					],
				},
			];

			const volume = calculateVolume(exercises);
			expect(volume).toBe(1350);
		});

		it('should handle empty exercises array', () => {
			const exercises: WorkoutExercise[] = [];
			const volume = calculateVolume(exercises);
			expect(volume).toBe(0);
		});
	});

	describe('deriveMuscles', () => {
		const exerciseLibrary: Exercise[] = [
			{
				id: 'bench-press',
				name: 'Bench Press',
				muscles: ['Chest', 'Triceps'],
				type: 'weight',
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: 'lbs',
			},
			{
				id: 'squat',
				name: 'Squat',
				muscles: ['Quadriceps', 'Glutes'],
				type: 'weight',
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: 'lbs',
			},
			{
				id: 'deadlift',
				name: 'Deadlift',
				muscles: ['Back', 'Hamstrings', 'Glutes'],
				type: 'weight',
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: 'lbs',
			},
			{
				id: 'pull-ups',
				name: 'Pull-ups',
				muscles: ['Back', 'Biceps'],
				type: 'bodyweight',
				trackWeight: false,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: 'lbs',
			},
		];

		it('should derive unique muscles from single exercise', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					exerciseId: 'bench-press',
					sets: [{ setNumber: 1, weight: 135, reps: 10 }],
				},
			];

			const muscles = deriveMuscles(exercises, exerciseLibrary);
			expect(muscles).toEqual(['Chest', 'Triceps']);
		});

		it('should derive unique muscles from multiple exercises', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					exerciseId: 'bench-press',
					sets: [{ setNumber: 1, weight: 135, reps: 10 }],
				},
				{
					name: 'Squat',
					exerciseId: 'squat',
					sets: [{ setNumber: 1, weight: 225, reps: 5 }],
				},
			];

			const muscles = deriveMuscles(exercises, exerciseLibrary);
			expect(muscles.sort()).toEqual(['Chest', 'Glutes', 'Quadriceps', 'Triceps'].sort());
		});

		it('should remove duplicate muscles', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Deadlift',
					exerciseId: 'deadlift',
					sets: [{ setNumber: 1, weight: 315, reps: 5 }],
				},
				{
					name: 'Pull-ups',
					exerciseId: 'pull-ups',
					sets: [{ setNumber: 1, weight: 0, reps: 10 }],
				},
			];

			const muscles = deriveMuscles(exercises, exerciseLibrary);
			// Both exercises work "Back", should only appear once
			const backCount = muscles.filter((m) => m === 'Back').length;
			expect(backCount).toBe(1);
			expect(muscles.sort()).toEqual(['Back', 'Biceps', 'Glutes', 'Hamstrings'].sort());
		});

		it('should handle exercises not in library', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Custom Exercise',
					exerciseId: 'custom-123',
					sets: [{ setNumber: 1, weight: 100, reps: 10 }],
				},
			];

			const muscles = deriveMuscles(exercises, exerciseLibrary);
			expect(muscles).toEqual([]);
		});

		it('should handle exercises without exerciseId', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					sets: [{ setNumber: 1, weight: 135, reps: 10 }],
				},
			];

			const muscles = deriveMuscles(exercises, exerciseLibrary);
			expect(muscles).toEqual([]);
		});

		it('should handle empty exercises array', () => {
			const exercises: WorkoutExercise[] = [];
			const muscles = deriveMuscles(exercises, exerciseLibrary);
			expect(muscles).toEqual([]);
		});

		it('should handle mix of known and unknown exercises', () => {
			const exercises: WorkoutExercise[] = [
				{
					name: 'Bench Press',
					exerciseId: 'bench-press',
					sets: [{ setNumber: 1, weight: 135, reps: 10 }],
				},
				{
					name: 'Unknown Exercise',
					exerciseId: 'unknown',
					sets: [{ setNumber: 1, weight: 100, reps: 10 }],
				},
			];

			const muscles = deriveMuscles(exercises, exerciseLibrary);
			expect(muscles.sort()).toEqual(['Chest', 'Triceps'].sort());
		});
	});
});
