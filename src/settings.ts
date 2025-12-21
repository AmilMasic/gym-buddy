import { App, PluginSettingTab, Setting } from "obsidian";
import GymBuddyPlugin from "./main";
import { WeightUnit } from "./types";

export interface GymBuddySettings {
	workoutFolder: string; // Default: "Workouts"
	defaultUnit: WeightUnit;
	showRPE: boolean;
	restTimerEnabled: boolean;
	restTimerDuration: number; // seconds (default: 90)
	dailyNoteIntegration: boolean; // embed in daily note
	dailyNoteHeading: string; // "## Workout"
}

export const DEFAULT_SETTINGS: GymBuddySettings = {
	workoutFolder: "Workouts",
	defaultUnit: "lbs",
	showRPE: true,
	restTimerEnabled: true,
	restTimerDuration: 90,
	dailyNoteIntegration: false,
	dailyNoteHeading: "## Workout",
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
	}
}
