<script lang="ts">
	import type { SvelteComponentTyped } from 'svelte';
	import * as Icons from 'lucide-svelte';

	interface Option {
		label: string;
		value: string | number;
	}

	export let id: string;
	export let label: string;
	export let description: string | undefined = undefined;
	export let options: Option[] = [];
	export let value: string | number = '';
	export let error: string | null = null;
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let onChange: (value: string | number) => void = () => {};
	export let icon = '';

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onChange(target.value);
	}

	// convert kebab-case (e.g. user-round) to PascalCase (UserRound)
	function toPascalCase(str) {
		return str
			.split('-')
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
			.join('');
	}

	// pick correct icon component
	$: IconComponent = icon ? Icons[toPascalCase(icon)] : null;
</script>

<div class="mb-4">
	<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
		{label}
	</label>
	{#if description}
		<p class="text-sm text-gray-500 mb-2">
			{description}
			{#if required}<span class="text-red-500">*</span>{/if}
		</p>
	{/if}
	<div class="relative">
		{#if IconComponent}
			<div
				class="absolute left-0 bg-black w-[3rem] h-full rounded-l-md flex justify-center items-center"
			>
				<svelte:component this={IconComponent} class="w-5 h-5 text-white shrink-0" />
			</div>
		{/if}
		<select
			{id}
			{disabled}
			{required}
			bind:value
			on:change={handleChange}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:border-[#ffcc00] {IconComponent
				? 'pl-[3.5rem]'
				: ''}"
			class:error
		>
			<option value="">Select an option</option>
			{#each options as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>
	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>

<style>
	.error {
		border-color: red;
	}
</style>
