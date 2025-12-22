<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../types';

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
				<button
					class="gym-buddy-confirm-button"
					onclick={confirmSuggested}
				>
					Start {suggestedSplit.name} Workout
				</button>
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
					<button
						class="gym-buddy-split-item"
						onclick={() => selectSplit(split)}
					>
						<div class="gym-buddy-split-name">{split.name}</div>
						<div class="gym-buddy-split-muscles">
							{split.muscleGroups.join(', ')}
						</div>
					</button>
				{/if}
			{/each}
		</div>
	{:else}
		<p class="gym-buddy-no-template">No template configured. Please select a template in settings.</p>
	{/if}
</div>

<style>
	.gym-buddy-split-picker {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.gym-buddy-split-picker-header {
		text-align: center;
	}

	.gym-buddy-split-picker-header h2 {
		margin: 0 0 8px 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-template-name {
		margin: 0;
		font-size: 13px;
		color: var(--text-muted);
	}

	.gym-buddy-split-suggestion {
		background: var(--background-secondary);
		border: 2px solid var(--interactive-accent);
		border-radius: 12px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		text-align: center;
	}

	.gym-buddy-split-suggestion-header {
		display: flex;
		justify-content: center;
	}

	.gym-buddy-today-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--interactive-accent);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.gym-buddy-split-suggestion-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.gym-buddy-suggested-split-name {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-normal);
	}

	.gym-buddy-suggested-split-muscles {
		font-size: 14px;
		color: var(--text-muted);
	}

	.gym-buddy-confirm-button {
		padding: 14px 24px;
		font-size: 16px;
		font-weight: 600;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.gym-buddy-confirm-button:hover {
		filter: brightness(1.1);
	}

	.gym-buddy-divider {
		display: flex;
		align-items: center;
		gap: 16px;
		color: var(--text-muted);
		font-size: 12px;
	}

	.gym-buddy-divider::before,
	.gym-buddy-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--background-modifier-border);
	}

	.gym-buddy-split-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.gym-buddy-split-item {
		padding: 16px;
		text-align: left;
		border: 2px solid var(--background-modifier-border);
		border-radius: 10px;
		background: var(--background-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gym-buddy-split-item:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-split-name {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-split-muscles {
		font-size: 13px;
		color: var(--text-muted);
	}

	.gym-buddy-no-template {
		text-align: center;
		color: var(--text-muted);
		padding: 20px;
	}

	/* Desktop: More compact */
	@media (min-width: 769px) {
		.gym-buddy-split-picker {
			padding: 16px;
			gap: 16px;
		}

		.gym-buddy-split-picker-header h2 {
			font-size: 16px;
		}

		.gym-buddy-split-suggestion {
			padding: 16px;
			gap: 12px;
		}

		.gym-buddy-suggested-split-name {
			font-size: 20px;
		}

		.gym-buddy-confirm-button {
			padding: 12px 20px;
			font-size: 14px;
		}

		.gym-buddy-split-list {
			gap: 8px;
		}

		.gym-buddy-split-item {
			padding: 12px;
			gap: 4px;
		}

		.gym-buddy-split-name {
			font-size: 14px;
		}

		.gym-buddy-split-muscles {
			font-size: 12px;
		}
	}
</style>
