import { ipcRenderer, desktopCapturer, contextBridge } from 'electron';

window.addEventListener('keydown', e =>
{
	if (e.key === 'F5')
		ipcRenderer.send('reload');
	if (e.key === 'F12')
		ipcRenderer.send('openDevTools');
});

contextBridge.exposeInMainWorld('electronGetSources', async () =>
{
	return await ipcRenderer.invoke('getSources');
});
