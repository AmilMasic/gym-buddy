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
						<div class="gym-buddy-template-name">{template.name}</div>
						<div class="gym-buddy-template-splits">
							{template.splits.map(s => s.name).join(' • ')}
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
							<select 
								class="gym-buddy-schedule-select"
								value={schedule[day.key as keyof WeeklySchedule] || ''}
								onchange={(e) => setDaySplit(day.key, e.currentTarget.value || null)}
							>
								<option value="">Rest / Off</option>
								{#each selectedTemplate.splits as split}
									<option value={split.id}>{split.name}</option>
								{/each}
							</select>
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

	.gym-buddy-template-name {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-normal);
		margin-bottom: 4px;
	}

	.gym-buddy-template-splits {
		font-size: 13px;
		color: var(--text-muted);
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

	.gym-buddy-schedule-select {
		flex: 1;
		padding: 10px 12px;
		font-size: 14px;
		border: 2px solid var(--background-modifier-border);
		border-radius: 6px;
		background: var(--background-primary);
		color: var(--text-normal);
		cursor: pointer;
	}

	.gym-buddy-schedule-select:focus {
		outline: none;
		border-color: var(--interactive-accent);
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

