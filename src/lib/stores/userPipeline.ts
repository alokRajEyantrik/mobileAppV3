// src/lib/stores/userPipeline.ts
import { writable } from 'svelte/store';

export const currentPipelineKey = writable<string>(''); // e.g., home_loan.new_loan
export const userPipeline = writable<Record<string, { path: string; values: Record<string, string> }>>({});
