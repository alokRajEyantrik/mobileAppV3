<script lang="ts">
	import * as Icons from 'lucide-svelte';

	type Option = { 
		label: string | { var: string }; 
		value: string | number; 
		icon?: string; // optional icon
	};

	export let id: string = '';
	export let name: string = '';
	export let label: string = '';
	export let description: string = '';
	export let options: Option[] = [];
	export let value: string | number = '';
	export let error: string | null = null;
	export let onChange: (value: string | number) => void = () => {};
	export let getOptionValue: (opt: Option) => string | number = (opt) => opt.value;
	export let getOptionLabel: (opt: Option) => string = (opt) =>
		typeof opt.label === 'object' && (opt.label as any).var
			? (opt.label as any).var
			: (opt.label as string);

	function handleChange(optValue: string | number) {
		onChange(optValue);
	}
</script>

<div class="flex flex-col gap-2">
	<label for={id} class="text-sm font-medium text-gray-700">{label}</label>
	{#if description}
		<p class="text-sm text-gray-500 mb-2">{description}</p>
	{/if}
	<div class="flex flex-col gap-2">
		{#each options as opt}
			<label
				class="relative cursor-pointer flex items-center gap-2 border px-4 py-[0.8rem] rounded-md border-iconColor"
			>
				<input
					type="radio"
					{name}
					value={getOptionValue(opt)}
					checked={value === getOptionValue(opt)}
					on:change={() => handleChange(getOptionValue(opt))}
					class="hidden"
				/>

		
				{#if value === getOptionValue(opt)}
					<svelte:component this={Icons.CircleCheck} class="w-5 h-5 text-white shrink-0" />
				{:else if opt.icon && Icons[opt.icon]}
					<svelte:component this={Icons[opt.icon]} class="w-5 h-5 text-white shrink-0" />
				{:else}
					<svelte:component this={Icons.Circle} class="w-5 h-5 text-black shrink-0" />
				{/if}

				<span>{getOptionLabel(opt)}</span>
			</label>
		{/each}
	</div>

	{#if error}
		<p class="text-red-500 font-bold mt-2">{error}</p>
	{/if}
</div>


<style>
	label:has(input:checked) {
		background-color: black;
		color: white;
		border: 2px solid #fcb650;
	}
	input[type='radio'] {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		width: 0;
		height: 0;
		margin: 0;
		padding: 0;
		border: none;
	}
</style>
