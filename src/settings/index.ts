import { App, PluginSettingTab, Setting } from "obsidian";
import GymBuddyPlugin from "../main";
import { WeightUnit, SplitTemplate } from "../types";
import { BUILT_IN_TEMPLATES } from "../features/splits/splitTemplates";

// Weekly schedule maps day of week to split ID
export interface WeeklySchedule {
	[key: string]: string | undefined;
	monday?: string;
	tuesday?: string;
	wednesday?: string;
	thursday?: string;
	friday?: string;
	saturday?: string;
	sunday?: string;
}

export interface GymBuddySettings {
	workoutFolder: string; // Default: "Workouts"
	defaultUnit: WeightUnit;
	showRPE: boolean;
	restTimerEnabled: boolean;
	restTimerDuration: number; // seconds (default: 90)
	dailyNoteIntegration: boolean; // embed in daily note
	dailyNoteHeading: string; // "## Workout"
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
}

export const DEFAULT_SETTINGS: GymBuddySettings = {
	workoutFolder: "Workouts",
	defaultUnit: "lbs",
	showRPE: true,
	restTimerEnabled: true,
	restTimerDuration: 90,
	dailyNoteIntegration: false,
	dailyNoteHeading: "## Workout",
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

export class GymBuddySettingTab extends PluginSettingTab {
	plugin: GymBuddyPlugin;

	constructor(app: App, plugin: GymBuddyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Workout folder")
			.setDesc("Folder where workout logs are stored")
			.addText((text) =>
				text
					.setPlaceholder("Workouts")
					.setValue(this.plugin.settings.workoutFolder)
					.onChange(async (value) => {
						this.plugin.settings.workoutFolder =
							value || "Workouts";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default unit")
			.setDesc("Default weight unit (lbs or kg)")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("lbs", "Lbs")
					.addOption("kg", "Kg")
					.setValue(this.plugin.settings.defaultUnit)
					.onChange(async (value: WeightUnit) => {
						this.plugin.settings.defaultUnit = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show rate of perceived exertion")
			.setDesc("Show rate of perceived exertion field when logging sets")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showRPE)
					.onChange(async (value) => {
						this.plugin.settings.showRPE = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setName("Use rest interval")
			.setDesc(
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				"Automatically start rest interval timer after logging a set"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.restTimerEnabled)
					.onChange(async (value) => {
						this.plugin.settings.restTimerEnabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setName("Rest timer duration")
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc("Rest timer duration in seconds")
			.addText((text) =>
				text
					.setPlaceholder("90")
					.setValue(this.plugin.settings.restTimerDuration.toString())
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							this.plugin.settings.restTimerDuration = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Daily note integration")
			.setDesc("Embed workout logs in daily notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.dailyNoteIntegration)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteIntegration = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Daily note heading")
			.setDesc("Heading to use for workout section in daily notes")
			.addText((text) =>
				text
					.setPlaceholder("## workout")
					.setValue(this.plugin.settings.dailyNoteHeading)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteHeading =
							value || "## Workout";
						await this.plugin.saveSettings();
					})
			);

		// Training Split Settings Section
		new Setting(containerEl).setName("Training splits").setHeading();

		// Show current template info
		const allTemplates = [
			...BUILT_IN_TEMPLATES,
			...this.plugin.settings.customSplitTemplates,
		];
		const activeTemplate = allTemplates.find(
			(t) => t.id === this.plugin.settings.activeSplitTemplateId
		);

		// Show weekly schedule if set
		const schedule = this.plugin.settings.weeklySchedule;
		const hasSchedule = Object.values(schedule).some((v) => v);

		let scheduleText = "";
		if (hasSchedule && activeTemplate) {
			const days = [
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
				"sunday",
			] as const;
			scheduleText = days
				.filter((d) => schedule[d])
				.map((d) => {
					const split = activeTemplate.splits.find(
						(s) => s.id === schedule[d]
					);
					return `${d.charAt(0).toUpperCase() + d.slice(1, 3)}: ${
						split?.name || "?"
					}`;
				})
				.join(", ");
		}

		// Current configuration summary with reconfigure button
		const configDesc = activeTemplate
			? `${activeTemplate.name}${
					scheduleText ? ` • ${scheduleText}` : ""
			  }`
			: "Not configured";

		new Setting(containerEl)
			.setName("Training configuration")
			.setDesc(configDesc)
			.addButton((button) =>
				button
					.setButtonText("Configure")
					.setCta()
					.onClick(() => {
						this.plugin.openTrainingSetup();
						// Close settings and let the modal take over
					})
			);

		// Prompt for split on start
		new Setting(containerEl)
			.setName("Ask for split when starting workout")
			.setDesc(
				"If disabled, will auto-start with today's scheduled split (if set)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.promptForSplitOnStart)
					.onChange(async (value) => {
						this.plugin.settings.promptForSplitOnStart = value;
						await this.plugin.saveSettings();
					})
			);

		// Exercise Picker Settings Section
		new Setting(containerEl).setName("Exercise picker").setHeading();

		// Default Recent Exercises Expanded
		new Setting(containerEl)
			.setName("Default recent exercises expanded")
			.setDesc(
				"Recent exercises section will be expanded by default when opening the picker"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.defaultRecentExercisesExpanded
					)
					.onChange(async (value) => {
						this.plugin.settings.defaultRecentExercisesExpanded =
							value;
						await this.plugin.saveSettings();
					})
			);

		// Default Muscle Groups Expanded
		new Setting(containerEl)
			.setName("Default muscle groups expanded")
			.setDesc(
				"Muscle groups section will be expanded by default when opening the picker"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultMuscleGroupsExpanded)
					.onChange(async (value) => {
						this.plugin.settings.defaultMuscleGroupsExpanded =
							value;
						await this.plugin.saveSettings();
					})
			);
	}
}
