<script lang="ts">
	import type {Exercise, TrainingSplit} from '../../types';
	import { Heart, ChevronDown, ChevronRight } from '@lucide/svelte';

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
							<Heart size={16} fill="currentColor" />
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
					{#if recentExpandedState}
						<ChevronDown size={16} />
					{:else}
						<ChevronRight size={16} />
					{/if}
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
							{#if isFavorite(exercise.id)}
								<Heart size={16} fill="currentColor" />
							{:else}
								<Heart size={16} />
							{/if}
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
				{#if muscleGroupsExpandedState}
					<ChevronDown size={16} />
				{:else}
					<ChevronRight size={16} />
				{/if}
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
						{#if isFavorite(exercise.id)}
							<Heart size={16} fill="currentColor" />
						{:else}
							<Heart size={16} />
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>
