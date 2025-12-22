import { Modal } from "obsidian";
import { mount, unmount } from "svelte";
import TrainingSetupModalComponent from "./TrainingSetupModal.svelte";
import GymBuddyPlugin from "../main";
import { BUILT_IN_TEMPLATES } from "../data/splitTemplates";
import { WeeklySchedule } from "../settings";

interface SetupResult {
	templateId: string;
	schedule: WeeklySchedule;
}

export class TrainingSetupModal extends Modal {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: GymBuddyPlugin;
	private onComplete: ((result: SetupResult) => void) | null = null;
	private confirmHandler: ((event: CustomEvent) => void) | null = null;

	constructor(
		plugin: GymBuddyPlugin,
		onComplete?: (result: SetupResult) => void
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onComplete = onComplete || null;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("gym-buddy-modal");

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

		// Listen for setup confirmation
		this.confirmHandler = async (event: CustomEvent) => {
			const { templateId, schedule } = event.detail as SetupResult;

			// Save settings
			this.plugin.settings.activeSplitTemplateId = templateId;
			this.plugin.settings.weeklySchedule = schedule;
			await this.plugin.saveSettings();

			// Call completion callback if provided
			if (this.onComplete) {
				this.onComplete({ templateId, schedule });
			}

			this.close();
		};

		document.addEventListener(
			"confirm-setup",
			this.confirmHandler as EventListener
		);
	}

	onClose() {
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}

		if (this.confirmHandler) {
			document.removeEventListener(
				"confirm-setup",
				this.confirmHandler as EventListener
			);
			this.confirmHandler = null;
		}
	}
}

