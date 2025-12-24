import ActiveWorkoutViewComponent from "./ActiveWorkoutView.svelte";
import { activeWorkoutToWorkout } from "./workoutUtils";
import { ItemView, WorkspaceLeaf, Modal, Notice } from "obsidian";
import { mount, unmount } from "svelte";
import { VIEW_TYPE_WORKOUT } from "../../constants";
import {
	WorkoutExercise,
	Exercise,
	ActiveWorkout,
	WorkoutSet,
} from "../../types";
import { ExercisePickerModal } from "../exercises/ExercisePickerModal";
import { WorkoutParser } from "../../data/parser";
import { BUILT_IN_TEMPLATES } from "../splits/splitTemplates";
import GymBuddyPlugin from "../../main";

/**
 * Sidebar view for active workout logging
 */
export class ActiveWorkoutView extends ItemView {
	private component: ReturnType<typeof mount> | null = null;
	private exercises: Exercise[] = [];
	private plugin: GymBuddyPlugin;

	// Event handlers
	private openPickerHandler: (() => void) | null = null;
	private logSetHandler: ((e: Event) => void) | null = null;
	private removeExerciseHandler: ((e: Event) => void) | null = null;
	private finishHandler: (() => void) | null = null;
	private cancelHandler: (() => void) | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: GymBuddyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_WORKOUT;
	}

	getDisplayText(): string {
		return "Active workout";
	}

	getIcon(): string {
		return "dumbbell";
	}

	async onOpen() {
		await this.loadExercises();
		this.mountComponent();
		this.setupEventListeners();
	}

	async onClose() {
		this.cleanupEventListeners();
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}
	}

	private async loadExercises() {
		this.exercises = await this.plugin.storage.loadExerciseLibrary();
	}

	private getSplitName(): string {
		if (!this.plugin.activeWorkout?.splitId) return "";

		const templateId = this.plugin.settings.activeSplitTemplateId;
		const template =
			this.plugin.settings.customSplitTemplates.find(
				(t) => t.id === templateId
			) || BUILT_IN_TEMPLATES.find((t) => t.id === templateId);

		const split = template?.splits.find(
			(s) => s.id === this.plugin.activeWorkout?.splitId
		);
		return split?.name || "";
	}

	private mountComponent() {
		const container = this.containerEl.children[1];
		if (!container) return;

		container.empty();

		if (this.component) {
			void unmount(this.component);
		}

		if (!this.plugin.activeWorkout) {
			// Show empty state
			const emptyState = container.createDiv("gb-empty-state");
			emptyState.createEl("p", {
				text: "No active workout.",
			});
			emptyState.createEl("p", {
				text: "Start a new workout from the command palette or ribbon icon.",
				cls: "gb-text-muted",
			});
			return;
		}

		this.component = mount(ActiveWorkoutViewComponent, {
			target: container as HTMLElement,
			props: {
				activeWorkout: this.plugin.activeWorkout,
				exercises: this.exercises,
				showRPE: this.plugin.settings.showRPE,
				unit: this.plugin.settings.defaultUnit,
				splitName: this.getSplitName(),
			},
		});
	}

	private setupEventListeners() {
		this.openPickerHandler = () => this.showExercisePicker();
		this.logSetHandler = (e) => this.handleLogSet(e as CustomEvent);
		this.removeExerciseHandler = (e) =>
			this.handleRemoveExercise(e as CustomEvent);
		this.finishHandler = () => void this.finishWorkout();
		this.cancelHandler = () => this.cancelWorkout();

		document.addEventListener(
			"open-exercise-picker",
			this.openPickerHandler
		);
		document.addEventListener("exercise-log-set", this.logSetHandler);
		document.addEventListener(
			"remove-exercise",
			this.removeExerciseHandler
		);
		document.addEventListener("finish-workout", this.finishHandler);
		document.addEventListener("cancel-workout", this.cancelHandler);
	}

	private cleanupEventListeners() {
		if (this.openPickerHandler) {
			document.removeEventListener(
				"open-exercise-picker",
				this.openPickerHandler
			);
			this.openPickerHandler = null;
		}
		if (this.logSetHandler) {
			document.removeEventListener(
				"exercise-log-set",
				this.logSetHandler
			);
			this.logSetHandler = null;
		}
		if (this.removeExerciseHandler) {
			document.removeEventListener(
				"remove-exercise",
				this.removeExerciseHandler
			);
			this.removeExerciseHandler = null;
		}
		if (this.finishHandler) {
			document.removeEventListener("finish-workout", this.finishHandler);
			this.finishHandler = null;
		}
		if (this.cancelHandler) {
			document.removeEventListener("cancel-workout", this.cancelHandler);
			this.cancelHandler = null;
		}
	}

	private showExercisePicker() {
		const modal = new ExercisePickerModal(this.plugin, (exercise) => {
			this.addExerciseToWorkout(exercise);
		});
		modal.open();
	}

	private addExerciseToWorkout(exercise: Exercise) {
		if (!this.plugin.activeWorkout) {
			this.plugin.activeWorkout = {
				startTime: new Date(),
				exercises: [],
			};
		}

		const workoutExercise: WorkoutExercise = {
			name: exercise.name,
			exerciseId: exercise.id,
			sets: [],
		};

		this.plugin.activeWorkout.exercises.push(workoutExercise);
		this.mountComponent();
	}

	private handleLogSet(event: CustomEvent) {
		const { exerciseIndex, set } = event.detail as {
			exerciseIndex: number;
			set: WorkoutSet;
		};

		if (!this.plugin.activeWorkout) return;

		const exercise = this.plugin.activeWorkout.exercises[exerciseIndex];
		if (exercise) {
			exercise.sets.push(set);
			this.mountComponent();
		}
	}

	private handleRemoveExercise(event: CustomEvent) {
		const { index } = event.detail as { index: number };

		if (!this.plugin.activeWorkout) return;

		this.plugin.activeWorkout.exercises.splice(index, 1);
		this.mountComponent();
	}

	private async finishWorkout() {
		if (!this.plugin.activeWorkout) return;

		// Check if there are any logged sets
		const totalSets = this.plugin.activeWorkout.exercises.reduce(
			(sum, ex) => sum + ex.sets.length,
			0
		);

		if (totalSets === 0) {
			new Notice(
				"No sets logged. Add some exercises and log sets before finishing."
			);
			return;
		}

		// Convert to Workout
		const workout = activeWorkoutToWorkout(
			this.plugin.activeWorkout,
			this.exercises
		);

		// Generate markdown
		const markdown = WorkoutParser.workoutToMarkdown(workout);

		// Save to file
		try {
			const result = await this.plugin.storage.saveWorkout(
				workout,
				markdown
			);

			// Show appropriate notice based on result
			if (result.weeklyNoteError) {
				new Notice(
					"Workout saved, but weekly note update failed",
					5000
				);
			} else {
				new Notice(`Workout saved to ${result.file.path}`);
			}

			// Open the saved file
			await this.plugin.app.workspace.openLinkText(
				result.file.path,
				"",
				false
			);

			// Clear active workout
			this.plugin.activeWorkout = null;

			// Show empty state
			this.mountComponent();
		} catch (error) {
			console.error("Failed to save workout:", error);
			new Notice("Failed to save workout. Please try again.", 5000);
		}
	}

	private cancelWorkout() {
		// Show confirmation modal
		const modal = new Modal(this.plugin.app);
		modal.titleEl.setText("Cancel workout?");
		modal.contentEl.createEl("p", {
			text: "Are you sure you want to cancel this workout? All logged sets will be lost.",
		});

		const buttonContainer = modal.contentEl.createDiv({
			cls: "gb-modal-buttons",
		});

		const keepBtn = buttonContainer.createEl("button", {
			text: "Keep working out",
			cls: "mod-cta",
		});
		keepBtn.onclick = () => modal.close();

		const discardBtn = buttonContainer.createEl("button", {
			text: "Discard workout",
			cls: "mod-warning",
		});
		discardBtn.onclick = () => {
			this.plugin.activeWorkout = null;
			modal.close();
			this.mountComponent();
			new Notice("Workout cancelled");
		};

		modal.open();
	}

	setActiveWorkout(workout: ActiveWorkout | null) {
		this.mountComponent();
	}

	setExercises(exercises: Exercise[]) {
		this.exercises = exercises;
		this.mountComponent();
	}
}
