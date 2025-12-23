import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_WORKOUT } from "../../constants";
import { WorkoutExercise, Exercise, ActiveWorkout } from "../../types";
import { ExercisePickerModal } from "../exercises/ExercisePickerModal";
import GymBuddyPlugin from "../../main";

/**
 * Sidebar view for active workout logging
 */
export class ActiveWorkoutView extends ItemView {
	private activeWorkout: ActiveWorkout | null = null;
	private exercises: Exercise[] = [];
	private plugin: GymBuddyPlugin;

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
		const container = this.containerEl.children[1];
		if (!container) {
			return;
		}
		container.empty();

		// Create Svelte component for the workout view
		// For now, we'll create a simple HTML structure
		// Full Svelte integration will be added in next phase
		const content = container.createDiv("gym-buddy-workout-view");
		content.createEl("h2", { text: "Active workout" });

		const addExerciseBtn = content.createEl("button", {
			text: "Add exercise",
			cls: "gb-btn gb-btn--primary gb-btn--lg gb-btn--full-width",
		});

		addExerciseBtn.addEventListener("click", () => {
			try {
				this.showExercisePicker();
			} catch (error) {
				console.error("Error showing exercise picker:", error);
			}
		});

		if (this.activeWorkout && this.activeWorkout.exercises.length > 0) {
			const exercisesContainer = content.createDiv("gym-buddy-exercises");
			for (const exercise of this.activeWorkout.exercises) {
				this.renderExercise(exercisesContainer, exercise);
			}
		}
	}

	async onClose() {
		// Cleanup - Obsidian handles view cleanup automatically
	}

	setExercises(exercises: Exercise[]) {
		this.exercises = exercises;
	}

	setActiveWorkout(workout: ActiveWorkout | null) {
		this.activeWorkout = workout;
		void this.onOpen(); // Re-render
	}

	private showExercisePicker() {
		if (!this.plugin) {
			return;
		}

		const modal = new ExercisePickerModal(this.plugin, (exercise) => {
			this.addExerciseToWorkout(exercise);
		});
		modal.open();
	}

	private addExerciseToWorkout(exercise: Exercise) {
		if (!this.activeWorkout) {
			this.activeWorkout = {
				startTime: new Date(),
				exercises: [],
			};
			if (this.plugin) {
				this.plugin.activeWorkout = this.activeWorkout;
			}
		}

		const workoutExercise: WorkoutExercise = {
			name: exercise.name,
			exerciseId: exercise.id,
			sets: [],
		};

		this.activeWorkout.exercises.push(workoutExercise);
		if (this.plugin) {
			this.plugin.activeWorkout = this.activeWorkout;
		}

		// Re-render the view
		void this.onOpen();
	}

	private renderExercise(container: HTMLElement, exercise: WorkoutExercise) {
		if (!container) return;
		const exerciseEl = container.createDiv("gym-buddy-exercise");
		exerciseEl.createEl("h3", { text: exercise.name });

		const setsContainer = exerciseEl.createDiv("gym-buddy-sets");
		for (const set of exercise.sets) {
			const setEl = setsContainer.createDiv("gym-buddy-set");
			setEl.createSpan({ text: `Set ${set.setNumber}: ` });
			if (set.weight) setEl.createSpan({ text: `${set.weight} lbs × ` });
			if (set.reps) setEl.createSpan({ text: `${set.reps} reps` });
			if (set.rpe) setEl.createSpan({ text: ` @ RPE ${set.rpe}` });
		}
	}
}
