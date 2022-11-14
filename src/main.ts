import App from './components/app.svelte';
import type { CaptureSource } from './electron/types';

if (PLATFORM == 'electron')
{
	navigator.mediaDevices.getDisplayMedia = async () =>
	{
		const { default: ElectronSourceDialog } = await import('./components/electron-source-dialog.svelte');
		const sources = await globalThis.electronGetSources();
		console.debug('Sources', sources);

		const selection = await select();
		if (selection == null)
			throw new Error('No source selected');

		const stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: {
				// @ts-expect-error
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: selection.id,
				},
			},
		});

		return stream;

		function select()
		{
			return new Promise<null | CaptureSource>(resolve =>
			{
				const dialog = new ElectronSourceDialog({
					target: document.body,
					props: { sources },
				});
				dialog.$on('close', e =>
				{
					resolve(e.detail)
					setTimeout(() => dialog.$destroy(), 1000);
				});
			});
		}
	};
}

new App({ target: document.body });
