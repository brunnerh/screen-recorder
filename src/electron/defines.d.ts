import type { CaptureSource } from './types';

declare global
{
	function electronGetSources(): Promise<CaptureSource[]>;
}
