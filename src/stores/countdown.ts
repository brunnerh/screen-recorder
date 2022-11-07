import { writable, type Readable } from 'svelte/store';

export function countdownStore(until: Date, onExpired: () => void): CountdownStore
{
	const timeLeft = () => Math.max(Math.ceil((until.getTime() - Date.now()) / 1000), 0);

	const store = writable(timeLeft());

	let handle: number;
	function start()
	{
		handle = window.setInterval(() => store.set(timeLeft()), 10);
	}
	function stop()
	{
		window.clearInterval(handle);
	}

	store.subscribe(value =>
	{
		if (value == 0)
		{
			stop();
			onExpired();
		}
	});

	return {
		subscribe: store.subscribe,
		start,
		stop,
	};
}

export interface CountdownStore extends Readable<number>
{
	start(): void;
	stop(): void;
}
