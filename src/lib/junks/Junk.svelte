<script>
	import { onMount } from 'svelte';
	import { loanData } from '$lib/stores/loanData';
	import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
	import formSchema from '$lib/config/formSchema.json';
	import jsonLogic from 'json-logic-js';
	import gstStateCodes from '$lib/config/gstStateCodes.json';
	import pincode_IN_Selected from '$lib/config/pincode_IN_Selected.json';
	import { writable, get } from 'svelte/store';

	let selectedLoan = '';
	let currentPageIndex = 0;
	let schema;
	const gstStateError = writable('');

	function sanitizeKey(value) {
		if (!value) return '';
		return value.replace(/\s+/g, '_');
	}

	function resolveBindsTo(question, answers, selectedLoan) {
		if (!question.bindsTo_template) return question.bindsTo || question.id;
		return question.bindsTo_template.replace(/\{([^}]+)\}/g, (_, key) => {
			if (key === 'q1_loanName') return sanitizeKey(selectedLoan);
			const val = answers[key];
			return typeof val === 'string' ? sanitizeKey(val) : val || '';
		});
	}

	onMount(() => {
		selectedLoan = ($loanData && $loanData.loanName) || '';
		schema = preprocessSchemaBindings(formSchema, selectedLoan);
	});

	$: schema = preprocessSchemaBindings(formSchema, selectedLoan);
	$: currentAnswers = $loanData[selectedLoan] ?? {};

	$: combinedAnswers = (() => {
		const combined = {};
		for (const page of schema.pages) {
			for (const q of page.questions) {
				const key = resolveBindsTo(q, currentAnswers, selectedLoan);
				if (key) combined[key] = currentAnswers[key] ?? '';
			}
		}
		combined['q1_loanName'] = selectedLoan;
		return combined;
	})();

	$: currentPage = schema.pages[currentPageIndex];
	$: visibleQuestions = currentPage.questions.filter((q) => isQuestionVisible(q, combinedAnswers));

	function getOptionValue(value) {
		if (typeof value === 'object' && value.var) return combinedAnswers[value.var] || '';
		return value;
	}

	function updateAnswerByKey(key, value) {
		loanData.update((data) => {
			if (!data[selectedLoan]) data[selectedLoan] = {};
			data[selectedLoan][key] = value;
			data.loanName = selectedLoan;
			return data;
		});
	}

	const validators = {
		validateGSTState
	};

	function validateGSTState(gstNumber) {
		if (!gstNumber) return 'required';
		if (gstNumber.length !== 15) return 'lengthError';
		const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{1}Z[A-Z0-9]{1}$/;
		if (!gstPattern.test(gstNumber)) return 'message';
		const stateCode = gstNumber.substring(0, 2);
		const stateName = gstStateCodes[stateCode];
		if (!stateName) return 'message';
		if (!pincode_IN_Selected[stateName]) return 'stateNotServed';
		return null; // Valid
	}

	// When GST Number changes, auto-update the State field accordingly.
	function updateStateFromGST(gstNumber) {
		const errorKey = validateGSTState(gstNumber);
		if (errorKey) {
			updateAnswerByKey('State', '');
			gstStateError.set('');
		} else {
			const stateName = gstStateCodes[gstNumber.substring(0, 2)];
			updateAnswerByKey('State', stateName);
			gstStateError.set('');
		}
	}

	function updateAnswer(question, value) {
		if (question.id === 'q1_loanName') {
			selectedLoan = value;
			schema = preprocessSchemaBindings(formSchema, selectedLoan);
			currentPageIndex = 0;
		}

		const key = resolveBindsTo(question, currentAnswers, selectedLoan);

		loanData.update((data) => {
			if (!data[selectedLoan]) data[selectedLoan] = {};
			data[selectedLoan][key] = value;
			data.loanName = selectedLoan;
			return data;
		});

		if (key === 'GSTNumber') {
			updateStateFromGST(value);
		}
		// Clear city if state changed, so old city doesn't remain
		if (key === 'State') {
			updateAnswerByKey('City', '');
		}
	}

	function isQuestionVisible(question, formData) {
		if (!question.showWhen) return true;
		return jsonLogic.apply(question.showWhen, formData);
	}

	function goNext() {
		if (currentPageIndex < schema.pages.length - 1) currentPageIndex += 1;
	}

	function goPrev() {
		if (currentPageIndex > 0) currentPageIndex -= 1;
	}

	function allRequiredAnswered() {
		return currentPage.questions
			.filter((q) => q.required && isQuestionVisible(q, combinedAnswers))
			.every((q) => {
				const key = resolveBindsTo(q, combinedAnswers, selectedLoan);
				const val = currentAnswers[key];
				return val !== undefined && val !== '' && val !== null;
			});
	}

	function hasValidationError(question, answers) {
		return !!getValidationErrorMessage(question, answers);
	}

	function getValidationErrorMessage(question, answers) {
		const key = resolveBindsTo(question, answers, selectedLoan);
		const val = answers[key];

		if ((val === undefined || val === '' || val === null) && currentPageIndex === 0) {
			return null;
		}

		if (question.required && (val === undefined || val === '' || val === null)) {
			return question.errorMessage?.required;
		}

		if (question.validation?.condition) {
			const isInvalid = jsonLogic.apply(question.validation.condition, answers);
			if (isInvalid) {
				const validatorFnName = question.validation.message;
				if (validatorFnName && typeof validators[validatorFnName] === 'function') {
					const errorKey = validators[validatorFnName](val, answers);
					if (errorKey) {
						return question.errorMessage?.[errorKey];
					}
				}
				return question.errorMessage?.message;
			}
		}

		if (question.bindsTo === 'State' || question.id === 'q_state') {
			const gstErr = get(gstStateError);
			if (gstErr) {
				return question.errorMessage?.stateNotServed || gstErr;
			}
		}

		return null;
	}

	$: isNextEnabled = (() => {
		let enabled = true;
		if (currentPage.nextButtonVisibility) {
			enabled =
				currentPage.nextButtonVisibility.mode.includes('allRequiredAnswered') &&
				allRequiredAnswered();
		}
		for (const q of currentPage.questions) {
			if (isQuestionVisible(q, combinedAnswers) && hasValidationError(q, combinedAnswers)) {
				enabled = false;
				break;
			}
		}
		return enabled;
	})();

	// CUSTOM MAPPING LOGIC FOR CITY DROPDOWN BASED ON STATE
	$: selectedState = currentAnswers['State'] || '';
	$: availableCities =
		selectedState && pincode_IN_Selected[selectedState]
			? Object.keys(pincode_IN_Selected[selectedState])
			: [];
</script>

<!-- Render visible questions -->
{#each visibleQuestions as question (question.id)}
	<div style="margin-bottom: 1rem;" class="flex flex-col gap-2">
		<label for={question.id}>{question.question}</label>

		{#if question.type === 'radio'}
			{#each question.options as opt}
				<label>
					<input
						type="radio"
						name={question.id}
						value={getOptionValue(opt.value)}
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
				class="border border-gray-300 p-2 rounded outline-none"
				readonly={question.uiMeta?.readonly}
				value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] || ''}
				on:input={(e) => updateAnswer(question, e.target.value)}
			/>
		{:else if question.type === 'select'}
			{#if question.dynamic === 'city'}
				<!-- Cities: dynamic options -->
				<select
					id={question.id}
					class="border border-gray-300 p-2 rounded outline-none"
					value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] || ''}
					on:change={(e) => updateAnswer(question, e.target.value)}
				>
					<option value="">--Choose City--</option>
					{#each availableCities as city}
						<option value={city}>{city}</option>
					{/each}
				</select>
			{:else}
				<!-- Normal select -->
				<select
					id={question.id}
					class="border border-gray-300 p-2 rounded outline-none"
					value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] || ''}
					on:change={(e) => updateAnswer(question, e.target.value)}
				>
					<option value="">--Choose an option--</option>
					{#each question.options as opt}
						<option value={getOptionValue(opt.value)}>{opt.label}</option>
					{/each}
				</select>
			{/if}
		{/if}

		{#if getValidationErrorMessage(question, combinedAnswers)}
			<p style="color: red; font-weight: bold; margin-top: 0.5rem;">
				{getValidationErrorMessage(question, combinedAnswers)}
			</p>
		{/if}
	</div>
{/each}

<!-- Navigation buttons -->
<div style="margin-top: 1rem;">
	{#if currentPageIndex > 0}
		<button on:click={goPrev}>Previous</button>
	{/if}
	{#if currentPageIndex < schema.pages.length - 1}
		<button disabled={!isNextEnabled} class="bg-green-400" on:click={goNext}>Next</button>
	{/if}
</div>

<hr />

<!-- Debug info -->
<div class="bg-black text-white p-4">
	<h3>Debug: currentAnswers</h3>
	<pre>{JSON.stringify(currentAnswers, null, 2)}</pre>
	<h3>Debug: combinedAnswers</h3>
	<pre>{JSON.stringify(combinedAnswers, null, 2)}</pre>
	<h3>Debug: GST State Error</h3>
	<pre>{$gstStateError}</pre>
</div>


<!-- city state has different question label  -->
 <!-- const questionText = currentQuestion.questionLabels[answers.isPropertyIdentified]; -->
