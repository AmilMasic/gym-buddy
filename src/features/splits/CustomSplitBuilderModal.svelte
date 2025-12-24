<script lang="ts">
	import type { AvailableSplit, CustomSplitBuilderProps } from './types';
	import { getAllAvailableSplits, createCompositeTemplate } from './splitTemplates';
	import type { SplitTemplate } from '../../types';
	import { Button, Chip, Input, IconButton } from '../../ui/components';

	let { builtInTemplates = [], customTemplates = [] }: CustomSplitBuilderProps = $props();

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

<div class="gb-custom-split-builder">
	<div class="gb-builder-header">
		<h2>Build Custom Split</h2>
		<p class="gb-builder-subtitle">
			Select splits from any template to create your custom combination
		</p>
	</div>

	<div class="gb-builder-content">
		<!-- Splits Grid -->
		<div class="gb-section">
			<div class="gb-section-header">
				<div class="gb-section-header-content">
					<h3>Available Splits</h3>
					<span class="gb-selected-count">
						{selectedSplits.length} selected
					</span>
				</div>
				<IconButton
					icon={splitsExpanded ? "chevron-down" : "chevron-right"}
					variant="ghost"
					size="sm"
					ariaLabel={splitsExpanded ? "Collapse" : "Expand"}
					onclick={() => splitsExpanded = !splitsExpanded}
				/>
			</div>
			{#if splitsExpanded}
			<div class="gb-split-chips">
				{#each allSplits as availableSplit}
					<Chip
						active={isSplitSelected(availableSplit)}
						onclick={() => toggleSplit(availableSplit)}
					>
						{availableSplit.split.name}
					</Chip>
				{/each}
			</div>
			{/if}
		</div>

		<!-- Selected Splits Preview -->
		{#if selectedSplits.length > 0}
			<div class="gb-section">
				<div class="gb-section-header">
					<h3>Selected Splits ({selectedSplits.length})</h3>
				</div>
				<div class="gb-selected-splits-chips">
					{#each selectedSplits as availableSplit}
						<Chip
							active={true}
							onclick={() => toggleSplit(availableSplit)}
						>
							{availableSplit.split.name}
						</Chip>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Save Option -->
	<div class="gb-save-option">
		<label class="gb-save-toggle">
			<input
				type="checkbox"
				bind:checked={showSaveOption}
			/>
			<span>Save as custom template</span>
		</label>
		{#if showSaveOption}
			<Input
				bind:value={templateName}
				placeholder="Template name (e.g., My Custom Split)"
				size="sm"
				onsubmit={confirmSelection}
			/>
		{/if}
	</div>

	<!-- Actions -->
	<div class="gb-builder-actions">
		<Button variant="ghost" onclick={cancel}>
			Cancel
		</Button>
		<Button
			variant="primary"
			onclick={confirmSelection}
			disabled={selectedSplits.length === 0}
		>
			Continue
		</Button>
	</div>
</div>
