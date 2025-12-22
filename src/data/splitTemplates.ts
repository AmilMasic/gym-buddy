import { SplitTemplate, TrainingSplit } from "../types";

/**
 * Built-in training split templates
 */
export const BUILT_IN_TEMPLATES: SplitTemplate[] = [
	{
		id: "ppl",
		name: "Push/Pull/Legs",
		splits: [
			{
				id: "ppl-push",
				name: "Push",
				muscleGroups: [
					"Chest",
					"Shoulders",
					"Triceps",
				],
			},
			{
				id: "ppl-pull",
				name: "Pull",
				muscleGroups: [
					"Back",
					"Biceps",
					"Traps",
					"Rear Delts",
				],
			},
			{
				id: "ppl-legs",
				name: "Legs",
				muscleGroups: [
					"Quadriceps",
					"Hamstrings",
					"Glutes",
					"Calves",
				],
			},
		],
	},
	{
		id: "upper-lower",
		name: "Upper/Lower",
		splits: [
			{
				id: "upper-lower-upper",
				name: "Upper Body",
				muscleGroups: [
					"Chest",
					"Back",
					"Shoulders",
					"Biceps",
					"Triceps",
					"Traps",
				],
			},
			{
				id: "upper-lower-lower",
				name: "Lower Body",
				muscleGroups: [
					"Quadriceps",
					"Hamstrings",
					"Glutes",
					"Calves",
					"Abs",
				],
			},
		],
	},
	{
		id: "bro-split",
		name: "Bro Split (5-day)",
		splits: [
			{
				id: "bro-chest",
				name: "Chest",
				muscleGroups: ["Chest", "Triceps"],
			},
			{
				id: "bro-back",
				name: "Back",
				muscleGroups: ["Back", "Biceps", "Traps"],
			},
			{
				id: "bro-shoulders",
				name: "Shoulders",
				muscleGroups: ["Shoulders", "Triceps"],
			},
			{
				id: "bro-arms",
				name: "Arms",
				muscleGroups: ["Biceps", "Triceps", "Forearms"],
			},
			{
				id: "bro-legs",
				name: "Legs",
				muscleGroups: [
					"Quadriceps",
					"Hamstrings",
					"Glutes",
					"Calves",
				],
			},
		],
	},
	{
		id: "full-body",
		name: "Full Body",
		splits: [
			{
				id: "full-body-all",
				name: "Full Body",
				muscleGroups: [
					"Chest",
					"Back",
					"Shoulders",
					"Biceps",
					"Triceps",
					"Quadriceps",
					"Hamstrings",
					"Glutes",
					"Calves",
					"Abs",
				],
			},
		],
	},
	{
		id: "arnold",
		name: "Arnold Split",
		splits: [
			{
				id: "arnold-chest-back",
				name: "Chest & Back",
				muscleGroups: ["Chest", "Back"],
			},
			{
				id: "arnold-shoulders-arms",
				name: "Shoulders & Arms",
				muscleGroups: [
					"Shoulders",
					"Biceps",
					"Triceps",
				],
			},
			{
				id: "arnold-legs",
				name: "Legs",
				muscleGroups: [
					"Quadriceps",
					"Hamstrings",
					"Glutes",
					"Calves",
				],
			},
		],
	},
];

/**
 * Get a split template by ID
 */
export function getSplitTemplate(templateId: string): SplitTemplate | undefined {
	return BUILT_IN_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get a split by ID from a template
 */
export function getSplitFromTemplate(
	templateId: string,
	splitId: string
): TrainingSplit | undefined {
	const template = getSplitTemplate(templateId);
	return template?.splits.find((s) => s.id === splitId);
}

/**
 * Get all muscle groups from a split
 */
export function getMuscleGroupsForSplit(
	templateId: string,
	splitId: string
): string[] {
	const split = getSplitFromTemplate(templateId, splitId);
	return split?.muscleGroups || [];
}

