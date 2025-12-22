<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../types';
	import type { AvailableSplit } from '../data/splitTemplates';
	import { getAllAvailableSplits, createCompositeTemplate } from '../data/splitTemplates';

	interface Props {
		builtInTemplates?: SplitTemplate[];
		customTemplates?: SplitTemplate[];
	}

	let { builtInTemplates = [], customTemplates = [] }: Props = $props();

	// Get all available splits grouped by template
	const allSplits = $derived(getAllAvailableSplits(customTemplates));
	
	// Group splits by template for display
	const splitsByTemplate = $derived.by(() => {
		const grouped = new Map<string, {
			template: SplitTemplate;
			splits: AvailableSplit[];
			isCustom: boolean;
		}>();

		// Add built-in templates
		for (const template of builtInTemplates) {
			const templateSplits = allSplits.filter(s => s.templateId === template.id);
			if (templateSplits.length > 0) {
				grouped.set(template.id, {
					template,
					splits: templateSplits,
					isCustom: false,
				});
			}
		}

		// Add custom templates
		for (const template of customTemplates) {
			const templateSplits = allSplits.filter(s => s.templateId === template.id);
			if (templateSplits.length > 0) {
				grouped.set(template.id, {
					template,
					splits: templateSplits,
					isCustom: true,
				});
			}
		}

		return Array.from(grouped.values());
	});

	// Selected splits (using unique IDs)
	let selectedSplitIds = $state<Set<string>>(new Set());
	
	// Template name for saving (optional)
	let templateName = $state('');
	let showSaveOption = $state(false);

	// Track expanded templates
	let expandedTemplates = $state<Set<string>>(new Set());

	function toggleTemplate(templateId: string) {
		const newExpanded = new Set(expandedTemplates);
		if (newExpanded.has(templateId)) {
			newExpanded.delete(templateId);
		} else {
			newExpanded.add(templateId);
		}
		expandedTemplates = newExpanded;
	}

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
		<!-- Templates List -->
		<div class="gym-buddy-templates-section">
			<div class="gym-buddy-section-header">
				<h3>Available Splits</h3>
				<span class="gym-buddy-selected-count">
					{selectedSplits.length} selected
				</span>
			</div>

			<div class="gym-buddy-templates-list">
				{#each splitsByTemplate as { template, splits, isCustom }}
					<div class="gym-buddy-template-group">
						<button
							class="gym-buddy-template-group-header"
							onclick={() => toggleTemplate(template.id)}
						>
							<span class="gym-buddy-template-group-name">
								{template.name}
								{#if isCustom}
									<span class="gym-buddy-template-badge">Custom</span>
								{/if}
							</span>
							<span class="gym-buddy-template-group-toggle">
								{expandedTemplates.has(template.id) ? '▼' : '▶'}
							</span>
						</button>

						{#if expandedTemplates.has(template.id)}
							<div class="gym-buddy-template-splits">
								{#each splits as availableSplit}
									<button
										class="gym-buddy-split-option"
										class:selected={isSplitSelected(availableSplit)}
										onclick={() => toggleSplit(availableSplit)}
									>
										<div class="gym-buddy-split-option-content">
											<div class="gym-buddy-split-option-name">
												{availableSplit.split.name}
											</div>
											<div class="gym-buddy-split-option-muscles">
												{availableSplit.split.muscleGroups.join(', ')}
											</div>
										</div>
										<div class="gym-buddy-split-option-check">
											{#if isSplitSelected(availableSplit)}
												✓
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Selected Splits Preview -->
		{#if selectedSplits.length > 0}
			<div class="gym-buddy-selected-section">
				<div class="gym-buddy-section-header">
					<h3>Selected Splits</h3>
				</div>
				<div class="gym-buddy-selected-splits">
					{#each selectedSplits as availableSplit}
						<div class="gym-buddy-selected-split">
							<div class="gym-buddy-selected-split-info">
								<div class="gym-buddy-selected-split-name">
									{availableSplit.split.name}
								</div>
								<div class="gym-buddy-selected-split-source">
									from {availableSplit.templateName}
								</div>
							</div>
							<button
								class="gym-buddy-remove-split"
								onclick={() => toggleSplit(availableSplit)}
							>
								×
							</button>
						</div>
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