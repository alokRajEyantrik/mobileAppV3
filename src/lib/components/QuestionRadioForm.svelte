<script lang="ts">
	import Radio from './Radio.svelte';
	import { createEventDispatcher } from 'svelte';

	export let question: string;
	export let description: string;
	export let options: any[] = [];
	export let selectedOption: string | null = null;
	export let type: string = 'radio';

	const dispatch = createEventDispatcher();

	function handleChange(value: string) {
		selectedOption = value;
		dispatch('change', { value }); // 👈 important for parent tracking
	}
</script>

<div class="flex flex-col gap-4 h-full">
	<h2 class="font-bold text-md tracking-wide">{question}</h2>
	<p class="italic text-sm text-gray-600">{description}</p>

	{#if type === 'radio'}
		{#each options as option}
			<Radio
				groupValue={option.value}
				bind:groupVal={selectedOption}
				groupName={option.label}
				groupId={option.value}
				customLabel={option.label}
				on:change={() => handleChange(option.value)}
			/>
		{/each}
	{:else if type === 'select'}
		<!-- <Select bind:selected={selectedOption} {options} /> -->
		select hu kya 
	{/if}
</div>
