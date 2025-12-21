<script lang="ts">
	import {Exercise} from '../types';

	interface Props {
		exercises?: Exercise[];
		recentExercises?: Exercise[];
		selectedMuscles?: string[];
	}

	let { exercises = [], recentExercises = [], selectedMuscles = $bindable([]) }: Props = $props();

	let searchQuery = $state('');
	let filteredExercises: Exercise[] = $derived.by(() => {
		let result = exercises;

		// Filter by muscle groups
		if (selectedMuscles.length > 0) {
			result = result.filter(ex =>
				ex.muscles.some(m => selectedMuscles.includes(m))
			);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(ex =>
				ex.name.toLowerCase().includes(query)
			);
		}

		return result;
	});

	const allMuscles = $derived.by(() => {
		const muscles = new Set<string>();
		exercises.forEach(ex => ex.muscles.forEach(m => muscles.add(m)));
		return Array.from(muscles).sort();
	});

	function toggleMuscle(muscle: string) {
		if (selectedMuscles.includes(muscle)) {
			selectedMuscles = selectedMuscles.filter(m => m !== muscle);
		} else {
			selectedMuscles = [...selectedMuscles, muscle];
		}
	}

	function selectExercise(exercise: Exercise) {
		const event = new CustomEvent('select-exercise', {
			detail: {exercise},
		});
		document.dispatchEvent(event);
	}
</script>

<div class="gym-buddy-exercise-picker">
	<input
		type="text"
		class="gym-buddy-search-input"
		placeholder="Search exercises..."
		bind:value={searchQuery}
		autofocus
	/>

	{#if recentExercises.length > 0}
		<div class="gym-buddy-section">
			<h3>Recent</h3>
			<div class="gym-buddy-exercise-list">
				{#each recentExercises as exercise}
					<button
						class="gym-buddy-exercise-item"
						onclick={() => selectExercise(exercise)}
					>
						{exercise.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="gym-buddy-section">
		<h3>Muscle Groups</h3>
		<div class="gym-buddy-muscle-chips">
			{#each allMuscles as muscle}
				<button
					class="gym-buddy-muscle-chip"
					class:active={selectedMuscles.includes(muscle)}
					onclick={() => toggleMuscle(muscle)}
				>
					{muscle}
				</button>
			{/each}
		</div>
	</div>

	<div class="gym-buddy-section">
		<h3>Exercises</h3>
		<div class="gym-buddy-exercise-list">
			{#each filteredExercises as exercise}
				<button
					class="gym-buddy-exercise-item"
					onclick={() => selectExercise(exercise)}
				>
					<div class="gym-buddy-exercise-name">{exercise.name}</div>
					<div class="gym-buddy-exercise-muscles">
						{exercise.muscles.join(', ')}
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.gym-buddy-exercise-picker {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.gym-buddy-search-input {
		width: 100%;
		padding: 12px 16px;
		font-size: 16px;
		border: 2px solid var(--background-modifier-border);
		border-radius: 8px;
		background: var(--background-primary);
		color: var(--text-normal);
	}

	.gym-buddy-search-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.gym-buddy-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.gym-buddy-section h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-muscle-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.gym-buddy-muscle-chip {
		padding: 8px 16px;
		font-size: 14px;
		border-radius: 20px;
		border: 2px solid var(--background-modifier-border);
		background: var(--background-primary);
		color: var(--text-normal);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 40px;
	}

	.gym-buddy-muscle-chip:hover {
		background: var(--background-modifier-hover);
	}

	.gym-buddy-muscle-chip.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-exercise-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.gym-buddy-exercise-item {
		padding: 16px;
		text-align: left;
		border: 2px solid var(--background-modifier-border);
		border-radius: 8px;
		background: var(--background-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 48px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.gym-buddy-exercise-item:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-exercise-name {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-exercise-muscles {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>

