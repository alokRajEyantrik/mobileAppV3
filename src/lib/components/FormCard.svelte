<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import ProgressBar from './ProgressBar.svelte';
	import QuestionRadioForm from './QuestionRadioForm.svelte';

	type Option = {
		label: string;
		value: string;
		groupName: string;
		groupId: string;
		Icon: typeof SvelteComponent;
	};

	export let step = 0;
	export let pageTitle = `Let's Rock!`;
	export let question: string;
	export let description: string;
	export let options: Option[] = [];
	export let selectedOption: string | null = null;
</script>

<div class="flex flex-col gap-4 justify-center items-center w-full mx-auto">
	<!-- <h2 class=" font-bold">{pageTitle}</h2>
	<div class="flex-grow w-full max-w-md">
		<ProgressBar currentStep={step} />
	</div> -->
	<QuestionRadioForm {question} {description} {options} bind:selectedOption />
</div>
