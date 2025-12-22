/**
 * Core type definitions for Gym Buddy plugin
 */

export type ExerciseType = "weight" | "bodyweight" | "timed" | "cardio";
export type WeightUnit = "lbs" | "kg";

export interface Exercise {
	id: string;
	name: string;
	muscles: string[]; // primary muscles worked
	type: ExerciseType;
	trackWeight: boolean;
	trackReps: boolean;
	trackTime: boolean;
	trackDistance: boolean;
	unit: WeightUnit;
	secondaryMuscles?: string[];
	force?: "push" | "pull" | "static" | null;
	equipment?: string | null;
	instructions?: string[];
	source?: "database" | "custom"; // Track if from external DB or user-created
}

export interface WorkoutSet {
	setNumber: number;
	weight?: number;
	reps?: number;
	time?: number; // seconds
	distance?: number;
	rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface WorkoutExercise {
	name: string;
	exerciseId?: string;
	sets: WorkoutSet[];
}

export interface Workout {
	date: string; // ISO date string (YYYY-MM-DD)
	duration?: number; // minutes
	muscles: string[]; // AUTO: derived from exercises
	volume?: number; // AUTO: sum of (weight × reps) for all sets
	prs?: number; // AUTO: count of PRs hit this session
	exercises: WorkoutExercise[];
	split?: string; // Training split ID for this workout
}

export interface PRRecord {
	exerciseId: string;
	type: "1rm" | "maxWeight" | "maxReps" | "maxVolume";
	value: number;
	date: string;
	workoutFile: string;
}

export interface ActiveWorkout {
	startTime: Date;
	exercises: WorkoutExercise[];
	currentExerciseIndex?: number;
	splitId?: string; // ID of the training split for this workout
}

// External exercise format (from free-exercise-db)
export interface ExternalExercise {
	id: string;
	name: string;
	force: "push" | "pull" | "static" | null;
	level: "beginner" | "intermediate" | "expert";
	equipment: string | null;
	primaryMuscles: string[];
	secondaryMuscles: string[];
	instructions: string[];
	category: string;
}

// Training split
export interface TrainingSplit {
	id: string;
	name: string;
	muscleGroups: string[];
}

export interface SplitTemplate {
	id: string;
	name: string;
	splits: TrainingSplit[];
	isCustom?: boolean;
}

// Per-split favorites
export interface SplitFavorites {
	splitId: string;
	exerciseIds: string[];
}
