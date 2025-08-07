// src/lib/utils/pipelineUtils.ts
import { get } from 'svelte/store';
import { userPipeline, currentPipelineKey } from '$lib/stores/userPipeline';
import type { Writable } from 'svelte/store';

export function updatePipelineValue(
	contextKey: string,
	value: string,
	formData: Writable<Record<string, any>>
) {
	const currentKey = get(currentPipelineKey);
	if (!currentKey) return;

	// 🧠 Ensure previous path’s answers are preserved
	userPipeline.update((paths) => {
		if (!paths[currentKey]) {
			paths[currentKey] = {
				path: currentKey,
				values: {}
			};
		}
		paths[currentKey].values[contextKey] = value;
		return paths;
	});

	// 🔄 Update formData store too
	formData.update((fd) => {
		fd[contextKey] = value;
		return fd;
	});
}
