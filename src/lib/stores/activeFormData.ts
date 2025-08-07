import { derived } from 'svelte/store';
import { formData } from './formStepper';
import { currentPipelineKey, userPipeline } from './userPipeline';

export const activeFormData = derived(
	[formData, currentPipelineKey, userPipeline],
	([$formData, $pipelineKey, $pipeline]) => {
		const pathData = $pipeline[$pipelineKey]?.values || {};
		const filtered: Record<string, string> = {};

		for (const key in pathData) {
			if (key in $formData) {
				filtered[key] = $formData[key];
			}
		}
		return filtered;
	}
);
