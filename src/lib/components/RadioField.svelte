<script>
	export let id = '';
	export let name = '';
	export let label = '';
	export let options = [];
	export let value = '';
	export let error = null;
	export let onChange = () => {};
	export let getOptionValue = (opt) => opt.value;
	export let getOptionLabel = (opt) => opt.label;

	function handleChange(optValue) {
		onChange(optValue);
	}
</script>

<div class="flex flex-col gap-2">
	<label for={id}>{label}</label>
	<div class="flex flex-col gap-2">
		{#each options as opt}
			<label
				class={`relative cursor-pointer font-Paragraph text-para flex border px-4 w-full py-[0.8rem] rounded-md border-iconColor items-center `}
			>
				<input
					type="radio"
					{name}
					value={getOptionValue(opt)}
					checked={value === getOptionValue(opt)}
					on:change={() => handleChange(getOptionValue(opt))}
				/>
				<span>{getOptionLabel(opt)}</span>
			</label>
		{/each}
	</div>
	{#if error}
		<p class="text-red-500 font-bold mt-2">
			{error}
		</p>
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
