import type { Exercise, TrainingSplit } from "../../types";

export type ExercisePickerProps = {
	exercises?: Exercise[];
	recentExercises?: Exercise[];
	favoriteExercises?: Exercise[];
	favoriteIds?: Set<string>;
	currentSplit?: TrainingSplit | null;
	selectedMuscles?: string[];
	recentExpanded?: boolean;
	muscleGroupsExpanded?: boolean;
};
