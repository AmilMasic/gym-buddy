import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import ExercisePickerModalComponent from "./ExercisePickerModal.svelte";
import { Exercise, TrainingSplit } from "../../types";
import GymBuddyPlugin from "../../main";
import { BUILT_IN_TEMPLATES } from "../splits/splitTemplates";

export class ExercisePickerModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private onSelect: (exercise: Exercise) => void;
	private selectHandler: ((event: CustomEvent) => void) | null = null;
	private toggleFavoriteHandler: ((event: CustomEvent) => void) | null = null;
	private collapseHandler: ((event: CustomEvent) => void) | null = null;
	private muscleSelectionHandler: ((event: CustomEvent) => void) | null =
		null;

	// Store current state for remounting
	private exercises: Exercise[] = [];
	private favoriteExercises: Exercise[] = [];
	private favoriteIds: Set<string> = new Set();
	private currentSplit: TrainingSplit | null = null;

	constructor(
		plugin: GymBuddyPlugin,
		onSelect: (exercise: Exercise) => void
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSelect = onSelect;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gb-modal");

		// Load exercises from storage
		this.exercises = await this.plugin.storage.loadExerciseLibrary();

		// Get recent exercises (last 5 unique exercises from active workout)
		const recentExercises: Exercise[] = [];
		if (this.plugin.activeWorkout) {
			const recentIds = new Set<string>();
			for (const workoutEx of this.plugin.activeWorkout.exercises
				.slice(-5)
				.reverse()) {
				if (
					workoutEx.exerciseId &&
					!recentIds.has(workoutEx.exerciseId)
				) {
					const ex = this.exercises.find(
						(e) => e.id === workoutEx.exerciseId
					);
					if (ex) {
						recentExercises.push(ex);
						recentIds.add(workoutEx.exerciseId);
					}
				}
			}
		}

		// Get current split from active workout
		const templateId = this.plugin.settings.activeSplitTemplateId;
		const template =
			this.plugin.settings.customSplitTemplates.find(
				(t) => t.id === templateId
			) || BUILT_IN_TEMPLATES.find((t) => t.id === templateId);

		if (template && this.plugin.activeWorkout?.splitId) {
			this.currentSplit =
				template.splits.find(
					(s) => s.id === this.plugin.activeWorkout?.splitId
				) || null;
		}

		// Load favorites - use current split or a global fallback
		const splitIdForFavorites = this.currentSplit?.id || "global";
		this.favoriteExercises = await this.plugin.storage.getFavoriteExercises(
			splitIdForFavorites
		);
		this.favoriteIds = new Set(this.favoriteExercises.map((e) => e.id));

		// Get collapse state from settings
		const recentExpanded =
			this.plugin.settings.recentExercisesExpanded ??
			this.plugin.settings.defaultRecentExercisesExpanded;
		const muscleGroupsExpanded =
			this.plugin.settings.muscleGroupsExpanded ??
			this.plugin.settings.defaultMuscleGroupsExpanded;

		// Auto-select muscle groups based on current split
		let selectedMuscles: string[] = [];

		if (this.currentSplit && this.currentSplit.muscleGroups.length > 0) {
			// Check if this is a "full body" split (has all major muscle groups)
			const allMajorMuscles = [
				"Chest",
				"Back",
				"Shoulders",
				"Biceps",
				"Triceps",
				"Quadriceps",
				"Hamstrings",
				"Glutes",
				"Calves",
				"Abs",
			];
			const splitMuscles = this.currentSplit.muscleGroups;
			const isFullBody = allMajorMuscles.every((m) =>
				splitMuscles.includes(m)
			);

			// Only auto-select if NOT full body
			if (!isFullBody) {
				selectedMuscles = [...this.currentSplit.muscleGroups];
			}
		} else {
			// Fall back to persisted selections if no split
			selectedMuscles = this.plugin.settings.selectedMuscleGroups || [];
		}

		// Mount Svelte component
		this.mountComponent({
			exercises: this.exercises,
			recentExercises,
			favoriteExercises: this.favoriteExercises,
			favoriteIds: this.favoriteIds,
			currentSplit: this.currentSplit,
			selectedMuscles,
			recentExpanded,
			muscleGroupsExpanded,
		});

		// Set up event listeners
		this.setupEventListeners();
	}

	private mountComponent(props: {
		exercises: Exercise[];
		recentExercises: Exercise[];
		favoriteExercises: Exercise[];
		favoriteIds: Set<string>;
		currentSplit: TrainingSplit | null;
		selectedMuscles: string[];
		recentExpanded: boolean;
		muscleGroupsExpanded: boolean;
	}) {
		const { contentEl } = this;

		// Unmount existing component if any
		if (this.component) {
			void unmount(this.component);
		}

		// Clear and remount
		contentEl.empty();
		contentEl.addClass("gb-modal");

		this.component = mount(ExercisePickerModalComponent, {
			target: contentEl,
			props,
		});
	}

	private setupEventListeners() {
		// Listen for exercise selection
		this.selectHandler = (event: CustomEvent) => {
			const exercise = (event.detail as { exercise: Exercise }).exercise;
			this.onSelect(exercise);
			this.close();
		};
		document.addEventListener(
			"select-exercise",
			this.selectHandler as EventListener
		);

		// Listen for favorite toggle - remount component to update UI
		this.toggleFavoriteHandler = (event: CustomEvent) => {
			void (async () => {
				const { exerciseId } = event.detail as { exerciseId: string };
				const splitIdForFavorites = this.currentSplit?.id || "global";

				const isFavorite = await this.plugin.storage.toggleFavorite(
					splitIdForFavorites,
					exerciseId
				);

				// Update local state
				if (isFavorite) {
					this.favoriteIds.add(exerciseId);
					const ex = this.exercises.find((e) => e.id === exerciseId);
					if (ex) {
						this.favoriteExercises.push(ex);
					}
				} else {
					this.favoriteIds.delete(exerciseId);
					this.favoriteExercises = this.favoriteExercises.filter(
						(e) => e.id !== exerciseId
					);
				}

				// Get current state for remount
				const recentExercises: Exercise[] = [];
				if (this.plugin.activeWorkout) {
					const recentIds = new Set<string>();
					for (const workoutEx of this.plugin.activeWorkout.exercises
						.slice(-5)
						.reverse()) {
						if (
							workoutEx.exerciseId &&
							!recentIds.has(workoutEx.exerciseId)
						) {
							const ex = this.exercises.find(
								(e) => e.id === workoutEx.exerciseId
							);
							if (ex) {
								recentExercises.push(ex);
								recentIds.add(workoutEx.exerciseId);
							}
						}
					}
				}

				// Determine selected muscles (auto-select based on split if applicable)
				let selectedMuscles: string[] = [];
				if (
					this.currentSplit &&
					this.currentSplit.muscleGroups.length > 0
				) {
					const allMajorMuscles = [
						"Chest",
						"Back",
						"Shoulders",
						"Biceps",
						"Triceps",
						"Quadriceps",
						"Hamstrings",
						"Glutes",
						"Calves",
						"Abs",
					];
					const splitMuscles = this.currentSplit.muscleGroups;
					const isFullBody = allMajorMuscles.every((m) =>
						splitMuscles.includes(m)
					);
					if (!isFullBody) {
						selectedMuscles = [...this.currentSplit.muscleGroups];
					}
				} else {
					selectedMuscles =
						this.plugin.settings.selectedMuscleGroups || [];
				}

				// Remount with updated favorites
				this.mountComponent({
					exercises: this.exercises,
					recentExercises,
					favoriteExercises: this.favoriteExercises,
					favoriteIds: new Set(this.favoriteIds),
					currentSplit: this.currentSplit,
					selectedMuscles,
					recentExpanded:
						this.plugin.settings.recentExercisesExpanded ?? true,
					muscleGroupsExpanded:
						this.plugin.settings.muscleGroupsExpanded ?? true,
				});
			})();
		};
		document.addEventListener(
			"toggle-favorite",
			this.toggleFavoriteHandler as EventListener
		);

		// Listen for collapse state changes
		this.collapseHandler = (event: CustomEvent) => {
			const { section, expanded } = event.detail as {
				section: string;
				expanded: boolean;
			};
			if (section === "recent") {
				this.plugin.settings.recentExercisesExpanded = expanded;
			} else if (section === "muscleGroups") {
				this.plugin.settings.muscleGroupsExpanded = expanded;
			}
			void this.plugin.saveSettings();
		};
		document.addEventListener(
			"collapse-change",
			this.collapseHandler as EventListener
		);

		// Listen for muscle group selection changes
		this.muscleSelectionHandler = (event: CustomEvent) => {
			const { selectedMuscles } = event.detail as {
				selectedMuscles: string[];
			};
			this.plugin.settings.selectedMuscleGroups = selectedMuscles;
			void this.plugin.saveSettings();
		};
		document.addEventListener(
			"muscle-selection-change",
			this.muscleSelectionHandler as EventListener
		);
	}

	onClose() {
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}

		// Clean up event listeners
		if (this.selectHandler) {
			document.removeEventListener(
				"select-exercise",
				this.selectHandler as EventListener
			);
			this.selectHandler = null;
		}
		if (this.toggleFavoriteHandler) {
			document.removeEventListener(
				"toggle-favorite",
				this.toggleFavoriteHandler as EventListener
			);
			this.toggleFavoriteHandler = null;
		}
		if (this.collapseHandler) {
			document.removeEventListener(
				"collapse-change",
				this.collapseHandler as EventListener
			);
			this.collapseHandler = null;
		}
		if (this.muscleSelectionHandler) {
			document.removeEventListener(
				"muscle-selection-change",
				this.muscleSelectionHandler as EventListener
			);
			this.muscleSelectionHandler = null;
		}
	}
}
