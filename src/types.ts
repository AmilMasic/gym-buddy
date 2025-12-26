/**
 * Core type definitions for Gym Buddy plugin
 */

export type ExerciseType = "weight" | "bodyweight" | "timed" | "cardio";
export type WeightUnit = "lbs" | "kg";

export type Exercise = {
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
};

export type WorkoutSet = {
	setNumber: number;
	weight?: number;
	reps?: number;
	time?: number; // seconds
	distance?: number;
	rpe?: number; // Rate of Perceived Exertion (1-10)
};

export type WorkoutExercise = {
	name: string;
	exerciseId?: string;
	sets: WorkoutSet[];
	isCompleted?: boolean;
};

export type Workout = {
	date: string; // ISO date string (YYYY-MM-DD)
	duration?: number; // minutes
	muscles: string[]; // AUTO: derived from exercises
	volume?: number; // AUTO: sum of (weight × reps) for all sets
	prs?: number; // AUTO: count of PRs hit this session
	exercises: WorkoutExercise[];
	split?: string; // Training split ID for this workout
};

export type PRRecord = {
	exerciseId: string;
	type: "1rm" | "maxWeight" | "maxReps" | "maxVolume";
	value: number;
	date: string;
	workoutFile: string;
};

export type ActiveWorkout = {
	startTime: Date;
	exercises: WorkoutExercise[];
	currentExerciseIndex?: number;
	splitId?: string; // ID of the training split for this workout
};

// External exercise format (from free-exercise-db)
export type ExternalExercise = {
	id: string;
	name: string;
	force: "push" | "pull" | "static" | null;
	level: "beginner" | "intermediate" | "expert";
	equipment: string | null;
	primaryMuscles: string[];
	secondaryMuscles: string[];
	instructions: string[];
	category: string;
};

// Training split
export type TrainingSplit = {
	id: string;
	name: string;
	muscleGroups: string[];
	sourceTemplateId?: string; // ID of template this split came from (for composite templates)
};

export type SplitTemplate = {
	id: string;
	name: string;
	splits: TrainingSplit[];
	isCustom?: boolean;
	isComposite?: boolean; // True if this template combines splits from other templates
};

// Per-split favorites
export type SplitFavorites = {
	splitId: string;
	exerciseIds: string[];
};

// Weekly schedule maps day of week to split ID
export type WeeklySchedule = {
	[key: string]: string | undefined;
	monday?: string;
	tuesday?: string;
	wednesday?: string;
	thursday?: string;
	friday?: string;
	saturday?: string;
	sunday?: string;
};

export type GymBuddySettings = {
	workoutFolder: string; // Default: "Workouts"
	defaultUnit: WeightUnit;
	showRPE: boolean;
	restTimerEnabled: boolean;
	restTimerDuration: number; // seconds (default: 90)
	dailyNoteIntegration: boolean; // embed in daily note
	dailyNoteHeading: string; // "## Workout"

	// Individual workout notes (always saved)
	workoutFilenameFormat: string; // "{{date}}-{{time}}" or "{{date}}-{{split}}"

	// Weekly aggregation (optional)
	weeklyNotesEnabled: boolean; // false by default
	weeklyNoteFolder: string; // "Workouts/weeks"
	weeklyNoteFilename: string; // "{{year}}-W{{week}}" or "{{year}}-W{{week}}.md"

	// Integration
	usePeriodicNotesConfig: boolean; // Auto-detect Periodic Notes paths
	templaterTokenEnabled: boolean; // Expose {{gym-buddy-weekly-links}} token

	// Deprecated: kept for migration (will be removed in future version)
	workoutSaveMode?: string; // Old: "daily-append" | "daily-timestamp" | "weekly"
	weeklyNotePath?: string; // e.g., "Weekly/{{year}}-W{{week}}.md" (deprecated)
	weeklyNoteHeading?: string; // e.g., "## Workouts" (deprecated)

	activeSplitTemplateId: string; // ID of active split template
	customSplitTemplates: SplitTemplate[]; // User-created custom splits
	weeklySchedule: WeeklySchedule; // Maps days to splits for auto-detection
	promptForSplitOnStart: boolean; // Ask for split when starting workout
	showSplitFilterInPicker: boolean; // Auto-filter exercises by split in picker
	recentExercisesExpanded: boolean; // Recent exercises section expanded state
	muscleGroupsExpanded: boolean; // Muscle groups section expanded state
	defaultRecentExercisesExpanded: boolean; // Default state for recent exercises
	defaultMuscleGroupsExpanded: boolean; // Default state for muscle groups
	selectedMuscleGroups: string[]; // Persisted muscle group selections
};

export const DEFAULT_SETTINGS: GymBuddySettings = {
	workoutFolder: "Workouts",
	defaultUnit: "lbs",
	showRPE: true,
	restTimerEnabled: true,
	restTimerDuration: 90,
	dailyNoteIntegration: false,
	dailyNoteHeading: "## Workout",

	// Individual workout notes (always saved)
	workoutFilenameFormat: "{{date}}-{{time}}",

	// Weekly aggregation (optional)
	weeklyNotesEnabled: false,
	weeklyNoteFolder: "Workouts/weeks",
	weeklyNoteFilename: "{{year}}-W{{week}}",

	// Integration
	usePeriodicNotesConfig: true, // Auto-detect Periodic Notes by default
	templaterTokenEnabled: false, // Disabled by default

	activeSplitTemplateId: "ppl", // Default to PPL
	customSplitTemplates: [],
	weeklySchedule: {}, // Empty by default - user sets up via training setup
	promptForSplitOnStart: true,
	showSplitFilterInPicker: false, // Disabled - removed the split filter UI
	recentExercisesExpanded: true,
	muscleGroupsExpanded: true,
	defaultRecentExercisesExpanded: true,
	defaultMuscleGroupsExpanded: true,
	selectedMuscleGroups: [],
};
