import { TFile, moment } from "obsidian";
import type GymBuddyPlugin from "../main";

/**
 * Daily Notes Integration
 * Handles finding and appending workout summaries to daily notes
 */
export class DailyNotesIntegration {
	private plugin: GymBuddyPlugin;

	constructor(plugin: GymBuddyPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Get the daily note file for a given date
	 * Checks both Daily Notes core plugin and Periodic Notes plugin
	 */
	getDailyNoteFile(date: string): TFile | null {
		// Try Periodic Notes plugin first
		const periodicNote = this.getPeriodicDailyNote(date);
		if (periodicNote) {
			return periodicNote;
		}

		// Fall back to Daily Notes core plugin
		return this.getCoreDailyNote(date);
	}

	/**
	 * Get daily note from Periodic Notes plugin
	 */
	private getPeriodicDailyNote(date: string): TFile | null {
		try {
			type PeriodicNotesPlugin = {
				settings?: {
					daily?: {
						enabled?: boolean;
						folder?: string;
						format?: string;
					};
				};
			};

			type AppWithPlugins = {
				plugins?: {
					getPlugin?: (id: string) => unknown;
				};
			};

			const app = this.plugin.app as unknown as AppWithPlugins;

			if (
				!app ||
				!app.plugins ||
				typeof app.plugins.getPlugin !== "function"
			) {
				return null;
			}

			const periodicNotes = app.plugins.getPlugin(
				"periodic-notes"
			) as PeriodicNotesPlugin | undefined;

			if (!periodicNotes?.settings?.daily?.enabled) {
				return null;
			}

			const folder = periodicNotes.settings.daily.folder || "";
			const format =
				periodicNotes.settings.daily.format || "YYYY-MM-DD";

			const m = moment(date);
			const filename = m.format(format);
			const folderPath = folder ? `${folder}/` : "";
			const filePath = `${folderPath}${filename}.md`;

			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			return file instanceof TFile ? file : null;
		} catch (error) {
			console.error("Error accessing Periodic Notes plugin:", error);
			return null;
		}
	}

	/**
	 * Get daily note from core Daily Notes plugin
	 */
	private getCoreDailyNote(date: string): TFile | null {
		try {
			type DailyNotesSettings = {
				folder?: string;
				format?: string;
			};

			type AppInternalConfig = {
				internalPlugins?: {
					plugins?: {
						"daily-notes"?: {
							instance?: {
								options?: DailyNotesSettings;
							};
						};
					};
				};
			};

			const app = this.plugin.app as unknown as AppInternalConfig;

			const dailyNotesPlugin =
				app.internalPlugins?.plugins?.["daily-notes"];

			if (!dailyNotesPlugin) {
				return null;
			}

			const settings = dailyNotesPlugin.instance?.options;
			const folder = settings?.folder || "";
			const format = settings?.format || "YYYY-MM-DD";

			const m = moment(date);
			const filename = m.format(format);
			const folderPath = folder ? `${folder}/` : "";
			const filePath = `${folderPath}${filename}.md`;

			const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
			return file instanceof TFile ? file : null;
		} catch (error) {
			console.error("Error accessing Daily Notes plugin:", error);
			return null;
		}
	}

	/**
	 * Check if content already has the workout heading
	 */
	private hasWorkoutHeading(content: string, heading: string): boolean {
		// Normalize heading (remove leading ## if present, we'll add it)
		const normalizedHeading = heading.trim().replace(/^#+\s*/, "");
		const headingRegex = new RegExp(`^#{1,6}\\s+${normalizedHeading}`, "m");
		return headingRegex.test(content);
	}

	/**
	 * Find the position to insert content under a heading
	 * Returns the position after the heading line, or -1 if heading not found
	 */
	private findHeadingPosition(content: string, heading: string): number {
		// Normalize heading (remove leading ## if present)
		const normalizedHeading = heading.trim().replace(/^#+\s*/, "");
		const lines = content.split("\n");

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]?.trim();
			if (!line) continue;

			// Match heading at any level
			const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
			if (headingMatch && headingMatch[2]) {
				const headingText = headingMatch[2].trim();
				if (
					headingText.toLowerCase() ===
					normalizedHeading.toLowerCase()
				) {
					// Found the heading! Return position after this line
					const position =
						lines.slice(0, i + 1).join("\n").length + 1;
					return position;
				}
			}
		}

		return -1;
	}

	/**
	 * Append workout summary under the configured heading
	 * Returns true if successful, false if heading doesn't exist
	 */
	async appendToHeading(
		file: TFile,
		heading: string,
		summary: string
	): Promise<boolean> {
		const content = await this.plugin.app.vault.read(file);

		const position = this.findHeadingPosition(content, heading);
		if (position === -1) {
			// Heading not found
			return false;
		}

		// Insert after heading with a blank line
		const before = content.substring(0, position);
		const after = content.substring(position);

		// Check if there's already content after the heading
		// If so, add blank line before our content
		const needsBlankLine = after.trim().length > 0 && !after.startsWith("\n\n");
		const prefix = needsBlankLine ? "\n" : "";

		const newContent = `${before}${prefix}${summary}\n${after}`;
		await this.plugin.app.vault.modify(file, newContent);

		return true;
	}

	/**
	 * Append content to the end of a file
	 */
	async appendToEnd(file: TFile, summary: string): Promise<void> {
		const content = await this.plugin.app.vault.read(file);
		const newContent = content.trim() + "\n\n" + summary + "\n";
		await this.plugin.app.vault.modify(file, newContent);
	}
}
