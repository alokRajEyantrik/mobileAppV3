import { writable } from 'svelte/store';

// Initialize with no data; will fill as user answers per loan type
export const loanData = writable({});
