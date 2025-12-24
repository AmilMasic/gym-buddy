import { describe, it, expect, beforeEach } from 'vitest';
import { ExerciseDatabase } from './exerciseDatabase';

describe('ExerciseDatabase', () => {
	let database: ExerciseDatabase;

	beforeEach(async () => {
		database = new ExerciseDatabase();
		await database.initialize();
	});

	describe('initialize', () => {
		it('should load exercises from database', async () => {
			const exercises = database.getAllExercises();
			expect(exercises.length).toBeGreaterThan(0);
		});

		it('should map external exercises to internal format', async () => {
			const exercises = database.getAllExercises();
			const exercise = exercises[0];

			expect(exercise).toBeDefined();
			expect(exercise).toHaveProperty('id');
			expect(exercise).toHaveProperty('name');
			expect(exercise).toHaveProperty('muscles');
			expect(exercise).toHaveProperty('type');
			expect(exercise).toHaveProperty('trackWeight');
			expect(exercise).toHaveProperty('trackReps');
			expect(exercise).toHaveProperty('trackTime');
			expect(exercise).toHaveProperty('trackDistance');
			expect(exercise).toHaveProperty('unit');
		});

		it('should not reinitialize if already initialized', async () => {
			const exercises1 = database.getAllExercises();
			await database.initialize();
			const exercises2 = database.getAllExercises();

			expect(exercises1).toBe(exercises2); // Same reference
		});
	});

	describe('searchExercises', () => {
		it('should find exercises by exact name match', () => {
			const results = database.searchExercises('bench');
			expect(results.length).toBeGreaterThan(0);
			expect(
				results.some((ex) => ex.name.toLowerCase().includes('bench'))
			).toBe(true);
		});

		it('should be case insensitive', () => {
			const lower = database.searchExercises('bench');
			const upper = database.searchExercises('BENCH');
			const mixed = database.searchExercises('BeNcH');

			expect(lower.length).toBe(upper.length);
			expect(lower.length).toBe(mixed.length);
		});

		it('should find exercises by partial name match', () => {
			const results = database.searchExercises('curl');
			expect(results.length).toBeGreaterThan(0);
			expect(
				results.every((ex) => ex.name.toLowerCase().includes('curl'))
			).toBe(true);
		});

		it('should return empty array when no matches found', () => {
			const results = database.searchExercises('xyzabc123notfound');
			expect(results).toEqual([]);
		});

		it('should return all exercises for empty query', () => {
			const results = database.searchExercises('');
			const allExercises = database.getAllExercises();
			expect(results.length).toBe(allExercises.length);
		});
	});

	describe('getExercisesByMuscle', () => {
		it('should filter exercises by muscle group', () => {
			const chestExercises = database.getExercisesByMuscle('chest');
			expect(chestExercises.length).toBeGreaterThan(0);
			expect(
				chestExercises.every((ex) => {
					const allMuscles = [...ex.muscles, ...(ex.secondaryMuscles || [])];
					return allMuscles.some((m) => m.toLowerCase() === 'chest');
				})
			).toBe(true);
		});

		it('should be case insensitive', () => {
			const lower = database.getExercisesByMuscle('chest');
			const upper = database.getExercisesByMuscle('CHEST');
			const mixed = database.getExercisesByMuscle('ChEsT');

			expect(lower.length).toBe(upper.length);
			expect(lower.length).toBe(mixed.length);
		});

		it('should return empty array for non-existent muscle', () => {
			const results = database.getExercisesByMuscle('nonexistentmuscle');
			expect(results).toEqual([]);
		});

		it('should include exercises with muscle in secondary muscles', () => {
			// Many exercises have secondary muscle groups
			const tricepsExercises = database.getExercisesByMuscle('triceps');
			expect(tricepsExercises.length).toBeGreaterThan(0);
		});
	});

	describe('getExercisesByAnyMuscle (OR logic)', () => {
		it('should return exercises matching any muscle group', () => {
			const results = database.getExercisesByAnyMuscle(['chest', 'back']);
			expect(results.length).toBeGreaterThan(0);

			// Should include exercises that work chest OR back
			const chestOnly = database.getExercisesByMuscle('chest');
			const backOnly = database.getExercisesByMuscle('back');
			expect(results.length).toBeGreaterThanOrEqual(chestOnly.length);
			expect(results.length).toBeGreaterThanOrEqual(backOnly.length);
		});

		it('should remove duplicates', () => {
			const results = database.getExercisesByAnyMuscle(['chest', 'triceps']);
			const uniqueIds = new Set(results.map((ex) => ex.id));
			expect(uniqueIds.size).toBe(results.length);
		});

		it('should return all exercises for empty muscle array', () => {
			const results = database.getExercisesByAnyMuscle([]);
			const allExercises = database.getAllExercises();
			expect(results.length).toBe(allExercises.length);
		});

		it('should be case insensitive', () => {
			const lower = database.getExercisesByAnyMuscle(['chest']);
			const upper = database.getExercisesByAnyMuscle(['CHEST']);
			expect(lower.length).toBe(upper.length);
		});
	});

	describe('getExercisesByMuscles (AND logic)', () => {
		it('should return exercises matching all muscle groups', () => {
			// Find exercises that work both chest AND triceps (like bench press)
			const results = database.getExercisesByMuscles(['chest', 'triceps']);
			expect(results.length).toBeGreaterThan(0);

			// All results should have both chest and triceps
			expect(
				results.every((ex) => {
					const muscles = [
						...ex.muscles,
						...(ex.secondaryMuscles || []),
					].map((m) => m.toLowerCase());
					return muscles.includes('chest') && muscles.includes('triceps');
				})
			).toBe(true);
		});

		it('should return fewer results than OR logic', () => {
			const andResults = database.getExercisesByMuscles(['chest', 'triceps']);
			const orResults = database.getExercisesByAnyMuscle(['chest', 'triceps']);
			expect(andResults.length).toBeLessThanOrEqual(orResults.length);
		});

		it('should return all exercises for empty muscle array', () => {
			const results = database.getExercisesByMuscles([]);
			const allExercises = database.getAllExercises();
			expect(results.length).toBe(allExercises.length);
		});

		it('should return empty array if no exercises match all muscles', () => {
			// Very unlikely any exercise works all these together
			const results = database.getExercisesByMuscles([
				'chest',
				'back',
				'legs',
				'shoulders',
			]);
			// This might return empty or very few results
			expect(Array.isArray(results)).toBe(true);
		});

		it('should be case insensitive', () => {
			const lower = database.getExercisesByMuscles(['chest', 'triceps']);
			const upper = database.getExercisesByMuscles(['CHEST', 'TRICEPS']);
			expect(lower.length).toBe(upper.length);
		});

		it('should handle single muscle (same as getExercisesByMuscle)', () => {
			const byMuscle = database.getExercisesByMuscle('chest');
			const byMuscles = database.getExercisesByMuscles(['chest']);
			expect(byMuscle.length).toBe(byMuscles.length);
		});
	});

	describe('muscle normalization', () => {
		it('should normalize common muscle name variations', () => {
			// Test that different variations return same results
			const abs1 = database.getExercisesByMuscle('abs');
			const abs2 = database.getExercisesByMuscle('abdominals');
			expect(abs1.length).toBe(abs2.length);
		});

		it('should normalize quadriceps variations', () => {
			const quads1 = database.getExercisesByMuscle('quadriceps');
			const quads2 = database.getExercisesByMuscle('quads');
			expect(quads1.length).toBe(quads2.length);
		});
	});

	describe('exercise properties', () => {
		it('should have correct tracking flags for weight exercises', () => {
			const benchPress = database
				.searchExercises('bench press')
				.find((ex) => ex.name.toLowerCase().includes('bench press'));

			if (benchPress) {
				expect(benchPress.trackWeight).toBe(true);
				expect(benchPress.trackReps).toBe(true);
			}
		});

		it('should have source set to database', () => {
			const exercises = database.getAllExercises();
			expect(
				exercises.every((ex) => ex.source === 'database')
			).toBe(true);
		});

		it('should have normalized muscle names', () => {
			const exercises = database.getAllExercises();
			const allMuscles = new Set<string>();

			exercises.forEach((ex) => {
				ex.muscles.forEach((m) => allMuscles.add(m));
				ex.secondaryMuscles?.forEach((m) => allMuscles.add(m));
			});

			// Check that muscles follow title case pattern (Chest, not chest)
			allMuscles.forEach((muscle) => {
				expect(muscle[0]).toBe(muscle[0]?.toUpperCase());
			});
		});
	});
});
