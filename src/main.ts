import App from './components/app.svelte';

new App({
	target: document.body,
	props: { githubUrl: GITHUB_URL },
});
