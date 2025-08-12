<script lang="ts">
	import TextField from './TextField.svelte';
	import RadioField from './RadioField.svelte';
	import SelectField from './SelectField.svelte';
	import CheckboxField from './CheckboxField.svelte';
	import TextareaField from './TextareaField.svelte';
	import DateField from './DateField.svelte';
	import NumberField from './NumberField.svelte';
	import jsonLogic from 'json-logic-js';
	import { fade } from 'svelte/transition';

	export let groupedQuestions: any[] = [];
	export let combinedAnswers: any = {};
	export let selectedLoan: string = '';
	export let updateAnswer: (question: any, value: any) => void;
	export let addGroupEntry: (collectionKey: string, entry: any) => void;
	export let deleteGroupEntry: (collectionKey: string, index: number) => void;
	// Optional collection key template passed from parent page (e.g. bindsTo_template)
	// Optional collection key template passed from parent page (e.g. page.bindsTo_template)
	export let collectionTemplate: string = '';

	// Function to check if a question should be visible
	function isQuestionVisible(question: any, answers: any): boolean {
		if (!question.showWhen) return true;
		return jsonLogic.apply(question.showWhen, answers);
	}

	// Function to resolve binding keys with template support
	function resolveBindsTo(question: any, answers: any, selectedLoan: string): string {
		if (!question.bindsTo_template) return question.bindsTo || question.id;
		return question.bindsTo_template.replace(/\{([^}]+)\}/g, (_: string, key: string) => {
			if (key === 'q1_loanName') return sanitizeKey(selectedLoan);
			const val = answers[key];
			return typeof val === 'string' ? sanitizeKey(val) : (val?.toString() ?? '');
		});
	}

	// Utility function to sanitize keys
	function sanitizeKey(value: string | undefined): string {
		if (!value) return '';
		return value.replace(/\s+/g, '_');
	}

	// Get current answer value for a question
	function getCurrentAnswer(question: any): any {
		const key = resolveBindsTo(question, combinedAnswers, selectedLoan);
		return combinedAnswers[key];
	}

	// Filter visible questions from the group
	$: visibleGroupQuestions = groupedQuestions.filter((q: any) => isQuestionVisible(q, combinedAnswers));
	
	// Success notification state
	let showSuccessMessage = false;
	function showSuccessNotification() {
		showSuccessMessage = true;
		setTimeout(() => {
			showSuccessMessage = false;
		}, 3000);
	}

	// Derive collection key (e.g., 'tableLoanEntries') from first question with a dotted bindsTo_template
	// If no dotted keys are found, use a fallback based on the group context
	function deriveCollectionKey(): string | null {
		console.log('Deriving collection key for questions:', groupedQuestions);
		
		// If a collectionTemplate is provided by the parent, use it directly
		if (collectionTemplate) {
			console.log('Using dynamic collection key from template:', collectionTemplate);
			return collectionTemplate;
		}
		
		// Special handling for groups with dotted bindsTo pattern like "loans.0.loanType"
		for (const q of groupedQuestions) {
			const bindsTo = q.bindsTo_template || q.bindsTo || '';
			if (typeof bindsTo === 'string' && bindsTo.includes('.')) {
				// Extract collection key from dotted notation (e.g., "loans.0.type" -> "loans")
				const parts = bindsTo.split('.');
				const collectionKey = parts[0];
				console.log('Found collection key from dotted bindsTo:', collectionKey);
				return collectionKey;
			}
		}
		
		// If no dotted bindsTo, try to create a collection key based on the first question's bindsTo
		if (groupedQuestions.length > 0) {
			const firstQuestion = groupedQuestions[0];
			
			// For other fields, create a key based on bindsTo or id
			const bindsTo = firstQuestion.bindsTo_template || firstQuestion.bindsTo || firstQuestion.id || '';
			
			// Create a collection name based on the context
			const collectionKey = `tableLoanEntries`;
			console.log('Created fallback collection key:', collectionKey);
			return collectionKey;
		}
		
		console.log('Could not derive collection key from groupedQuestions:', groupedQuestions);
		return null;
	}

	function handleAdd(): void {
		const collectionKey = deriveCollectionKey();
		if (!collectionKey) {
			console.error('Could not determine collection key, add button will not work');
			return;
		}
		
		console.log('Adding entry to collection:', collectionKey);
		
		// Create a new entry object with values from all visible questions
		const entry: Record<string, any> = {};
		let hasValues = false;
		
		// Special handling for existing loan details
		const isExistingLoanGroup = groupedQuestions.some(q => 
			q.id?.includes('loanType') || 
			(q.question && q.question.toLowerCase().includes('loan'))
		);
		
		for (const q of visibleGroupQuestions) {
			// Get the current value for this question
			const fullKey = resolveBindsTo(q, combinedAnswers, selectedLoan);
			const value = combinedAnswers[fullKey];
			
			// Determine the property name to use in the entry
			let propName;
			if (isExistingLoanGroup) {
				// For the existing loan details form, use the question text as the key
				propName = q.question || q.id;
			} else if (fullKey.includes('.')) {
				// For dotted notation, use the part after the dot
				const parts = fullKey.split('.');
				propName = parts.length > 1 ? parts.slice(1).join('.') : parts[0];
			} else {
				// Default case - use bindsTo key or id
				propName = q.bindsTo || q.contextKey || q.id;
			}
			
			console.log(`Field mapping: ${q.question} (${fullKey}) -> ${propName}`, value);
			
			// Only add non-empty values to the entry
			if (value !== undefined && value !== '' && value !== null) {
				entry[propName] = value;
				hasValues = true;
			}
		}
		
		// Only add entry if it has at least one value
		if (!hasValues) {
			console.warn('No values to add, skipping empty entry');
			return;
		}
		
		// Add a timestamp or unique ID to each entry to help with rendering and deletion
		entry['_id'] = new Date().getTime().toString();
		
		// Call the addGroupEntry function provided by the parent
		console.log('Adding entry:', entry, 'to collection:', collectionKey);
		addGroupEntry(collectionKey, entry);
		
		// Show success message
		showSuccessNotification();
		
		// Clear current inputs after adding
		for (const q of visibleGroupQuestions) {
			const t = q.type;
			let emptyVal;
			
			// Handle different field types
			switch(t) {
				case 'checkbox':
					emptyVal = false;
					break;
				case 'number':
					emptyVal = null;
					break;
				case 'select':
					// For select fields, return to default empty state
					emptyVal = '';
					break;
				default:
					emptyVal = '';
			}
			
			console.log(`Clearing field: ${q.id} (${q.type}) with value:`, emptyVal);
			updateAnswer(q, emptyVal);
		}
	}

	// Reactive helpers for displaying added entries
	$: collectionKey = deriveCollectionKey();
	$: entries = (() => {
		// Determine final collection key: use template if provided, else derive
		const finalCollectionKey = collectionTemplate || collectionKey;
		let result: any[] = [];
		
		if (finalCollectionKey) {
			const entriesFromCombined = combinedAnswers[finalCollectionKey];
			if (Array.isArray(entriesFromCombined)) {
				result = entriesFromCombined;
			} else {
				console.log(`No entries found under ${finalCollectionKey}`);
			}
		}
		console.log('Current entries for', finalCollectionKey, ':', result);
		return result;
	})();
	
	// Columns derived from visible questions
	$: columns = visibleGroupQuestions.map((q: any) => {
		// For display label, use the question text
		const label = q.question || q.id;
		
		// For property key, try to determine from bindsTo
		let key = q.id;
		const fullKey = resolveBindsTo(q, combinedAnswers, selectedLoan);
		
		if (fullKey.includes('.')) {
			const parts = fullKey.split('.');
			key = parts.length > 1 ? parts.slice(1).join('.') : parts[0];
		} else {
			// No dot notation, use the question text as the key
			key = q.question || q.id;
		}
		
		console.log('Mapped column:', { fullKey, key, label });
		return { key, label };
	});
</script>

<div class="space-y-6">
	{#each visibleGroupQuestions as question (question.id)}
		<div class="mb-4">
			{#if question.type === 'radio'}
				<RadioField
					label={question.question}
					id={question.id}
					name={question.id}
					options={question.options || []}
					value={getCurrentAnswer(question)}
					error={null}
					onChange={(value) => {
						updateAnswer(question, value);
					}}
				/>
			{:else if question.type === 'select'}
				<SelectField
					id={question.id}
					label={question.question}
					options={question.options || []}
					value={getCurrentAnswer(question)}
					error={null}
					onChange={(value) => {
						updateAnswer(question, value);
					}}
				/>
			{:else if question.type === 'text'}
				<TextField
					label={question.question}
					id={question.id}
					value={getCurrentAnswer(question)}
					error={null}
					onInput={(value) => {
						updateAnswer(question, value);
					}}
				/>
			{:else if question.type === 'textarea'}
				<TextareaField
					id={question.id}
					label={question.question}
					value={getCurrentAnswer(question)}
					error={null}
					onInput={(value) => {
						updateAnswer(question, value);
					}}
				/>
			{:else if question.type === 'checkbox'}
				<CheckboxField
					id={question.id}
					label={question.question}
					checked={!!getCurrentAnswer(question)}
					error={null}
					onChange={(checked) => {
						updateAnswer(question, checked);
					}}
				/>
			{:else if question.type === 'date'}
				<DateField
					id={question.id}
					label={question.question}
					value={getCurrentAnswer(question)}
					error={null}
					onChange={(value) => {
						updateAnswer(question, value);
					}}
				/>
			{:else if question.type === 'number'}
				<NumberField
					id={question.id}
					label={question.question}
					value={getCurrentAnswer(question) ?? null}
					error={null}
					onInput={(value) => {
						updateAnswer(question, value);
					}}
				/>
			{/if}
		</div>
	{/each}

	<div class="mt-4 flex space-x-3">
		<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2" on:click={handleAdd}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<span>Add</span>
		</button>
		<button class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center space-x-2" on:click={() => {
			// Clear all visible questions
			for (const q of visibleGroupQuestions) {
				updateAnswer(q, q.type === 'number' ? null : '');
			}
		}}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
			</svg>
			<span>Clear</span>
		</button>
	</div>
	
	{#if showSuccessMessage}
		<div class="mt-3" transition:fade>
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
				<strong class="font-bold">Success!</strong>
				<span class="block sm:inline"> Entry added successfully.</span>
			</div>
		</div>
	{/if}

	{#if collectionKey}
		<!-- Entries table -->
		<div class="mt-6">
			<h3 class="text-lg font-semibold mb-2">Added Entries</h3>
			{#if !entries || entries.length === 0}
				<p class="text-sm text-gray-500">No entries added yet.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm">
						<thead class="bg-blue-50">
							<tr>
								{#each visibleGroupQuestions as question}
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
										{question.question}
									</th>
								{/each}
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each entries as row, i}
								<tr class="border-b hover:bg-gray-50 transition-colors">
									{#each visibleGroupQuestions as question}
										<td class="px-4 py-3 text-sm whitespace-nowrap">
											{#if row[question.question] !== undefined}
												<!-- If the entry has a value with the question text as key -->
												{#if question.type === 'date' && row[question.question]}
													{new Date(row[question.question]).toLocaleDateString()}
												{:else}
													{row[question.question]}
												{/if}
											{:else if row[question.id] !== undefined}
												<!-- Try with the question ID -->
												{#if question.type === 'date' && row[question.id]}
													{new Date(row[question.id]).toLocaleDateString()}
												{:else}
													{row[question.id]}
												{/if}
											{:else if row[question.bindsTo] !== undefined}
												<!-- Try with the bindsTo property -->
												{#if question.type === 'date' && row[question.bindsTo]}
													{new Date(row[question.bindsTo]).toLocaleDateString()}
												{:else}
													{row[question.bindsTo]}
												{/if}
											{:else if row[question.contextKey] !== undefined}
												<!-- Try with contextKey -->
												{#if question.type === 'date' && row[question.contextKey]}
													{new Date(row[question.contextKey]).toLocaleDateString()}
												{:else}
													{row[question.contextKey]}
												{/if}
											{:else}
												<!-- Last resort: try variations of the question text -->
												{@const value = row[question.question?.replace(/\s+/g, '_')] ?? 
												 row[question.question?.toLowerCase()] ?? 
												 ''}
												{#if question.type === 'date' && value}
													{new Date(value).toLocaleDateString()}
												{:else}
													{value}
												{/if}
											{/if}
										</td>
									{/each}
									<td class="px-4 py-3">
										<button 
											class="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center space-x-1" 
											on:click={() => {
												// Use the standardized collection key for existing loans
												const isExistingLoanCollection = collectionKey === 'existingLoans' || collectionKey?.includes('loanType');
												const finalCollectionKey = isExistingLoanCollection ? 'q1_loanType_collection' : collectionKey;
												deleteGroupEntry(finalCollectionKey!, i);
											}}
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
											<span>Delete</span>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>