<script lang="ts">
	export let btnName: string = 'Submit';
	export let onclick: () => void = () => {
		// console.log('Button clicked');
	};
</script>

<button
	class="rounded-md bg-[#006FFD] text-white py-2"
	on:click={() => {
		onclick();
	}}>{btnName}</button
>
