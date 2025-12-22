import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import ExercisePickerModalComponent from "./ExercisePickerModal.svelte";
import { Exercise, TrainingSplit } from "../types";
import GymBuddyPlugin from "../main";
import {
	getMuscleGroupsForSplit,
	BUILT_IN_TEMPLATES,
} from "../data/splitTemplates";

export class ExercisePickerModal extends Modal {
	private component: any = null;
	private plugin: GymBuddyPlugin;
	private onSelect: (exercise: Exercise) => void;
	private selectHandler: ((event: CustomEvent) => void) | null = null;
	private collapseHandler: ((event: CustomEvent) => void) | null = null;
	private muscleSelectionHandler: ((event: CustomEvent) => void) | null =
		null;
	private splitChangeHandler: ((event: CustomEvent) => void) | null = null;

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
		contentEl.addClass("gym-buddy-modal");

		// Load exercises from storage
		const exercises = await this.plugin.storage.loadExerciseLibrary();
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ExercisePickerModal.ts:25",
					message: "Exercises loaded",
					data: {
						exerciseCount: exercises.length,
						exerciseNames: exercises.slice(0, 5).map((e) => e.name),
					},
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "search-debug",
					hypothesisId: "C",
				}),
			}
		).catch(() => {});
		// #endregion
		console.log(
			"ExercisePickerModal: Loaded exercises",
			exercises.length,
			exercises
		);

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
					const ex = exercises.find(
						(e) => e.id === workoutEx.exerciseId
					);
					if (ex) {
						recentExercises.push(ex);
						recentIds.add(workoutEx.exerciseId);
					}
				}
			}
		}

		// Get active template and splits (always available)
		const templateId = this.plugin.settings.activeSplitTemplateId;
		const template =
			this.plugin.settings.customSplitTemplates.find(
				(t) => t.id === templateId
			) || BUILT_IN_TEMPLATES.find((t) => t.id === templateId);

		let currentSplit: TrainingSplit | null = null;
		let favoriteExercises: Exercise[] = [];
		let favoriteIds = new Set<string>();
		let showSplitFilter = false;
		let templateName = "";
		let availableSplits: TrainingSplit[] = [];

		if (template) {
			templateName = template.name;
			availableSplits = template.splits;

			// Get current split from active workout if exists
			if (this.plugin.activeWorkout?.splitId) {
				currentSplit =
					template.splits.find(
						(s) => s.id === this.plugin.activeWorkout?.splitId
					) || null;

				// Load favorites for this split
				if (currentSplit) {
					favoriteExercises =
						await this.plugin.storage.getFavoriteExercises(
							currentSplit.id
						);
					favoriteIds = new Set(favoriteExercises.map((e) => e.id));
				}

				// Show split filter if enabled in settings
				showSplitFilter = this.plugin.settings.showSplitFilterInPicker;
			}
		}

		// Get collapse state from settings (use current state, fallback to defaults)
		const recentExpanded =
			this.plugin.settings.recentExercisesExpanded ??
			this.plugin.settings.defaultRecentExercisesExpanded;
		const muscleGroupsExpanded =
			this.plugin.settings.muscleGroupsExpanded ??
			this.plugin.settings.defaultMuscleGroupsExpanded;

		// Get persisted muscle group selections
		const selectedMuscles = this.plugin.settings.selectedMuscleGroups || [];

		// Mount Svelte component
		this.component = mount(ExercisePickerModalComponent, {
			target: contentEl,
			props: {
				exercises,
				recentExercises,
				favoriteExercises,
				favoriteIds,
				currentSplit,
				templateName,
				availableSplits,
				showSplitFilter,
				selectedMuscles,
				recentExpanded,
				muscleGroupsExpanded,
			},
		});
		// #region agent log
		fetch(
			"http://127.0.0.1:7242/ingest/344acf04-5640-444a-9df3-a382b3708a2b",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: "ExercisePickerModal.ts:50",
					message: "Svelte component mounted",
					data: {
						hasComponent: !!this.component,
						exerciseCount: exercises.length,
					},
					timestamp: Date.now(),
					sessionId: "debug-session",
					runId: "search-debug",
					hypothesisId: "E",
				}),
			}
		).catch(() => {});
		// #endregion
		console.log("ExercisePickerModal: Component mounted", this.component);

		// Listen for exercise selection
		const handleSelect = (event: CustomEvent) => {
			const exercise = event.detail.exercise as Exercise;
			this.onSelect(exercise);
			this.close();
		};

		this.selectHandler = handleSelect;
		document.addEventListener(
			"select-exercise",
			handleSelect as EventListener
		);

		// Listen for favorite toggle
		const handleToggleFavorite = async (event: CustomEvent) => {
			const { exerciseId } = event.detail;
			if (currentSplit) {
				const isFavorite = await this.plugin.storage.toggleFavorite(
					currentSplit.id,
					exerciseId
				);
				// Update component props
				if (this.component) {
					if (isFavorite) {
						favoriteIds.add(exerciseId);
						const ex = exercises.find((e) => e.id === exerciseId);
						if (ex) {
							favoriteExercises.push(ex);
						}
					} else {
						favoriteIds.delete(exerciseId);
						favoriteExercises = favoriteExercises.filter(
							(e) => e.id !== exerciseId
						);
					}
					this.component.$set({
						favoriteIds,
						favoriteExercises,
					});
				}
			}
		};

		document.addEventListener(
			"toggle-favorite",
			handleToggleFavorite as EventListener
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

		// Listen for split selection changes
		this.splitChangeHandler = (event: CustomEvent) => {
			const { split } = event.detail as { split: TrainingSplit };

			// Ensure active workout exists
			if (!this.plugin.activeWorkout) {
				this.plugin.activeWorkout = {
					startTime: new Date(),
					exercises: [],
					splitId: split.id,
				};
			} else {
				this.plugin.activeWorkout.splitId = split.id;
			}

			// Reload favorites for the new split (async, fire and forget)
			void this.plugin.storage
				.getFavoriteExercises(split.id)
				.then((newFavorites) => {
					const newFavoriteIds = new Set(
						newFavorites.map((e) => e.id)
					);

					// Update component with new split and favorites
					if (this.component) {
						this.component.$set({
							currentSplit: split,
							favoriteExercises: newFavorites,
							favoriteIds: newFavoriteIds,
						});
					}
				});
		};

		document.addEventListener(
			"split-change",
			this.splitChangeHandler as EventListener
		);
	}

	onClose() {
		if (this.component) {
			unmount(this.component);
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
		if (this.splitChangeHandler) {
			document.removeEventListener(
				"split-change",
				this.splitChangeHandler as EventListener
			);
			this.splitChangeHandler = null;
		}
	}
}
