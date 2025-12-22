import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import SplitPickerModalComponent from "./SplitPickerModal.svelte";
import { TrainingSplit, SplitTemplate } from "../types";
import GymBuddyPlugin from "../main";
import {
	getSplitTemplate,
	getTodaysSplit,
	getTodayDayOfWeek,
	BUILT_IN_TEMPLATES,
} from "../data/splitTemplates";

export class SplitPickerModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private onSelect: (split: TrainingSplit) => void;
	private selectHandler: ((event: CustomEvent) => void) | null = null;

	constructor(
		plugin: GymBuddyPlugin,
		onSelect: (split: TrainingSplit) => void
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSelect = onSelect;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gym-buddy-modal");

		// Get active template (built-in or custom)
		const templateId = this.plugin.settings.activeSplitTemplateId;
		const template =
			this.plugin.settings.customSplitTemplates.find(
				(t) => t.id === templateId
			) || BUILT_IN_TEMPLATES.find((t) => t.id === templateId);

		if (!template) {
			contentEl.createEl("p", {
				text: "No split template selected. Please configure a template in settings.",
			});
			return;
		}

		// Check for today's scheduled split
		const suggestedSplit = getTodaysSplit(
			this.plugin.settings.weeklySchedule,
			template
		);

		// Get today's day name for display
		const today = getTodayDayOfWeek();
		const todayName =
			today.charAt(0).toUpperCase() + today.slice(1) + "'s Workout";

		// Mount Svelte component
		this.component = mount(SplitPickerModalComponent, {
			target: contentEl,
			props: {
				template,
				suggestedSplit,
				todayName,
			},
		});

		// Listen for split selection
		const handleSelect = (event: CustomEvent) => {
			const split = event.detail.split as TrainingSplit;
			this.onSelect(split);
			this.close();
		};

		this.selectHandler = handleSelect;
		document.addEventListener("select-split", handleSelect as EventListener);
	}

	onClose() {
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}
		// Clean up event listener
		if (this.selectHandler) {
			document.removeEventListener(
				"select-split",
				this.selectHandler as EventListener
			);
			this.selectHandler = null;
		}
	}
}
