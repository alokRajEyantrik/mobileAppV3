<script>
	import * as Icons from 'lucide-svelte';

	export let id = '';
	export let label = '';
	export let description = '';
	export let value = '';
	export let readonly = false;
	export let error = null;
	export let onInput = () => {};
	export let icon = '';
	export let placeholder = '';

	function handleInput(event) {
		onInput(event.target.value);
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

<div class="flex flex-col gap-2 w-full">
	<label for={id} class="text-sm font-medium text-gray-700">{label}</label>

	{#if description}
		<p class="text-sm text-gray-500 -mt-1 mb-1">{description}</p>
	{/if}

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
			type="text"
			class="border border-gray-300 p-2 rounded outline-none w-full
			       {IconComponent ? 'pl-[3.5rem]' : ''}"
			{placeholder}
			{readonly}
			{value}
			on:input={handleInput}
		/>
	</div>

	{#if error}
		<p class="text-red-500 font-bold mt-2">{error}</p>
	{/if}
</div>
