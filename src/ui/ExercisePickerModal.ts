import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import ExercisePickerModalComponent from "./ExercisePickerModal.svelte";
import { Exercise } from "../types";
import GymBuddyPlugin from "../main";

export class ExercisePickerModal extends Modal {
	private component: any = null;
	private plugin: GymBuddyPlugin;
	private onSelect: (exercise: Exercise) => void;
	private selectHandler: ((event: CustomEvent) => void) | null = null;

	constructor(plugin: GymBuddyPlugin, onSelect: (exercise: Exercise) => void) {
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

		// Get recent exercises (last 5 unique exercises from active workout)
		const recentExercises: Exercise[] = [];
		if (this.plugin.activeWorkout) {
			const recentIds = new Set<string>();
			for (const workoutEx of this.plugin.activeWorkout.exercises.slice(-5).reverse()) {
				if (workoutEx.exerciseId && !recentIds.has(workoutEx.exerciseId)) {
					const ex = exercises.find((e) => e.id === workoutEx.exerciseId);
					if (ex) {
						recentExercises.push(ex);
						recentIds.add(workoutEx.exerciseId);
					}
				}
			}
		}

		// Mount Svelte component
		this.component = mount(ExercisePickerModalComponent, {
			target: contentEl,
			props: {
				exercises,
				recentExercises,
				selectedMuscles: [],
			},
		});

		// Listen for exercise selection
		const handleSelect = (event: CustomEvent) => {
			const exercise = event.detail.exercise as Exercise;
			this.onSelect(exercise);
			this.close();
		};

		this.selectHandler = handleSelect;
		document.addEventListener("select-exercise", handleSelect as EventListener);
	}

	onClose() {
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}
		// Clean up event listener
		if (this.selectHandler) {
			document.removeEventListener("select-exercise", this.selectHandler as EventListener);
			this.selectHandler = null;
		}
	}
}

