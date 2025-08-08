<script lang="ts">
	import { onMount } from 'svelte';
	import { loanData } from '$lib/stores/loanData';
	import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
	import formSchema from '$lib/config/collateral-free-loans-schema.json';
	import jsonLogic from 'json-logic-js';
	import gstStateCodes from '$lib/config/gstStateCodes.json';
	import pincode_IN_Selected from '$lib/config/pincode_IN_Selected.json';
	import { writable, get, type Writable } from 'svelte/store';
	import TextField from '$lib/components/TextField.svelte';
	import RadioField from '$lib/components/RadioField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import CheckboxField from '$lib/components/CheckboxField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import DateField from '$lib/components/DateField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import MultipleSelectField from '$lib/components/MultipleSelectField.svelte';
	import DerivedSelect from '$lib/components/DerivedSelect.svelte';

	// Enhanced type definitions to support additional input types, including multiple-select
	interface Question {
		id: string;
		type:
			| 'text'
			| 'radio'
			| 'select'
			| 'checkbox'
			| 'textarea'
			| 'date'
			| 'number'
			| 'derivedSelect'
			| 'dynamicSelect'
			| 'multiple-select';
		question: string;
		bindsTo?: string;
		bindsTo_template?: string;
		options?: Array<{
			label: string | { var: string };
			value: string | { var: string } | number | boolean;
		}>;
		required?: boolean;
		showWhen?: any; // JSON Logic expression
		validation?: { condition: any; message: string };
		errorMessage?: Record<string, string>;
		uiMeta?: {
			readonly?: boolean;
			placeholder?: string;
			rows?: number;
			min?: string | number;
			max?: string | number;
			step?: number | 'any';
		};
	}

	interface Page {
		questions: Question[];
		nextButtonVisibility?: { mode: string[] };
	}

	interface Schema {
		pages: Page[];
	}

	interface Answers {
		[key: string]: string | number | boolean | (string | number)[] | undefined;
	}

	// Component state
	let selectedLoan: string = '';
	let currentPageIndex: number = 0;
	let schema: Schema;
	const gstStateError: Writable<string> = writable('');

	// Dynamic state options from pincode data
	$: stateOptions = Object.keys(pincode_IN_Selected).map((state) => ({
		label: state,
		value: state
	}));

	// Function to get city options for a specific state
	function getCityOptionsForState(
		state: string | undefined
	): Array<{ label: string; value: string }> {
		if (!state || typeof state !== 'string') return [];
		const cities = Object.keys(
			pincode_IN_Selected[state as keyof typeof pincode_IN_Selected] || {}
		);
		return cities.map((city) => ({ label: city, value: city }));
	}

	// Separate city options for residence and business
	$: residenceCityOptions = getCityOptionsForState(currentAnswers['residenceStateName']);
	$: businessCityOptions = getCityOptionsForState(currentAnswers['businessStateName']);

	// Business address fields visibility
	$: showBusinessAddress = currentAnswers['addressSameOrNot'] === 'No';

	// Utility function to sanitize keys
	function sanitizeKey(value: string | undefined): string {
		if (!value) return '';
		return value.replace(/\s+/g, '_');
	}

	// Resolve binding keys with template support
	function resolveBindsTo(question: Question, answers: Answers, selectedLoan: string): string {
		if (!question.bindsTo_template) return question.bindsTo || question.id;
		return question.bindsTo_template.replace(/\{([^}]+)\}/g, (_, key: string) => {
			if (key === 'q1_loanName') return sanitizeKey(selectedLoan);
			const val = answers[key];
			return typeof val === 'string' ? sanitizeKey(val) : (val?.toString() ?? '');
		});
	}

	onMount(() => {
		selectedLoan = ($loanData && $loanData.loanName) || '';
		schema = preprocessSchemaBindings(formSchema, selectedLoan) as Schema;
	});

	$: schema = preprocessSchemaBindings(formSchema, selectedLoan) as Schema;
	$: currentAnswers = $loanData[selectedLoan] ?? ({} as Answers);

	$: combinedAnswers = (() => {
		const combined: Answers = {};
		for (const page of schema.pages) {
			for (const q of page.questions) {
				const key = resolveBindsTo(q, currentAnswers, selectedLoan);
				if (key) {
					if (q.type === 'multiple-select') {
						combined[key] = (currentAnswers[key] as (string | number)[]) ?? [];
					} else if (q.type === 'number') {
						combined[key] = currentAnswers[key] ?? null;
					} else if (q.type === 'checkbox') {
						combined[key] = currentAnswers[key] ?? false;
					} else {
						combined[key] = currentAnswers[key] ?? '';
					}
				}
			}
		}
		combined['q1_loanName'] = selectedLoan;
		return combined;
	})();

	$: currentPage = schema.pages[currentPageIndex];
	$: visibleQuestions = currentPage.questions.filter((q) => isQuestionVisible(q, combinedAnswers));

	// Get dynamic option value (enhanced for multiple types)
	function getOptionValue(
		value: string | { var: string } | number | boolean
	): string | number | boolean {
		if (typeof value === 'object' && 'var' in value) return combinedAnswers[value.var] ?? '';
		return value;
	}

	// Update answer in store (enhanced for type safety with generics, including arrays)
	function updateAnswerByKey<T extends string | number | boolean | (string | number)[]>(
		key: string,
		value: T
	): void {
		loanData.update((data) => {
			if (!data[selectedLoan]) data[selectedLoan] = {};
			data[selectedLoan][key] = value;
			data.loanName = selectedLoan;
			return data;
		});
	}

	// Validators (expandable for new types, added example for multiple-select)
	const validators = {
		validateGSTState,
		validateMinSelections(values: (string | number)[]): string | null {
			if (values.length < 1) return 'minSelections';
			return null;
		}
	};

	// GST validation function with improved error handling
	function validateGSTState(gstNumber: string): string | null {
		if (!gstNumber) return 'required';

		if (gstNumber.length !== 15) return 'lengthError';

		const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{1}Z[A-Z0-9]{1}$/;
		if (!gstPattern.test(gstNumber.toUpperCase())) return 'message';

		const stateCode = gstNumber.substring(0, 2);
		const stateName = gstStateCodes[stateCode as keyof typeof gstStateCodes];
		if (!stateName) return 'message';

		if (!pincode_IN_Selected[stateName as keyof typeof pincode_IN_Selected])
			return 'stateNotServed';

		return null; // Valid
	}

	// Auto-update state from GST with debounce
	let debounceTimer: NodeJS.Timeout | null = null;
	function updateStateFromGST(gstNumber: string): void {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const errorKey = validateGSTState(gstNumber);
			if (errorKey) {
				updateAnswerByKey('residenceStateName', '');
				gstStateError.set('');
			} else {
				const stateName = gstStateCodes[gstNumber.substring(0, 2) as keyof typeof gstStateCodes];
				updateAnswerByKey('residenceStateName', stateName);
				gstStateError.set('');
			}
		}, 300);
	}

	// Main update function with special handling (enhanced for multiple types, including arrays)
	function updateAnswer(
		question: Question,
		value: string | number | boolean | (string | number)[]
	): void {
		if (question.id === 'q1_loanName') {
			selectedLoan = value as string;
			schema = preprocessSchemaBindings(formSchema, selectedLoan) as Schema;
			currentPageIndex = 0;
		}

		const key = resolveBindsTo(question, currentAnswers, selectedLoan);
		updateAnswerByKey(key, value);

		if (key === 'GSTNumber') {
			updateStateFromGST(value as string);
		}

		if (key === 'residenceStateName') {
			updateAnswerByKey('residenceCityName', '');
		} else if (key === 'businessStateName') {
			updateAnswerByKey('businessCityName', '');
		} else if (key === 'addressSameOrNot' && value === 'Yes') {
			// Copy residence address to business address when "Yes" is selected
			updateAnswerByKey('businessStateName', currentAnswers['residenceStateName'] || '');
			updateAnswerByKey('businessCityName', currentAnswers['residenceCityName'] || '');
		}
	}

	// Visibility check
	function isQuestionVisible(question: Question, formData: Answers): boolean {
		if (!question.showWhen) return true;
		return jsonLogic.apply(question.showWhen, formData);
	}

	// Navigation functions
	function goNext(): void {
		if (currentPageIndex < schema.pages.length - 1) currentPageIndex += 1;
	}

	function goPrev(): void {
		if (currentPageIndex > 0) currentPageIndex -= 1;
	}

	// Check if all required questions are answered (enhanced for new types, including arrays)
	function allRequiredAnswered(): boolean {
		return currentPage.questions
			.filter((q) => q.required && isQuestionVisible(q, combinedAnswers))
			.every((q) => {
				const key = resolveBindsTo(q, combinedAnswers, selectedLoan);
				const val = currentAnswers[key];
				if (q.type === 'multiple-select') {
					return Array.isArray(val) && val.length > 0;
				}
				return val !== undefined && val !== null && (typeof val !== 'string' || val !== '');
			});
	}

	// Validation helpers (enhanced to handle new types, including arrays)
	function hasValidationError(question: Question, answers: Answers): boolean {
		return !!getValidationErrorMessage(question, answers);
	}

	function getValidationErrorMessage(question: Question, answers: Answers): string | null {
		const key = resolveBindsTo(question, answers, selectedLoan);
		const val = answers[key];

		// Suppress initial errors on page 0
		if (
			(val === undefined ||
				val === null ||
				(typeof val === 'string' && val === '') ||
				(Array.isArray(val) && val.length === 0)) &&
			currentPageIndex === 0
		) {
			return null;
		}

		if (question.required) {
			if (question.type === 'multiple-select') {
				if (!Array.isArray(val) || val.length === 0) {
					return question.errorMessage?.required ?? 'This field is required';
				}
			} else if (val === undefined || val === null || (typeof val === 'string' && val === '')) {
				return question.errorMessage?.required ?? 'This field is required';
			}
		}

		if (question.validation?.condition) {
			const isInvalid = jsonLogic.apply(question.validation.condition, answers);
			if (isInvalid) {
				const validatorFnName = question.validation.message;
				if (
					validatorFnName &&
					typeof validators[validatorFnName as keyof typeof validators] === 'function'
				) {
					const errorKey = (validators[validatorFnName as keyof typeof validators] as any)(
						question.type === 'multiple-select'
							? (val as (string | number)[])
							: (val?.toString() ?? '')
					);
					if (errorKey) {
						return question.errorMessage?.[errorKey] ?? 'Validation failed';
					}
				}
				return question.errorMessage?.message ?? 'Invalid input';
			}
		}

		if (question.bindsTo === 'residenceStateName' || question.id === 'q1_residenceStateName') {
			const gstErr = get(gstStateError);
			if (gstErr) {
				return question.errorMessage?.stateNotServed ?? gstErr;
			}
		}

		// Business address validation
		if (question.id.startsWith('q4_business') || question.id.startsWith('q5_business')) {
			const addressSameOrNot = answers['addressSameOrNot'];
			if (addressSameOrNot === 'No' && (!val || (typeof val === 'string' && val === ''))) {
				return question.errorMessage?.required ?? 'This field is required';
			}
		}

		return null;
	}

	// Reactive next button enablement
	$: isNextEnabled = (() => {
		let enabled = true;
		if (currentPage.nextButtonVisibility) {
			enabled =
				currentPage.nextButtonVisibility.mode.includes('allRequiredAnswered') &&
				allRequiredAnswered();
		}
		for (const q of currentPage.questions) {
			if (isQuestionVisible(q, combinedAnswers) && hasValidationError(q, combinedAnswers)) {
				enabled = true;
				break;
			}
		}
		return enabled;
	})();
</script>

<!-- Main container with responsive padding and max-width -->
<div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
	<!-- Form title or header can be added here if needed -->
	 
	<div class="bg-white shadow-md rounded-lg p-6">
		<!-- Render visible questions with support for new input types -->
		<div class="mb-6">
			<h2 class="font-bold text-3xl">{currentPage.title}</h2>
		</div>
		{#each visibleQuestions as question (question.id)}
			<div class="mb-6">
				{#if question.type === 'radio'}
					<RadioField
						id={question.id}
						name={question.id}
						label={question.question}
						options={question.options ?? []}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(value: string) => updateAnswer(question, value)}
						getOptionValue={(opt) => getOptionValue(opt.value).toString()}
						getOptionLabel={(opt) =>
							typeof opt.label === 'object' && opt.label.var
								? combinedAnswers[opt.label.var]?.toString() || opt.label.var
								: (opt.label as string)}
					/>
				{:else if question.type === 'text'}
					<TextField
						id={question.id}
						label={question.question}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						readonly={question.uiMeta?.readonly ?? false}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onInput={(value: string) => updateAnswer(question, value)}
					/>
				{:else if question.type === 'select'}
					<SelectField
						id={question.id}
						label={question.question}
						options={question.id === 'q1_residenceStateName' ||
						question.id === 'q4_businessStateName'
							? stateOptions
							: (question.options?.map((opt) => ({
									label: opt.label as string,
									value: opt.value as string | number
								})) ?? [])}
						value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(value: string | number) => updateAnswer(question, value)}
						required={question.required ?? false}
						disabled={question.uiMeta?.readonly ?? false}
					/>
				{:else if question.type === 'derivedSelect'}
					<DerivedSelect
						id={question.id}
						label={question.question}
						options={question.id === 'q2_residenceCityName'
							? residenceCityOptions
							: question.id === 'q5_businessCityName'
								? businessCityOptions
								: []}
						value={currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(value: string | number) => updateAnswer(question, value)}
						required={question.required ?? false}
						disabled={(question.id === 'q2_residenceCityName' &&
							!currentAnswers['residenceStateName']) ||
							(question.id === 'q5_businessCityName' && !currentAnswers['businessStateName'])}
					/>
				{:else if question.type === 'checkbox'}
					<CheckboxField
						id={question.id}
						label={question.question}
						checked={!!currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)]}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(checked: boolean) => updateAnswer(question, checked)}
					/>
				{:else if question.type === 'textarea'}
					<TextareaField
						id={question.id}
						label={question.question}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						rows={question.uiMeta?.rows ?? 4}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onInput={(value: string) => updateAnswer(question, value)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'date'}
					<DateField
						id={question.id}
						label={question.question}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						min={question.uiMeta?.min as string}
						max={question.uiMeta?.max as string}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(value: string) => updateAnswer(question, value)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'number'}
					<NumberField
						id={question.id}
						label={question.question}
						value={(currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] as
							| number
							| null) ?? null}
						min={question.uiMeta?.min as number}
						max={question.uiMeta?.max as number}
						step={question.uiMeta?.step ?? 1}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onInput={(value: number | null) => updateAnswer(question, value ?? 0)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'multiple-select'}
					<MultipleSelectField
						id={question.id}
						label={question.question}
						options={question.options?.map((opt) => ({
							label: opt.label as string,
							value: opt.value as string | number
						})) ?? []}
						selectedValues={(currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						] as (string | number)[]) ?? []}
						error={getValidationErrorMessage(question, combinedAnswers)}
						onChange={(values: (string | number)[]) => updateAnswer(question, values)}
						required={question.required ?? false}
					/>
				{/if}
			</div>
		{/each}

		<!-- Navigation buttons with improved accessibility -->
		<div class="flex flex-col sm:flex-row justify-between mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
			{#if currentPageIndex > 0}
				<button
					on:click={goPrev}
					class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out"
					aria-label="Previous page"
				>
					Previous
				</button>
			{/if}
			{#if currentPageIndex < schema.pages.length - 1}
				<button
					disabled={!isNextEnabled}
					class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={goNext}
					aria-label="Next page"
					aria-disabled={!isNextEnabled}
				>
					Next
				</button>
			{/if}
		</div>
	</div>

	<hr class="my-8 border-gray-300" />

	<!-- Debug info (consider removing in production) -->
	<div class="bg-gray-900 text-white p-6 rounded-lg shadow-md">
		<h3 class="text-lg font-semibold mb-4">Debug: currentAnswers</h3>
		<pre class="bg-gray-800 p-4 rounded-md overflow-auto">{JSON.stringify(
				currentAnswers,
				null,
				2
			)}</pre>
		<h3 class="text-lg font-semibold mb-4 mt-6">Debug: combinedAnswers</h3>
		<pre class="bg-gray-800 p-4 rounded-md overflow-auto">{JSON.stringify(
				combinedAnswers,
				null,
				2
			)}</pre>
		<h3 class="text-lg font-semibold mb-4 mt-6">Debug: GST State Error</h3>
		<pre class="bg-gray-800 p-4 rounded-md overflow-auto">{$gstStateError}</pre>
	</div>
</div>
