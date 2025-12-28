import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import CustomExerciseModalComponent from "./CustomExerciseModal.svelte";
import type { Exercise } from "../../types";
import GymBuddyPlugin from "../../main";

type SaveExerciseResult = {
	exercise: Exercise;
	isNew: boolean;
};

export class CustomExerciseModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private exerciseToEdit: Exercise | null;
	private onSave: ((result: SaveExerciseResult) => void) | null = null;
	private onCancel: (() => void) | null = null;
	private saveHandler: ((event: CustomEvent) => void) | null = null;
	private cancelHandler: (() => void) | null = null;

	constructor(
		plugin: GymBuddyPlugin,
		options?: {
			exercise?: Exercise;
			onSave?: (result: SaveExerciseResult) => void;
			onCancel?: () => void;
		}
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.exerciseToEdit = options?.exercise || null;
		this.onSave = options?.onSave || null;
		this.onCancel = options?.onCancel || null;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gb-modal");

		this.component = mount(CustomExerciseModalComponent, {
			target: contentEl,
			props: {
				exercise: this.exerciseToEdit,
				defaultUnit: this.plugin.settings.defaultUnit,
			},
		});

		this.saveHandler = (event: CustomEvent) => {
			void (async () => {
				const { exercise, isNew } = event.detail as SaveExerciseResult;
				try {
					await this.plugin.storage.saveCustomExercise(exercise);
					if (this.onSave) {
						this.onSave({ exercise, isNew });
					}
					this.close();
				} catch (error) {
					console.error("Failed to save custom exercise:", error);
				}
			})();
		};

		this.cancelHandler = () => {
			if (this.onCancel) {
				this.onCancel();
			}
			this.close();
		};

		document.addEventListener(
			"save-custom-exercise",
			this.saveHandler as EventListener
		);
		document.addEventListener("cancel-custom-exercise", this.cancelHandler);
	}

	onClose() {
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}

		if (this.saveHandler) {
			document.removeEventListener(
				"save-custom-exercise",
				this.saveHandler as EventListener
			);
			this.saveHandler = null;
		}

		if (this.cancelHandler) {
			document.removeEventListener(
				"cancel-custom-exercise",
				this.cancelHandler
			);
			this.cancelHandler = null;
		}
	}
}
