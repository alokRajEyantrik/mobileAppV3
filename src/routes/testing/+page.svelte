<script>
	import { writable, get } from 'svelte/store';
	// 

	export const formSchema = [

		{
			page: 1,
			title: 'Existing Loan / Credit Obligations',
			description:
				'Please provide details of your existing loans, credit cards, or other financial obligations.',
			questions: [
				{
					name: 'loanType',
					type: 'select',
					label: 'Type',
					required: true,
					options: [
						{
							label: 'Business Loan - Unsecured',
							value: 'Business Loan - Unsecured'
						},
						{
							label: 'Business Loan - Secured',
							value: 'Business Loan - Secured'
						},
						{
							label: 'Loan Against Property',
							value: 'Loan Against Property'
						},
						{
							label: 'Machinery Loan',
							value: 'Machinery Loan'
						},
						{
							label: 'Vehicle Loan',
							value: 'Vehicle Loan'
						},
						{
							label: 'Property Loan',
							value: 'Property Loan'
						},
						{
							label: 'OD Limit',
							value: 'OD Limit'
						},
						{
							label: 'CC Limit',
							value: 'CC Limit'
						},
						{
							label: 'Dropline OD',
							value: 'Dropline OD'
						},
						{
							label: 'Other Type Loan',
							value: 'Other Type Loan'
						}
					],
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				},
				{
					name: 'bankName',
					type: 'select',
					label: 'Bank Name',
					required: true,
					options: [
						{
							label: 'HDFC Bank',
							value: 'HDFC Bank'
						},
						{
							label: 'SBI Bank',
							value: 'SBI Bank'
						},
						{
							label: 'Axis Bank',
							value: 'Axis Bank'
						},
						{
							label: 'ICICI Bank',
							value: 'ICICI Bank'
						},
						{
							label: 'Canara Bank',
							value: 'Canara Bank'
						},
						{
							label: 'Bank of Baroda',
							value: 'Bank of Baroda'
						},
						{
							label: 'Citi Bank',
							value: 'Citi Bank'
						},
						{
							label: 'Union Bank',
							value: 'Union Bank'
						}
					],
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				},
				{
					name: 'selectedToClose',
					type: 'select',
					label: 'Closure Plan',
					required: true,
					options: [
						{
							label: 'Self-funded (before loan disbursement)',
							value: 'Self-funded'
						},
						{
							label: 'will be closed by this loan',
							value: 'closed by this loan'
						},
						{
							label: 'keep running',
							value: 'keep running'
						}
					],
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				},
				{
					name: 'EMIs',
					type: 'currency',
					label: 'EMI (monthly)',
					placeholder: 'Enter EMI amount',
					required: true,
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				},
				{
					name: 'tenure',
					type: 'number',
					label: 'Remaining Tenure (in months)',
					placeholder: 'Enter months',
					required: true,
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				},
				{
					name: 'interestRate',
					type: 'number',
					label: 'Interest Rate (p.a)',
					suffix: '%',
					placeholder: 'Enter interest rate',
					required: true,
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				},
				{
					type: 'button',
					label: 'Add',
					name: 'addLoanButton',
					disabledCondition: {
						anyEmpty: ['loanType', 'bankName', 'selectedToClose', 'EMIs', 'tenure', 'interestRate']
					},
					showWhen: { var: 'hasExistingObligations', equals: 'yes' }
				}
			]
		},

		
	];

	let currentPage = 1;
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
	const handleInput = (id, value) => {
		testing.update((data) => {
			const newData = { ...data, [id]: value };
			return newData;
		});
	};

	const disableAddButton = (q, data) => {
		if (!q.disabledCondition?.anyEmpty) return false;
		return q.disabledCondition.anyEmpty.some((fieldName) => {
			const value = data[fieldName];
			return value === undefined || value === null || value === '';
		});
	};

	const shouldShow = (q, data) => {
		if (!q.showWhen) return true;
		return data[q.showWhen.var] === q.showWhen.equals;
	};

	const handleAddClick = () => {
		const currentData = get(testing);
		// Fields that must be filled before adding
		const requiredFields = [
			'loanType',
			'bankName',
			'selectedToClose',
			'EMIs',
			'tenure',
			'interestRate'
		];

		// Check for missing field
		const missingField = requiredFields.some((field) => !currentData[field]);
		if (missingField) {
			alert('Please fill all fields before adding');
			return;
		}

		if (['Dropline OD', 'CC Limit', 'OD Limit'].includes(currentData.loanType)) {

            console.log('Special loan type detected');
		}  else {
		testing.update((data) => {
			const newEntry = {
				loanType: data.loanType,
				bankName: data.bankName,
				selectedToClose: data.selectedToClose,
				EMIs: Number(data.EMIs), // Ensure EMIs is number
				tenure: data.tenure,
				interestRate: data.interestRate
			};

			// Push new loan entry
			data.tableLoanEntries.push(newEntry);

			// If selectedToClose is 'keep running', calculate totalEMI
			if (newEntry.selectedToClose === 'keep running') {
				const totalEMIs = data.tableLoanEntries.filter((item) => item.selectedToClose === 'keep running').reduce(
					(sum, entry) => sum + Number(entry.EMIs || 0),
					0
				);
				data.totalEMIs = totalEMIs;
			}

			// Clear only loan-related fields
			requiredFields.forEach((field) => {
				data[field] = '';
			});

			return data;
		});
	}

		// ✅ Push into loanNameEntries key in testing

		// ✅ Console full object
		console.log('Updated testing:', get(testing));
	};

	const goNext = () => {
		currentPage++;
	};

	const goBack = () => {
		currentPage--;
	};
	$: console.log($testing);
</script>

{#each formSchema as page}
	{#if page.page === currentPage}
		<h2>{page.title}</h2>
		{#if page.description}<p>{page.description}</p>{/if}

		{#each page.questions as question}
        
			{#if shouldShow(question, $testing)}
				{#if question.type === 'text'}
					<div>
						<label>{question.label}</label>
						<input
							type="text"
							placeholder={question.placeholder}
							value={$testing[question.name] || ''}
							on:input={(e) => handleInput(question.name, e.target.value)}
						/>
					</div>
				{/if}

			

				{#if question.type === 'select'}
					<div>
						<label>{question.label}</label>
						<select
							value={$testing[question.name] || ''}
							on:change={(e) => handleInput(question.name, e.target.value)}
						>
							<option value="">Select</option>
							{#each question.options as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				{/if}



				{#if question.type === 'button'}
					<button on:click={handleAddClick} disabled={disableAddButton(question, $testing)}>
						{question.label}
					</button>
				{/if}
			{/if}
		{/each}

		{#if currentPage === 2 && $testing.tableLoanEntries.length > 0}
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
					{#each $testing.tableLoanEntries as entry, i}
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

		<div>
			{#if currentPage > 1}
				<button on:click={goBack}>Back</button>
			{/if}
			{#if currentPage < formSchema.length}
				<button on:click={goNext}>Next</button>
			{/if}
		</div>
	{/if}
{/each}

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
