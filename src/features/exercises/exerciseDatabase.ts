import exercisesData from "./exercises.json";
import { Exercise, ExternalExercise, ExerciseType } from "../../types";

/**
 * Muscle name normalization map
 * Maps external database muscle names to standardized internal names
 */
const MUSCLE_NORMALIZATION: Record<string, string> = {
	// Core/abs
	abdominals: "Abs",
	abs: "Abs",

	// Back
	lats: "Lats",
	"middle back": "Middle Back",
	"lower back": "Lower Back",
	"upper back": "Upper Back",
	back: "Back",
	traps: "Traps",

	// Chest
	chest: "Chest",
	pectorals: "Chest",

	// Shoulders
	shoulders: "Shoulders",
	delts: "Shoulders",
	"rear delts": "Rear Delts",

	// Arms
	biceps: "Biceps",
	triceps: "Triceps",
	forearms: "Forearms",

	// Legs
	quadriceps: "Quadriceps",
	quads: "Quadriceps",
	hamstrings: "Hamstrings",
	glutes: "Glutes",
	calves: "Calves",
	adductors: "Adductors",
	abductors: "Abductors",

	// Other
	cardiovascular: "Cardio",
	neck: "Neck",
};

/**
 * Category to ExerciseType mapping
 */
const CATEGORY_TO_TYPE: Record<string, ExerciseType> = {
	strength: "weight",
	powerlifting: "weight",
	strongman: "weight",
	cardio: "cardio",
	stretching: "timed",
	"olympic weightlifting": "weight",
	plyometrics: "bodyweight",
};

/**
 * ExerciseDatabase class for managing exercise data from external database
 */
export class ExerciseDatabase {
	private exercises: Exercise[] = [];
	private muscleIndex: Map<string, Exercise[]> = new Map();
	private forceIndex: Map<string, Exercise[]> = new Map();
	private initialized = false;

	/**
	 * Normalize muscle name to standard format
	 */
	private normalizeMuscleName(muscle: string): string {
		const normalized = MUSCLE_NORMALIZATION[muscle.toLowerCase()];
		return (
			normalized ||
			muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase()
		);
	}

	/**
	 * Map external exercise format to internal Exercise format
	 */
	private mapExternalExercise(external: ExternalExercise): Exercise {
		const primaryMuscles = external.primaryMuscles.map((m) =>
			this.normalizeMuscleName(m)
		);
		const secondaryMuscles = external.secondaryMuscles.map((m) =>
			this.normalizeMuscleName(m)
		);

		// Determine exercise type from category
		const exerciseType =
			CATEGORY_TO_TYPE[external.category.toLowerCase()] || "weight";

		// Add "Cardio" to muscles array for cardio exercises so they appear in the Cardio filter
		if (exerciseType === "cardio" && !primaryMuscles.includes("Cardio")) {
			primaryMuscles.unshift("Cardio");
		}

		// Special case: Rucking tracks weight (pack weight) in addition to distance/time
		const isRucking = external.id === "Rucking";

		// Determine tracking flags based on type
		const trackWeight = exerciseType === "weight" || isRucking;
		const trackReps =
			exerciseType === "weight" ||
			exerciseType === "bodyweight";
		const trackTime = exerciseType === "cardio" || exerciseType === "timed";
		const trackDistance = exerciseType === "cardio";

		return {
			id: external.id,
			name: external.name,
			muscles: primaryMuscles,
			secondaryMuscles:
				secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
			type: exerciseType,
			trackWeight,
			trackReps,
			trackTime,
			trackDistance,
			unit: "lbs", // Default, can be overridden by user settings
			force: external.force || null,
			equipment: external.equipment || null,
			instructions: external.instructions || [],
			source: "database",
		};
	}

	/**
	 * Build indexes for fast filtering
	 */
	private buildIndexes(): void {
		this.muscleIndex.clear();
		this.forceIndex.clear();

		for (const exercise of this.exercises) {
			// Index by primary muscles
			for (const muscle of exercise.muscles) {
				if (!this.muscleIndex.has(muscle)) {
					this.muscleIndex.set(muscle, []);
				}
				this.muscleIndex.get(muscle)?.push(exercise);
			}

			// Index by secondary muscles
			if (exercise.secondaryMuscles) {
				for (const muscle of exercise.secondaryMuscles) {
					if (!this.muscleIndex.has(muscle)) {
						this.muscleIndex.set(muscle, []);
					}
					this.muscleIndex.get(muscle)?.push(exercise);
				}
			}

			// Index by force type
			if (exercise.force) {
				if (!this.forceIndex.has(exercise.force)) {
					this.forceIndex.set(exercise.force, []);
				}
				this.forceIndex.get(exercise.force)?.push(exercise);
			}
		}
	}

	/**
	 * Initialize database by loading and mapping exercises
	 */
	initialize(): void {
		if (this.initialized) return;

		const externalExercises = exercisesData as ExternalExercise[];
		this.exercises = externalExercises.map((ex) =>
			this.mapExternalExercise(ex)
		);
		this.buildIndexes();
		this.initialized = true;
	}

	/**
	 * Get all exercises
	 */
	getAllExercises(): Exercise[] {
		return this.exercises;
	}

	/**
	 * Get exercises by muscle group
	 */
	getExercisesByMuscle(muscle: string): Exercise[] {
		const normalized = this.normalizeMuscleName(muscle);
		return this.muscleIndex.get(normalized) || [];
	}

	/**
	 * Get exercises by force type
	 */
	getExercisesByForce(force: "push" | "pull" | "static"): Exercise[] {
		return this.forceIndex.get(force) || [];
	}

	/**
	 * Search exercises by name
	 */
	searchExercises(query: string): Exercise[] {
		const lowerQuery = query.toLowerCase();
		return this.exercises.filter((ex) =>
			ex.name.toLowerCase().includes(lowerQuery)
		);
	}

	/**
	 * Get exercises matching multiple muscle groups (AND logic)
	 */
	getExercisesByMuscles(muscles: string[]): Exercise[] {
		if (muscles.length === 0) return this.exercises;

		const normalized = muscles.map((m) => this.normalizeMuscleName(m));
		const muscleSets = normalized.map(
			(m) => new Set(this.muscleIndex.get(m)?.map((e) => e.id) || [])
		);

		// Find exercises that appear in all muscle groups
		const commonIds = muscleSets.reduce((acc, set) => {
			if (acc.size === 0) return set;
			return new Set([...acc].filter((id) => set.has(id)));
		}, new Set<string>());

		return this.exercises.filter((ex) => commonIds.has(ex.id));
	}

	/**
	 * Get exercises matching any of the muscle groups (OR logic)
	 */
	getExercisesByAnyMuscle(muscles: string[]): Exercise[] {
		if (muscles.length === 0) return this.exercises;

		const normalized = muscles.map((m) => this.normalizeMuscleName(m));
		const exerciseIds = new Set<string>();

		for (const muscle of normalized) {
			const exercises = this.muscleIndex.get(muscle) || [];
			for (const ex of exercises) {
				exerciseIds.add(ex.id);
			}
		}

		return this.exercises.filter((ex) => exerciseIds.has(ex.id));
	}
}

// Singleton instance
let databaseInstance: ExerciseDatabase | null = null;

/**
 * Get the singleton ExerciseDatabase instance
 */
export function getExerciseDatabase(): ExerciseDatabase {
	if (!databaseInstance) {
		databaseInstance = new ExerciseDatabase();
	}
	return databaseInstance;
}
