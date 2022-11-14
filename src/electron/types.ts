export type CaptureSource =
	Omit<Electron.DesktopCapturerSource, 'thumbnail'> &
	{ thumbnail: string };
