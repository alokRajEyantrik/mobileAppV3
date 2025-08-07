import { get } from 'svelte/store';
import { formData, currentStep } from '$lib/stores/formStepper';
import { userPipeline, currentPipelineKey } from '$lib/stores/userPipeline';
import rawConfig from '$lib/config/form-config.json';
import { evaluateCondition } from '$lib/utils/evaluateCondition';
import { visibleQuestions } from '$lib/stores/visibleQuestions';

// 1. Update pipeline value + update form data
export function updatePipelineValue(
	contextKey: string,
	value: string,
	formDataStore
) {
	const key = get(currentPipelineKey);
	if (!key) return;

	// Update pipeline map
	userPipeline.update((paths) => {
		if (!paths[key]) {
			paths[key] = {
				path: key,
				values: {}
			};
		}
		paths[key].values[contextKey] = value;
		return paths;
	});

	// Update main formData
	formDataStore.update((fd) => ({ ...fd, [contextKey]: value }));
}

// 2. Load pipeline from current key
export function loadPipeline() {
	const key = get(currentPipelineKey);
	const allQuestions = rawConfig.first_page.questions;
	const pipeline = get(userPipeline)[key];
	const values = pipeline?.values || {};

	const filtered = allQuestions
		.filter((q) => {
			if (!q.showWhen) return true;
			return evaluateCondition(q.showWhen, values);
		})
		.map((q) => {
			const filteredOptions = q.options?.filter((opt: any) => {
				if (!opt.showWhen) return true;
				return evaluateCondition(opt.showWhen, values);
			}) ?? [];

			return { ...q, options: filteredOptions };
		});

	// Update stores
	formData.set(values);
	currentStep.set(0);
	visibleQuestions.set(filtered);
}
