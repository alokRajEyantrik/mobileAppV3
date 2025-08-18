let newLoan = {
	loanTransaction: {
		LoanName: 'Home Loan',
		LoanType: 'New Loan',
		propertyIdentified: 'Yes',
		propertyStateName: 'Maharashtra',
		propertyCityName: 'Mumbai',
		residenceOptionSame: 'Yes',
		residenceStateName: 'Maharashtra',
		residenceCityName: 'Mumbai',
		approvedByAuthority: 'Yes',
		asPerMap: 'Yes',
		ApplicantIsNRI: 'No',
		propertyType: 'Lease Hold',
		purchaseType: 'Direct Sale',
		constructionType: 'House',
		PropertyStage: 'Under Construction',
		purchasedFrom: 'Builder',
		approvedBankForSelectedByUser: [
			'HDFC Bank',
			'State Bank of India',
			'ICICI Bank',
			'Bajaj Finserv',
			'Axis Bank',
			'Central Bank of India',
			'Bank of Maharashtra',
			'Bank of Baroda',
			'Bank of India'
		],
		tellUsApplying: 'Family',
		numberOfDirectorOrApplicant: 3,
		deposit: 3000000,
		propCost: 20000000,
		mortgageYear: 20
	},
	allApplicantDetails: [
		{
			title: 'Mr.',
			fullNameOfApplicant: 'Alok',
			existingRoleOfPerson: 'For loan repayment only',
			EmploymentType: 'Employed(Government)',
			selectedAge: 35,
			netIncome: 100000, // Changed from monthlyIncome
			monthlyOtherIncome: 0,
			totalEMIs: 0,
			creditScore: '800'
		},
		{
			title: 'Mr.',
			fullNameOfApplicant: 'Aman',
			existingRoleOfPerson: 'Loan repayment and having name on the property papers',
			EmploymentType: 'Employed(Private)',
			PFdeducted: 'Yes',
			selectedAge: 36,
			RelationWithPrimary: 'sister',
			grossIncome: 100000, // Changed from monthlyIncome
			monthlyOtherIncome: 0,
			totalEMIs: 5200,
			creditScore: '800'
		},
		{
			title: 'Mr.',
			fullNameOfApplicant: 'Amar',
			existingRoleOfPerson: 'Loan repayment and having name on the property papers',
			EmploymentType: 'Employed(Private)',
			PFdeducted: 'Yes',
			selectedAge: 36,
			RelationWithPrimary: 'sister',
			grossIncome: 100000, // Changed from monthlyIncome
			monthlyOtherIncome: 0,
			totalEMIs: 15200,
			totalLimit: 270000,
			creditScore: '800',
			tableLoanEntries: [
				{
					loanType: 'Loan Against Property',
					bankName: 'Dhanlaxmi Bank',
					selectedToClose: 'Keep Running',
					emi: '1200',
					emiFormatted: '1,200',
					totalLimit: '',
					totalLimitFormatted: '',
					tenure: '8',
					interestRate: '21',
					remainingLimit: '',
					remainingLimitFormatted: '',
					remainingTenure: '',
					utilizedAmountFormatted: '',
					utilizedAmount: ''
				},
				{
					loanType: 'Business Loan - Unsecured',
					bankName: 'Bank of Baroda',
					selectedToClose: 'Keep Running',
					emi: '14000',
					emiFormatted: '14,000',
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
					bankName: 'Canara Bank',
					selectedToClose: 'Keep Running',
					emi: '',
					emiFormatted: '',
					totalLimit: '130000',
					totalLimitFormatted: '1,30,000',
					tenure: '12',
					interestRate: '8',
					remainingLimit: '',
					remainingLimitFormatted: '',
					remainingTenure: '',
					utilizedAmountFormatted: '',
					utilizedAmount: ''
				},
				{
					loanType: 'CC Limit',
					bankName: 'Bajaj Finserv',
					selectedToClose: 'Keep Running',
					emi: '',
					emiFormatted: '',
					totalLimit: '140000',
					totalLimitFormatted: '1,40,000',
					tenure: '12',
					interestRate: '12',
					remainingLimit: '',
					remainingLimitFormatted: '',
					remainingTenure: '',
					utilizedAmountFormatted: '',
					utilizedAmount: ''
				}
			]
		}
	]
};
