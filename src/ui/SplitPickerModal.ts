import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import SplitPickerModalComponent from "./SplitPickerModal.svelte";
import { TrainingSplit } from "../types";
import GymBuddyPlugin from "../main";
import { getSplitTemplate } from "../data/splitTemplates";

export class SplitPickerModal extends Modal {
	private component: any = null;
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

		// Get active template
		const templateId = this.plugin.settings.activeSplitTemplateId;
		const template = getSplitTemplate(templateId);
		
		if (!template) {
			contentEl.createEl("p", {
				text: "No split template selected. Please configure a template in settings.",
			});
			return;
		}

		// Mount Svelte component
		this.component = mount(SplitPickerModalComponent, {
			target: contentEl,
			props: {
				template,
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

