let sampleData = {
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
		salariedBankName: 'HDFC Bank',
		tellUsApplying: 'Individual', // not used
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
			companyType: 'private limited', // added this field,
			totalEmployees: 'less than 100', // added this field
            PFDeducted: 'Yes', // added this field
			creditScore: '700',
			cibilIssues: ['High Credit Utilization'],
			fixedSalary: 90000,
			grossIncome: 100000,
			monthlyOtherIncome: 0,
			totalEMIs: 2500,
			totalLimit: 120000
		}
	]
};