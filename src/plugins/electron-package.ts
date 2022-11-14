import archiver from 'archiver';
import { join } from 'path';
import { Writable } from 'stream';
import type { Plugin } from 'vite';

export interface ElectronZipOptions
{
	outDir: string;
}

export function electronZip(options: ElectronZipOptions): Plugin
{
	const { outDir } = options;

	return {
		name: 'electron-zip',
		async generateBundle()
		{
			try
			{
				const name = 'screen-recorder-win32-x64';
				const buffer = await new Promise<Buffer>(async (res, rej) =>
				{
					const chunks = [];
					const stream = new Writable();
					stream._write = (chunk, encoding, callback) =>
					{
						chunks.push(chunk);
						callback();
					}
					stream.on('finish', () => res(Buffer.concat(chunks)));

					const zip = archiver('zip');
					zip.on('warning', e => console.warn(e));
					zip.on('error', e => rej(e));

					zip.pipe(stream);

					const winDirectory = join(outDir, name);
					zip.directory(winDirectory, name);

					zip.finalize();
				});

				this.emitFile({
					type: 'asset',
					fileName: `desktop/${name}.zip`,
					source: buffer,
				});
			}
			catch (error)
			{
				console.error('Error while creating electron package', error);
			}
		}
	};
}
