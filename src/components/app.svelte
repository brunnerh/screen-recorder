<script lang="ts">
	import 'carbon-components-svelte/css/g90.css';
	import '../styles/layout.less';
	import {
		Button, Column, Content, Grid, Header, HeaderActionLink, HeaderUtilities,
		InlineNotification, NumberInput, Row, Select, SkipToContent, Tooltip,
	} from 'carbon-components-svelte';
	import { LogoGithub, VideoAdd, VideoOff } from 'carbon-icons-svelte';
	import Recorder from './recorder.svelte';
	import Flex from './flex.svelte';
	import { tick } from 'svelte';
	import VideoClip from './video-clip.svelte';
	import { localStorageStore } from '../stores/storage-store';

	export let githubUrl: string | null = null;
	
	// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs#common_codecs
	const h263 = ['H.263', 'H263'];
	const h264 = ['AVC', 'H.264', 'H264'];
	const h265 = ['HEVC', 'H.265', 'H265'];
	const codecs = [
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
	let clip: File | null = null;
	const fps = localStorageStore('fps', 60);
	const width = localStorageStore('width', 1920);
	const height = localStorageStore('height', 1080);
	const container = localStorageStore('container', 'video/webm');
	const codec = localStorageStore('codec', '');
	const startDelay = localStorageStore('start-delay', 0);

	coerceContainer();
	$: coerceCodec($container);

	let streamSettings = createSettings();
	$: settingsChanged =
		streamSettings.width !== $width ||
		streamSettings.height !== $height ||
		streamSettings.fps !== $fps ||
		streamSettings.container !== $container ||
		streamSettings.codec !== $codec;

	const any = (value: any) => value;

	function createSettings()
	{
		return {
			width: $width,
			height: $height,
			fps: $fps,
			container: $container,
			codec: $codec,
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
		if (navigator.mediaDevices == null)
		{
			alert("MediaDevices not supported");
			return;
		}

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

		const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
		streamSettings = createSettings();
		recorder = new MediaRecorder(
			stream,
			containers.length > 0 ? { mimeType: `${$container};codecs="${$codec}"` } : { },
		);
		settingsChanged = false;
	}

	function onStopStream()
	{
		recorder?.stream.getTracks().forEach(t => t.stop());
		recorder = null;
	}
</script>

<Header>
	<div slot="skip-to-content">
		<SkipToContent />
	</div>
	<div slot="platform">
		<h1>Screen Recorder</h1>
	</div>

	<HeaderUtilities>
		{#if githubUrl}
			<HeaderActionLink href={githubUrl} icon={LogoGithub}/>
		{/if}
	</HeaderUtilities>
</Header>

<Content class="content">
	<Grid>
		<Row>
			<Column>
				<form on:submit|preventDefault={onSelectMedia}>
					<Flex direction="column" gap="16px" alignItems="flex-start">
						<Flex direction="column" gap="8px" alignItems="flex-start">
							<Tooltip triggerText="Settings" align="start">
								<p>Settings may not be fully respected.</p>
								<br />
								<p>The browser may also return a different container than the one selected.</p>
								<p>E.g., the browser may return a WebM container even if the
									Matroska container is selected.</p>
								<p>Note that all WebM files are Matroska files, but not all Matroska files
									are necessarily WebM files.</p>
							</Tooltip>

							<Flex gap="8px" alignItems="flex-end" wrap="wrap">
								<NumberInput label="Width"
									bind:value={$width} min={1} step={1} />
								<NumberInput label="Height"
									bind:value={$height} min={1} step={1} />
								<NumberInput label="Frame Rate"
									bind:value={$fps} min={1} step={1} />
							</Flex>

							{#if containers.length > 0}
								<Flex gap="8px" alignItems="center" wrap="wrap">
									<Select labelText="Container" required
										selected={$container}
										on:change={e => $container = any(e.detail)}>
										<option hidden disabled selected={$container == ''} />
										{#each containers as { label, value }}
											<option {value} {label} selected={$container == value} />
										{/each}
									</Select>

									{#if $container != ''}
										<Select labelText="Codec" required
											selected={$codec}
											on:change={e => $codec = any(e.detail)}>
											<option hidden disabled selected={$codec == ''} />
											{#each currentCodecs as c}
												<option value={c} label={c} selected={$codec == c} />
											{/each}
										</Select>
									{/if}
								</Flex>
							{/if}
						</Flex>

						{#if recorder && settingsChanged}
							<InlineNotification kind="info" class="mt0 mb0"
								title="Source has to be re-selected for settings to take effect"
								hideCloseButton lowContrast />
						{/if}
	
						<div>
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
					</Flex>
				</form>

				{#if recorder != null}
					<div class="mt16">
						{#key recorder}
							<Recorder {recorder}
								bind:clip bind:startDelay={$startDelay}
								on:ended={onStopStream} />
						{/key}
					</div>
				{/if}

				{#if clip != null}
					<div class="mt8">
						<VideoClip file={clip} />
					</div>
				{/if}
			</Column>
		</Row>
	</Grid>
</Content>

<style lang="less">
	h1 { font-size: inherit; }

	:global {
		.content { background: none; }
	}
</style>
