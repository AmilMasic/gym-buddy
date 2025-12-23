import { TFile, TAbstractFile, TFolder, moment } from "obsidian";
import { Workout, Exercise, PRRecord, SplitFavorites } from "../types";
import GymBuddyPlugin from "../main";
import { getExerciseDatabase } from "../features/exercises/exerciseDatabase";
import { WorkoutParser } from "./parser";

type PluginData = {
	exercises?: Exercise[]; // Custom exercises only
	prs?: PRRecord[];
	splitFavorites?: SplitFavorites[];
};

/**
 * Storage layer for Gym Buddy plugin data
 * Handles plugin data (exercises, PRs) and vault file operations
 */
export class Storage {
	private plugin: GymBuddyPlugin;

	constructor(plugin: GymBuddyPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Get default exercise library
	 */
	private getDefaultExercises(): Exercise[] {
		return [
			{
				id: "bench-press",
				name: "Bench Press",
				muscles: ["Chest", "Triceps", "Shoulders"],
				type: "weight",
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "squat",
				name: "Squat",
				muscles: ["Quadriceps", "Glutes", "Hamstrings"],
				type: "weight",
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "deadlift",
				name: "Deadlift",
				muscles: ["Back", "Hamstrings", "Glutes"],
				type: "weight",
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "overhead-press",
				name: "Overhead Press",
				muscles: ["Shoulders", "Triceps"],
				type: "weight",
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "barbell-row",
				name: "Barbell Row",
				muscles: ["Back", "Biceps"],
				type: "weight",
				trackWeight: true,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "pull-ups",
				name: "Pull-ups",
				muscles: ["Back", "Biceps"],
				type: "bodyweight",
				trackWeight: false,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "push-ups",
				name: "Push-ups",
				muscles: ["Chest", "Triceps", "Shoulders"],
				type: "bodyweight",
				trackWeight: false,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
			{
				id: "dips",
				name: "Dips",
				muscles: ["Triceps", "Chest", "Shoulders"],
				type: "bodyweight",
				trackWeight: false,
				trackReps: true,
				trackTime: false,
				trackDistance: false,
				unit: "lbs",
			},
		];
	}

	/**
	 * Load exercise library from plugin data, merging database + custom exercises
	 */
	async loadExerciseLibrary(): Promise<Exercise[]> {
		// Initialize database
		const database = getExerciseDatabase();
		await database.initialize();

		// Get all exercises from database
		const databaseExercises = database.getAllExercises();

		// Load custom exercises from plugin data
		const data = (await this.plugin.loadData()) as PluginData | null;
		const customExercises = data?.exercises || [];

		// Create a map of custom exercises by ID for quick lookup
		const customMap = new Map<string, Exercise>();
		for (const ex of customExercises) {
			customMap.set(ex.id, ex);
		}

		// Merge: database exercises take precedence, but custom exercises override
		// Custom exercises are marked with source: 'custom'
		const merged: Exercise[] = [];

		// Add all database exercises
		for (const dbEx of databaseExercises) {
			// If custom exercise exists with same ID, use custom (user override)
			const customEx = customMap.get(dbEx.id);
			if (customEx) {
				merged.push({ ...customEx, source: "custom" });
				customMap.delete(dbEx.id); // Remove from map so we don't add it twice
			} else {
				merged.push(dbEx);
			}
		}

		// Add remaining custom exercises (new IDs not in database)
		for (const customEx of customMap.values()) {
			merged.push({ ...customEx, source: "custom" });
		}

		// If no custom exercises exist and database is empty, initialize with defaults
		if (merged.length === 0) {
			const defaultExercises = this.getDefaultExercises();
			await this.saveExerciseLibrary(defaultExercises);
			return defaultExercises;
		}

		return merged;
	}

	/**
	 * Save exercise library to plugin data
	 * Only saves custom exercises (source: 'custom' or no source)
	 */
	async saveExerciseLibrary(exercises: Exercise[]): Promise<void> {
		const data =
			((await this.plugin.loadData()) as PluginData | null) ||
			({} as PluginData);
		// Only save custom exercises, not database exercises
		const customExercises = exercises.filter(
			(ex) => ex.source === "custom" || !ex.source
		);
		data.exercises = customExercises;
		await this.plugin.saveData(data);
	}

	/**
	 * Load PR records from plugin data
	 */
	async loadPRRecords(): Promise<PRRecord[]> {
		const data = (await this.plugin.loadData()) as PluginData | null;
		return data?.prs || [];
	}

	/**
	 * Save PR records to plugin data
	 */
	async savePRRecords(prs: PRRecord[]): Promise<void> {
		const data =
			((await this.plugin.loadData()) as PluginData | null) ||
			({} as PluginData);
		data.prs = prs;
		await this.plugin.saveData(data);
	}

	/**
	 * Get workout folder path
	 */
	getWorkoutFolder(): string {
		return this.plugin.settings?.workoutFolder || "Workouts";
	}

	/**
	 * Ensure workout folder exists
	 */
	async ensureWorkoutFolder(): Promise<void> {
		const folderPath = this.getWorkoutFolder();
		const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
		if (!folder) {
			await this.plugin.app.vault.createFolder(folderPath);
		}
	}

	/**
	 * Get workout file path for a given date
	 */
	getWorkoutFilePath(date: string, useTimestamp = false): string {
		const folder = this.getWorkoutFolder();
		if (useTimestamp) {
			const time = moment().format("HH-mm");
			return `${folder}/${date}-${time}.md`;
		}
		return `${folder}/${date}.md`;
	}

	/**
	 * Save workout to markdown file
	 */
	async saveWorkout(workout: Workout, markdown: string): Promise<TFile> {
		const saveMode = this.plugin.settings.workoutSaveMode;

		if (saveMode === "weekly") {
			return await this.saveToWeeklyNote(workout);
		}

		await this.ensureWorkoutFolder();

		const useTimestamp = saveMode === "daily-timestamp";
		const filePath = this.getWorkoutFilePath(workout.date, useTimestamp);

		const existingFile =
			this.plugin.app.vault.getAbstractFileByPath(filePath);

		if (existingFile instanceof TFile) {
			if (saveMode === "daily-append") {
				const existingContent = await this.plugin.app.vault.read(
					existingFile
				);
				// Generate append-friendly markdown (no frontmatter)
				const appendMarkdown = WorkoutParser.workoutToMarkdown(
					workout,
					false
				);
				const newContent = `${existingContent}\n\n${appendMarkdown}`;
				await this.plugin.app.vault.modify(existingFile, newContent);
				return existingFile;
			} else {
				// Overwrite (default or if daily-timestamp somehow collisions)
				await this.plugin.app.vault.modify(existingFile, markdown);
				return existingFile;
			}
		} else {
			return await this.plugin.app.vault.create(filePath, markdown);
		}
	}

	/**
	 * Save workout to a weekly note
	 */
	private async saveToWeeklyNote(workout: Workout): Promise<TFile> {
		const config = this.getWeeklyNoteConfig();
		const filePath = this.resolveWeeklyPath(config, workout.date);

		// Ensure the parent folder exists
		const lastSlash = filePath.lastIndexOf("/");
		if (lastSlash !== -1) {
			const folderPath = filePath.substring(0, lastSlash);
			const folder =
				this.plugin.app.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				await this.plugin.app.vault.createFolder(folderPath);
			}
		}

		let file = this.plugin.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			// Create file with the heading if it doesn't exist
			const initialContent = `${this.plugin.settings.weeklyNoteHeading}\n\n`;
			file = await this.plugin.app.vault.create(filePath, initialContent);
		}

		if (file instanceof TFile) {
			const content = await this.plugin.app.vault.read(file);
			const heading = this.plugin.settings.weeklyNoteHeading;
			const workoutMarkdown = WorkoutParser.workoutToMarkdown(
				workout,
				false
			);

			let newContent: string;
			if (content.includes(heading)) {
				// Insert after heading
				const lines = content.split("\n");
				const headingIndex = lines.findIndex((l) =>
					l.trim().startsWith(heading)
				);
				lines.splice(headingIndex + 1, 0, "", workoutMarkdown);
				newContent = lines.join("\n");
			} else {
				// Append heading and workout at end
				newContent = `${content}\n\n${heading}\n\n${workoutMarkdown}`;
			}

			await this.plugin.app.vault.modify(file, newContent);
			return file;
		}

		throw new Error("Could not save to weekly note");
	}

	/**
	 * Get weekly note configuration (Periodic Notes or manual)
	 */
	private getWeeklyNoteConfig(): { folder: string; format: string } {
		// Try Periodic Notes first
		const periodicConfig = this.getPeriodicNotesWeeklyConfig();
		if (periodicConfig) return periodicConfig;

		// Fallback to manual settings
		const manualPath = this.plugin.settings.weeklyNotePath;
		const lastSlash = manualPath.lastIndexOf("/");

		if (lastSlash === -1) {
			return { folder: "", format: manualPath.replace(".md", "") };
		}

		return {
			folder: manualPath.substring(0, lastSlash),
			format: manualPath.substring(lastSlash + 1).replace(".md", ""),
		};
	}

	/**
	 * Detect Periodic Notes weekly config
	 */
	private getPeriodicNotesWeeklyConfig(): {
		folder: string;
		format: string;
	} | null {
		try {
			type PeriodicNotesPlugin = {
				settings?: {
					weekly?: {
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

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const app = this.plugin.app as any as AppWithPlugins;

			// Safely check if plugins API exists
			if (
				!app ||
				!app.plugins ||
				typeof app.plugins.getPlugin !== "function"
			) {
				return null;
			}

			const pluginGetter = app.plugins.getPlugin;
			if (!pluginGetter) {
				return null;
			}

			const periodicNotes = pluginGetter("periodic-notes") as
				| PeriodicNotesPlugin
				| undefined;

			if (!periodicNotes?.settings?.weekly?.enabled) return null;
			return {
				folder: periodicNotes.settings.weekly.folder || "",
				format: periodicNotes.settings.weekly.format || "gggg-[W]ww",
			};
		} catch (error) {
			// Gracefully handle errors accessing Periodic Notes plugin API
			// Falls back to manual settings configuration
			return null;
		}
	}

	/**
	 * Convert user-friendly format placeholders to moment.js format tokens
	 */
	private convertFormatToMoment(format: string): string {
		// Convert user-friendly placeholders to moment.js tokens
		return format
			.replace(/\{\{year\}\}/g, "gggg") // 4-digit year
			.replace(/\{\{week\}\}/g, "ww") // Week number with leading zero
			.replace(/\{\{month\}\}/g, "MM") // 2-digit month
			.replace(/\{\{day\}\}/g, "DD"); // 2-digit day
	}

	/**
	 * Resolve weekly path pattern to actual file path
	 */
	private resolveWeeklyPath(
		config: { folder: string; format: string },
		date: string
	): string {
		const m = moment(date);
		const momentFormat = this.convertFormatToMoment(config.format);
		const filename = m.format(momentFormat);
		const folder = config.folder ? `${config.folder}/` : "";
		return `${folder}${filename}.md`;
	}

	/**
	 * Load workout from markdown file
	 */
	async loadWorkout(date: string): Promise<string | null> {
		const filePath = this.getWorkoutFilePath(date);
		const file = this.plugin.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			return await this.plugin.app.vault.read(file);
		}

		return null;
	}

	/**
	 * Get all workout files
	 */
	getWorkoutFiles(): TFile[] {
		const folderPath = this.getWorkoutFolder();
		const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);

		if (!folder) {
			return [];
		}

		const files: TFile[] = [];
		const collectFiles = (file: TAbstractFile) => {
			if (file instanceof TFile && file.extension === "md") {
				files.push(file);
			} else if (file instanceof TFolder && file.children) {
				file.children.forEach(collectFiles);
			}
		};

		collectFiles(folder);
		return files;
	}

	/**
	 * Load favorites for a specific split
	 */
	async loadSplitFavorites(splitId: string): Promise<string[]> {
		const data = (await this.plugin.loadData()) as PluginData | null;
		const favorites = data?.splitFavorites || [];
		const splitFav = favorites.find((f) => f.splitId === splitId);
		return splitFav?.exerciseIds || [];
	}

	/**
	 * Toggle favorite status for an exercise in a split
	 * Returns true if exercise is now favorited, false if unfavorited
	 */
	async toggleFavorite(
		splitId: string,
		exerciseId: string
	): Promise<boolean> {
		const data =
			((await this.plugin.loadData()) as PluginData | null) ||
			({} as PluginData);

		if (!data.splitFavorites) {
			data.splitFavorites = [];
		}

		const favorites = data.splitFavorites;
		let splitFav = favorites.find((f) => f.splitId === splitId);

		if (!splitFav) {
			splitFav = { splitId, exerciseIds: [] };
			favorites.push(splitFav);
		}

		const index = splitFav.exerciseIds.indexOf(exerciseId);
		if (index >= 0) {
			// Remove favorite
			splitFav.exerciseIds.splice(index, 1);
			await this.plugin.saveData(data);
			return false;
		} else {
			// Add favorite
			splitFav.exerciseIds.push(exerciseId);
			await this.plugin.saveData(data);
			return true;
		}
	}

	/**
	 * Get favorite exercises for a split
	 */
	async getFavoriteExercises(splitId: string): Promise<Exercise[]> {
		const favoriteIds = await this.loadSplitFavorites(splitId);
		if (favoriteIds.length === 0) {
			return [];
		}

		const allExercises = await this.loadExerciseLibrary();
		const favoriteMap = new Set(favoriteIds);
		return allExercises.filter((ex) => favoriteMap.has(ex.id));
	}
}
