<script lang="ts">
	import type { ExercisePickerProps } from './types';
	import type { Exercise, TrainingSplit } from '../../types';
	import { Heart, ChevronDown, ChevronRight } from '@lucide/svelte';
	import { Input, Chip, IconButton } from '../../ui/components';

	let {
		exercises = [],
		recentExercises = [],
		favoriteExercises = [],
		favoriteIds = new Set<string>(),
		currentSplit = null,
		selectedMuscles = $bindable([]),
		recentExpanded = true,
		muscleGroupsExpanded = true
	}: ExercisePickerProps = $props();

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

<div class="gb-exercise-picker">
	<!-- Current split indicator (if set) -->
	{#if currentSplit}
		<div class="gb-current-split-badge">
			Training: {currentSplit.name}
		</div>
	{/if}

	<Input
		bind:value={searchQuery}
		placeholder="Search exercises..."
		size="md"
	/>

	{#if favoriteExercises.length > 0}
		<div class="gb-section">
			<h3>Favorites</h3>
			<div class="gb-exercise-list">
				{#each favoriteExercises as exercise}
					<div class="gb-exercise-item">
						<div
							class="gb-exercise-content"
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
							<div class="gb-exercise-name">{exercise.name}</div>
							<div class="gb-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<IconButton
							icon={Heart}
							variant="favorite"
							active={true}
							ariaLabel="Remove from favorites"
							onclick={(e) => toggleFavorite(exercise.id, e)}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if recentExercises.length > 0}
		<div class="gb-section">
			<div class="gb-section-header">
				<h3>Recent</h3>
				<IconButton
					icon={recentExpandedState ? ChevronDown : ChevronRight}
					variant="ghost"
					size="sm"
					ariaLabel={recentExpandedState ? "Collapse" : "Expand"}
					onclick={toggleRecentExpanded}
				/>
			</div>
			{#if recentExpandedState}
			<div class="gb-exercise-list">
				{#each recentExercises as exercise}
					<div class="gb-exercise-item">
						<div
							class="gb-exercise-content"
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
							<div class="gb-exercise-name">{exercise.name}</div>
							<div class="gb-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<IconButton
							icon={Heart}
							variant="favorite"
							active={isFavorite(exercise.id)}
							ariaLabel={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
							onclick={(e) => toggleFavorite(exercise.id, e)}
						/>
					</div>
				{/each}
			</div>
			{/if}
		</div>
	{/if}

	<div class="gb-section">
		<div class="gb-section-header">
			<div class="gb-section-header-content">
				<h3>Muscle Groups</h3>
				{#if selectedMuscles.length > 0}
					<div class="gb-selected-muscles-preview">
						<span class="gb-selected-muscles-label">Filtered:</span>
						<div class="gb-selected-muscles-chips">
							{#each selectedMuscles as muscle}
								<span class="gb-selected-muscle-chip">{muscle}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			<IconButton
				icon={muscleGroupsExpandedState ? ChevronDown : ChevronRight}
				variant="ghost"
				size="sm"
				ariaLabel={muscleGroupsExpandedState ? "Collapse" : "Expand"}
				onclick={toggleMuscleGroupsExpanded}
			/>
		</div>
		{#if muscleGroupsExpandedState}
		<div class="gb-muscle-chips">
			{#each allMuscles as muscle}
				<Chip
					active={selectedMuscles.includes(muscle)}
					onclick={() => toggleMuscle(muscle)}
				>
					{muscle}
				</Chip>
			{/each}
		</div>
		{/if}
	</div>

	<div class="gb-section">
		<h3>All Exercises ({filteredExercises.length})</h3>
		<div class="gb-exercise-list">
			{#each filteredExercises as exercise}
				<div class="gb-exercise-item">
					<div
						class="gb-exercise-content"
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
						<div class="gb-exercise-name">{exercise.name}</div>
						<div class="gb-exercise-muscles">
							{exercise.muscles.join(', ')}
						</div>
					</div>
					<IconButton
						icon={Heart}
						variant="favorite"
						active={isFavorite(exercise.id)}
						ariaLabel={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
						onclick={(e) => toggleFavorite(exercise.id, e)}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>
