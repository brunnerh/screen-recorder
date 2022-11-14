<script lang="ts">
	import { Modal, RadioTile, Tab, TabContent, Tabs, TileGroup } from 'carbon-components-svelte';
	import { createEventDispatcher } from 'svelte';
	import type { CaptureSource } from '../electron/types';

	export let sources: CaptureSource[];

	$: sourceGroups = sources.reduce((groups, source) =>
	{
		const [type] = source.id.split(':');
		const group = groups.find(group => group.type === type);
		if (group) {
			group.sources.push(source);
		} else {
			groups.push({
				type,
				sources: [source],
			});
		}

		return groups;
	}, [] as { type: string; sources: CaptureSource[] }[]);

	let open = true;
	let selected: string | undefined = sources.find(source =>
	{
		const [type, number] = source.id.split(':');
		return type == 'screen' && number == '0';
	})?.id;
	let result: CaptureSource | null = null;

	const dispatch = createEventDispatcher<{ close: typeof result }>();

	function onClose()
	{
		dispatch('close', result as any);
	}

	function onSelect()
	{
		result = selected == null ? null : sources.find(source => source.id === selected)!;
		open = false;
	}

	function capitalize(str: string)
	{
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<Modal {open}
	modalHeading="Select Source"
	primaryButtonText="Select"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => open = false}
	on:click:button--primary={onSelect}
	on:close={onClose}>
	<Tabs>
		{#each sourceGroups as group}
			<Tab label={capitalize(group.type)} />
		{/each}
		<svelte:fragment slot="content">
			{#each sourceGroups as group}
				<TabContent>
					<TileGroup bind:selected>
						<div class="sources">
							{#each group.sources as source}
								<RadioTile value={source.id} style="display: inline-block;">
									<p class="source-name">{source.name}</p>
									<img src={source.thumbnail} alt="thumbnail" />
								</RadioTile>
							{/each}
						</div>
					</TileGroup>
				</TabContent>
			{/each}
		</svelte:fragment>
	</Tabs>
</Modal>

<style>
	.sources
	{
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
	}
	.source-name
	{
		font-weight: bold;
		margin-bottom: 4px;
		display: block;
		max-width: 200px;
	}
</style>
