<script lang="ts">
	import { Icon } from "../../ui/components";
	import { formatDuration } from "./workoutUtils";
	import type { WorkoutTimerProps } from "./types";

	let { startTime }: WorkoutTimerProps = $props();
	let elapsed = $state("");

	$effect(() => {
		// Capture startTime in effect so it's reactive
		const time = startTime;

		// Update immediately
		elapsed = formatDuration(time);

		// Update every second
		const interval = setInterval(() => {
			elapsed = formatDuration(time);
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="gb-workout-timer">
	<Icon name="clock" size={16} />
	<span>{elapsed}</span>
</div>
