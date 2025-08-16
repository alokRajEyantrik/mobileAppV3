<script lang="ts">
	import { onMount } from 'svelte';
	import { loanData } from '$lib/stores/loanData';
	import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
	import formSchema from '$lib/config/personal-loan-schema.json';
	import jsonLogic from 'json-logic-js';
	import gstStateCodes from '$lib/config/gstStateCodes.json';
	import pincode_IN_Selected from '$lib/config/pincode_IN_Selected.json';
	import { writable, get, type Writable } from 'svelte/store';
	import { goto } from '$app/navigation';
	import TextField from '$lib/components/TextField.svelte';
	import RadioField from '$lib/components/RadioField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import CheckboxField from '$lib/components/CheckboxField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import DateField from '$lib/components/DateField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import MultipleSelectField from '$lib/components/MultipleSelectField.svelte';
	import DerivedSelect from '$lib/components/DerivedSelect.svelte';
	import GroupFields from '$lib/components/GroupFields.svelte';
	import { submitApplication } from '$lib/services/api';
	import { formData } from '$lib/stores/formStepper';

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
			| 'multiple-select';
		question: string;
		description?: string;
		bindsTo?: string;
		bindsTo_template?: string;
		contextKey?: string;
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
			placeholder?: string | string[];
			rows?: number;
			min?: string | number;
			max?: string | number;
			step?: number | 'any';
		};
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
		[key: string]: string | number | boolean | (string | number)[] | undefined;
		loanName?: string;
	}

	interface LoanDataStore {
		[key: string]: Answers | string | undefined;
		loanName?: string;
	}

	// Component state
	let selectedLoan: string = '';
	let currentPageIndex: number = 0;
	let schema: Schema;
	let isSubmitting = false;
	let submitError: string | null = null;
	let resultData: any = null;
	const gstStateError: Writable<string> = writable('');

	async function handleSubmit() {
		try {
			isSubmitting = true;
			submitError = null;

			// Map form values to match working test data format
			const mapLoanType = (loanType: string | undefined): string => {
				switch (loanType) {
					case 'Start Fresh with New Loan':
						return 'New Loan';
					case 'Debt Consolidation with Extra Funds':
						return 'Balance Transfer';
					case 'Top Up':
						return 'Top Up';
					default:
						return 'New Loan';
				}
			};

			const mapEmploymentType = (empType: string | undefined): string => {
				if (!empType) return '';
				// Remove spaces to match test data format
				return empType.replace(/\s+/g, '');
			};

			// Format payload to match working test data structure exactly
			const formattedPayload = {
				loanTransaction: {
					LoanName: combinedAnswers.loanName || selectedLoan,
					LoanType: mapLoanType(combinedAnswers.loanType?.toString()),
					unSecureLoanType: combinedAnswers.unSecureLoanType || selectedLoan,
					existingLoan: combinedAnswers.existingLoan === 'Yes' ? 'Yes, in the form of loans' : 'No',
					payslips: combinedAnswers.payslips || 'Yes',
					Form16Available: combinedAnswers.Form16Available || 'Yes',
					ApplicantIsNRI: combinedAnswers.ApplicantIsNRI || combinedAnswers.applicantIsNRI || 'No',
					residenceStateName: combinedAnswers.residenceStateName || '',
					residenceCityName: combinedAnswers.residenceCityName || '',
					salariedBankName: combinedAnswers.salariedBankName || '',
					tellUsApplying: combinedAnswers.tellUsApplying || 'Individual',
					mortgageYear: Number(combinedAnswers.mortgageYear) || 5, // Ensure it's a number like test data
					SpecificLoanRequirement: combinedAnswers.SpecificLoanRequirement || 'No',
					tableLoanEntries: combinedAnswers.tableLoanEntries || [],
					tableLimitEntries: combinedAnswers.tableLimitEntries || [],
					RequiredLoanAmount: Number(combinedAnswers.RequiredLoanAmount) || 0
				},
				allApplicantDetails: [
					{
						title: combinedAnswers.title || 'Mr.',
						fullNameOfApplicant: combinedAnswers.fullNameOfApplicant || '',
						TypeOfResidence: combinedAnswers.TypeOfResidence || '',
						selectedAge: Number(combinedAnswers.selectedAge) || 0,
						EmploymentType: mapEmploymentType(combinedAnswers.EmploymentType?.toString()),
						creditScore: combinedAnswers.creditScore || '',
						fixedSalary: Number(combinedAnswers.fixedSalary) || 0,
						grossIncome: Number(combinedAnswers.grossIncome) || 0,
						monthlyOtherIncome: Number(combinedAnswers.monthlyOtherIncome) || 0,
						totalEMIs: Number(combinedAnswers.totalEMIs) || 0,
						totalLimit: Number(combinedAnswers.totalLimit) || 0
					}
				]
			};

			// Working test data for comparison
			const testData = {
				loanTransaction: {
					LoanName: 'Personal Loan',
					LoanType: 'New Loan',
					unSecureLoanType: 'Personal Loan',
					existingLoan: 'Yes, in the form of loans',
					payslips: 'Yes',
					Form16Available: 'Yes',
					ApplicantIsNRI: 'No',
					residenceStateName: 'Karnataka',
					residenceCityName: 'Belgaum',
					salariedBankName: 'Nainital Bank',
					tellUsApplying: 'Individual',
					mortgageYear: 5,
					SpecificLoanRequirement: 'No',
					tableLoanEntries: [
						{
							loanType: 'Loan Against Property',
							bankName: 'Central Bank of India',
							selectedToClose: 'Keep Running',
							emi: '1200',
							emiFormatted: '1,200',
							totalLimit: '',
							totalLimitFormatted: '',
							tenure: '9',
							interestRate: '8',
							remainingLimit: '',
							remainingLimitFormatted: '',
							remainingTenure: '',
							utilizedAmountFormatted: '',
							utilizedAmount: ''
						},
						{
							loanType: 'Personal Loan',
							bankName: 'Canara Bank',
							selectedToClose: 'Keep Running',
							emi: '1300',
							emiFormatted: '1,300',
							totalLimit: '',
							totalLimitFormatted: '',
							tenure: '8',
							interestRate: '8',
							remainingLimit: '',
							remainingLimitFormatted: '',
							remainingTenure: '',
							utilizedAmountFormatted: '',
							utilizedAmount: ''
						}
					],
					tableLimitEntries: [
						{
							loanType: 'OD Limit',
							bankName: 'Bank of Maharashtra',
							selectedToClose: 'Keep Running',
							emi: '',
							emiFormatted: '',
							totalLimit: '120000',
							totalLimitFormatted: '1,20,000',
							tenure: '8',
							interestRate: '12',
							remainingLimit: '',
							remainingLimitFormatted: '',
							remainingTenure: '',
							utilizedAmountFormatted: '',
							utilizedAmount: ''
						}
					],
					RequiredLoanAmount: 1700000
				},
				allApplicantDetails: [
					{
						title: 'Mr.',
						fullNameOfApplicant: 'dfgdfgd',
						TypeOfResidence: 'Self owned',
						selectedAge: 29,
						EmploymentType: 'Employed(Government)',
						creditScore: '780-799',
						fixedSalary: 90000,
						grossIncome: 100000,
						monthlyOtherIncome: 0,
						totalEMIs: 2500,
						totalLimit: 120000
					}
				]
			};

			console.log('=== COMPARISON ===');
			console.log('Test Data (WORKING):', testData);
			console.log('Formatted Data (FIXED):', formattedPayload);
			console.log('==================');

			// Using formatted payload with fixes to match working test data structure
			const res = await fetch('https://bank-loan-management.vercel.app/api/loan-eligibility', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formattedPayload)
			});

			const data = await res.json();
			console.log(data);

			// Store result data to show on UI
			resultData = data;

			// Clear form data from store after successful submission
			// loanData.set({});

			// Redirect to success page
		} catch (error) {
			console.error('Submission error:', error);
			submitError =
				error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
			submitError =
				error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

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
	$: residenceCityOptions = getCityOptionsForState(
		currentAnswers['residenceStateName']?.toString()
	);
	$: businessCityOptions = getCityOptionsForState(currentAnswers['businessStateName']?.toString());

	// Business address fields visibility (used in conditional rendering)
	$: showBusinessAddress = currentAnswers['addressSameOrNot'] === 'No';
	// Use the variable to prevent unused warning
	$: console.log('Business address visibility:', showBusinessAddress);

	// Utility function to sanitize keys
	function sanitizeKey(value: string | undefined): string {
		if (!value) return '';
		return value.replace(/\s+/g, '_');
	}

	// Resolve binding keys with template support
	function resolveBindsTo(question: Question, answers: Answers, selectedLoan: string): string {
		if (!question.existing_bindsTodsTo_template) return question.bindsTo || question.id;
		return question.bindsTo_template.replace(/\{([^}]+)\}/g, (_, key: string) => {
			if (key === 'q1_loanName') return sanitizeKey(selectedLoan);
			const val = answers[key];
			return typeof val === 'string' ? sanitizeKey(val) : (val?.toString() ?? '');
		});
	}

	onMount(() => {
		selectedLoan = ($loanData as LoanDataStore)?.loanName || '';
		schema = preprocessSchemaBindings(formSchema, selectedLoan) as Schema;
	});

	$: schema = preprocessSchemaBindings(formSchema, selectedLoan) as Schema;
	$: currentAnswers = ($loanData as LoanDataStore)[selectedLoan] ?? ({} as Answers);

	$: combinedAnswers = (() => {
		// Start with all current answers to ensure we include dynamically added collections
		const combined: Answers = { ...currentAnswers };

		// Process schema questions
		for (const page of schema.pages) {
			for (const q of page.questions) {
				const key = resolveBindsTo(q, currentAnswers, selectedLoan);
				if (key) {
					if (q.type === 'multiple-select') {
						combined[key] = (currentAnswers[key] as (string | number)[]) ?? [];
					} else if (q.type === 'number') {
						combined[key] = currentAnswers[key] ?? 0;
					} else if (q.type === 'checkbox') {
						combined[key] = currentAnswers[key] ?? false;
					} else {
						combined[key] = currentAnswers[key] ?? '';
					}

					// Also store without contextKey prefix for visibility checks
					if (key.includes('_')) {
						const shortKey = key.split('_').pop() || '';
						combined[shortKey] = combined[key];
					}

					// Store context keys
					if (q.contextKey) {
						combined[q.contextKey] = combined[key];
					}
				}
			}
		}

		// Ensure important fields are always present
		combined['q1_loanName'] = selectedLoan;
		combined['loanName'] = selectedLoan; // Also store without prefix

		console.log('Combined answers:', combined);
		return combined;
	})();

	// Filter out pages that should be hidden based on showWhen conditions
	$: visiblePages = schema.pages.filter(
		(page) => !page.showWhen || jsonLogic.apply(page.showWhen, combinedAnswers)
	);

	// Map current page index to visible pages array index
	$: currentPageIndex = Math.min(currentPageIndex, visiblePages.length - 1);

	$: currentPage = visiblePages[currentPageIndex];
	$: visibleQuestions =
		currentPage?.questions.filter((q) => isQuestionVisible(q, combinedAnswers)) ?? [];
	$: console.log('Visible Questions:', visibleQuestions);

	// Get dynamic option value (enhanced for multiple types)
	function getOptionValue(
		value: string | { var: string } | number | boolean
	): string | number | boolean {
		if (typeof value === 'object' && 'var' in value) return combinedAnswers[value.var] ?? '';
		return value;
	}

	// Use the function to prevent unused warning
	$: console.log('Option value helper available:', typeof getOptionValue);

	// Update answer in store (enhanced for type safety with generics, including arrays)
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

	// Validators (expandable for new types, added example for multiple-select)
	const validators = {
		validateGSTState,
		validateMinSelections(values: (string | number)[]): string | null {
			if (values.length < 1) return 'minSelections';
			return null;
		}
	};

	// Handlers for grouped entries (arrays of objects)
	function addGroupEntry(collectionKey: string, entry: any) {
		try {
			// Special handling for specific collections based on the schema
			const isExistingLoanCollection =
				collectionKey === 'existingLoans' ||
				collectionKey.includes('loanType') ||
				collectionKey === 'tableLoanEntries';

			// Use a standardized collection key for loan details
			const finalCollectionKey = isExistingLoanCollection
				? 'q1_loanType_collection'
				: collectionKey;

			console.log(
				`Adding entry to collection ${collectionKey} (standardized to: ${finalCollectionKey})`,
				entry
			);

			// Get existing entries or initialize empty array
			const existingEntries = currentAnswers[finalCollectionKey] || [];

			// Check if existingEntries is an array, if not convert to array
			const validEntries = Array.isArray(existingEntries) ? existingEntries : [];

			// Create new array with the new entry
			const updatedEntries = [...validEntries, entry];
			console.log('Updated entries:', updatedEntries);

			// Update the store with the new array
			updateAnswerByKey(finalCollectionKey, updatedEntries);

			// Force a refresh of the reactive store
			setTimeout(() => {
				loanData.update((data) => {
					// Make sure we preserve the updated entries in the store
					const updatedData = { ...data };
					if (isExistingLoanCollection) {
						// Ensure the standardized key is properly updated
						updatedData[finalCollectionKey] = updatedEntries;
					}
					return updatedData;
				});

				// Log current store state for debugging
				console.log('Current store state after update:', get(loanData));
			}, 10);
		} catch (error) {
			console.error('Error adding group entry:', error);
			alert('Failed to add entry. Please try again.');
		}
	}
	function deleteGroupEntry(collectionKey: string, index: number) {
		console.log('Deleting entry at index', index, 'from collection:', collectionKey);

		// Special handling for specific collections based on the schema
		const isExistingLoanCollection =
			collectionKey === 'existingLoans' || collectionKey.includes('loanType');

		// Use a standardized collection key for loan details
		const finalCollectionKey = isExistingLoanCollection ? 'q1_loanType_collection' : collectionKey;

		// Safely get the current entries array
		let prev = currentAnswers[finalCollectionKey];

		// Validate the collection is an array
		if (!Array.isArray(prev)) {
			console.warn('Cannot delete from non-array:', prev);
			return;
		}

		// Make sure the index is valid
		if (index < 0 || index >= prev.length) {
			console.warn('Invalid index for deletion:', index, 'in array of length', prev.length);
			return;
		}

		// Create a new array without the deleted entry
		const next = [...prev.slice(0, index), ...prev.slice(index + 1)];
		console.log('New entries after deletion:', next);

		// Update the store
		updateAnswerByKey(finalCollectionKey, next);

		// Force a refresh of the reactive store
		setTimeout(() => {
			loanData.update((data) => {
				// This creates a new reference to trigger reactivity
				return { ...data };
			});
		}, 10);
	}

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

	// Main update function with special handling (enhanced for multiple types, including arrays)
	function updateAnswer(
		question: Question,
		value: string | number | boolean | (string | number)[]
	): void {
		console.log('Updating answer:', { questionId: question.id, value });
		if (question.id === 'q1_loanName') {
			selectedLoan = value as string;
			schema = preprocessSchemaBindings(formSchema, selectedLoan) as Schema;
			currentPageIndex = 0;
		}

		const key = resolveBindsTo(question, currentAnswers, selectedLoan);
		updateAnswerByKey(key, value);

		// Also update with correct casing if it's the NRI question
		if (key === 'applicantIsNRI') {
			updateAnswerByKey('ApplicantIsNRI', value);
		}

		if (key === 'GSTNumber') {
			updateStateFromGST(value as string);
		}

		if (key === 'residenceStateName') {
			updateAnswerByKey('residenceCityName', '');
		} else if (key === 'businessStateName') {
			updateAnswerByKey('businessCityName', '');
		} else if (key === 'TypeOfResidence') {
			// Also update lowercase version for visibility conditions
			updateAnswerByKey('typeOfResidence', value);
		} else if (key === 'addressSameOrNot' && value === 'Yes') {
			// Copy residence address to business address when "Yes" is selected
			updateAnswerByKey('businessStateName', currentAnswers['residenceStateName'] || '');
			updateAnswerByKey('businessCityName', currentAnswers['residenceCityName'] || '');
		}
	}

	// Visibility check
	function isQuestionVisible(question: Question, formData: Answers): boolean {
		if (!question.showWhen) return true;

		// Create case-insensitive version of form data
		const normalizedData: Record<string, any> = {};
		for (const [key, value] of Object.entries(formData)) {
			// Store value under all possible casings
			normalizedData[key] = value;
			normalizedData[key.toLowerCase()] = value;
			normalizedData[key.toUpperCase()] = value;
			// Also store with first letter capitalized
			normalizedData[key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()] = value;

			// Store for keys without contextKey prefix
			if (key.includes('_')) {
				const shortKey = key.split('_').pop() || '';
				normalizedData[shortKey] = value;
				normalizedData[shortKey.toLowerCase()] = value;
				normalizedData[shortKey.toUpperCase()] = value;
				normalizedData[shortKey.charAt(0).toUpperCase() + shortKey.slice(1).toLowerCase()] = value;
			}

			// Store type-specific variations
			if (key.includes('Type')) {
				const withoutType = key.replace('Type', '');
				normalizedData[withoutType.toLowerCase()] = value;
				normalizedData[withoutType.toUpperCase()] = value;
				normalizedData[withoutType.charAt(0).toUpperCase() + withoutType.slice(1).toLowerCase()] =
					value;
			}
		}

		// Store bindsTo values separately
		if (question.bindsTo_template) {
			const key = resolveBindsTo(question, formData, formData.q1_loanName as string);
			const value = formData[key];
			if (value !== undefined) {
				normalizedData[key] = value;
				normalizedData[key.toLowerCase()] = value;
				normalizedData[key.toUpperCase()] = value;
			}
		}

		// Log visibility check for debugging
		console.log('Question:', question.id);
		console.log('ShowWhen condition:', question.showWhen);
		console.log('Form data:', formData);
		console.log('Normalized data:', normalizedData);

		const isVisible = jsonLogic.apply(question.showWhen, normalizedData);
		console.log('Visibility result:', isVisible);

		return isVisible;
	}

	// Navigation functions
	function goNext(): void {
		if (currentPageIndex < visiblePages.length - 1) currentPageIndex += 1;
	}

	function goPrev(): void {
		if (currentPageIndex > 0) currentPageIndex -= 1;
	}

	// Helper: flatten questions, expanding any group wrappers into their inner questions
	function flattenQuestions(questions: any[]): any[] {
		const out: any[] = [];
		for (const q of questions) {
			if ('group' in q && Array.isArray((q as any).group)) {
				for (const inner of (q as any).group as any[]) out.push(inner);
			} else {
				out.push(q);
			}
		}
		return out;
	}

	// Check if all required questions are answered (enhanced for new types, including arrays)
	function allRequiredAnswered(): boolean {
		const flat = flattenQuestions(currentPage.questions);
		return flat
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
		if (
			typeof question.id === 'string' &&
			(question.id.startsWith('q4_business') || question.id.startsWith('q5_business'))
		) {
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
		for (const q of flattenQuestions(currentPage.questions)) {
			if (isQuestionVisible(q, combinedAnswers) && hasValidationError(q, combinedAnswers)) {
				enabled = true;
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


				if (q.type === 'multiple-select') {
					return Array.isArray(val) && val.length > 0;
				}


				return val !== undefined && val !== null && (typeof val !== 'string' || val !== '');
			});
		});
	})();

	export const testing = writable({
		loanType: '',

		bankName: '',
		selectedToClose: '',
		closurePlan: '',
		EMIs: '',
		tenure: '',
		interestRate: '',
		tableLoanEntries: [], // ✅ This is where we will push
		tableLimitEntries: [] // ✅ This is where we will push
	});
	const disableAddButton = (q, data) => {
		if (!q.disabledCondition?.anyEmpty) return false;

		return q.disabledCondition.anyEmpty.some((fieldName) => {
			console.log('data', data);
			console.log('fieldName', fieldName);
			const value = data[fieldName];
			return value === undefined || value === null || value === '';
		});
	};
	const handleAddClick = () => {
		const currentData = get(testing); // only for validation

		// Required fields check
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

		if (['Dropline OD', 'CC Limit', 'OD Limit'].includes(currentData.loanType)) {

            console.log('Special loan type detected');
		}  else {
		// Prepare new loan entry
		const newEntry = {
			loanType: currentData.loanType,
			bankName: currentData.bankName,
			selectedToClose: currentData.selectedToClose,
			EMIs: Number(currentData.EMIs),
			tenure: currentData.tenure,
			interestRate: currentData.interestRate
		};

		// Ensure currentAnswers.tableLoanEntries exists
		if (!Array.isArray(currentAnswers.tableLoanEntries)) {
			currentAnswers.tableLoanEntries = [];
		}

		// Push into currentAnswers
		currentAnswers.tableLoanEntries.push(newEntry);

		// If selectedToClose is 'Keep Running', calculate totalEMIs
		if (newEntry.selectedToClose.toLowerCase() === 'keep running') {
			currentAnswers.totalEMIs = currentAnswers.tableLoanEntries
				.filter((item) => item.selectedToClose.toLowerCase() === 'keep running')
				.reduce((sum, entry) => sum + Number(entry.EMIs || 0), 0);
		}

		// Clear the validated fields in `testing` (optional)
		requiredFields.forEach((field) => {
			currentData[field] = '';
		});

	}

		console.log('Updated currentAnswers:', currentAnswers);
	};

	const handleInput = (id, value) => {
		if (!id) {
			console.warn('handleInput called with undefined id', value);
			return;
		}
		testing.update((data) => ({ ...data, [id]: value }));
	};

	
</script>

<!-- Main container with responsive padding and max-width -->
<div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
	<!-- Form title or header can be added here if needed -->

	<div class="bg-white shadow-md rounded-lg p-6">
		<div class="mb-6">
			<h2 class="font-bold text-3xl">{currentPage?.title || 'Loan Application'}</h2>
		</div>
		<!-- Render visible questions with support for new input types -->
		{#each visibleQuestions as question (question.id)}
			<div class="mb-6">
				{#if question.type === 'radio'}
					<RadioField
						id={question.id}
						name={question.id}
						label={question.question}
						description={question.description}
						options={question.options?.map((opt) => ({
							label:
								typeof opt.label === 'object' && opt.label.var
									? combinedAnswers[opt.label.var]?.toString() || opt.label.var
									: (opt.label as string),
							value:
								typeof opt.value === 'object' && 'var' in opt.value
									? combinedAnswers[opt.value.var]?.toString() || ''
									: opt.value.toString()
						})) ?? []}
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
						label={question.question}
						description={question.description}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						readonly={question.uiMeta?.readonly ?? false}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onInput={(value: string) => updateAnswer(question, value)}
					/>
				{:else if question.type === 'select'}
					<SelectField
						id={question.id}
						label={question.question}
						description={question.description}
						options={question.id === 'q1_residenceStateName' ||
						question.id === 'q4_businessStateName'
							? stateOptions
							: (question.options?.map((opt) => ({
									label:
										typeof opt.label === 'object' && opt.label.var
											? combinedAnswers[opt.label.var]?.toString() || opt.label.var
											: (opt.label as string),
									value:
										typeof opt.value === 'object' && 'var' in opt.value
											? (combinedAnswers[opt.value.var] as string | number)
											: (opt.value as string | number)
								})) ?? [])}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
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
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() ?? ''}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
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
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(checked: boolean) => updateAnswer(question, checked)}
					/>
				{:else if question.type === 'textarea'}
					<TextareaField
						id={question.id}
						label={question.question}
						description={question.description}
						value={currentAnswers[
							resolveBindsTo(question, combinedAnswers, selectedLoan)
						]?.toString() || ''}
						rows={question.uiMeta?.rows ?? 4}
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
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
						error={getValidationErrorMessage(question, combinedAnswers) || undefined}
						onChange={(value: string) => updateAnswer(question, value)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'number'}
					<NumberField
						id={question.id}
						label={question.question}
						description={question.description}
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
						onInput={(value: number | number[] | null) => updateAnswer(question, value ?? 0)}
						required={question.required ?? false}
					/>
				{:else if question.type === 'multiple-select'}
					<MultipleSelectField
						id={question.id}
						label={question.question}
						description={question.description}
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
				{:else if question.type === 'existingtext'}
					<div>
						<label>{question.question}</label>
						<input
							type="text"
							value={$testing[question.existing_bindsTo] || ''}
							on:input={(e) => handleInput(question.existing_bindsTo, e.target.value)}
						/>
					</div>
				{:else if question.type === 'existingselect'}
					<div>
						<label>{question.question}</label>
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
				{:else if question.type === 'button'}
					<button on:click={handleAddClick} disabled={disableAddButton(question, $testing)}>
						{question.question}
					</button>
				{/if}
			</div>
		{/each}
		{#if Array.isArray(currentAnswers.tableLoanEntries) && currentAnswers.tableLoanEntries.length > 0 && currentPage.title == 'Existing Details'}
			<h3>Added Loan Entries:</h3>
			<table class="loan-table">
				<thead>
					<tr>
						<th>Type</th>
						<th>Bank Name</th>
						<th>Closure Plan</th>
						<th>EMI</th>
						<th>Tenure (mo)</th>
						<th>Interest (p.a)</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each currentAnswers.tableLoanEntries as entry, i}
						<tr>
							<td>{entry.loanType}</td>
							<td>{entry.bankName}</td>
							<td>{entry.selectedToClose}</td>
							<td>{entry.EMIs}</td>
							<td>{entry.tenure}</td>
							<td>{entry.interestRate}</td>
							<td>
								<button on:click={() => editEntry(i)}>✏️</button>
								<button on:click={() => deleteEntry(i)}>🗑️</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

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
						disabled={!canSubmit || isSubmitting}
						class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
						on:click={handleSubmit}
						aria-label="Submit application"
						aria-disabled={!canSubmit || isSubmitting}
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

<style>
	.loan-table {
		border-collapse: collapse;
		width: 100%;
		font-family: Arial, sans-serif;
	}

	.loan-table th,
	.loan-table td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	.loan-table th {
		background-color: #f4f4f4;
		font-weight: bold;
	}

	.loan-table tr:nth-child(even) {
		background-color: #f9f9f9;
	}

	.loan-table tr:hover {
		background-color: #f1f1f1;
	}

	.loan-table button {
		border: none;
		background: none;
		cursor: pointer;
		font-size: 16px;
		margin-right: 5px;
	}
</style>
