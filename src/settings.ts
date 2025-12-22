import { App, PluginSettingTab, Setting } from "obsidian";
import GymBuddyPlugin from "./main";
import { WeightUnit, SplitTemplate } from "./types";
import { BUILT_IN_TEMPLATES } from "./data/splitTemplates";
import { CustomSplitEditorModal } from "./ui/CustomSplitEditorModal";

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
	promptForSplitOnStart: true,
	showSplitFilterInPicker: true,
	recentExercisesExpanded: true, // Expanded by default
	muscleGroupsExpanded: true, // Expanded by default
	defaultRecentExercisesExpanded: true, // Default to expanded
	defaultMuscleGroupsExpanded: true, // Default to expanded
	selectedMuscleGroups: [], // No muscle groups selected by default
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

		// Split template selector
		const allTemplates = [
			...BUILT_IN_TEMPLATES,
			...this.plugin.settings.customSplitTemplates,
		];
		new Setting(containerEl)
			.setName("Active split template")
			.setDesc("Select your training split template")
			.addDropdown((dropdown) => {
				for (const template of allTemplates) {
					dropdown.addOption(template.id, template.name);
				}
				dropdown.setValue(this.plugin.settings.activeSplitTemplateId);
				dropdown.onChange(async (value) => {
					this.plugin.settings.activeSplitTemplateId = value;
					await this.plugin.saveSettings();
				});
			});

		// Prompt for split on start
		new Setting(containerEl)
			.setName("Prompt for split when starting workout")
			.setDesc("Ask which split to use when starting a new workout")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.promptForSplitOnStart)
					.onChange(async (value) => {
						this.plugin.settings.promptForSplitOnStart = value;
						await this.plugin.saveSettings();
					})
			);

		// Auto-filter exercises by split
		new Setting(containerEl)
			.setName("Auto-filter exercises by split")
			.setDesc(
				"Automatically filter exercises to match the selected split's muscle groups"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showSplitFilterInPicker)
					.onChange(async (value) => {
						this.plugin.settings.showSplitFilterInPicker = value;
						await this.plugin.saveSettings();
					})
			);

		// Manage custom splits button
		new Setting(containerEl)
			.setName("Manage custom splits")
			.setDesc("Create and edit custom training split templates")
			.addButton((button) =>
				button
					.setButtonText("Open split editor")
					.setCta()
					.onClick(() => {
						const modal = new CustomSplitEditorModal(
							this.plugin,
							(template: SplitTemplate) => {
								// Save custom template
								const existingIndex =
									this.plugin.settings.customSplitTemplates.findIndex(
										(t) => t.id === template.id
									);
								if (existingIndex >= 0) {
									this.plugin.settings.customSplitTemplates[
										existingIndex
									] = template;
								} else {
									this.plugin.settings.customSplitTemplates.push(
										template
									);
								}
								void this.plugin.saveSettings();
								// Refresh settings UI
								this.display();
							},
							(templateId: string) => {
								// Delete custom template
								this.plugin.settings.customSplitTemplates =
									this.plugin.settings.customSplitTemplates.filter(
										(t) => t.id !== templateId
									);
								// If deleted template was active, reset to default
								if (
									this.plugin.settings
										.activeSplitTemplateId === templateId
								) {
									this.plugin.settings.activeSplitTemplateId =
										"ppl";
								}
								void this.plugin.saveSettings();
								// Refresh settings UI
								this.display();
							}
						);
						modal.open();
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
