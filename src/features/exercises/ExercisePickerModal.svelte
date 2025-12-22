<script lang="ts">
	import type {Exercise, TrainingSplit} from '../../types';

	interface Props {
		exercises?: Exercise[];
		recentExercises?: Exercise[];
		favoriteExercises?: Exercise[];
		favoriteIds?: Set<string>;
		currentSplit?: TrainingSplit | null;
		selectedMuscles?: string[];
		recentExpanded?: boolean;
		muscleGroupsExpanded?: boolean;
	}

	let {
		exercises = [],
		recentExercises = [],
		favoriteExercises = [],
		favoriteIds = new Set<string>(),
		currentSplit = null,
		selectedMuscles = $bindable([]),
		recentExpanded = true,
		muscleGroupsExpanded = true
	}: Props = $props();

	let recentExpandedState = $state(true);
	let muscleGroupsExpandedState = $state(true);

	// Initialize collapse state from props
	$effect(() => {
		recentExpandedState = recentExpanded;
		muscleGroupsExpandedState = muscleGroupsExpanded;
	});

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
		// Emit change event to persist selection
		const event = new CustomEvent('muscle-selection-change', {
			detail: { selectedMuscles },
		});
		document.dispatchEvent(event);
	}

	function selectExercise(exercise: Exercise) {
		const event = new CustomEvent('select-exercise', {
			detail: {exercise},
		});
		document.dispatchEvent(event);
	}

	function toggleFavorite(exerciseId: string, event: MouseEvent) {
		event.stopPropagation();
		const customEvent = new CustomEvent('toggle-favorite', {
			detail: {exerciseId},
		});
		document.dispatchEvent(customEvent);
	}

	function isFavorite(exerciseId: string): boolean {
		return favoriteIds.has(exerciseId);
	}

	function toggleRecentExpanded() {
		recentExpandedState = !recentExpandedState;
		const event = new CustomEvent('collapse-change', {
			detail: { section: 'recent', expanded: recentExpandedState },
		});
		document.dispatchEvent(event);
	}

	function toggleMuscleGroupsExpanded() {
		muscleGroupsExpandedState = !muscleGroupsExpandedState;
		const event = new CustomEvent('collapse-change', {
			detail: { section: 'muscleGroups', expanded: muscleGroupsExpandedState },
		});
		document.dispatchEvent(event);
	}
</script>

<div class="gym-buddy-exercise-picker">
	<!-- Current split indicator (if set) -->
	{#if currentSplit}
		<div class="gym-buddy-current-split-badge">
			Training: {currentSplit.name}
		</div>
	{/if}

	<input
		type="text"
		class="gym-buddy-search-input"
		placeholder="Search exercises..."
		bind:value={searchQuery}
	/>

	{#if favoriteExercises.length > 0}
		<div class="gym-buddy-section">
			<h3>Favorites</h3>
			<div class="gym-buddy-exercise-list">
				{#each favoriteExercises as exercise}
					<div class="gym-buddy-exercise-item">
						<div
							class="gym-buddy-exercise-content"
							onclick={() => selectExercise(exercise)}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectExercise(exercise);
								}
							}}
						>
							<div class="gym-buddy-exercise-name">{exercise.name}</div>
							<div class="gym-buddy-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<button
							class="gym-buddy-favorite-button active"
							onclick={(e) => toggleFavorite(exercise.id, e)}
							title="Remove from favorites"
						>
							❤️
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if recentExercises.length > 0}
		<div class="gym-buddy-section">
			<div class="gym-buddy-section-header">
				<h3>Recent</h3>
				<button
					class="gym-buddy-collapse-button"
					onclick={toggleRecentExpanded}
					title={recentExpandedState ? "Collapse" : "Expand"}
				>
					{recentExpandedState ? '▼' : '▶'}
				</button>
			</div>
			{#if recentExpandedState}
			<div class="gym-buddy-exercise-list">
				{#each recentExercises as exercise}
					<div class="gym-buddy-exercise-item">
						<div
							class="gym-buddy-exercise-content"
							onclick={() => selectExercise(exercise)}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectExercise(exercise);
								}
							}}
						>
							<div class="gym-buddy-exercise-name">{exercise.name}</div>
							<div class="gym-buddy-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<button
							class="gym-buddy-favorite-button"
							class:active={isFavorite(exercise.id)}
							onclick={(e) => toggleFavorite(exercise.id, e)}
							title={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
						>
							{isFavorite(exercise.id) ? '❤️' : '🤍'}
						</button>
					</div>
				{/each}
			</div>
			{/if}
		</div>
	{/if}

	<div class="gym-buddy-section">
		<div class="gym-buddy-section-header">
			<div class="gym-buddy-section-header-content">
				<h3>Muscle Groups</h3>
				{#if selectedMuscles.length > 0}
					<div class="gym-buddy-selected-muscles-preview">
						<span class="gym-buddy-selected-muscles-label">Filtered:</span>
						<div class="gym-buddy-selected-muscles-chips">
							{#each selectedMuscles as muscle}
								<span class="gym-buddy-selected-muscle-chip">{muscle}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			<button
				class="gym-buddy-collapse-button"
				onclick={toggleMuscleGroupsExpanded}
				title={muscleGroupsExpandedState ? "Collapse" : "Expand"}
			>
				{muscleGroupsExpandedState ? '▼' : '▶'}
			</button>
		</div>
		{#if muscleGroupsExpandedState}
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
		{/if}
	</div>

	<div class="gym-buddy-section">
		<h3>All Exercises ({filteredExercises.length})</h3>
		<div class="gym-buddy-exercise-list">
			{#each filteredExercises as exercise}
				<div class="gym-buddy-exercise-item">
					<div
						class="gym-buddy-exercise-content"
						onclick={() => selectExercise(exercise)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectExercise(exercise);
							}
						}}
					>
						<div class="gym-buddy-exercise-name">{exercise.name}</div>
						<div class="gym-buddy-exercise-muscles">
							{exercise.muscles.join(', ')}
						</div>
					</div>
					<button
						class="gym-buddy-favorite-button"
						class:active={isFavorite(exercise.id)}
						onclick={(e) => toggleFavorite(exercise.id, e)}
						title={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
					>
						{isFavorite(exercise.id) ? '❤️' : '🤍'}
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.gym-buddy-exercise-picker {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.gym-buddy-current-split-badge {
		padding: 8px 12px;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		text-align: center;
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

	.gym-buddy-section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	.gym-buddy-section-header-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gym-buddy-section h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.gym-buddy-selected-muscles-preview {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.gym-buddy-selected-muscles-label {
		font-size: 12px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.gym-buddy-selected-muscles-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.gym-buddy-selected-muscle-chip {
		padding: 4px 10px;
		font-size: 11px;
		border-radius: 12px;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		font-weight: 500;
	}

	.gym-buddy-collapse-button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 12px;
		color: var(--text-muted);
		padding: 4px 8px;
		transition: color 0.2s ease;
		flex-shrink: 0;
		min-width: 24px;
		text-align: center;
	}

	.gym-buddy-collapse-button:hover {
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
		padding: 14px 16px;
		text-align: left;
		border: 2px solid var(--background-modifier-border);
		border-radius: 8px;
		background: var(--background-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 48px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.gym-buddy-exercise-item:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-exercise-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		cursor: pointer;
	}

	.gym-buddy-exercise-name {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-exercise-muscles {
		font-size: 12px;
		color: var(--text-muted);
	}

	.gym-buddy-favorite-button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 20px;
		padding: 4px 8px;
		transition: transform 0.2s ease;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.gym-buddy-favorite-button:hover {
		transform: scale(1.2);
		opacity: 1;
	}

	.gym-buddy-favorite-button.active {
		opacity: 1;
	}

	/* Desktop: More compact UI */
	@media (min-width: 769px) {
		.gym-buddy-exercise-picker {
			padding: 12px;
			gap: 14px;
		}

		.gym-buddy-current-split-badge {
			padding: 6px 10px;
			font-size: 12px;
		}

		.gym-buddy-search-input {
			padding: 8px 12px;
			font-size: 14px;
		}

		.gym-buddy-section {
			gap: 8px;
		}

		.gym-buddy-section h3 {
			font-size: 12px;
		}

		.gym-buddy-muscle-chip {
			padding: 6px 12px;
			font-size: 12px;
			min-height: 32px;
		}

		.gym-buddy-exercise-list {
			gap: 6px;
		}

		.gym-buddy-exercise-item {
			padding: 10px 12px;
			min-height: 40px;
			gap: 8px;
		}

		.gym-buddy-exercise-name {
			font-size: 14px;
		}

		.gym-buddy-exercise-muscles {
			font-size: 11px;
		}

		.gym-buddy-favorite-button {
			font-size: 16px;
			padding: 2px 6px;
		}
	}
</style>
