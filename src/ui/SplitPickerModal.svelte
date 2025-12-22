<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../types';

	interface Props {
		template?: SplitTemplate;
	}

	let { template }: Props = $props();

	function selectSplit(split: TrainingSplit) {
		const event = new CustomEvent('select-split', {
			detail: { split },
		});
		document.dispatchEvent(event);
	}
</script>

<div class="gym-buddy-split-picker">
	{#if template}
		<div class="gym-buddy-split-picker-header">
			<h2>{template.name}</h2>
			<p class="gym-buddy-split-picker-subtitle">Select today's split</p>
		</div>

		<div class="gym-buddy-split-list">
			{#each template.splits as split}
				<button
					class="gym-buddy-split-item"
					onclick={() => selectSplit(split)}
				>
					<div class="gym-buddy-split-name">{split.name}</div>
					<div class="gym-buddy-split-muscles">
						{split.muscleGroups.join(', ')}
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<p>No template available</p>
	{/if}
</div>

<style>
	.gym-buddy-split-picker {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.gym-buddy-split-picker-header {
		text-align: center;
	}

	.gym-buddy-split-picker-header h2 {
		margin: 0 0 8px 0;
		font-size: 20px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-split-picker-subtitle {
		margin: 0;
		font-size: 14px;
		color: var(--text-muted);
	}

	.gym-buddy-split-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.gym-buddy-split-item {
		padding: 16px;
		text-align: left;
		border: 2px solid var(--background-modifier-border);
		border-radius: 8px;
		background: var(--background-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 60px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.gym-buddy-split-item:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.gym-buddy-split-name {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-split-muscles {
		font-size: 14px;
		color: var(--text-muted);
	}

	/* Desktop: More compact UI */
	@media (min-width: 769px) {
		.gym-buddy-split-picker {
			padding: 12px;
			gap: 16px;
		}

		.gym-buddy-split-picker-header h2 {
			font-size: 16px;
			margin-bottom: 4px;
		}

		.gym-buddy-split-picker-subtitle {
			font-size: 12px;
		}

		.gym-buddy-split-list {
			gap: 8px;
		}

		.gym-buddy-split-item {
			padding: 10px 12px;
			min-height: 48px;
			gap: 6px;
		}

		.gym-buddy-split-name {
			font-size: 14px;
		}

		.gym-buddy-split-muscles {
			font-size: 12px;
		}
	}
</style>

