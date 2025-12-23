import { SplitTemplate, TrainingSplit } from "../../types";

/**
 * Built-in training split templates
 */

export const BACK = ["Lower Back", "Upper Back", "Lats", "Traps"];
export const BUILT_IN_TEMPLATES: SplitTemplate[] = [
	{
		id: "ppl",
		name: "Push/Pull/Legs",
		splits: [
			{
				id: "ppl-push",
				name: "Push",
				muscleGroups: ["Chest", "Shoulders", "Triceps"],
			},
			{
				id: "ppl-pull",
				name: "Pull",
				muscleGroups: [...BACK, "Biceps", "Rear Delts"],
			},
			{
				id: "ppl-legs",
				name: "Legs",
				muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
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
					...BACK,
					"Shoulders",
					"Biceps",
					"Triceps",
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
				muscleGroups: [...BACK, "Biceps"],
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
				muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
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
					...BACK,
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
				muscleGroups: ["Shoulders", "Biceps", "Triceps"],
			},
			{
				id: "arnold-legs",
				name: "Legs",
				muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
			},
		],
	},
	{
		id: "hybrid",
		name: "Hybrid (PPL + Upper/Lower)",
		splits: [
			{
				id: "hybrid-push",
				name: "Push",
				muscleGroups: ["Chest", "Shoulders", "Triceps"],
			},
			{
				id: "hybrid-pull",
				name: "Pull",
				muscleGroups: ["Back", "Biceps", "Traps", "Rear Delts"],
			},
			{
				id: "hybrid-legs",
				name: "Legs",
				muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
			},
			{
				id: "hybrid-upper",
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
				id: "hybrid-lower",
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
];

/**
 * Get a split template by ID (checks both built-in and custom templates)
 * Note: This function only checks built-in templates. For custom templates,
 * use the plugin's settings.customSplitTemplates directly.
 */
export function getSplitTemplate(
	templateId: string
): SplitTemplate | undefined {
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

/**
 * Get today's day of week as a lowercase string
 */
export function getTodayDayOfWeek():
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday" {
	const days = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	] as const;
	return days[new Date().getDay()] as
		| "monday"
		| "tuesday"
		| "wednesday"
		| "thursday"
		| "friday"
		| "saturday"
		| "sunday";
}

/**
 * Get today's scheduled split from the weekly schedule
 */
export function getTodaysSplit(
	weeklySchedule: Record<string, string | undefined>,
	template: SplitTemplate | undefined
): TrainingSplit | null {
	if (!template) return null;

	const today = getTodayDayOfWeek();
	const splitId = weeklySchedule[today];

	if (!splitId) return null;

	return template.splits.find((s) => s.id === splitId) || null;
}

/**
 * Get all available splits from all templates (built-in + custom)
 * Returns an array of objects with split, template info, and source template ID
 */
export interface AvailableSplit {
	split: TrainingSplit;
	templateName: string;
	templateId: string;
	isCustom: boolean;
}

export function getAllAvailableSplits(
	customTemplates: SplitTemplate[] = []
): AvailableSplit[] {
	const allSplits: AvailableSplit[] = [];
	// Deduplicate by split name + muscle groups (normalized)
	// This ensures we only show unique splits, even if they appear in multiple templates
	const seenSplits = new Set<string>();

	// Add splits from built-in templates only (original unique splits)
	// This ensures we only show unique splits from original templates, not duplicates from custom templates
	for (const template of BUILT_IN_TEMPLATES) {
		for (const split of template.splits) {
			// Create a unique key from split name and muscle groups (sorted for consistency)
			const muscleGroupsKey = [...split.muscleGroups].sort().join(",");
			const uniqueKey = `${split.name}|${muscleGroupsKey}`;

			// Only add if we haven't seen this exact split before
			if (!seenSplits.has(uniqueKey)) {
				seenSplits.add(uniqueKey);
				allSplits.push({
					split: {
						...split,
						sourceTemplateId: template.id,
					},
					templateName: template.name,
					templateId: template.id,
					isCustom: false,
				});
			}
		}
	}

	// Note: We intentionally don't include splits from custom templates here
	// because custom templates are composite templates that combine splits from built-in templates.
	// Including them would cause duplicates. Users should select from the original unique splits only.

	return allSplits;
}

/**
 * Create a composite template from selected splits
 * Ensures unique IDs by prefixing with source template ID if needed
 */
export function createCompositeTemplate(
	name: string,
	selectedSplits: AvailableSplit[],
	templateId?: string
): SplitTemplate {
	const splits: TrainingSplit[] = selectedSplits.map(
		(availableSplit, index) => {
			// Create unique ID by combining source template ID and original split ID
			// This prevents conflicts when the same split ID exists in multiple templates
			const uniqueId = `${availableSplit.templateId}-${availableSplit.split.id}`;

			return {
				...availableSplit.split,
				id: uniqueId,
				sourceTemplateId: availableSplit.templateId,
			};
		}
	);

	return {
		id: templateId || `custom-composite-${Date.now()}`,
		name,
		splits,
		isCustom: true,
		isComposite: true,
	};
}
