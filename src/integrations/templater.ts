import { moment } from "obsidian";
import GymBuddyPlugin from "../main";
import { Storage } from "../data/storage";

// Types for Templater plugin integration
type TemplaterPlugin = {
	templater?: {
		functionsObject?: {
			[key: string]: unknown;
		};
	};
};

type AppWithPlugins = {
	plugins?: {
		plugins?: {
			templater?: TemplaterPlugin;
		};
	};
};

type WorkoutLink = {
	date: string;
	path: string;
	name: string;
};

/**
 * Templater integration for Gym Buddy plugin
 * Provides tokens and helper functions for use in Templater templates
 */
export class TemplaterIntegration {
	private plugin: GymBuddyPlugin;
	private storage: Storage;

	constructor(plugin: GymBuddyPlugin, storage: Storage) {
		this.plugin = plugin;
		this.storage = storage;
	}

	/**
	 * Register Templater token if Templater plugin is available
	 */
	registerTemplaterToken(): void {
		if (!this.plugin.settings.templaterTokenEnabled) {
			return;
		}

		try {
			const app = this.plugin.app as unknown as AppWithPlugins;
			const templaterPlugin = app.plugins?.plugins?.templater?.templater;

			if (!templaterPlugin?.functionsObject) {
				return;
			}

			// Register the token
			templaterPlugin.functionsObject.gymBuddyWeeklyLinks = (
				date?: string
			): string => {
				return this.getWeeklyLinks(date);
			};

			// Also register as a user function for easier access
			templaterPlugin.functionsObject.gbWeeklyLinks = (
				date?: string
			): string => {
				return this.getWeeklyLinks(date);
			};
		} catch (error) {
			console.error("Failed to register Templater token:", error);
		}
	}

	/**
	 * Get weekly workout links for a given date (or current date)
	 */
	getWeeklyLinks(date?: string): string {
		const targetDate = date || moment().format("YYYY-MM-DD");
		const weekStart = moment(targetDate).startOf("week");
		const weekEnd = moment(targetDate).endOf("week");

		// Get all workout files for the week
		const workoutFiles = this.storage.getWorkoutFiles();
		const weekWorkouts: WorkoutLink[] = [];

		for (const file of workoutFiles) {
			const dateMatch = file.basename.match(/(\d{4}-\d{2}-\d{2})/);
			if (dateMatch && dateMatch[1]) {
				const fileDate = dateMatch[1];
				const fileMoment = moment(fileDate);
				if (
					fileMoment.isSameOrAfter(weekStart, "day") &&
					fileMoment.isSameOrBefore(weekEnd, "day")
				) {
					// Extract filename without extension for link
					const linkPath = file.path.replace(".md", "");
					weekWorkouts.push({
						date: fileDate,
						path: linkPath,
						name: file.basename,
					});
				}
			}
		}

		// Sort by date
		weekWorkouts.sort((a, b) => a.date.localeCompare(b.date));

		// Generate markdown links grouped by day
		const days = [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
			"Sunday",
		];

		const lines: string[] = [];
		for (const day of days) {
			const dayIndex = days.indexOf(day);
			const dayMoment = weekStart.clone().add(dayIndex, "days");
			const dayDate = dayMoment.format("YYYY-MM-DD");

			const dayWorkouts = weekWorkouts.filter((w) => w.date === dayDate);
			if (dayWorkouts.length > 0) {
				lines.push(`## ${day}`);
				for (const workout of dayWorkouts) {
					lines.push(`- [[${workout.path}|${workout.name}]]`);
				}
				lines.push("");
			}
		}

		return lines.join("\n");
	}

	/**
	 * Get workout count for a given week
	 */
	getWeeklyWorkoutCount(date?: string): number {
		const targetDate = date || moment().format("YYYY-MM-DD");
		const weekStart = moment(targetDate).startOf("week");
		const weekEnd = moment(targetDate).endOf("week");

		const workoutFiles = this.storage.getWorkoutFiles();
		let count = 0;

		for (const file of workoutFiles) {
			const dateMatch = file.basename.match(/(\d{4}-\d{2}-\d{2})/);
			if (dateMatch && dateMatch[1]) {
				const fileDate = dateMatch[1];
				const fileMoment = moment(fileDate);
				if (
					fileMoment.isSameOrAfter(weekStart, "day") &&
					fileMoment.isSameOrBefore(weekEnd, "day")
				) {
					count++;
				}
			}
		}

		return count;
	}
}
