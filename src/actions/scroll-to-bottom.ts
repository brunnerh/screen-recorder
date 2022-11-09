export function scrollToBottom(node: HTMLElement, triggers: any)
{
	const scroll = () => node.scroll({
		top: node.scrollHeight,
		behavior: 'smooth',
	});
	scroll();

	return { update: scroll };
}
