import { App, PluginSettingTab, Setting } from "obsidian";
import type GymBuddyPlugin from "../main";
import { WeightUnit, WorkoutSaveMode } from "../types";
import { BUILT_IN_TEMPLATES } from "../features/splits/splitTemplates";

export class GymBuddySettingTab extends PluginSettingTab {
	gbPlugin: GymBuddyPlugin;

	constructor(app: App, plugin: GymBuddyPlugin) {
		super(app, plugin);
		this.gbPlugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		// Explicitly cast to GymBuddySettings to help the linter resolve types
		// in the presence of circular dependencies.
		const settings = this.gbPlugin.settings;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Workout folder")
			.setDesc("Folder where workout logs are stored")
			.addText((text) =>
				text
					.setPlaceholder("Workouts")
					.setValue(settings.workoutFolder)
					.onChange(async (value) => {
						settings.workoutFolder = value || "Workouts";
						await this.gbPlugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default unit")
			.setDesc("Default weight unit (lbs or kg)")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("lbs", "Lbs")
					.addOption("kg", "Kg")
					.setValue(settings.defaultUnit)
					.onChange(async (value: WeightUnit) => {
						settings.defaultUnit = value;
						await this.gbPlugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show rate of perceived exertion")
			.setDesc("Show rate of perceived exertion field when logging sets")
			.addToggle((toggle) =>
				toggle.setValue(settings.showRPE).onChange(async (value) => {
					settings.showRPE = value;
					await this.gbPlugin.saveSettings();
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
					.setValue(settings.restTimerEnabled)
					.onChange(async (value) => {
						settings.restTimerEnabled = value;
						await this.gbPlugin.saveSettings();
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
					.setValue(settings.restTimerDuration.toString())
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							settings.restTimerDuration = num;
							await this.gbPlugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Daily note integration")
			.setDesc("Embed workout logs in daily notes")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.dailyNoteIntegration)
					.onChange(async (value) => {
						settings.dailyNoteIntegration = value;
						await this.gbPlugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Daily note heading")
			.setDesc("Heading to use for workout section in daily notes")
			.addText((text) =>
				text
					.setPlaceholder("## workout")
					.setValue(settings.dailyNoteHeading)
					.onChange(async (value) => {
						settings.dailyNoteHeading = value || "## Workout";
						await this.gbPlugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Save strategy").setHeading();

		new Setting(containerEl)
			.setName("Workout save mode")
			.setDesc("How multiple workouts on the same day are handled")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("daily-append", "Append to daily file")
					.addOption(
						"daily-timestamp",
						"Create unique timestamp files"
					)
					.addOption("weekly", "Save to weekly note")
					.setValue(settings.workoutSaveMode)
					.onChange(async (value) => {
						settings.workoutSaveMode = value as WorkoutSaveMode;
						await this.gbPlugin.saveSettings();
						this.display(); // Refresh to show/hide conditional settings
					})
			);

		if (settings.workoutSaveMode === "weekly") {
			new Setting(containerEl)
				.setName("Weekly note path pattern")
				.setDesc(
					"Pattern for weekly note path. Uses moment.js formatting."
				)
				.addText((text) =>
					text
						.setPlaceholder("Weekly/{{year}}-W{{week}}.md")
						.setValue(settings.weeklyNotePath)
						.onChange(async (value) => {
							settings.weeklyNotePath =
								value || "Weekly/{{year}}-W{{week}}.md";
							await this.gbPlugin.saveSettings();
						})
				);

			new Setting(containerEl)
				.setName("Weekly note heading")
				.setDesc("Heading to insert workouts under in the weekly note")
				.addText((text) =>
					text
						// eslint-disable-next-line obsidianmd/ui/sentence-case
						.setPlaceholder("## Workouts")
						.setValue(settings.weeklyNoteHeading)
						.onChange(async (value) => {
							settings.weeklyNoteHeading = value || "## Workouts";
							await this.gbPlugin.saveSettings();
						})
				);
		}

		// Training Split Settings Section
		new Setting(containerEl).setName("Training splits").setHeading();

		// Show current template info
		const allTemplates = [
			...BUILT_IN_TEMPLATES,
			...settings.customSplitTemplates,
		];
		const activeTemplate = allTemplates.find(
			(t) => t.id === settings.activeSplitTemplateId
		);

		// Show weekly schedule if set
		const schedule = settings.weeklySchedule;
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
						this.gbPlugin.openTrainingSetup();
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
					.setValue(settings.promptForSplitOnStart)
					.onChange(async (value) => {
						settings.promptForSplitOnStart = value;
						await this.gbPlugin.saveSettings();
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
					.setValue(settings.defaultRecentExercisesExpanded)
					.onChange(async (value) => {
						settings.defaultRecentExercisesExpanded = value;
						await this.gbPlugin.saveSettings();
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
					.setValue(settings.defaultMuscleGroupsExpanded)
					.onChange(async (value) => {
						settings.defaultMuscleGroupsExpanded = value;
						await this.gbPlugin.saveSettings();
					})
			);
	}
}
