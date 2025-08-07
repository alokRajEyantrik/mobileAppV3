import { writable } from 'svelte/store';

export const currentStep = writable(0);

export const formData = writable<Record<string, any>>({});

export const formAnswers = writable({});
