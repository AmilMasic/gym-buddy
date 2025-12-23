<script lang="ts">
	import type { SplitTemplate, TrainingSplit } from '../../types';
	import type { WeeklySchedule } from '../../settings';
	import { Info, Pencil, Trash2, User, Plus } from '@lucide/svelte';
	import { Button, Chip, IconButton } from '../../ui/components';

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

<div class="gb-training-setup">
	<!-- Progress indicator -->
	<div class="gb-setup-progress">
		<div class="gb-progress-step" class:active={currentStep === 'template'} class:completed={currentStep !== 'template'}>
			<span class="gb-progress-number">1</span>
			<span class="gb-progress-label">Template</span>
		</div>
		<div class="gb-progress-line" class:completed={currentStep !== 'template'}></div>
		<div class="gb-progress-step" class:active={currentStep === 'schedule'} class:completed={currentStep === 'confirm'}>
			<span class="gb-progress-number">2</span>
			<span class="gb-progress-label">Schedule</span>
		</div>
		<div class="gb-progress-line" class:completed={currentStep === 'confirm'}></div>
		<div class="gb-progress-step" class:active={currentStep === 'confirm'}>
			<span class="gb-progress-number">3</span>
			<span class="gb-progress-label">Confirm</span>
		</div>
	</div>

	<!-- Step 1: Template Selection -->
	{#if currentStep === 'template'}
		<div class="gb-setup-step">
			<h2>Choose your training split</h2>
			<p class="gb-setup-subtitle">Select how you want to organize your workouts</p>

			<div class="gb-template-grid">
				{#each templates as template}
					<div
						class="gb-template-card-wrapper"
						class:selected={selectedTemplateId === template.id}
					>
						<button
							class="gb-template-card"
							onclick={() => selectTemplate(template.id)}
						>
							<div class="gb-template-header">
								<div class="gb-template-name-group">
									<div class="gb-template-name">{template.name}</div>
									{#if template.isCustom}
										<div class="gb-custom-icon" title="Custom Template">
											<User size={14} />
										</div>
									{/if}
									<div class="gb-template-info-wrapper">
										<span class="gb-template-info-icon" title={template.splits.map(s => s.name).join(' • ')}>
											<Info size={14} />
										</span>
										<div class="gb-template-tooltip">
											<div class="gb-tooltip-title">Splits:</div>
											<div class="gb-tooltip-content">
												{template.splits.map(s => s.name).join(' • ')}
											</div>
										</div>
									</div>
								</div>
							</div>
						</button>
						{#if template.isCustom}
							<div class="gb-template-actions">
								<IconButton
									icon={Pencil}
									variant="ghost"
									size="sm"
									ariaLabel="Rename template"
									onclick={(e) => {
										e.stopPropagation();
										const event = new CustomEvent('rename-template', {
											detail: { templateId: template.id, currentName: template.name }
										});
										document.dispatchEvent(event);
									}}
								/>
								<IconButton
									icon={Trash2}
									variant="danger"
									size="sm"
									ariaLabel="Delete template"
									onclick={(e) => {
										e.stopPropagation();
										const event = new CustomEvent('delete-template', {
											detail: { templateId: template.id, templateName: template.name }
										});
										document.dispatchEvent(event);
									}}
								/>
							</div>
						{/if}
					</div>
				{/each}
				<!-- Custom Split Builder Option -->
				<button
					class="gb-template-card gb-custom-builder-card"
					class:selected={selectedTemplateId === 'custom-builder'}
					onclick={() => selectTemplate('custom-builder')}
				>
					<div class="gb-template-header">
						<div class="gb-template-name-group">
							<div class="gb-template-name">Custom</div>
							<div class="gb-custom-icon" title="Build Your Own">
								<Plus size={14} />
							</div>
							<div class="gb-template-info-wrapper">
								<span class="gb-template-info-icon" title="Mix and match splits from any template">
									<Info size={14} />
								</span>
								<div class="gb-template-tooltip">
									<div class="gb-tooltip-title">Custom Builder:</div>
									<div class="gb-tooltip-content">
										Combine splits from any template to create your perfect split
									</div>
								</div>
							</div>
						</div>
					</div>
				</button>
			</div>

			<div class="gb-setup-actions">
				<Button
					variant="primary"
					onclick={nextStep}
					disabled={!selectedTemplateId && !customTemplate}
				>
					Continue
				</Button>
			</div>
		</div>
	{/if}

	<!-- Step 2: Weekly Schedule -->
	{#if currentStep === 'schedule'}
		<div class="gb-setup-step">
			<h2>Set your weekly schedule</h2>
			<p class="gb-setup-subtitle">Assign splits to days for auto-detection (optional)</p>

			{#if selectedTemplate}
				<div class="gb-schedule-grid">
					{#each days as day}
						<div class="gb-schedule-row">
							<span class="gb-schedule-day">{day.label}</span>
							<div class="gb-schedule-splits">
								<Chip
									active={!schedule[day.key as keyof WeeklySchedule]}
									onclick={() => setDaySplit(day.key, null)}
								>
									Rest / Off
								</Chip>
								{#each selectedTemplate.splits as split}
									<Chip
										active={schedule[day.key as keyof WeeklySchedule] === split.id}
										onclick={() => setDaySplit(day.key, split.id)}
									>
										{split.name}
									</Chip>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="gb-setup-actions">
				<Button variant="ghost" onclick={prevStep}>
					Back
				</Button>
				<Button variant="ghost" onclick={skipSchedule}>
					Skip
				</Button>
				<Button variant="primary" onclick={nextStep}>
					Continue
				</Button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Confirmation -->
	{#if currentStep === 'confirm'}
		<div class="gb-setup-step">
			<h2>Ready to go!</h2>
			<p class="gb-setup-subtitle">Review your training configuration</p>

			<div class="gb-confirm-summary">
				<div class="gb-confirm-section">
					<h3>Training Split</h3>
					<div class="gb-confirm-value">{selectedTemplate?.name || 'None'}</div>
					{#if selectedTemplate}
						<div class="gb-confirm-splits">
							{#each selectedTemplate.splits as split}
								<Chip size="sm" active={false}>{split.name}</Chip>
							{/each}
						</div>
					{/if}
				</div>

				<div class="gb-confirm-section">
					<h3>Weekly Schedule</h3>
					{#if hasSchedule}
						<div class="gb-confirm-schedule">
							{#each scheduleSummary as item}
								<div class="gb-schedule-item">
									<span class="gb-schedule-item-day">{item.day}</span>
									<span class="gb-schedule-item-split">{item.split}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="gb-confirm-value gb-muted">
							No schedule set — you'll choose your split each workout
						</div>
					{/if}
				</div>
			</div>

			<div class="gb-setup-actions">
				<Button variant="ghost" onclick={prevStep}>
					Back
				</Button>
				<Button variant="primary" onclick={confirmSetup}>
					Save Configuration
				</Button>
			</div>
		</div>
	{/if}
</div>
