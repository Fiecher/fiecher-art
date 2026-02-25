import { readable } from 'svelte/store';

export const isDesktop = readable(true, (set) => {
	if (typeof window === 'undefined') return;

	const check = () => set(window.innerWidth >= 1280);
	check();

	window.addEventListener('resize', check);
	return () => window.removeEventListener('resize', check);
});