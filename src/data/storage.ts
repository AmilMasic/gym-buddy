import { TFile, TAbstractFile, TFolder } from "obsidian";
import { Workout, Exercise, PRRecord } from "../types";
import GymBuddyPlugin from "../main";

interface PluginData {
	exercises?: Exercise[];
	prs?: PRRecord[];
}

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
	 * Load exercise library from plugin data
	 */
	async loadExerciseLibrary(): Promise<Exercise[]> {
		const data = (await this.plugin.loadData()) as PluginData | null;
		return data?.exercises || [];
	}

	/**
	 * Save exercise library to plugin data
	 */
	async saveExerciseLibrary(exercises: Exercise[]): Promise<void> {
		const data =
			((await this.plugin.loadData()) as PluginData | null) ||
			({} as PluginData);
		data.exercises = exercises;
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
	getWorkoutFilePath(date: string): string {
		const folder = this.getWorkoutFolder();
		return `${folder}/${date}.md`;
	}

	/**
	 * Save workout to markdown file
	 */
	async saveWorkout(workout: Workout, markdown: string): Promise<TFile> {
		await this.ensureWorkoutFolder();
		const filePath = this.getWorkoutFilePath(workout.date);

		const existingFile =
			this.plugin.app.vault.getAbstractFileByPath(filePath);
		if (existingFile instanceof TFile) {
			await this.plugin.app.vault.modify(existingFile, markdown);
			return existingFile;
		} else {
			return await this.plugin.app.vault.create(filePath, markdown);
		}
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
}
