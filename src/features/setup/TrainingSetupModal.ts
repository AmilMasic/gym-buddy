import TrainingSetupModalComponent from "./TrainingSetupModal.svelte";
import { Modal, Notice } from "obsidian";
import { mount, unmount } from "svelte";
import { BUILT_IN_TEMPLATES } from "../splits/splitTemplates";
import { CustomSplitBuilderModal } from "../splits/CustomSplitBuilderModal";
import { GymBuddySettingTab } from "../../settings";
import { WeeklySchedule } from "../../types";
import GymBuddyPlugin from "../../main";

type SetupResult = {
	templateId: string;
	schedule: WeeklySchedule;
};

export class TrainingSetupModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private onComplete: ((result: SetupResult) => void) | null = null;
	private confirmHandler: ((event: CustomEvent) => void) | null = null;
	private deleteHandler: ((event: CustomEvent) => Promise<void>) | null =
		null;
	private renameHandler: ((event: CustomEvent) => Promise<void>) | null =
		null;

	constructor(
		plugin: GymBuddyPlugin,
		onComplete?: (result: SetupResult) => void
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onComplete = onComplete || null;
	}

	private deduplicateTemplates() {
		// Remove duplicate templates by name (keep the first occurrence)
		const seen = new Set<string>();
		const unique: typeof this.plugin.settings.customSplitTemplates = [];

		for (const template of this.plugin.settings.customSplitTemplates) {
			if (!seen.has(template.name)) {
				seen.add(template.name);
				unique.push(template);
			}
		}

		if (
			unique.length !== this.plugin.settings.customSplitTemplates.length
		) {
			this.plugin.settings.customSplitTemplates = unique;
			void this.plugin.saveSettings();
		}
	}

	private mountComponent() {
		// Unmount existing component if any
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gb-modal");

		// Deduplicate templates before mounting
		this.deduplicateTemplates();

		// Combine built-in and custom templates
		const allTemplates = [
			...BUILT_IN_TEMPLATES,
			...this.plugin.settings.customSplitTemplates,
		];

		// Mount Svelte component
		this.component = mount(TrainingSetupModalComponent, {
			target: contentEl,
			props: {
				templates: allTemplates,
				currentTemplateId: this.plugin.settings.activeSplitTemplateId,
				currentSchedule: this.plugin.settings.weeklySchedule,
			},
		});
	}

	async onOpen() {
		this.mountComponent();

		// Listen for custom builder selection
		const customBuilderHandler = async (event: CustomEvent) => {
			const { templateId } = event.detail as { templateId: string };

			if (templateId === "custom-builder") {
				// Open custom split builder modal (on top of this one)
				await new Promise<void>((resolve) => {
					const builderModal = new CustomSplitBuilderModal(
						this.plugin,
						(result) => {
							// User selected splits from builder
							const compositeTemplate = result.template;

							// Emit event to update component with new template
							const updateEvent = new CustomEvent(
								"custom-template-created",
								{
									detail: { template: compositeTemplate },
								}
							);
							document.dispatchEvent(updateEvent);

							resolve();
						},
						() => {
							// User cancelled builder
							resolve();
						}
					);
					builderModal.open();
				});
			}
		};

		// Listen for setup confirmation
		this.confirmHandler = (event: CustomEvent) => {
			const { templateId, schedule } = event.detail as SetupResult;

			// Save settings
			this.plugin.settings.activeSplitTemplateId = templateId;
			this.plugin.settings.weeklySchedule = schedule;
			// Fire and forget - saveSettings is async but we don't need to await it
			void this.plugin.saveSettings();

			// Refresh settings tab if it exists
			const settingTab = (
				this.plugin as GymBuddyPlugin & {
					settingTab?: GymBuddySettingTab;
				}
			).settingTab;
			if (settingTab) {
				settingTab.display();
			}

			// Call completion callback if provided
			if (this.onComplete) {
				this.onComplete({ templateId, schedule });
			}

			this.close();
		};

		// Listen for template deletion
		this.deleteHandler = async (event: CustomEvent) => {
			const { templateId, templateName } = event.detail as {
				templateId: string;
				templateName: string;
			};

			// Confirm deletion
			const confirmed = await new Promise<boolean>((resolve) => {
				const confirmModal = new Modal(this.app);
				confirmModal.titleEl.setText("Delete template");
				confirmModal.contentEl.createEl("p", {
					text: `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
				});

				const buttonContainer = confirmModal.contentEl.createDiv({
					cls: "gb-modal-button-container",
				});

				const cancelBtn = buttonContainer.createEl("button", {
					text: "Cancel",
				});
				cancelBtn.onclick = () => {
					resolve(false);
					confirmModal.close();
				};

				const deleteBtn = buttonContainer.createEl("button", {
					text: "Delete",
					cls: "mod-warning",
				});
				deleteBtn.onclick = () => {
					resolve(true);
					confirmModal.close();
				};

				confirmModal.open();
			});

			if (!confirmed) return;

			// Remove template from custom templates
			this.plugin.settings.customSplitTemplates =
				this.plugin.settings.customSplitTemplates.filter(
					(t) => t.id !== templateId
				);

			// Clear from weekly schedule if it was assigned
			const schedule = { ...this.plugin.settings.weeklySchedule };
			let scheduleChanged = false;
			for (const day in schedule) {
				if (schedule[day] === templateId) {
					delete schedule[day];
					scheduleChanged = true;
				}
			}
			if (scheduleChanged) {
				this.plugin.settings.weeklySchedule = schedule;
			}

			// Clear active template if it was deleted
			if (this.plugin.settings.activeSplitTemplateId === templateId) {
				this.plugin.settings.activeSplitTemplateId = "";
			}

			// Save settings
			await this.plugin.saveSettings();

			// Refresh component with updated templates
			this.mountComponent();

			new Notice(`Template "${templateName}" deleted`);
		};

		// Listen for template rename
		this.renameHandler = async (event: CustomEvent) => {
			const { templateId, currentName } = event.detail as {
				templateId: string;
				currentName: string;
			};

			// Prompt for new name
			const newName = await new Promise<string | null>((resolve) => {
				const renameModal = new Modal(this.app);
				renameModal.titleEl.setText("Rename template");
				const inputContainer = renameModal.contentEl.createDiv({
					cls: "gb-modal-input-container",
				});

				inputContainer.createEl("label", {
					text: "Template name:",
				});
				const input = inputContainer.createEl("input", {
					type: "text",
					value: currentName,
					cls: "gb-modal-input-full-width",
				});
				input.focus();
				input.select();

				const buttonContainer = inputContainer.createDiv({
					cls: "gb-modal-button-container gb-modal-button-container-compact",
				});

				const cancelBtn = buttonContainer.createEl("button", {
					text: "Cancel",
				});
				cancelBtn.onclick = () => {
					resolve(null);
					renameModal.close();
				};

				const saveBtn = buttonContainer.createEl("button", {
					text: "Save",
					cls: "mod-cta",
				});
				saveBtn.onclick = () => {
					const value = input.value.trim();
					resolve(value.length > 0 ? value : null);
					renameModal.close();
				};

				// Handle Enter key
				input.onkeydown = (e) => {
					if (e.key === "Enter") {
						saveBtn.click();
					} else if (e.key === "Escape") {
						cancelBtn.click();
					}
				};

				renameModal.open();
			});

			if (!newName || newName === currentName) return;

			// Update template name
			const template = this.plugin.settings.customSplitTemplates.find(
				(t) => t.id === templateId
			);
			if (template) {
				template.name = newName;
				await this.plugin.saveSettings();

				// Refresh component with updated templates
				this.mountComponent();

				new Notice(`Template renamed to "${newName}"`);
			}
		};

		document.addEventListener(
			"select-custom-builder",
			customBuilderHandler as EventListener
		);
		document.addEventListener(
			"confirm-setup",
			this.confirmHandler as EventListener
		);
		document.addEventListener(
			"delete-template",
			this.deleteHandler as EventListener
		);
		document.addEventListener(
			"rename-template",
			this.renameHandler as EventListener
		);
	}

	onClose() {
		if (this.component) {
			void unmount(this.component);
			this.component = null;
		}

		if (this.confirmHandler) {
			document.removeEventListener(
				"confirm-setup",
				this.confirmHandler as EventListener
			);
			this.confirmHandler = null;
		}

		if (this.deleteHandler) {
			document.removeEventListener(
				"delete-template",
				this.deleteHandler as EventListener
			);
			this.deleteHandler = null;
		}

		if (this.renameHandler) {
			document.removeEventListener(
				"rename-template",
				this.renameHandler as EventListener
			);
			this.renameHandler = null;
		}
	}
}
