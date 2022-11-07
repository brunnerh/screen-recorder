<script lang="ts">
	import 'carbon-components-svelte/css/g90.css';
	import '../styles/layout.less';
	import {
		Button, Column, Content, FormGroup, Grid, Header, HeaderActionLink, HeaderUtilities,
		InlineNotification,
		NumberInput, Row, SkipToContent,
	} from 'carbon-components-svelte';
	import { LogoGithub, VideoAdd, VideoOff } from 'carbon-icons-svelte';
	import Recorder from './recorder.svelte';
	import Flex from './flex.svelte';
	import { tick } from 'svelte';
	import VideoClip from './video-clip.svelte';
	import { localStorageStore } from '../stores/storage-store';

	export let githubUrl: string | null = null;

	let recorder: MediaRecorder | null = null;
	let clip: File | null = null;
	let fps = localStorageStore('fps', 60);
	let width = localStorageStore('width', 1920);
	let height = localStorageStore('height', 1080);
	let startDelay = localStorageStore('start-delay', 0);

	let streamSettings = createSettings();
	$: settingsChanged =
		streamSettings.width !== $width ||
		streamSettings.height !== $height ||
		streamSettings.fps !== $fps;

	function createSettings()
	{
		return {
			width: $width,
			height: $height,
			fps: $fps,
		};
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
		recorder = new MediaRecorder(stream);
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
					<Flex direction="column" gap="8px" alignItems="flex-start">
						<FormGroup legendText="Settings" noMargin>
							<Flex direction="column" gap="8px" alignItems="flex-start">
								<Flex gap="8px" alignItems="flex-end" wrap="wrap">
									<NumberInput label="Width"
										bind:value={$width} min={1} step={1} />
									<NumberInput label="Height"
										bind:value={$height} min={1} step={1} />
									<NumberInput label="Frame Rate"
										bind:value={$fps} min={1} step={1} />
								</Flex>
							</Flex>
						</FormGroup>
	
						{#if recorder && settingsChanged}
							<InlineNotification kind="info"
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
