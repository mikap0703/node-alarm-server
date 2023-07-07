import { writable } from 'svelte/store';

export const configuration = writable({
    "general": {},
    "mail": {},
    "dme": {},
    "alarmTemplates": {}
});
