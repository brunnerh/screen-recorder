<script lang="ts">
	export let alignItems: string | null = null;
	export let alignContent: string | null = null;
	export let justifyItems: string | null = null;
	export let justifyContent: string | null = null;
	export let direction: 'row' | 'column' | null = null;
	export let wrap: string | null = null;
	export let gap: string | null = null;

	export let style = '';
	let className = '';
	export { className as class };

	$: combinedStyle = [
		style,
		alignItems && `align-items: ${alignItems}`,
		alignContent && `align-content: ${alignContent}`,
		justifyItems && `justify-items: ${justifyItems}`,
		justifyContent && `justify-content: ${justifyContent}`,
		direction && `flex-direction: ${direction}`,
		wrap && `flex-wrap: ${wrap}`,
		gap && `gap: ${gap}`,
	].filter(Boolean).join(';');
</script>

<div class:flex={true} class={className} style={combinedStyle}>
	<slot />
</div>

<style lang="less">
	.flex
	{
		display: flex;
	}
</style>
