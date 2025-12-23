<script lang="ts">
	import type { CustomSplitEditorProps } from './types';
	import type { SplitTemplate, TrainingSplit } from '../../types';
	import { Button, Input } from '../../ui/components';

	let { customTemplates = [], builtInTemplates = [] }: CustomSplitEditorProps = $props();

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

<div class="gb-custom-split-editor">
	<div class="gb-editor-header">
		<h2>Custom Split Templates</h2>
	</div>

	{#if !editingTemplate && customTemplates.length === 0}
		<div class="gb-empty-state">
			<p>No custom splits yet. Create your first one!</p>
			<Button variant="primary" onclick={startNewTemplate}>
				Create New Split Template
			</Button>
		</div>
	{:else if !editingTemplate}
		<div class="gb-template-list">
			<div class="gb-template-list-header">
				<h3>Your Custom Splits</h3>
				<Button variant="primary" size="sm" onclick={startNewTemplate}>
					+ New Template
				</Button>
			</div>
			{#each customTemplates as template}
				<div class="gb-template-item">
					<div class="gb-template-info">
						<h4>{template.name}</h4>
						<p>{template.splits.length} split{template.splits.length !== 1 ? 's' : ''}</p>
					</div>
					<div class="gb-template-actions">
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
		<div class="gb-editor-form">
			<Input
				bind:value={templateName}
				label="Template Name"
				placeholder="e.g., My Custom Split"
				id="template-name-input"
			/>

			<div class="gb-splits-section">
				<h3>Splits</h3>
				{#each splits as split, index}
					<div class="gb-split-item">
						<div class="gb-split-header">
							<span class="gb-split-name">{split.name}</span>
							<Button variant="danger" size="sm" onclick={() => removeSplit(index)}>
								Remove
							</Button>
						</div>
						<div class="gb-split-muscles">
							{split.muscleGroups.join(', ')}
						</div>
					</div>
				{/each}

				<div class="gb-add-split">
					<Input
						bind:value={currentSplitName}
						label="Split Name"
						placeholder="e.g., Push Day"
						id="split-name-input"
					/>
					<div class="gb-form-group">
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

			<div class="gb-form-actions">
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
