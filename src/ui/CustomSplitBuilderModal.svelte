<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../types';
	import type { AvailableSplit } from '../data/splitTemplates';
	import { getAllAvailableSplits, createCompositeTemplate } from '../data/splitTemplates';

	interface Props {
		builtInTemplates?: SplitTemplate[];
		customTemplates?: SplitTemplate[];
	}

	let { builtInTemplates = [], customTemplates = [] }: Props = $props();

	// Get all available splits (exclude hybrid template splits)
	const allSplits = $derived(
		getAllAvailableSplits(customTemplates).filter(
			split => split.templateId !== 'hybrid'
		)
	);

	// Selected splits (using unique IDs)
	let selectedSplitIds = $state<Set<string>>(new Set());
	
	// Template name for saving (optional)
	let templateName = $state('');
	let showSaveOption = $state(false);

	// Track expanded state for splits section
	let splitsExpanded = $state(true);

	function toggleSplit(availableSplit: AvailableSplit) {
		const uniqueId = `${availableSplit.templateId}-${availableSplit.split.id}`;
		const newSelected = new Set(selectedSplitIds);
		
		if (newSelected.has(uniqueId)) {
			newSelected.delete(uniqueId);
		} else {
			newSelected.add(uniqueId);
		}
		
		selectedSplitIds = newSelected;
	}

	function isSplitSelected(availableSplit: AvailableSplit): boolean {
		const uniqueId = `${availableSplit.templateId}-${availableSplit.split.id}`;
		return selectedSplitIds.has(uniqueId);
	}

	const selectedSplits = $derived(
		allSplits.filter(s => {
			const uniqueId = `${s.templateId}-${s.split.id}`;
			return selectedSplitIds.has(uniqueId);
		})
	);

	function confirmSelection() {
		if (selectedSplits.length === 0) return;

		// Create composite template
		const compositeTemplate = createCompositeTemplate(
			templateName || 'Custom Split',
			selectedSplits
		);

		const event = new CustomEvent('custom-splits-selected', {
			detail: {
				template: compositeTemplate,
				saveAsTemplate: showSaveOption && templateName.trim().length > 0,
			},
		});
		document.dispatchEvent(event);
	}

	function cancel() {
		const event = new CustomEvent('custom-splits-cancelled');
		document.dispatchEvent(event);
	}
</script>

<div class="gym-buddy-custom-split-builder">
	<div class="gym-buddy-builder-header">
		<h2>Build Custom Split</h2>
		<p class="gym-buddy-builder-subtitle">
			Select splits from any template to create your custom combination
		</p>
	</div>

	<div class="gym-buddy-builder-content">
		<!-- Splits Grid -->
		<div class="gym-buddy-section">
			<div class="gym-buddy-section-header">
				<div class="gym-buddy-section-header-content">
					<h3>Available Splits</h3>
					<span class="gym-buddy-selected-count">
						{selectedSplits.length} selected
					</span>
				</div>
				<button
					class="gym-buddy-collapse-toggle"
					onclick={() => splitsExpanded = !splitsExpanded}
					title={splitsExpanded ? "Collapse" : "Expand"}
				>
					{splitsExpanded ? '▼' : '▶'}
				</button>
			</div>
			{#if splitsExpanded}
			<div class="gym-buddy-split-chips">
				{#each allSplits as availableSplit}
					<button
						class="gym-buddy-split-chip"
						class:active={isSplitSelected(availableSplit)}
						onclick={() => toggleSplit(availableSplit)}
						title={availableSplit.split.muscleGroups.join(', ')}
					>
						{availableSplit.split.name}
					</button>
				{/each}
			</div>
			{/if}
		</div>

		<!-- Selected Splits Preview -->
		{#if selectedSplits.length > 0}
			<div class="gym-buddy-section">
				<div class="gym-buddy-section-header">
					<h3>Selected Splits ({selectedSplits.length})</h3>
				</div>
				<div class="gym-buddy-selected-splits-chips">
					{#each selectedSplits as availableSplit}
						<button
							class="gym-buddy-split-chip active"
							onclick={() => toggleSplit(availableSplit)}
							title={availableSplit.split.muscleGroups.join(', ')}
						>
							{availableSplit.split.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Save Option -->
	<div class="gym-buddy-save-option">
		<label class="gym-buddy-save-toggle">
			<input
				type="checkbox"
				bind:checked={showSaveOption}
			/>
			<span>Save as custom template</span>
		</label>
		{#if showSaveOption}
			<input
				type="text"
				class="gym-buddy-template-name-input"
				placeholder="Template name (e.g., My Custom Split)"
				bind:value={templateName}
			/>
		{/if}
	</div>

	<!-- Actions -->
	<div class="gym-buddy-builder-actions">
		<button class="gym-buddy-btn-secondary" onclick={cancel}>
			Cancel
		</button>
		<button
			class="gym-buddy-btn-primary"
			onclick={confirmSelection}
			disabled={selectedSplits.length === 0}
		>
			Continue
		</button>
	</div>
</div>