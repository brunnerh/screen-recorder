<script lang="ts">
	import { Link } from 'carbon-components-svelte';

	export let file: File;

	let src: string;
	$: {
		URL.revokeObjectURL(src);
		src = URL.createObjectURL(file);
	}
</script>

{#if src != null}
	<div>
		<Link class="mb8"
			href={src}
			download="recording">
			Download clip
		</Link>

		<!-- svelte-ignore a11y-media-has-caption -->
		<video {src} loop controls />
	</div>
{/if}

<style>
	video { width: 100%; }
</style>
