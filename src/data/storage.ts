import { TFile, TAbstractFile, TFolder, moment, Notice } from "obsidian";
import { Workout, Exercise, PRRecord, SplitFavorites } from "../types";
import GymBuddyPlugin from "../main";
import { getExerciseDatabase } from "../features/exercises/exerciseDatabase";
import { WorkoutParser } from "./parser";
import { BUILT_IN_TEMPLATES } from "../features/splits/splitTemplates";
import { DailyNotesIntegration } from "../integrations/dailyNotes";

type PluginData = {
	exercises?: Exercise[]; // Custom exercises only
	prs?: PRRecord[];
	splitFavorites?: SplitFavorites[];
};

type WeeklyNoteConfig = {
	folder: string;
	format: string;
};

type WorkoutLinkInfo = {
	date: string;
	filePath: string;
	linkText: string;
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
		database.initialize();

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
			new Notice(`Created folder: ${folderPath}`, 8000);
		}
	}

	/**
	 * Resolve path pattern with placeholders to actual path
	 */
	private resolvePathPattern(
		pattern: string,
		workout: Workout,
		timestamp?: string
	): string {
		const m = moment(workout.date);
		let resolved = pattern
			.replace(/\{\{date\}\}/g, workout.date)
			.replace(/\{\{year\}\}/g, m.format("YYYY"))
			.replace(/\{\{month\}\}/g, m.format("MM"))
			.replace(/\{\{day\}\}/g, m.format("DD"))
			.replace(/\{\{time\}\}/g, timestamp || moment().format("HH-mm"))
			.replace(/\{\{split\}\}/g, workout.split || "workout");

		// Ensure .md extension
		if (!resolved.endsWith(".md")) {
			resolved += ".md";
		}

		return resolved;
	}

	/**
	 * Get workout file path for a given workout
	 */
	private getWorkoutFilePath(workout: Workout): string {
		const folder = this.getWorkoutFolder();
		const format =
			this.plugin.settings.workoutFilenameFormat || "{{date}}-{{time}}";
		const timestamp = moment().format("HH-mm");
		const filename = this.resolvePathPattern(format, workout, timestamp);
		return `${folder}/${filename}`;
	}

	/**
	 * Save individual workout note (always called)
	 */
	async saveIndividualWorkout(
		workout: Workout,
		markdown: string
	): Promise<TFile> {
		await this.ensureWorkoutFolder();

		// Generate unique filename with timestamp
		let filePath = this.getWorkoutFilePath(workout);
		let counter = 1;

		// Ensure filename is unique (in case of multiple workouts at same time)
		while (
			this.plugin.app.vault.getAbstractFileByPath(filePath) instanceof
			TFile
		) {
			const basePath = filePath.replace(".md", "");
			filePath = `${basePath}-${counter}.md`;
			counter++;
		}

		return await this.plugin.app.vault.create(filePath, markdown);
	}

	/**
	 * Get split name for display in links
	 */
	private getSplitDisplayName(workout: Workout): string {
		if (!workout.split) return "Workout";

		const allTemplates = [
			...BUILT_IN_TEMPLATES,
			...this.plugin.settings.customSplitTemplates,
		];

		// Try to find split name from templates
		for (const template of allTemplates) {
			const split = template.splits.find((s) => s.id === workout.split);
			if (split) {
				return split.name;
			}
		}

		// Fallback: use muscles if available
		if (workout.muscles.length > 0) {
			return workout.muscles.slice(0, 2).join("/");
		}

		return workout.split;
	}

	/**
	 * Get day name from date (Monday, Tuesday, etc.)
	 */
	private getDayName(date: string): string {
		const days = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		];
		const dayIndex = moment(date).day();
		return days[dayIndex] || "Unknown";
	}

	/**
	 * Generate weekly note content structure with Mon-Sun headers
	 */
	private generateWeeklyNoteContent(workoutLinks: WorkoutLinkInfo[]): string {
		const lines: string[] = [];
		lines.push("---");
		lines.push("type: weekly-workout-summary");
		const weekStart = moment(
			workoutLinks[0]?.date || moment().format("YYYY-MM-DD")
		)
			.startOf("week")
			.format("YYYY-MM-DD");
		const weekEnd = moment(weekStart).endOf("week").format("YYYY-MM-DD");
		lines.push(`week: ${weekStart} to ${weekEnd}`);
		lines.push("---");
		lines.push("");

		// Group workouts by day
		const workoutsByDay = new Map<string, typeof workoutLinks>();
		for (const link of workoutLinks) {
			const dayName = this.getDayName(link.date);
			if (!workoutsByDay.has(dayName)) {
				workoutsByDay.set(dayName, []);
			}
			workoutsByDay.get(dayName)!.push(link);
		}

		// Generate Mon-Sun structure
		const dayOrder = [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
			"Sunday",
		];

		for (const dayName of dayOrder) {
			lines.push(`## ${dayName}`);
			const dayWorkouts = workoutsByDay.get(dayName) || [];
			if (dayWorkouts.length === 0) {
				lines.push("");
			} else {
				for (const workout of dayWorkouts) {
					// Extract filename without extension for link
					const linkPath = workout.filePath.replace(".md", "");
					lines.push(`- [[${linkPath}|${workout.linkText}]]`);
				}
				lines.push("");
			}
		}

		return lines.join("\n");
	}

	/**
	 * Update weekly note with workout link
	 */
	async updateWeeklyNote(
		workout: Workout,
		workoutFilePath: string
	): Promise<void> {
		if (!this.plugin.settings.weeklyNotesEnabled) {
			return;
		}

		const config = this.getWeeklyNoteConfig();
		const weeklyFilePath = this.resolveWeeklyNotePath(config, workout.date);

		// Ensure parent folder exists
		const lastSlash = weeklyFilePath.lastIndexOf("/");
		if (lastSlash !== -1) {
			const folderPath = weeklyFilePath.substring(0, lastSlash);
			const folder =
				this.plugin.app.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				await this.plugin.app.vault.createFolder(folderPath);
				new Notice(`Created folder: ${folderPath}`, 8000);
			}
		}

		// Get all workouts for this week
		const weekStart = moment(workout.date).startOf("week");
		const weekEnd = moment(workout.date).endOf("week");
		const weekWorkouts = await this.getWorkoutsForWeek(
			weekStart.format("YYYY-MM-DD"),
			weekEnd.format("YYYY-MM-DD")
		);

		// Add current workout if not already in list
		const splitName = this.getSplitDisplayName(workout);
		const linkText = `${splitName}${
			workout.muscles.length > 0
				? ` - ${workout.muscles.slice(0, 2).join("/")}`
				: ""
		}`;

		const existingLink = weekWorkouts.find(
			(w) => w.filePath === workoutFilePath
		);
		if (!existingLink) {
			weekWorkouts.push({
				date: workout.date,
				filePath: workoutFilePath,
				linkText,
			});
		}

		// Get or create weekly note
		let weeklyFile =
			this.plugin.app.vault.getAbstractFileByPath(weeklyFilePath);
		if (!(weeklyFile instanceof TFile)) {
			// Create initial weekly note structure
			const initialContent = this.generateWeeklyNoteContent(weekWorkouts);
			weeklyFile = await this.plugin.app.vault.create(
				weeklyFilePath,
				initialContent
			);
		}

		if (!(weeklyFile instanceof TFile)) {
			throw new Error("Could not create or access weekly note");
		}

		// Regenerate weekly note content with all workouts
		const newContent = this.generateWeeklyNoteContent(weekWorkouts);
		await this.plugin.app.vault.modify(weeklyFile, newContent);
	}

	/**
	 * Get all workout files for a given week
	 */
	private async getWorkoutsForWeek(
		weekStart: string,
		weekEnd: string
	): Promise<WorkoutLinkInfo[]> {
		const workouts: WorkoutLinkInfo[] = [];

		const folder = this.plugin.app.vault.getAbstractFileByPath(
			this.getWorkoutFolder()
		);
		if (!folder || !(folder instanceof TFolder)) {
			return workouts;
		}

		const startMoment = moment(weekStart);
		const endMoment = moment(weekEnd);

		// Collect all workout files in the week
		const workoutFiles: TFile[] = [];
		const collectWorkoutFiles = (file: TAbstractFile) => {
			if (file instanceof TFile && file.extension === "md") {
				// Try to parse date from filename
				const basename = file.basename;
				const dateMatch = basename.match(/(\d{4}-\d{2}-\d{2})/);
				if (dateMatch) {
					const fileDate = dateMatch[1];
					const fileMoment = moment(fileDate);
					if (
						fileMoment.isSameOrAfter(startMoment, "day") &&
						fileMoment.isSameOrBefore(endMoment, "day")
					) {
						workoutFiles.push(file);
					}
				}
			} else if (file instanceof TFolder && file.children) {
				file.children.forEach(collectWorkoutFiles);
			}
		};

		collectWorkoutFiles(folder);

		// Read each file and extract workout info
		for (const file of workoutFiles) {
			try {
				const content = await this.plugin.app.vault.read(file);
				const dateMatch = file.basename.match(/(\d{4}-\d{2}-\d{2})/);
				if (dateMatch && dateMatch[1]) {
					const fileDate = dateMatch[1];
					const workout = WorkoutParser.markdownToWorkout(
						content,
						fileDate
					);
					const splitName = this.getSplitDisplayName(workout);
					const linkText = `${splitName}${
						workout.muscles.length > 0
							? ` - ${workout.muscles.slice(0, 2).join("/")}`
							: ""
					}`;
					workouts.push({
						date: fileDate,
						filePath: file.path,
						linkText,
					});
				}
			} catch (error) {
				console.error(
					`Failed to read workout file ${file.path}:`,
					error
				);
			}
		}

		// Sort by date
		workouts.sort((a, b) => a.date.localeCompare(b.date));

		return workouts;
	}

	/**
	 * Save workout to markdown file
	 * Always saves individual note, optionally updates weekly note
	 */
	async saveWorkout(workout: Workout, markdown: string): Promise<{
		file: TFile;
		weeklyNoteError?: boolean;
	}> {
		// Always save individual workout note
		const individualFile = await this.saveIndividualWorkout(
			workout,
			markdown
		);

		let weeklyNoteError = false;

		// Optionally update weekly note with link
		if (this.plugin.settings.weeklyNotesEnabled) {
			try {
				await this.updateWeeklyNote(workout, individualFile.path);
			} catch (error) {
				console.error("Failed to update weekly note:", error);
				weeklyNoteError = true;
				// Don't fail the whole save if weekly note update fails
			}
		}

		// Optionally append to daily note
		if (this.plugin.settings.dailyNoteIntegration) {
			try {
				await this.appendToDailyNote(workout);
			} catch (error) {
				console.error("Failed to append to daily note:", error);
				// Don't fail the whole save if daily note append fails
			}
		}

		return {
			file: individualFile,
			weeklyNoteError: weeklyNoteError || undefined,
		};
	}

	/**
	 * Append workout summary to daily note
	 */
	async appendToDailyNote(workout: Workout): Promise<void> {
		const integration = new DailyNotesIntegration(this.plugin);
		const dailyNote = integration.getDailyNoteFile(workout.date);

		if (!dailyNote) {
			new Notice(
				"Daily note not found for " +
					workout.date +
					". Create it first, then log your workout."
			);
			return;
		}

		// Generate workout summary
		const summary = this.generateDailyNoteSummary(workout);

		// Get configured heading
		const heading = this.plugin.settings.dailyNoteHeading;

		// Try to append under the configured heading
		const appendedUnderHeading = await integration.appendToHeading(
			dailyNote,
			heading,
			summary
		);

		if (!appendedUnderHeading) {
			// Heading not found, append to end with heading
			const normalizedHeading = heading.trim().replace(/^#+\s*/, "");
			const headingLevel = heading.match(/^#+/)?.[0] || "##";
			const fullSummary = `${headingLevel} ${normalizedHeading}\n\n${summary}`;
			await integration.appendToEnd(dailyNote, fullSummary);
			new Notice(
				`Workout added to daily note (heading "${normalizedHeading}" created)`
			);
		} else {
			new Notice("Workout added to daily note");
		}
	}

	/**
	 * Generate a concise workout summary for daily notes
	 */
	private generateDailyNoteSummary(workout: Workout): string {
		const lines: string[] = [];

		// Calculate stats
		const totalExercises = workout.exercises.length;
		const totalSets = workout.exercises.reduce(
			(sum, ex) => sum + ex.sets.length,
			0
		);
		const totalVolume = workout.volume || 0;

		// Format time (use current time since workout.date is just YYYY-MM-DD)
		const time = moment().format("HH:mm");

		// Summary line
		const volumeStr =
			totalVolume > 0 ? ` • ${totalVolume.toLocaleString()} total volume` : "";
		lines.push(
			`Logged at ${time} • ${totalExercises} exercises • ${totalSets} sets${volumeStr}`
		);
		lines.push("");

		// Table header
		lines.push("| Exercise | Sets | Volume |");
		lines.push("|----------|------|--------|");

		// Table rows
		for (const exercise of workout.exercises) {
			const exerciseSets = exercise.sets.length;
			// Calculate volume for this exercise
			const exerciseVolume = exercise.sets.reduce((sum, set) => {
				const weight = set.weight || 0;
				const reps = set.reps || 0;
				return sum + weight * reps;
			}, 0);

			const volumeCell =
				exerciseVolume > 0 ? exerciseVolume.toLocaleString() : "-";
			lines.push(`| ${exercise.name} | ${exerciseSets} | ${volumeCell} |`);
		}

		return lines.join("\n");
	}

	/**
	 * Get weekly note configuration (Periodic Notes or manual)
	 */
	private getWeeklyNoteConfig(): WeeklyNoteConfig {
		// Try Periodic Notes first if enabled
		if (this.plugin.settings.usePeriodicNotesConfig) {
			const periodicConfig = this.getPeriodicNotesWeeklyConfig();
			if (periodicConfig) return periodicConfig;
		}

		// Fallback to manual settings
		const folder =
			this.plugin.settings.weeklyNoteFolder || "Workouts/weeks";
		let format =
			this.plugin.settings.weeklyNoteFilename || "{{year}}-W{{week}}";

		// Remove .md extension if present
		format = format.replace(".md", "");

		return { folder, format };
	}

	/**
	 * Detect Periodic Notes weekly config
	 */
	private getPeriodicNotesWeeklyConfig(): WeeklyNoteConfig | null {
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

			const app = this.plugin.app as unknown as AppWithPlugins;

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
		} catch {
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
	 * Resolve weekly note path pattern to actual file path
	 */
	private resolveWeeklyNotePath(
		config: WeeklyNoteConfig,
		date: string
	): string {
		const m = moment(date);
		const momentFormat = this.convertFormatToMoment(config.format);
		const filename = m.format(momentFormat);
		const folder = config.folder ? `${config.folder}/` : "";
		return `${folder}${filename}.md`;
	}

	/**
	 * Get workout file path for a given date (legacy method for loading)
	 */
	private getWorkoutFilePathByDate(date: string): string {
		const folder = this.getWorkoutFolder();
		return `${folder}/${date}.md`;
	}

	/**
	 * Load workout from markdown file
	 */
	async loadWorkout(date: string): Promise<string | null> {
		const filePath = this.getWorkoutFilePathByDate(date);
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
