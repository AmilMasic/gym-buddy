<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../types';
	import type { WeeklySchedule } from '../settings';

	interface Props {
		templates?: SplitTemplate[];
		currentTemplateId?: string;
		currentSchedule?: WeeklySchedule;
	}

	let { 
		templates = [], 
		currentTemplateId = "",
		currentSchedule = {}
	}: Props = $props();

	// Setup wizard steps
	type Step = 'template' | 'schedule' | 'confirm';
	let currentStep = $state<Step>('template');

	// Selected values - initialize from props
	let selectedTemplateId = $state("");
	let schedule = $state<WeeklySchedule>({});

	// Initialize state from props on mount
	$effect(() => {
		if (currentTemplateId && !selectedTemplateId) {
			selectedTemplateId = currentTemplateId;
		}
	});
	
	$effect(() => {
		if (currentSchedule && Object.keys(currentSchedule).length > 0 && Object.keys(schedule).length === 0) {
			schedule = { ...currentSchedule };
		}
	});

	const selectedTemplate = $derived(templates.find(t => t.id === selectedTemplateId));

	const days = [
		{ key: 'monday', label: 'Monday', short: 'Mon' },
		{ key: 'tuesday', label: 'Tuesday', short: 'Tue' },
		{ key: 'wednesday', label: 'Wednesday', short: 'Wed' },
		{ key: 'thursday', label: 'Thursday', short: 'Thu' },
		{ key: 'friday', label: 'Friday', short: 'Fri' },
		{ key: 'saturday', label: 'Saturday', short: 'Sat' },
		{ key: 'sunday', label: 'Sunday', short: 'Sun' },
	] as const;

	function selectTemplate(templateId: string) {
		selectedTemplateId = templateId;
		// Reset schedule when changing template
		schedule = {};
	}

	function nextStep() {
		if (currentStep === 'template' && selectedTemplateId) {
			currentStep = 'schedule';
		} else if (currentStep === 'schedule') {
			currentStep = 'confirm';
		}
	}

	function prevStep() {
		if (currentStep === 'schedule') {
			currentStep = 'template';
		} else if (currentStep === 'confirm') {
			currentStep = 'schedule';
		}
	}

	function setDaySplit(day: string, splitId: string | null) {
		if (splitId === null || splitId === '') {
			const newSchedule = { ...schedule };
			delete newSchedule[day as keyof WeeklySchedule];
			schedule = newSchedule;
		} else {
			schedule = { ...schedule, [day]: splitId };
		}
	}

	function confirmSetup() {
		const event = new CustomEvent('confirm-setup', {
			detail: { 
				templateId: selectedTemplateId, 
				schedule 
			},
		});
		document.dispatchEvent(event);
	}

	function skipSchedule() {
		schedule = {};
		currentStep = 'confirm';
	}

	// Get schedule summary for confirm step
	const scheduleSummary = $derived.by(() => {
		if (!selectedTemplate) return [];
		return days
			.filter(d => schedule[d.key as keyof WeeklySchedule])
			.map(d => {
				const splitId = schedule[d.key as keyof WeeklySchedule];
				const split = selectedTemplate.splits.find(s => s.id === splitId);
				return { day: d.short, split: split?.name || '?' };
			});
	});

	const hasSchedule = $derived(Object.keys(schedule).some(k => schedule[k as keyof WeeklySchedule]));
</script>

<div class="gym-buddy-training-setup">
	<!-- Progress indicator -->
	<div class="gym-buddy-setup-progress">
		<div class="gym-buddy-progress-step" class:active={currentStep === 'template'} class:completed={currentStep !== 'template'}>
			<span class="gym-buddy-progress-number">1</span>
			<span class="gym-buddy-progress-label">Template</span>
		</div>
		<div class="gym-buddy-progress-line" class:completed={currentStep !== 'template'}></div>
		<div class="gym-buddy-progress-step" class:active={currentStep === 'schedule'} class:completed={currentStep === 'confirm'}>
			<span class="gym-buddy-progress-number">2</span>
			<span class="gym-buddy-progress-label">Schedule</span>
		</div>
		<div class="gym-buddy-progress-line" class:completed={currentStep === 'confirm'}></div>
		<div class="gym-buddy-progress-step" class:active={currentStep === 'confirm'}>
			<span class="gym-buddy-progress-number">3</span>
			<span class="gym-buddy-progress-label">Confirm</span>
		</div>
	</div>

	<!-- Step 1: Template Selection -->
	{#if currentStep === 'template'}
		<div class="gym-buddy-setup-step">
			<h2>Choose your training split</h2>
			<p class="gym-buddy-setup-subtitle">Select how you want to organize your workouts</p>

			<div class="gym-buddy-template-grid">
				{#each templates as template}
					<button
						class="gym-buddy-template-card"
						class:selected={selectedTemplateId === template.id}
						onclick={() => selectTemplate(template.id)}
					>
						<div class="gym-buddy-template-header">
							<div class="gym-buddy-template-name">{template.name}</div>
							<div class="gym-buddy-template-info-wrapper">
								<span class="gym-buddy-template-info-icon" title={template.splits.map(s => s.name).join(' • ')}>ℹ️</span>
								<div class="gym-buddy-template-tooltip">
									<div class="gym-buddy-tooltip-title">Splits:</div>
									<div class="gym-buddy-tooltip-content">
										{template.splits.map(s => s.name).join(' • ')}
									</div>
								</div>
							</div>
						</div>
						{#if template.isCustom}
							<span class="gym-buddy-template-badge">Custom</span>
						{/if}
					</button>
				{/each}
			</div>

			<div class="gym-buddy-setup-actions">
				<button 
					class="gym-buddy-btn-primary" 
					onclick={nextStep}
					disabled={!selectedTemplateId}
				>
					Continue
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 2: Weekly Schedule -->
	{#if currentStep === 'schedule'}
		<div class="gym-buddy-setup-step">
			<h2>Set your weekly schedule</h2>
			<p class="gym-buddy-setup-subtitle">Assign splits to days for auto-detection (optional)</p>

			{#if selectedTemplate}
				<div class="gym-buddy-schedule-grid">
					{#each days as day}
						<div class="gym-buddy-schedule-row">
							<span class="gym-buddy-schedule-day">{day.label}</span>
							<div class="gym-buddy-schedule-select-wrapper">
								<select 
									class="gym-buddy-schedule-select"
									bind:value={schedule[day.key as keyof WeeklySchedule]}
									onchange={(e) => setDaySplit(day.key, e.currentTarget.value || null)}
								>
									<option value="">Rest / Off</option>
									{#each selectedTemplate.splits as split}
										<option value={split.id}>{split.name}</option>
									{/each}
								</select>
								<span class="gym-buddy-schedule-select-arrow">▼</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="gym-buddy-setup-actions">
				<button class="gym-buddy-btn-secondary" onclick={prevStep}>
					Back
				</button>
				<button class="gym-buddy-btn-text" onclick={skipSchedule}>
					Skip
				</button>
				<button class="gym-buddy-btn-primary" onclick={nextStep}>
					Continue
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Confirmation -->
	{#if currentStep === 'confirm'}
		<div class="gym-buddy-setup-step">
			<h2>Ready to go!</h2>
			<p class="gym-buddy-setup-subtitle">Review your training configuration</p>

			<div class="gym-buddy-confirm-summary">
				<div class="gym-buddy-confirm-section">
					<h3>Training Split</h3>
					<div class="gym-buddy-confirm-value">{selectedTemplate?.name || 'None'}</div>
					{#if selectedTemplate}
						<div class="gym-buddy-confirm-splits">
							{#each selectedTemplate.splits as split}
								<span class="gym-buddy-split-chip">{split.name}</span>
							{/each}
						</div>
					{/if}
				</div>

				<div class="gym-buddy-confirm-section">
					<h3>Weekly Schedule</h3>
					{#if hasSchedule}
						<div class="gym-buddy-confirm-schedule">
							{#each scheduleSummary as item}
								<div class="gym-buddy-schedule-item">
									<span class="gym-buddy-schedule-item-day">{item.day}</span>
									<span class="gym-buddy-schedule-item-split">{item.split}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="gym-buddy-confirm-value gym-buddy-muted">
							No schedule set — you'll choose your split each workout
						</div>
					{/if}
				</div>
			</div>

			<div class="gym-buddy-setup-actions">
				<button class="gym-buddy-btn-secondary" onclick={prevStep}>
					Back
				</button>
				<button class="gym-buddy-btn-primary" onclick={confirmSetup}>
					Save Configuration
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.gym-buddy-training-setup {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		min-width: 400px;
		max-width: 600px;
	}

	/* Progress indicator */
	.gym-buddy-setup-progress {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding-bottom: 8px;
	}

	.gym-buddy-progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		opacity: 0.4;
		transition: opacity 0.2s ease;
	}

	.gym-buddy-progress-step.active,
	.gym-buddy-progress-step.completed {
		opacity: 1;
	}

	.gym-buddy-progress-number {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--background-modifier-border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-muted);
		transition: all 0.2s ease;
	}

	.gym-buddy-progress-step.active .gym-buddy-progress-number {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.gym-buddy-progress-step.completed .gym-buddy-progress-number {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.gym-buddy-progress-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.gym-buddy-progress-line {
		width: 40px;
		height: 2px;
		background: var(--background-modifier-border);
		margin-bottom: 20px;
		transition: background 0.2s ease;
	}

	.gym-buddy-progress-line.completed {
		background: var(--interactive-accent);
	}

	/* Step content */
	.gym-buddy-setup-step {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.gym-buddy-setup-step h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--text-normal);
		text-align: center;
	}

	.gym-buddy-setup-subtitle {
		margin: -12px 0 0 0;
		font-size: 14px;
		color: var(--text-muted);
		text-align: center;
	}

	/* Template grid */
	.gym-buddy-template-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.gym-buddy-template-card {
		padding: 16px;
		text-align: left;
		border: 2px solid var(--background-modifier-border);
		border-radius: 10px;
		background: var(--background-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
	}

	.gym-buddy-template-card:hover {
		background: var(--background-modifier-hover);
		border-color: var(--interactive-accent-hover);
	}

	.gym-buddy-template-card.selected {
		border-color: var(--interactive-accent);
		background: var(--background-secondary);
	}

	.gym-buddy-template-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.gym-buddy-template-name {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-normal);
		flex: 1;
	}

	.gym-buddy-template-info-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.gym-buddy-template-info-icon {
		display: inline-block;
		font-size: 16px;
		cursor: help;
		opacity: 0.6;
		transition: opacity 0.2s ease;
		line-height: 1;
	}

	.gym-buddy-template-info-icon:hover {
		opacity: 1;
	}

	.gym-buddy-template-tooltip {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 8px;
		padding: 10px 12px;
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
		z-index: 1000;
		min-width: 200px;
	}

	.gym-buddy-template-info-wrapper:hover .gym-buddy-template-tooltip {
		opacity: 1;
		pointer-events: auto;
	}

	.gym-buddy-tooltip-title {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	.gym-buddy-tooltip-content {
		font-size: 13px;
		color: var(--text-normal);
		white-space: normal;
		line-height: 1.4;
	}

	.gym-buddy-template-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		padding: 2px 8px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-radius: 4px;
	}

	/* Schedule grid */
	.gym-buddy-schedule-grid {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.gym-buddy-schedule-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.gym-buddy-schedule-day {
		width: 100px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-normal);
	}

	.gym-buddy-schedule-select-wrapper {
		flex: 1;
		position: relative;
		overflow: visible;
	}

	.gym-buddy-schedule-select {
		width: 100%;
		height: 48px;
		font-size: 12px;
		font-weight: 500;
		border: 2px solid var(--background-modifier-border);
		border-radius: 6px;
		background: var(--background-primary);
		color: var(--text-normal);
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
		overflow: visible !important;
		vertical-align: middle !important;
		text-overflow: clip !important;
	}

	/* Force text color and spacing - use important to override Obsidian's theme styles */
	/* .gym-buddy-schedule-select {
		color: var(--text-normal) !important;
		-webkit-text-fill-color: var(--text-normal) !important;
		padding-top: 24px !important;
		padding-bottom: 24px !important;
		height: 68px !important;
		line-height: 1.7 !important;
		overflow: visible !important;
		text-overflow: clip !important;
		white-space: normal !important;
	} */

	.gym-buddy-schedule-select option {
		color: var(--text-normal) !important;
		background-color: var(--background-primary) !important;
		-webkit-text-fill-color: var(--text-normal) !important;
		padding: 12px;
		font-size: 15px;
		min-height: 40px;
	}

	.gym-buddy-schedule-select:hover {
		border-color: var(--interactive-accent-hover);
		color: var(--text-normal) !important;
		-webkit-text-fill-color: var(--text-normal) !important;
	}

	.gym-buddy-schedule-select:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--interactive-accent-rgb, rgba(var(--interactive-accent-rgb), 0.2));
		color: var(--text-normal) !important;
		-webkit-text-fill-color: var(--text-normal) !important;
	}

	/* Selected option styling */
	.gym-buddy-schedule-select option:checked {
		background: var(--interactive-accent) !important;
		color: var(--text-on-accent) !important;
		-webkit-text-fill-color: var(--text-on-accent) !important;
	}

	.gym-buddy-schedule-select-arrow {
		position: absolute;
		right: 14px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		font-size: 12px;
		color: var(--text-muted);
		line-height: 1;
	}

	/* Force text color for dropdown options */
	.gym-buddy-schedule-select option {
		background: var(--background-primary) !important;
		color: var(--text-normal) !important;
		padding: 8px;
		font-weight: 500;
	}

	.gym-buddy-schedule-select option:checked,
	.gym-buddy-schedule-select option:focus {
		background: var(--interactive-accent) !important;
		color: var(--text-on-accent) !important;
	}

	/* Ensure selected value is visible */
	.gym-buddy-schedule-select:not([value=""]) {
		color: var(--text-normal);
		font-weight: 500;
	}

	/* Confirm summary */
	.gym-buddy-confirm-summary {
		display: flex;
		flex-direction: column;
		gap: 20px;
		background: var(--background-secondary);
		padding: 20px;
		border-radius: 10px;
	}

	.gym-buddy-confirm-section h3 {
		margin: 0 0 8px 0;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.gym-buddy-confirm-value {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-normal);
	}

	.gym-buddy-confirm-value.gym-buddy-muted {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-muted);
	}

	.gym-buddy-confirm-splits {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
	}

	.gym-buddy-split-chip {
		padding: 4px 10px;
		font-size: 12px;
		background: var(--background-modifier-border);
		color: var(--text-normal);
		border-radius: 12px;
	}

	.gym-buddy-confirm-schedule {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.gym-buddy-schedule-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background: var(--background-primary);
		border-radius: 6px;
	}

	.gym-buddy-schedule-item-day {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.gym-buddy-schedule-item-split {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-normal);
	}

	/* Actions */
	.gym-buddy-setup-actions {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin-top: 8px;
	}

	.gym-buddy-btn-primary {
		padding: 12px 24px;
		font-size: 15px;
		font-weight: 600;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.gym-buddy-btn-primary:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.gym-buddy-btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.gym-buddy-btn-secondary {
		padding: 12px 24px;
		font-size: 15px;
		font-weight: 600;
		background: var(--background-modifier-border);
		color: var(--text-normal);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.gym-buddy-btn-secondary:hover {
		background: var(--background-modifier-hover);
	}

	.gym-buddy-btn-text {
		padding: 12px 16px;
		font-size: 14px;
		font-weight: 500;
		background: none;
		color: var(--text-muted);
		border: none;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.gym-buddy-btn-text:hover {
		color: var(--text-normal);
	}

	/* Mobile adjustments */
	@media (max-width: 500px) {
		.gym-buddy-training-setup {
			padding: 16px;
			min-width: unset;
		}

		.gym-buddy-progress-line {
			width: 24px;
		}

		.gym-buddy-schedule-day {
			width: 80px;
			font-size: 13px;
		}

		.gym-buddy-schedule-select {
			padding: 8px 10px;
			font-size: 13px;
		}
	}
</style>

