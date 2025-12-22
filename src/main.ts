import { Notice, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	GymBuddySettings,
	GymBuddySettingTab,
} from "./settings";
import { ActiveWorkoutView } from "./features/workout";
import { VIEW_TYPE_WORKOUT } from "./constants";
import { Storage } from "./data";
import { ActiveWorkout, TrainingSplit } from "./types";
import {
	SplitPickerModal,
	getTodaysSplit,
	BUILT_IN_TEMPLATES,
} from "./features/splits";
import { TrainingSetupModal } from "./features/setup";

export default class GymBuddyPlugin extends Plugin {
	settings: GymBuddySettings;
	storage: Storage;
	activeWorkout: ActiveWorkout | null = null;
	settingTab: GymBuddySettingTab | null = null;

	async onload() {
		await this.loadSettings();
		this.storage = new Storage(this);

		// Register sidebar view for active workout
		this.registerView(
			VIEW_TYPE_WORKOUT,
			(leaf) => new ActiveWorkoutView(leaf, this)
		);

		// Commands
		this.addCommand({
			id: "start-workout",
			name: "Start workout",
			callback: () => {
				void this.startWorkout();
			},
		});

		this.addCommand({
			id: "quick-log",
			name: "Quick log set",
			callback: () => {
				// TODO: Open quick log modal
				new Notice("Quick log feature coming soon");
			},
		});

		this.addCommand({
			id: "view-progress",
			name: "View progress",
			callback: () => {
				// TODO: Open progress view
				new Notice("Progress view coming soon");
			},
		});

		this.addCommand({
			id: "add-exercise",
			name: "Add custom exercise",
			callback: () => {
				// TODO: Open custom exercise modal
				new Notice("Custom exercise feature coming soon");
			},
		});

		this.addCommand({
			id: "configure-training",
			name: "Configure training",
			callback: () => {
				this.openTrainingSetup();
			},
		});

		// Ribbon icon (dumbbell)
		this.addRibbonIcon("dumbbell", "Start workout", () => {
			void this.startWorkout();
		});

		// Settings tab
		this.settingTab = new GymBuddySettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
	}

	onunload() {
		// Cleanup: All registered views, commands, and events are automatically cleaned up
		// by Obsidian's plugin system
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<GymBuddySettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Open the training setup wizard
	 */
	openTrainingSetup(): void {
		const modal = new TrainingSetupModal(this, (result) => {
			new Notice(
				`Training configured: ${this.getTemplateName(
					result.templateId
				)}`
			);
		});
		modal.open();
	}

	/**
	 * Get template name by ID
	 */
	private getTemplateName(templateId: string): string {
		const allTemplates = [
			...BUILT_IN_TEMPLATES,
			...this.settings.customSplitTemplates,
		];
		return (
			allTemplates.find((t) => t.id === templateId)?.name || templateId
		);
	}

	/**
	 * Get the active template (built-in or custom)
	 */
	private getActiveTemplate() {
		const templateId = this.settings.activeSplitTemplateId;
		return (
			this.settings.customSplitTemplates.find(
				(t) => t.id === templateId
			) || BUILT_IN_TEMPLATES.find((t) => t.id === templateId)
		);
	}

	async startWorkout() {
		// Check if we should prompt for split selection
		let selectedSplit: TrainingSplit | null = null;
		const template = this.getActiveTemplate();

		if (this.settings.promptForSplitOnStart) {
			// User wants to be prompted - show split picker
			if (template && template.splits.length > 1) {
				// Show split picker modal
				await new Promise<void>((resolve) => {
					const modal = new SplitPickerModal(this, (split) => {
						selectedSplit = split;
						resolve();
					});
					modal.open();
				});
			} else if (template && template.splits.length === 1) {
				// Only one split, use it automatically
				selectedSplit = template.splits[0] || null;
			}
		} else {
			// Auto-detect today's split from weekly schedule
			if (template) {
				const todaysSplit = getTodaysSplit(
					this.settings.weeklySchedule,
					template
				);
				if (todaysSplit) {
					selectedSplit = todaysSplit;
					new Notice(`Starting ${todaysSplit.name} workout`);
				} else if (template.splits.length === 1) {
					// No schedule but only one split - use it
					selectedSplit = template.splits[0] || null;
				}
				// If no schedule and multiple splits, start without a split selection
			}
		}

		// Create new active workout
		this.activeWorkout = {
			startTime: new Date(),
			exercises: [],
			splitId: selectedSplit?.id,
		};

		// Open workout view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKOUT);
		if (leaves.length === 0) {
			const rightLeaf = this.app.workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_WORKOUT,
					active: true,
				});
			}
		} else {
			const leaf = leaves[0];
			if (leaf) {
				await this.app.workspace.revealLeaf(leaf);
			}
		}

		// Update view with active workout
		const leaves2 = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKOUT);
		const leaf2 = leaves2[0];
		if (leaf2 && leaf2.view instanceof ActiveWorkoutView) {
			const view = leaf2.view;
			view.setActiveWorkout(this.activeWorkout);
		}
	}
}
