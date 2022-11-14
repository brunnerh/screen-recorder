import { createWriteStream, fstat } from 'fs';
import { dirname, join } from 'path';
import { defineConfig, Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import archiver from 'archiver';
import pkg from './package.json';
import shell from 'shelljs';

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

export default defineConfig(config =>
{
	console.log('Command: ', config.command);

	const bases: Record<Platform, string> = {
		'electron': './',
		'web': config.mode == 'production' ? '/screen-recorder/' : '/',
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
			platform == 'web' && config.command == 'build' ? {
				name: 'electron-package',
				async closeBundle()
				{
					try
					{
						const name = 'screen-recorder-win32-x64';
	
						const path = join(__dirname, 'out', 'web', 'desktop', `${name}.zip`);
						shell.mkdir('-p', dirname(path));
						const stream = createWriteStream(path, { flags: 'w' });
						const zip = archiver('zip');
						zip.pipe(stream);
						zip.on('warning', e => console.warn(e));
						zip.on('error', e => { throw e; });
	
						const winDirectory = join(__dirname, 'out', name);
						zip.directory(winDirectory, name);
	
						await new Promise<void>(async (res, rej) =>
						{
							stream.on('close', res);
	
							await zip.finalize();
						}).finally(() => stream.close());
					}
					catch (error)
					{
						console.error('Error while creating electron package', error);
					}
				}
			} : null,
		].filter(x => x != null),
	}
});
