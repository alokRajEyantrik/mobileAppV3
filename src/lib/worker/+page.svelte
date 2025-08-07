<script>
	import { onMount } from 'svelte';
	import { loanData } from '$lib/stores/loanData';
	import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
	import formSchema from '$lib/config/formSchema.json';
	import jsonLogic from 'json-logic-js';

	let selectedLoan = '';

	onMount(() => {
		selectedLoan = ($loanData && $loanData.loanName) || '';
		schema = preprocessSchemaBindings(formSchema, selectedLoan);
	});

	// Sanitize strings to be safe keys (replace spaces with underscore)
	function sanitizeKey(value) {
		if (!value) return '';
		return value.replace(/\s+/g, '_');
	}

	// Resolve bindsTo_template placeholders in keys with actual sanitized values
	function resolveBindsTo(question, answers, selectedLoan) {
		if (!question.bindsTo_template) return question.bindsTo || question.id;

		const vars = {
			q1_loanName: sanitizeKey(selectedLoan),
			q2_productType:
				answers[
					resolveBindsTo(
						schema.pages[0].questions.find((q) => q.id === 'q2_productType'),
						answers,
						selectedLoan
					)
				] || '',
			q3_haveAnyObligation:
				answers[
					resolveBindsTo(
						schema.pages[0].questions.find((q) => q.id === 'q3_haveAnyObligation'),
						answers,
						selectedLoan
					)
				] || ''
		};

		const resolvedKey = question.bindsTo_template.replace(
			/\{([^}]+)\}/g,
			(_, key) => vars[key] || ''
		);
		return resolvedKey;
	}

	let schema = preprocessSchemaBindings(formSchema, selectedLoan);

	// Raw answers store
	$: currentAnswers = $loanData[selectedLoan] ?? {};

	// Build combinedAnswers with fully resolved keys for JsonLogic evaluation
	$: combinedAnswers = {
		q1_loanName: selectedLoan,
		q2_productType:
			currentAnswers[
				resolveBindsTo(
					schema.pages[0].questions.find((q) => q.id === 'q2_productType'),
					currentAnswers,
					selectedLoan
				)
			] || '',
		q3_haveAnyObligation:
			currentAnswers[
				resolveBindsTo(
					schema.pages[0].questions.find((q) => q.id === 'q3_haveAnyObligation'),
					currentAnswers,
					selectedLoan
				)
			] || '',
		...currentAnswers
	};

	$: visibleQuestions = schema.pages[0].questions.filter((q) =>
		isQuestionVisible(q, combinedAnswers)
	);

	// Update selectedLoan and reprocess schema on loan change
	function onLoanChange(event) {
		selectedLoan = event.target.value || '';
		schema = preprocessSchemaBindings(formSchema, selectedLoan);
	}

	// Helper to resolve value if option.value is an object with a 'var' key
	function getOptionValue(value) {
		if (typeof value === 'object' && value.var) {
			return combinedAnswers[value.var] || '';
		}
		return value;
	}

	// Save answer with fully resolved key
	function updateAnswer(question, value) {
		if (question.id === 'q1_loanName') {
			selectedLoan = value;
			schema = preprocessSchemaBindings(formSchema, selectedLoan);
		}

		const key = resolveBindsTo(question, combinedAnswers, selectedLoan);

		loanData.update((data) => {
			if (!data[selectedLoan]) data[selectedLoan] = {};
			data[selectedLoan][key] = value;
			data.loanName = selectedLoan; // also update global loanName
			return data;
		});
	}

	function isQuestionVisible(question, formData) {
		if (!question.showWhen) return true;
		return jsonLogic.apply(question.showWhen, formData);
	}
</script>

{#each visibleQuestions as question}
	<div style="margin-bottom: 1rem;" class="flex flex-col gap-2">
		<label for={question.id}>{question.question}</label>

		{#if question.type === 'radio'}
			{#each question.options as opt}
				<label>
					<input
						type="radio"
						name={question.id}
						value={typeof opt.value === 'object' ? JSON.stringify(opt.value) : opt.value}
						checked={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] ===
							getOptionValue(opt.value)}
						on:change={() => updateAnswer(question, getOptionValue(opt.value))}
					/>
					{typeof opt.label === 'object' && opt.label.var
						? combinedAnswers[opt.label.var] || opt.label.var
						: opt.label}
				</label>
			{/each}
		{:else if question.type === 'text'}
			<input
				id={question.id}
				type="text"
				value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] || ''}
				on:input={(e) => updateAnswer(question, e.target.value)}
			/>
		{/if}
	</div>
{/each}

<hr />

<div class="bg-black text-white p-4">
	<h3>Debug: currentAnswers</h3>
	<pre>{JSON.stringify(currentAnswers, null, 2)}</pre>
	<h3>Debug: combinedAnswers</h3>
	<pre>{JSON.stringify(combinedAnswers, null, 2)}</pre>
</div>
