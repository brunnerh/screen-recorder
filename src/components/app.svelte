<script lang="ts">
	import 'carbon-components-svelte/css/g90.css';
	import '../styles/layout.less';
	import {
		Column, Content, Grid, Header, HeaderGlobalAction, HeaderActionLink, HeaderUtilities,
		InlineNotification, OutboundLink, Row, SkipToContent,
	} from 'carbon-components-svelte';
	import { Download, LogoGithub } from 'carbon-icons-svelte';
	import Main from './main.svelte';

	const errors = [
		{
			condition: navigator?.mediaDevices?.getDisplayMedia == null,
			title: 'Screen capture is not supported',
			href: 'https://caniuse.com/mdn-api_mediadevices_getdisplaymedia',
		},
		{
			condition: typeof MediaRecorder == 'undefined',
			title: 'Recording is not supported',
			href: 'https://caniuse.com/mdn-api_mediarecorder',
		},
	].filter(error => error.condition);

	async function onDownload()
	{
		const { default: DesktopDownloadsDialog } = await import('./desktop-downloads-dialog.svelte');
		const dialog = new DesktopDownloadsDialog({ target: document.body });
		dialog.$on('close', () => setTimeout(() => dialog.$destroy(), 1000));
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
		<!-- svelte-ignore missing-declaration -->
		{#if SHOW_DOWNLOADS && PLATFORM == 'web'}
			<HeaderGlobalAction
				icon={Download}
				title="Desktop application downloads"
				on:click={onDownload}/>
		{/if}

		<!-- svelte-ignore missing-declaration -->
		{#if GITHUB_URL}
			<HeaderActionLink
				href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
				icon={LogoGithub}
				title="GitHub repository" />
		{/if}
	</HeaderUtilities>
</Header>

<Content class="content">
	<Grid>
		<Row>
			<Column>
				{#if errors.length == 0}
					<Main />
				{/if}

				{#each errors as { title, href }}
					<InlineNotification kind="error" {title}
						lowContrast hideCloseButton>
						<svelte:fragment slot="subtitle">
							<OutboundLink {href}>
								Browser support info
							</OutboundLink>
						</svelte:fragment>
					</InlineNotification>
				{/each}
			</Column>
		</Row>
	</Grid>
</Content>

<style lang="less">
	:global(html)
	{
		color-scheme: dark;
	}

	h1 { font-size: inherit; }

	:global {
		.content { background: none; }
	}
</style>
