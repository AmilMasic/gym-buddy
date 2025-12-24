import { App, PluginSettingTab, Setting } from "obsidian";
import type GymBuddyPlugin from "../main";
import { WeightUnit } from "../types";
import { BUILT_IN_TEMPLATES } from "../features/splits/splitTemplates";

/**
 * Validates a folder path for Obsidian
 * @param path - The folder path to validate
 * @returns Object with validation result and optional error message
 */
function validateFolderPath(path: string): { valid: boolean; error?: string } {
	if (!path || path.trim() === "") {
		return { valid: true }; // Empty uses default, which is fine
	}
	if (path.startsWith("/")) {
		return { valid: false, error: "Path should not start with /" };
	}
	const invalidChars = /[<>:"|?*]/;
	if (invalidChars.test(path)) {
		return {
			valid: false,
			error: "Path contains invalid characters (< > : \" | ? *)",
		};
	}
	const depth = path.split("/").filter((p) => p).length;
	if (depth > 3) {
		return {
			valid: true,
			error: "Warning: Deeply nested path (3+ levels)",
		};
	}
	return { valid: true };
}

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

		// Individual Workouts Section
		new Setting(containerEl).setName("Individual workouts").setHeading();

		const workoutFolderSetting = new Setting(containerEl)
			.setName("Workout folder")
			.setDesc("Folder where individual workout notes are saved");

		let workoutFolderValidationTimeout: ReturnType<typeof setTimeout>;

		workoutFolderSetting.addText((text) => {
			const validateAndUpdate = (value: string) => {
				const validation = validateFolderPath(value);
				const descEl = workoutFolderSetting.descEl;

				if (!validation.valid || validation.error) {
					const errorMessage = validation.error || "Invalid path";
					descEl.empty();
					descEl.appendText("Folder where individual workout notes are saved");
					descEl.createEl("br");
					descEl.createSpan({ text: errorMessage, cls: "gb-validation-error" });
					text.inputEl.toggleClass("gb-input-error", !validation.valid);
				} else {
					descEl.setText("Folder where individual workout notes are saved");
					text.inputEl.removeClass("gb-input-error");
				}
			};

			text.setPlaceholder("Workouts")
				.setValue(settings.workoutFolder)
				.onChange(async (value) => {
					// Debounce validation
					clearTimeout(workoutFolderValidationTimeout);
					workoutFolderValidationTimeout = setTimeout(() => {
						validateAndUpdate(value);
					}, 300);

					const validation = validateFolderPath(value);
					if (validation.valid) {
						settings.workoutFolder = value || "Workouts";
						await this.gbPlugin.saveSettings();
					}
				});

			// Initial validation
			validateAndUpdate(settings.workoutFolder);
		});

		new Setting(containerEl)
			.setName("Workout filename format")
			.setDesc(
				"Pattern for workout filenames. Available: {{date}}, {{time}}, {{year}}, {{month}}, {{day}}, {{split}}"
			)
			.addText((text) =>
				text
					.setPlaceholder("{{date}}-{{time}}")
					.setValue(settings.workoutFilenameFormat)
					.onChange(async (value) => {
						settings.workoutFilenameFormat =
							value || "{{date}}-{{time}}";
						await this.gbPlugin.saveSettings();
					})
			);

		// Weekly Summaries Section
		new Setting(containerEl).setName("Weekly summaries").setHeading();

		new Setting(containerEl)
			.setName("Enable weekly summaries")
			.setDesc(
				"Automatically create weekly notes with links to individual workout sessions"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.weeklyNotesEnabled)
					.onChange(async (value) => {
						settings.weeklyNotesEnabled = value;
						await this.gbPlugin.saveSettings();
						this.display(); // Refresh to show/hide conditional settings
					})
			);

		if (settings.weeklyNotesEnabled) {
			const weeklyFolderSetting = new Setting(containerEl)
				.setName("Weekly note folder")
				.setDesc("Folder where weekly summary notes are saved");

			let weeklyFolderValidationTimeout: ReturnType<typeof setTimeout>;

			weeklyFolderSetting.addText((text) => {
				const validateAndUpdate = (value: string) => {
					const validation = validateFolderPath(value);
					const descEl = weeklyFolderSetting.descEl;

					if (!validation.valid || validation.error) {
						const errorMessage = validation.error || "Invalid path";
						descEl.empty();
						descEl.appendText("Folder where weekly summary notes are saved");
						descEl.createEl("br");
						descEl.createSpan({ text: errorMessage, cls: "gb-validation-error" });
						text.inputEl.toggleClass("gb-input-error", !validation.valid);
					} else {
						descEl.setText("Folder where weekly summary notes are saved");
						text.inputEl.removeClass("gb-input-error");
					}
				};

				text
					// eslint-disable-next-line obsidianmd/ui/sentence-case
					.setPlaceholder("Workouts/Weeks")
					.setValue(settings.weeklyNoteFolder)
					.onChange(async (value) => {
						// Debounce validation
						clearTimeout(weeklyFolderValidationTimeout);
						weeklyFolderValidationTimeout = setTimeout(() => {
							validateAndUpdate(value);
						}, 300);

						const validation = validateFolderPath(value);
						if (validation.valid) {
							settings.weeklyNoteFolder =
								value || "Workouts/Weeks";
							await this.gbPlugin.saveSettings();
						}
					});

				// Initial validation
				validateAndUpdate(settings.weeklyNoteFolder);
			});

			new Setting(containerEl)
				.setName("Weekly note filename")
				.setDesc(
					"Pattern for weekly note filenames. Available: {{year}}, {{week}}, {{month}}, {{day}}"
				)
				.addText((text) =>
					text
						.setPlaceholder("{{year}}-W{{week}}")
						.setValue(settings.weeklyNoteFilename)
						.onChange(async (value) => {
							settings.weeklyNoteFilename =
								value || "{{year}}-W{{week}}";
							await this.gbPlugin.saveSettings();
						})
				);
		}

		// Integrations Section
		new Setting(containerEl).setName("Integrations").setHeading();

		new Setting(containerEl)
			.setName("Use periodic notes configuration")
			.setDesc(
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				"Automatically detect and use Periodic Notes plugin settings for weekly notes"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.usePeriodicNotesConfig)
					.onChange(async (value) => {
						settings.usePeriodicNotesConfig = value;
						await this.gbPlugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Enable templater token")
			.setDesc(
				"Expose {{gym-buddy-weekly-links}} token for use in Templater templates"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.templaterTokenEnabled)
					.onChange(async (value) => {
						settings.templaterTokenEnabled = value;
						await this.gbPlugin.saveSettings();
					})
			);

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
