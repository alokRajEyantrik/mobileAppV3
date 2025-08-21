<script lang="ts">
	import * as Icons from 'lucide-svelte';

	export let id = '';
	export let label = '';
	export let description = '';
	export let value = '';
	export let readonly = false;
	export let error = null;
	export let onInput = (val: string) => {};
	export let icon = '';
	export let placeholder = '';

	// New props for title dropdown
	export let showTitleDropdown = false;
	export let title = ''; // selected title value
	export let onTitleChange = (val: string) => {}; // callback when title changes

	let titles = ['Mr.', 'Mrs.', 'Miss'];

	function handleInput(event: InputEvent) {
		const target = event.target as HTMLInputElement;
		onInput(target.value);
	}

	function handleTitleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onTitleChange(target.value);
	}

	// convert kebab-case (e.g. user-round) to PascalCase (UserRound)
	function toPascalCase(str: string) {
		return str
			.split('-')
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
			.join('');
	}

	$: IconComponent = icon ? Icons[toPascalCase(icon)] : null;
</script>

<div class="flex flex-col gap-2 w-full">
	<label for={id} class="text-sm font-medium text-gray-700">{label}</label>

	{#if description}
		<p class="text-sm text-gray-500 -mt-1 mb-1">{description}</p>
	{/if}

	<div
		class="flex w-full flex-row justify-between cursor-pointer border rounded-md relative overflow-hidden border-iconColor"
	>
		{#if showTitleDropdown}
			<select
				name="title"
				aria-label="Title"
				bind:value={title}
				on:change={handleTitleChange}
				class="outline-none absolute text-center top-0 h-full rounded-l-sm bg-black text-white font-Paragraph text-leastPara md:text-subParaFont"
			>
				<option value="" disabled>Title</option>
				{#each titles as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		{:else if IconComponent}
			<div
				class="absolute left-0 bg-black w-[3rem] h-full rounded-l-md flex justify-center items-center"
			>
				<svelte:component this={IconComponent} class="w-5 h-5 text-white shrink-0" />
			</div>
		{/if}
		<input
			{id}
			type="text"
			{value}
			{placeholder}
			{readonly}
			on:input={handleInput}
			class="border border-gray-300 rounded outline-none w-full p-2 {showTitleDropdown ||
			IconComponent
				? 'pl-[3.5rem]'
				: ''}"
			aria-describedby={error ? id + '-error' : undefined}
			aria-invalid={error ? 'true' : 'false'}
		/>
	</div>

	{#if error}
		<p id={id + '-error'} class="text-red-500 font-bold mt-2">{error}</p>
	{/if}
</div>
