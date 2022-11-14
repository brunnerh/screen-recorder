import { svelte } from '@sveltejs/vite-plugin-svelte';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { dirname, join } from 'path';
import shell from 'shelljs';
import { defineConfig } from 'vite';
import pkg from './package.json';
import { electronZip } from './src/plugins/electron-zip';
import { extractFonts } from './src/plugins/extract-fonts';

/**
 * Headers for enabling access to {@link SharedArrayBuffer}.  
 * Required for FFMPEG.
 */
const headers = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin',
};

const platform = process.env.PLATFORM ?? 'web';
const platforms = ['electron', 'web'] as const;
type Platform = typeof platforms[number];
if (platforms.includes(platform as Platform) == false)
	throw new Error(`Invalid platform: ${platform}`);

const output: Record<Platform, string> = {
	'electron': 'out/electron/static',
	'web': 'out/web',
};

const electronDir = 'screen-recorder-win32-x64';

export default defineConfig(config =>
{
	const { mode, command } = config;
	const bases: Record<Platform, string> = {
		'electron': './',
		'web': mode == 'production' ? '/screen-recorder/' : '/',
	};
	const base = bases[platform];

	const showDownloads = shell.test('-e', join(__dirname, 'out', electronDir));

	return {
		base,
		define: {
			BASE: JSON.stringify(base),
			SHOW_DOWNLOADS: JSON.stringify(showDownloads),
			PLATFORM: JSON.stringify(platform),
			GITHUB_URL: JSON.stringify(pkg.repository.url),
		},
		build: {
			outDir: output[platform],
			assetsInlineLimit: 0, // Prevents FFMPEG worker from being inlined
		},
		server: { headers },
		preview: { headers },
		plugins: [
			svelte({ configFile: 'svelte.config.js' }),
			extractFonts({ command, cacheDir: '.fonts' }),
			showDownloads && platform == 'web' && command == 'build' ?
				electronZip({
					outDir: join(__dirname, 'out'),
					directories: [electronDir],
				}) : null,
		].filter(x => x != null),
	}
});
