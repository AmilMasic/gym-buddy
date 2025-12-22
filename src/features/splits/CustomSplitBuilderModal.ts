import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import CustomSplitBuilderModalComponent from "./CustomSplitBuilderModal.svelte";
import { SplitTemplate } from "../../types";
import { BUILT_IN_TEMPLATES } from "./splitTemplates";
import GymBuddyPlugin from "../../main";

interface BuilderResult {
	template: SplitTemplate;
	saveAsTemplate: boolean;
}

export class CustomSplitBuilderModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private onComplete: ((result: BuilderResult) => void) | null = null;
	private onCancel: (() => void) | null = null;
	private confirmHandler: ((event: CustomEvent) => void) | null = null;
	private cancelHandler: (() => void) | null = null;

	constructor(
		plugin: GymBuddyPlugin,
		onComplete?: (result: BuilderResult) => void,
		onCancel?: () => void
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onComplete = onComplete || null;
		this.onCancel = onCancel || null;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gym-buddy-modal");

		// Mount Svelte component
		this.component = mount(CustomSplitBuilderModalComponent, {
			target: contentEl,
			props: {
				builtInTemplates: BUILT_IN_TEMPLATES,
				customTemplates: this.plugin.settings.customSplitTemplates,
			},
		});

		// Listen for selection confirmation
		this.confirmHandler = (event: CustomEvent) => {
			const { template, saveAsTemplate } = event.detail as BuilderResult;

			// If user wants to save as template, add it to custom templates
			if (saveAsTemplate) {
				this.plugin.settings.customSplitTemplates.push(template);
				// Fire and forget - saveSettings is async but we don't need to await it
				void this.plugin.saveSettings();
			}

			// Call completion callback if provided
			if (this.onComplete) {
				this.onComplete({ template, saveAsTemplate });
			}

			this.close();
		};

		// Listen for cancellation
		this.cancelHandler = () => {
			if (this.onCancel) {
				this.onCancel();
			}
			this.close();
		};

		document.addEventListener(
			"custom-splits-selected",
			this.confirmHandler as EventListener
		);
		document.addEventListener(
			"custom-splits-cancelled",
			this.cancelHandler
		);
	}

	onClose() {
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}

		if (this.confirmHandler) {
			document.removeEventListener(
				"custom-splits-selected",
				this.confirmHandler as EventListener
			);
			this.confirmHandler = null;
		}

		if (this.cancelHandler) {
			document.removeEventListener(
				"custom-splits-cancelled",
				this.cancelHandler
			);
			this.cancelHandler = null;
		}
	}
}
