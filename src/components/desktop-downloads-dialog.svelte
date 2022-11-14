<script lang="ts">
	import { Modal, Button } from 'carbon-components-svelte';
	import { Download } from 'carbon-icons-svelte';

	let open = true;
</script>

<Modal {open} passiveModal
	modalHeading="Desktop Downloads"
	on:close>
	<!-- svelte-ignore missing-declaration -->
	<Button kind="primary" icon={Download}
		href="{BASE}desktop/screen-recorder-win32-x64.zip">
		Windows, 64-bit
	</Button>
</Modal>
