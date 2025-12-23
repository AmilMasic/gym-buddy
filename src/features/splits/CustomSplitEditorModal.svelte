<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../../types';
	import { Button, Input } from '../../ui/components';

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
			<Button variant="primary" onclick={startNewTemplate}>
				Create New Split Template
			</Button>
		</div>
	{:else if !editingTemplate}
		<div class="gym-buddy-template-list">
			<div class="gym-buddy-template-list-header">
				<h3>Your Custom Splits</h3>
				<Button variant="primary" size="sm" onclick={startNewTemplate}>
					+ New Template
				</Button>
			</div>
			{#each customTemplates as template}
				<div class="gym-buddy-template-item">
					<div class="gym-buddy-template-info">
						<h4>{template.name}</h4>
						<p>{template.splits.length} split{template.splits.length !== 1 ? 's' : ''}</p>
					</div>
					<div class="gym-buddy-template-actions">
						<Button variant="ghost" size="sm" onclick={() => startEditTemplate(template)}>
							Edit
						</Button>
						<Button variant="danger" size="sm" onclick={() => deleteTemplate(template.id)}>
							Delete
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="gym-buddy-editor-form">
			<Input
				bind:value={templateName}
				label="Template Name"
				placeholder="e.g., My Custom Split"
				id="template-name-input"
			/>

			<div class="gym-buddy-splits-section">
				<h3>Splits</h3>
				{#each splits as split, index}
					<div class="gym-buddy-split-item">
						<div class="gym-buddy-split-header">
							<span class="gym-buddy-split-name">{split.name}</span>
							<Button variant="danger" size="sm" onclick={() => removeSplit(index)}>
								Remove
							</Button>
						</div>
						<div class="gym-buddy-split-muscles">
							{split.muscleGroups.join(', ')}
						</div>
					</div>
				{/each}

				<div class="gym-buddy-add-split">
					<Input
						bind:value={currentSplitName}
						label="Split Name"
						placeholder="e.g., Push Day"
						id="split-name-input"
					/>
					<div class="gym-buddy-form-group">
						<Input
							bind:value={currentMuscleGroups}
							label="Muscle Groups (comma-separated)"
							placeholder="e.g., Chest, Shoulders, Triceps"
							id="muscle-groups-input"
						/>
						<small>Available: {availableMuscles.join(', ')}</small>
					</div>
					<Button variant="ghost" onclick={addSplit}>
						Add Split
					</Button>
				</div>
			</div>

			<div class="gym-buddy-form-actions">
				<Button variant="ghost" onclick={cancelEdit}>
					Cancel
				</Button>
				<Button variant="primary" onclick={saveTemplate} disabled={!templateName.trim() || splits.length === 0}>
					Save Template
				</Button>
			</div>
		</div>
	{/if}
</div>
