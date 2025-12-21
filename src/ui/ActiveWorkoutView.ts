import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_WORKOUT } from "../constants";
import { WorkoutExercise, Exercise, ActiveWorkout } from "../types";
import { ExercisePickerModal } from "./ExercisePickerModal";
import GymBuddyPlugin from "../main";

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
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:28",
					message: "onOpen called",
					data: { hasContainer: !!this.containerEl.children[1] },
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "run1",
					hypothesisId: "A",
				}),
			}
		).catch(() => {});
		// #endregion
		const container = this.containerEl.children[1];
		if (!container) {
			// #region agent log
			fetch(
				"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						location: "ActiveWorkoutView.ts:30",
						message: "onOpen early return - no container",
						data: {},
						timestamp: Date.now(),
						sessionId: "debug-session",
						runId: "run1",
						hypothesisId: "A",
					}),
				}
			).catch(() => {});
			// #endregion
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
			cls: "gym-buddy-add-exercise-btn",
		});

		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:42",
					message: "Button created",
					data: {
						buttonExists: !!addExerciseBtn,
						buttonText: addExerciseBtn.textContent,
						isConnected: addExerciseBtn.isConnected,
					},
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "run1",
					hypothesisId: "B",
				}),
			}
		).catch(() => {});
		// #endregion

		addExerciseBtn.addEventListener("click", () => {
			console.log("Add exercise button clicked");
			// #region agent log
			fetch(
				"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						location: "ActiveWorkoutView.ts:56",
						message: "Click event fired",
						data: {},
						timestamp: Date.now(),
						sessionId: "debug-session",
						runId: "post-fix",
						hypothesisId: "C",
					}),
				}
			).catch(() => {});
			// #endregion
			try {
				this.showExercisePicker();
			} catch (error) {
				console.error("Error showing exercise picker:", error);
				// #region agent log
				fetch(
					"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							location: "ActiveWorkoutView.ts:62",
							message: "Error in click handler",
							data: { error: String(error) },
							timestamp: Date.now(),
							sessionId: "debug-session",
							runId: "post-fix",
							hypothesisId: "D",
						}),
					}
				).catch(() => {});
				// #endregion
			}
		});

		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:52",
					message: "Event listener attached",
					data: { hasListener: true },
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "run1",
					hypothesisId: "B",
				}),
			}
		).catch(() => {});
		// #endregion

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
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:94",
					message: "showExercisePicker called",
					data: { hasPlugin: !!this.plugin },
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "post-fix",
					hypothesisId: "C",
				}),
			}
		).catch(() => {});
		// #endregion
		if (!this.plugin) {
			// #region agent log
			fetch(
				"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						location: "ActiveWorkoutView.ts:97",
						message: "showExercisePicker - no plugin instance",
						data: {},
						timestamp: Date.now(),
						sessionId: "debug-session",
						runId: "post-fix",
						hypothesisId: "C",
					}),
				}
			).catch(() => {});
			// #endregion
			return;
		}

		const modal = new ExercisePickerModal(this.plugin, (exercise) => {
			// #region agent log
			fetch(
				"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						location: "ActiveWorkoutView.ts:102",
						message: "Exercise selected",
						data: {
							exerciseName: exercise.name,
							exerciseId: exercise.id,
						},
						timestamp: Date.now(),
						sessionId: "debug-session",
						runId: "post-fix",
						hypothesisId: "C",
					}),
				}
			).catch(() => {});
			// #endregion
			this.addExerciseToWorkout(exercise);
		});
		modal.open();
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:107",
					message: "Modal opened",
					data: {},
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "post-fix",
					hypothesisId: "C",
				}),
			}
		).catch(() => {});
		// #endregion
	}

	private addExerciseToWorkout(exercise: Exercise) {
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:111",
					message: "addExerciseToWorkout called",
					data: {
						exerciseName: exercise.name,
						hasActiveWorkout: !!this.activeWorkout,
					},
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "post-fix",
					hypothesisId: "C",
				}),
			}
		).catch(() => {});
		// #endregion
		if (!this.activeWorkout) {
			// #region agent log
			fetch(
				"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						location: "ActiveWorkoutView.ts:114",
						message: "No active workout - creating one",
						data: {},
						timestamp: Date.now(),
						sessionId: "debug-session",
						runId: "post-fix",
						hypothesisId: "C",
					}),
				}
			).catch(() => {});
			// #endregion
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
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ActiveWorkoutView.ts:131",
					message: "Exercise added to workout",
					data: {
						exerciseName: exercise.name,
						totalExercises: this.activeWorkout.exercises.length,
					},
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "post-fix",
					hypothesisId: "C",
				}),
			}
		).catch(() => {});
		// #endregion
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
