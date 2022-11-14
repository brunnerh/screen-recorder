import { svelte } from '@sveltejs/vite-plugin-svelte';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { dirname, join } from 'path';
import shell from 'shelljs';
import { defineConfig } from 'vite';
import pkg from './package.json';
import { electronZip } from './src/plugins/electron-package';
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

const fonts = new Set<string>();

export default defineConfig(config =>
{
	const { mode, command } = config;
	const bases: Record<Platform, string> = {
		'electron': './',
		'web': mode == 'production' ? '/screen-recorder/' : '/',
	};
	const base = bases[platform];

	return {
		base,
		define: {
			BASE: JSON.stringify(base),
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
			platform == 'web' && command == 'build' ?
				electronZip({ outDir: join(__dirname, 'out')}) : null,
		].filter(x => x != null),
	}
});
