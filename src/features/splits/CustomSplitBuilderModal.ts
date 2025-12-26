import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import CustomSplitBuilderModalComponent from "./CustomSplitBuilderModal.svelte";
import { SplitTemplate } from "../../types";
import { BUILT_IN_TEMPLATES } from "./splitTemplates";
import GymBuddyPlugin from "../../main";

type BuilderResult = {
	template: SplitTemplate;
	saveAsTemplate: boolean;
};

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

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gb-modal");

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
				// Check if a template with the same name already exists
				const existingIndex =
					this.plugin.settings.customSplitTemplates.findIndex(
						(t) => t.name === template.name
					);

				if (existingIndex >= 0) {
					// Update existing template (keep original ID and preserve isCustom flag)
					const existingTemplate =
						this.plugin.settings.customSplitTemplates[
							existingIndex
						];
					if (existingTemplate) {
						this.plugin.settings.customSplitTemplates[
							existingIndex
						] = {
							...template,
							id: existingTemplate.id,
							isCustom: true,
						};
					}
				} else {
					// Check if template with same ID already exists (shouldn't happen, but safety check)
					const existingByIdIndex =
						this.plugin.settings.customSplitTemplates.findIndex(
							(t) => t.id === template.id
						);
					if (existingByIdIndex >= 0) {
						// Update by ID instead
						this.plugin.settings.customSplitTemplates[
							existingByIdIndex
						] = {
							...template,
							isCustom: true,
						};
					} else {
						// Add new template
						this.plugin.settings.customSplitTemplates.push({
							...template,
							isCustom: true,
						});
					}
				}
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
