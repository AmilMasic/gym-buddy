<script lang="ts">
	import type {Exercise, TrainingSplit} from '../types';

	interface Props {
		exercises?: Exercise[];
		recentExercises?: Exercise[];
		favoriteExercises?: Exercise[];
		favoriteIds?: Set<string>;
		currentSplit?: TrainingSplit | null;
		templateName?: string;
		availableSplits?: TrainingSplit[];
		showSplitFilter?: boolean;
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
		templateName = "",
		availableSplits = [],
		showSplitFilter = false,
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
	let splitFilterEnabled = $state(false);
	
	// Initialize split filter based on props
	$effect(() => {
		splitFilterEnabled = showSplitFilter && currentSplit !== null;
	});
	
	let filteredExercises: Exercise[] = $derived.by(() => {
		let result = exercises;

		// Filter by split muscle groups if enabled
		if (splitFilterEnabled && currentSplit) {
			const splitMuscles = new Set(currentSplit.muscleGroups);
			result = result.filter(ex =>
				ex.muscles.some(m => splitMuscles.has(m)) ||
				(ex.secondaryMuscles && ex.secondaryMuscles.some(m => splitMuscles.has(m)))
			);
		}

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

	function selectSplit(split: TrainingSplit) {
		const event = new CustomEvent('split-change', {
			detail: { split },
		});
		document.dispatchEvent(event);
	}
</script>

<div class="gym-buddy-exercise-picker">
	{#if templateName && availableSplits.length > 0}
		<div class="gym-buddy-split-selector">
			<div class="gym-buddy-split-selector-header">
				<span class="gym-buddy-split-selector-label">{templateName}</span>
				{#if currentSplit}
					<span class="gym-buddy-current-split-indicator">Current: {currentSplit.name}</span>
				{/if}
			</div>
			<div class="gym-buddy-split-buttons">
				{#each availableSplits as split}
					<button
						class="gym-buddy-split-button"
						class:active={currentSplit?.id === split.id}
						onclick={() => selectSplit(split)}
						title={split.muscleGroups.join(', ')}
					>
						<span class="gym-buddy-split-button-name">{split.name}</span>
						<span class="gym-buddy-split-button-muscles">{split.muscleGroups.join(', ')}</span>
					</button>
				{/each}
			</div>
			{#if currentSplit && showSplitFilter}
				<label class="gym-buddy-checkbox-label">
					<input
						type="checkbox"
						bind:checked={splitFilterEnabled}
					/>
					<span>Filter exercises by split muscle groups</span>
				</label>
			{/if}
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
						{#if currentSplit}
							<button
								class="gym-buddy-favorite-button"
								class:active={isFavorite(exercise.id)}
								onclick={(e) => toggleFavorite(exercise.id, e)}
								title={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
							>
								{isFavorite(exercise.id) ? '❤️' : '🤍'}
							</button>
						{/if}
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
					{#if currentSplit}
						<button
							class="gym-buddy-favorite-button"
							class:active={isFavorite(exercise.id)}
							onclick={(e) => toggleFavorite(exercise.id, e)}
							title={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
						>
							{isFavorite(exercise.id) ? '❤️' : '🤍'}
						</button>
					{/if}
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
		font-size: 16px;
		font-weight: 600;
		color: var(--text-normal);
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

	.gym-buddy-split-selector {
		padding: 12px;
		background: var(--background-secondary);
		border-radius: 8px;
		border: 1px solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.gym-buddy-split-selector-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	.gym-buddy-split-selector-label {
		font-size: 14px;
		color: var(--text-normal);
		font-weight: 600;
	}

	.gym-buddy-current-split-indicator {
		font-size: 12px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.gym-buddy-split-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.gym-buddy-split-button {
		flex: 1;
		min-width: 120px;
		padding: 10px 12px;
		border: 2px solid var(--background-modifier-border);
		border-radius: 8px;
		background: var(--background-primary);
		color: var(--text-normal);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: left;
	}

	.gym-buddy-split-button:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-split-button.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-split-button-name {
		font-size: 14px;
		font-weight: 600;
	}

	.gym-buddy-split-button-muscles {
		font-size: 11px;
		opacity: 0.8;
	}

	.gym-buddy-checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 13px;
		color: var(--text-normal);
	}

	.gym-buddy-checkbox-label input[type="checkbox"] {
		cursor: pointer;
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
		font-size: 16px;
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
	}

	.gym-buddy-favorite-button:hover {
		transform: scale(1.2);
	}

	.gym-buddy-favorite-button.active {
		opacity: 1;
	}

	/* Desktop: More compact UI */
	@media (min-width: 769px) {
		.gym-buddy-exercise-picker {
			padding: 12px;
			gap: 16px;
		}

		.gym-buddy-search-input {
			padding: 8px 12px;
			font-size: 14px;
		}

		.gym-buddy-section {
			gap: 8px;
		}

		.gym-buddy-section h3 {
			font-size: 14px;
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

		.gym-buddy-split-selector {
			padding: 8px;
			gap: 8px;
		}

		.gym-buddy-split-selector-label {
			font-size: 12px;
		}

		.gym-buddy-current-split-indicator {
			font-size: 11px;
		}

		.gym-buddy-split-buttons {
			gap: 6px;
		}

		.gym-buddy-split-button {
			min-width: 100px;
			padding: 6px 10px;
		}

		.gym-buddy-split-button-name {
			font-size: 12px;
		}

		.gym-buddy-split-button-muscles {
			font-size: 10px;
		}

		.gym-buddy-checkbox-label {
			font-size: 12px;
		}

		.gym-buddy-section-header h3 {
			font-size: 14px;
		}

		.gym-buddy-collapse-button {
			font-size: 10px;
			padding: 2px 6px;
		}

		.gym-buddy-selected-muscles-label {
			font-size: 11px;
		}

		.gym-buddy-selected-muscle-chip {
			padding: 3px 8px;
			font-size: 10px;
		}
	}
</style>

