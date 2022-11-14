import { app, BrowserWindow, desktopCapturer, ipcMain, session, shell } from 'electron';
import path from 'path';

function createWindow()
{
	const mainWindow = new BrowserWindow({
		show: true,
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
		}
	});

	mainWindow.removeMenu();
	mainWindow.loadFile(path.join(__dirname, '..', 'static', 'index.html'));
	mainWindow.webContents.on('new-window', (e, url) =>
	{
		e.preventDefault();
		shell.openExternal(url);
	});

	ipcMain.on('reload', () => mainWindow.webContents.reload());
	ipcMain.on('openDevTools', () => mainWindow.webContents.openDevTools());

	ipcMain.handle('getSources', async () =>
	{
		const sources = await desktopCapturer.getSources({
			types: ['window', 'screen'],
		});

		const result = sources.map(source => ({
			...source,
			thumbnail: source.thumbnail.toDataURL(),
		}));

		return result;
	});

	return mainWindow;
}

app.whenReady().then(() =>
{
	createWindow();

	app.on('activate', () =>
	{
		if (BrowserWindow.getAllWindows().length === 0)
			createWindow()
	});

	session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
	{
		const csp = [
			// unsafe-eval/blob/data are required for FFMPEG/WebAssembly
			`default-src 'self' 'unsafe-eval' blob: data:`,
			// Svelte transitions used in Carbon (https://github.com/sveltejs/svelte/issues/6662)
			`style-src 'self' 'unsafe-inline'`,
			`style-src-attr 'self' 'unsafe-inline'`,
			`object-src 'none'`,
		];

		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Cross-Origin-Embedder-Policy': 'require-corp',
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Content-Security-Policy': csp.join(';'),
			}
		});
	});
});

app.on('window-all-closed', () =>
{
	if (process.platform !== 'darwin')
		app.quit()
});
