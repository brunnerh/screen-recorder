<script lang="ts">
	import { Button, NumberInput } from 'carbon-components-svelte';
	import { Pause, Recording, RecordingFilled, Stop } from 'carbon-icons-svelte';
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
    import { countdownStore, type CountdownStore } from '../stores/countdown';
    import Flex from './flex.svelte';

	export let recorder: MediaRecorder;
	export let state = recorder.state;
	export let startDelay = 0;
	
	const dispatch = createEventDispatcher<{
		recorded: File,
		ended: never,
	}>();
	const track = recorder.stream.getVideoTracks()[0];

	let countdown: CountdownStore | null = null;
	let chunks: Blob[] = [];

	let cleanup: (() => void)[] = [];

	track.addEventListener('ended', onTrackEnded);
	cleanup.push(() => track.removeEventListener('ended', onTrackEnded));

	for (const event of ['start', 'pause', 'resume', 'stop'])
	{
		const handler = () => state = recorder.state;
		recorder.addEventListener(event, handler)
		cleanup.push(() => recorder.removeEventListener(event, handler));
	}

	recorder.addEventListener('dataavailable', onData);
	cleanup.push(() => recorder.removeEventListener('dataavailable', onData));
	recorder.addEventListener('stop', onStop);
	cleanup.push(() => recorder.removeEventListener('stop', onStop));
	recorder.addEventListener('error', onError);
	cleanup.push(() => recorder.removeEventListener('error', onError));

	onDestroy(() =>
	{
		countdown?.stop();
		cleanup.forEach(fn => fn());
	});

	function onStart()
	{
		if (startDelay > 0)
		{
			const startAt = new Date(Date.now() + startDelay * 1000);
			countdown = countdownStore(startAt, () =>
			{
				countdown = null;
				recorder.start();
			});
			countdown.start();
		}
		else
		{
			recorder.start();
		}
	}
	function onStop()
	{
		const clip = new File(chunks, '', { type: recorder.mimeType });
		dispatch('recorded', clip);
		chunks = [];
	}
	function onData(e: BlobEvent) { chunks.push(e.data) }
	function onError(e: MediaRecorderErrorEvent) { alert(e.error.message); }

	function onTrackEnded()
	{
		if (state !== 'inactive')
			recorder.stop();

		dispatch('ended');
	}
</script>

<form on:submit|preventDefault={onStart}>
	<Flex direction="column" alignItems="flex-start" gap="8px">
		{#if state == 'inactive'}
			<NumberInput label="Start delay (seconds)"
				min={0} step={1} allowEmpty placeholder="0"
				bind:value={startDelay} />
		{/if}

		<div>
			{#if state == 'inactive'}
				<Button type="submit" icon={Recording}
					disabled={countdown != null}>
					{countdown == null ? 'Start recording' : 'Starting in ' + $countdown}
				</Button>
			{:else}
				{#if state == 'recording'}
					<Button icon={Pause}
						on:click={() => recorder.pause()}>
						Pause recording
					</Button>
				{:else if state == 'paused'}
					<Button icon={RecordingFilled}
						on:click={() => recorder.resume()}>
						Resume recording
					</Button>
				{/if}

				<Button icon={Stop}
					on:click={() => recorder.stop()}>
					Stop recording
				</Button>
			{/if}
		</div>
	</Flex>
</form>
