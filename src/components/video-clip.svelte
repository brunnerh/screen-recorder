<script lang="ts">
	import { Button } from 'carbon-components-svelte';
    import { ArrowsHorizontal, Download } from 'carbon-icons-svelte';

	export let file: File;

	let src: string;
	$: {
		URL.revokeObjectURL(src);
		src = URL.createObjectURL(file);
	}

	async function onConvert()
	{
		try
		{
			const { default: ConvertDialog } = await import('./convert-dialog.svelte');
			const dialog = new ConvertDialog({
				target: document.body,
				props: { file },
			});
			dialog.$on('close', () => dialog.$destroy());
		}
		catch (error)
		{
			alert('Failed to load converter.');
			console.error(error);
		}
	}
</script>

{#if src != null}
	<div>
		<div>
			<Button kind="primary" class="mb8"
				icon={Download}
				href={src}
				download="recording">
				Download clip
			</Button>

			{#if typeof SharedArrayBuffer != 'undefined'}
				<Button kind="secondary" class="mb8"
					icon={ArrowsHorizontal}
					on:click={onConvert}>
					Convert clip
				</Button>
			{/if}
		</div>

		<!-- svelte-ignore a11y-media-has-caption -->
		<video {src} loop controls />
	</div>
{/if}

<style>
	video { width: 100%; }
</style>
