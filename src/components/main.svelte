<script lang="ts">
	import 'carbon-components-svelte/css/g90.css';
	import '../styles/layout.less';
	import { Button, InlineNotification, NumberInput, Select, Tooltip } from 'carbon-components-svelte';
	import { VideoAdd, VideoOff } from 'carbon-icons-svelte';
	import Recorder from './recorder.svelte';
	import Flex from './flex.svelte';
	import { tick } from 'svelte';
	import VideoClip from './video-clip.svelte';
	import { localStorageStore } from '../stores/storage-store';

	// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs#common_codecs
	const h263 = ['H.263', 'H263'];
	const h264 = ['AVC', 'H.264', 'H264'];
	const h265 = ['HEVC', 'H.265', 'H265'];
	const codecs = [
		'',
		...h263,
		...h264,
		...h265,
		'AV1',
		'MP4V-ES',
		'MPEG-1',
		'MPEG-2',
		'Theora',
		'VP8',
		'VP9',
		'VP10',
	].flatMap(codec => [codec, codec.toLowerCase()]);
	const containers = [
		{ label: '3GP (.3gp)', value: 'video/3gpp' },
		{ label: '3G2 (.3g2)', value: 'video/3gpp2' },
		{ label: 'WebM (.webm)', value: 'video/webm' },
		{ label: 'MPEG/MPEG-2 (.mpg, .mpeg, m2v, .mp2)', value: 'video/mpeg' },
		{ label: 'MP4 (.mp4, .m4v, .m4p)', value: 'video/mp4' },
		{ label: 'Ogg (.ogg, .ogv)', value: 'video/ogg' },
		{ label: 'Matroska (.mkv)', value: 'video/x-matroska' },
		{ label: 'Quicktime (.mov)', value: 'video/quicktime' },
	]
	.map(item => ({
		...item,
		codecs: codecs.filter(codec => MediaRecorder.isTypeSupported(`${item.value};codecs="${codec}"`)),
	}))
	.filter(item => item.codecs.length > 0)
	.sort((a, b) => a.label.localeCompare(b.label));
	$: currentCodecs = deduplicate(containers.find(item => item.value == $container)?.codecs ?? []);

	let recorder: MediaRecorder | null = null;
	let recorderSettings = createRecorderSettings();
	let state: RecordingState | undefined;
	let clip: File | null = null;
	let stream: MediaStream | null = null;
	let streamSettings = createStreamSettings();
	const fps = localStorageStore('fps', 60);
	const width = localStorageStore('width', 1920);
	const height = localStorageStore('height', 1080);
	const container = localStorageStore('container', 'video/webm');
	const codec = localStorageStore('codec', '');
	const kbps = localStorageStore('kbps', null as number | null);
	const startDelay = localStorageStore('start-delay', 0);

	coerceContainer();
	$: coerceCodec($container);

	$: streamSettingsChanged =
		streamSettings.width !== $width ||
		streamSettings.height !== $height ||
		streamSettings.fps !== $fps;
	$: recorderSettingsChanged =
		recorderSettings.container !== $container ||
		recorderSettings.codec !== $codec ||
		recorderSettings.kbps !== $kbps;

	const any = (value: any) => value;

	function createStreamSettings()
	{
		return {
			width: $width,
			height: $height,
			fps: $fps,
		};
	}

	function createRecorderSettings()
	{
		return {
			container: $container,
			codec: $codec,
			kbps: $kbps,
		};
	}

	function coerceContainer()
	{
		if (containers.find(item => item.value === $container) == null)
		{
			$container = '';
			return;
		}
	}

	function coerceCodec(container: string)
	{
		const item = containers.find(item => item.value === container);
		if (item == null || item.codecs.includes($codec) == false)
		{
			$codec = '';
			return;
		}
	}

	function deduplicate(items: string[])
	{
		const groups = items.reduce((o, item) =>
		{
			if (item.toUpperCase() in o)
				o[item.toUpperCase()].push(item);
			else
				o[item.toUpperCase()] = [item];

			return o;
		}, {} as Record<string, string[]>);

		return Object.entries(groups).map(([key, items]) => items[0]);
	}

	async function onSelectMedia()
	{
		if (recorder != null)
			recorder.stream.getTracks().forEach(t => t.stop());

		recorder = null;
		await tick();

		const constraints: DisplayMediaStreamConstraints = {
			video: {
				frameRate: { ideal: $fps },
				width: { ideal: $width },
				height: { ideal: $height },
			},
		};

		stream = await navigator.mediaDevices.getDisplayMedia(constraints);
		streamSettings = createStreamSettings();
		recorder = createRecorder(stream);
		recorderSettings = createRecorderSettings();
	}

	function createRecorder(stream: MediaStream | null)
	{
		if (stream == null)
			return null;

		return new MediaRecorder(
			stream,
			{
				mimeType: containers.length == 0 ? undefined :
					$codec == '' ? $container :
					`${$container};codecs="${$codec}"`,
				bitsPerSecond: $kbps == null ? undefined : ($kbps * 1000),
			},
		);
	}

	function onApplyRecorderSettings()
	{
		recorder = createRecorder(stream);
		recorderSettings = createRecorderSettings();
	}

	function onStopStream()
	{
		recorder?.stream.getTracks().forEach(t => t.stop());
		recorder = null;
	}
</script>

<form on:submit|preventDefault={onSelectMedia}>
	<!-- svelte-ignore missing-declaration -->
	{#if PLATFORM == 'web'}
		<Tooltip triggerText="Stream Settings" align="start">
			<p>Settings may not be fully respected/approximated by the browser.</p>
		</Tooltip>

		<Flex gap="8px" alignItems="flex-end" wrap="wrap" style="max-width: max-content">
			<NumberInput label="Width"
				bind:value={$width} min={1} step={1} />
			<NumberInput label="Height"
				bind:value={$height} min={1} step={1} />
			<NumberInput label="Frame Rate"
				bind:value={$fps} min={1} step={1} />
		</Flex>
	{/if}

	{#if recorder && streamSettingsChanged}
		<InlineNotification kind="info" class="mb0"
			title="Source has to be re-selected for settings to take effect"
			hideCloseButton lowContrast />
	{/if}

	<div class="mt8">
		<Button type="submit"
			kind={recorder == null ? 'primary' : 'ghost'}
			icon={VideoAdd}>
			Select source
		</Button>

		{#if recorder != null}
			<Button kind="ghost" icon={VideoOff}
				on:click={onStopStream}>
				Stop stream
			</Button>
		{/if}
	</div>
</form>

{#if recorder != null}
	<form class="mt16" on:submit|preventDefault={onApplyRecorderSettings}>
		<Tooltip triggerText="Recording Settings" align="start">
			<p>The browser may return a different container than the one selected.</p>
			<p>E.g., the browser may return a WebM container even if the
				Matroska container is selected.</p>
			<p>Note that all WebM files are Matroska files, but not all Matroska files
				are necessarily WebM files.</p>
		</Tooltip>

		<Flex gap="8px" alignItems="flex-end" wrap="wrap" style="max-width: max-content">
			{#if containers.length > 0}
				<Select labelText="Container" required
					selected={$container}
					on:change={e => $container = any(e.detail)}>
					<option hidden disabled selected={$container == ''} />
					{#each containers as { label, value }}
						<option {value} {label} selected={$container == value} />
					{/each}
				</Select>

				{#if $container != ''}
					<Select labelText="Codec"
						selected={$codec}
						on:change={e => $codec = any(e.detail)}>
						{#each currentCodecs as c}
							<option value={c} label={c == '' ? '(Auto)' : c} selected={$codec == c} />
						{/each}
					</Select>
				{/if}
			{/if}

			<NumberInput label="Kilobits Per Second (kbit/s)"
				min={0} allowEmpty placeholder="(Auto)"
				bind:value={$kbps} />

			<Button type="submit" kind="secondary"
				disabled={
					recorderSettingsChanged == false ||
					state != 'inactive'
				}>
				Apply
			</Button>
		</Flex>
	</form>

	<div class="mt16">
		{#key recorder}
			<Recorder {recorder}
				bind:state
				bind:startDelay={$startDelay}
				on:recorded={e => clip = e.detail}
				on:ended={onStopStream} />
		{/key}
	</div>
{/if}

{#if clip != null}
	<div class="mt16">
		<VideoClip file={clip} />
	</div>
{/if}
