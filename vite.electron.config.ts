import { writeFileSync } from 'fs';
import { join } from 'path';
import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig(config =>
{
	return {
		build: {
			outDir: 'out/electron/app',
			rollupOptions: {
				input: {
					main: 'src/electron/main.ts',
					preload: 'src/electron/preload.ts',
				},
				output: {
					entryFileNames: '[name].cjs',
					format: 'commonjs',
				},
				external: [...builtinModules, 'electron'],
			},
			minify: config.mode == 'production',
		},
		plugins: [
			{
				name: 'electron-package.json',
				closeBundle()
				{
					const path = join(__dirname, 'out', 'electron', 'package.json');
					writeFileSync(
						path,
						JSON.stringify({ main: 'app/main.cjs' }, null, 2)
					);
				},
			}
		],
	}
});
