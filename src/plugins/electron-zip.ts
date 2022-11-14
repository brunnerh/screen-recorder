import archiver from 'archiver';
import { join } from 'path';
import { Writable } from 'stream';
import type { Plugin } from 'vite';

export interface ElectronZipOptions
{
	/** Directories to ZIP. */
	directories: string[];

	/** Path to output directory. */
	outDir: string;
}

export function electronZip(options: ElectronZipOptions): Plugin
{
	const { outDir, directories } = options;

	return {
		name: 'electron-zip',
		async generateBundle()
		{
			for (const dir of directories)
			{
				try
				{
					const name = 'screen-recorder-win32-x64';
					const winDirectory = join(outDir, name);
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

						const zip = archiver('zip', { zlib: { level: 9 } });
						zip.on('warning', e => console.warn(e));
						zip.on('error', e => rej(e));

						zip.pipe(stream);
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
					console.error('Error while zipping ', dir);
				}
			}
		}
	};
}
