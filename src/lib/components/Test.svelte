<!-- <script lang="ts">
	import { writable, get } from 'svelte/store';
	import { onMount } from 'svelte';

	export let formData;

	let currentPage = formData.pages[0];
	let visibleQuestions = writable([]);
	let answers = writable({});

	const evaluateVar = (input, data) => {
		if (typeof input === 'object') {
			if (input.var) return data[input.var];
			if (input.concat) {
				return input.concat
					.map((item) => (typeof item === 'string' ? item : evaluateVar(item, data)))
					.join('');
			}
		}
		return input;
	};

	const evaluateShowWhen = (question, data) => {
		const expr = question.showWhen;
		if (!expr) return true;

		const resolve = (obj) => {
			if (obj.in) {
				const val = evaluateVar(obj.in[0], data);
				const list = obj.in[1];
				return list.includes(val);
			}
			if (obj.and) {
				return obj.and.every((x) => resolve(x));
			}
			if (obj['==']) {
				return evaluateVar(obj['=='][0], data) === obj['=='][1];
			}
			return true;
		};

		return resolve(expr);
	};

	const updateVisibleQuestions = () => {
		const data = get(answers);
		const visible = currentPage.questions.filter((q) => evaluateShowWhen(q, data));
		visibleQuestions.set(visible);
	};

	const handleAnswer = (qid, value) => {
		answers.update((prev) => ({ ...prev, [qid]: value }));
		updateVisibleQuestions();
	};

	// onMount(() => {
	// 	updateVisibleQuestions();
	// });

    $:{
        updateVisibleQuestions();
    }

	$: console.log($visibleQuestions, 'Visible Questions');
</script>

{#each $visibleQuestions as question}
	<div class="question-block mb-4">
		<p class="font-bold">{question.question}</p>
		{#if question.description}
			<p class="text-sm text-gray-600">{question.description}</p>
		{/if}

		{#if question.type === 'radio'}
			{#each question.options as option}
				<label class="block mt-2">
					<input
						type="radio"
						name={question.id}
						value={typeof option.value === 'object' ? get(answers)[option.value.var] : option.value}
						checked={get(answers)[question.id] ===
							(typeof option.value === 'object' ? get(answers)[option.value.var] : option.value)}
						on:change={() =>
							handleAnswer(
								question.id,
								typeof option.value === 'object' ? get(answers)[option.value.var] : option.value
							)}
					/>
					{typeof option.label === 'object' ? get(answers)[option.label.var] : option.label}
				</label>
			{/each}
		{/if}
	</div>
{/each} -->

<script lang="ts">
	import { writable, get } from 'svelte/store';
	import {
		resolveVar,
		resolveBindsTo,
		isQuestionVisible,
		buildNestedOutput
	} from '$lib/utils/formUtils';

	const formAnswers = writable<Record<string, any>>({});

	export let formData;

	let currentPageIndex = 0;
	let currentPage = formData.pages[currentPageIndex];
	let visibleQuestions = [];

	$: currentPage = formData.pages[currentPageIndex];
	$: {
		const answers = get(formAnswers);
		visibleQuestions = currentPage.questions.filter((q) => isQuestionVisible(q, answers));
	}

	function handleChange(questionId: string, value: string) {
		formAnswers.update((ans) => ({ ...ans, [questionId]: value }));
	}

	function handleSubmit() {
		const answers = get(formAnswers);
		const nestedOutput = buildNestedOutput(formData.pages, answers);
		console.log('Nested Output:', nestedOutput);
	}

	function goNext() {
		if (currentPageIndex < formData.pages.length - 1) {
			currentPageIndex++;
		} else {
			handleSubmit();
		}
	}

	function goBack() {
		if (currentPageIndex > 0) {
			currentPageIndex--;
		}
	}
</script>

<h1 class="text-xl font-bold mb-4">{currentPage.title}</h1>

{#each visibleQuestions as q}
	<div class="mb-4">
		<label class="font-semibold">{q.question}</label>
		<div class="flex flex-col gap-2 mt-2">
			{#each q.options as option}
				<label>
					<input
						type="radio"
						name={q.id}
						value={option}
						checked={get(formAnswers)[q.id] === option}
						on:change={() => handleChange(q.id, option)}
					/>
					{option}
				</label>
			{/each}
		</div>
	</div>
{/each}

<div class="flex justify-between mt-6">
	<button
		class="bg-gray-300 text-black px-4 py-2 rounded"
		on:click={goBack}
		disabled={currentPageIndex === 0}
	>
		Back
	</button>

	<button class="bg-blue-500 text-white px-4 py-2 rounded" on:click={goNext}>
		{currentPageIndex === formData.pages.length - 1 ? 'Submit' : 'Next'}
	</button>
</div>
