<script lang="ts">
	import type { SvelteComponent } from 'svelte';

	export let Icon: typeof SvelteComponent | null = null;
	export let groupVal: string | null = null;
	export let groupName: string;
	export let groupValue: string;
	export let showValue: string = ''; // fallback label
	export let customLabel: string = ''; // primary label
	export let groupId: string;
	export let onClick: (e: Event) => void = () => {};
	export let onChange: (e: Event) => void = () => {};
	export let className: string = '';

	function handleClick(event: Event) {
		if (!groupVal || groupVal !== groupValue) {
			onClick(event);
		}
	}

	$: renderLabel = customLabel || showValue || groupValue;
</script>

<div class="flex w-full items-center">
	<label
		for={groupId}
		class={`relative cursor-pointer text-sm flex border w-full px-4 py-[0.8rem] rounded-md items-center gap-2
			border-iconColor transition-colors duration-200
			hover:border-black 
			[&:has(input:checked)]:bg-black
			[&:has(input:checked)]:text-white 
			[&:has(input:checked)]:border-[#fcb650]
			${className}`}
	>
		<input
			type="radio"
			id={groupId}
			name={groupName}
			class="sr-only"
			bind:group={groupVal}
			value={groupValue}
			on:click={handleClick}
			on:change={onChange}
		/>

		{#if Icon}
			<svelte:component this={Icon} class="w-5 h-5" />
		{/if}

		<span>{@html renderLabel}</span>
	</label>
</div>
