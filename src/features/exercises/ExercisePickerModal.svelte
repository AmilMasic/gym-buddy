<script lang="ts">
	import type { ExercisePickerProps } from './types';
	import type { Exercise, TrainingSplit } from '../../types';
	import { Input, Chip, IconButton, Button } from '../../ui/components';

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
	let favoritesExpandedState = $state(true);

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

	function toggleFavoritesExpanded() {
		favoritesExpandedState = !favoritesExpandedState;
		const event = new CustomEvent('collapse-change', {
			detail: { section: 'favorites', expanded: favoritesExpandedState },
		});
		document.dispatchEvent(event);
	}

	function openCreateExercise() {
		const event = new CustomEvent('open-create-exercise');
		document.dispatchEvent(event);
	}

	function openEditExercise(exercise: Exercise, e: MouseEvent) {
		e.stopPropagation();
		const event = new CustomEvent('open-edit-exercise', {
			detail: { exercise }
		});
		document.dispatchEvent(event);
	}

	let deleteConfirmId = $state<string | null>(null);

	function deleteExercise(exerciseId: string, e: MouseEvent) {
		e.stopPropagation();
		if (deleteConfirmId === exerciseId) {
			const event = new CustomEvent('delete-exercise', {
				detail: { exerciseId }
			});
			document.dispatchEvent(event);
			deleteConfirmId = null;
		} else {
			deleteConfirmId = exerciseId;
			setTimeout(() => {
				deleteConfirmId = null;
			}, 3000);
		}
	}

	function isCustomExercise(exercise: Exercise): boolean {
		return exercise.source === 'custom';
	}
</script>

<div class="gb-exercise-picker">
	<!-- Current split indicator (if set) -->
	{#if currentSplit}
		<div class="gb-current-split-badge">
			Training: {currentSplit.name}
		</div>
	{/if}

	<!-- Search + Create button row -->
	<div class="gb-search-row">
		<div class="gb-search-input-wrapper">
			<Input
				bind:value={searchQuery}
				placeholder="Search exercises..."
				size="md"
			/>
		</div>
		<IconButton
			icon="plus"
			variant="ghost"
			size="md"
			ariaLabel="Create custom exercise"
			onclick={openCreateExercise}
		/>
	</div>

	{#if favoriteExercises.length > 0}
		<div class="gb-section">
			<div class="gb-section-header">
				<h3>Favorites</h3>
				<IconButton
					icon={favoritesExpandedState ? "chevron-down" : "chevron-right"}
					variant="ghost"
					size="sm"
					ariaLabel={favoritesExpandedState ? "Collapse" : "Expand"}
					onclick={toggleFavoritesExpanded}
				/>
			</div>
			{#if favoritesExpandedState}
			<div class="gb-exercise-list">
				{#each favoriteExercises as exercise}
					<div
						class="gb-exercise-item"
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
						<div class="gb-exercise-content">
							<div class="gb-exercise-name">{exercise.name}</div>
							<div class="gb-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<IconButton
							icon="heart"
							variant="favorite"
							active={true}
							ariaLabel="Remove from favorites"
							onclick={(e) => toggleFavorite(exercise.id, e)}
						/>
					</div>
				{/each}
			</div>
			{/if}
		</div>
	{/if}

	{#if recentExercises.length > 0}
		<div class="gb-section">
			<div class="gb-section-header">
				<h3>Recent</h3>
				<IconButton
					icon={recentExpandedState ? "chevron-down" : "chevron-right"}
					variant="ghost"
					size="sm"
					ariaLabel={recentExpandedState ? "Collapse" : "Expand"}
					onclick={toggleRecentExpanded}
				/>
			</div>
			{#if recentExpandedState}
			<div class="gb-exercise-list">
				{#each recentExercises as exercise}
					<div
						class="gb-exercise-item"
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
						<div class="gb-exercise-content">
							<div class="gb-exercise-name">{exercise.name}</div>
							<div class="gb-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<IconButton
							icon="heart"
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
				icon={muscleGroupsExpandedState ? "chevron-down" : "chevron-right"}
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
		{#if filteredExercises.length === 0}
			<div class="gb-empty-state">
				<p class="gb-text-muted">No exercises found</p>
				<Button variant="ghost" onclick={openCreateExercise}>
					Create custom exercise
				</Button>
			</div>
		{:else}
			<div class="gb-exercise-list">
				{#each filteredExercises as exercise}
					<div
						class="gb-exercise-item"
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
						<div class="gb-exercise-content">
							<div class="gb-exercise-name">
								{exercise.name}
								{#if isCustomExercise(exercise)}
									<span class="gb-custom-badge">Custom</span>
								{/if}
							</div>
							<div class="gb-exercise-muscles">
								{exercise.muscles.join(', ')}
							</div>
						</div>
						<div class="gb-exercise-actions">
							{#if isCustomExercise(exercise)}
								<IconButton
									icon="pencil"
									variant="ghost"
									size="sm"
									ariaLabel="Edit exercise"
									onclick={(e) => openEditExercise(exercise, e)}
								/>
								<IconButton
									icon={deleteConfirmId === exercise.id ? "check" : "trash-2"}
									variant={deleteConfirmId === exercise.id ? "danger" : "ghost"}
									size="sm"
									ariaLabel={deleteConfirmId === exercise.id ? "Confirm delete" : "Delete exercise"}
									onclick={(e) => deleteExercise(exercise.id, e)}
								/>
							{/if}
							<IconButton
								icon="heart"
								variant="favorite"
								active={isFavorite(exercise.id)}
								ariaLabel={isFavorite(exercise.id) ? "Remove from favorites" : "Add to favorites"}
								onclick={(e) => toggleFavorite(exercise.id, e)}
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
