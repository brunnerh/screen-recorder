<script lang="ts">
	import {
		Accordion, AccordionItem, Button, InlineNotification, Modal, OutboundLink,
		ProgressBar, TextInput,
	} from 'carbon-components-svelte';
	import { createFFmpeg, type FFmpeg } from '@ffmpeg/ffmpeg';
	import core from '@ffmpeg/core/dist/ffmpeg-core.js?raw';
	import coreWasm from '@ffmpeg/core/dist/ffmpeg-core.wasm?url';
	import coreWorker from '@ffmpeg/core/dist/ffmpeg-core.worker.js?url';
	import { scrollToBottom } from '../actions/scroll-to-bottom';
	import Flex from './flex.svelte';
	import { Gif } from 'carbon-icons-svelte';

	export let file: File;

	let open = true;
	let converting = false;
	let messages: { type: string; message: string }[] = [];
	let progress: number | undefined;
	let frame = 0;
	let fps = 0;
	let error: Error | null = null;

	let name = 'recording.mp4';
	let additionalArguments = '';

	async function onConvert()
	{
		converting = true;
		messages = [];
		progress = undefined;
		frame = 0;
		fps = 0;
		error = null;

		let ffmpeg: FFmpeg | null = null;
		try
		{
			const binary = await file.arrayBuffer().then(b => new Uint8Array(b));

			let errorMessage = false;

			const getFileName = (url: string) => url.split('/').pop();
			const resolvedCore = core
				.replaceAll('ffmpeg-core.wasm', `${BASE}/assets/${getFileName(coreWasm)}`)
				.replaceAll('ffmpeg-core.worker.js', `${BASE}/assets/${getFileName(coreWorker)}`);
			const blob = new Blob([resolvedCore], { type: 'application/javascript' });
			const corePath = URL.createObjectURL(blob);
			ffmpeg = createFFmpeg({ log: true, corePath });
			await ffmpeg.load();
			ffmpeg.setLogger(msg =>
			{
				const match = msg.message?.match(/^frame=(\s*)(?<frame>\d*)(\s*)fps=(\s*)(?<fps>[\d\.]*)/);
				if (match)
				{
					frame = +match.groups!.frame;
					fps = +match.groups!.fps;
				}

				if (msg.message?.match(/^Conversion failed/))
					errorMessage = true;

				messages = [...messages, msg];
			});
			ffmpeg.setProgress(({ ratio }) => progress = isNaN(ratio) ? undefined : ratio);

			ffmpeg.FS('writeFile', 'input', binary);
			// TODO: Use a proper parser instead
			const args = additionalArguments.match(/^\s*$/) ?
				[] : additionalArguments.match(/[^\s"']+|(?<=")([^"]*)"+|(?<=')([^']*)'/g);
			if (args == null)
				throw new Error('Invalid arguments.');

			console.log(args);

			await ffmpeg.run('-i', 'input', ...args, name);

			if (errorMessage)
				throw new Error('Conversion failed. See messages for details.');

			const outputBinary = ffmpeg.FS('readFile', name);
			const output = new File([outputBinary], name);
			const url = URL.createObjectURL(output);
			const a = document.createElement('a');
			a.href = url;
			a.download = name;
			a.click();
			URL.revokeObjectURL(url);
			ffmpeg.FS('unlink', name);
		}
		catch (err)
		{
			if (err instanceof Error)
			{
				error = err;
			}
			else
			{
				alert('Failed to convert file.');
				console.error(err);
			}
		}
		finally
		{
			converting = false;
			ffmpeg?.exit();
		}
	}

	function onLoadGifSettings()
	{
		changeExtension('.gif');
		additionalArguments = '-vf fps=15,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse';
	}

	function changeExtension(extension: string)
	{
		name = name.replace(/\.[^.]+$/, '') + extension;
	}
</script>

<Modal {open}
	modalHeading="Convert clip"
	primaryButtonText="Convert"
	secondaryButtonText="Cancel"
	primaryButtonDisabled={converting}
	shouldSubmitOnEnter={false}
	on:click:button--secondary={() => open = false}
	on:click:button--primary={onConvert}
	on:close>
	<form on:submit|preventDefault={onConvert}>
		<Flex direction="column" gap="16px">
			<p>
				Convert the video using
				<OutboundLink href="https://ffmpeg.org/">FFmpeg</OutboundLink>.
			</p>

			<TextInput labelText="File name"
				bind:value={name} />

			<TextInput
				placeholder="e.g.: -vf hue=s=0"
				bind:value={additionalArguments}>
				<svelte:fragment slot="labelText">
					Additional
					<OutboundLink href="https://ffmpeg.org/ffmpeg.html#Options">arguments</OutboundLink>
				</svelte:fragment>
			</TextInput>

			<div>
				<Button kind="tertiary" size="small"
					icon={Gif}
					on:click={onLoadGifSettings}>
					Load GIF preset
				</Button>
			</div>
		
			{#if converting}
				<ProgressBar
					labelText="Converting..."
					helperText="Frame {frame} / FPS {fps}"
					value={progress} />
			{/if}
		
			<div class="messages-container">
				<Accordion align="start">
					<AccordionItem title="Messages">
						<div class="messages" use:scrollToBottom={messages}>
							{#each messages as { type, message }}
								<div>[{type}] {message}</div>
							{/each}
						</div>
						{#if messages.length == 0}
							<em>No messages yet</em>
						{/if}
					</AccordionItem>
				</Accordion>
			</div>
		
			{#if error != null}
				<InlineNotification class="mt0 mb0" kind="error"
					title="Failed to convert file."
					subtitle={error.message} />
			{/if}
		</Flex>
	</form>
</Modal>

<style lang="less">
	.messages
	{
		overflow-y: auto;
		max-height: 200px;
	}
	.messages-container :global(.bx--accordion__content)
	{
		padding-right: 0;
	}
</style>
