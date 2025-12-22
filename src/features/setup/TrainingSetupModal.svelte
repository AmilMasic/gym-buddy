<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../../types';
	import type { WeeklySchedule } from '../../settings';

	interface Props {
		templates?: SplitTemplate[];
		currentTemplateId?: string;
		currentSchedule?: WeeklySchedule;
	}

	let { 
		templates: initialTemplates = [], 
		currentTemplateId = "",
		currentSchedule = {}
	}: Props = $props();

	// Track custom templates added during this session
	let customTemplates = $state<SplitTemplate[]>([]);

	// Combine initial templates with custom templates
	const templates = $derived([...initialTemplates, ...customTemplates]);

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

	// Handle custom template created from builder
	let customTemplate: SplitTemplate | null = $state(null);
	
	$effect(() => {
		const handler = (event: CustomEvent) => {
			const { template } = event.detail as { template: SplitTemplate };
			customTemplate = template;
			selectedTemplateId = template.id;
			// Add to custom templates list if not already there
			if (!customTemplates.find(t => t.id === template.id) && 
			    !initialTemplates.find(t => t.id === template.id)) {
				customTemplates = [...customTemplates, template];
			}
		};
		document.addEventListener('custom-template-created', handler as EventListener);
		return () => {
			document.removeEventListener('custom-template-created', handler as EventListener);
		};
	});

	const selectedTemplate = $derived(
		customTemplate || templates.find(t => t.id === selectedTemplateId)
	);

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
		if (templateId === 'custom-builder') {
			// Emit event to open custom builder
			const event = new CustomEvent('select-custom-builder', {
				detail: { templateId: 'custom-builder' }
			});
			document.dispatchEvent(event);
			return;
		}
		selectedTemplateId = templateId;
		// Reset schedule when changing template
		schedule = {};
	}

	function nextStep() {
		if (currentStep === 'template' && (selectedTemplateId || customTemplate)) {
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
		const finalTemplateId = customTemplate?.id || selectedTemplateId;
		const event = new CustomEvent('confirm-setup', {
			detail: { 
				templateId: finalTemplateId, 
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
				<!-- Custom Split Builder Option -->
				<button
					class="gym-buddy-template-card gym-buddy-custom-builder-card"
					class:selected={selectedTemplateId === 'custom-builder'}
					onclick={() => selectTemplate('custom-builder')}
				>
					<div class="gym-buddy-template-header">
						<div class="gym-buddy-template-name">Custom</div>
						<div class="gym-buddy-template-info-wrapper">
							<span class="gym-buddy-template-info-icon" title="Mix and match splits from any template">ℹ️</span>
							<div class="gym-buddy-template-tooltip">
								<div class="gym-buddy-tooltip-title">Custom Builder:</div>
								<div class="gym-buddy-tooltip-content">
									Combine splits from any template to create your perfect split
								</div>
							</div>
						</div>
					</div>
					<span class="gym-buddy-template-badge gym-buddy-custom-builder-badge">Build Your Own</span>
				</button>
			</div>

			<div class="gym-buddy-setup-actions">
				<button 
					class="gym-buddy-btn-primary" 
					onclick={nextStep}
					disabled={!selectedTemplateId && !customTemplate}
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
							<div class="gym-buddy-schedule-splits">
								<button
									class="gym-buddy-split-chip"
									class:active={!schedule[day.key as keyof WeeklySchedule]}
									onclick={() => setDaySplit(day.key, null)}
								>
									Rest / Off
								</button>
								{#each selectedTemplate.splits as split}
									<button
										class="gym-buddy-split-chip"
										class:active={schedule[day.key as keyof WeeklySchedule] === split.id}
										onclick={() => setDaySplit(day.key, split.id)}
									>
										{split.name}
									</button>
								{/each}
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