import { Notice, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	GymBuddySettings,
	GymBuddySettingTab,
} from "./settings";
import { ActiveWorkoutView } from "./ui/ActiveWorkoutView";
import { VIEW_TYPE_WORKOUT } from "./constants";
import { Storage } from "./data/storage";
import { ActiveWorkout } from "./types";

export default class GymBuddyPlugin extends Plugin {
	settings: GymBuddySettings;
	private storage: Storage;
	private activeWorkout: ActiveWorkout | null = null;

	async onload() {
		await this.loadSettings();
		this.storage = new Storage(this);

		// Register sidebar view for active workout
		this.registerView(
			VIEW_TYPE_WORKOUT,
			(leaf) => new ActiveWorkoutView(leaf)
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

		// Ribbon icon (dumbbell)
		this.addRibbonIcon("dumbbell", "Start workout", () => {
			void this.startWorkout();
		});

		// Settings tab
		this.addSettingTab(new GymBuddySettingTab(this.app, this));
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

	private async startWorkout() {
		// Create new active workout
		this.activeWorkout = {
			startTime: new Date(),
			exercises: [],
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
