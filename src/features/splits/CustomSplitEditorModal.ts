import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import CustomSplitEditorModalComponent from "./CustomSplitEditorModal.svelte";
import { SplitTemplate } from "../../types";
import GymBuddyPlugin from "../../main";
import { BUILT_IN_TEMPLATES } from "./splitTemplates";

export class CustomSplitEditorModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private onSave: (template: SplitTemplate) => void;
	private saveHandler: ((event: CustomEvent) => void) | null = null;
	private onDelete: (templateId: string) => void;
	private deleteHandler: ((event: CustomEvent) => void) | null = null;

	constructor(
		plugin: GymBuddyPlugin,
		onSave: (template: SplitTemplate) => void,
		onDelete: (templateId: string) => void
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSave = onSave;
		this.onDelete = onDelete;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gb-modal");

		// Mount Svelte component
		this.component = mount(CustomSplitEditorModalComponent, {
			target: contentEl,
			props: {
				customTemplates: this.plugin.settings.customSplitTemplates,
				builtInTemplates: BUILT_IN_TEMPLATES,
			},
		});

		// Listen for save event
		const handleSave = (event: CustomEvent) => {
			const template = (event.detail as { template: SplitTemplate })
				.template;
			this.onSave(template);
			this.close();
		};

		// Listen for delete event
		const handleDelete = (event: CustomEvent) => {
			const templateId = (event.detail as { templateId: string })
				.templateId;
			this.onDelete(templateId);
			// Don't close modal, allow editing another
		};

		this.saveHandler = handleSave;
		this.deleteHandler = handleDelete;
		document.addEventListener(
			"save-split-template",
			handleSave as EventListener
		);
		document.addEventListener(
			"delete-split-template",
			handleDelete as EventListener
		);
	}

	onClose() {
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}
		// Clean up event listeners
		if (this.saveHandler) {
			document.removeEventListener(
				"save-split-template",
				this.saveHandler as EventListener
			);
			this.saveHandler = null;
		}
		if (this.deleteHandler) {
			document.removeEventListener(
				"delete-split-template",
				this.deleteHandler as EventListener
			);
			this.deleteHandler = null;
		}
	}
}
