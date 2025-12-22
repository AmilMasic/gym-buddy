<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../types';

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

<style>
	.gym-buddy-custom-split-editor {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.gym-buddy-editor-header h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-empty-state {
		text-align: center;
		padding: 40px 20px;
	}

	.gym-buddy-empty-state p {
		margin-bottom: 16px;
		color: var(--text-muted);
	}

	.gym-buddy-template-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.gym-buddy-template-list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.gym-buddy-template-list-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.gym-buddy-template-item {
		padding: 16px;
		border: 2px solid var(--background-modifier-border);
		border-radius: 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.gym-buddy-template-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 600;
	}

	.gym-buddy-template-info p {
		margin: 0;
		font-size: 14px;
		color: var(--text-muted);
	}

	.gym-buddy-template-actions {
		display: flex;
		gap: 8px;
	}

	.gym-buddy-editor-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.gym-buddy-form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.gym-buddy-form-group label {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-form-group input {
		padding: 10px 12px;
		font-size: 14px;
		border: 2px solid var(--background-modifier-border);
		border-radius: 6px;
		background: var(--background-primary);
		color: var(--text-normal);
	}

	.gym-buddy-form-group input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.gym-buddy-form-group small {
		font-size: 12px;
		color: var(--text-muted);
	}

	.gym-buddy-splits-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.gym-buddy-splits-section h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.gym-buddy-split-item {
		padding: 12px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		background: var(--background-secondary);
	}

	.gym-buddy-split-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.gym-buddy-split-name {
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-split-muscles {
		font-size: 14px;
		color: var(--text-muted);
	}

	.gym-buddy-add-split {
		padding: 16px;
		border: 2px dashed var(--background-modifier-border);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.gym-buddy-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.gym-buddy-button-primary,
	.gym-buddy-button-secondary,
	.gym-buddy-button-danger {
		padding: 10px 16px;
		font-size: 14px;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.gym-buddy-button-primary {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.gym-buddy-button-primary:hover {
		background: var(--interactive-accent-hover);
	}

	.gym-buddy-button-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.gym-buddy-button-secondary {
		background: var(--background-modifier-border);
		color: var(--text-normal);
	}

	.gym-buddy-button-secondary:hover {
		background: var(--background-modifier-hover);
	}

	.gym-buddy-button-danger {
		background: var(--text-error);
		color: var(--text-on-accent);
	}

	.gym-buddy-button-danger:hover {
		opacity: 0.9;
	}

	.gym-buddy-button-danger-small {
		padding: 4px 8px;
		font-size: 12px;
		background: var(--text-error);
		color: var(--text-on-accent);
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.gym-buddy-button-danger-small:hover {
		opacity: 0.9;
	}

	/* Desktop: More compact UI */
	@media (min-width: 769px) {
		.gym-buddy-custom-split-editor {
			padding: 12px;
			gap: 16px;
		}

		.gym-buddy-editor-header h2 {
			font-size: 16px;
		}

		.gym-buddy-empty-state {
			padding: 24px 16px;
		}

		.gym-buddy-template-list {
			gap: 10px;
		}

		.gym-buddy-template-item {
			padding: 10px 12px;
		}

		.gym-buddy-template-info h4 {
			font-size: 14px;
		}

		.gym-buddy-template-info p {
			font-size: 12px;
		}

		.gym-buddy-editor-form {
			gap: 16px;
		}

		.gym-buddy-form-group {
			gap: 6px;
		}

		.gym-buddy-form-group label {
			font-size: 12px;
		}

		.gym-buddy-form-group input {
			padding: 6px 10px;
			font-size: 13px;
		}

		.gym-buddy-splits-section {
			gap: 12px;
		}

		.gym-buddy-splits-section h3 {
			font-size: 14px;
		}

		.gym-buddy-split-item {
			padding: 8px 10px;
		}

		.gym-buddy-split-name {
			font-size: 13px;
		}

		.gym-buddy-split-muscles {
			font-size: 11px;
		}

		.gym-buddy-add-split {
			padding: 12px;
			gap: 10px;
		}

		.gym-buddy-button-primary,
		.gym-buddy-button-secondary,
		.gym-buddy-button-danger {
			padding: 6px 12px;
			font-size: 12px;
		}

		.gym-buddy-button-danger-small {
			padding: 3px 6px;
			font-size: 11px;
		}
	}
</style>

