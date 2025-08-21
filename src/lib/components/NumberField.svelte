<script lang="ts">
	import * as Icons from 'lucide-svelte';

	export let id: string;
	export let label: string;
	export let description: string | undefined = undefined;
	export let value: number[] | number | null = null;
	export let error: string | null = null;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let step: number | 'any' = 1;
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let icon = '';
	export let placeholder: string | string[] = '';
	export let onInput: (value: number | number[] | null) => void = () => {};

	function handleInput(event: Event, index?: number) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value ? parseFloat(target.value) : null;

		if (Array.isArray(placeholder)) {
			const currentValue = Array.isArray(value)
				? [...value]
				: new Array(placeholder.length).fill(null);
			if (index !== undefined) {
				currentValue[index] = newValue;
			}
			onInput(currentValue);
		} else {
			onInput(newValue);
		}
	}

	$: isMultiInput = Array.isArray(placeholder);

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

<div class="">
	<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
		{label}
		{#if required}<span class="text-red-500">*</span>{/if}
	</label>
	{#if description}
		<p class="text-sm text-gray-500 mb-2">{description}</p>
	{/if}

	{#if isMultiInput}
		<div class="space-y-2">
			{#each placeholder as ph, i}
				<div class="flex items-center space-x-2">
					<input
						id={`${id}_${i}`}
						type="number"
						value={Array.isArray(value) ? value[i] : null}
						{min}
						{max}
						{step}
						{disabled}
						{required}
						placeholder={ph}
						on:input={(e) => handleInput(e, i)}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						class:error
					/>
				</div>
			{/each}
		</div>
	{:else}
		<div class="relative w-full">
			{#if IconComponent}
				<div
					class="absolute left-0 bg-black w-[3rem] h-full rounded-l-md flex justify-center items-center"
				>
					<svelte:component this={IconComponent} class="w-5 h-5 text-white shrink-0" />
				</div>
			{/if}
			<input
				{id}
				type="number"
				value={Array.isArray(value) ? value[0] : value}
				{min}
				{max}
				{step}
				{disabled}
				{required}
				placeholder={placeholder as string}
				on:input={(e) => handleInput(e)}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:border-[#ffcc00] {IconComponent
					? 'pl-[3.5rem]'
					: ''}"
				class:error
			/>
		</div>
	{/if}

	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>

<style>
	.error {
		border-color: red;
	}
</style>
