<script>
	import { onMount } from 'svelte';
	import { loanData } from '$lib/stores/loanData';
	import { get } from 'svelte/store';
	import { preprocessSchemaBindings } from '$lib/utils/schemaUtils';
	import formSchema from '$lib/config/formSchema.json'; // Adjust path as needed

	// Mock schema with bindsTo_template for demo
	// const formSchema = {
	// 	pages: [
	// 		{
	// 			id: 'loanDetails',
	// 			title: 'Loan Details',
	// 			questions: [
	// 				{
	// 					id: 'q1_loanName',
	// 					type: 'radio',
	// 					question: 'Which loan do you want?',
	// 					options: [
	// 						{ label: 'Personal Loan', value: 'Personal Loan' },
	// 						{ label: 'Home Loan', value: 'Home Loan' }
	// 					]
	// 				},
	// 				{
	// 					id: 'q2_productType',
	// 					type: 'text',
	// 					question: 'Product Type for loan',
	// 					bindsTo_template: 'loan.{loanName}.productType'
	// 				}
	// 			]
	// 		}
	// 	]
	// };

	let selectedLoan = 'Personal Loan'; // Default selected loan

	// Preprocessed schema based on selected loan
	let schema = preprocessSchemaBindings(formSchema, selectedLoan);

	// Current answers for selected loan
	$: currentAnswers = get(loanData)[selectedLoan] || {};

	// Change loan type: update schema and refresh answers
	function onLoanChange(event) {
		selectedLoan = event.target.value;
		schema = preprocessSchemaBindings(formSchema, selectedLoan);
	}

	// Update answer in store
	function updateAnswer(questionId, value) {
		loanData.update((data) => {
			if (!data[selectedLoan]) data[selectedLoan] = {};
			data[selectedLoan][questionId] = value;
			return data;
		});
	}

	$: console.log(formSchema, 'formSchema');
	$: console.log($loanData, 'loan data');
</script>

<h2>Select Loan Type</h2>
{#each formSchema.pages[0].questions[0].options as option}
	<label>
		<input
			type="radio"
			name="loanName"
			value={option.value}
			bind:group={selectedLoan}
			on:change={onLoanChange}
		/>
		{option.label}
	</label>
{/each}

<hr />

<h2>{schema.pages[0].title}</h2>

{#each schema.pages[0].questions.filter((q) => q.id !== 'q1_loanName') as question}
	<div style="margin-bottom: 1rem;">
		<label for={question.id}>{question.question}</label>
		{#if question.type === 'text'}
			<input
				id={question.id}
				type="text"
				value={currentAnswers[question.id] || ''}
				on:input={(e) => updateAnswer(question.id, e.target.value)}
			/>
		{/if}
		<!-- Extend here for other input types -->
	</div>
{/each}

<hr />

<h3>Debug: Current Answers for {selectedLoan}</h3>
<pre>{JSON.stringify(currentAnswers, null, 2)}</pre>
