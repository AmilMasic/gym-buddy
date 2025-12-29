<script lang="ts">
	import { untrack } from 'svelte';
	import type { Exercise, ExerciseType, WeightUnit } from '../../types';
	import { Button, Chip, Input, Select, IconButton } from '../../ui/components';

	type CustomExerciseModalProps = {
		exercise?: Exercise | null;
		defaultUnit?: WeightUnit;
	};

	let { exercise = null, defaultUnit = 'lbs' }: CustomExerciseModalProps = $props();

	// Extract initial values - untrack since we only want initial values, not reactive updates
	const initial = untrack(() => ({
		name: exercise?.name || '',
		muscles: exercise?.muscles || [],
		type: exercise?.type || 'weight',
		secondaryMuscles: exercise?.secondaryMuscles || [],
		equipment: exercise?.equipment || '',
		force: exercise?.force || '',
		instructions: exercise?.instructions?.join('\n') || ''
	}));

	let name = $state(initial.name);
	let selectedMuscles = $state<string[]>([...initial.muscles]);
	let exerciseType = $state<ExerciseType>(initial.type);
	let secondaryMuscles = $state<string[]>([...initial.secondaryMuscles]);
	let equipment = $state(initial.equipment);
	let force = $state<'push' | 'pull' | 'static' | ''>(initial.force);
	let instructions = $state(initial.instructions);
	let showAdvanced = $state(false);

	const AVAILABLE_MUSCLES = [
		'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
		'Quadriceps', 'Hamstrings', 'Glutes', 'Calves',
		'Abs', 'Forearms', 'Traps', 'Lats'
	];

	const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
		{ value: 'weight', label: 'Weight training' },
		{ value: 'bodyweight', label: 'Bodyweight' },
		{ value: 'timed', label: 'Timed (planks, holds)' },
		{ value: 'cardio', label: 'Cardio' }
	];

	const FORCE_OPTIONS: { value: string; label: string }[] = [
		{ value: '', label: 'None' },
		{ value: 'push', label: 'Push' },
		{ value: 'pull', label: 'Pull' },
		{ value: 'static', label: 'Static' }
	];

	const isValid = $derived(name.trim().length > 0 && selectedMuscles.length > 0);
	const isEditing = $derived(exercise !== null);

	function toggleMuscle(muscle: string) {
		if (selectedMuscles.includes(muscle)) {
			selectedMuscles = selectedMuscles.filter(m => m !== muscle);
		} else {
			selectedMuscles = [...selectedMuscles, muscle];
		}
	}

	function toggleSecondaryMuscle(muscle: string) {
		if (secondaryMuscles.includes(muscle)) {
			secondaryMuscles = secondaryMuscles.filter(m => m !== muscle);
		} else {
			secondaryMuscles = [...secondaryMuscles, muscle];
		}
	}

	function getTrackingFlags(type: ExerciseType) {
		switch (type) {
			case 'weight':
				return { trackWeight: true, trackReps: true, trackTime: false, trackDistance: false };
			case 'bodyweight':
				return { trackWeight: false, trackReps: true, trackTime: false, trackDistance: false };
			case 'timed':
				return { trackWeight: false, trackReps: false, trackTime: true, trackDistance: false };
			case 'cardio':
				return { trackWeight: false, trackReps: false, trackTime: true, trackDistance: true };
			default:
				return { trackWeight: true, trackReps: true, trackTime: false, trackDistance: false };
		}
	}

	function save() {
		if (!isValid) return;

		const tracking = getTrackingFlags(exerciseType);
		const id = exercise?.id || `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

		const newExercise: Exercise = {
			id,
			name: name.trim(),
			muscles: selectedMuscles,
			type: exerciseType,
			...tracking,
			unit: defaultUnit,
			source: 'custom',
			...(secondaryMuscles.length > 0 && { secondaryMuscles }),
			...(equipment.trim() && { equipment: equipment.trim() }),
			...(force && { force: force as 'push' | 'pull' | 'static' }),
			...(instructions.trim() && { instructions: instructions.trim().split('\n').filter(l => l.trim()) })
		};

		const event = new CustomEvent('save-custom-exercise', {
			detail: { exercise: newExercise, isNew: !isEditing }
		});
		document.dispatchEvent(event);
	}

	function cancel() {
		const event = new CustomEvent('cancel-custom-exercise');
		document.dispatchEvent(event);
	}
</script>

<div class="gb-custom-exercise-modal">
	<div class="gb-builder-header">
		<h2>{isEditing ? 'Edit exercise' : 'Create custom exercise'}</h2>
		<p class="gb-builder-subtitle">
			{isEditing ? 'Modify the exercise details below' : 'Add a new exercise to your library'}
		</p>
	</div>

	<div class="gb-builder-content">
		<!-- Name -->
		<div class="gb-section">
			<label class="gb-label" for="exercise-name">Name</label>
			<Input
				id="exercise-name"
				bind:value={name}
				placeholder="e.g., Cable Crossover"
				size="md"
			/>
		</div>

		<!-- Primary Muscles -->
		<div class="gb-section">
			<div class="gb-section-header">
				<div class="gb-section-header-content">
					<span class="gb-label">Primary muscles</span>
					{#if selectedMuscles.length > 0}
						<span class="gb-text-muted">{selectedMuscles.length} selected</span>
					{/if}
				</div>
			</div>
			<div class="gb-muscle-chips">
				{#each AVAILABLE_MUSCLES as muscle}
					<Chip
						active={selectedMuscles.includes(muscle)}
						onclick={() => toggleMuscle(muscle)}
					>
						{muscle}
					</Chip>
				{/each}
			</div>
		</div>

		<!-- Exercise Type -->
		<div class="gb-section">
			<label class="gb-label" for="exercise-type">Type</label>
			<Select
				id="exercise-type"
				options={EXERCISE_TYPES}
				bind:value={exerciseType}
				size="md"
			/>
			<p class="gb-text-muted gb-type-description">
				{#if exerciseType === 'weight'}
					Tracks weight and reps (e.g., bench press, squat)
				{:else if exerciseType === 'bodyweight'}
					Tracks reps only (e.g., push-ups, pull-ups)
				{:else if exerciseType === 'timed'}
					Tracks time/duration (e.g., plank, wall sit)
				{:else if exerciseType === 'cardio'}
					Tracks time and distance (e.g., running, cycling)
				{/if}
			</p>
		</div>

		<!-- Advanced Options (collapsible) -->
		<div class="gb-section">
			<button
				type="button"
				class="gb-advanced-toggle"
				onclick={() => showAdvanced = !showAdvanced}
			>
				<span>Advanced options</span>
				<IconButton
					icon={showAdvanced ? "chevron-down" : "chevron-right"}
					variant="ghost"
					size="sm"
					ariaLabel={showAdvanced ? "Collapse" : "Expand"}
				/>
			</button>

			{#if showAdvanced}
				<div class="gb-advanced-content">
					<!-- Secondary Muscles -->
					<div class="gb-field">
						<span class="gb-label">Secondary muscles</span>
						<div class="gb-muscle-chips gb-muscle-chips--compact">
							{#each AVAILABLE_MUSCLES.filter(m => !selectedMuscles.includes(m)) as muscle}
								<Chip
									size="sm"
									active={secondaryMuscles.includes(muscle)}
									onclick={() => toggleSecondaryMuscle(muscle)}
								>
									{muscle}
								</Chip>
							{/each}
						</div>
					</div>

					<!-- Equipment -->
					<div class="gb-field">
						<label class="gb-label" for="equipment">Equipment</label>
						<Input
							id="equipment"
							bind:value={equipment}
							placeholder="e.g., Barbell, Dumbbell, Cable"
							size="sm"
						/>
					</div>

					<!-- Force -->
					<div class="gb-field">
						<label class="gb-label" for="force">Force type</label>
						<Select
							id="force"
							options={FORCE_OPTIONS}
							bind:value={force}
							size="sm"
						/>
					</div>

					<!-- Instructions -->
					<div class="gb-field">
						<label class="gb-label" for="instructions">Instructions (one per line)</label>
						<textarea
							id="instructions"
							bind:value={instructions}
							placeholder="Step 1: Start position&#10;Step 2: Movement&#10;Step 3: Return"
							class="gb-textarea"
							rows="3"
						></textarea>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Actions -->
	<div class="gb-builder-actions">
		<Button variant="ghost" onclick={cancel}>
			Cancel
		</Button>
		<Button
			variant="primary"
			onclick={save}
			disabled={!isValid}
		>
			{isEditing ? 'Save changes' : 'Create exercise'}
		</Button>
	</div>
</div>

<style>
	.gb-custom-exercise-modal {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		min-width: 400px;
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.gb-type-description {
		margin-top: var(--gb-space-xs);
	}

	.gb-advanced-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--gb-space-sm) 0;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: var(--gb-font-sm);
	}

	.gb-advanced-toggle:hover {
		color: var(--text-normal);
	}

	.gb-advanced-content {
		display: flex;
		flex-direction: column;
		gap: var(--gb-space-lg);
		padding-top: var(--gb-space-md);
		border-top: 1px solid var(--background-modifier-border);
	}

	.gb-field {
		display: flex;
		flex-direction: column;
		gap: var(--gb-space-sm);
	}

	.gb-muscle-chips--compact {
		gap: var(--gb-space-xs);
	}

	.gb-textarea {
		width: 100%;
		padding: var(--gb-space-sm) var(--gb-space-md);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--gb-radius-md);
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: var(--gb-font-sm);
		font-family: inherit;
		resize: vertical;
	}

	.gb-textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}
</style>
