<script lang="ts">
	import { onMount } from 'svelte';
	import { ToWords } from 'to-words';
	import { writable, get, type Writable } from 'svelte/store';
	import jsonLogic from 'json-logic-js';
	import { loanData } from '$lib/stores/loanData';
	import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
	import homeLoanSchema from '$lib/config/homeLoanSchema.json';
	import gstStateCodes from '$lib/config/gstStateCodes.json';
	import pincode_IN_Selected from '$lib/config/pincode_IN_Selected.json';
	import TextField from '$lib/components/TextField.svelte';
	import RadioField from '$lib/components/RadioField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import CheckboxField from '$lib/components/CheckboxField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import DateField from '$lib/components/DateField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import MultipleSelectField from '$lib/components/MultipleSelectField.svelte';
	import DerivedSelect from '$lib/components/DerivedSelect.svelte';

	// Utility types (minimized for brevity)
	interface Question {
		id: string;
		contextKey?: string;
		bindsTo?: string;
		bindsTo_template?: string;
		type: string;
		options?: any[];
		required?: boolean;
		showWhen?: any;
		validation?: any;
		errorMessage?: Record<string, string>;
	}
	interface Page {
		questions: Question[];
		title?: string;
		showWhen?: any;
		nextButtonVisibility?: { mode: string[] };
	}
	interface Schema {
		pages: Page[];
	}
	interface Answers {
		[key: string]: any;
	}
	interface LoanDataStore {
		[key: string]: Answers | string | undefined;
		loanName?: string;
	}

	const toWords = new ToWords();
	// local state for number + words
	let numberValue: number | null = null;
	let numberWordsMap: Record<string, string> = {};

	// Store variable for GST
	const gstStateError: Writable<string> = writable('');
	export const testing = writable({
		loanType: '',
		bankName: '',
		selectedToClose: '',
		closurePlan: '',
		EMIs: '',
		tenure: '',
		interestRate: '',
		tableLoanEntries: [],
		tableLimitEntries: []
	});

	// App state
	let selectedLoan: string = '';
	let currentPageIndex: number = 0;
	let schema: Schema;
	let isSubmitting = false;
	let submitError: string | null = null;
	let resultData: any = null;

	// 1️⃣ Utility functions
	function sanitizeKey(value: string | undefined): string {
		if (!value) return '';
		return value.replace(/\s+/g, '_');
	}

	function resolveBindsTo(question: Question, answers: Answers, selectedLoan: string): string {
		if (question.bindsTo_template) {
			return question.bindsTo_template.replace(/\{([^}]+)\}/g, (_, key: string) => {
				if (key === 'q1_loanName') return sanitizeKey(selectedLoan);
				const val = answers[key];
				return typeof val === 'string' ? sanitizeKey(val) : (val?.toString() ?? '');
			});
		}
		return question.bindsTo || question.id;
	}

	function resolveDynamicText(field: any, answers: Answers): string {
		if (!field) return '';
		if (typeof field === 'string') return field;

		if (typeof field === 'object' && field.switch && Array.isArray(field.switch)) {
			for (const condition of field.switch) {
				if (jsonLogic.apply(condition.case, answers)) {
					return resolveDynamicText(condition.then, answers);
				}
			}
			return '';
		}

		return typeof field === 'object' ? JSON.stringify(field) : '';
	}

	// 🎛 Mapping options for selects
	$: stateOptions = Object.keys(pincode_IN_Selected).map((state) => ({
		label: state,
		value: state
	}));
	function getCityOptionsForState(
		state: string | undefined
	): Array<{ label: string; value: string }> {
		if (!state || typeof state !== 'string') return [];
		const cities = Object.keys(
			pincode_IN_Selected[state as keyof typeof pincode_IN_Selected] || {}
		);
		return cities.map((city) => ({ label: city, value: city }));
	}
	// For residence/business fields
	$: propertyCityOptions = getCityOptionsForState(currentAnswers['propertyStateName']?.toString());
	$: residenceCityOptions = getCityOptionsForState(
		currentAnswers['residenceStateName']?.toString()
	);
	$: showBusinessAddress = currentAnswers['isResidenceSameAsPropertyHas'] === 'No';

	// 2️⃣ Handle mounting and schema
	onMount(() => {
		selectedLoan = (($loanData as LoanDataStore)?.loanName || '') as string;
		schema = preprocessSchemaBindings(homeLoanSchema, selectedLoan) as Schema;
	});
	$: schema = preprocessSchemaBindings(homeLoanSchema, selectedLoan) as Schema;
	$: currentAnswers = ($loanData as LoanDataStore)[selectedLoan] ?? ({} as Answers);

	// 3️⃣ Collate all answers mapped to schema keys
	$: combinedAnswers = (() => {
		const combined: Answers = { ...currentAnswers };
		for (const page of schema.pages) {
			for (const q of page.questions) {
				const key = resolveBindsTo(q, currentAnswers, selectedLoan);
				if (key) {
					if (q.type === 'multiple-select')
						combined[key] = (currentAnswers[key] as (string | number)[]) ?? [];
					else if (q.type === 'number') combined[key] = currentAnswers[key] ?? 0;
					else if (q.type === 'checkbox') combined[key] = currentAnswers[key] ?? false;
					else combined[key] = currentAnswers[key] ?? '';
					// ContextKey mapping as alias
					if (q.contextKey) {
						combined[q.contextKey] = combined[key];
					}
				}
			}
		}
		combined['q1_loanName'] = selectedLoan;
		combined['loanName'] = selectedLoan;
		return combined;
	})();

	// 4️⃣ Control page visibility & nav
	// $: visiblePages = schema.pages.filter(
	// 	(page) => !page.showWhen || jsonLogic.apply(page.showWhen, combinedAnswers)
	// );

	$: visiblePages = (() => {
		if (!schema.pages) return [];

		const type = combinedAnswers.homeLoanType;

		if (type === 'New Loan') {
			// Path 1 sequence
			const order = [
				'firstPage',
				'property_location_homeLoan',
				'selection_homeLoan',
				'propertyDetails_homeLoan',
				'sellerInformation_homeLoan',
				'tellUs_homeLoan',
				'loanStructure_homeLoan',
				'basicInfo_homeLoan',
				'mortgageProfile_homeLoan'
			];

			return order.map((id) => schema.pages.find((p) => p.id === id)).filter(Boolean); // filter out undefined just in case
		}

		if (
			type === 'Top-up only' ||
			type === 'Balance Transfer' ||
			type === 'Balance Transfer with Top-up'
		) {
			// Path 2 sequence
			const order = [
				'firstPage',
				'property_location_homeLoan',
				'selection_homeLoan',
				'tellUs_homeLoan',
				'loanStructure_homeLoan',
				'basicInfo_homeLoan',
				'propertyDetails_homeLoan',
				'existingLoanInfo_homeLoan',
				'loanRequirements_homeLoan'
			];

			return order.map((id) => schema.pages.find((p) => p.id === id)).filter(Boolean);
		}

		// Default fallback: filter by existing showWhen logic
		return schema.pages.filter(
			(page) => !page.showWhen || jsonLogic.apply(page.showWhen, combinedAnswers)
		);
	})();

	$: currentPageIndex = Math.min(currentPageIndex, visiblePages.length - 1);
	$: currentPage = visiblePages[currentPageIndex];
	$: visibleQuestions =
		currentPage?.questions.filter((q) => isQuestionVisible(q, combinedAnswers)) ?? [];

	// 5️⃣ Main updateAnswer/field handling
	function updateAnswerByKey<T extends string | number | boolean | (string | number)[]>(
		key: string,
		value: T
	): void {
		loanData.update((data: LoanDataStore) => {
			if (!(data as LoanDataStore)[selectedLoan]) (data as LoanDataStore)[selectedLoan] = {};
			(data as LoanDataStore)[selectedLoan][key] = value;
			(data as LoanDataStore).loanName = selectedLoan;
			return data;
		});
	}
	function updateAnswer(
		question: Question,
		value: string | number | boolean | (string | number)[]
	): void {
		if (question.id === 'q1_loanName') {
			selectedLoan = value as string;
			schema = preprocessSchemaBindings(homeLoanSchema, selectedLoan) as Schema;
			currentPageIndex = 0;
		}
		const key = resolveBindsTo(question, currentAnswers, selectedLoan);
		updateAnswerByKey(key, value);

		// Key-specific effects
		if (key.toLowerCase().includes('nri')) updateAnswerByKey('isApplicantNRI', value);
		if (key === 'GSTNumber') updateStateFromGST(value as string);
		if (key === 'propertyStateName') updateAnswerByKey('propertyCityName', '');
		else if (key === 'residenceStateName') updateAnswerByKey('residenceCityName', '');
		else if (key === 'TypeOfResidence') updateAnswerByKey('typeOfResidence', value);
		else if (key === 'isResidenceSameAsPropertyHas' && value === 'Yes') {
			updateAnswerByKey('residenceStateName', currentAnswers['propertyStateName'] || '');
			updateAnswerByKey('residenceCityName', currentAnswers['propertyCityName'] || '');
		}
	}

	// 6️⃣ Validators
	const validators = {
		validateGSTState,
		validateMinSelections(values: (string | number)[]): string | null {
			if (values.length < 1) return 'minSelections';
			return null;
		}
	};
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
		return null;
	}
	let debounceTimer: number | null = null;
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

	// 7️⃣ Navigation
	function goNext(): void {
		if (currentPageIndex < visiblePages.length - 1) currentPageIndex += 1;
	}
	function goPrev(): void {
		if (currentPageIndex > 0) currentPageIndex -= 1;
	}
	function flattenQuestions(questions: any[]): any[] {
		return questions.flatMap((q) =>
			'group' in q && Array.isArray((q as any).group) ? (q as any).group : [q]
		);
	}
	function allRequiredAnswered(): boolean {
		const flat = flattenQuestions(currentPage.questions);
		return flat
			.filter((q) => q.required && isQuestionVisible(q, combinedAnswers))
			.every((q) => {
				const key = resolveBindsTo(q, combinedAnswers, selectedLoan);
				const val = currentAnswers[key];
				if (q.type === 'multiple-select') return Array.isArray(val) && val.length > 0;
				return val !== undefined && val !== null && (typeof val !== 'string' || val !== '');
			});
	}
	function isQuestionVisible(question: Question, formData: Answers): boolean {
		if (!question.showWhen) return true;
		// Normalization
		const normalizedData: Record<string, any> = {};
		for (const [key, value] of Object.entries(formData)) {
			normalizedData[key] = value;
			normalizedData[key.toLowerCase()] = value;
			normalizedData[key.toUpperCase()] = value;
			normalizedData[key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()] = value;
			if (key.includes('_')) {
				const shortKey = key.split('_').pop() || '';
				normalizedData[shortKey] = value;
				normalizedData[shortKey.toLowerCase()] = value;
				normalizedData[shortKey.toUpperCase()] = value;
				normalizedData[shortKey.charAt(0).toUpperCase() + shortKey.slice(1).toLowerCase()] = value;
			}
			if (key.includes('Type')) {
				const withoutType = key.replace('Type', '');
				normalizedData[withoutType.toLowerCase()] = value;
				normalizedData[withoutType.toUpperCase()] = value;
				normalizedData[withoutType.charAt(0).toUpperCase() + withoutType.slice(1).toLowerCase()] =
					value;
			}
		}
		if (question.bindsTo_template) {
			const key = resolveBindsTo(question, formData, formData.q1_loanName as string);
			const value = formData[key];
			if (value !== undefined) {
				normalizedData[key] = value;
				normalizedData[key.toLowerCase()] = value;
				normalizedData[key.toUpperCase()] = value;
			}
		}
		return jsonLogic.apply(question.showWhen, normalizedData);
	}

	// 8️⃣ Validation
	function hasValidationError(question: Question, answers: Answers): boolean {
		return !!getValidationErrorMessage(question, answers);
	}
	function getValidationErrorMessage(question: Question, answers: Answers): string | null {
		const key = resolveBindsTo(question, answers, selectedLoan);
		const val = answers[key];
		if (!val && currentPageIndex === 0) return null;
		if (question.required) {
			if (question.type === 'multiple-select' && (!Array.isArray(val) || val.length === 0)) {
				return question.errorMessage?.required ?? 'This field is required';
			}
			if (val === undefined || val === null || val === '') {
				return question.errorMessage?.required ?? 'This field is required';
			}
		}
		if (question.validation?.condition) {
			const conditionResult = jsonLogic.apply(question.validation.condition, answers);
			if (conditionResult) {
				const validatorFnName = question.validation.message;
				if (
					validatorFnName &&
					typeof validators[validatorFnName as keyof typeof validators] === 'function'
				) {
					const errorKey = (validators[validatorFnName as keyof typeof validators] as any)(val);
					if (errorKey) return question.errorMessage?.[errorKey] ?? 'Validation failed';
				}
				return question.errorMessage?.message ?? 'Invalid input';
			}
		}
		if (key === 'residenceStateName') {
			const gstErr = get(gstStateError);
			if (gstErr) return question.errorMessage?.stateNotServed ?? gstErr;
		}
		return null;
	}

	// 9️⃣ Next button enabled
	$: isNextEnabled = (() => {
		if (!currentPage) return false;
		let enabled = true;
		if (currentPage.nextButtonVisibility) {
			if (currentPage.nextButtonVisibility.mode.includes('allRequiredAnswered')) {
				enabled = allRequiredAnswered();
			}
		}
		// If any validation error exists, disable button
		for (const q of flattenQuestions(currentPage.questions)) {
			if (isQuestionVisible(q, combinedAnswers) && hasValidationError(q, combinedAnswers)) {
				enabled = false;
				break;
			}
		}
		return enabled;
	})();

	$: isLastPage = currentPageIndex === visiblePages.length - 1;
	$: canSubmit = (() => {
		if (!isLastPage) return false;
		// Check all visible pages for required questions and validation
		return visiblePages.every((page) => {
			const visibleQuestions = page.questions.filter((q) => isQuestionVisible(q, combinedAnswers));
			return visibleQuestions.every((q) => {
				const key = resolveBindsTo(q, combinedAnswers, selectedLoan);
				const val = currentAnswers[key];
				if (!q.required) return true;
				if (q.type === 'multiple-select') return Array.isArray(val) && val.length > 0;
				return val !== undefined && val !== null && (typeof val !== 'string' || val !== '');
			});
		});
	})();

	// 10️⃣ Payload mapping for Home Loan schema (update for backend as needed!)
	async function handleSubmit() {
		try {
			isSubmitting = true;
			submitError = null;

			const mapEmploymentType = (empType: string | undefined): string => {
				if (!empType) return '';
				// Remove spaces to match test data format
				return empType.replace(/\s+/g, '');
			};

			console.log(combinedAnswers, 'combined');

			const formattedPayload = {
				loanTransaction: {
					LoanName: combinedAnswers.loanName || selectedLoan,
					LoanType: combinedAnswers.homeLoanType || 'New Loan',
					propertyIdentified: combinedAnswers.isPropertyIdentified || 'Yes',
					propertyStateName: combinedAnswers.propertyStateName || '',
					propertyCityName: combinedAnswers.propertyCityName || '',
					residenceOptionSame: combinedAnswers.isResidenceSameAsPropertyHas || 'Yes',
					residenceStateName: combinedAnswers.residenceStateName || '',
					residenceCityName: combinedAnswers.residenceCityName || '',
					approvedByAuthority: combinedAnswers.isAuthorizedArea || 'Yes',
					asPerMap: combinedAnswers.isApprovedAsPerMap || 'Yes',
					ApplicantIsNRI: combinedAnswers.isPrimaryApplicantNRI || 'No',
					propertyType: combinedAnswers.ownershipType || '',
					purchaseType: combinedAnswers.propertyNature || '',
					constructionType: combinedAnswers.constructionType || '',
					PropertyStage: combinedAnswers.constructionStage || '',
					purchasedFrom: combinedAnswers.propertyPurchasedBy || '',
					approvedBankForSelectedByUser: combinedAnswers.lendersName || '',
					tellUsApplying: combinedAnswers.whoIsApplying || '',
					numberOfDirectorOrApplicant: Number(combinedAnswers.numberOfDirectorOrApplicant) || 0,
					mortgageYear: Number(combinedAnswers.mortgageYear) || 20,
					propCost: Number(combinedAnswers.dealValue) || 0,
					deposit: Number(combinedAnswers.downPayment) || 0,
					RequiredLoanAmount:
						Number(combinedAnswers.dealValue || 0) - Number(combinedAnswers.downPayment || 0)
				},
				allApplicantDetails: [
					{
						title: combinedAnswers.title || 'Mr.',
						fullNameOfApplicant: combinedAnswers.nameOfPrimaryApplicant || '',
						TypeOfResidence: combinedAnswers.TypeOfResidence || '',
						selectedAge: Number(combinedAnswers.primaryAge) || 0,
						EmploymentType: mapEmploymentType(combinedAnswers.primaryEmploymentType?.toString()),
						creditScore: combinedAnswers.primaryCIBILScore || '',
						fixedSalary: Number(combinedAnswers.primaryMonthlyNetIncome) || 0,
						grossIncome: Number(combinedAnswers.primaryMonthlyGrossIncome) || 0,
						monthlyOtherIncome: Number(combinedAnswers.primaryAdditionalIncome) || 0,
						totalEMIs: Number(combinedAnswers.primaryMonthlyEMI) || 0,
						totalLimit: Number(combinedAnswers.primaryCombinedLimitOfCC) || 0
					}
				]
			};

			const res = await fetch('https://bank-loan-management.vercel.app/api/loan-eligibility', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formattedPayload)
			});
			const data = await res.json();
			resultData = data;
			console.log(resultData, 'resultData');
			alert('form submitted successfully!');
		} catch (error) {
			console.error('Submission error:', error);
			submitError =
				error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Add/remove table logic unchanged—use as before

	const disableAddButton = (q, data) => {
		if (!q.disabledCondition?.anyEmpty) return false;
		return q.disabledCondition.anyEmpty.some((fieldName) => {
			const value = data[fieldName];
			return value === undefined || value === null || value === '';
		});
	};
	const handleAddClick = () => {
		const currentData = get(testing);
		const requiredFields = [
			'loanType',
			'bankName',
			'selectedToClose',
			'EMIs',
			'tenure',
			'interestRate'
		];
		const missingField = requiredFields.some((field) => !currentData[field]);
		if (missingField) {
			alert('Please fill all fields before adding');
			return;
		}
		if (!['Dropline OD', 'CC Limit', 'OD Limit'].includes(currentData.loanType)) {
			const newEntry = {
				loanType: currentData.loanType,
				bankName: currentData.bankName,
				selectedToClose: currentData.selectedToClose,
				EMIs: Number(currentData.EMIs),
				tenure: currentData.tenure,
				interestRate: currentData.interestRate
			};
			if (!Array.isArray(currentAnswers.tableLoanEntries)) {
				currentAnswers.tableLoanEntries = [];
			}
			currentAnswers.tableLoanEntries.push(newEntry);
			if (newEntry.selectedToClose.toLowerCase() === 'keep running') {
				currentAnswers.totalEMIs = currentAnswers.tableLoanEntries
					.filter((item) => item.selectedToClose.toLowerCase() === 'keep running')
					.reduce((sum, entry) => sum + Number(entry.EMIs || 0), 0);
			}
			requiredFields.forEach((field) => {
				currentData[field] = '';
			});
		}
	};
	const handleInput = (id, value) => {
		if (!id) {
			return;
		}
		testing.update((data) => ({ ...data, [id]: value }));
	};

	function handleNumberInput(value: number | number[] | null, question) {
		updateAnswer(question, value ?? 0);

		if (typeof value === 'number' && !isNaN(value)) {
			const formatted = value.toLocaleString('en-IN');
			numberWordsMap = {
				...numberWordsMap,
				[question.id]: `${toWords.convert(value)}`
			};
		} else {
			numberWordsMap = {
				...numberWordsMap,
				[question.id]: ''
			};
		}
	}
</script>

<div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
	<!-- Form title or header can be added here if needed -->

	<div class="bg-white shadow-md rounded-lg p-6">
		<div class="mb-6">
			<h2 class="font-bold text-3xl">
				{resolveDynamicText(currentPage?.title, combinedAnswers) || 'Loan Application'}
			</h2>
		</div>

		<!-- Render visible questions with support for new input types -->
		{#each visibleQuestions as question (question.id)}
			<div class="mb-6">
				{#if question.type === 'radio'}
					<RadioField
						id={question.id}
						name={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						options={question.options?.filter((opt) => {
							if (!opt.showWhen) return true;
							return jsonLogic.apply(opt.showWhen, combinedAnswers);
						}) ?? []}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(value: string) => updateAnswer(question, value)}
						getOptionValue={(opt) => opt.value}
						getOptionLabel={(opt) => opt.label}
					/>
				{:else if question.type === 'text'}
					<TextField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						readonly={question.uiMeta?.readonly ?? false}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onInput={(value: string) => updateAnswer(question, value)}
						icon={question.uiMeta?.icon}
					/>
				{:else if question.type === 'select'}
					<SelectField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						options={question.id === 'q2_propertyStateName' ||
						question.id === 'q5_residenceStateName'
							? stateOptions
							: (question.options
									?.filter((opt) => {
										if (!opt.showWhen) return true;
										return jsonLogic.apply(opt.showWhen, combinedAnswers);
									})
									.map((opt) => ({
										label: opt.label as string,
										value: opt.value as string | number
									})) ?? [])}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(value: string | number) => updateAnswer(question, value)}
						required={question.required ?? false}
						disabled={question.uiMeta?.readonly ?? false}
						icon={question.uiMeta?.icon}
					/>
				{:else if question.type === 'derivedSelect'}
					<!-- <p>derived select hai</p> -->
					<DerivedSelect
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						options={question.id === 'q3_propertyCityName'
							? propertyCityOptions
							: question.id === 'q6_residenceCityName'
								? residenceCityOptions
								: []}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(value: string | number) => updateAnswer(question, value)}
						required={question.required ?? false}
						icon={question.uiMeta?.icon}
						disabled={(question.id === 'q3_propertyCityName' &&
							!currentAnswers['propertyStateName']) ||
							(question.id === 'q6_residenceCityName' && !currentAnswers['residenceStateName'])}
					/>
				{:else if question.type === 'checkbox'}
					<CheckboxField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						checked={!!currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)]}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(checked: boolean) => updateAnswer(question, checked)}
					/>
					<!-- <p>checkbox hai</p> -->
				{:else if question.type === 'textarea'}
					<!-- <p>text area hai</p> -->
					<TextareaField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						rows={question.uiMeta?.rows ?? 4}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onInput={(value: string) => updateAnswer(question, value)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'date'}
					<!-- <p>date hai</p> -->
					<DateField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						min={question.uiMeta?.min as string}
						max={question.uiMeta?.max as string}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(value: string) => updateAnswer(question, value)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'number'}
					<NumberField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						value={(currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] as
							| number[]
							| number
							| null) ?? null}
						placeholder={Array.isArray(question.uiMeta?.placeholder)
							? question.uiMeta.placeholder[0]
							: question.uiMeta?.placeholder || ''}
						min={question.uiMeta?.min as number}
						max={question.uiMeta?.max as number}
						step={question.uiMeta?.step ?? 1}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onInput={(value: number | number[] | null) => handleNumberInput(value, question)}
						required={question.required ?? false}
						icon={question.uiMeta?.icon}
					/>
					{#if numberWordsMap[question.id]}
						<span class="text-sm font-regular text-gray-700 pl-[3rem]">
							{numberWordsMap[question.id]}
						</span>
					{/if}
				{:else if question.type === 'multiple-select'}
					<MultipleSelectField
						id={question.id}
						label={resolveDynamicText(question.question, combinedAnswers)}
						description={resolveDynamicText(question.description, combinedAnswers)}
						options={question.options?.map((opt) => ({
							label:
								typeof opt.label === 'object' && opt.label.var
									? combinedAnswers[opt.label.var]?.toString() || opt.label.var
									: (opt.label as string),
							value:
								typeof opt.value === 'object' && 'var' in opt.value
									? (combinedAnswers[opt.value.var] as string | number)
									: (opt.value as string | number)
						})) ?? []}
						selectedValues={Array.isArray(
							currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)]
						)
							? (currentAnswers[resolveBindsTo(question, combinedAnswers, selectedLoan)] as (
									| string
									| number
								)[])
							: []}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(values: (string | number)[]) => updateAnswer(question, values)}
						required={question.required ?? false}
					/>

					<!-- <p>multiple select hai</p> -->
				{:else if question.type === 'existingtext'}
					<div>
						<label>{resolveDynamicText(question.question, combinedAnswers)}</label>
						<input
							type="text"
							value={$testing[question.existing_bindsTo] || ''}
							on:input={(e) => handleInput(question.existing_bindsTo, e.target.value)}
						/>
					</div>
					<!-- <p>existing text hai</p> -->
				{:else if question.type === 'existingselect'}
					<div>
						<label>{resolveDynamicText(question.question, combinedAnswers)}</label>
						{#if question.existing_bindsTo}
							<select bind:value={$testing[question.existing_bindsTo]}>
								<option value="">Select</option>
								{#each question.options as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						{:else}
							<span style="color:red">Error: bindsTo_template missing!</span>
						{/if}
					</div>
					<!-- <p>existing select hai</p> -->
				{:else if question.type === 'button'}
					<button on:click={handleAddClick} disabled={disableAddButton(question, $testing)}>
						{question.question}
					</button>
				{/if}
			</div>
		{/each}

		<!-- Navigation buttons with improved accessibility -->
		<div class="flex flex-col sm:flex-row justify-between mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
			<div>
				{#if currentPageIndex > 0}
					<button
						on:click={goPrev}
						class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out"
						aria-label="Previous page"
					>
						Previous
					</button>
				{/if}
			</div>

			<div class="flex flex-col items-center">
				{#if submitError}
					<p class="text-red-600 mb-2">{submitError}</p>
				{/if}

				{#if isLastPage}
					<button
						class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
						on:click={handleSubmit}
						aria-label="Submit application"
					>
						{#if isSubmitting}
							Submitting...
						{:else}
							Submit Application
						{/if}
					</button>
				{:else if currentPageIndex < schema.pages.length - 1}
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
	</div>

	<hr class="my-8 border-gray-300" />

	<!-- Results Section -->
	{#if resultData}
		<div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-2xl font-bold text-green-800">🎉 Loan Eligibility Results</h2>
				{#if resultData.productName}
					<div class="text-right">
						<p class="text-sm text-gray-600">{resultData.bankName}</p>
						<p class="text-lg font-semibold text-green-700">{resultData.productName}</p>
					</div>
				{/if}
			</div>

			<!-- Primary Metrics -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<div class="bg-white p-4 rounded-lg shadow-sm border">
					<h3 class="text-sm font-medium text-gray-600 mb-1">Sanction Amount</h3>
					<p class="text-2xl font-bold text-green-600">
						₹{resultData.SanctionAmount?.toLocaleString('en-IN')}
					</p>
				</div>

				<div class="bg-white p-4 rounded-lg shadow-sm border">
					<h3 class="text-sm font-medium text-gray-600 mb-1">Monthly EMI</h3>
					<p class="text-2xl font-bold text-blue-600">₹{resultData.emi?.toLocaleString('en-IN')}</p>
				</div>

				<div class="bg-white p-4 rounded-lg shadow-sm border">
					<h3 class="text-sm font-medium text-gray-600 mb-1">Tenure</h3>
					<p class="text-2xl font-bold text-purple-600">{resultData.tenure} years</p>
				</div>

				<div class="bg-white p-4 rounded-lg shadow-sm border">
					<h3 class="text-sm font-medium text-gray-600 mb-1">Interest Rate</h3>
					<p class="text-2xl font-bold text-orange-600">{resultData.annualRate}%</p>
				</div>
			</div>

			<!-- Additional Details -->
			{#if resultData.maximumEligibleEmi}
				<div class="bg-white p-4 rounded-lg shadow-sm border mb-6">
					<h3 class="text-sm font-medium text-gray-600 mb-1">Maximum Eligible EMI</h3>
					<p class="text-xl font-bold text-indigo-600">
						₹{resultData.maximumEligibleEmi?.toLocaleString('en-IN')}
					</p>
				</div>
			{/if}

			{#if resultData.suggestionMsg && resultData.suggestionMsg.length > 0}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<h3 class="text-lg font-semibold text-blue-800 mb-3">
						💡 Suggestions to Improve Your Loan
					</h3>
					<ul class="space-y-2">
						{#each resultData.suggestionMsg as suggestion}
							<li class="flex items-start">
								<span class="text-blue-600 mr-2">•</span>
								<span class="text-blue-700 text-sm">{suggestion}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Complete Response Data -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
				<h3 class="text-lg font-semibold text-gray-800 mb-3">📋 Complete Response</h3>
				<pre class="bg-white p-4 rounded-md overflow-auto text-sm border">{JSON.stringify(
						resultData,
						null,
						2
					)}</pre>
			</div>
		</div>
	{/if}

	<!-- Debug info (only show when no results) -->
	{#if !resultData}
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
	{/if}
</div>
