import { derived } from 'svelte/store';
import { formData } from './formStepper';
import rawConfig from '$lib/config/form-config.json';
import { evaluateCondition } from '$lib/utils/evaluateCondition';

const allQuestions = rawConfig.first_page.questions;

export const visibleQuestions = derived(formData, ($formData) =>
	allQuestions
		.filter((q) => {
			if (!q.showWhen) return true;
			return evaluateCondition(q.showWhen, $formData);
		})
		.map((q) => {
			// Filter options within question
			const filteredOptions = q.options?.filter((opt: any) => {
				if (!opt.showWhen) return true;
				return evaluateCondition(opt.showWhen, $formData);
			}) ?? [];

			return { ...q, options: filteredOptions };
		})
);
