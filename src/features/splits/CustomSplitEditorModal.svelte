<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../../types';

	interface Props {
		customTemplates?: SplitTemplate[];
		builtInTemplates?: SplitTemplate[];
	}

	let { customTemplates = [], builtInTemplates = [] }: Props = $props();

	let editingTemplate: SplitTemplate | null = $state(null);
	let templateName = $state('');
	let splits: TrainingSplit[] = $state([]);
	let currentSplitName = $state('');
	let currentMuscleGroups = $state('');

	const availableMuscles = [
		'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Traps',
		'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs',
		'Forearms', 'Rear Delts', 'Adductors', 'Abductors'
	];

	function startNewTemplate() {
		editingTemplate = null;
		templateName = '';
		splits = [];
		currentSplitName = '';
		currentMuscleGroups = '';
	}

	function startEditTemplate(template: SplitTemplate) {
		editingTemplate = template;
		templateName = template.name;
		splits = [...template.splits];
		currentSplitName = '';
		currentMuscleGroups = '';
	}

	function addSplit() {
		if (!currentSplitName.trim()) return;
		
		const muscleGroups = currentMuscleGroups
			.split(',')
			.map(m => m.trim())
			.filter(m => m.length > 0);

		if (muscleGroups.length === 0) return;

		const newSplit: TrainingSplit = {
			id: `${templateName.toLowerCase().replace(/\s+/g, '-')}-${splits.length + 1}`,
			name: currentSplitName.trim(),
			muscleGroups,
		};

		splits = [...splits, newSplit];
		currentSplitName = '';
		currentMuscleGroups = '';
	}

	function removeSplit(index: number) {
		splits = splits.filter((_, i) => i !== index);
	}

	function saveTemplate() {
		if (!templateName.trim() || splits.length === 0) return;

		const template: SplitTemplate = {
			id: editingTemplate?.id || `custom-${Date.now()}`,
			name: templateName.trim(),
			splits,
			isCustom: true,
		};

		const event = new CustomEvent('save-split-template', {
			detail: { template },
		});
		document.dispatchEvent(event);
	}

	function deleteTemplate(templateId: string) {
		const event = new CustomEvent('delete-split-template', {
			detail: { templateId },
		});
		document.dispatchEvent(event);
	}

	function cancelEdit() {
		editingTemplate = null;
		templateName = '';
		splits = [];
		currentSplitName = '';
		currentMuscleGroups = '';
	}
</script>

<div class="gym-buddy-custom-split-editor">
	<div class="gym-buddy-editor-header">
		<h2>Custom Split Templates</h2>
	</div>

	{#if !editingTemplate && customTemplates.length === 0}
		<div class="gym-buddy-empty-state">
			<p>No custom splits yet. Create your first one!</p>
			<button class="gym-buddy-button-primary" onclick={startNewTemplate}>
				Create New Split Template
			</button>
		</div>
	{:else if !editingTemplate}
		<div class="gym-buddy-template-list">
			<div class="gym-buddy-template-list-header">
				<h3>Your Custom Splits</h3>
				<button class="gym-buddy-button-primary" onclick={startNewTemplate}>
					+ New Template
				</button>
			</div>
			{#each customTemplates as template}
				<div class="gym-buddy-template-item">
					<div class="gym-buddy-template-info">
						<h4>{template.name}</h4>
						<p>{template.splits.length} split{template.splits.length !== 1 ? 's' : ''}</p>
					</div>
					<div class="gym-buddy-template-actions">
						<button class="gym-buddy-button-secondary" onclick={() => startEditTemplate(template)}>
							Edit
						</button>
						<button class="gym-buddy-button-danger" onclick={() => deleteTemplate(template.id)}>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="gym-buddy-editor-form">
			<div class="gym-buddy-form-group">
				<label for="template-name-input">Template Name</label>
				<input
					id="template-name-input"
					type="text"
					bind:value={templateName}
					placeholder="e.g., My Custom Split"
				/>
			</div>

			<div class="gym-buddy-splits-section">
				<h3>Splits</h3>
				{#each splits as split, index}
					<div class="gym-buddy-split-item">
						<div class="gym-buddy-split-header">
							<span class="gym-buddy-split-name">{split.name}</span>
							<button class="gym-buddy-button-danger-small" onclick={() => removeSplit(index)}>
								Remove
							</button>
						</div>
						<div class="gym-buddy-split-muscles">
							{split.muscleGroups.join(', ')}
						</div>
					</div>
				{/each}

				<div class="gym-buddy-add-split">
					<div class="gym-buddy-form-group">
						<label for="split-name-input">Split Name</label>
						<input
							id="split-name-input"
							type="text"
							bind:value={currentSplitName}
							placeholder="e.g., Push Day"
						/>
					</div>
					<div class="gym-buddy-form-group">
						<label for="muscle-groups-input">Muscle Groups (comma-separated)</label>
						<input
							id="muscle-groups-input"
							type="text"
							bind:value={currentMuscleGroups}
							placeholder="e.g., Chest, Shoulders, Triceps"
						/>
						<small>Available: {availableMuscles.join(', ')}</small>
					</div>
					<button class="gym-buddy-button-secondary" onclick={addSplit}>
						Add Split
					</button>
				</div>
			</div>

			<div class="gym-buddy-form-actions">
				<button class="gym-buddy-button-secondary" onclick={cancelEdit}>
					Cancel
				</button>
				<button class="gym-buddy-button-primary" onclick={saveTemplate} disabled={!templateName.trim() || splits.length === 0}>
					Save Template
				</button>
			</div>
		</div>
	{/if}
</div>

