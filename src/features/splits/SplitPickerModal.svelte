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

<div class="gym-buddy-split-picker">
	{#if template}
		{#if suggestedSplit}
			<!-- Today's scheduled split suggestion -->
			<div class="gym-buddy-split-suggestion">
				<div class="gym-buddy-split-suggestion-header">
					<span class="gym-buddy-today-label">{todayName}</span>
				</div>
				<div class="gym-buddy-split-suggestion-content">
					<div class="gym-buddy-suggested-split-name">{suggestedSplit.name}</div>
					<div class="gym-buddy-suggested-split-muscles">
						{suggestedSplit.muscleGroups.join(', ')}
					</div>
				</div>
				<Button variant="primary" size="lg" fullWidth onclick={confirmSuggested}>
					Start {suggestedSplit.name} Workout
				</Button>
			</div>

			<div class="gym-buddy-divider">
				<span>or choose a different split</span>
			</div>
		{:else}
			<div class="gym-buddy-split-picker-header">
				<h2>What are you training today?</h2>
				<p class="gym-buddy-template-name">{template.name}</p>
			</div>
		{/if}

		<div class="gym-buddy-split-list">
			{#each template.splits as split}
				{#if !suggestedSplit || split.id !== suggestedSplit.id}
					<Card clickable onclick={() => selectSplit(split)}>
						<div class="gym-buddy-split-name">{split.name}</div>
						<div class="gym-buddy-split-muscles">
							{split.muscleGroups.join(', ')}
						</div>
					</Card>
				{/if}
			{/each}
		</div>
	{:else}
		<p class="gym-buddy-no-template">No template configured. Please select a template in settings.</p>
	{/if}
</div>
