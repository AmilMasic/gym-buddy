import { Workout, WorkoutExercise, WorkoutSet } from "../types";

/**
 * Parser for converting between Workout objects and Markdown format
 *
 * Format:
 * ---
 * type: workout
 * date: 2025-12-21
 * duration: 45
 * muscles: [chest, triceps]
 * volume: 12500
 * prs: 1
 * ---
 *
 * ## Exercise Name
 * | Set | Weight | Reps | RPE |
 * |-----|--------|------|-----|
 * | 1   | 135    | 10   |     |
 * | 2   | 155    | 8    | 7   |
 */
export class WorkoutParser {
	/**
	 * Convert Workout object to Markdown string
	 */
	static workoutToMarkdown(workout: Workout): string {
		const lines: string[] = [];

		// Frontmatter
		lines.push("---");
		lines.push("type: workout");
		lines.push(`date: ${workout.date}`);
		if (workout.duration !== undefined) {
			lines.push(`duration: ${workout.duration}`);
		}
		if (workout.muscles.length > 0) {
			lines.push(`muscles: [${workout.muscles.join(", ")}]`);
		}
		if (workout.volume !== undefined) {
			lines.push(`volume: ${workout.volume}`);
		}
		if (workout.prs !== undefined) {
			lines.push(`prs: ${workout.prs}`);
		}
		if (workout.split) {
			lines.push(`split: ${workout.split}`);
		}
		lines.push("---");
		lines.push("");

		// Exercises
		for (const exercise of workout.exercises) {
			lines.push(`## ${exercise.name}`);
			lines.push("");

			// Determine columns based on what's tracked
			const hasWeight = exercise.sets.some((s) => s.weight !== undefined);
			const hasReps = exercise.sets.some((s) => s.reps !== undefined);
			const hasTime = exercise.sets.some((s) => s.time !== undefined);
			const hasRPE = exercise.sets.some((s) => s.rpe !== undefined);

			if (hasWeight || hasReps || hasTime || hasRPE) {
				// Build header row
				const headers = ["Set"];
				if (hasWeight) headers.push("Weight");
				if (hasReps) headers.push("Reps");
				if (hasTime) headers.push("Time");
				if (hasRPE) headers.push("RPE");

				lines.push(`| ${headers.join(" | ")} |`);
				lines.push(`|${headers.map(() => "-----").join("|")}|`);

				// Build data rows
				for (const set of exercise.sets) {
					const cells = [set.setNumber.toString()];
					if (hasWeight) cells.push(set.weight?.toString() || "");
					if (hasReps) cells.push(set.reps?.toString() || "");
					if (hasTime) {
						const timeStr = set.time ? `${set.time}s` : "";
						cells.push(timeStr);
					}
					if (hasRPE) cells.push(set.rpe?.toString() || "");
					lines.push(`| ${cells.join(" | ")} |`);
				}
			}

			lines.push("");
		}

		return lines.join("\n");
	}

	/**
	 * Parse Markdown string to Workout object
	 */
	static markdownToWorkout(markdown: string, date: string): Workout {
		const lines = markdown.split("\n");
		const workout: Workout = {
			date,
			muscles: [],
			exercises: [],
		};

		let inFrontmatter = false;
		let frontmatterLines: string[] = [];
		let currentExercise: WorkoutExercise | null = null;
		let tableHeaders: string[] = [];
		let inTable = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]?.trim();
			if (!line) continue;

			// Parse frontmatter
			if (line === "---") {
				if (inFrontmatter) {
					// End of frontmatter
					this.parseFrontmatter(frontmatterLines.join("\n"), workout);
					inFrontmatter = false;
				} else {
					inFrontmatter = true;
				}
				continue;
			}

			if (inFrontmatter) {
				frontmatterLines.push(line);
				continue;
			}

			// Parse exercise header (## Exercise Name)
			if (line.startsWith("## ")) {
				// Save previous exercise if exists
				if (currentExercise) {
					workout.exercises.push(currentExercise);
				}
				currentExercise = {
					name: line.substring(3).trim(),
					sets: [],
				};
				inTable = false;
				continue;
			}

			// Parse table
			if (line.startsWith("|")) {
				const cells = line
					.split("|")
					.map((c) => c.trim())
					.filter((c) => c);

				if (!inTable && cells[0] !== "Set" && cells[0] !== "-----") {
					// This is a header row
					tableHeaders = cells;
					inTable = true;
					continue;
				}

				if (cells[0] === "-----") {
					// Separator row, skip
					continue;
				}

				if (inTable && currentExercise && cells[0] !== "Set") {
					// Data row
					const set = this.parseTableRow(cells, tableHeaders);
					if (set) {
						currentExercise.sets.push(set);
					}
				}
			} else if (inTable && line === "") {
				// Empty line after table, table is done
				inTable = false;
			}
		}

		// Don't forget the last exercise
		if (currentExercise) {
			workout.exercises.push(currentExercise);
		}

		return workout;
	}

	/**
	 * Parse frontmatter YAML
	 */
	private static parseFrontmatter(
		frontmatter: string,
		workout: Workout
	): void {
		const lines = frontmatter.split("\n");
		for (const line of lines) {
			const match = line.match(/^(\w+):\s*(.+)$/);
			if (match && match[1] && match[2]) {
				const key = match[1];
				const value = match[2];
				switch (key) {
					case "duration":
						workout.duration = parseInt(value, 10);
						break;
					case "muscles": {
						// Parse [chest, triceps] format
						const musclesMatch = value.match(/\[(.+)\]/);
						if (musclesMatch && musclesMatch[1]) {
							workout.muscles = musclesMatch[1]
								.split(",")
								.map((m) => m.trim())
								.filter((m) => m);
						}
						break;
					}
					case "volume":
						workout.volume = parseInt(value, 10);
						break;
					case "prs":
						workout.prs = parseInt(value, 10);
						break;
					case "split":
						workout.split = value.trim();
						break;
				}
			}
		}
	}

	/**
	 * Parse a table row into a WorkoutSet
	 */
	private static parseTableRow(
		cells: string[],
		headers: string[]
	): WorkoutSet | null {
		if (cells.length === 0 || !cells[0]) return null;

		const setNumber = parseInt(cells[0], 10);
		if (isNaN(setNumber)) return null;

		const set: WorkoutSet = { setNumber };

		for (let i = 1; i < headers.length && i < cells.length; i++) {
			const header = headers[i]?.toLowerCase();
			const value = cells[i]?.trim();

			if (!header || !value) continue;

			switch (header) {
				case "weight":
					set.weight = parseFloat(value);
					break;
				case "reps":
					set.reps = parseInt(value, 10);
					break;
				case "time": {
					// Parse "60s" format
					const timeMatch = value.match(/(\d+)s?/);
					if (timeMatch && timeMatch[1]) {
						set.time = parseInt(timeMatch[1], 10);
					}
					break;
				}
				case "rpe":
					set.rpe = parseFloat(value);
					break;
			}
		}

		return set;
	}
}
