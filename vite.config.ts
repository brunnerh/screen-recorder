import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import pkg from './package.json';

/**
 * Headers for enabling access to {@link SharedArrayBuffer}.  
 * Required for FFMPEG.
 */
const headers = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

export default defineConfig(config => ({
	base: config.mode == 'production' ? '/screen-recorder/' : '/',
	define: {
		GITHUB_URL: JSON.stringify(pkg.repository.url),
	},
	build: {
		outDir: 'out',
	},
	server: { headers },
	preview: { headers },
	plugins: [
		svelte({ configFile: 'svelte.config.js' }),
	],
}));
