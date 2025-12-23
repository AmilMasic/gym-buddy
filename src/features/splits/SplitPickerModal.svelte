<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../../types';
	import { Button, Card } from '../../ui/components';

	interface Props {
		template?: SplitTemplate;
		suggestedSplit?: TrainingSplit | null;
		todayName?: string;
	}

	let { template, suggestedSplit = null, todayName = "" }: Props = $props();

	function selectSplit(split: TrainingSplit) {
		const event = new CustomEvent('select-split', {
			detail: { split },
		});
		document.dispatchEvent(event);
	}

	function confirmSuggested() {
		if (suggestedSplit) {
			selectSplit(suggestedSplit);
		}
	}
</script>

<div class="gb-split-picker">
	{#if template}
		{#if suggestedSplit}
			<!-- Today's scheduled split suggestion -->
			<div class="gb-split-suggestion">
				<div class="gb-split-suggestion-header">
					<span class="gb-today-label">{todayName}</span>
				</div>
				<div class="gb-split-suggestion-content">
					<div class="gb-suggested-split-name">{suggestedSplit.name}</div>
					<div class="gb-suggested-split-muscles">
						{suggestedSplit.muscleGroups.join(', ')}
					</div>
				</div>
				<Button variant="primary" size="lg" fullWidth onclick={confirmSuggested}>
					Start {suggestedSplit.name} Workout
				</Button>
			</div>

			<div class="gb-divider">
				<span>or choose a different split</span>
			</div>
		{:else}
			<div class="gb-split-picker-header">
				<h2>What are you training today?</h2>
				<p class="gb-template-name">{template.name}</p>
			</div>
		{/if}

		<div class="gb-split-list">
			{#each template.splits as split}
				{#if !suggestedSplit || split.id !== suggestedSplit.id}
					<Card clickable onclick={() => selectSplit(split)}>
						<div class="gb-split-name">{split.name}</div>
						<div class="gb-split-muscles">
							{split.muscleGroups.join(', ')}
						</div>
					</Card>
				{/if}
			{/each}
		</div>
	{:else}
		<p class="gb-no-template">No template configured. Please select a template in settings.</p>
	{/if}
</div>
